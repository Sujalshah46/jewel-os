import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationDir = path.join(root, 'db/migrations');
const databaseUrl = process.env.TEST_DATABASE_URL;
const upgradeUrl = process.env.UPGRADE_DATABASE_URL;
function assertSafeLocalDatabase(value, label, suffix) {
  if (!value) throw new Error(`${label} is required; tests will not guess which database is safe to reset.`);
  const url = new URL(value);
  const database = url.pathname.slice(1);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname) || !database.endsWith(suffix)) {
    throw new Error(`${label} must use a loopback host and database name ending ${suffix}. Refusing destructive test setup.`);
  }
}
assertSafeLocalDatabase(databaseUrl, 'TEST_DATABASE_URL', '_test');
assertSafeLocalDatabase(upgradeUrl, 'UPGRADE_DATABASE_URL', '_upgrade_test');

async function resetPublicSchema(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 1 });
  try {
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } finally { await pool.end(); }
}
await resetPublicSchema(databaseUrl);
await resetPublicSchema(upgradeUrl);

execFileSync(process.execPath, [path.join(root, 'node_modules/drizzle-kit/bin.cjs'), 'migrate'], {
  cwd: root,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
});

const upgradePool = new pg.Pool({ connectionString: upgradeUrl, max: 1 });
try {
  const files = (await readdir(migrationDir)).filter(name => /^\d+_.*\.sql$/.test(name)).sort();
  if (files.length < 2) throw new Error('Upgrade test requires an initial and a subsequent migration.');
  const first = await readFile(path.join(migrationDir, files[0]), 'utf8');
  for (const statement of first.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await upgradePool.query(statement);
  const user = await upgradePool.query("INSERT INTO \"user\" (id, name, email) VALUES ('upgrade-fixture', 'Synthetic Fixture', 'upgrade@example.test') RETURNING id");
  const tenant = await upgradePool.query("INSERT INTO tenant (name) VALUES ('Synthetic Upgrade Tenant') RETURNING id");
  const customer = await upgradePool.query("INSERT INTO customer (tenant_id, name, mobile) VALUES ($1, 'Upgrade Customer', '9000000000') RETURNING id", [tenant.rows[0].id]);
  await upgradePool.query("INSERT INTO membership (user_id, tenant_id, role) VALUES ($1, $2, 'OWNER')", [user.rows[0].id, tenant.rows[0].id]);
  for (const migration of files.slice(1)) {
    const later = await readFile(path.join(migrationDir, migration), 'utf8');
    for (const statement of later.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await upgradePool.query(statement);
  }
  const preserved = await upgradePool.query('SELECT name FROM customer WHERE id = $1', [customer.rows[0].id]);
  if (preserved.rows[0]?.name !== 'Upgrade Customer') throw new Error('Existing customer fixture was not preserved by the upgrade migration.');
  const index = await upgradePool.query("SELECT 1 FROM pg_indexes WHERE indexname = 'customer_tenant_updated_at_idx'");
  if (!index.rowCount) throw new Error('The upgrade migration did not add its declared index.');
  const preservedRelations = await upgradePool.query(
    `SELECT (SELECT count(*) FROM "user" WHERE id = $1)::int AS users,
            (SELECT count(*) FROM membership WHERE user_id = $1 AND tenant_id = $2)::int AS memberships`,
    [user.rows[0].id, tenant.rows[0].id],
  );
  if (preservedRelations.rows[0].users !== 1 || preservedRelations.rows[0].memberships !== 1) throw new Error('The upgrade migration did not preserve identity/membership rows.');
  const archiveFields = await upgradePool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'customer' AND column_name = 'archived_reason'");
  if (!archiveFields.rowCount) throw new Error('The final customer archive migration did not apply.');
  console.log('Upgrade migrations preserved synthetic user, membership, tenant, and customer data.');
} finally { await upgradePool.end(); }

console.log('Fresh Drizzle migration and populated-database upgrade fixture passed.');
