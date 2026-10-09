import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import pg from 'pg';
import { createApp } from '../server/app.js';
import { createAuth } from '../server/auth.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error('Set TEST_DATABASE_URL to a dedicated local *_test database.');
const pool = new pg.Pool({ connectionString: databaseUrl, max: 8 });
let server;
let origin;
let auth;
let tenantA;
let tenantB;
let tenantDisabled;
let branchA;
let branchB;
let owner;
let cashier;
let ownerCookie;
let cashierCookie;
let ownerCsrf;
let cashierCsrf;
let ownerCustomer;

async function reservePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
  const { port } = listener.address();
  await new Promise(resolve => listener.close(resolve));
  return port;
}

function cookieFrom(response) {
  const setCookie = response.headers.getSetCookie?.() || [];
  const token = setCookie.find(value => value.startsWith('better-auth.session_token='));
  assert.ok(token, 'auth response should issue an HTTP-only session cookie');
  assert.match(token, /HttpOnly/i);
  return token.split(';', 1)[0];
}

async function signUp(name, email) {
  const response = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'synthetic-only-password-123' }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const cookie = cookieFrom(response);
  const body = await response.json();
  return { user: body.user, cookie };
}

async function request(path, { cookie, tenantId, csrfToken, originHeader = origin, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set('Cookie', cookie);
  if (tenantId) headers.set('X-Tenant-Id', tenantId);
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  if (originHeader) headers.set('Origin', originHeader);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(`${origin}${path}`, { ...options, headers });
}

async function createApiStock(itemCode, quantity = 1) {
  const response = await request('/api/stock', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({
      branchId: branchA, itemCode, barcode: `${itemCode}-BC`, description: `Synthetic ${itemCode}`, metalType: 'Gold',
      grossWeightMg: 8000, netWeightMg: 7900, purityBps: 9167, ratePerGramPaise: 660024,
      makingChargeType: 'per_gram', makingChargeValue: 50000, makingDiscountBps: 0,
      stoneValuePaise: 0, hallmarkChargePaise: 4500, otherChargesPaise: 0, itemDiscountPaise: 0, gstRateBps: 300,
      quantity, reason: 'Synthetic test receipt',
    }),
  });
  assert.equal(response.status, 201, await response.clone().text());
  return (await response.json()).item;
}

before(async () => {
  await pool.query('SELECT 1');
  const tenantResult = await pool.query("INSERT INTO tenant (name) VALUES ('Tenant A'), ('Tenant B'), ('Disabled Tenant') RETURNING id, name");
  tenantA = tenantResult.rows.find(item => item.name === 'Tenant A').id;
  tenantB = tenantResult.rows.find(item => item.name === 'Tenant B').id;
  tenantDisabled = tenantResult.rows.find(item => item.name === 'Disabled Tenant').id;
  const branchResult = await pool.query(
    "INSERT INTO tenant_branch (tenant_id, name) VALUES ($1, 'Main'), ($2, 'Main') RETURNING id, tenant_id",
    [tenantA, tenantB],
  );
  branchA = branchResult.rows.find(item => item.tenant_id === tenantA).id;
  branchB = branchResult.rows.find(item => item.tenant_id === tenantB).id;
  const port = await reservePort();
  origin = `http://127.0.0.1:${port}`;
  const config = { appOrigin: origin, authUrl: origin, authSecret: 'synthetic-test-secret-that-is-not-used-outside-tests', secureCookies: false };
  auth = createAuth(pool, config, { allowSignUp: true });
  const app = createApp({ auth, pool, config });
  server = app.listen(port, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });

  owner = await signUp('Synthetic Owner', 'owner@example.test');
  cashier = await signUp('Synthetic Cashier', 'cashier@example.test');
  await pool.query("INSERT INTO membership (user_id, tenant_id, role) VALUES ($1, $2, 'OWNER'), ($1, $3, 'OWNER')", [owner.user.id, tenantA, tenantB]);
  await pool.query("INSERT INTO membership (user_id, tenant_id, role) VALUES ($1, $2, 'CASHIER'), ($1, $3, 'OWNER')", [cashier.user.id, tenantA, tenantDisabled]);
  await pool.query("UPDATE membership SET enabled = false WHERE user_id = $1 AND tenant_id = $2", [cashier.user.id, tenantDisabled]);
  ownerCookie = owner.cookie;
  cashierCookie = cashier.cookie;
  ownerCsrf = (await (await request('/api/memberships', { cookie: ownerCookie })).json()).csrfToken;
  cashierCsrf = (await (await request('/api/memberships', { cookie: cashierCookie })).json()).csrfToken;
  const bCustomer = await pool.query("INSERT INTO customer (tenant_id, name, mobile) VALUES ($1, 'Tenant B Private Customer', '9000000001') RETURNING id", [tenantB]);
  ownerCustomer = bCustomer.rows[0].id;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
});

test('anonymous access is denied and memberships come only from active server membership rows', async () => {
  const denied = await request('/api/customers', { tenantId: tenantA });
  assert.equal(denied.status, 401);
  const memberships = await request('/api/memberships', { cookie: cashierCookie });
  assert.equal(memberships.status, 200);
  assert.deepEqual((await memberships.json()).memberships.map(m => m.tenantId), [tenantA]);
  assert.equal((await request('/api/customers', { cookie: cashierCookie, tenantId: tenantB })).status, 403);
});

test('unsupported operational workflows fail closed at the API boundary', async () => {
  for (const path of ['/api/returns', '/api/purchases', '/api/transfers', '/api/repayments', '/api/schemes', '/api/integrations']) {
    const response = await request(path, { cookie: ownerCookie, tenantId: tenantA });
    assert.equal(response.status, 404, `${path} must remain unavailable in operational mode`);
    assert.equal((await response.json()).error.code, 'FEATURE_UNAVAILABLE');
  }
});

test('tenant customer listing, stable IDs, create and update use the server-selected tenant', async () => {
  const created = await request('/api/customers', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({ name: 'Tenant A Customer', mobile: '9000000002', email: 'a@example.test', city: 'Pune' }),
  });
  assert.equal(created.status, 201, await created.clone().text());
  const { customer } = await created.json();
  assert.match(customer.id, /^[0-9a-f-]{36}$/i);
  assert.equal(customer.tenantId, tenantA);
  assert.equal('apiKey' in customer, false);
  const listA = await request('/api/customers?page=1&pageSize=10', { cookie: ownerCookie, tenantId: tenantA });
  assert.equal(listA.status, 200);
  assert.deepEqual((await listA.json()).items.map(item => item.id), [customer.id]);
  const ownRead = await request(`/api/customers/${customer.id}`, { cookie: ownerCookie, tenantId: tenantA });
  assert.equal(ownRead.status, 200);
  const update = await request(`/api/customers/${customer.id}`, {
    method: 'PATCH', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({ city: 'Mumbai' }),
  });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).customer.city, 'Mumbai');
  const listB = await request('/api/customers', { cookie: ownerCookie, tenantId: tenantB });
  assert.equal(listB.status, 200);
  assert.equal((await listB.json()).items[0].name, 'Tenant B Private Customer');
});

test('guessed cross-tenant IDs, filters, nested references and mass assignment are rejected', async () => {
  assert.equal((await request(`/api/customers/${ownerCustomer}`, { cookie: ownerCookie, tenantId: tenantA })).status, 404);
  assert.equal((await request(`/api/customers/${ownerCustomer}`, {
    method: 'PATCH', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, body: JSON.stringify({ name: 'Stolen' }),
  })).status, 404);
  assert.equal((await request('/api/customers?tenantId=' + tenantB, { cookie: ownerCookie, tenantId: tenantA })).status, 400);
  assert.equal((await request('/api/customers?pageSize=101', { cookie: ownerCookie, tenantId: tenantA })).status, 400);
  assert.equal((await request('/api/customers?page=0', { cookie: ownerCookie, tenantId: tenantA })).status, 400);
  assert.equal((await request('/api/customers?page=100001', { cookie: ownerCookie, tenantId: tenantA })).status, 400);
  const nested = await request('/api/customers', { method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, body: JSON.stringify({ name: 'Nested', mobile: '9000000003', customer: { tenantId: tenantB } }) });
  assert.equal(nested.status, 400);
  const mass = await request('/api/customers', { method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, body: JSON.stringify({ name: 'Mass', mobile: '9000000004', tenantId: tenantB, status: 'OWNER', role: 'OWNER', approved: true }) });
  assert.equal(mass.status, 400);
});

test('cashier cannot use owner action even with a valid customer and same-origin request', async () => {
  const seeded = await pool.query("INSERT INTO customer (tenant_id, name, mobile) VALUES ($1, 'Cashier Test', '9000000005') RETURNING id", [tenantA]);
  const result = await request(`/api/customers/${seeded.rows[0].id}/archive`, {
    method: 'POST', cookie: cashierCookie, tenantId: tenantA, csrfToken: cashierCsrf, body: JSON.stringify({ reason: 'No permission' }),
  });
  assert.equal(result.status, 403);
  assert.equal((await pool.query('SELECT archived FROM customer WHERE id = $1', [seeded.rows[0].id])).rows[0].archived, false);
});

test('tenant owner can archive within the tenant and the action is attributed', async () => {
  const seeded = await pool.query("INSERT INTO customer (tenant_id, name, mobile) VALUES ($1, 'Owner Archive Test', '9000000007') RETURNING id", [tenantA]);
  const result = await request(`/api/customers/${seeded.rows[0].id}/archive`, {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({ reason: 'Synthetic retention test' }),
  });
  assert.equal(result.status, 204);
  const archived = await pool.query('SELECT archived, archived_by, archived_reason FROM customer WHERE id = $1', [seeded.rows[0].id]);
  assert.equal(archived.rows[0].archived, true);
  assert.equal(archived.rows[0].archived_by, owner.user.id);
  assert.equal(archived.rows[0].archived_reason, 'Synthetic retention test');
});

test('stock branches, item identity, and movement history are tenant-scoped', async () => {
  assert.equal((await request('/api/stock', { tenantId: tenantA })).status, 401);
  const created = await request('/api/stock', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({
      branchId: branchA, itemCode: 'RING-100', barcode: 'BC-100', description: 'Synthetic ring', metalType: 'Gold',
      grossWeightMg: 2500, netWeightMg: 2300, purityBps: 9167, ratePerGramPaise: 650000,
      makingChargeType: 'per_gram', makingChargeValue: 10000, gstRateBps: 0, hallmarkChargePaise: 0,
      quantity: 2,
      reason: 'Synthetic opening receipt',
    }),
  });
  assert.equal(created.status, 201, await created.clone().text());
  const { item } = await created.json();
  assert.equal(item.tenantId, tenantA);
  assert.equal(item.quantityAvailable, 2);
  assert.equal(item.quote.totalPricePaise, 1520000);
  assert.equal(item.quote.cgstPaise + item.quote.sgstPaise, 0);
  assert.equal((await request('/api/stock', { cookie: ownerCookie, tenantId: tenantA })).status, 200);
  const tenantBItems = await (await request('/api/stock', { cookie: ownerCookie, tenantId: tenantB })).json();
  assert.equal(tenantBItems.total, 0);
  assert.equal((await request(`/api/stock/${item.id}`, { cookie: ownerCookie, tenantId: tenantB })).status, 404);
  const movements = await (await request(`/api/stock/${item.id}/movements`, { cookie: ownerCookie, tenantId: tenantA })).json();
  assert.equal(movements.total, 1);
  assert.equal(movements.items[0].movementType, 'RECEIPT');
  assert.equal(movements.items[0].actorUserId, owner.user.id);

  const forgedBranch = await request('/api/stock', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({
      branchId: branchB, itemCode: 'FORGED-1', description: 'Cross-tenant branch', metalType: 'Gold',
      grossWeightMg: 1000, netWeightMg: 900, purityBps: 9167, ratePerGramPaise: 650000,
      makingChargeType: 'fixed', makingChargeValue: 0, quantity: 1,
      reason: 'Synthetic cross tenant test',
    }),
  });
  assert.equal(forgedBranch.status, 400);
  const cashierCreate = await request('/api/stock', {
    method: 'POST', cookie: cashierCookie, tenantId: tenantA, csrfToken: cashierCsrf,
    body: JSON.stringify({
      branchId: branchA, itemCode: 'CASHIER-1', description: 'Unauthorized item', metalType: 'Gold',
      grossWeightMg: 1000, netWeightMg: 900, purityBps: 9167, ratePerGramPaise: 650000,
      makingChargeType: 'fixed', makingChargeValue: 0, quantity: 1,
      reason: 'Synthetic forbidden create',
    }),
  });
  assert.equal(cashierCreate.status, 403);
});

test('concurrent stock adjustments use optimistic quantity checks and atomic movement rows', async () => {
  const seeded = await pool.query(
    `INSERT INTO stock_item (tenant_id, branch_id, item_code, description, metal_type, gross_weight_mg, net_weight_mg, purity_bps, rate_per_gram_paise, making_charge_type, making_charge_value, quantity_available, catalog_price_paise)
     VALUES ($1, $2, 'RING-ADJUST', 'Synthetic adjustment item', 'Gold', 1000, 900, 9167, 650000, 'fixed', 0, 2, 100) RETURNING id`,
    [tenantA, branchA],
  );
  await pool.query(
    `INSERT INTO stock_movement (tenant_id, stock_item_id, movement_type, quantity_delta, reason, actor_user_id)
     VALUES ($1, $2, 'RECEIPT', 2, 'Synthetic test receipt', $3)`,
    [tenantA, seeded.rows[0].id, owner.user.id],
  );
  const adjust = () => request(`/api/stock/${seeded.rows[0].id}/adjustments`, {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    body: JSON.stringify({ expectedQuantity: 2, quantityDelta: -1, reason: 'Synthetic count adjustment' }),
  });
  const outcomes = await Promise.all([adjust(), adjust()]);
  assert.deepEqual(outcomes.map(response => response.status).sort(), [200, 409]);
  const item = await pool.query('SELECT quantity_available FROM stock_item WHERE id = $1', [seeded.rows[0].id]);
  assert.equal(item.rows[0].quantity_available, 1);
  const movementCount = await pool.query('SELECT COUNT(*)::int AS total FROM stock_movement WHERE stock_item_id = $1', [seeded.rows[0].id]);
  assert.equal(movementCount.rows[0].total, 2);
});

test('sale finalization recalculates prices, posts balanced entries, snapshots documents, and replays idempotently', async () => {
  const stock = await createApiStock('SALE-ATOMIC-1');
  const cashPaise = Number(stock.catalogPricePaise);
  const common = {
    branchId: branchA,
    items: [{ stockItemId: stock.id, quantity: 1 }],
    payments: { cashPaise },
  };
  const forged = await request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    headers: { 'Idempotency-Key': 'sale-forged-total-001' },
    body: JSON.stringify({ ...common, totalPaise: 1, status: 'PAID', tenantId: tenantB }),
  });
  assert.equal(forged.status, 400);
  assert.equal((await pool.query('SELECT quantity_available FROM stock_item WHERE id = $1', [stock.id])).rows[0].quantity_available, 1);

  const headers = { 'Idempotency-Key': 'sale-atomic-key-001' };
  const created = await request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, headers,
    body: JSON.stringify(common),
  });
  assert.equal(created.status, 201, await created.clone().text());
  const result = await created.json();
  const invoice = result.invoice;
  assert.equal(result.replayed, false);
  assert.equal(invoice.issuerName, 'Tenant A');
  assert.match(invoice.documentNumber, /^INV\/\d{2}-\d{2}\/\d{6}$/);
  assert.equal(Number(invoice.totalPaise), cashPaise);
  assert.equal(Number(invoice.outstandingPaise), 0);
  assert.equal(invoice.lines.length, 1);
  assert.equal(invoice.lines[0].itemCode, 'SALE-ATOMIC-1');
  assert.equal(Number(invoice.lines[0].totalPaise), cashPaise);

  const entries = await pool.query('SELECT SUM(debit_paise)::bigint AS debits, SUM(credit_paise)::bigint AS credits FROM ledger_entry WHERE invoice_id = $1', [invoice.id]);
  assert.equal(Number(entries.rows[0].debits), cashPaise);
  assert.equal(Number(entries.rows[0].credits), cashPaise);
  assert.equal((await pool.query('SELECT quantity_available FROM stock_item WHERE id = $1', [stock.id])).rows[0].quantity_available, 0);
  assert.equal((await pool.query("SELECT COUNT(*)::int AS total FROM stock_movement WHERE stock_item_id = $1 AND movement_type = 'SALE'", [stock.id])).rows[0].total, 1);

  const replay = await request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, headers,
    body: JSON.stringify(common),
  });
  assert.equal(replay.status, 200);
  const replayBody = await replay.json();
  assert.equal(replayBody.replayed, true);
  assert.equal(replayBody.invoice.id, invoice.id);
  const changedReplay = await request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, headers,
    body: JSON.stringify({ ...common, payments: { cashPaise: cashPaise - 1 } }),
  });
  assert.equal(changedReplay.status, 409);
  assert.equal((await request(`/api/invoices/${invoice.id}`, { cookie: ownerCookie, tenantId: tenantB })).status, 404);
});

test('old-metal exchange posts a receipt and balanced scrap asset; pending bank transfer stays outstanding', async () => {
  const stock = await createApiStock('SALE-EXCHANGE-1');
  const totalPaise = Number(stock.catalogPricePaise);
  const oldMetal = {
    metalType: 'Gold', grossWeightMg: 5000, lessWeightMg: 500, purityBps: 8200,
    baseRatePaisePerGram: 720000, deductionPaisePerGram: 10000,
  };
  const exchangeValue = 2611800;
  const invoiceResponse = await request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    headers: { 'Idempotency-Key': 'sale-exchange-key-01' },
    body: JSON.stringify({ branchId: branchA, items: [{ stockItemId: stock.id, quantity: 1 }], payments: { cashPaise: totalPaise - exchangeValue, oldMetal } }),
  });
  assert.equal(invoiceResponse.status, 201, await invoiceResponse.clone().text());
  const exchangeInvoice = (await invoiceResponse.json()).invoice;
  assert.equal(Number(exchangeInvoice.outstandingPaise), 0);
  assert.equal((await pool.query('SELECT valuation_paise FROM old_metal_receipt WHERE invoice_id = $1', [exchangeInvoice.id])).rows[0].valuation_paise, String(exchangeValue));
  const scrapDebit = await pool.query("SELECT debit_paise FROM ledger_entry WHERE invoice_id = $1 AND account_code = 'SCRAP_METAL'", [exchangeInvoice.id]);
  assert.equal(scrapDebit.rows[0].debit_paise, String(exchangeValue));

  const creditStock = await createApiStock('SALE-BANK-PENDING-1');
  const customer = await pool.query("INSERT INTO customer (tenant_id, name, mobile) VALUES ($1, 'Synthetic Sale Customer', '9000000098') RETURNING id", [tenantA]);
  const bankPending = await request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    headers: { 'Idempotency-Key': 'sale-bank-pending-01' },
    body: JSON.stringify({
      branchId: branchA, customerId: customer.rows[0].id, items: [{ stockItemId: creditStock.id, quantity: 1 }],
      payments: { bankPendingPaise: 1000 },
    }),
  });
  assert.equal(bankPending.status, 201, await bankPending.clone().text());
  const pendingInvoice = (await bankPending.json()).invoice;
  assert.equal(Number(pendingInvoice.outstandingPaise), totalPaise);
  assert.equal(pendingInvoice.payments[0].method, 'BANK_PENDING');
  assert.equal(pendingInvoice.payments[0].status, 'PENDING');
  assert.equal((await pool.query('SELECT COUNT(*)::int AS total FROM ledger_entry WHERE invoice_id = $1 AND account_code = \'CASH\'', [pendingInvoice.id])).rows[0].total, 0);
});

test('parallel sales of the last unit yield one complete invoice and no partial state', async () => {
  const stock = await createApiStock('SALE-RACE-1');
  const cashPaise = Number(stock.catalogPricePaise);
  const send = key => request('/api/invoices', {
    method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf,
    headers: { 'Idempotency-Key': key },
    body: JSON.stringify({ branchId: branchA, items: [{ stockItemId: stock.id, quantity: 1 }], payments: { cashPaise } }),
  });
  const responses = await Promise.all([send('sale-race-key-001'), send('sale-race-key-002')]);
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
  const state = await pool.query(
    `SELECT (SELECT COUNT(*)::int FROM invoice_line WHERE stock_item_id = $1) AS lines,
            (SELECT quantity_available FROM stock_item WHERE id = $1) AS quantity,
            (SELECT COUNT(*)::int FROM ledger_entry WHERE invoice_id IN (SELECT invoice_id FROM invoice_line WHERE stock_item_id = $1)) AS entries`,
    [stock.id],
  );
  assert.equal(state.rows[0].lines, 1);
  assert.equal(state.rows[0].quantity, 0);
  assert.ok(state.rows[0].entries > 0);
});

test('cookie writes reject missing and hostile Origin headers', async () => {
  const payload = JSON.stringify({ name: 'CSRF', mobile: '9000000006' });
  assert.equal((await request('/api/customers', { method: 'POST', cookie: ownerCookie, tenantId: tenantA, originHeader: '', body: payload })).status, 403);
  assert.equal((await request('/api/customers', { method: 'POST', cookie: ownerCookie, tenantId: tenantA, csrfToken: ownerCsrf, originHeader: 'https://attacker.invalid', body: payload })).status, 403);
  assert.equal((await request('/api/customers', { method: 'POST', cookie: cashierCookie, tenantId: tenantA, csrfToken: ownerCsrf, body: payload })).status, 403);
});

test('disabled membership and expired or revoked sessions cannot access customers', async () => {
  await pool.query('UPDATE membership SET enabled = false WHERE user_id = $1 AND tenant_id = $2', [cashier.user.id, tenantA]);
  assert.equal((await request('/api/customers', { cookie: cashierCookie, tenantId: tenantA })).status, 403);

  const ownerSession = await pool.query('SELECT id FROM session WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [owner.user.id]);
  await pool.query('UPDATE session SET expires_at = NOW() - INTERVAL \'1 minute\' WHERE id = $1', [ownerSession.rows[0].id]);
  assert.equal((await request('/api/customers', { cookie: ownerCookie, tenantId: tenantA })).status, 401);

  const signin = await request('/api/auth/sign-in/email', {
    method: 'POST', body: JSON.stringify({ email: 'owner@example.test', password: 'synthetic-only-password-123' }),
  });
  assert.equal(signin.status, 200, await signin.clone().text());
  const freshCookie = cookieFrom(signin);
  const signout = await request('/api/auth/sign-out', { method: 'POST', cookie: freshCookie });
  assert.equal(signout.status, 200);
  assert.equal((await request('/api/customers', { cookie: freshCookie, tenantId: tenantA })).status, 401);
});

test('operational auth configuration does not expose public account creation', async () => {
  const port = await reservePort();
  const restrictedOrigin = `http://127.0.0.1:${port}`;
  const config = { appOrigin: restrictedOrigin, authUrl: restrictedOrigin, authSecret: 'synthetic-test-secret-that-is-not-used-outside-tests', secureCookies: false };
  const restrictedAuth = createAuth(pool, config);
  const restrictedServer = createApp({ auth: restrictedAuth, pool, config }).listen(port, '127.0.0.1');
  await new Promise((resolve, reject) => { restrictedServer.once('listening', resolve); restrictedServer.once('error', reject); });
  try {
    const response = await fetch(`${restrictedOrigin}/api/auth/sign-up/email`, {
      method: 'POST', headers: { Origin: restrictedOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Forbidden', email: 'public-signup@example.test', password: 'synthetic-only-password-123' }),
    });
    assert.ok(response.status >= 400, `public sign-up must be rejected, got HTTP ${response.status}`);
  } finally { await new Promise(resolve => restrictedServer.close(resolve)); }
});
