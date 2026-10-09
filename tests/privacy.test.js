import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { INITIAL_CUSTOMERS, INITIAL_FIRMS } from '../src/data/initialData.js';
import { INITIAL_INTEGRATIONS } from '../src/data/initialAdminData.js';

test('fresh demo party seeds omit personal identity, birth date, and profile photos', () => {
  assert.ok(INITIAL_CUSTOMERS.length > 0);
  for (const party of INITIAL_CUSTOMERS) {
    for (const field of ['pan', 'aadhaar', 'dob', 'photo']) assert.equal(field in party, false, `${party.id} has ${field}`);
  }
  for (const supplier of INITIAL_CUSTOMERS.filter(party => party.userType === 'Supplier')) {
    assert.match(supplier.gstin, /^[0-9A-Z]{15}$/);
  }
  for (const firm of INITIAL_FIRMS) assert.equal('eInvoiceApi' in firm, false, `${firm.id} has provider configuration`);
  for (const integration of INITIAL_INTEGRATIONS) {
    assert.equal('apiKeyMasked' in integration, false, `${integration.id} has a mock credential`);
    assert.equal(integration.status, 'Not configured');
  }
});

test('party UI contains no KYC entry, display, or search paths and discloses demo limitation', async () => {
  const [parties, admin] = await Promise.all([
    readFile(new URL('../src/components/modules/CustomerModule.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/AdminCustomersTab.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(parties, /PAN\/Aadhaar collection and display are disabled/);
  assert.doesNotMatch(parties, /newCust\.(pan|aadhaar)|cust\.(pan|aadhaar)|aadhaar:|pan:/i);
  assert.match(parties, /newCust\.gstin/);
  assert.doesNotMatch(admin, /maskSensitiveKyc|Mask Sensitive PAN/);
  assert.match(admin, /Existing browser values are retained locally and redacted from snapshot exports/);
});

test('demo integration checks never claim provider connectivity', async () => {
  const [context, screen] = await Promise.all([
    readFile(new URL('../src/context/JewelleryContext.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/AdminIntegrationsTab.jsx', import.meta.url), 'utf8'),
  ]);
  const check = context.slice(context.indexOf('const testIntegrationConnection'), context.indexOf('const updateIntegration'));
  assert.match(check, /no provider request or connectivity check was performed/i);
  assert.doesNotMatch(check, /HTTP 200 OK|status: 'Connected'|handshake successful/i);
  assert.match(screen, /Provider health:/);
  assert.match(screen, /Not checked/);
});
