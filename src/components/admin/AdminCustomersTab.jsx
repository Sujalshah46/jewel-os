import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Users,
  Award,
  Shield,
  Save,
  CheckCircle,
  EyeOff,
  Coins,
  CreditCard
} from 'lucide-react';

export default function AdminCustomersTab() {
  const { customers } = useJewellery();

  const [loyaltyRules, setLoyaltyRules] = useState({
    spendPerPoint: 500,
    pointRedemptionValue: 1.0,
    minPointsToRedeem: 100,
    defaultCreditLimit: 50000,
    maskSensitiveKyc: true
  });

  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSuccessMsg('Customer loyalty & privacy policies updated.');
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
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              CUSTOMERS, LOYALTY & DATA PRIVACY
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure customer credit limits, reward points accrual ratios, and sensitive identity (PAN/Aadhaar) masking.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>SAVE CUSTOMER POLICIES</span>
        </button>
      </div>

      {/* Loyalty Points Engine */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Award className="w-4 h-4" /> 1. Jewellery Loyalty & Reward Points Engine
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              PURCHASE SPEND PER 1 LOYALTY POINT (₹)
            </label>
            <input
              type="number"
              value={loyaltyRules.spendPerPoint}
              onChange={(e) => setLoyaltyRules(prev => ({ ...prev, spendPerPoint: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default: Every ₹500 billed earns 1 point
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              POINT REDEMPTION RUPEE VALUE (₹)
            </label>
            <input
              type="number"
              step="0.1"
              value={loyaltyRules.pointRedemptionValue}
              onChange={(e) => setLoyaltyRules(prev => ({ ...prev, pointRedemptionValue: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              1 point = ₹1.00 discount on next bill
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              MINIMUM POINTS TO REDEEM
            </label>
            <input
              type="number"
              value={loyaltyRules.minPointsToRedeem}
              onChange={(e) => setLoyaltyRules(prev => ({ ...prev, minPointsToRedeem: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Threshold before points can be deducted
            </span>
          </div>
        </div>
      </div>

      {/* Credit Limits & Privacy Masking */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> 2. Default Credit Limit & KYC Privacy Protection
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              DEFAULT UDHAAR CREDIT LIMIT (₹)
            </label>
            <input
              type="number"
              value={loyaltyRules.defaultCreditLimit}
              onChange={(e) => setLoyaltyRules(prev => ({ ...prev, defaultCreditLimit: Number(e.target.value) }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Maximum credit allowance before manager override is required
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={loyaltyRules.maskSensitiveKyc}
                onChange={(e) => setLoyaltyRules(prev => ({ ...prev, maskSensitiveKyc: e.target.checked }))}
                className="rounded text-amber-500 focus:ring-0"
              />
              <span className="font-semibold text-xs">Mask Sensitive PAN & Aadhaar Numbers in Client Lists</span>
            </label>
            <span className="text-[10px] text-slate-400 ml-5 block mt-0.5">
              Protects sensitive identity documents from shoulder-surfing at public counters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
