import React, { useState } from 'react';
import { useJewellery } from '../context/JewelleryContext';

/**
 * Login / signup gate shown only when VITE_DATA_SOURCE=api and there is no
 * active server session. Local mode never renders this screen.
 */
export default function LoginScreen() {
  const { login, signup } = useJewellery();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        if (!name.trim() || !tenantName.trim()) {
          throw new Error('Name and business name are required to create an account.');
        }
        await signup(email.trim(), password, name.trim(), tenantName.trim());
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#C6A15B]/30 p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[#111827]">Jewellery OS</div>
          <div className="text-sm text-[#64748B] mt-1">
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Business / firm name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                autoComplete="organization"
              />
            </>
          )}
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#C6A15B] hover:bg-[#b08d4e] disabled:opacity-60 text-white font-semibold rounded-lg px-3 py-2"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm">
          {mode === 'login' ? (
            <button className="text-[#C6A15B] font-medium" onClick={() => { setMode('signup'); setError(''); }}>
              New here? Create an account
            </button>
          ) : (
            <button className="text-[#C6A15B] font-medium" onClick={() => { setMode('login'); setError(''); }}>
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
