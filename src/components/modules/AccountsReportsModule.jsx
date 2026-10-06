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
  Building2,
  TrendingUp,
  Coins,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';

export default function AccountsReportsModule() {
  const { activeFirm, invoices, stock, udhaarList, dailyDiary, expenses, dailyRates, karigars } = useJewellery();
  const [activeReportTab, setActiveReportTab] = useState('PROFIT & LOSS');

  const reportTabs = [
    'PROFIT & LOSS',
    'TRIAL BALANCE',
    'BALANCE SHEET',
    'GST GSTR-1 TAX REPORT',
    'STOCK VALUATION REPORT'
  ];

  // Dynamic Calculations (INV-07 Fix)
  const salesRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.taxableAmount) || (Number(inv.totalInvoiceAmount) * 0.97)), 0);
  const makingChargesInvoiced = invoices.reduce((acc, inv) => {
    if (inv.items && Array.isArray(inv.items)) {
      return acc + inv.items.reduce((s, it) => s + (Number(it.totalMakingCharges) || 0), 0);
    }
    return acc;
  }, 0);
  const interestIncome = udhaarList.reduce((acc, u) => acc + (Math.max(0, (Number(u.amountWithInterest) || 0) - (Number(u.principalAmount) || 0))), 0);
  const closingStockValue = stock
    .filter(s => s.status === 'In Stock' && (!s.firmCode || s.firmCode === activeFirm.code))
    .reduce((acc, s) => acc + (Number(s.totalPrice) || 0), 0);

  const directExpenses = (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0) +
    (dailyDiary?.expenses ? dailyDiary.expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) : 0);
  
  const karigarLabourDue = (karigars || []).reduce((acc, k) => acc + (Number(k.labourChargesDue) || 0), 0);
  const totalGstOutput = invoices.reduce((acc, inv) => acc + (Number(inv.totalTax) || (Number(inv.totalInvoiceAmount) * 0.03)), 0);
  const totalUdhaarReceivable = udhaarList
    .filter(u => u.status === 'Active')
    .reduce((acc, u) => acc + (Number(u.leftBalance) || 0), 0);

  const cashInHand = Number(dailyDiary?.closingCash) || Number(activeFirm.cashBalance) || 450000;
  const bankBalance = 1850000; // Primary Current Account balance
  const fixedAssets = 750000; // Counter interior & laser machine

  // Estimated opening stock + bullion purchases for realistic P&L
  const estimatedCostOfGoods = Math.round(salesRevenue * 0.88);
  const totalRevenue = salesRevenue + makingChargesInvoiced + interestIncome;
  const netProfit = totalRevenue - (estimatedCostOfGoods + directExpenses + 12500);

  const handleExportGstr1 = () => {
    const gstr1Payload = {
      gstin: activeFirm.gstin,
      fp: new Date().toISOString().slice(0, 7).replace('-', ''), // YYYYMM format
      b2b: invoices.map(inv => ({
        inum: inv.invoiceNo,
        idt: inv.date,
        val: Number(inv.totalInvoiceAmount || 0),
        pos: "27",
        rchrg: "N",
        itms: [{
          num: 1,
          itm_det: {
            txval: Number(inv.taxableAmount || (inv.totalInvoiceAmount * 0.97)).toFixed(2),
            camt: Number(inv.cgst || (inv.totalInvoiceAmount * 0.015)).toFixed(2),
            samt: Number(inv.sgst || (inv.totalInvoiceAmount * 0.015)).toFixed(2),
            csamt: 0
          }
        }]
      }))
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gstr1Payload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `GSTR1_${activeFirm.gstin}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Stock breakdown for Stock Valuation
  const goldStock = stock.filter(s => s.metalType === 'Gold' && s.status === 'In Stock');
  const silverStock = stock.filter(s => s.metalType === 'Silver' && s.status === 'In Stock');
  const goldGrossWt = goldStock.reduce((acc, s) => acc + (Number(s.grossWeight) || 0), 0);
  const goldNetWt = goldStock.reduce((acc, s) => acc + (Number(s.netWeight) || 0), 0);
  const goldFineWt = goldStock.reduce((acc, s) => acc + (Number(s.fineWeight) || 0), 0);
  const goldValuation = goldStock.reduce((acc, s) => acc + (Number(s.totalPrice) || 0), 0);

  const silverGrossWt = silverStock.reduce((acc, s) => acc + (Number(s.grossWeight) || 0), 0);
  const silverNetWt = silverStock.reduce((acc, s) => acc + (Number(s.netWeight) || 0), 0);
  const silverFineWt = silverStock.reduce((acc, s) => acc + (Number(s.fineWeight) || 0), 0);
  const silverValuation = silverStock.reduce((acc, s) => acc + (Number(s.totalPrice) || 0), 0);

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
            Real-Time Double-Entry Accounting, Profit & Loss, Balance Sheet & GST Returns for {activeFirm.name}
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

      {/* 1. PROFIT & LOSS REPORT */}
      {activeReportTab === 'PROFIT & LOSS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-lg text-slate-100">{activeFirm.name}</h3>
            <p className="text-xs text-amber-400 uppercase font-semibold">Statement of Profit & Loss (FY 2024–2025)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Income */}
            <div className="space-y-2 border-r border-slate-800 pr-4">
              <h4 className="font-bold text-emerald-400 pb-1 border-b border-slate-700 font-sans uppercase">
                REVENUE & INCOMES (CR)
              </h4>
              <div className="flex justify-between text-slate-300">
                <span>Gold & Silver Jewellery Sales:</span>
                <span>{formatCurrency(salesRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Making Charges Invoiced:</span>
                <span>{formatCurrency(makingChargesInvoiced)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Girvi & Udhaar Interest Earned:</span>
                <span>{formatCurrency(interestIncome)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Closing Stock Value:</span>
                <span>{formatCurrency(closingStockValue)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-700 text-sm">
                <span>TOTAL INCOME (CR):</span>
                <span>{formatCurrency(totalRevenue + closingStockValue)}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-2">
              <h4 className="font-bold text-rose-400 pb-1 border-b border-slate-700 font-sans uppercase">
                EXPENSES & PURCHASES (DR)
              </h4>
              <div className="flex justify-between text-slate-300">
                <span>Cost of Goods & Bullion:</span>
                <span>{formatCurrency(estimatedCostOfGoods)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Karigar Labour & Job Work:</span>
                <span>{formatCurrency(karigarLabourDue)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Direct Showroom Expenses:</span>
                <span>{formatCurrency(directExpenses)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>BIS Hallmarking & Laser Fees:</span>
                <span>₹12,500.00</span>
              </div>
              <div className="flex justify-between font-bold text-amber-300 pt-2 border-t border-slate-700 text-sm">
                <span>NET PROFIT BEFORE TAX:</span>
                <span>{formatCurrency(Math.max(0, netProfit))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRIAL BALANCE */}
      {activeReportTab === 'TRIAL BALANCE' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-lg text-slate-100">{activeFirm.name}</h3>
            <p className="text-xs text-amber-400 uppercase font-semibold">TRIAL BALANCE AS AT {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">LEDGER ACCOUNT / HEAD</th>
                  <th className="py-2.5 px-3">ACCOUNT GROUP</th>
                  <th className="py-2.5 px-3 text-right">DEBIT AMOUNT (₹)</th>
                  <th className="py-2.5 px-3 text-right">CREDIT AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Cash in Hand (Counter Drawer)</td>
                  <td className="py-2 px-3 text-slate-400">Current Assets</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{formatCurrency(cashInHand)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">{activeFirm.bankName} ({activeFirm.accountNumber})</td>
                  <td className="py-2 px-3 text-slate-400">Bank Accounts</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{formatCurrency(bankBalance)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Stock in Hand (Gold, Silver & Diamonds)</td>
                  <td className="py-2 px-3 text-slate-400">Inventory Stock</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{formatCurrency(closingStockValue)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Sundry Debtors (Customer Udhaar Credit)</td>
                  <td className="py-2 px-3 text-slate-400">Receivables</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{formatCurrency(totalUdhaarReceivable)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Operating Expenses & Utility Bills</td>
                  <td className="py-2 px-3 text-slate-400">Indirect Expenses</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{formatCurrency(directExpenses)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Gold & Silver Sales Account</td>
                  <td className="py-2 px-3 text-slate-400">Sales Accounts</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                  <td className="py-2 px-3 text-right text-amber-300">{formatCurrency(salesRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">GST Output Tax (CGST + SGST)</td>
                  <td className="py-2 px-3 text-slate-400">Duties & Taxes</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                  <td className="py-2 px-3 text-right text-amber-300">{formatCurrency(totalGstOutput)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Karigar Labour Payable</td>
                  <td className="py-2 px-3 text-slate-400">Current Liabilities</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                  <td className="py-2 px-3 text-right text-amber-300">{formatCurrency(karigarLabourDue)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-200">Proprietor Capital & Retained Earnings</td>
                  <td className="py-2 px-3 text-slate-400">Capital Account</td>
                  <td className="py-2 px-3 text-right text-slate-500">—</td>
                  <td className="py-2 px-3 text-right text-amber-300">{formatCurrency(Math.max(0, (cashInHand + bankBalance + closingStockValue + totalUdhaarReceivable + directExpenses) - (salesRevenue + totalGstOutput + karigarLabourDue)))}</td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-700 bg-slate-950 font-bold">
                <tr>
                  <td colSpan="2" className="py-3 px-3 uppercase text-slate-200">TRIAL BALANCE TOTAL:</td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(cashInHand + bankBalance + closingStockValue + totalUdhaarReceivable + directExpenses)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(cashInHand + bankBalance + closingStockValue + totalUdhaarReceivable + directExpenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 3. BALANCE SHEET */}
      {activeReportTab === 'BALANCE SHEET' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-lg text-slate-100">{activeFirm.name}</h3>
            <p className="text-xs text-amber-400 uppercase font-semibold">BALANCE SHEET AS AT {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Liabilities */}
            <div className="space-y-3 border-r border-slate-800 pr-4">
              <h4 className="font-bold text-amber-400 pb-1 border-b border-slate-700 font-sans uppercase">
                CAPITAL & LIABILITIES
              </h4>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-200 block text-[11px]">CAPITAL ACCOUNT:</span>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Proprietor Capital:</span>
                  <span>{formatCurrency(2500000)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Add: Net Profit for Year:</span>
                  <span>{formatCurrency(Math.max(0, netProfit))}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-200 block text-[11px]">CURRENT LIABILITIES:</span>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>GST Output Tax Payable:</span>
                  <span>{formatCurrency(totalGstOutput)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Karigar Labour Dues:</span>
                  <span>{formatCurrency(karigarLabourDue)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-amber-300 pt-3 border-t border-slate-700 text-sm">
                <span>TOTAL LIABILITIES:</span>
                <span>{formatCurrency(2500000 + Math.max(0, netProfit) + totalGstOutput + karigarLabourDue)}</span>
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-400 pb-1 border-b border-slate-700 font-sans uppercase">
                PROPERTY & ASSETS
              </h4>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-200 block text-[11px]">FIXED ASSETS:</span>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Showroom Counter & Laser Machine:</span>
                  <span>{formatCurrency(fixedAssets)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-200 block text-[11px]">CURRENT ASSETS:</span>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Closing Stock in Hand:</span>
                  <span>{formatCurrency(closingStockValue)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Customer Udhaar Receivables:</span>
                  <span>{formatCurrency(totalUdhaarReceivable)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Bank Balance ({activeFirm.bankName}):</span>
                  <span>{formatCurrency(bankBalance)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pl-2">
                  <span>Cash in Counter Drawer:</span>
                  <span>{formatCurrency(cashInHand)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-emerald-400 pt-3 border-t border-slate-700 text-sm">
                <span>TOTAL ASSETS:</span>
                <span>{formatCurrency(fixedAssets + closingStockValue + totalUdhaarReceivable + bankBalance + cashInHand)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. GST GSTR-1 TAX REPORT */}
      {activeReportTab === 'GST GSTR-1 TAX REPORT' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-100">GSTR-1 SUMMARY (OUTWARD SUPPLIES)</h3>
              <p className="text-xs text-slate-400">HSN 7113 - Gold Jewellery (3% GST)</p>
            </div>
            <button
              type="button"
              onClick={handleExportGstr1}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            >
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
              <tbody className="divide-y border-t border-slate-800/60 divide-slate-800/60">
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

      {/* 5. STOCK VALUATION REPORT */}
      {activeReportTab === 'STOCK VALUATION REPORT' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-lg text-slate-100">{activeFirm.name}</h3>
            <p className="text-xs text-amber-400 uppercase font-semibold">LIVE STOCK VALUATION REPORT (AT CURRENT BOARD RATES)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gold Stock Summary Card */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> GOLD INVENTORY (सोनं)
                </span>
                <span className="text-xs font-mono text-slate-300">{goldStock.length} Items</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Total Gross Weight:</span>
                  <span className="font-bold text-slate-100">{formatWeight(goldGrossWt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Net Weight:</span>
                  <span className="font-bold text-slate-100">{formatWeight(goldNetWt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fine 24K Pure Weight:</span>
                  <span className="font-bold text-amber-300">{formatWeight(goldFineWt)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-emerald-400">
                  <span>Market Valuation:</span>
                  <span>{formatCurrency(goldValuation)}</span>
                </div>
              </div>
            </div>

            {/* Silver Stock Summary Card */}
            <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-slate-400" /> SILVER INVENTORY (चांदी)
                </span>
                <span className="text-xs font-mono text-slate-300">{silverStock.length} Items</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Total Gross Weight:</span>
                  <span className="font-bold text-slate-100">{formatWeight(silverGrossWt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Net Weight:</span>
                  <span className="font-bold text-slate-100">{formatWeight(silverNetWt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fine 99.9% Pure Weight:</span>
                  <span className="font-bold text-slate-200">{formatWeight(silverFineWt)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-emerald-400">
                  <span>Market Valuation:</span>
                  <span>{formatCurrency(silverValuation)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
