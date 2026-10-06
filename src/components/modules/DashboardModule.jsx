import React from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Sparkles,
  TrendingUp,
  Package,
  Receipt,
  Users,
  CreditCard,
  Building2,
  BookOpen,
  ShoppingBag,
  ArrowUpRight,
  ArrowRight,
  Eye,
  PlusCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Coins,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';

export default function DashboardModule() {
  const {
    activeFirm,
    dailyRates,
    mcxData,
    stock,
    customers,
    invoices,
    udhaarList,
    setActiveModule,
    setPreviewInvoice,
    analytics
  } = useJewellery();

  const soldOutItemsCount = stock.filter(s => s.status === 'Sold Out').length;
  const inStockItemsCount = stock.filter(s => s.status === 'In Stock').length;

  return (
    <div className="space-y-6">
      {/* 1. Compact Welcome Banner (Audit Recommendation) */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {activeFirm.headerInfo || '|| SHUBH LABH ||'}
            </span>
            <span className="text-xs text-slate-400">Financial Year 2024–25</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-100 mt-1">
            Welcome to <span className="text-amber-400">{activeFirm.name}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Store Code: <strong className="text-slate-300">{activeFirm.code}</strong> • GSTIN: <strong className="text-slate-300">{activeFirm.gstin}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveModule('billing')}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Create New Bill (F2)</span>
          </button>

          <button
            onClick={() => setActiveModule('stock')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>+ Add Stock</span>
          </button>

          <button
            onClick={() => setActiveModule('daily_diary')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Daily Diary</span>
          </button>
        </div>
      </div>

      {/* 2. Key KPI Stats Bar with Clear Periods */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Sales</p>
          <p className="text-xl font-bold text-amber-300 mt-1 font-mono">₹1,55,120.52</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 5 Invoices Today
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cash in Counter</p>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(activeFirm.cashBalance)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Physical Drawer Cash</p>
        </div>

        <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gold Stock (Net)</p>
          <p className="text-xl font-bold text-yellow-200 mt-1 font-mono">{analytics.totalStockGoldNetGrams.toFixed(3)}g</p>
          <p className="text-[11px] text-slate-400 mt-1">Gross: {analytics.totalStockGoldGrams.toFixed(3)}g</p>
        </div>

        <div className="bg-slate-900 border border-slate-500/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Silver Stock</p>
          <p className="text-xl font-bold text-slate-200 mt-1 font-mono">{analytics.totalStockSilverGrams.toFixed(3)}g</p>
          <p className="text-[11px] text-slate-400 mt-1">Sterling 925 & 999</p>
        </div>

        <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Udhaar Due</p>
          <p className="text-xl font-bold text-rose-400 mt-1 font-mono">{formatCurrency(analytics.totalUdhaarOutstanding)}</p>
          <p className="text-[11px] text-rose-300/80 mt-1">{udhaarList.length} Customer Accounts</p>
        </div>

        <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inventory Val</p>
          <p className="text-xl font-bold text-blue-300 mt-1 font-mono">{formatCurrency(analytics.totalStockValue)}</p>
          <p className="text-[11px] text-slate-400 mt-1">At Today's Gold Rate</p>
        </div>
      </div>

      {/* 3. Recent Customer Invoices & Customer Directory placed prominently */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Recent Invoices</h3>
            </div>
            <button
              onClick={() => setActiveModule('billing')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              + Create Bill
            </button>
          </div>

          <div className="overflow-x-auto mt-3 rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Payment Split</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">{inv.invoiceNo}</td>
                    <td className="py-3 px-3 text-slate-400">{inv.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-100">{inv.customerName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-100 text-right">
                      {formatCurrency(inv.totalInvoiceAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                        {inv.payments?.cash > 0 && <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">Cash: ₹{inv.payments.cash.toLocaleString('en-IN')}</span>}
                        {inv.payments?.card > 0 && <span className="bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">Card: ₹{inv.payments.card.toLocaleString('en-IN')}</span>}
                        {inv.payments?.online > 0 && <span className="bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">UPI: ₹{inv.payments.online.toLocaleString('en-IN')}</span>}
                        {inv.payments?.balanceUdhaarDue > 0 && <span className="bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800">Udhaar: ₹{inv.payments.balanceUdhaarDue.toLocaleString('en-IN')}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="inline-flex items-center space-x-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Directory */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Customer Directory</h3>
            </div>
            <button
              onClick={() => setActiveModule('customers')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              View All ({customers.length})
            </button>
          </div>

          <div className="space-y-2 mt-3">
            {customers.slice(0, 5).map((cust) => (
              <div
                key={cust.id}
                onClick={() => setActiveModule('customers')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-300 border border-amber-500/30">
                    {cust.firstName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-200">{cust.fullName}</p>
                    <p className="text-[10px] text-slate-400">{cust.city} • {cust.mobile}</p>
                  </div>
                </div>

                <div className="text-right">
                  {cust.currentUdhaarBalance > 0 ? (
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      Due: {formatCurrency(cust.currentUdhaarBalance)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium">Clear</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Structured Inventory Overview (Replaces the 9 noisy rainbow tiles with purposeful cards) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100">
              Inventory & Stock Status
            </h3>
          </div>
          <button
            onClick={() => setActiveModule('stock')}
            className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>Open Inventory Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveModule('stock')}
            className="p-4 rounded-xl border border-amber-500/30 bg-slate-950 hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Gold Ornaments</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="text-lg font-bold text-slate-100 font-mono mt-2">
              {analytics.totalStockGoldNetGrams.toFixed(3)}g
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gross Weight: {analytics.totalStockGoldGrams.toFixed(3)}g
            </p>
          </div>

          <div
            onClick={() => setActiveModule('stock')}
            className="p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-slate-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase">Silver Stock</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <p className="text-lg font-bold text-slate-100 font-mono mt-2">
              {analytics.totalStockSilverGrams.toFixed(3)}g
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sterling 925 & 999 Bullion
            </p>
          </div>

          <div
            onClick={() => setActiveModule('stock')}
            className="p-4 rounded-xl border border-emerald-500/30 bg-slate-950 hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase">Available Ready Stock</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-lg font-bold text-emerald-300 font-mono mt-2">
              {inStockItemsCount} Items Ready
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tagged & Barcoded in Counters
            </p>
          </div>

          <div
            onClick={() => setActiveModule('stock')}
            className="p-4 rounded-xl border border-rose-500/30 bg-slate-950 hover:border-rose-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase">Sold Out Items</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
            </div>
            <p className="text-lg font-bold text-rose-300 font-mono mt-2">
              {soldOutItemsCount} Invoices Cleared
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Archived from live counter display
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
