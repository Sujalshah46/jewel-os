/**
 * Invoices/sales API adapter — Phase 3 strangler.
 *
 * Exposes the same state/action shape as the local `createInvoice` in
 * JewelleryContext (invoices, createInvoice, loading/error, refetch), but
 * talks to the backend instead of localStorage:
 *
 *   POST /v1/sales/invoices            → draft (backend recomputes ALL prices)
 *   POST /v1/sales/invoices/:id/finalize (Idempotency-Key, exact tender total)
 *   GET  /v1/sales/invoices/:id/print-data → immutable receipt snapshot
 *   GET  /v1/sales/invoices?limit&cursor  → initial list load
 *
 * DEPENDENCIES (API mode):
 * - Customers adapter must be active: invoiceData.customerId is expected to be
 *   a server UUID. Non-UUID values are rejected by the backend (422).
 * - Stock adapter should be active: cart item `itemId` is expected to be a
 *   server tagged_item UUID. Non-UUID ids are sent as untagged lines
 *   (tagged_item_id: null) — the sale goes through but no server stock is
 *   consumed.
 *
 * KNOWN LIMITATIONS (documented, not silently worked around):
 * - UDHAAR (credit) sales are BLOCKED: the backend finalize requires payments
 *   to sum exactly to the grand total (I-5) and has no credit tender yet.
 *   createInvoice throws a clear error before any server call.
 * - OLD-GOLD exchange is BLOCKED: finalize has no old-gold credit input yet.
 *   Throws before any server call rather than overcharging the customer.
 * - The backend recomputes prices with the LEGACY pricing policy
 *   (legacy-pending-d15): hallmark charges, other charges and item discounts
 *   from the frontend cart are NOT part of the server total. Tender amounts
 *   are adjusted by the (usually ±₹1) delta so they match the server grand
 *   total exactly; the adjustment lands on the largest tender.
 * - createInvoice is ASYNC in API mode (the local one is sync). The parent
 *   rewiring BillingModule for await.
 * - finalize requires an open shift on the branch (backend 409 NO_OPEN_SHIFT).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, newIdempotencyKey } from '../api.js';
import { numberToWordsIndian } from '../../utils/numberToWords.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Frontend payment key -> backend tender.
const TENDER_MAP = {
  cash: 'cash',
  cheque: 'bank',
  card: 'card',
  online: 'upi',
  loyaltyRedeemed: 'loyalty',
};
// Backend tender -> frontend payment key (round-trip for the receipt view).
const FRONTEND_KEY_BY_TENDER = {
  cash: 'cash',
  bank: 'cheque',
  card: 'card',
  upi: 'online',
  loyalty: 'loyaltyRedeemed',
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmtMoney = (n) => String(round2(n));
const fmtWeight = (n) => {
  const v = Number(n) || 0;
  return (Math.round(v * 1000) / 1000).toFixed(3);
};

function friendlyMessage(err) {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'NO_OPEN_SHIFT':
        return 'No open shift for this branch. Open a shift before billing.';
      case 'ITEM_NOT_AVAILABLE':
        return 'An item in this bill was just sold or moved and is no longer available. Please re-check stock and retry.';
      case 'ITEM_NOT_FOUND':
        return 'A billed item was not found on the server. It may belong to local-only stock.';
      case 'ITEM_WRONG_BRANCH':
        return 'A billed item belongs to a different branch and cannot be sold here.';
      case 'PAYMENT_MISMATCH':
        return 'Payment total did not match the server-computed invoice total. Please retry the bill.';
      case 'INVOICE_NOT_DRAFT':
        return 'This invoice was already finalized (possible double-submit). Check the invoice list.';
      default:
        return err.message || 'Saving the invoice failed.';
    }
  }
  return (err && err.message) || 'Saving the invoice failed.';
}

/** Map one frontend cart item to a backend invoice line. Prices are inputs only — the backend recomputes. */
function mapLine(item) {
  const makingMode = ['per_gram', 'fixed', 'percent'].includes(item.makingChargeType)
    ? item.makingChargeType
    : 'per_gram';
  return {
    tagged_item_id: item.itemId && UUID_RE.test(String(item.itemId)) ? String(item.itemId) : null,
    description: item.description || item.itemCode || 'Jewellery item',
    gross_wt: fmtWeight(item.grossWeight),
    net_wt: fmtWeight(item.netWeight),
    stone_wt: fmtWeight(item.stoneWeight || 0),
    rate_per_gram: fmtMoney(item.ratePerGram),
    making_mode: makingMode,
    making_value: fmtMoney(item.makingChargeValue),
    stone_value: fmtMoney(item.stoneValue),
    tax_rate: 0.03, // legacy illustrative default, mirrors backend default
  };
}

/** Light mapping for the list endpoint (no customer join, no lines — detail comes from print-data). */
function mapListItem(b) {
  const tax = Number(b.tax_total) || 0;
  return {
    id: b.id,
    invoiceNo: b.doc_number,
    date: b.invoice_date,
    customerId: b.customer_id || null,
    customerName: undefined,
    taxableAmount: Number(b.subtotal) || 0,
    totalTax: tax,
    cgst: round2(tax / 2),
    sgst: round2(tax / 2),
    totalInvoiceAmount: Number(b.grand_total) || 0,
    status: b.status === 'finalized' ? 'Completed' : b.status,
    items: [],
    payments: {},
    _source: 'api',
  };
}

export function useInvoicesApi({ api, enabled, branchId, stock = [] }) {
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState(null);

  const branchIdRef = useRef(branchId);
  branchIdRef.current = branchId;
  const cachedBranchId = useRef(null);

  const resolveBranchId = useCallback(async () => {
    if (branchIdRef.current) return branchIdRef.current;
    if (cachedBranchId.current) return cachedBranchId.current;
    const res = await api.get('/v1/branches');
    const first = res && res.branches && res.branches[0];
    if (!first) throw new Error('No branches found on the server. Create a branch before billing.');
    cachedBranchId.current = first.id;
    return first.id;
  }, [api]);

  // Initial load (follows cursor pagination).
  const refetchInvoices = useCallback(async () => {
    if (!api) return;
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const all = [];
      let cursor = null;
      do {
        const page = await api.get('/v1/sales/invoices', {
          query: { limit: 100, ...(cursor ? { cursor } : {}) },
        });
        all.push(...(page.items || []));
        cursor = page.nextCursor || null;
      } while (cursor);
      setInvoices(all.map(mapListItem));
    } catch (err) {
      setInvoicesError(friendlyMessage(err));
    } finally {
      setInvoicesLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!enabled || !api) return;
    let cancelled = false;
    (async () => {
      setInvoicesLoading(true);
      setInvoicesError(null);
      try {
        const all = [];
        let cursor = null;
        do {
          const page = await api.get('/v1/sales/invoices', {
            query: { limit: 100, ...(cursor ? { cursor } : {}) },
          });
          all.push(...(page.items || []));
          cursor = page.nextCursor || null;
        } while (cursor && !cancelled);
        if (!cancelled) setInvoices(all.map(mapListItem));
      } catch (err) {
        if (!cancelled) setInvoicesError(friendlyMessage(err));
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, api]);

  const createInvoice = useCallback(async (invoiceData) => {
    setInvoicesError(null);

    // --- 1. Client-side guards (mirror local createInvoice; same messages) ---
    // INV-01: prevent double selling of serialized items.
    if (invoiceData.items && invoiceData.items.length > 0 && Array.isArray(stock) && stock.length > 0) {
      const billedItemIds = invoiceData.items.map((i) => i.itemId).filter(Boolean);
      const alreadySoldItem = stock.find((item) =>
        billedItemIds.includes(item.id) &&
        (item.status === 'Sold' || item.status === 'Sold Out'),
      );
      if (alreadySoldItem) {
        throw new Error(`Item "${alreadySoldItem.itemCode || alreadySoldItem.barcode || alreadySoldItem.id}" is already sold out and cannot be billed again.`);
      }
    }
    // INV-03: unbooked debt hazard — balance due requires a customer.
    const balanceDue = Number(invoiceData.payments?.balanceUdhaarDue) || 0;
    if (balanceDue > 0 && !invoiceData.customerId) {
      throw new Error(`Outstanding balance (Udhaar) of ₹${balanceDue.toLocaleString('en-IN')} requires an enrolled customer account.`);
    }
    // Negative payment amounts.
    const p = invoiceData.payments || {};
    const cash = Number(p.cash) || 0;
    const cheque = Number(p.cheque) || 0;
    const card = Number(p.card) || 0;
    const online = Number(p.online) || 0;
    const loyalty = Number(p.loyaltyRedeemed) || 0;
    if (cash < 0 || cheque < 0 || card < 0 || online < 0 || loyalty < 0 || balanceDue < 0) {
      throw new Error('Payment amounts cannot be negative.');
    }
    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('Cannot create an invoice with no items.');
    }
    // API-mode limitations: fail fast with a clear message, before any server call.
    if (balanceDue > 0) {
      throw new Error(
        'Udhaar (credit) sales are not supported in API mode yet — the server requires full payment when finalizing. ' +
        'Collect the full amount or switch back to local mode.',
      );
    }
    if (invoiceData.hasOldGold && invoiceData.metalReceived) {
      throw new Error(
        'Old-gold exchange is not supported in API mode yet. Complete the sale without old gold or switch back to local mode.',
      );
    }

    // --- 2. Draft ---
    const branch_id = await resolveBranchId();
    const invoiceDate = invoiceData.date || new Date().toISOString().slice(0, 10);
    const lines = invoiceData.items.map(mapLine);
    let draft;
    try {
      draft = await api.post('/v1/sales/invoices', {
        branch_id,
        customer_id: invoiceData.customerId || null,
        invoice_date: invoiceDate,
        business_date: invoiceDate,
        lines,
      });
    } catch (err) {
      const msg = friendlyMessage(err);
      setInvoicesError(msg);
      throw err instanceof ApiError ? new Error(msg) : err;
    }

    // --- 3. Payments: server grand total is authoritative; adjust the
    // largest tender by the (usually ±₹1 rounding) delta so the sum is exact.
    const serverGrand = round2(Number(draft.grand_total) || 0);
    let tenders = Object.entries(TENDER_MAP)
      .map(([frontKey, tender]) => ({ frontKey, tender, amount: round2(Number(p[frontKey]) || 0) }))
      .filter((t) => t.amount > 0);
    const received = round2(tenders.reduce((s, t) => s + t.amount, 0));
    if (tenders.length === 0) {
      // Best-effort cleanup, then a clear error.
      try { await api.post(`/v1/sales/invoices/${draft.invoice_id}/discard`, {}); } catch { /* ignore */ }
      throw new Error('No payment was entered. The server requires the full invoice amount to finalize.');
    }
    const delta = round2(serverGrand - received);
    if (delta !== 0) {
      tenders.sort((a, b) => b.amount - a.amount);
      tenders[0].amount = round2(tenders[0].amount + delta);
      if (tenders[0].amount <= 0) {
        try { await api.post(`/v1/sales/invoices/${draft.invoice_id}/discard`, {}); } catch { /* ignore */ }
        throw new Error('Entered payments differ too far from the server-computed total. Please re-check the bill.');
      }
    }

    // --- 4. Finalize (idempotent) ---
    let finalizeResult;
    try {
      finalizeResult = await api.post(
        `/v1/sales/invoices/${draft.invoice_id}/finalize`,
        { payments: tenders.map((t) => ({ tender: t.tender, amount: fmtMoney(t.amount) })) },
        { idempotencyKey: newIdempotencyKey() },
      );
    } catch (err) {
      // Never leave orphan drafts behind on a failed finalize.
      try { await api.post(`/v1/sales/invoices/${draft.invoice_id}/discard`, {}); } catch { /* ignore */ }
      const msg = friendlyMessage(err);
      setInvoicesError(msg);
      throw err instanceof ApiError ? new Error(msg) : err;
    }

    // --- 5. Immutable receipt snapshot ---
    const print = await api.get(`/v1/sales/invoices/${draft.invoice_id}/print-data`);

    // --- 6. Map to the frontend shape InvoiceViewModal/BillingModule expect ---
    let cgst = 0;
    let sgst = 0;
    for (const l of print.lines || []) {
      const bd = (l.price_snapshot && l.price_snapshot.breakdown) || {};
      cgst += Number(bd.cgst) || 0;
      sgst += Number(bd.sgst) || 0;
    }
    const grand = round2(Number(print.grand_total) || 0);
    const postedPayments = { ...(invoiceData.payments || {}) };
    for (const t of tenders) postedPayments[FRONTEND_KEY_BY_TENDER[t.tender]] = t.amount;
    postedPayments.totalReceived = grand;
    postedPayments.balanceUdhaarDue = 0;
    postedPayments.excessReceived = 0;

    const invoice = {
      ...invoiceData,
      id: print.id,
      invoiceNo: print.doc_number,
      date: print.invoice_date,
      status: 'Completed',
      taxableAmount: round2(Number(print.subtotal) || 0),
      totalTax: round2(Number(print.tax_total) || 0),
      cgst: round2(cgst),
      sgst: round2(sgst),
      totalInvoiceAmount: grand,
      payableInWords: numberToWordsIndian(Math.round(grand)),
      payments: postedPayments,
      _server: {
        fy: print.fy_code,
        taxRule: print.tax_rule_version,
        finalizedAt: print.finalized_at,
        replayed: !!finalizeResult.replayed,
      },
    };

    setInvoices((prev) => [invoice, ...prev]);
    return invoice;
  }, [api, resolveBranchId, stock]);

  return { invoices, createInvoice, invoicesLoading, invoicesError, refetchInvoices };
}

export default useInvoicesApi;
