/**
 * Daily Diary API adapter (Phase 3 strangler).
 *
 * The backend diary stores ONLY opening_balance + notes per (tenant, branch,
 * date). Every other figure is computed LIVE by GET /v1/diary/:date from the
 * source tables (invoices, payments, expenses, loans, loan_repayments,
 * scheme_installments) — the adapter never computes derived totals.
 *
 * ---------------------------------------------------------------------------
 * FIELD MAPPING (backend -> frontend dailyDiary shape)
 * ---------------------------------------------------------------------------
 * GET /v1/diary/:date?branch_id=...  ->  { entry, summary }
 *
 * entry (nullable row):
 *   entry_date            -> date            ('YYYY-MM-DD')
 *   opening_balance       -> openingBalance  (2dp decimal string -> Number)
 *   notes                 -> notes            (string | null)
 *   id / created_at       -> entryId / updatedAt (metadata)
 *
 * summary (live-computed; every money field is a 2dp decimal string):
 *   date                  -> date
 *   branch_id             -> branchId
 *   opening_balance       -> openingBalance (when no entry row exists)
 *   sales_total           -> salesTotal, todaySellTotal
 *   payments_by_tender    -> paymentsByTender { cash, bank, card, upi, loyalty }
 *                             NOTE: backend `upi` ~= frontend `online`
 *   expenses_total        -> expensesTotal
 *   expenses_by_tender    -> expensesByTender { cash, bank, card, upi, loyalty }
 *   udhaar_disbursed      -> udhaarDisbursed
 *   udhaar_collected      -> udhaarCollected, udhaarMoneyDepositedTotal
 *                             (the module's physical cash-in term)
 *   scheme_collected_tenant -> schemeCollectedTenant (TENANT-WIDE — shown
 *                             separately, NOT in branch cash math)
 *   cash_in / cash_out    -> cashIn / cashOut
 *   closing_balance       -> closingBalance
 *
 * Frontend-only fields with no server source (kept for module compatibility):
 *   todaySellDetails: []  (server has no per-invoice breakdown; the module
 *                          derives sell rows from the invoices context)
 *   oldMetalJamaTotal: 0  (not tracked by the diary API)
 *   firmCode: ''          (firm scoping lives in the parent context)
 *
 * PUT /v1/diary/:date  { branch_id, opening_balance, notes? }
 *   opening_balance is sent as a decimal string (max 4dp) — no float math on
 *   money at the API boundary. The response carries only { entry }; the
 *   adapter re-GETs the day afterwards so the summary is authoritative.
 *
 * Usage (wired by the parent, never here):
 *   const { diaryDay, diaryLoading, diaryError, loadDiaryDay, saveDiaryDay } =
 *     useDiaryApi({ api, enabled, branchId });
 * The parent calls loadDiaryDay(selectedDate) when the date/branch changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../api.js';

const TENDER_KEYS = ['cash', 'bank', 'card', 'upi', 'loyalty'];

/** 2dp/4dp decimal string -> Number (NaN-safe). */
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** TenderTotals object (decimal strings) -> { cash, bank, card, upi, loyalty } Numbers. */
function tendersToNumbers(t) {
  const src = t && typeof t === 'object' ? t : {};
  const out = {};
  for (const k of TENDER_KEYS) out[k] = num(src[k]);
  return out;
}

/**
 * Any reasonable amount input -> backend-safe decimal string (max 4dp).
 * Throws on negative / non-numeric input (backend moneySchema would 422).
 */
function toMoneyString(v) {
  const s = String(v ?? 0).trim();
  if (/^\d+(\.\d{1,4})?$/.test(s)) return s;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error('Opening balance must be a non-negative amount');
  }
  return (Math.round(n * 10000) / 10000).toString();
}

function assertDateISO(dateISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || ''))) {
    throw new Error('Date must be YYYY-MM-DD');
  }
}

/** Minimal day used for the optimistic seed before the first server load. */
function emptyDay(dateISO, branchId) {
  const zeroTenders = { cash: 0, bank: 0, card: 0, upi: 0, loyalty: 0 };
  return {
    date: dateISO,
    branchId: branchId || null,
    firmCode: '',
    openingBalance: 0,
    notes: null,
    hasEntry: false,
    entryId: null,
    updatedAt: null,
    salesTotal: 0,
    todaySellTotal: 0,
    todaySellDetails: [],
    paymentsByTender: { ...zeroTenders },
    expensesTotal: 0,
    expensesByTender: { ...zeroTenders },
    udhaarDisbursed: 0,
    udhaarCollected: 0,
    udhaarMoneyDepositedTotal: 0,
    schemeCollectedTenant: 0,
    cashIn: 0,
    cashOut: 0,
    closingBalance: 0,
    oldMetalJamaTotal: 0,
  };
}

/** Backend { entry, summary } -> frontend dailyDiary day object. */
function fromServerDay(payload) {
  const entry = payload && payload.entry ? payload.entry : null;
  const summary = payload && payload.summary ? payload.summary : {};
  const day = emptyDay(summary.date || (entry && entry.entry_date) || '', summary.branch_id || (entry && entry.branch_id));
  if (entry) {
    day.entryId = entry.id || null;
    day.updatedAt = entry.created_at || null;
    day.notes = entry.notes ?? null;
    day.hasEntry = true;
  }
  // openingBalance: the stored entry wins; otherwise the server's computed
  // opening (which equals the entry's, or 0 when no entry exists).
  day.openingBalance = entry && entry.opening_balance != null
    ? num(entry.opening_balance)
    : num(summary.opening_balance);
  day.salesTotal = num(summary.sales_total);
  day.todaySellTotal = num(summary.sales_total);
  day.paymentsByTender = tendersToNumbers(summary.payments_by_tender);
  day.expensesTotal = num(summary.expenses_total);
  day.expensesByTender = tendersToNumbers(summary.expenses_by_tender);
  day.udhaarDisbursed = num(summary.udhaar_disbursed);
  day.udhaarCollected = num(summary.udhaar_collected);
  day.udhaarMoneyDepositedTotal = num(summary.udhaar_collected);
  day.schemeCollectedTenant = num(summary.scheme_collected_tenant);
  day.cashIn = num(summary.cash_in);
  day.cashOut = num(summary.cash_out);
  day.closingBalance = num(summary.closing_balance);
  return day;
}

function friendlyDiaryError(err, context) {
  const tail = context === 'save' ? ' Your change was not saved.' : '';
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR') return `Could not reach the server.${tail} Check your connection.`;
    if (err.status === 401) return 'Your session expired. Please sign in again.';
    if (err.status === 403) return 'You do not have permission to manage the diary. Ask your administrator for access.';
    if (err.status === 404) return 'Branch not found for the diary. Select a valid branch.';
    return `Diary ${context === 'save' ? 'save' : 'load'} failed: ${err.message || err.code}.${tail}`;
  }
  return `Diary ${context === 'save' ? 'save' : 'load'} failed: ${(err && err.message) || 'unknown error'}.${tail}`;
}

function toFriendlyError(err, context) {
  const friendly = new Error(friendlyDiaryError(err, context));
  if (err && typeof err === 'object') {
    if (err.code) friendly.code = err.code;
    if (err.status) friendly.status = err.status;
    if (err.correlationId) friendly.correlationId = err.correlationId;
  }
  return friendly;
}

/**
 * @param {{ api: object|null, enabled: boolean, branchId?: string }} args
 *   api      — client from createApiClient (get/put); null until constructed
 *   enabled  — true only in api mode (VITE_DATA_SOURCE=api)
 *   branchId — branch UUID; when omitted the first tenant branch is resolved
 *              via GET /v1/branches (mirrors useStockApi)
 * @returns {{ diaryDay, diaryLoading, diaryError,
 *             loadDiaryDay, saveDiaryDay }}
 */
export function useDiaryApi({ api, enabled, branchId }) {
  const [diaryDay, setDiaryDay] = useState(null);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [diaryError, setDiaryError] = useState(null);
  const [resolvedBranchId, setResolvedBranchId] = useState(branchId || null);

  const apiRef = useRef(api);
  apiRef.current = api;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const dayRef = useRef(diaryDay);
  dayRef.current = diaryDay;
  const branchRef = useRef(resolvedBranchId);
  branchRef.current = resolvedBranchId;
  const inflightRef = useRef(null);

  /* ---------------- branch resolution (mirrors useStockApi) ---------------- */
  useEffect(() => {
    if (!enabled || !api) {
      setResolvedBranchId(branchId || null);
      return;
    }
    if (branchId) {
      setResolvedBranchId(branchId);
      return;
    }
    let cancelled = false;
    api
      .get('/v1/branches')
      .then((res) => {
        if (cancelled) return;
        const first = res && res.branches && res.branches[0];
        setResolvedBranchId(first ? first.id : null);
        if (!first) setDiaryError('No branches found for this tenant.');
      })
      .catch((err) => {
        if (!cancelled) setDiaryError(friendlyDiaryError(err, 'load'));
      });
    return () => {
      cancelled = true;
    };
  }, [api, enabled, branchId]);

  /** Raw fetch: GET /v1/diary/:date -> frontend day object. */
  const fetchDay = useCallback(async (dateISO, signal) => {
    const client = apiRef.current;
    const bId = branchRef.current;
    if (!client) throw new Error('API client is not available');
    if (!bId) throw new Error('No branch available for the diary. Select a branch first.');
    assertDateISO(dateISO);
    const res = await client.get(`/v1/diary/${dateISO}`, {
      query: { branch_id: bId },
      signal,
    });
    return fromServerDay(res);
  }, []);

  /**
   * Load a day's diary. Aborts any in-flight load so rapid date changes
   * can't apply stale results. Failures surface via diaryError (no throw),
   * mirroring the family's load path.
   */
  const loadDiaryDay = useCallback(async (dateISO) => {
    if (!enabledRef.current) return null;
    if (inflightRef.current) inflightRef.current.abort();
    const ctrl = new AbortController();
    inflightRef.current = ctrl;
    setDiaryLoading(true);
    setDiaryError(null);
    try {
      const day = await fetchDay(dateISO, ctrl.signal);
      if (inflightRef.current === ctrl) setDiaryDay(day);
      return day;
    } catch (err) {
      if (err && err.name === 'AbortError') return null;
      if (inflightRef.current === ctrl) setDiaryError(friendlyDiaryError(err, 'load'));
      return null;
    } finally {
      if (inflightRef.current === ctrl) {
        inflightRef.current = null;
        setDiaryLoading(false);
      }
    }
  }, [fetchDay]);

  /**
   * Optimistic save: merge openingBalance/notes into the current day,
   * PUT /v1/diary/:date in the background, then re-GET for the authoritative
   * server-computed summary. Rolls back to the previous day on failure and
   * throws a friendly error.
   */
  const saveDiaryDay = useCallback(async (dateISO, dayData) => {
    if (!enabledRef.current) throw new Error('Diary API is not enabled');
    const client = apiRef.current;
    const bId = branchRef.current;
    if (!client) throw new Error('API client is not available');
    if (!bId) throw new Error('No branch available for the diary. Select a branch first.');
    assertDateISO(dateISO);

    const previous = dayRef.current;
    const openingBalance = toMoneyString(dayData && dayData.openingBalance);
    const notes = dayData && dayData.notes != null
      ? String(dayData.notes).slice(0, 10000)
      : null;
    const optimistic = {
      ...(previous || emptyDay(dateISO, bId)),
      date: dateISO,
      branchId: bId,
      openingBalance: num(openingBalance),
      notes,
    };
    setDiaryDay(optimistic);
    setDiaryError(null);
    try {
      await client.put(`/v1/diary/${dateISO}`, {
        branch_id: bId,
        opening_balance: openingBalance, // decimal string at the boundary; no float math on money
        notes,
      });
      // Authoritative refresh — the server recomputes the summary live.
      const fresh = await fetchDay(dateISO);
      setDiaryDay(fresh);
      return fresh;
    } catch (err) {
      setDiaryDay(previous);
      const friendly = toFriendlyError(err, 'save');
      setDiaryError(friendly.message);
      throw friendly;
    }
  }, [fetchDay]);

  return {
    diaryDay,
    diaryLoading,
    diaryError,
    loadDiaryDay,
    saveDiaryDay,
  };
}
