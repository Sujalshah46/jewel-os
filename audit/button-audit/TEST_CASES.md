# Button Test Cases and Verification Evidence

This document contains step-by-step test execution logs, input test data, expected behaviors, and actual observed results across all critical button controls in Jewellery OS.

---

## 1. POS Billing & Barcode Workflow (`BillingModule.jsx`)

### Test Case TC-BILL-01: Quick Add from Inventory to Billing Cart
- **Control ID:** `BILL-007`
- **Location:** Quick add buttons below barcode input
- **Test Steps:**
  1. Open POS Billing counter (`activeModule = 'billing'`).
  2. Click on quick add item `LRING29 (1201)`.
- **Expected Result:**
  - Barcode query is passed immediately into `handleBarcodeScan(null, '1201')` without race condition or state delay.
  - Cart item is instantiated with Gold 22K (91.67%), gross weight 2.000g, less weight 0.050g, net weight 1.950g, hallmark fee ₹45.
  - Final value equals ₹17,144.38.
- **Actual Result:**
  - Item was appended to `cartItems` array immediately.
  - Tax calculation updated to CGST ₹249.68, SGST ₹249.68.
  - **Verdict:** PASS

### Test Case TC-BILL-02: Sold Item Re-scan Prevention (Double Selling Guard)
- **Control ID:** `BILL-006`
- **Location:** Barcode submit form
- **Test Steps:**
  1. Complete a sale for item `LRING29 (1201)` so status becomes `'Sold'`.
  2. Attempt to scan or enter barcode `1201` into the barcode input.
  3. Click "Add Item" button.
- **Expected Result:**
  - Alert displays: `Cannot add item "LRING29": This item is already marked as Sold.`
  - Item is blocked from being added to cart.
- **Actual Result:**
  - Guard condition triggers: `if (found.status === 'Sold')` halts processing.
  - Alert modal prevents double checkout.
  - **Verdict:** PASS

### Test Case TC-BILL-03: Submit & Print Invoice
- **Control ID:** `BILL-004` & `BILL-013`
- **Location:** Top and bottom submit buttons
- **Test Steps:**
  1. Add items to cart.
  2. Select Customer `Rohan Verma` (with mobile and GSTIN).
  3. Enter Payment Received ₹20,000 via Cash.
  4. Click "SUBMIT & PRINT TAX INVOICE".
- **Expected Result:**
  - `handleSubmitInvoice(true)` invokes `createInvoice()`.
  - Stock item status flips to `'Sold'`.
  - Invoice preview modal (`InvoiceViewModal.jsx`) opens with generated invoice number `INV-...`.
  - `window.print()` triggers when requested.
- **Actual Result:**
  - Invoice created cleanly with zero balance debt.
  - Modal displayed with A4 Tax Invoice, A5 Half-Page, and 3-Inch POS formats.
  - **Verdict:** PASS

---

## 2. Safe Arithmetic Calculators (`RightSidebar.jsx` & `CalculatorModal.jsx`)

### Test Case TC-CALC-01: Safe Expression Evaluation Without Eval
- **Control ID:** `SIDE-003` & `CALC-002`
- **Location:** Calculator grid keypad buttons
- **Test Steps:**
  1. Enter sequence: `100 * 22 / 24 + 50`.
  2. Click `=` button.
- **Expected Result:**
  - Expression is parsed by recursive-descent parser `safeEvaluateMath`.
  - No `eval()` or `Function()` constructor is executed.
  - Result computed accurately: `141.6666...`.
- **Actual Result:**
  - `safeEvaluateMath('100*22/24+50')` returned `141.66666666666666`.
  - Input safely sanitized of any script tokens.
  - **Verdict:** PASS

### Test Case TC-CALC-02: Syntax Error & Division by Zero Guard
- **Control ID:** `SIDE-003` & `CALC-002`
- **Location:** Calculator grid
- **Test Steps:**
  1. Enter invalid input sequence: `100 / 0` or `++--*`.
  2. Click `=` button.
- **Expected Result:**
  - System catches error safely and displays `'Error'` on screen without throwing unhandled React crash.
- **Actual Result:**
  - Parser caught division by zero and returned `'Error'`. UI remains responsive.
  - **Verdict:** PASS

---

## 3. Daily Rates Master Table & Multi-Format Exports (`DailyRatesModule.jsx`)

### Test Case TC-RATE-01: Clipboard Copy of Daily Rates
- **Control ID:** `RATE-005`
- **Location:** Master toolbar "Copy" button
- **Test Steps:**
  1. Open Daily Rates Master (`activeModule = 'daily_rates'`).
  2. Click "Copy" button.
- **Expected Result:**
  - All 9 active metal rates are formatted into tab-delimited text and copied to `navigator.clipboard`.
  - User receives confirmation alert.
- **Actual Result:**
  - Formatted string `GOLD-91.67 (22 K)\t6600.24\t66002.4` copied successfully.
  - **Verdict:** PASS

### Test Case TC-RATE-02: CSV & Excel Export
- **Control ID:** `RATE-006` & `RATE-007`
- **Location:** Master toolbar "CSV" and "Excel" buttons
- **Test Steps:**
  1. Click "CSV" button.
  2. Click "Excel" button.
- **Expected Result:**
  - Generates downloadable CSV data URI with columns: `Metal, Purity, Karat, Rate/Gram, Rate/10g, Tax 3%, Rate Inc. Tax`.
  - Triggers automatic browser file download.
- **Actual Result:**
  - Filename `Daily_Rates_2026-10-06.csv` downloaded with valid rate entries.
  - **Verdict:** PASS

### Test Case TC-RATE-03: Purge Confirmation Modal
- **Control ID:** `RATE-010`, `RATE-011`, `RATE-012`
- **Location:** Pink "Delete All Rates" button
- **Test Steps:**
  1. Click "Delete All Rates" button.
  2. Verify modal appears with warning prompt.
  3. Click "Cancel". Verify rates remain intact.
  4. Click "Delete All Rates" again, then click "Yes, Delete All".
- **Expected Result:**
  - Accidental click does not clear database.
  - Rates are cleared only upon explicit confirmation.
- **Actual Result:**
  - Rates preserved when clicking cancel; cleared when confirming modal.
  - **Verdict:** PASS

---

## 4. Karigar Metal Ledger & Issue/Receive Vouchers (`KarigarModule.jsx`)

### Test Case TC-KAR-01: Bullion Issue to Goldsmith
- **Control ID:** `KAR-001` & `KAR-009`
- **Location:** "Issue Raw Bullion" button and form submit
- **Test Steps:**
  1. Click "Issue Raw Bullion".
  2. Select Karigar "Ganesh Sutar (Handmade Specialist)".
  3. Select Metal "Gold 24K", Purity 99.9%, Weight 10.000g.
  4. Click "Confirm & Issue Bullion".
- **Expected Result:**
  - `issueMetalToKarigar` action updates karigar `pureGoldBalance` (+9.990g).
  - New issue voucher logged in voucher audit history.
- **Actual Result:**
  - Pure gold balance increased from 2.500g to 12.490g.
  - Modal dismissed cleanly.
  - **Verdict:** PASS

### Test Case TC-KAR-02: Ornament Receipt & Labour Accounting
- **Control ID:** `KAR-002` & `KAR-012`
- **Location:** "Receive Finished Ornament" button and form submit
- **Test Steps:**
  1. Click "Receive Finished Ornament".
  2. Select "Ganesh Sutar", enter ornament name "Antique Choker Necklace".
  3. Gross Weight: 25.000g, Pure Returned: 22.900g, Wastage Allowed: 0.800g.
  4. Labour Charges: ₹7,500.
  5. Click "Receive Ornament & Credit Labour".
- **Expected Result:**
  - `receiveOrnamentFromKarigar` decreases karigar gold balance and credits labour due.
  - New receipt voucher logged.
- **Actual Result:**
  - Labour charges due credited to Karigar ledger (+₹7,500).
  - Net pure metal balance accurately deducted.
  - **Verdict:** PASS

---

## 5. Bishi Monthly Installment Passbook (`SchemeModule.jsx`)

### Test Case TC-SCH-01: Customer Scheme Enrollment
- **Control ID:** `SCH-001` & `SCH-006`
- **Location:** "Enroll Customer" modal and submit button
- **Test Steps:**
  1. Click "+ Enroll Customer in Scheme".
  2. Select customer "Rohan Verma", Scheme "11+1 Dhanvarsha Gold Scheme (12 Mos)".
  3. Monthly installment ₹5,000.
  4. Click "Confirm Enrollment & Issue Passbook".
- **Expected Result:**
  - New passbook created with status `'Active'`, 0 installments paid, total deposited ₹0.
- **Actual Result:**
  - Account rendered under active passbooks table with "Pay Installment" button enabled.
  - **Verdict:** PASS

### Test Case TC-SCH-02: Record Monthly Installment
- **Control ID:** `SCH-003` & `SCH-009`
- **Location:** "Pay Installment" row action and submit button
- **Test Steps:**
  1. Click "Pay Installment" on Rohan Verma's passbook.
  2. Confirm payment mode "UPI / QR Code", amount ₹5,000.
  3. Click "Record Installment Payment".
- **Expected Result:**
  - Installment count increments (1/12).
  - Total paid becomes ₹5,000.
  - Next due date advances by 1 calendar month.
- **Actual Result:**
  - Passbook updated live, progress bar reflects 8.3% completion.
  - **Verdict:** PASS

---

## 6. Accounts & Statutory GSTR-1 Tax Export (`AccountsReportsModule.jsx`)

### Test Case TC-ACC-01: GSTR-1 Government JSON Export
- **Control ID:** `ACC-003`
- **Location:** "Export Govt JSON/Excel" button
- **Test Steps:**
  1. Navigate to "Accounts & Reports" -> "GST GSTR-1 TAX REPORT".
  2. Click "Export Govt JSON/Excel" button.
- **Expected Result:**
  - Compiles all recorded invoices into statutory GSTN schema with fields `gstin`, `fp`, `b2b`, `inum`, `idt`, `val`, `txval`, `camt`, `samt`.
  - Downloads `GSTR1_27AAACK1234F1Z5_2026-10-06.json`.
- **Actual Result:**
  - JSON payload verified with valid tax amounts (HSN 7113, CGST 1.5%, SGST 1.5%).
  - File downloaded without error.
  - **Verdict:** PASS

---

## 7. Firm Master Multi-Enterprise Switching & Help Modal (`FirmMasterModule.jsx`)

### Test Case TC-FIRM-01: Help Compliance Modal
- **Control ID:** `FIRM-001`
- **Location:** Top "HELP" button
- **Test Steps:**
  1. Navigate to "Firm Master" module.
  2. Click "HELP" button.
- **Expected Result:**
  - Modal opens with GSTIN, BIS Hallmark, Multi-Firm Policy, and E-Invoicing guidance.
  - Close button and "Got it" button dismiss dialog cleanly.
- **Actual Result:**
  - `showHelp` state activates modal overlay; keyboard and click handlers dismiss dialog.
  - **Verdict:** PASS

### Test Case TC-FIRM-02: Switch Operating Firm
- **Control ID:** `FIRM-004`
- **Location:** "Make Active" table button
- **Test Steps:**
  1. In the Firms table, locate secondary firm "Krishna Bullion Refinery (KBR)".
  2. Click "Make Active".
- **Expected Result:**
  - `activeFirm` in global context flips to KBR.
  - Header brand, invoice print headers, and stock registers dynamically update to KBR.
- **Actual Result:**
  - Active badge moves to KBR. POS and reports reflect KBR context immediately.
  - **Verdict:** PASS
