export const BACKUP_FORMAT = 'jewellery-os-local-demo-backup';
export const BACKUP_SCHEMA_VERSION = 1;

export const BACKUP_COLLECTIONS = Object.freeze([
  'firms',
  'dailyRates',
  'stock',
  'customers',
  'karigars',
  'invoices',
  'udhaarList',
  'udhaarRepayments',
  'stockMovements',
  'generalLedger',
  'schemes',
  'karigarVouchers',
  'schemeEnrollments',
  'expenses',
  'clients',
  'branches',
  'staffUsers',
  'integrations',
  'auditLogs',
]);

const LEGACY_COLLECTIONS = Object.freeze([
  'firms', 'dailyRates', 'stock', 'customers', 'karigars', 'invoices', 'udhaarList',
  'udhaarRepayments', 'stockMovements', 'generalLedger', 'schemes', 'expenses',
  'clients', 'branches', 'staffUsers', 'integrations', 'auditLogs',
]);

export const BACKUP_REDACTIONS = Object.freeze([
  'customers[].aadhaar',
  'customers[].pan',
  'customers[].dob',
  'customers[].photo',
  'firms[].accountNumber',
  'firms[].ifscCode',
  'firms[].upiId',
  'firms[].eInvoiceApi',
  'integrations[].apiKeyMasked',
]);

const SENSITIVE_KEY = /(?:aadhaar|^pan$|password|secret|token|credential|api.?key|account.?number|ifsc|upi.?id|date.?of.?birth|^dob$|^photo$|einvoiceapi)/i;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_DEPTH = 40;
const MAX_COLLECTION_LENGTH = 50000;
const MAX_STRING_LENGTH = 1_000_000;
const MAX_NUMBER = Number.MAX_SAFE_INTEGER;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneSafeValue(value, path, depth = 0) {
  if (depth > MAX_DEPTH) throw new Error(`Backup value is nested too deeply at ${path}.`);
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) throw new Error(`Backup text is too large at ${path}.`);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_NUMBER) {
      throw new Error(`Backup contains an invalid number at ${path}.`);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_COLLECTION_LENGTH) throw new Error(`Backup collection is too large at ${path}.`);
    return value.map((item, index) => cloneSafeValue(item, `${path}[${index}]`, depth + 1));
  }
  if (!isPlainObject(value)) throw new Error(`Backup contains an invalid object at ${path}.`);

  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    if (DANGEROUS_KEYS.has(key)) throw new Error(`Backup contains a prohibited property at ${path}.${key}.`);
    if (SENSITIVE_KEY.test(key)) continue;
    if (child === undefined) continue;
    clean[key] = cloneSafeValue(child, `${path}.${key}`, depth + 1);
  }
  return clean;
}

function requireIsoDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`Backup ${field} must be a UTC ISO timestamp.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`Backup ${field} is invalid.`);
}

function validateCollections(data) {
  for (const collection of BACKUP_COLLECTIONS) {
    if (!Array.isArray(data[collection])) throw new Error(`Backup collection "${collection}" must be an array.`);
    if (data[collection].length > MAX_COLLECTION_LENGTH) throw new Error(`Backup collection "${collection}" is too large.`);
    const ids = new Set();
    for (const [index, row] of data[collection].entries()) {
      const path = `${collection}[${index}]`;
      if (!isPlainObject(row)) throw new Error(`Backup entry ${path} must be an object.`);
      if (typeof row.id !== 'string' || row.id.trim().length === 0 || row.id.length > 160) {
        throw new Error(`Backup entry ${path} must have a stable string id.`);
      }
      if (ids.has(row.id)) throw new Error(`Backup collection "${collection}" contains duplicate id "${row.id}".`);
      ids.add(row.id);
    }
  }
  if (!isPlainObject(data.dailyDiary)) throw new Error('Backup field "dailyDiary" must be an object.');
  if (!isPlainObject(data.catalogueSettings)) throw new Error('Backup field "catalogueSettings" must be an object.');

  const firmIds = new Set(data.firms.map(firm => firm.id));
  const firmCodes = new Set(data.firms.map(firm => firm.code).filter(code => typeof code === 'string'));
  if (firmIds.size !== data.firms.length) throw new Error('Backup firms must have unique ids.');
  if (firmCodes.size !== data.firms.length) throw new Error('Backup firms must have unique codes.');
  for (const firm of data.firms) {
    if (typeof firm.code !== 'string' || !firm.code || typeof firm.name !== 'string' || !firm.name) {
      throw new Error('Every backup firm must have a code and name.');
  }
  }

  const clientIds = new Set(data.clients.map(client => client.id));
  const branchIds = new Set(data.branches.map(branch => branch.id));
  const stockIds = new Set(data.stock.map(item => item.id));
  const customerIds = new Set(data.customers.map(customer => customer.id));
  const invoiceIds = new Set(data.invoices.map(invoice => invoice.id));
  const karigarIds = new Set(data.karigars.map(karigar => karigar.id));
  const schemeIds = new Set(data.schemes.map(scheme => scheme.id));

  for (const collection of BACKUP_COLLECTIONS) {
    for (const [index, row] of data[collection].entries()) {
      const path = `${collection}[${index}]`;
      if (typeof row.firmId === 'string' && row.firmId && !firmIds.has(row.firmId)) {
        throw new Error(`${path} refers to a firm that is not in this backup.`);
      }
      if (typeof row.firmCode === 'string' && row.firmCode && !firmCodes.has(row.firmCode)) {
        throw new Error(`${path} refers to a firm code that is not in this backup.`);
      }
      if (collection === 'clients' && Array.isArray(row.linkedFirmIds)
        && row.linkedFirmIds.some(id => !firmIds.has(id))) {
        throw new Error(`${path} contains a firm link that is not in this backup.`);
      }
      if (collection === 'branches' && typeof row.firmId === 'string' && !firmIds.has(row.firmId)) {
        throw new Error(`${path} refers to a firm that is not in this backup.`);
      }
      if (collection === 'invoices') {
        if (row.customerId && !customerIds.has(row.customerId)) throw new Error(`${path} refers to a customer that is not in this backup.`);
        if (Array.isArray(row.items) && row.items.some(item => item?.itemId && !stockIds.has(item.itemId))) {
          throw new Error(`${path} contains an item link that is not in this backup.`);
        }
      }
      if (collection === 'udhaarList' && row.customerId && !customerIds.has(row.customerId)) {
        throw new Error(`${path} refers to a customer that is not in this backup.`);
      }
      if (collection === 'stockMovements' && row.stockId && !stockIds.has(row.stockId)) {
        throw new Error(`${path} refers to stock that is not in this backup.`);
      }
      if (collection === 'udhaarRepayments' && row.loanId && !data.udhaarList.some(loan => loan.id === row.loanId)) {
        throw new Error(`${path} refers to a loan that is not in this backup.`);
      }
      if (collection === 'karigarVouchers' && row.karigarId && !karigarIds.has(row.karigarId)) {
        throw new Error(`${path} refers to a karigar that is not in this backup.`);
      }
      if (collection === 'schemeEnrollments') {
        if (row.schemeId && !schemeIds.has(row.schemeId)) throw new Error(`${path} refers to a scheme that is not in this backup.`);
        if (row.customerId && !customerIds.has(row.customerId)) throw new Error(`${path} refers to a customer that is not in this backup.`);
      }
      if (collection === 'generalLedger' && row.invoiceId && !invoiceIds.has(row.invoiceId)) {
        throw new Error(`${path} refers to an invoice that is not in this backup.`);
      }
      if (collection === 'branches' && branchIds.size !== data.branches.length) {
        throw new Error('Backup branches must have unique ids.');
      }
      if (collection === 'staffUsers' && row.branchId && !branchIds.has(row.branchId)) {
        throw new Error(`${path} refers to a branch that is not in this backup.`);
      }
    }
  }

  for (const [field, allowed] of [['activeFirmId', firmIds], ['activeClientId', clientIds], ['activeBranchId', branchIds]]) {
    if (typeof data[field] !== 'string' || !allowed.has(data[field])) {
      throw new Error(`Backup field "${field}" must refer to a saved record.`);
    }
  }
}

function redactCollections(state) {
  const data = {};
  for (const collection of BACKUP_COLLECTIONS) {
    data[collection] = cloneSafeValue(state[collection], collection);
  }
  data.dailyDiary = cloneSafeValue(state.dailyDiary, 'dailyDiary');
  data.catalogueSettings = cloneSafeValue(state.catalogueSettings, 'catalogueSettings');
  data.activeFirmId = state.activeFirmId;
  data.activeClientId = state.activeClientId;
  data.activeBranchId = state.activeBranchId;
  return data;
}

export function createBackupDocument(state, exportedAt = new Date().toISOString()) {
  requireIsoDate(exportedAt, 'exportedAt');
  const data = redactCollections(state);
  validateCollections(data);
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appName: 'Jewellery OS',
    exportedAt,
    redactedFields: [...BACKUP_REDACTIONS],
    data,
  };
}

function migrateLegacyBackup(input) {
  if (input.appName !== 'Jewellery OS' || typeof input.version !== 'string') return null;
  requireIsoDate(input.exportDate, 'exportDate');
  const allowedKeys = new Set(['appName', 'version', 'exportDate', ...LEGACY_COLLECTIONS, 'dailyDiary', 'catalogueSettings']);
  if (Object.keys(input).some(key => !allowedKeys.has(key))) throw new Error('Legacy backup contains unsupported fields.');

  const data = {};
  for (const collection of BACKUP_COLLECTIONS) {
    data[collection] = LEGACY_COLLECTIONS.includes(collection)
      ? cloneSafeValue(input[collection], collection)
      : [];
  }
  data.dailyDiary = cloneSafeValue(input.dailyDiary, 'dailyDiary');
  data.catalogueSettings = cloneSafeValue(input.catalogueSettings, 'catalogueSettings');
  data.activeFirmId = data.firms[0]?.id;
  data.activeClientId = data.clients[0]?.id;
  data.activeBranchId = data.branches[0]?.id;
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appName: 'Jewellery OS',
    exportedAt: input.exportDate,
    redactedFields: [...BACKUP_REDACTIONS],
    data,
    migratedFromVersion: input.version,
  };
}

export function prepareBackupRestore(input) {
  if (!isPlainObject(input)) throw new Error('Invalid backup: expected a JSON object.');
  let document = input;
  if (input.format !== BACKUP_FORMAT) {
    document = migrateLegacyBackup(input);
    if (!document) throw new Error('Unsupported backup format. Export a Jewellery OS backup and try again.');
  }
  if (document.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported backup schema version: ${String(document.schemaVersion)}.`);
  }
  if (document.appName !== 'Jewellery OS') throw new Error('Backup application name does not match Jewellery OS.');
  requireIsoDate(document.exportedAt, 'exportedAt');
  if (!Array.isArray(document.redactedFields)
    || JSON.stringify(document.redactedFields) !== JSON.stringify(BACKUP_REDACTIONS)) {
    throw new Error('Backup privacy manifest is missing or unsupported.');
  }
  if (!isPlainObject(document.data)) throw new Error('Backup data must be an object.');

  const allowedDataFields = new Set([
    ...BACKUP_COLLECTIONS,
    'dailyDiary', 'catalogueSettings', 'activeFirmId', 'activeClientId', 'activeBranchId',
  ]);
  if (Object.keys(document.data).some(key => !allowedDataFields.has(key))) {
    throw new Error('Backup contains unsupported data fields.');
  }
  const data = cloneSafeValue(document.data, 'data');
  validateCollections(data);
  return { ...document, data };
}

export function downloadBackupDocument(document, filename = 'Jewellery_OS_Backup.json') {
  if (typeof document === 'undefined' || typeof window === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
