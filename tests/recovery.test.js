import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import net from 'node:net';
import { createApp } from '../server/app.js';
import { backupDatabase, restoreDatabase, databaseDigest } from '../scripts/recovery.js';
import { createAuth } from '../server/auth.js';

const source = process.env.TEST_DATABASE_URL, target = process.env.RESTORE_DATABASE_URL;
for (const value of [source, target]) {
  if (!value) throw new Error('Dedicated local TEST_DATABASE_URL and RESTORE_DATABASE_URL required.');
  const url = new URL(value);
  if (!['localhost','127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Recovery test requires disposable loopback *_test databases.');
}
if (new URL(source).pathname === new URL(target).pathname) throw new Error('Recovery must use a different database.');

test('encrypted backup restores exact business records, invalidates sessions and permits fresh authentication', async () => {
  const dir = await mkdtemp(join(tmpdir(),'jewel-recovery-'));
  const keyFile = join(dir,'key'), archivePath = join(dir,'snapshot.dump.enc');
  const pool = new pg.Pool({ connectionString: target, max: 2 });
  const confirmedDatabase = new URL(target).pathname.slice(1);
  try {
    // Only this test-owned destination can be reset by the test harness.
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    const fixture = await seedRecoveryFixture(source);
    await writeFile(keyFile, randomBytes(32).toString('hex'), { mode: 0o600 });
    await backupDatabase({ connectionString: source, keyFile, archivePath });
    assert.equal((await stat(archivePath)).mode & 0o077, 0);
    const encrypted = await readFile(archivePath);
    assert.ok(!encrypted.includes(Buffer.from(fixture.email)));
    await assert.rejects(backupDatabase({ connectionString: source, keyFile, archivePath }), /EEXIST/);
    const options = { connectionString: target, keyFile, archivePath, confirmedDatabase };
    const badKey = join(dir,'wrong-key');
    await writeFile(badKey, randomBytes(32).toString('hex'), { mode: 0o600 });
    await assert.rejects(restoreDatabase({ ...options, keyFile: badKey }), /authentication failed/);
    await writeFile(archivePath, Buffer.concat([encrypted, Buffer.from('corruption')]));
    await assert.rejects(restoreDatabase(options), /checksum failed/);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n, 0);
    await writeFile(archivePath, encrypted);
    assert.deepEqual(await restoreDatabase(options), { reconciled: true, sessionsRevoked: true });
    await assert.rejects(restoreDatabase(options), /not empty/);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM session')).rows[0].n, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM verification')).rows[0].n, 0);
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const manifest = JSON.parse(await readFile(archivePath+'.backup.json','utf8'));
      assert.equal(await databaseDigest(client), manifest.metadata.dataDigest);
      await client.query('COMMIT');
    } finally { client.release(); }
    const balances = await pool.query('SELECT sum(debit_paise)::text AS debit, sum(credit_paise)::text AS credit FROM ledger_entry');
    assert.equal(balances.rows[0].debit, balances.rows[0].credit);
    assert.ok(Number((await pool.query('SELECT count(*)::int AS n FROM invoice')).rows[0].n)>0);
    const auth = createAuth(pool,{authUrl:'http://127.0.0.1:4000',appOrigin:'http://127.0.0.1:4000',authSecret:'synthetic-recovery-test-secret-long-enough',secureCookies:false});
    const signedIn = await auth.api.signInEmail({ body:{email:fixture.email,password:fixture.password} });
    assert.equal(signedIn.user.email,fixture.email);
    assert.equal((await pool.query('SELECT total_paise::text AS total FROM invoice WHERE id=$1', [fixture.invoiceId])).rows[0].total, String(fixture.totalPaise));
  } finally { await pool.end(); await rm(dir,{recursive:true,force:true}); }
});


// Own synthetic fixture: works after migrations on an otherwise empty source,
// without depending on operational-api.test.js records or account ordering.
async function seedRecoveryFixture(connectionString) {
  const sourcePool = new pg.Pool({ connectionString, max: 4 });
  let server;
  try {
    const reservation = net.createServer();
    await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    const config = { appOrigin: origin, authUrl: origin, authSecret: randomBytes(32).toString('hex'), secureCookies: false };
    const auth = createAuth(sourcePool, config, { allowSignUp: true });
    const email = `recovery-${randomUUID()}@example.test`, password = randomBytes(24).toString('hex');
    const signedUp = await auth.api.signUpEmail({ body: { name: 'Synthetic Recovery Owner', email, password } });
    const tenant = (await sourcePool.query("INSERT INTO tenant(name) VALUES('Synthetic Recovery Tenant') RETURNING id")).rows[0].id;
    const branch = (await sourcePool.query("INSERT INTO tenant_branch(tenant_id,name) VALUES($1,'Main') RETURNING id", [tenant])).rows[0].id;
    await sourcePool.query("INSERT INTO membership(user_id,tenant_id,role) VALUES($1,$2,'OWNER')", [signedUp.user.id,tenant]);
    const login = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
    const cookie = login.headers.getSetCookie().find(value => value.startsWith('better-auth.session_token=')).split(';')[0];
    server = createApp({ auth, pool: sourcePool, config }).listen(port, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const headers = { Cookie: cookie, Origin: origin, 'X-Tenant-Id': tenant, 'Content-Type': 'application/json' };
    const workspace = await fetch(`${origin}/api/memberships`, { headers });
    assert.equal(workspace.status,200);
    headers['X-CSRF-Token'] = (await workspace.json()).csrfToken;
    const stock = await fetch(`${origin}/api/stock`, { method:'POST', headers, body:JSON.stringify({
      branchId:branch,itemCode:'RECOVERY-ITEM',barcode:'RECOVERY-BC',description:'Synthetic recovery item',metalType:'Gold',
      grossWeightMg:1000,netWeightMg:1000,purityBps:9167,ratePerGramPaise:100000,
      makingChargeType:'fixed',makingChargeValue:0,makingDiscountBps:0,stoneValuePaise:0,hallmarkChargePaise:0,
      otherChargesPaise:0,itemDiscountPaise:0,gstRateBps:300,quantity:1,reason:'Synthetic recovery fixture',
    }) });
    assert.equal(stock.status,201,await stock.clone().text());
    const item = (await stock.json()).item;
    const sale = await fetch(`${origin}/api/invoices`, { method:'POST', headers:{...headers,'Idempotency-Key':'recovery-fixture-sale'},
      body:JSON.stringify({branchId:branch,items:[{stockItemId:item.id,quantity:1}],payments:{cashPaise:Number(item.catalogPricePaise)}}) });
    assert.equal(sale.status,201,await sale.clone().text());
    const invoice = (await sale.json()).invoice;
    return {email,password,invoiceId:invoice.id,totalPaise:Number(invoice.totalPaise)};
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await sourcePool.end();
  }
}
