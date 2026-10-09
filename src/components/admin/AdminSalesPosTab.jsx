import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Receipt,
  Save,
  CheckCircle,
  Percent,
  RotateCcw,
  CreditCard,
  Building2,
  FileText
} from 'lucide-react';

export default function AdminSalesPosTab() {
  const { activeFirm, branches, updateBranch } = useJewellery();

  const [salesPolicy, setSalesPolicy] = useState({
    defaultCashLimit: 200000,
    panThreshold: 200000,
    allowPartialExchange: true,
    maxCashDiscountPercent: 5.0,
    creditNoteValidityDays: 90,
    exchangeWindowDays: 7,
    autoRoundOff: true
  });

  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSuccessMsg('Demo only: these policies are not saved or enforced by transaction handlers.');
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
            <Receipt className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SALES, INVOICE & POINT-OF-SALE (POS) POLICIES
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure transaction ceilings, PAN verification thresholds for cash sales, return/credit note validity, and branch billing series.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>SAVE POS POLICIES</span>
        </button>
      </div>

      {/* Section 1: Statutory Compliance & Cash Ceilings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Percent className="w-4 h-4" /> 1. Statutory Compliance & IT Act Thresholds (India)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              MANDATORY PAN THRESHOLD (₹)
            </label>
            <input
              type="number"
              value={salesPolicy.panThreshold}
              onChange={(e) => setSalesPolicy(prev => ({ ...prev, panThreshold: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Govt. Rule: Invoices &gt; ₹2,00,000 require customer PAN
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              MAX CASH PAYMENT LIMIT PER INVOICE (₹)
            </label>
            <input
              type="number"
              value={salesPolicy.defaultCashLimit}
              onChange={(e) => setSalesPolicy(prev => ({ ...prev, defaultCashLimit: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Section 269ST cap: ₹1,99,999 cash limit
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              MAX CASHIER DISCOUNT CEILING (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={salesPolicy.maxCashDiscountPercent}
              onChange={(e) => setSalesPolicy(prev => ({ ...prev, maxCashDiscountPercent: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Higher discounts require Owner/Manager PIN
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Returns, Exchanges & Credit Notes */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" /> 2. Exchange & Credit Note Policies
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              RETURN / EXCHANGE WINDOW (DAYS)
            </label>
            <input
              type="number"
              value={salesPolicy.exchangeWindowDays}
              onChange={(e) => setSalesPolicy(prev => ({ ...prev, exchangeWindowDays: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Customers can exchange intact jewellery within this window
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              CREDIT NOTE EXPIRY PERIOD (DAYS)
            </label>
            <input
              type="number"
              value={salesPolicy.creditNoteValidityDays}
              onChange={(e) => setSalesPolicy(prev => ({ ...prev, creditNoteValidityDays: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Credit notes issued upon return expire after this period
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              INVOICE TOTAL ROUNDING
            </label>
            <select
              value={salesPolicy.autoRoundOff ? 'yes' : 'no'}
              onChange={(e) => setSalesPolicy(prev => ({ ...prev, autoRoundOff: e.target.value === 'yes' }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
            >
              <option value="yes">Round to Nearest Rupee (₹1.00)</option>
              <option value="no">Exact Decimal Fraction</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Standard commercial rounding rule
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Branch Numbering Prefixes */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-amber-400" /> 3. Branch Invoice Numbering Series
        </h3>

        <div className="space-y-3">
          {branches.map(b => (
            <div
              key={b.id}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-slate-100">{b.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">Code: {b.code} • Type: {b.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Prefix Series:</span>
                <input
                  type="text"
                  value={b.invoicePrefix || 'IS/'}
                  onChange={(e) => updateBranch(b.id, { invoicePrefix: e.target.value })}
                  className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-mono font-bold text-center"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
