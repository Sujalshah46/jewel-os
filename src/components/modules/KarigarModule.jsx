import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Hammer,
  PlusCircle,
  Search,
  Phone,
  MapPin,
  Coins,
  Scale,
  ArrowRightLeft,
  CheckCircle,
  X
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';

export default function KarigarModule() {
  const { karigars, activeFirm } = useJewellery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKarigar, setSelectedKarigar] = useState(karigars[0]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueGrams, setIssueGrams] = useState('');
  const [issueMetal, setIssueMetal] = useState('Gold');

  const filteredKarigars = karigars.filter(k =>
    k.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Hammer className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              KARIGAR (GOLDSMITH & ARTISAN) JOB WORK LEDGER
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Raw Metal Issue / Receive Ledger, Wastage Allowance % and Artisan Labour Accounts
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>+ ISSUE METAL TO KARIGAR</span>
        </button>
      </div>

      {/* Karigars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredKarigars.map(k => (
          <div
            key={k.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{k.name}</h3>
                    <p className="text-[10px] text-slate-400">{k.city} • {k.mobile}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                  {k.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 my-3 font-medium">
                <p className="text-amber-300 font-semibold">{k.speciality}</p>
                <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pure Gold Issued Bal:</span>
                    <strong className="text-yellow-300 font-bold">{k.pureGoldIssuedBalanceGm.toFixed(3)} GM</strong>
                  </div>
                  {k.silverIssuedBalanceGm > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pure Silver Issued Bal:</span>
                      <strong className="text-slate-200 font-bold">{k.silverIssuedBalanceGm.toFixed(3)} GM</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Wastage Allowance:</span>
                    <strong className="text-slate-300">{k.wastageAllowedPercent}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Labour Due:</span>
                <p className="font-mono font-bold text-rose-400">{formatCurrency(k.labourChargesDue)}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedKarigar(k);
                  setShowIssueModal(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-lg font-bold"
              >
                Issue / Receive
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Issue Metal Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Issue Raw Bullion to Karigar</h3>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              alert(`Issued ${issueGrams} GM pure ${issueMetal} to ${selectedKarigar.name}. Voucher saved!`);
              setShowIssueModal(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">SELECT GOLDSMITH / KARIGAR</label>
                <select
                  value={selectedKarigar.id}
                  onChange={(e) => {
                    const found = karigars.find(k => k.id === e.target.value);
                    if (found) setSelectedKarigar(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-amber-200"
                >
                  {karigars.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">METAL TYPE</label>
                <select
                  value={issueMetal}
                  onChange={(e) => setIssueMetal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-100"
                >
                  <option value="Gold">24K 999 Pure Fine Gold (सोना)</option>
                  <option value="Silver">99.9 Fine Pure Silver (चांदी)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">ISSUE WEIGHT (GRAMS) *</label>
                <input
                  type="number"
                  step="0.001"
                  value={issueGrams}
                  onChange={(e) => setIssueGrams(e.target.value)}
                  placeholder="e.g. 25.000"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  PRINT ISSUE VOUCHER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
