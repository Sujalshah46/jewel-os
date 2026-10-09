import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp } from '../server/app.js';

test('unimplemented operational workflows return an explicit unavailable response', async () => {
  const app = createApp({
    auth: { handler: async () => new Response(null, { status: 404 }) },
    pool: {},
    config: { appOrigin: 'http://127.0.0.1', authSecret: 'unit-test-secret' },
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const { port } = server.address();
    const paths = [
      '/api/returns', '/api/purchases', '/api/transfers', '/api/repayments', '/api/schemes', '/api/integrations',
      '/api/stock-transfers', '/api/supplier-purchases', '/api/invoices/00000000-0000-4000-8000-000000000001/returns',
      '/api/tag-labels', '/api/girvi', '/api/karigar-vouchers',
    ];
    for (const path of paths) {
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
          method,
          ...(method === 'GET' ? {} : { headers: { 'Content-Type': 'application/json' }, body: '{}' }),
        });
        assert.equal(response.status, 404, `${method} ${path} must stay disabled`);
        assert.equal((await response.json()).error.code, 'FEATURE_UNAVAILABLE');
      }
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('operational UI discloses optional lifecycle and tag features remain unavailable', async () => {
  const app = await readFile(new URL('../src/OperationalApp.jsx', import.meta.url), 'utf8');
  assert.match(app, /transfers, purchases, returns, accounting, rates, tag\/RFID tools, schemes, Girvi, karigar/);
  assert.doesNotMatch(app, /TagGeneratorModule|SchemeModule|UdhaarLoanModule|KarigarModule/);
});

test('demo rates, tag previews, and item-code entry do not claim unverified sources or hardware', async () => {
  const [tags, rates, messaging, billing] = await Promise.all([
    readFile(new URL('../src/components/modules/TagGeneratorModule.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/modules/DailyRatesModule.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/modules/SmsWhatsappModule.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/modules/BillingModule.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(tags, /Demo print layout only/);
  assert.doesNotMatch(tags, /BIS CERTIFIED|Compatible with TSC|PRINT TAG LABELS|SCAN POS/);
  assert.match(rates, /not official or provider-verified/);
  assert.doesNotMatch(rates, /OFFICIAL GOVERNMENT BIS CERTIFIED RATES/);
  assert.match(messaging, /SYNTHETIC DEMO DATA • NOT OFFICIAL OR BIS CERTIFIED/);
  assert.doesNotMatch(messaging, /BIS HALLMARK CERTIFIED • OFFICIAL DAILY BULLION RATE BOARD/);
  assert.match(billing, /Type an item code and press Enter/);
  assert.doesNotMatch(billing, /Barcode \/ RFID Fast Scanner Input/);
  assert.doesNotMatch(billing, /Scan a barcode above|placeholder="Scan barcode/);
});
