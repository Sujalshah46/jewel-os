import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Gift,
  PlusCircle,
  Calendar,
  Users,
  CreditCard,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  X,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function SchemeModule() {
  const {
    schemes,
    schemeEnrollments,
    enrollCustomerInScheme,
    recordSchemeInstallment,
    customers,
    activeFirm
  } = useJewellery();

  const [activeTab, setActiveTab] = useState('SCHEME PLANS');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(schemes[0] || null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [monthlyAmount, setMonthlyAmount] = useState(selectedScheme?.monthlyInstallment || 5000);

  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    if (!selectedScheme || !selectedCustomerId) return;
    try {
      const enrollment = enrollCustomerInScheme({
        schemeId: selectedScheme.id,
        customerId: selectedCustomerId,
        monthlyInstallment: monthlyAmount
      });
      alert(`Customer successfully enrolled in ${selectedScheme.name}! Passbook account #${enrollment.id} created.`);
      setShowEnrollModal(false);
      setActiveTab('CUSTOMER PASSBOOKS');
    } catch (err) {
      alert('Enrollment Error: ' + err.message);
    }
  };

  const handlePayInstallment = (enr) => {
    try {
      recordSchemeInstallment(enr.id, enr.monthlyInstallment);
      alert(`Installment payment of ${formatCurrency(enr.monthlyInstallment)} recorded for ${enr.customerName}.`);
    } catch (err) {
      alert('Payment Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SWARNA NIDHI / GOLD SCHEMES (11+1)
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Customer Monthly Gold Kitty Savings, 100% Making Charge Bonus on Maturity & Passbook Ledger
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (schemes.length > 0) {
                setSelectedScheme(schemes[0]);
                setMonthlyAmount(schemes[0].monthlyInstallment);
              }
              setShowEnrollModal(true);
            }}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ENROLL CUSTOMER</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('SCHEME PLANS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'SCHEME PLANS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          SCHEME PLANS ({schemes.length})
        </button>
        <button
          onClick={() => setActiveTab('CUSTOMER PASSBOOKS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'CUSTOMER PASSBOOKS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          CUSTOMER PASSBOOKS ({(schemeEnrollments || []).length})
        </button>
      </div>

      {/* 1. Scheme Plans */}
      {activeTab === 'SCHEME PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map(sch => (
            <div key={sch.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-colors">
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
                    <span className="text-[10px] text-slate-400 uppercase">Active Enrolled</span>
                    <p className="font-bold text-emerald-400 text-sm">{sch.activeMembersCount || 0} Members</p>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase">Fund Collected</span>
                    <p className="font-bold text-yellow-300 text-sm">{formatCurrency(sch.totalCollectedAmount || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
                <span className="text-[11px] text-slate-400">11 Months + 1 Month Bonus</span>
                <button
                  onClick={() => {
                    setSelectedScheme(sch);
                    setMonthlyAmount(sch.monthlyInstallment);
                    setShowEnrollModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <span>Enroll Customer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Customer Passbooks */}
      {activeTab === 'CUSTOMER PASSBOOKS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">PASSBOOK NO</th>
                  <th className="py-2.5 px-3">CUSTOMER</th>
                  <th className="py-2.5 px-3">SCHEME</th>
                  <th className="py-2.5 px-3 text-right">MONTHLY DUE (₹)</th>
                  <th className="py-2.5 px-3 text-center">INSTALLMENTS</th>
                  <th className="py-2.5 px-3 text-right">TOTAL PAID (₹)</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(schemeEnrollments || []).map(enr => (
                  <tr key={enr.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-300">{enr.id}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <p className="font-bold text-slate-100">{enr.customerName}</p>
                      <p className="text-[10px] text-slate-400">{enr.mobile}</p>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{enr.schemeName}</td>
                    <td className="py-2.5 px-3 text-right text-slate-100">{formatCurrency(enr.monthlyInstallment)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-300">
                      {enr.paidInstallmentsCount} / {enr.durationMonths}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{formatCurrency(enr.totalPaidAmount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        enr.status === 'Matured' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {enr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {enr.status !== 'Matured' ? (
                        <button
                          onClick={() => handlePayInstallment(enr)}
                          className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                        >
                          + Pay Installment
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold text-[11px]">Ready for Jewellery</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enroll Customer Modal */}
      {showEnrollModal && selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Enroll Customer in {selectedScheme.name}</h3>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">SELECT ENROLLED SCHEME</label>
                <select
                  value={selectedScheme.id}
                  onChange={(e) => {
                    const found = schemes.find(s => s.id === e.target.value);
                    if (found) {
                      setSelectedScheme(found);
                      setMonthlyAmount(found.monthlyInstallment);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-amber-200"
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.durationMonths}M)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">SELECT CUSTOMER *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-100"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName || `${c.firstName} ${c.lastName}`} ({c.mobile || c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">MONTHLY INSTALLMENT AMOUNT (₹) *</label>
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold"
                  required
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 text-[11px] text-amber-300">
                <p><strong>Bonus Terms:</strong> Pay 11 monthly installments on time, and Krishna Jewellers will contribute the 12th installment free!</p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  ACTIVATE PASSBOOK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
