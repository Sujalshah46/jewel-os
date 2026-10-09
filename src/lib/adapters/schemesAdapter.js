/**
 * Gold schemes API adapter (Phase 3 strangler).
 *
 * Mirrors the local implementation in src/context/JewelleryContext.jsx:
 *   schemes / schemeEnrollments            (local: localStorage seed; here: GET /v1/schemes)
 *   enrollCustomerInScheme({schemeId, customerId, monthlyInstallment})  -> enrollment
 *   recordSchemeInstallment(enrollmentId, amount)
 *   addScheme — no local equivalent existed (schemes were seed-only); added here
 *   as optimistic create + POST /v1/schemes + rollback, same pattern as
 *   customersAdapter.addCustomer.
 *
 * ---------------------------------------------------------------------------
 * FIELD-MAPPING SUMMARY
 * ---------------------------------------------------------------------------
 * Backend (snake_case, money = decimal strings, statuses lowercase):
 *   Scheme:      { id, name, type, monthly_installment, duration_months,
 *                  bonus_months, total_maturity_value|null, discount_making_pct|null,
 *                  description|null, active, created_at }
 *   Enrollment:  { id, scheme_id, customer_id, start_date, maturity_date|null,
 *                  status, created_at }
 *   Installment: { id, enrollment_id, installment_no, amount, tender, paid_at,
 *                  created_at }
 *   GET /v1/schemes            -> { schemes: [...], next_cursor }
 *   GET /v1/schemes/enrollments/:id -> { enrollment, scheme, installments,
 *                                        summary: { paid_total, paid_count,
 *                                                   remaining_count, remaining_amount } }
 *
 * Frontend (camelCase, money = Numbers, statuses Title-case) — same shape as
 * src/components/modules/SchemeModule.jsx renders:
 *   Scheme:      { id, name, type, monthlyInstallment, durationMonths,
 *                  bonusMonthsPaidByJeweller, totalMaturityValue|null,
 *                  discountOnMakingChargesPercent|null, description,
 *                  active, activeMembersCount, totalCollectedAmount }
 *   Enrollment:  { id, schemeId, schemeName, customerId, customerName, mobile,
 *                  monthlyInstallment, durationMonths, paidInstallmentsCount,
 *                  totalPaidAmount, startDate, status }
 *
 * Notes:
 * - activeMembersCount / totalCollectedAmount have no backend column on the
 *   scheme row; they read as 0 in API mode (the module already does
 *   `sch.activeMembersCount || 0`).
 * - customerName / mobile have no backend column on enrollments; they are
 *   display-only pass-throughs supplied by the caller (or '').
 * - Money crosses the API boundary as decimal strings (up to 4dp), never
 *   floats; Numbers are used only inside the frontend shape.
 *
 * Usage (wired by the parent, never here):
 *   const { schemes, schemesLoading, schemesError, refetchSchemes,
 *           addScheme, enrollCustomer, recordInstallment } =
 *     useSchemesApi({ api, enabled });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/** Number -> clean decimal string (up to 4dp, no exponent) for the API boundary. */
function moneyStr(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Amount must be a non-negative number');
  const fixed = n.toFixed(4).replace(/\.?0+$/, '');
  return fixed === '' ? '0' : fixed;
}

/** Backend scheme row -> frontend scheme object. */
function fromServerScheme(s) {
  return {
    id: s.id,
    name: s.name || '',
    type: s.type || '',
    monthlyInstallment: s.monthly_installment != null ? Number(s.monthly_installment) : 0,
    durationMonths: Number(s.duration_months) || 0,
    bonusMonthsPaidByJeweller: Number(s.bonus_months) || 0,
    totalMaturityValue: s.total_maturity_value != null ? Number(s.total_maturity_value) : null,
    discountOnMakingChargesPercent:
      s.discount_making_pct != null ? Number(s.discount_making_pct) : null,
    description: s.description || '',
    active: Boolean(s.active),
    // No backend aggregates on the scheme row; module falls back to 0.
    activeMembersCount: 0,
    totalCollectedAmount: 0,
    createdAt: s.created_at || null,
  };
}

/** Frontend scheme form -> POST /v1/schemes body. */
function toServerSchemeBody(form) {
  const body = {
    name: String(form.name || '').trim(),
    type: String(form.type || '').trim(),
    monthly_installment: moneyStr(form.monthlyInstallment ?? form.monthly_installment),
    duration_months: Number(form.durationMonths ?? form.duration_months),
    bonus_months: Number(form.bonusMonthsPaidByJeweller ?? form.bonus_months ?? 0),
  };
  const tmv = form.totalMaturityValue ?? form.total_maturity_value;
  if (tmv !== undefined && tmv !== null && tmv !== '') body.total_maturity_value = moneyStr(tmv);
  const dmc = form.discountOnMakingChargesPercent ?? form.discount_making_pct;
  if (dmc !== undefined && dmc !== null && dmc !== '') body.discount_making_pct = String(dmc);
  if (form.description) body.description = String(form.description);
  return body;
}

/** lowercase backend status -> Title-case frontend status. */
function titleStatus(status) {
  const s = String(status || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/**
 * Enrollment detail ({ enrollment, scheme, summary }) -> frontend enrollment.
 * customerName/mobile are display pass-throughs supplied by the caller.
 */
function fromServerEnrollmentDetail(detail, extras = {}) {
  const { enrollment, scheme, summary } = detail;
  return {
    id: enrollment.id,
    schemeId: enrollment.scheme_id,
    schemeName: scheme ? scheme.name : extras.schemeName || '',
    customerId: enrollment.customer_id,
    customerName: extras.customerName || '',
    mobile: extras.mobile || '',
    monthlyInstallment: scheme ? Number(scheme.monthly_installment) : 0,
    durationMonths: scheme ? Number(scheme.duration_months) : 0,
    paidInstallmentsCount: summary ? Number(summary.paid_count) || 0 : 0,
    totalPaidAmount: summary && summary.paid_total != null ? Number(summary.paid_total) : 0,
    startDate: enrollment.start_date || '',
    status: titleStatus(enrollment.status),
  };
}

/** Local YYYY-MM-DD (business date, like the rest of the frontend). */
function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function friendlyError(err) {
  if (err && err.code === 'ENROLLMENT_NOT_ACTIVE') {
    const friendly = new Error(`Installment rejected: ${err.message || 'enrollment is not active'}`);
    friendly.code = 'ENROLLMENT_NOT_ACTIVE';
    friendly.status = err.status;
    friendly.correlationId = err.correlationId;
    return friendly;
  }
  return err;
}

export function useSchemesApi({ api, enabled }) {
  const [schemes, setSchemes] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [schemesError, setSchemesError] = useState(null);
  // Session-local enrollment list: the backend has no list-enrollments
  // endpoint, so we accumulate enrollments created/fetched this session.
  const [enrollments, setEnrollments] = useState([]);

  const apiRef = useRef(api);
  apiRef.current = api;

  const refetchSchemes = useCallback(async (signal) => {
    const client = apiRef.current;
    if (!client) return;
    setSchemesLoading(true);
    setSchemesError(null);
    try {
      const all = [];
      let cursor = null;
      do {
        const res = await client.get('/v1/schemes', {
          query: { cursor, limit: 100 },
          signal,
        });
        const items = Array.isArray(res && res.schemes) ? res.schemes : [];
        for (const scheme of items) all.push(fromServerScheme(scheme));
        cursor = (res && (res.next_cursor || res.nextCursor)) || null;
      } while (cursor);
      setSchemes(all);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setSchemesError(err);
    } finally {
      setSchemesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    refetchSchemes(ctrl.signal);
    return () => ctrl.abort();
  }, [enabled, refetchSchemes]);

  /** Optimistic create: temp record replaced by the server record on success. */
  const addScheme = useCallback(async (form) => {
    const client = apiRef.current;
    if (!client) throw new Error('API client is not available');
    const tempId = 'temp-sch-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const optimistic = {
      ...fromServerScheme({
        id: tempId,
        name: String(form.name || ''),
        type: String(form.type || ''),
        monthly_installment: String(form.monthlyInstallment ?? 0),
        duration_months: Number(form.durationMonths ?? 0),
        bonus_months: Number(form.bonusMonthsPaidByJeweller ?? 0),
        total_maturity_value: form.totalMaturityValue ?? null,
        discount_making_pct: form.discountOnMakingChargesPercent ?? null,
        description: form.description || '',
        active: true,
        created_at: new Date().toISOString(),
      }),
      _pending: true,
    };
    setSchemes((prev) => [optimistic, ...prev]);
    setSchemesError(null);
    try {
      const res = await client.post('/v1/schemes', toServerSchemeBody(form));
      const created = fromServerScheme(res.scheme);
      setSchemes((prev) => prev.map((s) => (s.id === tempId ? created : s)));
      return created;
    } catch (err) {
      setSchemes((prev) => prev.filter((s) => s.id !== tempId));
      setSchemesError(err);
      throw err;
    }
  }, []);

  /**
   * Enroll a customer in a scheme.
   * POST /v1/schemes/:schemeId/enrollments, then fetch the enrollment detail
   * so the returned object carries paid counts/summary like the local shape.
   * Mirrors the local behavior of counting the enrollment itself as the first
   * installment: pass `firstInstallment: true` (default) with `tender` to
   * record the first payment right after enrollment.
   */
  const enrollCustomer = useCallback(
    async ({ schemeId, customerId, customerName = '', mobile = '', startDate, firstInstallment = true, tender = 'cash' }) => {
      const client = apiRef.current;
      if (!client) throw new Error('API client is not available');
      if (!schemeId || !customerId) throw new Error('schemeId and customerId are required');
      setSchemesError(null);
      try {
        const res = await client.post(`/v1/schemes/${schemeId}/enrollments`, {
          customer_id: customerId,
          start_date: startDate || todayStr(),
        });
        const enrollmentId = res.enrollment && res.enrollment.id;
        if (firstInstallment && enrollmentId) {
          const scheme = schemes.find((s) => s.id === schemeId) || null;
          const amount = scheme ? scheme.monthlyInstallment : 0;
          if (amount > 0) {
            await client.post(`/v1/schemes/enrollments/${enrollmentId}/installments`, {
              amount: moneyStr(amount),
              tender,
            });
          }
        }
        // Refresh the scheme list (member counts live there) in the background.
        refetchSchemes().catch(() => {});
        const detail = await client.get(`/v1/schemes/enrollments/${enrollmentId}`);
        const mapped = fromServerEnrollmentDetail(detail, { customerName, mobile });
        setEnrollments((prev) => [mapped, ...prev.filter((e) => e.id !== mapped.id)]);
        return mapped;
      } catch (err) {
        const friendly = friendlyError(err);
        setSchemesError(friendly);
        throw friendly;
      }
    },
    [schemes, refetchSchemes]
  );

  /**
   * Record an installment payment (append-only on the server).
   * Returns the frontend-shaped enrollment detail after the payment.
   */
  const recordInstallment = useCallback(
    async (enrollmentId, amount, tender = 'cash') => {
      const client = apiRef.current;
      if (!client) throw new Error('API client is not available');
      if (!enrollmentId) throw new Error('enrollmentId is required');
      setSchemesError(null);
      try {
        await client.post(`/v1/schemes/enrollments/${enrollmentId}/installments`, {
          amount: moneyStr(amount),
          tender,
        });
        // Refresh the scheme list (collected totals live there) in the background.
        refetchSchemes().catch(() => {});
        const detail = await client.get(`/v1/schemes/enrollments/${enrollmentId}`);
        const mapped = fromServerEnrollmentDetail(detail);
        setEnrollments((prev) => [mapped, ...prev.filter((e) => e.id !== mapped.id)]);
        return mapped;
      } catch (err) {
        const friendly = friendlyError(err);
        setSchemesError(friendly);
        throw friendly;
      }
    },
    [refetchSchemes]
  );

  return {
    schemes,
    enrollments,
    schemesLoading,
    schemesError,
    refetchSchemes,
    addScheme,
    enrollCustomer,
    recordInstallment,
  };
}
