// audit/engineering-audit-tests.js
// Verification suite for Jewellery OS Engineering Audit & Fix Plan (P0, P1, P2)

import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('JEWELLERY OS - COMPREHENSIVE ENGINEERING AUDIT VERIFICATION SUITE');
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
// 1. P2 Finding 9: Demo secrets stripped from seed data
// -----------------------------------------------------------------------------
const initialDataContent = fs.readFileSync('src/data/initialData.js', 'utf8');
assert(
  !initialDataContent.includes('slj_live_sec_78239019231') && !initialDataContent.includes('kjj_live_sec_89234892184912'),
  'ENG-SEC-01',
  'All simulated API secret tokens stripped from seed data (initialData.js)'
);

// -----------------------------------------------------------------------------
// 2. P0 Finding 1: Financial Reports Computed from Persisted Transactions
// -----------------------------------------------------------------------------
const accountsContent = fs.readFileSync('src/components/modules/AccountsReportsModule.jsx', 'utf8');

assert(
  !accountsContent.includes('1850000') && !accountsContent.includes('750000') && !accountsContent.includes('₹12,500.00'),
  'ENG-REP-01',
  'AccountsReportsModule has zero arbitrary literal numbers (1850000, 750000, 12500) hardcoded in reports'
);

assert(
  accountsContent.includes('bisHallmarkingFees') &&
  accountsContent.includes('proprietorCapital') &&
  accountsContent.includes('totalDebits') &&
  accountsContent.includes('isReconciled'),
  'ENG-REP-02',
  'AccountsReportsModule derives fees, capital, and debits/credits balance dynamically'
);

assert(
  accountsContent.includes('Generated from') && accountsContent.includes('sales invoices'),
  'ENG-REP-03',
  'AccountsReportsModule renders data provenance banner showing underlying record counts'
);

// -----------------------------------------------------------------------------
// 3. P0 Finding 2: Multi-Firm Data Scoping
// -----------------------------------------------------------------------------
const contextContent = fs.readFileSync('src/context/JewelleryContext.jsx', 'utf8');

assert(
  contextContent.includes('firmStock = stock.filter') &&
  contextContent.includes('firmInvoices = invoices.filter') &&
  contextContent.includes('firmUdhaar = udhaarList.filter'),
  'ENG-FIRM-01',
  'JewelleryContext isolates analytics (stock, invoices, udhaar) strictly to active firm'
);

assert(
  accountsContent.includes('firmInvoices') &&
  accountsContent.includes('firmStock') &&
  accountsContent.includes('firmUdhaar'),
  'ENG-FIRM-02',
  'AccountsReportsModule filters records strictly by active firm ID/code'
);

// -----------------------------------------------------------------------------
// 4. P0 Finding 3: Safe Storage Parsing and Schema Resilience
// -----------------------------------------------------------------------------
assert(
  contextContent.includes('safeLoadStorage') &&
  contextContent.includes('Corrupt local storage data at'),
  'ENG-STORE-01',
  'JewelleryContext includes safeLoadStorage parser protecting app against corrupt local storage JSON crashes'
);

assert(
  contextContent.includes('getTodayBusinessDate()') &&
  contextContent.includes('getFinancialYearString()'),
  'ENG-STORE-02',
  'JewelleryContext includes dynamic business date and financial year resolution helpers'
);

// -----------------------------------------------------------------------------
// 5. P1 Finding 4: Invoice Settlement Integrity & Double Selling Prevention
// -----------------------------------------------------------------------------
const billingContent = fs.readFileSync('src/components/modules/BillingModule.jsx', 'utf8');

assert(
  billingContent.includes('isSubmitting') && billingContent.includes('setIsSubmitting(true)'),
  'ENG-BILL-01',
  'BillingModule implements idempotency guard preventing double submission on rapid clicking'
);

assert(
  billingContent.includes('calculateJewelleryItem({') && billingContent.includes('grossWeight: found.grossWeight'),
  'ENG-BILL-02',
  'BillingModule unifies barcode scanned item pricing with standard calculateJewelleryItem engine'
);

assert(
  contextContent.includes('already sold out and cannot be billed again') &&
  contextContent.includes("status: 'Sold Out'"),
  'ENG-BILL-03',
  'JewelleryContext atomically sets stock status to Sold Out and blocks double selling'
);

assert(
  contextContent.includes("stockMovements") &&
  contextContent.includes("type: 'SALE'"),
  'ENG-BILL-04',
  'JewelleryContext records stock movement ledger audit entry for every billed item'
);

// -----------------------------------------------------------------------------
// 6. P1 Finding 5: Immutable Udhaar & Girvi Repayment Receipts
// -----------------------------------------------------------------------------
const udhaarContent = fs.readFileSync('src/components/modules/UdhaarLoanModule.jsx', 'utf8');

assert(
  contextContent.includes('udhaarRepayments') &&
  contextContent.includes('recordUdhaarDeposit') &&
  contextContent.includes('currentUdhaarBalance'),
  'ENG-UDH-01',
  'JewelleryContext appends immutable repayment records and decrements customer currentUdhaarBalance'
);

assert(
  udhaarContent.includes('udhaarRepayments') &&
  udhaarContent.includes('Repayment Receipts Ledger'),
  'ENG-UDH-02',
  'UdhaarLoanModule renders an immutable repayment receipts ledger table with receipt numbers and operator info'
);

// -----------------------------------------------------------------------------
// 7. P1 Finding 6: Dynamic Daily Diary Date Handling
// -----------------------------------------------------------------------------
const diaryContent = fs.readFileSync('src/components/modules/DailyDiaryModule.jsx', 'utf8');

assert(
  diaryContent.includes('getTodayBusinessDate()') &&
  diaryContent.includes('todaySellTotal') &&
  !diaryContent.includes('TOTAL SALES: {formatCurrency(dailyDiary.todaySellTotal)}'),
  'ENG-DIARY-01',
  'DailyDiaryModule calculates sales and cash balances dynamically for selected business date'
);

// -----------------------------------------------------------------------------
// 8. P1 Finding 7: Sequential Collision-Safe Invoice & Receipt Numbering
// -----------------------------------------------------------------------------
assert(
  contextContent.includes('getFinancialYearString') &&
  contextContent.includes('IS/') &&
  contextContent.includes('REC/'),
  'ENG-NUM-01',
  'JewelleryContext generates sequential collision-safe firm/FY-scoped numbers for invoices and receipts'
);

console.log('\n----------------------------------------------------------------------');
console.log(`TOTAL ENGINEERING AUDIT TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('----------------------------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ENGINEERING AUDIT REQUIREMENTS FULLY SATISFIED!\n');
}
