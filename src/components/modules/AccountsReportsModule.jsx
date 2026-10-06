import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Scale,
  PieChart,
  BookOpen,
  Calendar,
  Building2
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function AccountsReportsModule() {
  const { activeFirm, invoices, stock, udhaarList, dailyDiary } = useJewellery();
  const [activeReportTab, setActiveReportTab] = useState('PROFIT & LOSS');

  const reportTabs = [
    'PROFIT & LOSS',
    'TRIAL BALANCE',
    'BALANCE SHEET',
    'GST GSTR-1 TAX REPORT',
    'STOCK VALUATION REPORT'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              FINANCIAL ACCOUNTS & GST STATUTORY REPORTS
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Double-Entry Accounting, Profit & Loss, Balance Sheet & GST Returns for Jewellery Business
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT REPORT</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {reportTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveReportTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeReportTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PROFIT & LOSS REPORT */}
      {activeReportTab === 'PROFIT & LOSS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-lg text-slate-100">{activeFirm.name}</h3>
            <p className="text-xs text-amber-400 uppercase font-semibold">Statement of Profit & Loss (Financial Year 2024–2025)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Income */}
            <div className="space-y-2 border-r border-slate-800 pr-4">
              <h4 className="font-bold text-emerald-400 pb-1 border-b border-slate-700 font-sans uppercase">
                REVENUE & INCOMES (CR)
              </h4>
              <div className="flex justify-between text-slate-300">
                <span>Gold & Silver Jewellery Sales:</span>
                <span>₹1,55,120.52</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Making Charges Invoiced:</span>
                <span>₹28,450.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Girvi & Udhaar Interest Earned:</span>
                <span>₹12,850.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Closing Stock Value:</span>
                <span>₹12,45,600.00</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-700 text-sm">
                <span>TOTAL INCOME (CR):</span>
                <span>₹14,42,020.52</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-2">
              <h4 className="font-bold text-rose-400 pb-1 border-b border-slate-700 font-sans uppercase">
                EXPENSES & PURCHASES (DR)
              </h4>
              <div className="flex justify-between text-slate-300">
                <span>Bullion & Stock Purchases:</span>
                <span>₹9,20,000.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Karigar Labour & Job Work Paid:</span>
                <span>₹42,500.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shop Utilities, Salaries & Rent:</span>
                <span>₹13,300.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>BIS Hallmarking & Laser Fees:</span>
                <span>₹5,400.00</span>
              </div>
              <div className="flex justify-between font-bold text-amber-300 pt-2 border-t border-slate-700 text-sm">
                <span>NET NET PROFIT BEFORE TAX:</span>
                <span>₹4,60,820.52</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GST GSTR-1 TAX REPORT */}
      {activeReportTab === 'GST GSTR-1 TAX REPORT' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-100">GSTR-1 SUMMARY (OUTWARD SUPPLIES)</h3>
              <p className="text-xs text-slate-400">HSN 7113 - Gold Jewellery (3% GST)</p>
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4" /> Export Govt JSON/Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">INVOICE NO</th>
                  <th className="py-2.5 px-3">DATE</th>
                  <th className="py-2.5 px-3">CUSTOMER</th>
                  <th className="py-2.5 px-3">POS</th>
                  <th className="py-2.5 px-3 text-right">TAXABLE VALUE (₹)</th>
                  <th className="py-2.5 px-3 text-right">CGST 1.5% (₹)</th>
                  <th className="py-2.5 px-3 text-right">SGST 1.5% (₹)</th>
                  <th className="py-2.5 px-3 text-right">INVOICE TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-300">{inv.invoiceNo}</td>
                    <td className="py-2.5 px-3 text-slate-400">{inv.date}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-100">{inv.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-300">27-MAH</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(inv.taxableAmount || (inv.totalInvoiceAmount * 0.97))}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(inv.cgst || (inv.totalInvoiceAmount * 0.015))}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(inv.sgst || (inv.totalInvoiceAmount * 0.015))}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100">{formatCurrency(inv.totalInvoiceAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
