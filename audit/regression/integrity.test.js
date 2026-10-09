import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateJewelleryItem } from '../../src/utils/calculations.js';
import { snapshotIssuer, invoiceSettlement, invoiceJournal } from '../../src/utils/invoices.js';
import { createBackup, validateBackup, restoreDemoBackup, loadDemoBackup, COLLECTIONS, DEMO_STORAGE_KEY } from '../../src/utils/backup.js';
import { isDemoMode } from '../../src/utils/appMode.js';

const zeroCharges = { grossWeight: 1, lessWeight: 0, ratePerGram: 56186.9, makingChargeValue: 0, hallmarkCharge: 0 };
function fixture() {
  const state = Object.fromEntries(COLLECTIONS.map(name => [name, []]));
  return createBackup({ ...state,
    firms: [{ id: 'f', code: 'F', name: 'Synthetic firm' }],
    clients: [{ id: 'c', enabledModules: [], linkedFirmIds: ['f'] }],
    branches: [{ id: 'b', firmId: 'f' }],
    customers: [{ id: 'u', firmId: 'f' }],
    karigars: [{ id: 'k' }], schemes: [{ id: 's' }],
    schemeEnrollments: [{ id: 'e', schemeId: 's', customerId: 'u' }],
    karigarVouchers: [{ id: 'v', karigarId: 'k' }],
    udhaarList: [{ id: 'l', firmId: 'f', customerId: 'u' }],
    udhaarRepayments: [{ id: 'r', loanId: 'l', amount: 1 }],
    stockMovements: [{ id: 'm', type: 'OPENING' }],
    generalLedger: [{ id: 'j', debits: [{ account: 'Cash', amount: 1 }], credits: [{ account: 'Debt', amount: 1 }] }],
    dailyDiary: { todaySellTotal: 0, todaySellDetails: [] },
    catalogueSettings: { categories: [], metalPurities: [], weightUnits: [], makingChargeMethods: [] },
    activeFirmId: 'f', activeClientId: 'c', activeBranchId: 'b'
  });
}
const memory = initial => {
  const values = new Map([[DEMO_STORAGE_KEY, JSON.stringify(initial)]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
test('odd-paisa tax allocates exactly the total; zero and null GST remain distinct', () => {
  const result = calculateJewelleryItem(zeroCharges);
  assert.equal(result.taxableAmount, 56186.9);
  assert.equal(result.gstAmount, 1685.61);
  assert.equal(result.cgst, 842.81);
  assert.equal(result.sgst, 842.80);
  assert.equal(Math.round(result.cgst * 100) + Math.round(result.sgst * 100), 168561);
  assert.equal(calculateJewelleryItem({ ...zeroCharges, gstRatePercent: 0 }).finalValue, 56186.9);
  assert.equal(calculateJewelleryItem({ ...zeroCharges, gstRatePercent: null }).gstAmount, 1685.61);
  for (const gstRatePercent of [-1, Infinity, NaN, 101, 'invalid']) assert.throws(() => calculateJewelleryItem({ ...zeroCharges, gstRatePercent }));
});
test('issuer captures display fields and excludes credentials', () => {
  const firm = { name: 'A', gstin: 'TEST', accountNumber: 'SYNTHETIC', eInvoiceApi: 'synthetic-secret', nested: { key: 'synthetic' } };
  const snapshot = snapshotIssuer(firm);
  firm.name = 'B';
  assert.equal(snapshot.name, 'A');
  assert.equal(snapshot.accountNumber, 'SYNTHETIC');
  assert.equal(snapshot.eInvoiceApi, undefined);
  assert.equal(snapshot.nested, undefined);
});
test('later receipts reconcile exact invoice and firm without altering original document', () => {
  const invoice = { id: 'i', firmId: 'f', payments: { balanceUdhaarDue: 430, totalReceived: 600 } };
  const original = structuredClone(invoice);
  const receipts = [ { invoiceId: 'i', firmId: 'f', amount: 130 }, { invoiceId: 'i', firmId: 'other', amount: 400 }, { invoiceId: 'other', firmId: 'f', amount: 400 } ];
  assert.deepEqual(invoiceSettlement(invoice, receipts), { outstanding: 300, received: 730 });
  receipts.push({ invoiceId: 'i', firmId: 'f', amount: 300 });
  assert.deepEqual(invoiceSettlement(invoice, receipts), { outstanding: 0, received: 1030 });
  assert.deepEqual(invoice, original);
});
const sale = () => ({ customerName: 'Synthetic', taxableAmount: 1000, cgst: 15, sgst: 15, totalTax: 30,
  totalInvoiceAmount: 630, roundOff: 0, hasOldGold: true, metalReceived: { valuationAmount: 400 },
  payments: { cash: 630, totalReceived: 630, balanceUdhaarDue: 0 } });
test('exchange, loyalty, partial credit and signed rounding produce balanced postings', () => {
  for (const mutate of [() => {}, i => { i.payments = { loyaltyRedeemed: 630, totalReceived: 630 }; },
    i => { i.payments = { cash: 200, totalReceived: 200, balanceUdhaarDue: 430 }; },
    i => { i.roundOff = .3; i.totalInvoiceAmount = 630.3; i.payments.cash = i.payments.totalReceived = 630.3; },
    i => { i.roundOff = -.3; i.totalInvoiceAmount = 629.7; i.payments.cash = i.payments.totalReceived = 629.7; }]) {
    const i = sale(); mutate(i);
    const journal = invoiceJournal(i);
    const sum = side => side.reduce((total, entry) => total + Math.round(entry.amount * 100), 0);
    assert.equal(sum(journal.debits), sum(journal.credits));
  }
  assert.deepEqual(invoiceJournal(sale()).debits[1], { account: 'Old Gold Scrap Asset', amount: 400 });
});
test('inconsistent totals, invalid amounts, excess tender and excessive exchange fail before posting', () => {
  for (const mutate of [i => i.totalInvoiceAmount = 1, i => i.cgst = 0, i => i.payments.cash = Infinity,
    i => i.payments.cash = -1, i => i.payments.cash = -0.001, i => i.payments.cash = 1.001, i => i.payments.totalReceived = 1, i => i.payments.excessReceived = 2,
    i => i.metalReceived.valuationAmount = 2000]) {
    const i = sale(); mutate(i); assert.throws(() => invoiceJournal(i));
  }
});
test('complete versioned backup roundtrips histories, diary and selections', () => {
  const before = fixture(), storage = memory(before);
  assert.deepEqual(restoreDemoBackup(storage, JSON.parse(JSON.stringify(before))), before);
  assert.deepEqual(loadDemoBackup(storage), before);
  for (const field of COLLECTIONS) assert.ok(Array.isArray(loadDemoBackup(storage)[field]));
});
test('invalid late field, duplicates, missing histories, invalid numbers and foreign references never replace data', () => {
  const before = fixture();
  for (const mutate of [x => x.catalogueSettings = [], x => x.customers.push(x.customers[0]),
    x => delete x.schemeEnrollments, x => x.dailyDiary.todaySellTotal = Infinity,
    x => x.schemeEnrollments[0].customerId = 'unknown', x => x.activeBranchId = 'unknown',
    x => x.generalLedger[0].credits = 'invalid', x => x.udhaarRepayments[0].invoiceId = 'foreign-invoice',
    x => x.udhaarRepayments[0].amount = -1]) {
    const storage = memory(before), candidate = structuredClone(before); mutate(candidate);
    assert.throws(() => restoreDemoBackup(storage, candidate));
    assert.deepEqual(loadDemoBackup(storage), before);
  }
});
test('quota failure preserves previous snapshot, corrupt snapshots never reseed', () => {
  const before = fixture(), storage = memory(before);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => restoreDemoBackup(storage, before), /Quota/);
  assert.deepEqual(loadDemoBackup(storage), before);
  assert.throws(() => loadDemoBackup({ getItem: () => '{invalid' }));
  assert.equal(loadDemoBackup({ getItem: () => null }), null);
});
test('legacy diary migration is explicit and incomplete legacy export is rejected', () => {
  const old = fixture(); delete old.schemaVersion; delete old.mode;
  old.version = '2.7.364 Pro'; old.dailyDiary = [old.dailyDiary];
  assert.deepEqual(validateBackup(old).dailyDiary, fixture().dailyDiary);
  delete old.karigarVouchers;
  assert.throws(() => validateBackup(old), /missing collection/);
});
test('unknown/absent mode is blocked; only explicit demo enables browser workflows', () => {
  for (const value of [undefined, null, '', 'production', 'true', 'DEMO']) assert.equal(isDemoMode(value), false);
  assert.equal(isDemoMode('demo'), true);
});

test('optional undefined object fields are omitted and array holes normalize to null', () => {
  const data=fixture();
  data.customers[0].optional=undefined;
  data.customers[0].notes=[undefined,'synthetic'];
  const backup=validateBackup(data);
  assert.equal(Object.hasOwn(backup.customers[0],'optional'),false);
  assert.deepEqual(backup.customers[0].notes,[null,'synthetic']);
});
