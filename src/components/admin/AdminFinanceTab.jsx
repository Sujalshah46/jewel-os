import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  DollarSign,
  Building2,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  FileSpreadsheet,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function AdminFinanceTab() {
  const { firms, activeFirm, setActiveModule, invoices, expenses } = useJewellery();

  const [periodStatus, setPeriodStatus] = useState('Open');
  const [successMsg, setSuccessMsg] = useState('');

  const chartOfAccounts = [
    { code: '1000', name: 'Cash in Hand (Showroom Drawer)', type: 'Current Asset', balance: activeFirm.cashBalance },
    { code: '1010', name: 'HDFC Bank Current Account', type: 'Bank Asset', balance: 4500000.00 },
    { code: '1200', name: 'Stock in Hand (Gold & Silver Inventory)', type: 'Inventory Asset', balance: 3500000.00 },
    { code: '1300', name: 'Sundry Debtors (Udhaar Ledger)', type: 'Receivable Asset', balance: 520000.00 },
    { code: '2000', name: 'Sundry Creditors (Bullion Bullion Dealers)', type: 'Current Liability', balance: 1200000.00 },
    { code: '2100', name: 'Customer Advances & Gold Scheme Deposits', type: 'Current Liability', balance: 450000.00 },
    { code: '3000', name: 'Proprietor Capital Account', type: 'Equity', balance: 6500000.00 },
    { code: '4000', name: 'Sales Account (Hallmark Jewellery & Bullion)', type: 'Revenue', balance: invoices.reduce((a, b) => a + (Number(b.totalInvoiceAmount) || 0), 0) },
    { code: '5000', name: 'Shop Expenses & Operational Overheads', type: 'Expense', balance: expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0) }
  ];

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
            <DollarSign className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              FINANCE, FISCAL PERIODS & CHART OF ACCOUNTS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage double-entry ledger accounts, financial year closing, banking setup, and expense classifications.
          </p>
        </div>

        <button
          onClick={() => setActiveModule('accounts_reports')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Open Full GST & P&L Reports</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Financial Year & Period Closing Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> 1. Financial Year & Period Control
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[11px] text-slate-400">Current Financial Year</p>
            <p className="text-base font-bold text-slate-100 font-mono mt-0.5">FY 2024–2025</p>
            <span className="text-[10px] text-emerald-400">01 Apr 2024 to 31 Mar 2025</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[11px] text-slate-400">Active Firm Cash Balance</p>
            <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {formatCurrency(activeFirm.cashBalance)}
            </p>
            <span className="text-[10px] text-slate-400">Balance Type: {activeFirm.balanceType || 'DR'}</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Fiscal Period Status</p>
              <p className="text-base font-bold text-amber-300 mt-0.5">{periodStatus}</p>
            </div>
            <button
              onClick={() => {
                const next = periodStatus === 'Open' ? 'Closed / Audited' : 'Open';
                setPeriodStatus(next);
                setSuccessMsg(`Fiscal Period status switched to "${next}".`);
                setTimeout(() => setSuccessMsg(''), 3000);
              }}
              className="mt-2 py-1 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              {periodStatus === 'Open' ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              <span>{periodStatus === 'Open' ? 'Close Financial Period' : 'Reopen Period'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart of Accounts Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-amber-400" /> 2. Master Chart of Accounts (COA)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Account Code</th>
                <th className="py-2.5 px-3">Account Name</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Current Ledger Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {chartOfAccounts.map(acc => (
                <tr key={acc.code} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-amber-300">{acc.code}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-100 font-medium">{acc.name}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">{acc.type}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {formatCurrency(acc.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
