/**
 * Karigar (artisan) API adapter (Phase 3 strangler).
 *
 * Mirrors the local implementation in src/context/JewelleryContext.jsx:
 *   issueMetalToKarigar(karigarId, { metalType, grams, notes })
 *   receiveOrnamentFromKarigar(karigarId, { itemDescription, metalType,
 *     grossWeight, fineWeight, ghatLossGm, labourAmount })
 * Both are exposed here as a single async action:
 *   addKarigarVoucher({ karigarId, kind: 'ISSUE'|'RECEIVE', metalType,
 *     grams, itemDescription, grossWeight, fineWeight, ghatLossGm,
 *     labourAmount, notes }) -> created voucher (local: sync; here: async)
 *
 * Same frontend shapes as src/components/modules/KarigarModule.jsx.
 *
 * Backend endpoints (~/workspace/jewelry-os-server/src/modules/karigar):
 *   GET  /v1/karigar                -> { karigars: [{id,name,phone}], next_cursor }
 *   GET  /v1/karigar/:id/balance    -> { balance: { karigar_id,
 *                                        gold_issued_gm, gold_settled_gm, gold_outstanding_gm,
 *                                        silver_issued_gm, silver_settled_gm, silver_outstanding_gm,
 *                                        labour_due } }            (derived, never stored)
 *   GET  /v1/karigar/vouchers?karigar_id=<uuid>
 *                                   -> { vouchers: [{ id, branch_id, karigar_id, type,
 *                                        metal_code, weight_gm, gross_wt, fine_wt,
 *                                        ghat_loss_gm, labour_amount, item_description,
 *                                        notes, created_by, created_at }], next_cursor }
 *                                        (newest first; karigar_id is REQUIRED)
 *   POST /v1/karigar/vouchers       -> { voucher }  (ISSUE or RECEIVE)
 *
 * NOTE: the backend has NO "create karigar" endpoint — karigars are `parties`
 * rows with type='artisan' (frozen schema: no separate karigars table). This
 * adapter therefore implements voucher issue/receive only; karigar master
 * records are read-only here. Frontend-only fields with no backend column
 * (speciality, wastageAllowedPercent) use the same defaults as the local UI.
 *
 * NOTE: POST requires `branch_id` (uuid). Pass it via the hook args
 * (`useKarigarApi({ api, enabled, branchId })`); addKarigarVoucher throws a
 * friendly error when it is missing.
 *
 * Field mapping summary (server snake_case -> frontend):
 *   artisan.id/name/phone            -> karigar.id/name/phone (+mobile alias)
 *   balance.gold_outstanding_gm      -> karigar.pureGoldIssuedBalanceGm   (Number)
 *   balance.silver_outstanding_gm    -> karigar.silverIssuedBalanceGm     (Number)
 *   balance.labour_due               -> karigar.labourChargesDue          (Number)
 *   voucher.karigar_id/type          -> voucher.karigarId/type
 *   voucher.metal_code               -> voucher.metalType ('gold'->'Gold')
 *   voucher.weight_gm/gross_wt/fine_wt/ghat_loss_gm/labour_amount
 *                                    -> voucher.weightGm/grossWeight/fineWeight/
 *                                       ghatLossGm/labourAmount            (Number)
 *   voucher.item_description/notes   -> voucher.itemDescription/notes
 *   voucher.created_at               -> voucher.date ('YYYY-MM-DD') + createdAt
 * Write path (frontend -> server): weights as 3dp decimal strings,
 * labour as 2dp decimal string; metalType 'Gold'/'Silver' -> 'gold'/'silver'.
 *
 * Usage (wired by the parent, never here):
 *   const { karigars, karigarVouchers, karigarLoading, karigarError,
 *           refetchKarigar, addKarigarVoucher } =
 *     useKarigarApi({ api, enabled, branchId });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ------------------------------------------------------------------ mapping

function metalToCode(metalType) {
  const m = String(metalType || 'Gold').trim().toLowerCase();
  // The backend balance rollup tracks gold and silver; anything else is
  // recorded on the voucher but ignored by the summary.
  return m === 'silver' ? 'silver' : 'gold';
}

function codeToMetal(metalCode) {
  const m = String(metalCode || '').trim().toLowerCase();
  if (m === 'silver') return 'Silver';
  if (m === 'gold') return 'Gold';
  return m ? m.charAt(0).toUpperCase() + m.slice(1) : '';
}

/** Number -> 3dp decimal string (weights at the API boundary). */
function fmtWeight3(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid weight: ' + v);
  return (Math.round(n * 1000) / 1000).toFixed(3);
}

/** Number -> 2dp decimal string (money at the API boundary). */
function fmtMoney2(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid amount: ' + v);
  return (Math.round(n * 100) / 100).toFixed(2);
}

function round3(n) {
  return Math.round(Number(n || 0) * 1000) / 1000;
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

/** Backend balance -> the frontend balance fields the KarigarModule renders. */
function balanceFields(balance) {
  if (!balance) {
    return { pureGoldIssuedBalanceGm: 0, silverIssuedBalanceGm: 0, labourChargesDue: 0 };
  }
  return {
    pureGoldIssuedBalanceGm: Number(balance.gold_outstanding_gm ?? 0) || 0,
    silverIssuedBalanceGm: Number(balance.silver_outstanding_gm ?? 0) || 0,
    labourChargesDue: Number(balance.labour_due ?? 0) || 0,
  };
}

/** Backend artisan (+ optional balance) -> frontend karigar object. */
function fromServerKarigar(artisan, balance) {
  const a = artisan || {};
  return {
    id: a.id,
    name: a.name || '',
    phone: a.phone || '',
    mobile: a.phone || '', // seed shape uses `mobile`; keep both in sync
    speciality: '', // no backend column; the module renders it blank when absent
    wastageAllowedPercent: 4, // no backend column; matches the module's fallback
    ...balanceFields(balance),
    status: 'Active',
    // Backend metadata (harmless to components).
    createdAt: a.created_at || null,
  };
}

/** Backend voucher -> frontend voucher object (KarigarModule shape). */
function fromServerVoucher(v, karigarName) {
  const get = (snake, camel) => (v[snake] !== undefined ? v[snake] : v[camel]);
  const num = (x) => (x === null || x === undefined || x === '' ? 0 : Number(x) || 0);
  const createdAt = get('created_at', 'createdAt') || new Date().toISOString();
  return {
    id: v.id,
    karigarId: get('karigar_id', 'karigarId'),
    karigarName: karigarName || 'Karigar',
    type: get('type', 'type'),
    metalType: codeToMetal(get('metal_code', 'metalCode')),
    metalCode: get('metal_code', 'metalCode') || '',
    weightGm: num(get('weight_gm', 'weightGm')),
    grossWeight: num(get('gross_wt', 'grossWeight')),
    fineWeight: num(get('fine_wt', 'fineWeight')),
    ghatLossGm: num(get('ghat_loss_gm', 'ghatLossGm')),
    labourAmount: num(get('labour_amount', 'labourAmount')),
    itemDescription: get('item_description', 'itemDescription') || '',
    notes: get('notes', 'notes') || '',
    date: String(createdAt).slice(0, 10),
    createdAt,
  };
}

function friendlyKarigarError(err) {
  const wrap = (message) => {
    const friendly = new Error(message);
    friendly.code = err.code;
    friendly.status = err.status;
    friendly.correlationId = err.correlationId;
    return friendly;
  };
  if (err && err.code === 'OVER_SETTLEMENT') {
    return wrap("This receive exceeds the karigar's outstanding metal balance");
  }
  if (err && err.code === 'KARIGAR_NOT_FOUND') {
    return wrap('Karigar not found');
  }
  if (err && err.code === 'BRANCH_NOT_FOUND') {
    return wrap('Branch not found');
  }
  return err;
}

// -------------------------------------------------------------------- hook

export function useKarigarApi({ api, enabled, branchId }) {
  const [karigars, setKarigars] = useState([]);
  const [karigarVouchers, setKarigarVouchers] = useState([]);
  const [karigarLoading, setKarigarLoading] = useState(false);
  const [karigarError, setKarigarError] = useState(null);

  const apiRef = useRef(api);
  apiRef.current = api;
  const branchRef = useRef(branchId);
  branchRef.current = branchId;
  const karigarsRef = useRef(karigars);
  karigarsRef.current = karigars;

  const refetchKarigar = useCallback(async (signal) => {
    const client = apiRef.current;
    if (!client) return;
    setKarigarLoading(true);
    setKarigarError(null);
    try {
      // 1. Artisans (keyset-paginated over (name, id)).
      const artisans = [];
      let cursor = null;
      do {
        const res = await client.get('/v1/karigar', {
          query: { cursor, limit: 100 },
          signal,
        });
        const items = Array.isArray(res && res.karigars) ? res.karigars : [];
        for (const a of items) artisans.push(a);
        cursor = (res && (res.next_cursor || res.nextCursor)) || null;
      } while (cursor);

      // 2. Derived balances (never stored server-side).
      const withBalances = [];
      for (const a of artisans) {
        let balance = null;
        try {
          const bres = await client.get(`/v1/karigar/${a.id}/balance`, { signal });
          balance = (bres && bres.balance) || null;
        } catch (err) {
          if (err && err.name === 'AbortError') throw err;
          balance = null; // keep the karigar row even when the balance read fails
        }
        withBalances.push(fromServerKarigar(a, balance));
      }

      // 3. Voucher ledger per karigar (the endpoint requires karigar_id),
      //    merged newest-first like the local ledger.
      const allVouchers = [];
      for (const a of artisans) {
        let vcursor = null;
        do {
          const vres = await client.get('/v1/karigar/vouchers', {
            query: { karigar_id: a.id, cursor: vcursor, limit: 100 },
            signal,
          });
          const items = Array.isArray(vres && vres.vouchers) ? vres.vouchers : [];
          for (const v of items) allVouchers.push(fromServerVoucher(v, a.name));
          vcursor = (vres && (vres.next_cursor || vres.nextCursor)) || null;
        } while (vcursor);
      }
      allVouchers.sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')));

      setKarigars(withBalances);
      setKarigarVouchers(allVouchers);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setKarigarError(err);
    } finally {
      setKarigarLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    refetchKarigar(ctrl.signal);
    return () => ctrl.abort();
  }, [enabled, refetchKarigar]);

  /** Best-effort convergence of one karigar's derived balances to server truth. */
  const refreshKarigarBalance = useCallback(async (karigarId) => {
    const client = apiRef.current;
    if (!client || !karigarId) return;
    try {
      const res = await client.get(`/v1/karigar/${karigarId}/balance`);
      const balance = (res && res.balance) || null;
      if (!balance) return;
      const fields = balanceFields(balance);
      setKarigars((prev) => prev.map((k) => (String(k.id) === String(karigarId) ? { ...k, ...fields } : k)));
    } catch {
      // Best effort only; the optimistic values remain on screen.
    }
  }, []);

  /**
   * Record an ISSUE or RECEIVE voucher.
   * Optimistic add + balance update (same math as the local implementation),
   * POST in the background, rollback on failure, balance refresh on success.
   */
  const addKarigarVoucher = useCallback(
    async (input) => {
      const client = apiRef.current;
      if (!client) throw new Error('API client is not available');
      const branch = branchRef.current;
      if (!branch) {
        const err = new Error('A branch is required to record karigar vouchers');
        err.code = 'BRANCH_REQUIRED';
        throw err;
      }

      const kind = String(input.kind || input.type || '').toUpperCase();
      if (kind !== 'ISSUE' && kind !== 'RECEIVE') {
        throw new Error("Voucher kind must be 'ISSUE' or 'RECEIVE'");
      }
      const karigarId = String(input.karigarId || '').trim();
      if (!karigarId) throw new Error('A karigar is required');
      const metalType = input.metalType || 'Gold';
      const metalCode = metalToCode(metalType);
      const target = karigarsRef.current.find((k) => String(k.id) === karigarId);
      const karigarName = (target && target.name) || input.karigarName || 'Karigar';

      // Backend body: decimal strings at the boundary; fields the backend
      // forbids per type are never sent (see routes.ts superRefine).
      const body = {
        karigar_id: karigarId,
        branch_id: branch,
        type: kind,
        metal_code: metalCode,
      };
      let weightNum = 0;
      let grossNum = 0;
      let fineNum = 0;
      let ghatNum = 0;
      let labourNum = 0;
      if (kind === 'ISSUE') {
        weightNum = Number(input.grams ?? input.weightGm ?? input.weight_gm);
        if (!Number.isFinite(weightNum) || weightNum <= 0) {
          throw new Error('Valid metal weight is required');
        }
        body.weight_gm = fmtWeight3(weightNum);
      } else {
        fineNum = Number(input.fineWeight ?? input.fine_wt);
        if (!Number.isFinite(fineNum)) throw new Error('Fine weight is required');
        grossNum = Number(input.grossWeight ?? input.gross_wt ?? 0) || 0;
        ghatNum = Number(input.ghatLossGm ?? input.ghat_loss_gm ?? 0) || 0;
        labourNum = Number(input.labourAmount ?? input.labour_amount ?? 0) || 0;
        body.fine_wt = fmtWeight3(fineNum);
        if (grossNum > 0) body.gross_wt = fmtWeight3(grossNum);
        body.ghat_loss_gm = fmtWeight3(ghatNum);
        body.labour_amount = fmtMoney2(labourNum);
      }
      const notes = String(input.notes || '').trim();
      const itemDescription = String(input.itemDescription || '').trim();
      if (notes) body.notes = notes;
      if (itemDescription) body.item_description = itemDescription;

      const tempId =
        'temp-kv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      const nowIso = new Date().toISOString();
      const optimistic = {
        id: tempId,
        karigarId,
        karigarName,
        type: kind,
        metalType: codeToMetal(metalCode),
        metalCode,
        weightGm: kind === 'ISSUE' ? weightNum : 0,
        grossWeight: grossNum,
        fineWeight: fineNum,
        ghatLossGm: ghatNum,
        labourAmount: labourNum,
        itemDescription,
        notes,
        date: nowIso.slice(0, 10),
        createdAt: nowIso,
        _pending: true,
      };
      const previousKarigar = target ? { ...target } : null;

      // Optimistic balance math mirrors the local implementation exactly.
      const applyOptimisticBalance = (k) => {
        if (String(k.id) !== karigarId) return k;
        if (metalCode === 'silver') {
          if (kind === 'ISSUE') {
            return { ...k, silverIssuedBalanceGm: round3((k.silverIssuedBalanceGm || 0) + weightNum) };
          }
          return {
            ...k,
            silverIssuedBalanceGm: Math.max(0, round3((k.silverIssuedBalanceGm || 0) - (fineNum + ghatNum))),
            labourChargesDue: round2((k.labourChargesDue || 0) + labourNum),
          };
        }
        if (kind === 'ISSUE') {
          return { ...k, pureGoldIssuedBalanceGm: round3((k.pureGoldIssuedBalanceGm || 0) + weightNum) };
        }
        return {
          ...k,
          pureGoldIssuedBalanceGm: Math.max(0, round3((k.pureGoldIssuedBalanceGm || 0) - (fineNum + ghatNum))),
          labourChargesDue: round2((k.labourChargesDue || 0) + labourNum),
        };
      };

      setKarigarVouchers((prev) => [optimistic, ...prev]);
      setKarigars((prev) => prev.map(applyOptimisticBalance));
      setKarigarError(null);

      try {
        const res = await client.post('/v1/karigar/vouchers', body);
        const server = fromServerVoucher(res.voucher, karigarName);
        setKarigarVouchers((prev) => prev.map((v) => (v.id === tempId ? server : v)));
        // Balances are derived server-side; converge to the ledger truth.
        refreshKarigarBalance(karigarId);
        return server;
      } catch (err) {
        setKarigarVouchers((prev) => prev.filter((v) => v.id !== tempId));
        if (previousKarigar) {
          setKarigars((prev) =>
            prev.map((k) => (String(k.id) === karigarId ? previousKarigar : k)),
          );
        }
        const friendly = friendlyKarigarError(err);
        setKarigarError(friendly);
        throw friendly;
      }
    },
    [refreshKarigarBalance],
  );

  return {
    karigars,
    karigarVouchers,
    karigarLoading,
    karigarError,
    refetchKarigar,
    addKarigarVoucher,
  };
}
