/**
 * Customers API adapter (Phase 3 strangler).
 *
 * Mirrors the local implementation in src/context/JewelleryContext.jsx:
 *   addCustomer(newCust) -> created cust   (local: sync; here: async, resolves
 *                                           with the server record)
 *   updateCustomer(id, updatedFields)      (local: sync; here: async)
 *
 * Same frontend customer field shape as src/components/modules/CustomerModule.jsx.
 * Fields with no backend column are stashed in `address.extensions` on write
 * and rehydrated on read, so they round-trip losslessly.
 *
 * Usage (wired by the parent, never here):
 *   const { customers, addCustomer, updateCustomer, customersLoading,
 *           customersError, refetchCustomers } = useCustomersApi({ api, enabled });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Frontend-only fields (no backend column) -> persisted inside address.extensions.
const EXTENSION_FIELDS = [
  'mr', 'firstName', 'lastName', 'fullName', 'companyName', 'gender',
  'fatherName', 'dob', 'pan', 'aadhaar', 'kit', 'userType',
  'designation', 'monthlySalary', 'speciality', 'licenseNo',
  'girviInterestRate', 'loyaltyPoints', 'currentUdhaarBalance',
];

function displayName(cust) {
  const full = String(cust.fullName || '').trim();
  if (full) return full;
  const composed = `${cust.firstName || ''} ${cust.lastName || ''}`.trim();
  if (composed) return composed;
  return String(cust.name || '').trim();
}

/** Frontend customer object -> backend party body. */
function toServerBody(cust) {
  const phone = String(cust.mobile ?? cust.phone ?? '').trim();
  const extensions = {};
  for (const key of EXTENSION_FIELDS) {
    if (cust[key] !== undefined) extensions[key] = cust[key];
  }
  const rawAddress = typeof cust.address === 'string' ? cust.address : '';
  return {
    name: displayName(cust) || 'Unnamed Customer',
    phone: phone || null, // null avoids unique-index collisions on empty phones
    email: String(cust.email || '').trim() || null,
    address: {
      line1: rawAddress,
      city: cust.city || '',
      state: cust.state || '',
      country: cust.country || 'India',
      pincode: cust.pincode || '',
      extensions,
    },
    credit_limit: String(cust.creditLimit ?? cust.credit_limit ?? 0),
  };
}

/** Backend party -> frontend customer object (extensions rehydrated). */
function fromServer(party) {
  const addr = party.address && typeof party.address === 'object' ? party.address : {};
  const ext = addr.extensions && typeof addr.extensions === 'object' ? addr.extensions : {};
  const name = party.name || '';
  return {
    id: party.id,
    // Backend-native fields, flattened to the frontend shape.
    name,
    phone: party.phone || '',
    mobile: party.phone || '', // form reads `mobile`; keep both in sync
    email: party.email || '',
    address: typeof addr.line1 === 'string' ? addr.line1 : '',
    city: addr.city || '',
    state: addr.state || '',
    country: addr.country || '',
    pincode: addr.pincode || '',
    creditLimit: party.creditLimit != null ? Number(party.creditLimit) : 0,
    // Frontend-only fields, rehydrated from extensions (local defaults preserved).
    mr: ext.mr || 'Mr.',
    firstName: ext.firstName || '',
    lastName: ext.lastName || '',
    fullName: ext.fullName || name,
    companyName: ext.companyName || '',
    gender: ext.gender || 'Male',
    fatherName: ext.fatherName || '',
    dob: ext.dob || '',
    pan: ext.pan || '',
    aadhaar: ext.aadhaar || '',
    kit: ext.kit || '',
    userType: ext.userType || 'Customer',
    designation: ext.designation || '',
    monthlySalary: ext.monthlySalary || '',
    speciality: ext.speciality || '',
    licenseNo: ext.licenseNo || '',
    girviInterestRate: ext.girviInterestRate || '1.50% / Month',
    loyaltyPoints: ext.loyaltyPoints ?? 50,
    currentUdhaarBalance: ext.currentUdhaarBalance ?? 0,
    // Backend metadata (harmless to components).
    type: party.type,
    archivedAt: party.archivedAt || null,
    createdAt: party.createdAt,
    updatedAt: party.updatedAt,
  };
}

function friendlyError(err) {
  if (err && err.code === 'DUPLICATE_PHONE') {
    const friendly = new Error('A customer with this phone number already exists');
    friendly.code = 'DUPLICATE_PHONE';
    friendly.status = err.status;
    friendly.correlationId = err.correlationId;
    return friendly;
  }
  return err;
}

export function useCustomersApi({ api, enabled }) {
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState(null);

  const apiRef = useRef(api);
  apiRef.current = api;
  const customersRef = useRef(customers);
  customersRef.current = customers;

  const refetchCustomers = useCallback(async (signal) => {
    const client = apiRef.current;
    if (!client) return;
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const all = [];
      let cursor = null;
      do {
        const res = await client.get('/v1/parties', {
          query: { type: 'customer', cursor, limit: 200 },
          signal,
        });
        const items = Array.isArray(res && res.items) ? res.items : [];
        for (const party of items) all.push(fromServer(party));
        cursor = (res && res.nextCursor) || null;
      } while (cursor);
      setCustomers(all);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setCustomersError(err);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    refetchCustomers(ctrl.signal);
    return () => ctrl.abort();
  }, [enabled, refetchCustomers]);

  /** Optimistic create: temp record replaced by the server record on success. */
  const addCustomer = useCallback(async (newCust) => {
    const client = apiRef.current;
    if (!client) throw new Error('API client is not available');
    const tempId = 'temp-cust-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const optimistic = {
      ...fromServer({ // derive sane defaults through the same mapping
        id: tempId,
        type: 'customer',
        name: displayName(newCust),
        phone: String(newCust.mobile ?? newCust.phone ?? '').trim() || null,
        email: newCust.email || null,
        address: null,
        creditLimit: String(newCust.creditLimit ?? 0),
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      ...newCust,
      id: tempId,
      currentUdhaarBalance: newCust.currentUdhaarBalance ?? 0,
      loyaltyPoints: newCust.loyaltyPoints ?? 50,
      _pending: true,
    };
    setCustomers((prev) => [optimistic, ...prev]);
    setCustomersError(null);
    try {
      const res = await client.post('/v1/parties', { type: 'customer', ...toServerBody(newCust) });
      const created = fromServer(res.party);
      setCustomers((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      return created;
    } catch (err) {
      setCustomers((prev) => prev.filter((c) => c.id !== tempId));
      const friendly = friendlyError(err);
      setCustomersError(friendly);
      throw friendly;
    }
  }, []);

  /** Optimistic patch: full-body PATCH (preserves extensions); rollback on failure. */
  const updateCustomer = useCallback(async (id, updatedFields) => {
    const client = apiRef.current;
    if (!client) throw new Error('API client is not available');
    const previous = customersRef.current.find((c) => c.id === id) || null;
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)));
    setCustomersError(null);
    try {
      const merged = { ...(previous || {}), ...updatedFields };
      const res = await client.patch(`/v1/parties/${id}`, toServerBody(merged));
      const server = fromServer(res.party);
      // Keep the authoritative server record, but don't lose any flat fields the
      // backend intentionally ignores (extensions already cover them via mapping).
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedFields, ...server } : c)));
      return server;
    } catch (err) {
      if (previous) {
        setCustomers((prev) => prev.map((c) => (c.id === id ? previous : c)));
      }
      const friendly = friendlyError(err);
      setCustomersError(friendly);
      throw friendly;
    }
  }, []);

  return {
    customers,
    addCustomer,
    updateCustomer,
    customersLoading,
    customersError,
    refetchCustomers,
  };
}
