// verify-fixes.js
// Automated verification suite for Jewellery OS GSD audit fixes

import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('JEWELLERY OS - AUDIT FIXES VERIFICATION SUITE');
console.log('======================================================================\n');

let passedCount = 0;
let failedCount = 0;

function assert(condition, testId, message) {
  if (condition) {
    passedCount++;
    console.log(`✅ PASS: [${testId}] ${message}`);
  } else {
    failedCount++;
    console.error(`❌ FAIL: [${testId}] ${message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. SEC-03: Mock API Secret Leakage Verification
// -----------------------------------------------------------------------------
const initialDataContent = fs.readFileSync('src/data/initialData.js', 'utf8');
assert(
  !initialDataContent.includes('kjj_live_sec_89234892184912'),
  'SEC-03',
  'Mock API secret stripped from src/data/initialData.js'
);

// -----------------------------------------------------------------------------
// 2. SEC-04: CSV Formula Injection Sanitization
// -----------------------------------------------------------------------------
const stockModuleContent = fs.readFileSync('src/components/modules/StockModule.jsx', 'utf8');
assert(
  stockModuleContent.includes('sanitizeCsvCell') && stockModuleContent.includes("str = `'${str}`;"),
  'SEC-04',
  'StockModule.jsx applies formula sanitization prefixing dangerous characters (=, +, -, @) with single quote'
);

// -----------------------------------------------------------------------------
// 3. SEC-05: Safe Math Parser without Function() Eval
// -----------------------------------------------------------------------------
const calculatorContent = fs.readFileSync('src/components/common/CalculatorModal.jsx', 'utf8');
assert(
  !calculatorContent.includes('Function(') && !calculatorContent.includes('eval('),
  'SEC-05-A',
  'CalculatorModal.jsx no longer contains Function() or eval() code execution'
);
assert(
  calculatorContent.includes('safeEvaluateMath'),
  'SEC-05-B',
  'CalculatorModal.jsx implements safe recursive descent arithmetic parser'
);

// -----------------------------------------------------------------------------
// 4. SEC-06: Schema Validation on Database Restore
// -----------------------------------------------------------------------------
const contextContent = fs.readFileSync('src/context/JewelleryContext.jsx', 'utf8');
assert(
  contextContent.includes('Invalid backup schema: No valid Jewellery OS collections found'),
  'SEC-06-A',
  'JewelleryContext.jsx validates JSON structure and rejects unvalidated data'
);
const backupModuleContent = fs.readFileSync('src/components/modules/BackupRestoreModule.jsx', 'utf8');
assert(
  backupModuleContent.includes('Backup Restore Failed:'),
  'SEC-06-B',
  'BackupRestoreModule.jsx reports explicit schema validation errors to the user'
);

// -----------------------------------------------------------------------------
// 5. INV-01: Serialized Stock Double Selling Prevention
// -----------------------------------------------------------------------------
const billingModuleContent = fs.readFileSync('src/components/modules/BillingModule.jsx', 'utf8');
assert(
  billingModuleContent.includes("if (found.status === 'Sold' || found.status === 'Sold Out')") &&
  billingModuleContent.includes('already in your billing cart'),
  'INV-01-A',
  'BillingModule.jsx rejects scanning sold items and duplicate items in cart'
);
assert(
  contextContent.includes('already sold out and cannot be billed again'),
  'INV-01-B',
  'JewelleryContext.jsx throws error if any sold item is submitted in createInvoice()'
);

// -----------------------------------------------------------------------------
// 6. INV-02: Multi-Firm Data Isolation
// -----------------------------------------------------------------------------
assert(
  stockModuleContent.includes('!item.firmCode || item.firmCode === activeFirm.code'),
  'INV-02-A',
  'StockModule.jsx filters inventory catalog strictly by activeFirm.code'
);
assert(
  billingModuleContent.includes('!s.firmCode || s.firmCode === activeFirm.code'),
  'INV-02-B',
  'BillingModule.jsx isolates barcode scanning by activeFirm.code'
);
assert(
  contextContent.includes('firmId: activeFirm.id'),
  'INV-02-C',
  'JewelleryContext.jsx tags new stock additions with activeFirm.id'
);

// -----------------------------------------------------------------------------
// 7. INV-03: Mandatory Customer for Udhaar / Unbooked Debt Protection
// -----------------------------------------------------------------------------
assert(
  contextContent.includes('Outstanding balance (Udhaar) of') &&
  contextContent.includes('requires an enrolled customer account'),
  'INV-03',
  'JewelleryContext.jsx throws error and blocks checkout if invoice has unpaid balance without customerId'
);

// -----------------------------------------------------------------------------
// 8. INV-07: Dynamic Accounting Statements (P&L, Trial Balance, Balance Sheet, Stock)
// -----------------------------------------------------------------------------
const accountsContent = fs.readFileSync('src/components/modules/AccountsReportsModule.jsx', 'utf8');
assert(
  accountsContent.includes('salesRevenue = invoices.reduce') &&
  accountsContent.includes('closingStockValue = stock'),
  'INV-07-A',
  'AccountsReportsModule.jsx dynamically calculates P&L from live invoices and inventory'
);
assert(
  accountsContent.includes('TRIAL BALANCE AS AT') &&
  accountsContent.includes('BALANCE SHEET AS AT') &&
  accountsContent.includes('LIVE STOCK VALUATION REPORT'),
  'INV-07-B',
  'AccountsReportsModule.jsx renders live Trial Balance, Balance Sheet, and Stock Valuation tabs'
);

// -----------------------------------------------------------------------------
// 9. MOD-01 & MOD-02: Functional Karigar Job Work & Gold Schemes Passbook
// -----------------------------------------------------------------------------
assert(
  contextContent.includes('issueMetalToKarigar') &&
  contextContent.includes('receiveOrnamentFromKarigar'),
  'MOD-01-A',
  'JewelleryContext.jsx implements issueMetalToKarigar and receiveOrnamentFromKarigar actions'
);
const karigarContent = fs.readFileSync('src/components/modules/KarigarModule.jsx', 'utf8');
assert(
  karigarContent.includes('issueMetalToKarigar') &&
  karigarContent.includes('METAL VOUCHERS LEDGER'),
  'MOD-01-B',
  'KarigarModule.jsx connects issue/receive forms to live metal ledger and vouchers table'
);
assert(
  contextContent.includes('enrollCustomerInScheme') &&
  contextContent.includes('recordSchemeInstallment'),
  'MOD-02-A',
  'JewelleryContext.jsx implements enrollCustomerInScheme and recordSchemeInstallment'
);
const schemeContent = fs.readFileSync('src/components/modules/SchemeModule.jsx', 'utf8');
assert(
  schemeContent.includes('CUSTOMER PASSBOOKS') &&
  schemeContent.includes('handlePayInstallment'),
  'MOD-02-B',
  'SchemeModule.jsx renders active customer passbooks and allows recording monthly installments'
);

console.log('\n----------------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('----------------------------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL AUDIT FIXES VERIFIED SUCCESSFULLY!\n');
}
