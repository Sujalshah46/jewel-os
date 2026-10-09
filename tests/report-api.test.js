import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';

const tenantId = '46db5f65-46b1-47c8-aa40-c535b4cce8d9';

async function withReportApi(reportRows, run) {
  let reportQuery;
  const pool = {
    async query(query, values) {
      if (query.includes('FROM membership')) {
        return { rows: [{ tenant_id: tenantId, role: 'OWNER', platform_role: null }], rowCount: 1 };
      }
      reportQuery = { query, values };
      return { rows: reportRows, rowCount: reportRows.length };
    },
  };
  const auth = {
    handler: async () => new Response(null, { status: 404 }),
    api: { async getSession() { return { user: { id: 'operator-1' }, session: { id: 'session-1', expiresAt: new Date(Date.now() + 60_000) } }; } },
  };
  const app = createApp({ auth, pool, config: { appOrigin: 'http://127.0.0.1', authSecret: 'test-secret' } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`, () => reportQuery);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('trial balance API scopes the journal to selected tenant and accepts inclusive date filters', async () => {
  await withReportApi([
    { accountCode: 'CASH', debitPaise: '10000', creditPaise: '0' },
    { accountCode: 'SALES_REVENUE', debitPaise: '0', creditPaise: '10000' },
  ], async (origin, getQuery) => {
    const response = await fetch(`${origin}/api/reports/trial-balance?from=2026-04-01&to=2026-04-30`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    assert.equal(response.status, 200, await response.clone().text());
    const report = await response.json();
    assert.equal(report.isBalanced, true);
    assert.equal(report.totalDebitsPaise, 10000);
    assert.equal(report.totalCreditsPaise, 10000);
    assert.deepEqual(report.period, { from: '2026-04-01', to: '2026-04-30' });
    const query = getQuery();
    assert.equal(query.values[0], tenantId);
    assert.deepEqual(query.values.slice(1), ['2026-04-01', '2026-04-30']);
    assert.match(query.query, /tenant_id = \$1::uuid/);
  });
});

test('trial balance API refuses invalid dates and out-of-balance periods', async () => {
  await withReportApi([
    { accountCode: 'CASH', debitPaise: '10000', creditPaise: '0' },
    { accountCode: 'SALES_REVENUE', debitPaise: '0', creditPaise: '9999' },
  ], async (origin, getQuery) => {
    const invalid = await fetch(`${origin}/api/reports/trial-balance?from=2026-02-29`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    assert.equal(invalid.status, 400);
    assert.equal(getQuery(), undefined);
    const unbalanced = await fetch(`${origin}/api/reports/trial-balance`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    assert.equal(unbalanced.status, 409);
    assert.equal((await unbalanced.json()).error.code, 'LEDGER_OUT_OF_BALANCE');
  });
});
