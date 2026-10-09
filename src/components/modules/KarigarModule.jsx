import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Hammer,
  Scale,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
  UserCheck,
  Coins,
  X,
  FileText,
  Download
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';

export default function KarigarModule() {
  const {
    karigars,
    karigarVouchers,
    issueMetalToKarigar,
    receiveOrnamentFromKarigar,
    activeFirm
  } = useJewellery();

  const [selectedKarigar, setSelectedKarigar] = useState(karigars[0] || null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [activeTab, setActiveTab] = useState('WORKSHOP ACCOUNTS');

  // Issue Metal Form State
  const [issueMetal, setIssueMetal] = useState('Gold');
  const [issueGrams, setIssueGrams] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  // Receive Ornament Form State
  const [receiveForm, setReceiveForm] = useState({
    ornamentName: '',
    metalType: 'Gold',
    grossWeight: '',
    fineWeight: '',
    ghatLossGm: '',
    labourAmount: ''
  });

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKarigar) return;
    try {
      const voucher = await issueMetalToKarigar(selectedKarigar.id, {
        metalType: issueMetal,
        grams: issueGrams,
        notes: issueNotes
      });
      alert(`Successfully issued ${issueGrams} GM pure ${issueMetal} to ${selectedKarigar.name}. Voucher #${voucher.id} generated!`);
      setIssueGrams('');
      setIssueNotes('');
      setShowIssueModal(false);
    } catch (err) {
      alert('Issue Error: ' + err.message);
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKarigar) return;
    try {
      const voucher = await receiveOrnamentFromKarigar(selectedKarigar.id, {
        itemDescription: receiveForm.ornamentName,
        metalType: receiveForm.metalType,
        grossWeight: receiveForm.grossWeight,
        fineWeight: receiveForm.fineWeight,
        ghatLossGm: receiveForm.ghatLossGm,
        labourAmount: receiveForm.labourAmount
      });
      alert(`Successfully received ${receiveForm.ornamentName} from ${selectedKarigar.name}. Metal balance settled and labour of ₹${receiveForm.labourAmount} booked!`);
      setReceiveForm({
        ornamentName: '',
        metalType: 'Gold',
        grossWeight: '',
        fineWeight: '',
        ghatLossGm: '',
        labourAmount: ''
      });
      setShowReceiveModal(false);
    } catch (err) {
      alert('Receive Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Hammer className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              KARIGAR JOB WORK & METAL ACCOUNTS
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Artisan Bullion Issue Ledger, Pure Metal Wastage (Ghat) Reconciliation & Labour Settlements
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (karigars.length > 0) setSelectedKarigar(karigars[0]);
              setShowIssueModal(true);
            }}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>ISSUE RAW METAL</span>
          </button>
          <button
            onClick={() => {
              if (karigars.length > 0) setSelectedKarigar(karigars[0]);
              setShowReceiveModal(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-emerald-600/20"
          >
            <Scale className="w-4 h-4" />
            <span>RECEIVE ORNAMENT</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('WORKSHOP ACCOUNTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'WORKSHOP ACCOUNTS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          WORKSHOP ACCOUNTS ({karigars.length})
        </button>
        <button
          onClick={() => setActiveTab('VOUCHERS LEDGER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'VOUCHERS LEDGER' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          METAL VOUCHERS LEDGER ({(karigarVouchers || []).length})
        </button>
      </div>

      {/* 1. Karigar Accounts Cards */}
      {activeTab === 'WORKSHOP ACCOUNTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {karigars.map(k => (
            <div key={k.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-colors">
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{k.id}</span>
                    <h3 className="font-bold text-sm text-slate-100 mt-0.5">{k.name}</h3>
                    <p className="text-xs text-slate-400">{k.phone}</p>
                  </div>
                  <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 my-3 font-medium">
                  <p className="text-amber-300 font-semibold">{k.speciality}</p>
                  <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pure Gold Issued Bal:</span>
                      <strong className="text-yellow-300 font-bold">{(k.pureGoldIssuedBalanceGm || 0).toFixed(3)} GM</strong>
                    </div>
                    {(k.silverIssuedBalanceGm || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pure Silver Issued Bal:</span>
                        <strong className="text-slate-200 font-bold">{(k.silverIssuedBalanceGm || 0).toFixed(3)} GM</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Ghat Allowance:</span>
                      <strong className="text-slate-300">{k.wastageAllowedPercent || 4}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Labour Due:</span>
                  <p className="font-mono font-bold text-rose-400">{formatCurrency(k.labourChargesDue || 0)}</p>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedKarigar(k);
                      setShowIssueModal(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-lg font-bold"
                  >
                    Issue
                  </button>
                  <button
                    onClick={() => {
                      setSelectedKarigar(k);
                      setShowReceiveModal(true);
                    }}
                    className="bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 px-2.5 py-1 rounded-lg font-bold"
                  >
                    Receive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Metal Vouchers Ledger */}
      {activeTab === 'VOUCHERS LEDGER' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">VOUCHER ID</th>
                  <th className="py-2.5 px-3">DATE</th>
                  <th className="py-2.5 px-3">KARIGAR</th>
                  <th className="py-2.5 px-3">TYPE</th>
                  <th className="py-2.5 px-3">METAL / ITEM</th>
                  <th className="py-2.5 px-3 text-right">WEIGHT (GM)</th>
                  <th className="py-2.5 px-3 text-right">GHAT LOSS (GM)</th>
                  <th className="py-2.5 px-3 text-right">LABOUR (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(karigarVouchers || []).map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-300">{v.id}</td>
                    <td className="py-2.5 px-3 text-slate-400">{v.date}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-100">{v.karigarName}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.type === 'ISSUE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{v.itemDescription || v.metalType}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100">{formatWeight(v.weightGm || v.grossWeight || 0)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{v.ghatLossGm ? formatWeight(v.ghatLossGm) : '—'}</td>
                    <td className="py-2.5 px-3 text-right text-rose-300">{v.labourAmount ? formatCurrency(v.labourAmount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Metal Modal */}
      {showIssueModal && selectedKarigar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Issue Raw Bullion to Karigar</h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
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

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">JOB / ORDER NOTES</label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. For casting 4 pcs 22K bangles"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
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
                  ISSUE METAL & SAVE VOUCHER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Ornament Modal */}
      {showReceiveModal && selectedKarigar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Receive Finished Ornament from {selectedKarigar.name}</h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">ORNAMENT DESCRIPTION *</label>
                <input
                  type="text"
                  value={receiveForm.ornamentName}
                  onChange={(e) => setReceiveForm({ ...receiveForm, ornamentName: e.target.value })}
                  placeholder="e.g. 22K Antique Peacock Necklace"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">GROSS WEIGHT (GM) *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={receiveForm.grossWeight}
                    onChange={(e) => setReceiveForm({ ...receiveForm, grossWeight: e.target.value })}
                    placeholder="18.500"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">FINE WEIGHT (GM) *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={receiveForm.fineWeight}
                    onChange={(e) => setReceiveForm({ ...receiveForm, fineWeight: e.target.value })}
                    placeholder="16.946"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">GHAT / WASTAGE LOSS (GM)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={receiveForm.ghatLossGm}
                    onChange={(e) => setReceiveForm({ ...receiveForm, ghatLossGm: e.target.value })}
                    placeholder="0.450"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-400 mb-1">LABOUR CHARGE DUE (₹) *</label>
                  <input
                    type="number"
                    value={receiveForm.labourAmount}
                    onChange={(e) => setReceiveForm({ ...receiveForm, labourAmount: e.target.value })}
                    placeholder="1500"
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-300"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  RECEIVE & SETTLE BALANCE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
