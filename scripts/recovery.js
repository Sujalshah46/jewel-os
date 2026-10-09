import pg from 'pg';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

const quote = value => '"' + value.replaceAll('"', '""') + '"';
async function encryptionKey(path) {
  if (!path) throw new Error('BACKUP_KEY_FILE is required (a separate 32-byte hex key).');
  if ((await stat(path)).mode & 0o077) throw new Error('Backup key file must have owner-only permissions.');
  const hex = (await readFile(path, 'utf8')).trim();
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error('Backup key file must contain 32 random bytes encoded as hex.');
  return Buffer.from(hex, 'hex');
}
function pgEnvironment(connectionString) {
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL connection required.');
  // Never put the connection URI or password in command arguments or logs.
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
  for (const [parameter, variable] of [['sslrootcert','PGSSLROOTCERT'],['sslcert','PGSSLCERT'],['sslkey','PGSSLKEY']]) {
    const value = url.searchParams.get(parameter) || process.env[variable];
    if (value) environment[variable] = value;
  }
  return { ...environment, PGHOST: url.hostname, PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get('sslmode') || process.env.PGSSLMODE || 'prefer' };
}
function pgTool(command, args, connectionString) {
  const child = spawn(command, args, { env: pgEnvironment(connectionString), stdio: ['pipe', 'pipe', 'pipe'] });
  // Drain diagnostics without leaking authentication/connection details.
  child.stderr.resume();
  const done = new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error(`${command} could not start.`)));
    child.once('close', code => code === 0 ? resolve() : reject(new Error(`${command} failed (exit ${code}).`)));
  });
  done.catch(() => {});
  return { child, done };
}
async function fileDigest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

// Same repeatable-read snapshot as pg_dump. Hash rows in bounded batches, without
// recording names, credentials, balances or customer records in the manifest.
export async function databaseDigest(client) {
  const tables = await client.query(`SELECT schemaname, tablename FROM pg_tables
    WHERE schemaname IN ('public','drizzle') AND tablename NOT IN ('session','verification','auth_rate_limit')
    ORDER BY schemaname, tablename`);
  const digest = createHash('sha256');
  await client.query("SET LOCAL TIME ZONE 'UTC'");
  for (const table of tables.rows) {
    const name = `${quote(table.schemaname)}.${quote(table.tablename)}`;
    digest.update(name + '\n');
    await client.query(`DECLARE recovery_rows NO SCROLL CURSOR FOR SELECT to_jsonb(t)::text AS row FROM ${name} t ORDER BY to_jsonb(t)::text`);
    try {
      for (;;) {
        const batch = await client.query('FETCH 1000 FROM recovery_rows');
        if (!batch.rowCount) break;
        for (const row of batch.rows) digest.update(row.row + '\n');
      }
    } finally { await client.query('CLOSE recovery_rows'); }
  }
  return digest.digest('hex');
}

export async function backupDatabase({ connectionString, keyFile, archivePath }) {
  const key = await encryptionKey(keyFile);
  const temporary = archivePath + '.' + randomBytes(8).toString('hex') + '.partial';
  // Reserve final names without replacing previous backups.
  await writeFile(archivePath, '', { flag: 'wx', mode: 0o600 });
  let manifestReserved = false;
  const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
  let client;
  try {
    await writeFile(archivePath + '.backup.json', '', { flag: 'wx', mode: 0o600 });
    manifestReserved = true;
    client = await pool.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const { rows } = await client.query('SELECT pg_export_snapshot() AS snapshot');
    const dataDigest = await databaseDigest(client);
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const { child, done } = pgTool('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--snapshot=' + rows[0].snapshot], connectionString);
    child.stdin.end();
    try { await Promise.all([pipeline(child.stdout, cipher, createWriteStream(temporary, { flags: 'wx', mode: 0o600 })), done]); }
    catch (error) { child.kill(); throw error; }
    await client.query('COMMIT');
    const metadata = { version: 1, createdAt: new Date().toISOString(), algorithm: 'aes-256-gcm',
      iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), archiveSha256: await fileDigest(temporary), dataDigest };
    const hmac = createHmac('sha256', key).update(JSON.stringify(metadata)).digest('hex');
    await rename(temporary, archivePath);
    await writeFile(archivePath + '.backup.json', JSON.stringify({ metadata, hmac }) + '\n', { mode: 0o600 });
    return { verifiedSnapshot: true, createdAt: metadata.createdAt };
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    await rm(archivePath, { force: true });
    if (manifestReserved) await rm(archivePath + '.backup.json', { force: true });
    throw error;
  } finally {
    await rm(temporary, { force: true });
    client?.release(); await pool.end();
  }
}

export async function restoreDatabase({ connectionString, keyFile, archivePath, confirmedDatabase }) {
  const target = new URL(connectionString);
  if (!confirmedDatabase || decodeURIComponent(target.pathname.slice(1)) !== confirmedDatabase) throw new Error('Explicit RESTORE_CONFIRM_DATABASE must match the empty target.');
  const key = await encryptionKey(keyFile);
  const { metadata, hmac } = JSON.parse(await readFile(archivePath + '.backup.json', 'utf8'));
  const expected = createHmac('sha256', key).update(JSON.stringify(metadata)).digest();
  const actual = Buffer.from(hmac || '', 'hex');
  if (metadata?.version !== 1 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Backup manifest authentication failed.');
  if (await fileDigest(archivePath) !== metadata.archiveSha256) throw new Error('Backup archive checksum failed.');
  const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
  let client;
  try {
    client = await pool.connect();
    const existing = await client.query("SELECT 1 FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') LIMIT 1");
    if (existing.rowCount) throw new Error('Restore target is not empty. Existing records will not be overwritten.');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(metadata.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(metadata.tag, 'hex'));
    const { child, done } = pgTool('pg_restore', ['--single-transaction', '--exit-on-error', '--no-owner', '--no-acl', '--dbname=' + confirmedDatabase], connectionString);
    child.stdout.resume();
    try { await Promise.all([pipeline(createReadStream(archivePath), decipher, child.stdin), done]); }
    catch (error) { child.kill(); throw error; }
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    if (await databaseDigest(client) !== metadata.dataDigest) throw new Error('Restored records do not match the backup snapshot. Do not activate this database.');
    // A backup must not revive a session or reset token revoked after it was taken.
    await client.query('DELETE FROM session; DELETE FROM verification; DELETE FROM auth_rate_limit;');
    await client.query('COMMIT');
    return { reconciled: true, sessionsRevoked: true };
  } catch (error) { if (client) await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { client?.release(); await pool.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [action, archivePath] = process.argv.slice(2);
    if (!archivePath || !['backup','restore'].includes(action)) throw new Error('Usage: node scripts/recovery.js backup|restore /secure/path/archive.dump.enc');
    const result = action === 'backup'
      ? await backupDatabase({ connectionString: process.env.DATABASE_URL, keyFile: process.env.BACKUP_KEY_FILE, archivePath })
      : await restoreDatabase({ connectionString: process.env.RESTORE_DATABASE_URL, keyFile: process.env.BACKUP_KEY_FILE, archivePath, confirmedDatabase: process.env.RESTORE_CONFIRM_DATABASE });
    console.log(JSON.stringify(result));
  } catch { console.error('Recovery operation failed. Source records were not modified; do not activate an unverified restore. Check configuration, archive/key access and the isolated target.'); process.exitCode = 1; }
}
