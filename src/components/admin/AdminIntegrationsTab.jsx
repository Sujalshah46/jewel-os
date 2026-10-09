import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Globe,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit2,
  Key,
  Shield,
  Wifi,
  ExternalLink,
  Printer,
  CreditCard,
  MessageSquare
} from 'lucide-react';

export default function AdminIntegrationsTab() {
  const {
    integrations,
    testIntegrationConnection,
    updateIntegration
  } = useJewellery();

  const [testingId, setTestingId] = useState(null);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleTestPing = (id, name) => {
    setTestingId(id);
    setTimeout(() => {
      testIntegrationConnection(id);
      setTestingId(null);
      setSuccessMsg(`Demo simulation for "${name}" completed. No provider request was sent.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 600);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingIntegration) return;
    updateIntegration(editingIntegration.id, {
      description: editingIntegration.description
    });
    setEditingIntegration(null);
    setSuccessMsg('Integration settings updated successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              INTEGRATIONS & CONNECTED SERVICES
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Demo-only integration screens. This build sends no provider requests and must not be used to store credentials.
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map(item => {
          const isTesting = testingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm mt-0.5">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{item.provider}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                      item.status === 'Connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Demo</span>
                  </span>
                </div>

                <div className="py-3 space-y-2 text-xs text-slate-300">
                  <p className="text-[11px] text-slate-400">{item.description}</p>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Provider connection:</span>
                      <span className="text-amber-300 font-semibold">Not configured</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Last Health Check:</span>
                      <span className="text-slate-300 font-mono text-[10px]">{item.lastPing}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTestPing(item.id, item.name)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Pinging...' : 'Test Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingIntegration(item)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
                  title="Configure Integration"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ----------------- MODAL: EDIT INTEGRATION ----------------- */}
      {editingIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Configure: {editingIntegration.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingIntegration(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  DEMONSTRATION ONLY
                </label>
                <p className="rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-slate-200">No real credentials, endpoints, or connection status can be configured here. Use a server-side secret manager when provider integrations are implemented.</p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingIntegration(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
