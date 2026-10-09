import { MAX_BACKUP_BYTES } from '../../utils/backup';
import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Settings,
  Globe,
  Database,
  Save,
  CheckCircle,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function AdminSettingsTab() {
  const {
    exportDatabaseJson,
    importDatabaseJson,
    resetToAuditData
  } = useJewellery();

  const [systemLocale, setSystemLocale] = useState('en-IN');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > MAX_BACKUP_BYTES) { alert('Backup exceeds the 10 MB limit.'); return; }
    if (!window.confirm('Replace the entire synthetic workspace? Export a backup first. Incomplete legacy backups require manual recovery.')) return;
    const reader = new FileReader();
    reader.onerror = () => alert('Backup could not be read. No records were changed.');
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        importDatabaseJson(parsed);
        setSuccessMsg('Database restored successfully from JSON backup!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to restore database');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('WARNING: Reset all tables to audit seed data? This will reset all local changes.')) {
      resetToAuditData();
      setSuccessMsg('System reset to default seed data.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SYSTEM SETTINGS & DATABASE MANAGEMENT
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure system localization, timezone, currency format, and trigger full offline database backup exports or recovery imports.
          </p>
        </div>
      </div>

      {/* Localization Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Globe className="w-4 h-4" /> 1. Localization, Currency & Date Display
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              CURRENCY SYMBOL
            </label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              NUMBER LOCALE FORMAT
            </label>
            <select
              value={systemLocale}
              onChange={(e) => setSystemLocale(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
            >
              <option value="en-IN">Indian Rupee (Lakhs & Crores: ₹1,00,000)</option>
              <option value="en-US">International (Millions: $100,000)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              DATE FORMAT
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Backup & Recovery */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Database className="w-4 h-4" /> 2. Complete Database Backup & Local Recovery
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Export */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export JSON Database</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Generates a snapshot containing all firms, clients, branches, staff, rates, inventory, and invoices.
              </p>
            </div>
            <button
              onClick={exportDatabaseJson}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-center"
            >
              Download Backup File
            </button>
          </div>

          {/* Import */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Restore From JSON</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Restores state with strict schema validation against corruption.
              </p>
            </div>
            <label className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-center cursor-pointer block">
              <span>Select Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Factory Audit Reset</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Purges local cache and restores original seed data for demonstration.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 w-full py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 font-bold rounded-xl transition-colors text-center"
            >
              Reset to Factory Seeds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
