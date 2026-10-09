// This format is for the synthetic demonstration, not a multi-tenant database.
export const DEMO_STORAGE_KEY = 'JEWELLERY_OS_DEMO_V2';
export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const COLLECTIONS = [
  'firms', 'dailyRates', 'stock', 'customers', 'karigars', 'invoices',
  'udhaarList', 'udhaarRepayments', 'stockMovements', 'generalLedger',
  'schemes', 'schemeEnrollments', 'karigarVouchers', 'expenses',
  'clients', 'branches', 'staffUsers', 'integrations', 'auditLogs'
];
const OBJECTS = ['dailyDiary', 'catalogueSettings'];
const SELECTIONS = { activeFirmId: 'firms', activeClientId: 'clients', activeBranchId: 'branches' };
const numericFields = new Set([
  'grossWeight', 'lessWeight', 'netWeight', 'fineWeight', 'ratePerGram', 'ratePer10Gm',
  'taxAmount', 'rateWithTax', 'purityPercent', 'qty', 'quantity', 'totalPrice',
  'taxableAmount', 'cgst', 'sgst', 'totalTax', 'roundOff', 'totalInvoiceAmount',
  'amount', 'cash', 'cheque', 'card', 'online', 'loyaltyRedeemed', 'totalReceived',
  'balanceUdhaarDue', 'excessReceived', 'leftBalance', 'principalAmount', 'depositedAmount',
  'currentUdhaarBalance', 'openingBalance', 'todaySellTotal', 'cashBalance',
  'makingChargeValue', 'totalMakingCharges', 'hallmarkCharge', 'stoneValue', 'finalValue'
]);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
function fail(message) { throw new Error(`Invalid backup: ${message}`); }

// Validate before serializing: JSON.stringify would otherwise hide NaN/Infinity.
function normalize(value, key = '', depth = 0, budget = { count: 0 }) {
  if (++budget.count > 500000 || depth > 30) fail('document is too complex');
  if (numericFields.has(key) && value !== null && value !== undefined) {
    if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || !Number.isFinite(Number(value))) fail(`${key} must be finite`);
    return Number(value);
  }
  if (typeof value === 'number' && !Number.isFinite(value)) fail('non-finite number');
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(item => normalize(item === undefined ? null : item, '', depth + 1, budget));
  if (!isObject(value)) fail('unsupported value');
  const result = {};
  for (const [field, item] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(field)) fail('unsafe property');
    if (item !== undefined) result[field] = normalize(item, field, depth + 1, budget);
  }
  return result;
}

export function validateBackup(input) {
  if (!isObject(input)) fail('root must be an object');
  const data = normalize(input);
  // Explicit migration of the old exporter. Missing histories cannot be invented.
  if (data.schemaVersion === undefined && data.appName === 'Jewellery OS' && data.version === '2.7.364 Pro') {
    data.schemaVersion = BACKUP_VERSION;
    data.mode = 'demo';
    if (Array.isArray(data.dailyDiary)) {
      if (data.dailyDiary.length !== 1 || !isObject(data.dailyDiary[0])) fail('legacy diary requires one identified day');
      data.dailyDiary = data.dailyDiary[0];
    }
  }
  if (data.schemaVersion !== BACKUP_VERSION || data.appName !== 'Jewellery OS' || data.mode !== 'demo') fail('unsupported version or mode');
  const indexes = {};
  for (const name of COLLECTIONS) {
    if (!Array.isArray(data[name])) fail(`missing collection ${name}; incomplete legacy backups need manual recovery`);
    const ids = new Set();
    for (const row of data[name]) {
      if (!isObject(row) || typeof row.id !== 'string' || !row.id.trim()) fail(`${name} contains an invalid record ID`);
      if (ids.has(row.id)) fail(`${name} contains duplicate IDs`);
      ids.add(row.id);
    }
    indexes[name] = new Map(data[name].map(row => [row.id, row]));
  }
  for (const name of OBJECTS) if (!isObject(data[name])) fail(`${name} must be an object`);
  if (!data.firms.length || !data.clients.length) fail('at least one firm and client are required');
  if (!Array.isArray(data.dailyDiary.todaySellDetails) || !Number.isFinite(data.dailyDiary.todaySellTotal)) fail('invalid diary sales summary');
  if (data.dailyDiary.expenses !== undefined && !Array.isArray(data.dailyDiary.expenses)) fail('invalid diary expenses');
  for (const name of ['categories', 'metalPurities', 'weightUnits', 'makingChargeMethods']) {
    if (!Array.isArray(data.catalogueSettings[name])) fail(`catalogueSettings.${name} must be an array`);
  }
  for (const firm of data.firms) {
    if (typeof firm.name !== 'string' || typeof firm.code !== 'string') fail('invalid firm identity');
  }
  const firmCodes = new Map(data.firms.map(firm => [firm.code, firm.id]));
  if (firmCodes.size !== data.firms.length) fail('duplicate firm codes');
  for (const name of COLLECTIONS) for (const row of data[name]) {
    if (row.firmId && !indexes.firms.has(row.firmId)) fail(`${name} references an unknown firm`);
    if (row.firmCode && (!firmCodes.has(row.firmCode) || (row.firmId && firmCodes.get(row.firmCode) !== row.firmId))) fail(`${name} has conflicting firm ownership`);
    const branch = row.branchId && indexes.branches.get(row.branchId);
    if (row.branchId && !branch) fail(`${name} references an unknown branch`);
    if (branch && row.firmId && row.firmId !== branch.firmId) fail('branch belongs to another firm');
    if (row.customerId) {
      const customer = indexes.customers.get(row.customerId);
      if (!customer || (row.firmId && customer.firmId && row.firmId !== customer.firmId)) fail('invalid customer reference');
    }
  }
  for (const rate of data.dailyRates) for (const field of ['ratePerGram', 'ratePer10Gm', 'taxAmount', 'rateWithTax']) {
    if (!Number.isFinite(rate[field]) || rate[field] < 0) fail(`invalid rate ${field}`);
  }
  for (const item of data.stock) for (const field of ['grossWeight', 'netWeight', 'totalPrice']) {
    if (!Number.isFinite(item[field]) || item[field] < 0) fail(`invalid stock ${field}`);
  }
  for (const client of data.clients) {
    if (!Array.isArray(client.enabledModules) || !client.enabledModules.every(x => typeof x === 'string')) fail('invalid module list');
    if (!Array.isArray(client.linkedFirmIds) || !client.linkedFirmIds.every(id => indexes.firms.has(id))) fail('invalid client firm reference');
  }
  for (const inv of data.invoices) {
    if (inv.items !== undefined && !Array.isArray(inv.items)) fail('invoice items must be an array');
    if (!isObject(inv.payments) || !Number.isFinite(inv.totalInvoiceAmount)) fail('invalid invoice amounts');
    for (const item of inv.items ?? []) {
      if (!isObject(item)) fail('invalid invoice item');
      if (!item.itemId) continue;
      const stock = indexes.stock.get(item.itemId);
      if (!stock || (stock.firmId && inv.firmId && stock.firmId !== inv.firmId) || (stock.firmCode && inv.firmCode && stock.firmCode !== inv.firmCode)) fail('invalid invoice stock reference');
    }
  }
  for (const journal of data.generalLedger) {
    for (const side of ['debits', 'credits']) if (!Array.isArray(journal[side]) || !journal[side].every(entry => isObject(entry) && typeof entry.account === 'string' && Number.isFinite(entry.amount) && entry.amount >= 0)) fail('invalid journal entry');
  }
  for (const receipt of data.udhaarRepayments) {
    const loan = indexes.udhaarList.get(receipt.loanId);
    if (!loan || !Number.isFinite(receipt.amount) || receipt.amount <= 0 ||
      (receipt.firmId && loan.firmId && receipt.firmId !== loan.firmId)) fail('invalid repayment loan reference or amount');
    if (receipt.invoiceId) {
      const invoice = indexes.invoices.get(receipt.invoiceId);
      if (!invoice || invoice.firmId !== receipt.firmId ||
        (loan.invoiceId && loan.invoiceId !== invoice.id) ||
        (loan.mainInvoiceNo && loan.mainInvoiceNo !== invoice.invoiceNo)) fail('invalid repayment invoice reference');
    }
  }
  for (const voucher of data.karigarVouchers) if (!indexes.karigars.has(voucher.karigarId)) fail('invalid karigar reference');
  for (const enrollment of data.schemeEnrollments) if (!indexes.schemes.has(enrollment.schemeId)) fail('invalid scheme reference');
  for (const [selection, collection] of Object.entries(SELECTIONS)) {
    if (data[selection] === '' && data[collection].length === 0) continue;
    if (typeof data[selection] !== 'string' || !indexes[collection].has(data[selection])) fail(`invalid ${selection}`);
  }
  if (new Blob([JSON.stringify(data)]).size > MAX_BACKUP_BYTES) fail('document exceeds 10 MB');
  return data;
}

export function createBackup(state) {
  return validateBackup({ ...state, appName: 'Jewellery OS', schemaVersion: BACKUP_VERSION, mode: 'demo' });
}

export function loadDemoBackup(storage) {
  const raw = storage.getItem(DEMO_STORAGE_KEY);
  if (raw === null) return null;
  if (new Blob([raw]).size > MAX_BACKUP_BYTES) fail('document exceeds 10 MB');
  return validateBackup(JSON.parse(raw)); // Fail visibly; never replace damaged data with seed data.
}

export function restoreDemoBackup(storage, input) {
  const backup = validateBackup(input);
  // Web Storage replaces a single value atomically; quota failure preserves it.
  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(backup));
  return backup;
}

export function downloadJson(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
