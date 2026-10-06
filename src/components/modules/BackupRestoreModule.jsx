import React, { useRef } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  ShieldCheck,
  History,
  FileCode
} from 'lucide-react';

export default function BackupRestoreModule() {
  const { exportDatabaseJson, importDatabaseJson, resetToAuditData, activeFirm } = useJewellery();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        importDatabaseJson(json);
        alert('Database successfully restored from JSON backup file!');
      } catch (err) {
        alert('Backup Restore Failed: ' + (err.message || 'Invalid JSON file format.'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              DATABASE BACKUP & SYSTEM DATA CONTROL
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Full Offline JSON Data Export, Point-in-Time Restore & Demo Data Reset
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Export JSON */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-300 w-fit mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Export Complete Database</h3>
            <p className="text-xs text-slate-400 mt-1">
              Download your entire Jewellery OS database (firms, rates, stock, customers, bills, udhaar, daybook) as a secure standalone JSON file.
            </p>
          </div>

          <button
            onClick={exportDatabaseJson}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT BACKUP (.JSON)</span>
          </button>
        </div>

        {/* 2. Import JSON */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-300 w-fit mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Restore From Backup</h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload a previously exported Jewellery OS JSON backup file to instantly restore all business records.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center space-x-1.5 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>CHOOSE BACKUP FILE</span>
            </button>
          </div>
        </div>

        {/* 3. Reset to Audit Data */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-300 w-fit mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Reset to Online Munim Audit State</h3>
            <p className="text-xs text-slate-400 mt-1">
              Reset all records back to the exact demo datasets from the 13-minute video audit (Krishna Jewellers, Avinash, IS86, ₹27.53L daybook).
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset entire system to Online Munim audit initial data?')) {
                resetToAuditData();
                alert('Reset complete!');
              }
            }}
            className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RESET TO AUDIT DEMO DATA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
