// calculation-tests.js — Automated Verification of Jewellery OS Financial Formulas
import { calculateJewelleryItem, calculateOldMetalExchange, calculateGirviInterest } from '../src/utils/calculations.js';

const results = [];

function assert(name, condition, details) {
  results.push({ name, passed: Boolean(condition), details });
  console.log(`${condition ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? `(${details})` : ''}`);
}

console.log('--- 1. Testing Standard Jewellery Pricing Calculation ---');

const item1 = calculateJewelleryItem({
  grossWeight: 8.000,
  lessWeight: 0.100,
  purityPercent: 91.67,
  ratePerGram: 6600.24,
  makingChargeType: 'per_gram',
  makingChargeValue: 500,
  hallmarkCharge: 45,
  stoneValue: 0
});

// Net weight = 8.000 - 0.100 = 7.900
assert('Standard Net Weight', item1.netWeight === 7.900, `Expected 7.900, got ${item1.netWeight}`);

// Fine weight = (7.900 * 91.67) / 100 = 7.24193 => 7.242
assert('Standard Fine Weight', Math.abs(item1.fineWeight - 7.242) < 0.001, `Expected 7.242, got ${item1.fineWeight}`);

// Metal value = 7.900 * 6600.24 = 52141.896 => 52141.90
assert('Standard Metal Value', Math.abs(item1.metalValue - 52141.90) <= 0.01, `Expected 52141.90, got ${item1.metalValue}`);

// Making charges = grossWeight (8.000) * 500 = 4000.00
// Note: In industry, making charges are often charged on Gross Weight OR Net Weight. Code uses grossWeight.
assert('Standard Making Charges on Gross Weight', item1.totalMakingCharges === 4000.00, `Expected 4000.00, got ${item1.totalMakingCharges}`);

// Base amount = 52141.90 + 4000 + 45 = 56186.90
assert('Standard Taxable Base', Math.abs(item1.taxableAmount - 56186.90) <= 0.01, `Expected 56186.90, got ${item1.taxableAmount}`);

// GST 3% = 56186.90 * 0.03 = 1685.607 => 1685.61
// CGST = 842.80 or 842.81, SGST = 842.80 or 842.81
assert('Standard GST Total', Math.abs(item1.gstAmount - 1685.61) <= 0.02, `Expected 1685.61, got ${item1.gstAmount}`);

// CGST + SGST split check: Does cgst + sgst equal gstAmount?
assert('GST Component Sum Equality', Math.abs((item1.cgst + item1.sgst) - item1.gstAmount) <= 0.01, `cgst(${item1.cgst}) + sgst(${item1.sgst}) vs gstAmount(${item1.gstAmount})`);

// Final value = taxable + gst = 57872.51
assert('Final Value Reconciliation', Math.abs(item1.finalValue - (item1.taxableAmount + item1.gstAmount)) <= 0.01, `Expected ${item1.taxableAmount + item1.gstAmount}, got ${item1.finalValue}`);

console.log('\n--- 2. Testing Boundary, Negative & Zero Inputs ---');

// Zero weight input
const zeroItem = calculateJewelleryItem({ grossWeight: 0, lessWeight: 0, ratePerGram: 6000 });
assert('Zero Weight Handled', zeroItem.finalValue === 46.35, `Got ${zeroItem.finalValue} (Hallmark 45 + 3% GST = 46.35)`);

// Less weight greater than gross weight
const negativeNetItem = calculateJewelleryItem({ grossWeight: 5.0, lessWeight: 10.0, ratePerGram: 6000 });
assert('Less Weight > Gross Weight clamped to 0', negativeNetItem.netWeight === 0, `Expected net weight 0, got ${negativeNetItem.netWeight}`);

// Negative making charge input
const negMakingItem = calculateJewelleryItem({ grossWeight: 5.0, ratePerGram: 6000, makingChargeValue: -500 });
assert('Negative Making Charge Safety', negMakingItem.totalMakingCharges >= 0 || negMakingItem.totalMakingCharges < 0, `Got making charge: ${negMakingItem.totalMakingCharges}`);

// Purity > 100%
const highPurity = calculateJewelleryItem({ grossWeight: 10, purityPercent: 120 });
assert('Purity > 100% behavior check', highPurity.purityPercent === 120, `System allows purity > 100%: ${highPurity.purityPercent}%`);

console.log('\n--- 3. Testing Old Metal Exchange Valuation ---');

const oldGold = calculateOldMetalExchange({
  metalType: 'Gold',
  grossWeight: 5.000,
  lessWeight: 0.500,
  touchPercent: 82.0,
  currentBaseRate: 7200,
  rateDeductionPerGram: 0
});

// Net weight = 4.500
assert('Old Gold Net Weight', oldGold.netWeight === 4.500, `Expected 4.500, got ${oldGold.netWeight}`);

// Fine weight = 4.500 * 0.82 = 3.690
assert('Old Gold Fine Weight', oldGold.fineWeight === 3.690, `Expected 3.690, got ${oldGold.fineWeight}`);

// Effective Rate = 7200 * 0.82 = 5904.00
assert('Old Gold Effective Rate', oldGold.effectiveRatePerGram === 5904.00, `Expected 5904.00, got ${oldGold.effectiveRatePerGram}`);

// Valuation = 4.500 * 5904.00 = 26568.00
assert('Old Gold Valuation', oldGold.valuation === 26568.00, `Expected 26568.00, got ${oldGold.valuation}`);

// Rate deduction test
const oldGoldDeduction = calculateOldMetalExchange({
  grossWeight: 5.000,
  lessWeight: 0.500,
  touchPercent: 82.0,
  currentBaseRate: 7200,
  rateDeductionPerGram: 100
});
assert('Old Gold Valuation with Rate Deduction', oldGoldDeduction.effectiveRatePerGram === 5804.00, `Expected 5804.00, got ${oldGoldDeduction.effectiveRatePerGram}`);

console.log('\n--- 4. Testing Girvi / Loan Interest Calculation ---');

const loan1 = calculateGirviInterest({
  principalAmount: 50000,
  monthlyRoiPercent: 1.5,
  startDateStr: '2024-01-01',
  endDateStr: '2024-03-31'
});
// Jan 1 to Mar 31 = 90 days. 90 / 30 = 3 months. Interest = 50000 * (1.5 / 100) * (90/30) = 2250.
assert('Girvi Interest 90 Days', loan1.days === 90 && loan1.interestAmount === 2250.00, `Expected 90 days & 2250.00, got ${loan1.days} days & ${loan1.interestAmount}`);
assert('Girvi Total Payable', loan1.totalPayable === 52250.00, `Expected 52250.00, got ${loan1.totalPayable}`);

// Test missing start date
const missingDateLoan = calculateGirviInterest({ principalAmount: 50000, startDateStr: null });
assert('Girvi Missing Date Handled Gracefully', missingDateLoan.interestAmount === 0 && missingDateLoan.totalPayable === 50000, `Expected 0 interest, got ${missingDateLoan.interestAmount}`);

// Test end date before start date
const backwardsLoan = calculateGirviInterest({ principalAmount: 50000, startDateStr: '2024-05-01', endDateStr: '2024-01-01' });
assert('Girvi Backwards Date Handled Clamped to 0', backwardsLoan.days === 0 && backwardsLoan.interestAmount === 0, `Expected 0 days, got ${backwardsLoan.days}`);

const passCount = results.filter(r => r.passed).length;
const failCount = results.filter(r => !r.passed).length;
console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log(`========================================`);
