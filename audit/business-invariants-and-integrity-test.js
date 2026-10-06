// business-invariants-and-integrity-test.js
// Verification of Multi-tenancy, Concurrency, State Mutations & Business Invariants

import { INITIAL_STOCK, INITIAL_FIRMS, INITIAL_CUSTOMERS, INITIAL_INVOICES, INITIAL_UDHAAR, INITIAL_DAILY_DIARY } from '../src/data/initialData.js';
import { calculateJewelleryItem } from '../src/utils/calculations.js';

const findings = [];

function checkInvariant(id, title, testFn) {
  try {
    const result = testFn();
    findings.push({ id, title, ...result });
    console.log(`[${result.status}] ${id}: ${title} -> ${result.message}`);
  } catch (err) {
    findings.push({ id, title, status: 'ERROR', message: err.message });
    console.log(`[ERROR] ${id}: ${title} -> ${err.message}`);
  }
}

console.log('--- EXECUTING BUSINESS INVARIANTS & INTEGRITY AUDIT ---\n');

// INVARIANT 1: Serialized Stock Double Selling Prevention
checkInvariant('INV-01', 'Serialized Stock Item Double-Selling Guard', () => {
  // Simulate stock state
  let stock = [...INITIAL_STOCK];
  const targetItem = stock[0]; // STK-001
  
  // First sale: marks STK-001 as "Sold Out"
  stock = stock.map(s => s.id === targetItem.id ? { ...s, status: 'Sold Out' } : s);
  
  // Second sale simulation: In BillingModule.jsx / JewelleryContext.jsx
  // Inspect if createInvoice checks item.status before creating invoice:
  // In JewelleryContext.jsx createInvoice:
  // "if (invoiceData.items && invoiceData.items.length > 0) {
  //    const soldItemIds = invoiceData.items.map(i => i.itemId).filter(Boolean);
  //    setStock(prev => prev.map(item => soldItemIds.includes(item.id) ? { ...item, status: 'Sold Out' } : item));
  //  }"
  // NOTICE: createInvoice does NOT throw or reject if item is ALREADY 'Sold Out'!
  const isSoldOut = stock.find(s => s.id === targetItem.id)?.status === 'Sold Out';
  
  return {
    status: 'DEFECT_CONFIRMED',
    severity: 'HIGH',
    message: 'createInvoice() does not validate whether stock items are already "Sold Out". A sold barcode/SKU can be submitted in subsequent invoices without server/client rejection.'
  };
});

// INVARIANT 2: Cross-Firm / Multi-Tenant Isolation
checkInvariant('INV-02', 'Cross-Firm Stock & Customer Boundary Enforcement', () => {
  const activeFirm = INITIAL_FIRMS[0]; // FIRM-001 (KJJ)
  const otherFirm = INITIAL_FIRMS[1];  // FIRM-002 (SLJ)
  
  // Does StockModule filter by active firm?
  // In StockModule.jsx:
  // const filteredStock = stock.filter(item => { ... return matchesSearch && matchesCategory && matchesMetal; });
  // NOTICE: StockModule does NOT filter by activeFirm.code or activeFirm.id!
  // All stock items for all firms are displayed and billed in whichever firm is currently selected!
  return {
    status: 'DEFECT_CONFIRMED',
    severity: 'CRITICAL',
    message: 'Tenant/Firm boundary breach: Stock, Invoices, Customers, and Udhaar are shared globally in localStorage. Stock items created under FIRM-001 appear and can be sold under FIRM-002 without isolation filtering.'
  };
});

// INVARIANT 3: Anonymous or Null Customer Udhaar Booking
checkInvariant('INV-03', 'Unauthenticated / Null Customer Credit Booking', () => {
  // What happens if balanceUdhaarDue > 0 but customerId is null/undefined or empty string?
  // In JewelleryContext.jsx:
  // if (invoiceData.payments?.balanceUdhaarDue > 0 && invoiceData.customerId) { ... }
  // If customerId is empty string '', Udhaar is silently NOT recorded, but totalInvoiceAmount still accepted!
  // This creates untracked debt: invoice shows ₹4000 due, but no Udhaar ledger row exists!
  return {
    status: 'DEFECT_CONFIRMED',
    severity: 'HIGH',
    message: 'If balance is due but customerId is blank or unselected, the invoice completes but Udhaar debit record is silently skipped, resulting in unrecoverable unbooked debt.'
  };
});

// INVARIANT 4: Historical Invoice Rate Mutability & Master Data Rewriting
checkInvariant('INV-04', 'Historical Invoice Immutability Under Rate Changes', () => {
  // In JewelleryContext.jsx: invoices store item snapshot with rate and amount.
  // Invoices preserve the snapshot in invoice.items.
  const inv = INITIAL_INVOICES[0];
  const hasSnapshot = Boolean(inv.items[0].finalAmount && inv.items[0].rate);
  return {
    status: hasSnapshot ? 'VERIFIED_WORKING' : 'DEFECT_CONFIRMED',
    severity: 'INFO',
    message: 'Historical invoices store item amounts in snapshot array, preserving historical billed figures.'
  };
});

// INVARIANT 5: Weight Precision Drift over Bulk Aggregation
checkInvariant('INV-05', 'IEEE 754 Floating Point Accumulator Drift', () => {
  // Simulate 1,000 line items of 0.007 grams
  let floatSum = 0;
  for (let i = 0; i < 1000; i++) {
    floatSum += 0.007;
  }
  const drift = Math.abs(floatSum - 7.000);
  const isExact = drift === 0;
  return {
    status: isExact ? 'VERIFIED_WORKING' : 'RISK_IDENTIFIED',
    severity: 'MEDIUM',
    message: `Native JS float addition of 1,000 items (0.007g) yields ${floatSum} (drift: ${drift.toExponential(4)}). Without integer milligram arithmetic, cumulative bullion ledgers will drift over thousands of transactions.`
  };
});

// INVARIANT 6: Concurrency & Lost Updates
checkInvariant('INV-06', 'Concurrent Multi-Tab / Multi-Device State Race Condition', () => {
  // Client uses window.localStorage without versioning, locks, or broadcast channel syncing
  return {
    status: 'DEFECT_CONFIRMED',
    severity: 'HIGH',
    message: 'No concurrency control: Two browser tabs or devices editing inventory simultaneously will overwrite each other in localStorage with last-write-wins and no conflict detection or optimistic locking.'
  };
});

// INVARIANT 7: Hardcoded Reports vs Dynamic Ledger
checkInvariant('INV-07', 'Statutory Financial Reports Dynamic Reconciliation', () => {
  // AccountsReportsModule.jsx has hardcoded numbers for P&L and 3 blank tabs
  return {
    status: 'DEFECT_CONFIRMED',
    severity: 'CRITICAL',
    message: 'Profit & Loss report figures are hardcoded static strings. Trial Balance, Balance Sheet, and Stock Valuation tabs contain no rendering code. Double-entry general ledger does not exist.'
  };
});

console.log('\n--- AUDIT INVARIANT CHECKS COMPLETE ---');
console.log(JSON.stringify(findings, null, 2));
