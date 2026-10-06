import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  TrendingUp,
  RefreshCw,
  Trash2,
  PlusCircle,
  Tv,
  Save,
  CheckCircle,
  AlertTriangle,
  Download,
  Printer,
  Copy,
  FileSpreadsheet,
  HelpCircle,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function DailyRatesModule() {
  const {
    dailyRates,
    setDailyRates,
    updateDailyRate,
    deleteAllRates,
    resetDefaultRates,
    mcxData
  } = useJewellery();

  const [activeTab, setActiveTab] = useState('DAILY RATES');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLedModal, setShowLedModal] = useState(false);
  const [mcxSyncing, setMcxSyncing] = useState(false);

  // New rate form state
  const [newRate, setNewRate] = useState({
    metalType: 'Gold',
    name: 'GOLD-91.67 (22 K)',
    purityPercent: 91.67,
    karat: '22K',
    ratePerGram: 6600.24,
    ratePer10Gm: 66002.40,
    customerPercentage: 91.67,
    makingChargeDefault: 500,
    taxInclusive: false,
    taxPercent: 3.0,
    comment: 'Daily Hallmark Rate'
  });

  const tabs = [
    'DAILY RATES',
    'METAL NAMES',
    'PURITY',
    'CRYSTAL RATE',
    'ITEM NAMES',
    'CITY LIST',
    'STATE LIST',
    'ROI (INTEREST)',
    'MASTER DATA'
  ];

  const handleBaseRateChange = (rate24kPerGram) => {
    const base = Number(rate24kPerGram);
    if (!base || base <= 0) return;

    // Recalculate all gold karat rates proportionally
    setDailyRates(prev => prev.map(r => {
      if (r.metalType === 'Gold') {
        const ratePerGram = (base * (r.purityPercent / 100));
        const ratePer10Gm = ratePerGram * 10;
        const taxAmount = (ratePerGram * 3) / 100;
        return {
          ...r,
          ratePerGram: Number(ratePerGram.toFixed(2)),
          ratePer10Gm: Number(ratePer10Gm.toFixed(2)),
          taxAmount: Number(taxAmount.toFixed(2)),
          rateWithTax: Number((ratePerGram + taxAmount).toFixed(2))
        };
      }
      return r;
    }));
  };

  const handleSyncMcx = () => {
    setMcxSyncing(true);
    setTimeout(() => {
      // 24K per gram = MCX / 10
      const goldGramRate = mcxData.gold / 10;
      handleBaseRateChange(goldGramRate);
      setMcxSyncing(false);
    }, 800);
  };

  const handleAddRate = (e) => {
    e.preventDefault();
    const rateNum = Number(newRate.ratePerGram);
    const taxAmt = (rateNum * 3) / 100;
    const item = {
      id: 'RATE-' + Date.now().toString().slice(-4),
      ...newRate,
      ratePerGram: rateNum,
      ratePer10Gm: rateNum * 10,
      taxAmount: taxAmt,
      rateWithTax: rateNum + taxAmt
    };
    setDailyRates(prev => [...prev, item]);
  };

  const handleDeleteAllConfirm = () => {
    deleteAllRates();
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel Title & Master Tabs from Audit 1:47 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
            ONLINE MUNIM CONTROL PANEL — MASTER DATA
          </h2>
          <p className="text-xs text-amber-400/90 font-medium mt-0.5">
            (*) Required Fields • Live Bullion Matrix & Digital Rate Board Configuration
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* LED Rates Board Button */}
          <button
            onClick={() => setShowLedModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>LED RATES DISPLAY</span>
          </button>

          {/* Update MCX Button */}
          <button
            onClick={handleSyncMcx}
            disabled={mcxSyncing}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${mcxSyncing ? 'animate-spin' : ''}`} />
            <span>{mcxSyncing ? 'SYNCING MCX...' : 'UPDATE MCX DAILY RATES'}</span>
          </button>
        </div>
      </div>

      {/* Master Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Daily Rates Content */}
      {activeTab === 'DAILY RATES' && (
        <div className="space-y-6">
          {/* Quick 24K Base Setter & Fast Multiplier */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-300 border border-amber-500/40">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Live 24K Gold Base Setter</h3>
                <p className="text-xs text-slate-400">Changing base rate automatically updates 22K, 20K, 18K, 16K, 14K purities</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-bold">24K / 10 GM:</span>
                <input
                  type="number"
                  defaultValue={72000}
                  onChange={(e) => handleBaseRateChange(Number(e.target.value) / 10)}
                  className="w-28 bg-transparent text-amber-300 font-mono font-bold text-sm text-right focus:outline-none"
                />
                <span className="text-xs text-slate-400">₹</span>
              </div>

              <button
                onClick={resetDefaultRates}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Reset Default Audit Rates
              </button>
            </div>
          </div>

          {/* TODAY'S RATES TABLE (Audit 1:47 - 3:06) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                  TODAY'S RATES MASTER TABLE
                </h3>
                <p className="text-xs text-slate-400">Live active metal price list used for POS billing & valuations</p>
              </div>

              {/* Action Toolbar: Copy, Csv, Excel, Pdf, Print, Delete All */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[11px] text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      const text = dailyRates.map(r => `${r.name}\t${r.ratePerGram}\t${r.ratePer10Gm}`).join('\n');
                      navigator.clipboard.writeText(text);
                      alert('Rates copied to clipboard!');
                    }}
                    className="px-2 py-0.5 hover:bg-slate-800 rounded transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Metal', 'Purity', 'Karat', 'Rate/Gram', 'Rate/10g', 'Tax 3%', 'Rate Inc. Tax'];
                      const rows = dailyRates.map(r => [
                        `"${r.metalType}"`,
                        `"${r.purityPercent}%"`,
                        `"${r.karat || ''}"`,
                        r.ratePerGram,
                        r.ratePer10Gm,
                        r.taxAmount || 0,
                        r.rateWithTax || r.ratePerGram
                      ].join(','));
                      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
                      const link = document.createElement("a");
                      link.setAttribute("href", encodeURI(csvContent));
                      link.setAttribute("download", `Daily_Rates_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                    className="px-2 py-0.5 hover:bg-slate-800 rounded transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Metal', 'Purity', 'Karat', 'Rate/Gram', 'Rate/10g', 'Tax 3%', 'Rate Inc. Tax'];
                      const rows = dailyRates.map(r => [
                        `"${r.metalType}"`,
                        `"${r.purityPercent}%"`,
                        `"${r.karat || ''}"`,
                        r.ratePerGram,
                        r.ratePer10Gm,
                        r.taxAmount || 0,
                        r.rateWithTax || r.ratePerGram
                      ].join(','));
                      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
                      const link = document.createElement("a");
                      link.setAttribute("href", encodeURI(csvContent));
                      link.setAttribute("download", `Daily_Rates_${new Date().toISOString().split('T')[0]}.xls`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                    className="px-2 py-0.5 hover:bg-slate-800 rounded transition-colors"
                  >
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2 py-0.5 hover:bg-slate-800 rounded transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2 py-0.5 hover:bg-slate-800 rounded flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3 h-3" /> Print
                  </button>
                </div>

                {/* Pink Delete All Rates Button matching audit (triggers confirm modal) */}
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DELETE ALL RATES</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Metal Type</th>
                    <th className="py-2.5 px-3">Name / Karat</th>
                    <th className="py-2.5 px-3">Purity %</th>
                    <th className="py-2.5 px-3">Rate / GM (₹)</th>
                    <th className="py-2.5 px-3">Rate / 10 GM (₹)</th>
                    <th className="py-2.5 px-3">GST 3%</th>
                    <th className="py-2.5 px-3">Rate With Tax (₹)</th>
                    <th className="py-2.5 px-3">Default Making</th>
                    <th className="py-2.5 px-3 text-right">Edit Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {dailyRates.map(rate => (
                    <tr key={rate.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-300">{rate.metalType}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">{rate.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-200">{rate.purityPercent}%</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                        ₹{rate.ratePerGram.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-200">
                        ₹{rate.ratePer10Gm.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        ₹{rate.taxAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                        ₹{rate.rateWithTax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        ₹{rate.makingChargeDefault}/GM
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          defaultValue={rate.ratePerGram}
                          onBlur={(e) => updateDailyRate(rate.id, e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded px-2 py-1 text-right font-mono text-amber-300 text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal from Audit */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-100">Permanent Delete Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300">
              "Do you really want to Permanent Delete All Metal Rates?"
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                OK, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LED Digital Rate Board Modal */}
      {showLedModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-8 overflow-y-auto">
          <div className="flex items-center justify-between pb-6 border-b border-amber-500/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                <Tv className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-amber-300 uppercase tracking-widest">
                  KRISHNA JEWELLERS — DIGITAL RATE BOARD
                </h1>
                <p className="text-sm text-slate-400">TODAY'S OFFICIAL GOVERNMENT BIS CERTIFIED RATES (आज का भाव)</p>
              </div>
            </div>

            <button
              onClick={() => setShowLedModal(false)}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto py-8">
            {dailyRates.map(r => (
              <div
                key={r.id}
                className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl p-6 text-center shadow-2xl flex flex-col justify-between"
              >
                <p className="text-lg font-bold text-slate-300 uppercase tracking-wider font-serif">{r.name}</p>
                <div className="my-4">
                  <p className="text-4xl font-extrabold text-amber-300 font-mono tracking-tight">
                    ₹{r.metalType === 'Silver' ? (r.ratePerGram * 1000).toLocaleString('en-IN') : (r.ratePer10Gm).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 uppercase">
                    {r.metalType === 'Silver' ? 'Per 1 Kilogram' : 'Per 10 Grams'}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between font-mono">
                  <span>Per Gram: <strong className="text-amber-200">₹{r.ratePerGram.toFixed(2)}</strong></span>
                  <span>Purity: <strong className="text-slate-200">{r.purityPercent}%</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4 border-t border-slate-900 text-xs text-slate-500">
            Press ESC or Close to return to Jewellery OS Application
          </div>
        </div>
      )}
    </div>
  );
}
