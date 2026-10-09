import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';

async function api(path, { tenantId, csrfToken, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (tenantId) headers.set('X-Tenant-Id', tenantId);
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(path, { ...options, headers, credentials: 'include' });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result?.error?.message || result?.message || 'Request failed.'), { status: response.status });
  return result;
}

export default function OperationalApp() {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [csrfToken, setCsrfToken] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [draft, setDraft] = useState({ name: '', mobile: '', email: '', address: '', city: '' });
  const [editingId, setEditingId] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const requestGeneration = useRef(0);
  const selectedTenant = useRef('');
  const clearWorkspace = () => {
    requestGeneration.current++;
    selectedTenant.current = '';
    setUser(null); setMemberships([]); setCsrfToken(''); setTenantId(''); setCustomers([]); setEditingId('');
    setDraft({ name: '', mobile: '', email: '', address: '', city: '' });
  };
  const showFailure = error => {
    if ([401, 403].includes(error.status)) clearWorkspace();
    setMessage(error.message);
  };

  const selectedMembership = useMemo(() => memberships.find(item => item.tenantId === tenantId), [memberships, tenantId]);

  const loadCustomers = useCallback(async (tenant) => {
    if (!tenant || selectedTenant.current !== tenant) return;
    const generation = ++requestGeneration.current;
    const result = await api('/api/customers?page=1&pageSize=100', { tenantId: tenant });
    if (generation === requestGeneration.current && selectedTenant.current === tenant) setCustomers(result.items);
  }, []);

  const loadWorkspace = useCallback(async () => {
    const generation = ++requestGeneration.current;
    const session = await api('/api/auth/get-session');
    if (!session?.user || generation !== requestGeneration.current) return;
    const result = await api('/api/memberships');
    if (generation !== requestGeneration.current) return;
    setUser(session.user);
    setMemberships(result.memberships);
    setCsrfToken(result.csrfToken);
    const preferred = result.memberships.find(item => item.tenantId === selectedTenant.current) || result.memberships[0];
    if (preferred) {
      selectedTenant.current = preferred.tenantId;
      setTenantId(preferred.tenantId);
      await loadCustomers(preferred.tenantId);
    }
  }, [loadCustomers]);

  useEffect(() => {
    loadWorkspace().catch(showFailure).finally(() => setLoading(false));
  }, []); // Initial session discovery only.

  const switchTenant = async (nextTenantId) => {
    requestGeneration.current++;
    selectedTenant.current = nextTenantId;
    setCustomers([]);
    setDraft({ name: '', mobile: '', email: '', address: '', city: '' });
    setEditingId('');
    setTenantId(nextTenantId);
    setMessage('');
    try {
      await loadCustomers(nextTenantId);
    } catch (error) {
      if (selectedTenant.current === nextTenantId) { setCustomers([]); showFailure(error); }
    }
  };

  const signIn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api('/api/auth/sign-in/email', { method: 'POST', body: JSON.stringify(credentials) });
      await loadWorkspace();
      setCredentials({ email: '', password: '' });
    } catch (error) { showFailure(error); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await api('/api/auth/sign-out', { method: 'POST' });
      clearWorkspace();
      setDraft({ name: '', mobile: '', email: '', address: '', city: '' });
      setMessage('Signed out.');
    } catch (error) { showFailure(error); }
    finally { setBusy(false); }
  };

  const createCustomer = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      await api('/api/customers', { method: 'POST', tenantId, csrfToken, body: JSON.stringify(draft) });
      setDraft({ name: '', mobile: '', email: '', address: '', city: '' });
      await loadCustomers(tenantId);
      setMessage('Customer saved to the selected tenant.');
    } catch (error) { showFailure(error); }
    finally { setBusy(false); }
  };

  const saveCustomer = async (event) => {
    if (!editingId) return createCustomer(event);
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await api(`/api/customers/${encodeURIComponent(editingId)}`, { method: 'PATCH', tenantId, csrfToken, body: JSON.stringify(draft) });
      setEditingId('');
      setDraft({ name: '', mobile: '', email: '', address: '', city: '' });
      await loadCustomers(tenantId);
      setMessage('Customer updated in the selected tenant.');
    } catch (error) { showFailure(error); }
    finally { setBusy(false); }
  };

  const beginEdit = customer => {
    setEditingId(customer.id);
    setDraft({ name: customer.name, mobile: customer.mobile, email: customer.email || '', address: customer.address || '', city: customer.city || '' });
  };

  const archiveCustomer = async (id) => {
    setBusy(true); setMessage('');
    try {
      await api(`/api/customers/${encodeURIComponent(id)}/archive`, { method: 'POST', tenantId, csrfToken, body: JSON.stringify({ reason: 'Removed by tenant operator' }) });
      await loadCustomers(tenantId);
      setMessage('Customer archived.');
    } catch (error) { showFailure(error); }
    finally { setBusy(false); }
  };

  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-slate-100">Checking operational session…</main>;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-5">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Jewellery OS · Operational mode</p><h1 className="mt-2 text-2xl font-bold">Customer directory</h1></div>
          {user && <div className="flex items-center gap-3"><span className="text-sm text-slate-300">{user.name}</span><button disabled={busy} onClick={signOut} className="rounded border border-slate-600 px-3 py-2 text-sm">Sign out</button></div>}
        </header>
        <aside className="rounded-lg border border-amber-700 bg-amber-950/50 p-4 text-sm text-amber-100">
          This operational workspace serves authenticated server-backed customers only. Billing, stock, transfers, purchases, returns, accounting, rates, tag/RFID tools, schemes, Girvi, karigar, integrations, and administration remain unavailable until separately migrated and validated.
        </aside>
        {message && <p role="status" className="rounded bg-slate-800 p-3 text-sm">{message}</p>}
        {!user ? (
          <form onSubmit={signIn} className="max-w-md space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <label className="block text-sm">Email<input autoComplete="username" required type="email" value={credentials.email} onChange={e => setCredentials(v => ({ ...v, email: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
            <label className="block text-sm">Password<input autoComplete="current-password" required type="password" value={credentials.password} onChange={e => setCredentials(v => ({ ...v, password: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
            <p className="text-xs text-slate-400">Accounts are provisioned by an authorized operator. Public sign-up is disabled.</p>
            <button disabled={busy} className="rounded bg-amber-500 px-4 py-2 font-bold text-slate-950">Sign in</button>
          </form>
        ) : (
          <>
            {memberships.length === 0 ? <p className="rounded border border-red-800 bg-red-950 p-4">No active tenant membership is available.</p> : <>
              <label className="block max-w-lg text-sm">Authorized tenant<select disabled={busy} value={tenantId} onChange={e => switchTenant(e.target.value)} className="mt-1 w-full rounded bg-slate-900 p-3">
                {memberships.map(item => <option key={item.tenantId} value={item.tenantId}>{item.tenantName} · {item.role}</option>)}
              </select></label>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                <form onSubmit={saveCustomer} className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
                  <h2 className="font-semibold">{editingId ? 'Edit customer' : 'Add customer'}</h2>
                  <label className="block text-sm">Name<input required maxLength="160" value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
                  <label className="block text-sm">Mobile<input required maxLength="32" value={draft.mobile} onChange={e => setDraft(v => ({ ...v, mobile: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
                  <label className="block text-sm">Email<input type="email" maxLength="254" value={draft.email} onChange={e => setDraft(v => ({ ...v, email: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
                  <label className="block text-sm">Address<input maxLength="300" value={draft.address} onChange={e => setDraft(v => ({ ...v, address: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
                  <label className="block text-sm">City<input maxLength="100" value={draft.city} onChange={e => setDraft(v => ({ ...v, city: e.target.value }))} className="mt-1 w-full rounded bg-slate-950 p-3" /></label>
                  <div className="flex gap-2"><button disabled={busy || !selectedMembership} className="rounded bg-amber-500 px-4 py-2 font-bold text-slate-950">{editingId ? 'Update customer' : 'Save customer'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setDraft({ name: '', mobile: '', email: '', address: '', city: '' }); }} className="rounded border border-slate-600 px-4 py-2">Cancel</button>}</div>
                </form>
                <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                  <h2 className="font-semibold">{selectedMembership?.tenantName || 'Tenant'} customers <span className="text-sm text-slate-400">({customers.length})</span></h2>
                  {customers.length === 0 ? <p className="py-6 text-sm text-slate-400">No customers are recorded for this tenant.</p> : <ul className="mt-4 divide-y divide-slate-700">{customers.map(customer => <li key={customer.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{customer.name}</p><p className="text-sm text-slate-400">{customer.mobile}{customer.city ? ` · ${customer.city}` : ''}</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => beginEdit(customer)} className="rounded border border-slate-600 px-3 py-1 text-xs">Edit</button>{['OWNER', 'MANAGER'].includes(selectedMembership?.role) && <button disabled={busy} onClick={() => archiveCustomer(customer.id)} className="rounded border border-slate-600 px-3 py-1 text-xs">Archive</button>}</div></li>)}</ul>}
                </section>
              </div>
            </>}
          </>
        )}
      </div>
    </main>
  );
}
