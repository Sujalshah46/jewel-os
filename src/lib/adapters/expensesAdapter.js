/**
 * Expenses API adapter (Phase 3 strangler).
 *
 * Mirrors the local expenses state in src/context/JewelleryContext.jsx
 * (INITIAL_EXPENSES in src/data/initialData.js):
 *   addExpense(entry)  -> created entry   (local: sync push; here: async POST)
 *   voidExpense(id)    -> entry removed    (local: n/a; backend voids are
 *                                           immutable, so the entry is dropped
 *                                           from the list to match the
 *                                           backend's default non-voided list)
 *
 * FIELD MAPPING (backend SerializedExpense <-> frontend entry):
 *   id            <-> id
 *   expense_date  <-> date            (YYYY-MM-DD on both sides)
 *   category      <-> category
 *   description  <-> description
 *   amount        <-> amount          (backend: 2dp decimal string;
 *                                      frontend: Number)
 *   tender        <-> paymentMode     (backend: 'cash'|'bank'|'card'|'upi';
 *                                      frontend: 'Cash'|'Bank Transfer'|
 *                                      'Card'|'Online/UPI')
 *   paid_to       <-> paidTo
 *   branch_id     <-> branchId
 *   voided_at     <-> voidedAt        (ISO string | null)
 *   void_reason   <-> voidReason
 *   created_at    <-> createdAt
 *
 * Frontend-only fields with no backend column (firmCode, firmId) are carried
 * on the entry object untouched; entries read from the server simply omit
 * them, and the UI's firm filter treats missing firm fields as "all firms".
 *
 * Money crosses the API boundary as decimal strings (no float math on money);
 * it becomes a Number only inside the frontend entry.
 *
 * Usage (wired by the parent, never here):
 *   const { expenses, expensesLoading, expensesError, refetchExpenses,
 *           addExpense, voidExpense } =
 *     useExpensesApi({ api, enabled, branchId });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Backend tender <-> frontend paymentMode display label.
const TENDER_TO_MODE = {
  cash: 'Cash',
  bank: 'Bank Transfer',
  card: 'Card',
  upi: 'Online/UPI',
};
const MODE_TO_TENDER = {
  Cash: 'cash',
  'Bank Transfer': 'bank',
  Card: 'card',
  'Online/UPI': 'upi',
};

function toTender(entry) {
  if (entry.tender && TENDER_TO_MODE[entry.tender]) return entry.tender;
  const mode = String(entry.paymentMode || '').trim();
  return MODE_TO_TENDER[mode] || 'cash';
}

function toPaymentMode(tender) {
  return TENDER_TO_MODE[tender] || 'Cash';
}

/** Decimal-safe 2dp string for the API boundary. */
function moneyString(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('Expense amount must be a positive number');
  }
  return num.toFixed(2);
}

/** Backend SerializedExpense -> frontend expense entry. */
function fromServer(expense) {
  return {
    id: expense.id,
    date: expense.expense_date,
    category: expense.category || '',
    description: expense.description || '',
    amount: expense.amount != null ? Number(expense.amount) : 0,
    paymentMode: toPaymentMode(expense.tender),
    tender: expense.tender || 'cash',
    paidTo: expense.paid_to || '',
    branchId: expense.branch_id || '',
    voidedAt: expense.voided_at || null,
    voidReason: expense.void_reason || null,
    createdAt: expense.created_at || null,
  };
}

/** Frontend expense entry -> POST /v1/expenses body. */
function toServerBody(entry, branchId) {
  const date = String(entry.date || entry.expenseDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Expense date must be YYYY-MM-DD');
  }
  const resolvedBranchId = branchId || entry.branchId || '';
  if (!resolvedBranchId) {
    throw new Error('A branch is required to record an expense');
  }
  return {
    branch_id: resolvedBranchId,
    expense_date: date,
    category: String(entry.category || '').trim() || 'General',
    description: String(entry.description || '').trim() || 'Expense',
    amount: moneyString(entry.amount),
    tender: toTender(entry),
    paid_to: String(entry.paidTo ?? entry.paid_to ?? '').trim() || null,
  };
}

function friendlyExpensesError(err, context) {
  const tail = context === 'save' ? ' Your change was not saved.' : '';
  const op = context === 'save' ? 'save' : 'load';
  if (err && err.code === 'BRANCH_NOT_FOUND') {
    return `Could not record the expense: branch not found.${tail}`;
  }
  if (err && err.code === 'ALREADY_VOIDED') {
    return 'This expense was already voided.';
  }
  if (err && err.status === 401) {
    return 'Your session expired. Please sign in again.';
  }
  if (err && err.status === 403) {
    return 'You do not have permission to manage expenses. Ask your administrator for access.';
  }
  if (err && err.code === 'NETWORK_ERROR') {
    return `Could not reach the server.${tail} Check your connection.`;
  }
  return `Expenses ${op} failed: ${(err && (err.message || err.code)) || 'unknown error'}.${tail}`;
}

export function useExpensesApi({ api, enabled, branchId }) {
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState(null);

  const apiRef = useRef(api);
  apiRef.current = api;
  const branchRef = useRef(branchId);
  branchRef.current = branchId;
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;

  const refetchExpenses = useCallback(async (signal, filters = {}) => {
    const client = apiRef.current;
    if (!client) return;
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const queryBranchId = filters.branchId !== undefined ? filters.branchId : branchRef.current;
      const all = [];
      let cursor = null;
      do {
        const query = { limit: 100, cursor };
        if (queryBranchId) query.branch_id = queryBranchId;
        if (filters.from) query.from = filters.from;
        if (filters.to) query.to = filters.to;
        const res = await client.get('/v1/expenses', { query, signal });
        const items = Array.isArray(res && res.expenses) ? res.expenses : [];
        for (const expense of items) all.push(fromServer(expense));
        cursor = (res && (res.next_cursor || res.nextCursor)) || null;
      } while (cursor);
      setExpenses(all);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setExpensesError(friendlyExpensesError(err, 'load'));
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    refetchExpenses(ctrl.signal);
    return () => ctrl.abort();
  }, [enabled, refetchExpenses]);

  /** Optimistic create: temp record replaced by the server record on success. */
  const addExpense = useCallback(async (entry, branchIdOverride) => {
    const client = apiRef.current;
    if (!client) throw new Error('API client is not available');
    const resolvedBranchId = branchIdOverride || branchRef.current || entry.branchId || '';
    let body;
    try {
      body = toServerBody(entry, resolvedBranchId);
    } catch (err) {
      const friendly = friendlyExpensesError(err, 'save');
      setExpensesError(typeof friendly === 'string' ? new Error(friendly) : friendly);
      throw err;
    }
    const tempId = 'temp-exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const optimistic = {
      ...fromServer({
        id: tempId,
        branch_id: body.branch_id,
        expense_date: body.expense_date,
        category: body.category,
        description: body.description,
        amount: body.amount,
        tender: body.tender,
        paid_to: body.paid_to,
        voided_at: null,
        void_reason: null,
        created_at: new Date().toISOString(),
      }),
      ...entry,
      id: tempId,
      date: body.expense_date,
      amount: Number(body.amount),
      paymentMode: toPaymentMode(body.tender),
      branchId: body.branch_id,
      _pending: true,
    };
    setExpenses((prev) => [optimistic, ...prev]);
    setExpensesError(null);
    try {
      const res = await client.post('/v1/expenses', body);
      const created = { ...fromServer(res.expense), firmCode: entry.firmCode, firmId: entry.firmId };
      setExpenses((prev) => prev.map((e) => (e.id === tempId ? created : e)));
      return created;
    } catch (err) {
      setExpenses((prev) => prev.filter((e) => e.id !== tempId));
      const friendly = friendlyExpensesError(err, 'save');
      setExpensesError(typeof friendly === 'string' ? new Error(friendly) : friendly);
      throw err;
    }
  }, []);

  /**
   * Optimistic void: the entry is dropped from the list immediately (matching
   * the backend's default non-voided list); restored at its original position
   * if the void fails. Backend voids are immutable — there is no un-void.
   */
  const voidExpense = useCallback(async (id, reason) => {
    const client = apiRef.current;
    if (!client) throw new Error('API client is not available');
    if (!reason || !String(reason).trim()) {
      throw new Error('A reason is required to void an expense');
    }
    const list = expensesRef.current;
    const index = list.findIndex((e) => e.id === id);
    const previous = index >= 0 ? list[index] : null;
    if (!previous) throw new Error('Expense not found');
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setExpensesError(null);
    try {
      const res = await client.post(`/v1/expenses/${id}/void`, { reason: String(reason).trim() });
      return fromServer(res.expense);
    } catch (err) {
      if (previous) {
        setExpenses((prev) => {
          const next = [...prev];
          next.splice(Math.min(index, next.length), 0, previous);
          return next;
        });
      }
      const friendly = friendlyExpensesError(err, 'save');
      setExpensesError(typeof friendly === 'string' ? new Error(friendly) : friendly);
      throw err;
    }
  }, []);

  return {
    expenses,
    expensesLoading,
    expensesError,
    refetchExpenses,
    addExpense,
    voidExpense,
  };
}
