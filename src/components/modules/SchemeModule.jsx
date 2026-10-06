import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  TrendingUp,
  PlusCircle,
  Users,
  Calendar,
  Gift,
  CheckCircle,
  Coins,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function SchemeModule() {
  const { schemes, activeFirm, customers } = useJewellery();
  const [selectedScheme, setSelectedScheme] = useState(schemes[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              GOLD SAVINGS SCHEMES & MONTHLY CHIT FUND
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            11+1 Bonus Month Gold Kitty, Gram Accumulator & Customer Passbook Engine
          </p>
        </div>

        <button
          onClick={() => alert('New Gold Savings Plan creation opened')}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ LAUNCH NEW GOLD SCHEME</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schemes.map(sch => (
          <div
            key={sch.id}
            className="bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {sch.type}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-slate-100 mt-1">{sch.name}</h3>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-300">
                  <Gift className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3">{sch.description}</p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 font-mono text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">Monthly Installment</span>
                  <p className="font-bold text-slate-100 text-sm">{formatCurrency(sch.monthlyInstallment)}</p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">Duration</span>
                  <p className="font-bold text-amber-300 text-sm">{sch.durationMonths} Months</p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">Active Enrolled Members</span>
                  <p className="font-bold text-emerald-400 text-sm">{sch.activeMembersCount} Customers</p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">Total Fund Collected</span>
                  <p className="font-bold text-yellow-300 text-sm">{formatCurrency(sch.totalCollectedAmount)}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Krishna Jewellers Gold Kitty Passbook</span>
              <button
                onClick={() => alert(`Enrolling customer in ${sch.name}`)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <span>Enroll Customer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
