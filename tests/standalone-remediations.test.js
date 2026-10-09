import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, serializeCsv } from '../src/utils/csv.js';
import { addStockItemToCart, createBillingCartItem, createCatalogueEstimate } from '../src/utils/billingCart.js';
import { calculateCatalogQuote } from '../server/pricing.js';
import { calculateTrialBalance } from '../server/accounting.js';

test('CSV text neutralizes spreadsheet formulas while keeping numbers numeric', () => {
  for (const value of ['=1+1', '+SUM(A1:A2)', '-CMD()', '@SUM(1,1)', '\t=1+1', '\r@SUM(1,1)']) {
    assert.ok(csvCell(value).startsWith('"\''), `${JSON.stringify(value)} should be quoted and prefixed`);
  }
  assert.equal(csvCell(-12.5), '-12.5');
  assert.equal(csvCell(0), '0');
  assert.equal(csvCell(null), '""');
});

test('CSV serializer escapes quotes, commas, and line breaks in labels', () => {
  assert.equal(serializeCsv([['Metal', 'Label'], ['Gold', 'A, "B"\nC']]), '"Metal","Label"\r\n"Gold","A, ""B""\nC"');
});

test('catalogue estimate keeps each selected price and grand total, including zero', () => {
  const first = createCatalogueEstimate({ id: 'one', itemCode: 'A', totalPrice: 4500 });
  const second = createCatalogueEstimate({ id: 'two', itemCode: 'B', totalPrice: 9800 });
  const zero = createCatalogueEstimate({ id: 'zero', itemCode: 'Z', totalPrice: 0 });
  assert.equal(first.items[0].finalValue, 4500);
  assert.equal(first.total, 4500);
  assert.equal(second.items[0].finalValue, 9800);
  assert.equal(second.total, 9800);
  assert.equal(zero.items[0].finalValue, 0);
  assert.equal(zero.total, 0);
});

test('catalogue billing draft carries one stable item and its selected amount', () => {
  const stockItem = {
    id: 'stock-1', itemCode: 'RING-1', status: 'In Stock', totalPrice: 4500,
    metalType: 'Gold', category: 'Ring', subCategory: 'Plain', grossWeight: 2,
    lessWeight: 0, purityKarat: '22K', purityPercent: 91.67, ratePerGram: 6500,
    makingChargeType: 'per_gram', makingChargeValue: 100, hallmarkCharge: 0
  };
  const once = addStockItemToCart([], stockItem);
  const twice = addStockItemToCart(once, stockItem);
  assert.equal(once.length, 1);
  assert.equal(once[0].itemId, stockItem.id);
  assert.equal(once[0].itemCode, stockItem.itemCode);
  assert.equal(once[0].finalValue, 4500);
  assert.equal(twice.length, 1);
  assert.equal(addStockItemToCart([], { ...stockItem, status: 'Sold' }).length, 0);
  assert.equal(createBillingCartItem({ ...stockItem, totalPrice: 0 }).finalValue, 0);
});

test('server quote uses a single calculation rule, zero tax, and an exact GST component sum', () => {
  const example = {
    grossWeightMg: 8000,
    netWeightMg: 7900,
    purityBps: 9167,
    ratePerGramPaise: 660024,
    makingChargeType: 'per_gram',
    makingChargeValue: 50000,
    makingDiscountBps: 0,
    stoneValuePaise: 0,
    hallmarkChargePaise: 4500,
    otherChargesPaise: 0,
    itemDiscountPaise: 0,
    gstRateBps: 300,
  };
  const taxed = calculateCatalogQuote(example);
  assert.equal(taxed.taxableAmountPaise, 5618690);
  assert.equal(taxed.totalPricePaise, 5787251);
  assert.equal(taxed.cgstPaise + taxed.sgstPaise, taxed.totalPricePaise - taxed.taxableAmountPaise);
  const zeroTax = calculateCatalogQuote({ ...example, gstRateBps: 0 });
  assert.equal(zeroTax.totalPricePaise, zeroTax.taxableAmountPaise);
  assert.equal(zeroTax.cgstPaise + zeroTax.sgstPaise, 0);
});

test('trial balance summarizes sale and cash receipt journal entries in exact paise', () => {
  const trial = calculateTrialBalance([
    { accountCode: 'ACCOUNTS_RECEIVABLE', debitPaise: '200000', creditPaise: '0' },
    { accountCode: 'CASH', debitPaise: '50000', creditPaise: '0' },
    { accountCode: 'SALES_REVENUE', debitPaise: '0', creditPaise: '220000' },
    { accountCode: 'OUTPUT_CGST', debitPaise: '0', creditPaise: '30000' },
    { accountCode: 'CASH', debitPaise: '25000', creditPaise: '0' },
    { accountCode: 'ACCOUNTS_RECEIVABLE', debitPaise: '0', creditPaise: '25000' },
  ]);
  assert.equal(trial.isBalanced, true);
  assert.equal(trial.totalDebitsPaise, 275000);
  assert.equal(trial.totalCreditsPaise, 275000);
  const receivable = trial.items.find(item => item.accountCode === 'ACCOUNTS_RECEIVABLE');
  assert.equal(receivable.debitBalancePaise, 175000);
  assert.equal(receivable.creditBalancePaise, 0);
});

test('trial balance flags unequal journals and rejects invalid side or unsafe money values', () => {
  assert.equal(calculateTrialBalance([{ accountCode: 'CASH', debitPaise: 10, creditPaise: 0 }]).isBalanced, false);
  assert.throws(() => calculateTrialBalance([{ accountCode: 'CASH', debitPaise: 10, creditPaise: 1 }]), /exact paise/);
  assert.throws(() => calculateTrialBalance([{ accountCode: 'CASH', debitPaise: Number.MAX_SAFE_INTEGER + 1, creditPaise: 0 }]), /exact paise/);
});
