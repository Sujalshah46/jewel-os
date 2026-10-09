/**
 * Udhaar / Girvi loans API adapter (Phase 3 strangler).
 *
 * Drop-in replacement for the local udhaar actions in JewelleryContext
 * (recordUdhaarDeposit / createGirviLoan). Same frontend state shape, so
 * components never change.
 *
 * Backend contract (jewelry-os-server, src/modules/udhaar):
 * - POST /v1/udhaar/loans { branch_id, customer_id, loan_type ('udhaar_debit'|'girvi'),
 *          principal (decimal string), roi_monthly_pct (number), issue_date (YYYY-MM-DD),
 *          due_date?, pledged_gold_gross_wt?, pledged_gold_fine_wt?, external_ref? }
 *        -> { loan }                                        (udhaar:write, 201)
 * - GET  /v1/udhaar/loans?status=&customer_id=&cursor=&limit=
 *        -> { loans: [...], next_cursor }                   (udhaar:read)
 * - GET  /v1/udhaar/loans/:id -> { loan, repayments }        (udhaar:read)
 * - POST /v1/udhaar/loans/:id/repayments { amount (positive decimal string),
 *          tender ('cash'|'bank'|'card'|'upi'|'loyalty'), reference?, notes? }
 *        -> { repayment, balance_due, status }               (udhaar:write, 201)
 *        409 OVERPAYMENT when amount exceeds balance_due.
 * - POST /v1/udhaar/loans/:id/write-off { reason } -> { loan }  (udhaar:write)
 *
 * FIELD MAPPING (frontend udhaarList entry <-> backend loan):
 *   id                 <- loan.id
 *   invoiceNo          <- loan.external_ref (backend has no loan doc number;
 *                           the migration matched loans by external_ref)
 *   mainInvoiceNo      <- 'GIRVI-VOUCHER' for girvi, '' otherwise (frontend-only)
 *   date               <- loan.issue_date (YYYY-MM-DD)
 *   customerId         <- loan.customer_id
 *   customerName       <- resolved from the customers roster (backend returns no name)
 *   mobile             <- resolved from the customers roster
 *   transType          <- 'Girvi Gold Loan' | 'Udhaar Debit' (from loan_type)
 *   pledgedGoldGrossWt <- Number(loan.pledged_gold_gross_wt)
 *   pledgedGoldFineWt  <- Number(loan.pledged_gold_fine_wt)
 *   ornamentDetails    <- frontend-only (no backend column), '' on server loans
 *   principalAmount    <- Number(loan.principal)
 *   roiMonthlyPercent  <- Number(loan.roi_monthly_pct)
 *   dueDate            <- loan.due_date
 *   depositedAmount    <- principal - balance_due (derived, 2dp)
 *   leftBalance        <- Number(loan.balance_due)
 *   amountWithInterest <- Number(loan.principal) (mirrors local booking default)
 *   status             <- 'Active' | 'Closed' | 'Written Off' (from loan.status)
 *
 * FIELD MAPPING (frontend udhaarRepayments entry <-> backend repayment):
 *   id          <- repayment.id
 *   receiptNo   <- repayment.receipt_no (server-allocated LR series)
 *   loanId      <- repayment.loan_id
 *   invoiceNo   <- parent loan's invoiceNo (frontend ref)
 *   customerId  <- parent loan's customer_id
 *   customerName<- resolved from the customers roster
 *   date        <- repayment.created_at (YYYY-MM-DD)
 *   timestamp   <- repayment.created_at
 *   amount      <- Number(repayment.amount)
 *   paymentMode <- 'Cash' | 'Online/UPI' | 'Bank' | 'Card' | 'Loyalty' (from tender)
 *   reference   <- repayment.reference
 *   notes       <- repayment.notes
 *   operator    <- 'Store Cashier' (backend only stores created_by uuid)
 *
 * Money: the backend speaks decimal strings. Number()/String() conversion
 * happens at this boundary only. Optimistic updates roll back on failure,
 * mirroring the local recordUdhaarDeposit guards (amount > 0, never overpays).
 *
 * Usage (wired by the parent, never here):
 *   const { udhaarList, udhaarRepayments, udhaarLoading, udhaarError,
 *           refetchUdhaar, addUdhaarLoan, recordUdhaarRepayment, writeOffLoan } =
 *     useUdhaarApi({ api, enabled, branchId, customers });
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ApiError } from '../api.js';

const TENDER_TO_MODE = {
  cash: 'Cash',
  bank: 'Bank',
  card: 'Card',
  upi: 'Online/UPI',
  loyalty: 'Loyalty',
};

const MODE_TO_TENDER = {
  Cash: 'cash',
  'Online/UPI': 'upi',
  Bank: 'bank',
  Card: 'card',
  Loyalty: 'loyalty',
};

const STATUS_TO_LABEL = {
  active: 'Active',
  closed: 'Closed',
  written_off: 'Written Off',
};

/** Decimal string at the API boundary; no float math on money. */
const dec = (v) => String(Number(v));

const round2 = (v) => Number(Number(v).toFixed(2));

const todayISO = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

function friendlyUdhaarError(err, context) {
  const tail = context === 'save' ? ' Your change was not saved.' : '';
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR') return `Could not reach the server.${tail} Check your connection.`;
    if (err.status === 401) return 'Your session expired. Please sign in again.';
    if (err.status === 403) return 'You do not have permission to manage loans. Ask your administrator for udhaar access.';
    if (err.code === 'OVERPAYMENT') return `Repayment exceeds the remaining loan balance.${tail}`;
    if (err.code === 'LOAN_NOT_ACTIVE') return `This loan is no longer active.${tail}`;
    if (err.code === 'LOAN_NOT_FOUND') return 'Loan not found. It may have been removed.';
    if (err.code === 'BRANCH_NOT_FOUND') return 'Branch not found. Pick a valid branch and retry.';
    if (err.code === 'PARTY_NOT_FOUND' || err.code === 'PARTY_NOT_CUSTOMER') {
      return 'Select a valid customer for this loan.';
    }
    return `Loan ${context === 'save' ? 'update' : 'load'} failed: ${err.message || err.code}.${tail}`;
  }
  return `Loan ${context === 'save' ? 'update' : 'load'} failed: ${(err && err.message) || 'unknown error'}.${tail}`;
}

/**
 * Resolve a customer id to { name, mobile } from a customer roster.
 * The backend returns no customer names on loans, so the frontend joins
 * them from the customers roster (same pattern as the invoices adapter).
 */
function resolveCustomer(list, customerId) {
  if (!customerId) return null;
  const found = (list || []).find((c) => c.id === customerId);
  if (!found) return null;
  const name =
    String(found.fullName || '').trim() ||
    `${found.firstName || ''} ${found.lastName || ''}`.trim() ||
    String(found.name || '').trim();
  return { name, mobile: found.mobile || found.phone || '' };
}

/**
 * Backend loan -> frontend udhaarList entry.
 * customerList: the frontend customers roster (backend returns no names).
 */
function toFrontendLoan(loan, customerList) {
  const principal = Number(loan.principal || 0);
  const balance = Number(loan.balance_due || 0);
  const isGirvi = String(loan.loan_type) === 'girvi';
  const cust = resolveCustomer(customerList, loan.customer_id) || {};
  return {
    id: loan.id,
    invoiceNo: loan.external_ref || `LOAN-${String(loan.id).slice(0, 8).toUpperCase()}`,
    mainInvoiceNo: isGirvi ? 'GIRVI-VOUCHER' : '',
    date: loan.issue_date || todayISO(),
    customerId: loan.customer_id || '',
    customerName: cust.name || '',
    mobile: cust.mobile || '',
    transType: isGirvi ? 'Girvi Gold Loan' : 'Udhaar Debit',
    pledgedGoldGrossWt: Number(loan.pledged_gold_gross_wt || 0),
    pledgedGoldFineWt: Number(loan.pledged_gold_fine_wt || 0),
    ornamentDetails: '',
    principalAmount: principal,
    roiMonthlyPercent: Number(loan.roi_monthly_pct || 0),
    dueDate: loan.due_date || '',
    depositedAmount: round2(principal - balance),
    leftBalance: round2(balance),
    amountWithInterest: principal,
    status: STATUS_TO_LABEL[loan.status] || 'Active',
    // Backend metadata (harmless to components).
    branchId: loan.branch_id || null,
    loanType: loan.loan_type,
    createdAt: loan.created_at,
  };
}

/** Backend repayment -> frontend udhaarRepayments entry. */
function toFrontendRepayment(repayment, loanEntry, customerList) {
  const cust = resolveCustomer(customerList, loanEntry ? loanEntry.customerId : null) || {};
  const createdAt = String(repayment.created_at || '');
  return {
    id: repayment.id,
    receiptNo: repayment.receipt_no || '',
    firmId: loanEntry ? loanEntry.firmId : undefined,
    firmCode: loanEntry ? loanEntry.firmCode : undefined,
    loanId: repayment.loan_id,
    invoiceNo: loanEntry ? loanEntry.invoiceNo : '',
    customerId: loanEntry ? loanEntry.customerId : '',
    customerName: (loanEntry && loanEntry.customerName) || cust.name || '',
    date: createdAt.slice(0, 10) || todayISO(),
    timestamp: createdAt,
    amount: Number(repayment.amount || 0),
    paymentMode: TENDER_TO_MODE[repayment.tender] || 'Cash',
    reference: repayment.reference || '',
    operator: 'Store Cashier',
    notes: repayment.notes || '',
  };
}

/**
 * @param {{ api: object|null, enabled: boolean, branchId?: string|null,
 *           customers?: Array }} args
 *   api       — client from createApiClient (get/post); null until constructed
 *   enabled   — true only in api mode (VITE_DATA_SOURCE=api)
 *   branchId  — backend branch uuid; required for addUdhaarLoan
 *   customers — frontend customer roster, used to resolve names/mobiles
 * @returns {{ udhaarList, udhaarRepayments, udhaarLoading, udhaarError,
 *             refetchUdhaar, addUdhaarLoan, recordUdhaarRepayment, writeOffLoan }}
 */
export function useUdhaarApi({ api, enabled, branchId = null, customers = [] }) {
  const [serverLoans, setServerLoans] = useState([]);
  const [serverRepayments, setServerRepayments] = useState([]);
  const [udhaarLoading, setUdhaarLoading] = useState(false);
  const [udhaarError, setUdhaarError] = useState(null);

  const apiRef = useRef(api);
  apiRef.current = api;
  const branchRef = useRef(branchId);
  branchRef.current = branchId;
  const customersRef = useRef(customers);
  customersRef.current = customers;
  const loansRef = useRef(serverLoans);
  loansRef.current = serverLoans;

  // Frontend-shaped loan entries; customer names re-resolve whenever the
  // customer roster arrives or changes (loans carry no names from the API).
  const udhaarList = useMemo(
    () => serverLoans.map((loan) => toFrontendLoan(loan, customers)),
    [serverLoans, customers]
  );

  const loanById = useMemo(() => {
    const map = new Map();
    for (const u of udhaarList) map.set(u.id, u);
    return map;
  }, [udhaarList]);

  // Flat repayment ledger, newest first (mirrors the local prepend order).
  const udhaarRepayments = useMemo(
    () =>
      serverRepayments.map((r) =>
        toFrontendRepayment(r, loanById.get(r.loan_id) || null, customers)
      ),
    [serverRepayments, loanById, customers]
  );

  const load = useCallback(async (signal) => {
    const client = apiRef.current;
    if (!client) return;
    setUdhaarLoading(true);
    setUdhaarError(null);
    try {
      // Page through all loans (list is cursor-paginated).
      const loans = [];
      let cursor = null;
      do {
        const res = await client.get('/v1/udhaar/loans', {
          query: { limit: 100, ...(cursor ? { cursor } : {}) },
          signal,
        });
        const items = Array.isArray(res && res.loans) ? res.loans : [];
        for (const loan of items) loans.push(loan);
        cursor = (res && res.next_cursor) || null;
      } while (cursor);
      if (signal && signal.aborted) return;
      setServerLoans(loans);

      // Repayment history lives per-loan; fetch each loan's ledger so the
      // frontend's flat repayment view stays complete.
      const allRepayments = [];
      for (const loan of loans) {
        if (signal && signal.aborted) return;
        try {
          const detail = await client.get(`/v1/udhaar/loans/${loan.id}`, { signal });
          const reps = Array.isArray(detail && detail.repayments) ? detail.repayments : [];
          for (const r of reps) allRepayments.push(r);
        } catch {
          // A single unreadable loan must not fail the whole ledger load.
        }
      }
      if (signal && signal.aborted) return;
      // Newest first.
      allRepayments.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      setServerRepayments(allRepayments);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setUdhaarError(friendlyUdhaarError(err, 'load'));
    } finally {
      if (!signal || !signal.aborted) setUdhaarLoading(false);
    }
  }, []);

  // First load (and reload when the data source flips).
  useEffect(() => {
    if (!enabled) {
      setServerLoans([]);
      setServerRepayments([]);
      setUdhaarError(null);
      return;
    }
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [enabled, load]);

  const refetchUdhaar = useCallback(() => load(), [load]);

  /**
   * Optimistic loan create: temp entry replaced by the server record.
   * form: { customerId, principalAmount, roiMonthlyPercent, pledgedGoldGrossWt,
   *         pledgedGoldFineWt, dueDate?, issueDate?, transType?, invoiceNo?,
   *         ornamentDetails? }
   */
  const addUdhaarLoan = useCallback(async (form) => {
    const client = apiRef.current;
    if (!client) throw new Error('API client is not available');
    const bId = branchRef.current;
    if (!bId) throw new Error('Branch is not resolved yet. Please retry in a moment.');
    const customerId = String(form.customerId || '').trim();
    if (!customerId) throw new Error('Select a customer for this loan.');
    const principal = Number(form.principalAmount);
    if (!principal || principal <= 0) throw new Error('Loan principal must be greater than zero.');

    const isGirvi =
      /girvi/i.test(String(form.transType || '')) ||
      Number(form.pledgedGoldGrossWt || 0) > 0;
    const invoiceNo =
      String(form.invoiceNo || '').trim() ||
      `${isGirvi ? 'GIRVI' : 'UDHAAR'}-${Date.now().toString(36).toUpperCase()}`;
    const tempId = 'temp-loan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

    const optimisticServerLoan = {
      id: tempId,
      branch_id: bId,
      customer_id: customerId,
      loan_type: isGirvi ? 'girvi' : 'udhaar_debit',
      external_ref: invoiceNo,
      principal: dec(principal),
      roi_monthly_pct: String(Number(form.roiMonthlyPercent || 0)),
      issue_date: form.issueDate || todayISO(),
      due_date: form.dueDate || null,
      pledged_gold_gross_wt: dec(form.pledgedGoldGrossWt || 0),
      pledged_gold_fine_wt: dec(form.pledgedGoldFineWt || 0),
      balance_due: dec(principal),
      status: 'active',
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setServerLoans((prev) => [optimisticServerLoan, ...prev]);
    setUdhaarError(null);
    try {
      const body = {
        branch_id: bId,
        customer_id: customerId,
        loan_type: isGirvi ? 'girvi' : 'udhaar_debit',
        principal: dec(principal),
        roi_monthly_pct: Number(form.roiMonthlyPercent || 0),
        issue_date: form.issueDate || todayISO(),
        external_ref: invoiceNo,
      };
      if (form.dueDate) body.due_date = form.dueDate;
      if (isGirvi) {
        body.pledged_gold_gross_wt = dec(form.pledgedGoldGrossWt || 0);
        body.pledged_gold_fine_wt = dec(form.pledgedGoldFineWt || 0);
      }
      const res = await client.post('/v1/udhaar/loans', body);
      const created = res.loan;
      setServerLoans((prev) => prev.map((l) => (l.id === tempId ? created : l)));
      return toFrontendLoan(created, customersRef.current);
    } catch (err) {
      setServerLoans((prev) => prev.filter((l) => l.id !== tempId));
      const friendly = new Error(friendlyUdhaarError(err, 'save'));
      setUdhaarError(friendly.message);
      throw friendly;
    }
  }, []);

  /**
   * Optimistic repayment: appends to the ledger and reduces the balance, then
   * POSTs. Mirrors the local recordUdhaarDeposit guards (positive amount,
   * never overpays) — the server enforces the same with 409 OVERPAYMENT.
   */
  const recordUdhaarRepayment = useCallback(
    async (loanId, amount, paymentMode = 'Cash', reference = '', notes = '') => {
      const client = apiRef.current;
      if (!client) throw new Error('API client is not available');
      const depositAmt = Number(amount);
      if (!depositAmt || depositAmt <= 0) {
        throw new Error('Repayment deposit amount must be greater than zero.');
      }
      const target = loansRef.current.find((l) => l.id === loanId);
      if (!target) throw new Error('Target Udhaar/Loan record not found.');
      const balance = Number(target.balance_due || 0);
      if (depositAmt > balance) {
        throw new Error(
          `Repayment amount (₹${depositAmt.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${balance.toLocaleString('en-IN')}).`
        );
      }

      const tempId = 'temp-rep-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      const now = new Date().toISOString();
      const optimisticRepayment = {
        id: tempId,
        loan_id: loanId,
        receipt_no: 'PENDING',
        amount: dec(depositAmt),
        tender: MODE_TO_TENDER[paymentMode] || 'cash',
        reference: reference || null,
        notes: notes || null,
        created_by: null,
        created_at: now,
        _pending: true,
      };
      const prevBalance = target.balance_due;
      const prevStatus = target.status;
      const newBalance = dec(round2(balance - depositAmt));
      const newStatus = Number(newBalance) === 0 ? 'closed' : 'active';

      setServerRepayments((prev) => [optimisticRepayment, ...prev]);
      setServerLoans((prev) =>
        prev.map((l) => (l.id === loanId ? { ...l, balance_due: newBalance, status: newStatus } : l))
      );
      setUdhaarError(null);
      try {
        const body = {
          amount: dec(depositAmt),
          tender: MODE_TO_TENDER[paymentMode] || 'cash',
        };
        if (reference) body.reference = reference;
        if (notes) body.notes = notes;
        const res = await client.post(`/v1/udhaar/loans/${loanId}/repayments`, body);
        const serverRepayment = res.repayment;
        setServerRepayments((prev) => prev.map((r) => (r.id === tempId ? serverRepayment : r)));
        // Trust the server's authoritative balance/status (never overpays).
        setServerLoans((prev) =>
          prev.map((l) =>
            l.id === loanId ? { ...l, balance_due: res.balance_due, status: res.status } : l
          )
        );
        return serverRepayment;
      } catch (err) {
        setServerRepayments((prev) => prev.filter((r) => r.id !== tempId));
        setServerLoans((prev) =>
          prev.map((l) =>
            l.id === loanId ? { ...l, balance_due: prevBalance, status: prevStatus } : l
          )
        );
        const friendly = new Error(friendlyUdhaarError(err, 'save'));
        setUdhaarError(friendly.message);
        throw friendly;
      }
    },
    []
  );

  /**
   * Write off an active loan. Optimistic status flip, then a refresh so the
   * authoritative server state (and ledger) is what the UI keeps.
   */
  const writeOffLoan = useCallback(
    async (loanId, reason) => {
      const client = apiRef.current;
      if (!client) throw new Error('API client is not available');
      const why = String(reason || '').trim();
      if (!why) throw new Error('A reason is required to write off a loan.');
      const target = loansRef.current.find((l) => l.id === loanId);
      const prevStatus = target ? target.status : 'active';

      setServerLoans((prev) =>
        prev.map((l) => (l.id === loanId ? { ...l, status: 'written_off' } : l))
      );
      setUdhaarError(null);
      try {
        const res = await client.post(`/v1/udhaar/loans/${loanId}/write-off`, { reason: why });
        // Refresh from the server: authoritative state wins.
        await load();
        return res.loan;
      } catch (err) {
        setServerLoans((prev) =>
          prev.map((l) => (l.id === loanId ? { ...l, status: prevStatus } : l))
        );
        const friendly = new Error(friendlyUdhaarError(err, 'save'));
        setUdhaarError(friendly.message);
        throw friendly;
      }
    },
    [load]
  );

  return {
    udhaarList,
    udhaarRepayments,
    udhaarLoading,
    udhaarError,
    refetchUdhaar: refetchUdhaar,
    addUdhaarLoan,
    recordUdhaarRepayment,
    writeOffLoan,
  };
}
