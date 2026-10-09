const ISSUER_FIELDS = ['name', 'code', 'gstin', 'pan', 'regNo', 'address', 'city', 'state',
  'phone', 'tagline', 'bankName', 'branch', 'accountNumber', 'ifscCode', 'upiId', 'footerInfo', 'diwaliBannerText'];

export function snapshotIssuer(firm) {
  return Object.fromEntries(ISSUER_FIELDS.map(key => [key, String(firm[key] ?? '')]));
}

export function invoiceSettlement(invoice, receipts) {
  const paidLater = receipts.filter(receipt => receipt.invoiceId === invoice.id && receipt.firmId === invoice.firmId)
    .reduce((sum, receipt) => sum + Math.round(Number(receipt.amount) * 100), 0);
  const originalDue = Math.round(Number(invoice.payments?.balanceUdhaarDue ?? 0) * 100);
  return {
    outstanding: Math.max(0, originalDue - paidLater) / 100,
    received: (Math.round(Number(invoice.payments?.totalReceived ?? 0) * 100) + paidLater) / 100
  };
}

// Demonstration journal arithmetic only; authoritative pricing still needs a backend.
export function invoiceJournal(invoice, bankName = 'Bank') {
  const paise = (value, signed = false) => {
    const amount = Number(value ?? 0);
    const result = Math.round(amount * 100);
    if (!Number.isFinite(amount) || !Number.isSafeInteger(result) || Math.abs(amount * 100 - result) > 0.00001 || (!signed && amount < 0)) {
      throw new Error('Invoice amounts must be finite, use at most two decimals and be non-negative.');
    }
    return result;
  };
  const p = invoice.payments ?? {};
  const cash = paise(p.cash);
  const bank = paise(p.cheque) + paise(p.card) + paise(p.online);
  const loyalty = paise(p.loyaltyRedeemed);
  const due = paise(p.balanceUdhaarDue);
  const taxable = paise(invoice.taxableAmount);
  const tax = paise(invoice.totalTax);
  const total = paise(invoice.totalInvoiceAmount);
  const oldMetal = invoice.hasOldGold ? paise(invoice.metalReceived?.valuationAmount) : 0;
  const roundOff = paise(invoice.roundOff, true);
  if (oldMetal > taxable + tax) throw new Error('Exchange credit exceeds sale value. Separate settlement is required.');
  if (Math.abs(roundOff) > 50) throw new Error('Invalid invoice rounding adjustment.');
  if (tax !== paise(invoice.cgst) + paise(invoice.sgst) || total !== taxable + tax - oldMetal + roundOff) {
    throw new Error('Invoice totals do not reconcile.');
  }
  if (paise(p.excessReceived) !== 0) throw new Error('Excess payment requires a change/refund workflow. Enter the exact tender retained.');
  if (cash + bank + loyalty + due !== total || paise(p.totalReceived) !== cash + bank + loyalty) {
    throw new Error('Invoice payments do not reconcile.');
  }
  const debits = [], credits = [];
  const add = (side, account, amount) => { if (amount) side.push({ account, amount: amount / 100 }); };
  add(debits, 'Cash in Hand (Counter)', cash);
  add(debits, `${bankName} (Current A/c)`, bank);
  add(debits, `Customer Udhaar Debtors (${invoice.customerName})`, due);
  add(debits, 'Old Gold Scrap Asset', oldMetal);
  add(debits, 'Loyalty Expense', loyalty);
  add(credits, 'Gold & Silver Sales Revenue', taxable);
  add(credits, 'GST Output Tax (CGST + SGST)', tax);
  add(roundOff < 0 ? debits : credits, 'Invoice Rounding', Math.abs(roundOff));
  return { debits, credits };
}
