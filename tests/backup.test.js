import test from 'node:test';
import assert from 'node:assert/strict';
import * as initial from '../src/data/initialData.js';
import * as admin from '../src/data/initialAdminData.js';
import { BACKUP_COLLECTIONS, createBackupDocument, prepareBackupRestore } from '../src/utils/backup.js';

function demoState() {
  const stock = initial.INITIAL_STOCK.map(item => ({ ...item, firmId: item.firmId || 'FIRM-001', firmCode: item.firmCode || 'KJJ' }));
  return {
    firms: initial.INITIAL_FIRMS,
    dailyRates: initial.INITIAL_DAILY_RATES,
    stock,
    customers: initial.INITIAL_CUSTOMERS,
    karigars: initial.INITIAL_KARIGARS,
    invoices: initial.INITIAL_INVOICES.map(invoice => ({ ...invoice, firmId: invoice.firmId || 'FIRM-001', firmCode: invoice.firmCode || 'KJJ' })),
    udhaarList: initial.INITIAL_UDHAAR.map(loan => ({ ...loan, firmId: loan.firmId || 'FIRM-001', firmCode: loan.firmCode || 'KJJ' })),
    udhaarRepayments: [{ id: 'REP-101', loanId: 'UDH-002' }],
    stockMovements: stock.map((item, index) => ({ id: `SM-${index + 1}`, stockId: item.id, firmId: item.firmId, firmCode: item.firmCode })),
    generalLedger: [],
    schemes: initial.INITIAL_SCHEMES,
    karigarVouchers: [{ id: 'KV-101', karigarId: 'KAR-001' }],
    schemeEnrollments: [{ id: 'ENR-101', schemeId: 'SCH-001', customerId: 'CUST-001' }],
    expenses: initial.INITIAL_EXPENSES,
    dailyDiary: initial.INITIAL_DAILY_DIARY,
    clients: admin.INITIAL_CLIENTS,
    branches: admin.INITIAL_BRANCHES,
    staffUsers: admin.INITIAL_STAFF,
    catalogueSettings: admin.INITIAL_CATALOGUE_SETTINGS,
    integrations: admin.INITIAL_INTEGRATIONS,
    auditLogs: admin.INITIAL_AUDIT_LOGS,
    activeFirmId: 'FIRM-001',
    activeClientId: 'CLIENT-001',
    activeBranchId: 'BR-001',
  };
}

function legacySnapshot(document) {
  const legacyCollections = [
    'firms', 'dailyRates', 'stock', 'customers', 'karigars', 'invoices', 'udhaarList',
    'udhaarRepayments', 'stockMovements', 'generalLedger', 'schemes', 'expenses',
    'clients', 'branches', 'staffUsers', 'integrations', 'auditLogs',
  ];
  const legacy = { appName: 'Jewellery OS', version: '2.7.364 Pro', exportDate: document.exportedAt };
  for (const collection of legacyCollections) legacy[collection] = document.data[collection];
  legacy.dailyDiary = document.data.dailyDiary;
  legacy.catalogueSettings = document.data.catalogueSettings;
  return legacy;
}

test('versioned demo snapshot round-trips all collections and redactable records', () => {
  const document = createBackupDocument(demoState(), '2026-10-09T05:00:00.000Z');
  const restored = prepareBackupRestore(document);
  assert.equal(document.schemaVersion, 1);
  assert.deepEqual(Object.keys(restored.data).filter(key => BACKUP_COLLECTIONS.includes(key)).sort(), [...BACKUP_COLLECTIONS].sort());
  assert.deepEqual(restored.data.karigarVouchers, [{ id: 'KV-101', karigarId: 'KAR-001' }]);
  assert.deepEqual(restored.data.schemeEnrollments, [{ id: 'ENR-101', schemeId: 'SCH-001', customerId: 'CUST-001' }]);
  assert.ok(restored.data.dailyDiary && !Array.isArray(restored.data.dailyDiary));
  assert.equal('aadhaar' in restored.data.customers[0], false);
  assert.equal('pan' in restored.data.customers[0], false);
  assert.equal('eInvoiceApi' in restored.data.firms[0], false);
  assert.equal('apiKeyMasked' in restored.data.integrations[0], false);
  assert.deepEqual(restored.data, document.data);
});

test('known legacy exports migrate deterministically and fill histories omitted by the old exporter', () => {
  const current = createBackupDocument(demoState(), '2026-10-09T05:00:00.000Z');
  const migrated = prepareBackupRestore(legacySnapshot(current));
  assert.equal(migrated.migratedFromVersion, '2.7.364 Pro');
  assert.deepEqual(migrated.data.karigarVouchers, []);
  assert.deepEqual(migrated.data.schemeEnrollments, []);
  assert.equal(migrated.data.activeFirmId, 'FIRM-001');
  assert.equal(migrated.data.dailyDiary.date, current.data.dailyDiary.date);
});

test('malformed late fields, duplicate ids, and broken references reject before restore preparation', () => {
  const current = createBackupDocument(demoState(), '2026-10-09T05:00:00.000Z');
  const malformed = structuredClone(current);
  malformed.data.dailyDiary = [];
  assert.throws(() => prepareBackupRestore(malformed), /dailyDiary.*object/);
  assert.equal(current.data.stock.length, initial.INITIAL_STOCK.length);

  const duplicate = structuredClone(current);
  duplicate.data.karigarVouchers.push({ ...duplicate.data.karigarVouchers[0] });
  assert.throws(() => prepareBackupRestore(duplicate), /duplicate id/);

  const crossLinked = structuredClone(current);
  crossLinked.data.stockMovements[0].stockId = 'missing-stock';
  assert.throws(() => prepareBackupRestore(crossLinked), /refers to stock/);
});

test('restore scrubs sensitive keys and rejects unsupported versions and prototype keys', () => {
  const current = createBackupDocument(demoState(), '2026-10-09T05:00:00.000Z');
  const injected = structuredClone(current);
  injected.data.customers[0].pan = 'SECRET-PAN';
  injected.data.integrations[0].apiKeyMasked = 'secret-provider-key';
  const prepared = prepareBackupRestore(injected);
  assert.equal('pan' in prepared.data.customers[0], false);
  assert.equal('apiKeyMasked' in prepared.data.integrations[0], false);

  const unsupported = { ...current, schemaVersion: 2 };
  assert.throws(() => prepareBackupRestore(unsupported), /Unsupported backup schema version/);
  const malicious = JSON.parse(JSON.stringify(current));
  Object.defineProperty(malicious.data.stock[0], '__proto__', { value: { polluted: true }, enumerable: true });
  assert.throws(() => prepareBackupRestore(malicious), /prohibited property/);
});
