/**
 * Stock/inventory API adapter (Phase 3 strangler).
 *
 * Mirrors the local implementation's state/action shape
 * (JewelleryContext.jsx: addStockItem / updateStockItem / deleteStockItem,
 *  `stock`, `stockMovements`) so components never change.
 *
 * Backend: ~/workspace/jewelry-os-server, module B (inventory).
 *  - POST /v1/inventory/items
 *  - GET  /v1/inventory/items?state=&branch_id=&cursor=&limit=
 *  - PATCH /v1/inventory/items/:id            (tag_code, cost_value only)
 *  - GET  /v1/inventory/movements?tagged_item_id=
 *  - GET  /v1/branches                        (tenant's branches)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* mapping helpers                                                     */
/* ------------------------------------------------------------------ */

// Backend enum state -> frontend display status (StockModule.jsx uses 'In Stock').
const STATE_TO_STATUS = {
  in_stock: 'In Stock',
  reserved: 'Reserved',
  in_transit: 'In Transit',
  sold: 'Sold',
  memo_out: 'On Memo',
  customer_owned: 'Customer Owned',
  scrapped: 'Scrapped',
  quarantine: 'Quarantine',
};

const MOVEMENT_TYPE_MAP = {
  RECEIPT: 'PURCHASE',
  SALE_OUT: 'SALE',
  TRANSFER_OUT: 'TRANSFER',
  TRANSFER_IN: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
};

// Backend decimal-string fields accept <= 3dp (weights) / <= 4dp (money).
// Frontend Numbers can carry more precision — canonicalize at the boundary.
const toWeight3 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(3) : '0.000';
};
const toMoney4 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(4) : '0.0000';
};

/** fineness ("916" / "916.0") <- purityPercent (91.67 -> "916.7") or purityKarat ("22K (BIS 916)" -> "916"). */
function deriveFineness(item) {
  const pct = Number(item.purityPercent);
  if (Number.isFinite(pct) && pct > 0) return (Math.round(pct * 10) / 10).toFixed(1).replace(/\.0$/, '');
  const m = String(item.purityKarat || '').match(/(\d{3})/);
  if (m) return m[1];
  return null;
}

const genTagCode = (item) =>
  item.barcode || item.itemCode || item.tagCode || 'TAG-' + Date.now().toString(36).toUpperCase();

/** Server item -> frontend stock item, merged with the local overlay (frontend-only fields). */
function mapServerItem(server, overlay = {}) {
  const fineness = server.fineness != null ? Number(server.fineness) : null;
  return {
    // identity: server UUID replaces the local 'STK-…' id once synced
    id: server.id,
    serverId: server.id,
    tagCode: server.tag_code,
    itemCode: overlay.itemCode ?? server.tag_code,
    barcode: overlay.barcode ?? server.tag_code,
    // weights: decimal strings -> Numbers at the boundary
    grossWeight: Number(server.gross_wt),
    netWeight: Number(server.net_wt),
    stoneWeight: Number(server.stone_wt ?? 0),
    otherWeight: Number(server.other_wt ?? 0),
    fineness,
    purityPercent: overlay.purityPercent ?? (fineness != null ? fineness / 10 : null),
    purityKarat: overlay.purityKarat ?? null,
    metalType: overlay.metalType ?? 'Gold',
    costValue: server.cost_value,
    cost: overlay.cost ?? Number(server.cost_value ?? 0),
    status: STATE_TO_STATUS[server.state] ?? server.state,
    branchId: server.branch_id,
    catalogItemId: server.catalog_item_id ?? null,
    createdAt: server.created_at,
    synced: true,
    // frontend-only display fields never sent to the server
    image: overlay.image ?? null,
    stockType: overlay.stockType ?? null,
    category: overlay.category ?? null,
    subCategory: overlay.subCategory ?? null,
    makingChargeType: overlay.makingChargeType ?? null,
    makingChargeValue: overlay.makingChargeValue ?? null,
    firmId: overlay.firmId ?? null,
    firmCode: overlay.firmCode ?? null,
    firmName: overlay.firmName ?? null,
  };
}

/** Server movement -> frontend stockMovements entry (mirrors the local ledger shape). */
function mapServerMovement(m, itemLookup) {
  const item = itemLookup(m.taggedItemId) || {};
  return {
    id: m.id,
    movementNo: 'MOV-' + String(m.id).slice(0, 8).toUpperCase(),
    stockId: m.taggedItemId,
    itemCode: item.itemCode || m.tagCode || 'ITEM',
    barcode: item.barcode || m.tagCode || '',
    type: MOVEMENT_TYPE_MAP[m.movement_type] || m.movement_type,
    date: String(m.occurred_at || '').slice(0, 10),
    timestamp: m.occurred_at,
    grossWeight: Number(m.weight_delta ?? 0),
    netWeight: Number(m.weight_delta ?? 0),
    metalType: item.metalType || 'Gold',
    referenceId: m.source_doc_id,
    notes: `${m.movement_type} via ${m.source_doc_type}`,
    synced: true,
  };
}

/* ------------------------------------------------------------------ */
/* hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * useStockApi({ api, enabled, branchId })
 *
 * @param {object} api      client from createApiClient (Bearer attached)
 * @param {boolean} enabled only fetch when true (API mode active)
 * @param {string} [branchId] branch UUID; when omitted the first tenant
 *                           branch from GET /branches is used
 * @returns { stock, stockMovements, fetchItemMovements, addStockItem,
 *            updateStockItem, deleteStockItem, stockLoading, stockError,
 *            refetchStock, resolvedBranchId }
 */
export function useStockApi({ api, enabled, branchId }) {
  const [stock, setStock] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [resolvedBranchId, setResolvedBranchId] = useState(branchId || null);

  // Frontend-only fields (firmId, image, metalType, purityKarat, …) keyed by server id.
  // Never sent to the backend; merged onto reads via mapServerItem.
  const overlayRef = useRef({});
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mergeOverlay = useCallback((serverId, fields) => {
    overlayRef.current = {
      ...overlayRef.current,
      [serverId]: { ...(overlayRef.current[serverId] || {}), ...fields },
    };
  }, []);

  /* ---------------- branch resolution ---------------- */
  useEffect(() => {
    if (!enabled || !api) return;
    if (branchId) {
      setResolvedBranchId(branchId);
      return;
    }
    let cancelled = false;
    api
      .get('/v1/branches')
      .then((res) => {
        if (cancelled || !mountedRef.current) return;
        const first = res && res.branches && res.branches[0];
        setResolvedBranchId(first ? first.id : null);
        if (!first) setStockError('No branches found for this tenant.');
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) setStockError(err.message || 'Failed to load branches.');
      });
    return () => {
      cancelled = true;
    };
  }, [api, enabled, branchId]);

  /* ---------------- load stock ---------------- */
  const loadStock = useCallback(async () => {
    if (!api || !enabled || !resolvedBranchId) return;
    setStockLoading(true);
    setStockError(null);
    try {
      const items = [];
      let cursor;
      // Follow cursor pages until exhausted (limit 100/page).
      do {
        const res = await api.get('/v1/inventory/items', {
          query: { branch_id: resolvedBranchId, limit: 100, cursor },
        });
        for (const s of res.items || []) items.push(mapServerItem(s, overlayRef.current[s.id]));
        cursor = res.next_cursor || undefined;
      } while (cursor);
      if (mountedRef.current) setStock(items);
    } catch (err) {
      if (mountedRef.current) setStockError(err.message || 'Failed to load stock.');
    } finally {
      if (mountedRef.current) setStockLoading(false);
    }
  }, [api, enabled, resolvedBranchId]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const refetchStock = useCallback(() => loadStock(), [loadStock]);

  /* ---------------- add ---------------- */
  const addStockItem = useCallback(
    async (newItem) => {
      if (!api || !resolvedBranchId) {
        setStockError('Stock API is not ready (no branch resolved).');
        return null;
      }
      const tagCode = genTagCode(newItem);
      const payload = {
        branch_id: resolvedBranchId,
        tag_code: tagCode,
        gross_wt: toWeight3(newItem.grossWeight),
        net_wt: toWeight3(newItem.netWeight),
        stone_wt: toWeight3(newItem.stoneWeight),
        fineness: deriveFineness(newItem),
        cost_value: toMoney4(newItem.cost ?? newItem.price),
      };

      // Optimistic temp item (local id until the server answers).
      const tempId = 'STK-TMP-' + Date.now().toString(36);
      const overlayFields = {
        itemCode: newItem.itemCode || tagCode,
        barcode: newItem.barcode || tagCode,
        metalType: newItem.metalType || 'Gold',
        purityKarat: newItem.purityKarat || null,
        purityPercent: newItem.purityPercent ?? null,
        makingChargeType: newItem.makingChargeType || null,
        makingChargeValue: newItem.makingChargeValue ?? null,
        image: newItem.image || null,
        stockType: newItem.stockType || null,
        category: newItem.category || null,
        subCategory: newItem.subCategory || null,
        firmId: newItem.firmId || null,
        firmCode: newItem.firmCode || null,
        firmName: newItem.firmName || null,
        cost: Number(newItem.cost ?? newItem.price ?? 0),
      };
      const optimistic = {
        id: tempId,
        serverId: null,
        tagCode,
        ...overlayFields,
        itemCode: overlayFields.itemCode,
        barcode: overlayFields.barcode,
        grossWeight: Number(newItem.grossWeight) || 0,
        netWeight: Number(newItem.netWeight) || 0,
        stoneWeight: Number(newItem.stoneWeight) || 0,
        status: 'In Stock',
        branchId: resolvedBranchId,
        synced: false,
      };
      setStock((prev) => [optimistic, ...prev]);

      try {
        const res = await api.post('/v1/inventory/items', payload);
        const server = res.item;
        mergeOverlay(server.id, overlayFields);
        const mapped = mapServerItem(server, overlayFields);
        setStock((prev) => prev.map((it) => (it.id === tempId ? mapped : it)));

        // Mirror the local ledger entry (backend also wrote a RECEIPT movement server-side).
        const movement = {
          id: 'SM-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
          movementNo: 'MOV-' + String(Date.now()).slice(-6),
          stockId: mapped.id,
          itemCode: mapped.itemCode,
          barcode: mapped.barcode,
          type: 'PURCHASE',
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          grossWeight: mapped.grossWeight,
          netWeight: mapped.netWeight,
          metalType: mapped.metalType,
          referenceId: mapped.id,
          notes: `Added item "${mapped.itemCode}" to inventory`,
          synced: false,
        };
        setStockMovements((prev) => [movement, ...prev]);
        return mapped;
      } catch (err) {
        // Roll back the optimistic row; surface the failure.
        setStock((prev) => prev.filter((it) => it.id !== tempId));
        setStockError(err.message || 'Failed to add stock item.');
        return null;
      }
    },
    [api, resolvedBranchId, mergeOverlay],
  );

  /* ---------------- update ----------------
   * NOTE: the backend PATCH only accepts { tag_code, cost_value } —
   * weight/purity/state changes must go through movements, transfers or
   * stock counts. All other fields update the local overlay only, so the
   * UI keeps working while the server stays the source of truth for
   * tag_code/cost_value. */
  const updateStockItem = useCallback(
    async (id, updatedFields = {}) => {
      const prev = stock.find((it) => it.id === id);
      const serverPatch = {};
      const tagCode = updatedFields.barcode ?? updatedFields.itemCode ?? updatedFields.tagCode;
      if (tagCode !== undefined) serverPatch.tag_code = String(tagCode);
      const cost = updatedFields.cost ?? updatedFields.price ?? updatedFields.costValue;
      if (cost !== undefined) serverPatch.cost_value = toMoney4(cost);

      const overlayFields = { ...updatedFields };
      delete overlayFields.tagCode;

      // Optimistic local apply.
      setStock((list) => list.map((it) => (it.id === id ? { ...it, ...updatedFields } : it)));
      if (prev && prev.serverId) mergeOverlay(prev.serverId, overlayFields);

      // Temp (unsynced) items: overlay/local only, nothing to PATCH.
      if (!prev || !prev.serverId) return;

      if (Object.keys(serverPatch).length === 0) return; // overlay-only update

      try {
        const res = await api.patch(`/v1/inventory/items/${prev.serverId}`, serverPatch);
        const mapped = mapServerItem(res.item, overlayRef.current[res.item.id] || {});
        setStock((list) => list.map((it) => (it.id === id ? { ...it, ...mapped, id } : it)));
      } catch (err) {
        // Roll back to the pre-update snapshot.
        setStock((list) => list.map((it) => (it.id === id ? prev : it)));
        setStockError(err.message || 'Failed to update stock item.');
      }
    },
    [api, stock, mergeOverlay],
  );

  /* ---------------- delete ----------------
   * The backend has NO item delete — removals go through stock counts
   * (POST /v1/counts → approve), which book audited ADJUSTMENT movements.
   * Honest behavior here: remove from the local list and flag the
   * limitation via stockError when the item was server-synced.
   * We never fake a server delete. */
  const deleteStockItem = useCallback(
    (id) => {
      const target = stock.find((it) => it.id === id);
      setStock((prev) => prev.filter((item) => item.id !== id));
      if (target && target.serverId) {
        delete overlayRef.current[target.serverId];
        setStockError('Item removals go through stock counts in API mode.');
      }
    },
    [stock],
  );

  /* ---------------- movements ---------------- */
  const fetchItemMovements = useCallback(
    async (itemId) => {
      if (!api || !enabled) return [];
      const target = stock.find((it) => it.id === itemId);
      const serverId = (target && target.serverId) || itemId;
      const tagCode = target && target.tagCode;
      try {
        const res = await api.get('/v1/inventory/movements', {
          query: { tagged_item_id: serverId, limit: 100 },
        });
        const rows = res.movements || [];
        const lookup = (sid) => stock.find((it) => it.id === sid || it.serverId === sid);
        const mapped = rows.map((m) =>
          mapServerMovement({ ...m, taggedItemId: serverId, tagCode }, lookup),
        );
        // Merge deduped by server movement id.
        setStockMovements((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const fresh = mapped.filter((m) => !seen.has(m.id));
          return [...fresh, ...prev];
        });
        return mapped;
      } catch (err) {
        // tag_code fallback: the id may be a temp/local id the server doesn't know.
        if (tagCode) {
          try {
            const res = await api.get('/v1/inventory/movements', {
              query: { tag_code: tagCode, limit: 100 },
            });
            const rows = res.movements || [];
            const lookup = (sid) => stock.find((it) => it.id === sid || it.serverId === sid);
            const mapped = rows.map((m) =>
              mapServerMovement({ ...m, taggedItemId: serverId, tagCode }, lookup),
            );
            setStockMovements((prev) => {
              const seen = new Set(prev.map((p) => p.id));
              return [...mapped.filter((m) => !seen.has(m.id)), ...prev];
            });
            return mapped;
          } catch {
            /* fall through */
          }
        }
        setStockError(err.message || 'Failed to load item movements.');
        return [];
      }
    },
    [api, enabled, stock],
  );

  return {
    stock,
    stockMovements,
    fetchItemMovements,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    stockLoading,
    stockError,
    refetchStock,
    resolvedBranchId,
  };
}
