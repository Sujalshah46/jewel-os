/**
 * Rates API adapter (Phase 3 strangler).
 *
 * Drop-in replacement for the local Daily Rates actions in JewelleryContext
 * (updateDailyRate / deleteAllRates / resetDefaultRates). Same state/action
 * shape, so components never change.
 *
 * Backend contract (jewelry-os-server, src/modules/parties):
 * - GET  /v1/catalog/metals                      -> { metals: [{ code, name }] }
 * - POST /v1/catalog/metals/seed                 -> { metals }            (catalog:write)
 * - GET  /v1/catalog/purities?metal_code=gold    -> { purities: [{ id, metalCode, karatLabel, fineness }] }
 * - POST /v1/catalog/purities { metal_code, karat_label (<=16 chars), fineness ("916.0", 1dp) }
 *                                                -> { purity }            (catalog:write, 409 DUPLICATE_PURITY)
 * - POST /v1/rates { metal_code, purity_id, rate_per_gram (decimal string, >0),
 *                     source, effective_at }      -> { rate }              (catalog:write)
 * - GET  /v1/rates/latest?metal_code=gold&purity_id=<uuid>
 *                                                -> { rate | null }       (rate.ratePerGram is a decimal string)
 *
 * Money: the backend speaks decimal strings. Conversion with Number()/String()
 * happens at this boundary only. The per-entry display math below mirrors the
 * local implementation exactly (including its hardcoded 3% tax) — no float
 * "fixes" are applied here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api.js';
import { INITIAL_DAILY_RATES } from '../../data/initialData.js';

/**
 * Frontend rate id -> backend (metal_code, karat_label, fineness) mapping.
 *
 * Decisions:
 * - metal_code: 'Gold' -> 'gold', 'Silver' -> 'silver' (backend enum).
 * - karat_label: frontend `karat` string verbatim — every one is <= 16 chars
 *   (backend max), e.g. '22K (BIS 916)', 'Fine 999'.
 * - fineness: backend wants per-mille with 1dp ("916.0"); the frontend stores
 *   purityPercent as a percent (91.67). fineness = round1(purityPercent * 10).
 *   Note the 22K entry becomes 916.7 rather than the BIS 916 hallmark stamp —
 *   the frontend's 91.67% is itself a rounded 91.666…%, and 916.7 is the
 *   faithful 1-decimal conversion of it. Purity rows are matched on
 *   karat_label, never on fineness, so this never collides.
 */
const RATE_DEFS = [
  { id: 'RATE-001', metalCode: 'gold', karatLabel: '24K', fineness: '1000.0' },
  { id: 'RATE-002', metalCode: 'gold', karatLabel: '22K (BIS 916)', fineness: '916.7' },
  { id: 'RATE-003', metalCode: 'gold', karatLabel: '20K', fineness: '833.4' },
  { id: 'RATE-004', metalCode: 'gold', karatLabel: '18K (BIS 750)', fineness: '750.0' },
  { id: 'RATE-005', metalCode: 'gold', karatLabel: '16K', fineness: '666.7' },
  { id: 'RATE-006', metalCode: 'gold', karatLabel: '14K (BIS 585)', fineness: '583.3' },
  { id: 'RATE-007', metalCode: 'silver', karatLabel: 'Fine 999', fineness: '999.0' },
  { id: 'RATE-008', metalCode: 'silver', karatLabel: 'Sterling 925', fineness: '925.0' },
];

/**
 * Exact mirror of the local updateDailyRate math in JewelleryContext.jsx:
 *   ratePer10Gm = rateNum * 10
 *   taxAmount   = (rateNum * 3) / 100        (hardcoded 3% — mirrors local, not entry.taxPercent)
 *   rateWithTax = rateNum + taxAmount
 * All other entry fields (name, comment, makingChargeDefault, …) pass through.
 */
function applyRateMath(entry, ratePerGram) {
  const rateNum = Number(ratePerGram);
  const ratePer10Gm = rateNum * 10;
  const taxAmount = (rateNum * 3) / 100;
  return {
    ...entry,
    ratePerGram: rateNum,
    ratePer10Gm,
    taxAmount,
    rateWithTax: rateNum + taxAmount,
  };
}

function friendlyRatesError(err, context) {
  const tail = context === 'save' ? ' Your change was not saved.' : '';
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR') return `Could not reach the server.${tail} Check your connection.`;
    if (err.status === 401) return 'Your session expired. Please sign in again.';
    if (err.status === 403) return 'You do not have permission to manage rates. Ask your administrator for catalog access.';
    return `Rates ${context === 'save' ? 'update' : 'load'} failed: ${err.message || err.code}.${tail}`;
  }
  return `Rates ${context === 'save' ? 'update' : 'load'} failed: ${(err && err.message) || 'unknown error'}.${tail}`;
}

/**
 * First-load bootstrap: seed metals, ensure purities, then build the frontend
 * dailyRates array from the latest recorded backend rate per (metal, purity).
 * Entries with no recorded rate are seeded on the backend with the frontend
 * default so history starts from a known value.
 */
async function bootstrapRates(api) {
  let metals = [];
  try {
    metals = (await api.get('/v1/catalog/metals')).metals || [];
  } catch {
    metals = [];
  }
  if (metals.length === 0) {
    metals = (await api.post('/v1/catalog/metals/seed', {})).metals || [];
  }

  // Frontend rate id -> { metalCode, purityId } for updateDailyRate's POSTs.
  const purityById = {};
  for (const metalCode of ['gold', 'silver']) {
    const listed = (await api.get('/v1/catalog/purities', { query: { metal_code: metalCode } })).purities || [];
    const byLabel = new Map(listed.map((p) => [String(p.karatLabel).trim().toLowerCase(), p]));
    for (const def of RATE_DEFS.filter((d) => d.metalCode === metalCode)) {
      const key = def.karatLabel.toLowerCase();
      let purity = byLabel.get(key);
      if (!purity) {
        try {
          purity = (await api.post('/v1/catalog/purities', {
            metal_code: def.metalCode,
            karat_label: def.karatLabel,
            fineness: def.fineness,
          })).purity;
        } catch (err) {
          // Lost a create race — refetch and reuse the winner's row.
          if (err instanceof ApiError && err.code === 'DUPLICATE_PURITY') {
            const again = (await api.get('/v1/catalog/purities', { query: { metal_code: metalCode } })).purities || [];
            purity = again.find((p) => String(p.karatLabel).trim().toLowerCase() === key) || null;
          } else {
            throw err;
          }
        }
        if (purity) byLabel.set(key, purity);
      }
      if (!purity) throw new Error(`Could not resolve purity '${def.karatLabel}' for ${def.metalCode}`);
      purityById[def.id] = { metalCode: def.metalCode, purityId: purity.id };
    }
  }

  const baseById = new Map(INITIAL_DAILY_RATES.map((r) => [r.id, r]));
  const entries = [];
  for (const def of RATE_DEFS) {
    const base = baseById.get(def.id);
    if (!base) continue; // frontend shape drifted — keep local entry untouched
    const { metalCode, purityId } = purityById[def.id];
    const { rate } = await api.get('/v1/rates/latest', {
      query: { metal_code: metalCode, purity_id: purityId },
    });
    let ratePerGram;
    if (rate && rate.ratePerGram != null) {
      ratePerGram = Number(rate.ratePerGram); // decimal string -> Number at the boundary only
    } else {
      await api.post('/v1/rates', {
        metal_code: metalCode,
        purity_id: purityId,
        rate_per_gram: String(Number(base.ratePerGram)),
        source: 'initial-default',
        effective_at: new Date().toISOString(),
      });
      ratePerGram = Number(base.ratePerGram);
    }
    entries.push(applyRateMath(base, ratePerGram));
  }
  return { entries, purityById };
}

/**
 * @param {{ api: object|null, enabled: boolean }} args
 *   api     — client from createApiClient (get/post); null until constructed
 *   enabled — true only in api mode (VITE_DATA_SOURCE=api)
 * @returns {{ dailyRates, updateDailyRate, deleteAllRates, resetDefaultRates,
 *             ratesLoading, ratesError, refetchRates }}
 */
export function useRatesApi({ api, enabled }) {
  const [dailyRates, setDailyRates] = useState(() => INITIAL_DAILY_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const purityByIdRef = useRef({});
  const ratesRef = useRef(dailyRates);
  const liveRef = useRef({ api, enabled });
  liveRef.current = { api, enabled };

  useEffect(() => {
    ratesRef.current = dailyRates;
  }, [dailyRates]);

  const load = useCallback(async () => {
    const { api: a, enabled: e } = liveRef.current;
    if (!e || !a) {
      purityByIdRef.current = {};
      setDailyRates(INITIAL_DAILY_RATES);
      setRatesError(null);
      return;
    }
    setRatesLoading(true);
    setRatesError(null);
    try {
      const { entries, purityById } = await bootstrapRates(a);
      purityByIdRef.current = purityById;
      setDailyRates(entries);
    } catch (err) {
      setRatesError(friendlyRatesError(err, 'load'));
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // First load (and reload when the data source flips).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { api: a, enabled: e } = liveRef.current;
      if (!e || !a) {
        purityByIdRef.current = {};
        setDailyRates(INITIAL_DAILY_RATES);
        return;
      }
      setRatesLoading(true);
      setRatesError(null);
      try {
        const { entries, purityById } = await bootstrapRates(a);
        if (cancelled) return;
        purityByIdRef.current = purityById;
        setDailyRates(entries);
      } catch (err) {
        if (cancelled) return;
        setRatesError(friendlyRatesError(err, 'load'));
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, api]);

  /**
   * Sync-returning like the local version: optimistic local update first,
   * POST the new rate in the background, roll back that entry on ApiError.
   */
  const updateDailyRate = useCallback((id, ratePerGram) => {
    const rateNum = Number(ratePerGram);
    const previous = ratesRef.current.find((r) => r.id === id) || null;
    setDailyRates((prev) => prev.map((r) => (r.id === id ? applyRateMath(r, rateNum) : r)));

    const { api: a, enabled: e } = liveRef.current;
    const mapping = purityByIdRef.current[id];
    if (!e || !a || !mapping) return; // local-only until bootstrap resolves the purity mapping

    (async () => {
      try {
        await a.post('/v1/rates', {
          metal_code: mapping.metalCode,
          purity_id: mapping.purityId,
          rate_per_gram: String(rateNum), // decimal string at the boundary; no float math on money
          source: 'daily-rates-ui',
          effective_at: new Date().toISOString(),
        });
      } catch (err) {
        if (previous) {
          setDailyRates((prev) => prev.map((r) => (r.id === id ? previous : r)));
        }
        setRatesError(friendlyRatesError(err, 'save'));
      }
    })();
  }, []);

  // NOTE: the backend has no delete/reset endpoint — metal_rates is append-only
  // rate history. These two actions reset the local display state only; the
  // server's recorded rates are untouched and the next refetch restores them.
  const deleteAllRates = useCallback(() => {
    setDailyRates([]);
  }, []);

  const resetDefaultRates = useCallback(() => {
    setDailyRates(INITIAL_DAILY_RATES);
  }, []);

  /**
   * 24K base-rate cascade: recalculate every gold karat proportionally from
   * the 24K per-gram base and persist each one. Mirrors the local
   * handleBaseRateChange math in DailyRatesModule (rate = base * fineness/1000).
   * Optimistic for all entries, then one POST per gold purity; on failure the
   * affected entries roll back and ratesError is set.
   */
  const updateBaseRate = useCallback((base24kPerGram) => {
    const base = Number(base24kPerGram);
    if (!base || base <= 0) return;

    const defsById = new Map(RATE_DEFS.map((d) => [d.id, d]));
    const derived = new Map(); // id -> ratePerGram
    for (const r of ratesRef.current) {
      const def = defsById.get(r.id);
      if (!def || def.metalCode !== 'gold') continue;
      const ratePerGram = Number((base * (Number(def.fineness) / 1000)).toFixed(2));
      derived.set(r.id, ratePerGram);
    }
    if (derived.size === 0) return;

    const previous = new Map();
    for (const [id] of derived) {
      const found = ratesRef.current.find((r) => r.id === id);
      if (found) previous.set(id, found);
    }
    setDailyRates((prev) =>
      prev.map((r) => (derived.has(r.id) ? applyRateMath(r, derived.get(r.id)) : r))
    );

    const { api: a, enabled: e } = liveRef.current;
    if (!e || !a) return; // local-only until bootstrap
    (async () => {
      try {
        for (const [id, ratePerGram] of derived) {
          const mapping = purityByIdRef.current[id];
          if (!mapping) continue;
          await a.post('/v1/rates', {
            metal_code: mapping.metalCode,
            purity_id: mapping.purityId,
            rate_per_gram: String(ratePerGram),
            source: 'daily-rates-ui-base-cascade',
            effective_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        setDailyRates((prev) =>
          prev.map((r) => (previous.has(r.id) ? previous.get(r.id) : r))
        );
        setRatesError(friendlyRatesError(err, 'save'));
      }
    })();
  }, []);

  return {
    dailyRates,
    updateDailyRate,
    updateBaseRate,
    deleteAllRates,
    resetDefaultRates,
    ratesLoading,
    ratesError,
    refetchRates: load,
  };
}
