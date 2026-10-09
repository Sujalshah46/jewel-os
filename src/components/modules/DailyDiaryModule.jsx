import React, { useState, useEffect } from 'react';
import { useJewellery, getTodayBusinessDate } from '../../context/JewelleryContext';
import {
  BookOpen,
  Calendar,
  DollarSign,
  CreditCard,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Download,
  CheckCircle,
  Building2,
  Filter,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function DailyDiaryModule() {
  const { dailyDiary, activeFirm, invoices, expenses, udhaarRepayments, loadDiaryDay, apiMode } = useJewellery();
  
  // Dynamic business date selector (defaults to current date, supports historical archive)
  const [selectedDate, setSelectedDate] = useState(() => getTodayBusinessDate());
  const isHistoricalArchive = selectedDate === '2024-08-12';

  // In API mode, fetch the diary day (opening balance, notes) for the selected date.
  useEffect(() => {
    if (apiMode && typeof loadDiaryDay === 'function' && selectedDate) {
      loadDiaryDay(selectedDate);
    }
  }, [apiMode, loadDiaryDay, selectedDate]);

  // Invoices for selected business date & active firm
  const dateInvoices = (invoices || []).filter(inv =>
    inv.date === selectedDate &&
    (!inv.firmId || inv.firmId === activeFirm.id || !inv.firmCode || inv.firmCode === activeFirm.code)
  );

  const sellList = dateInvoices.length > 0
    ? dateInvoices.map(inv => ({
        invNo: inv.invoiceNo,
        date: inv.date,
        customer: inv.customerName,
        city: activeFirm.city,
        cash: Number(inv.payments?.cash) || 0,
        bank: Number(inv.payments?.cheque) || 0,
        card: Number(inv.payments?.card) || 0,
        online: Number(inv.payments?.online) || 0,
        discount: Number(inv.discount) || 0,
        total: Number(inv.totalInvoiceAmount) || 0
      }))
    : (isHistoricalArchive ? (dailyDiary.todaySellDetails || []) : []);
  
  // Physical counter cash movements vs non-cash (Derived from transactions)
  const physicalCashFromSales = sellList.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);

  // Udhaar cash receipts on this business date
  const dateRepayments = (udhaarRepayments || []).filter(r =>
    r.date === selectedDate &&
    (!r.firmId || r.firmId === activeFirm.id || !r.firmCode || r.firmCode === activeFirm.code)
  );
  const physicalCashFromUdhaar = dateRepayments
    .filter(r => r.paymentMode === 'Cash')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0) +
    (isHistoricalArchive ? (Number(dailyDiary.udhaarMoneyDepositedTotal) || 0) : 0);

  const totalPhysicalCashInward = physicalCashFromSales + physicalCashFromUdhaar;

  const totalBankInward = sellList.reduce((acc, curr) => acc + (Number(curr.bank) || 0), 0);
  const totalCardInward = sellList.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
  const totalOnlineInward = sellList.reduce((acc, curr) => acc + (Number(curr.online) || 0), 0);
  const totalElectronicInward = totalBankInward + totalCardInward + totalOnlineInward;

  // Expenses on this business date
  const dateExpenses = (expenses || []).filter(e =>
    e.date === selectedDate &&
    (!e.firmId || e.firmId === activeFirm.id || !e.firmCode || e.firmCode === activeFirm.code)
  );
  const totalCashExpenses = dateExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) +
    (isHistoricalArchive ? (Number(dailyDiary.expensesTotal) || 13300) : 0);

  // Authoritative physical cash formula: Opening + Physical Inward - Cash Outward = Closing Drawer Cash
  const openingBalance = Number(dailyDiary.openingBalance) || 10000;
  const closingDrawerCash = openingBalance + totalPhysicalCashInward - totalCashExpenses;
  const todaySellTotal = sellList.reduce((acc, r) => acc + (Number(r.total) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Date Selection */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              DAILY DIARY & CASH COUNTER (DAY BOOK)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Firm: <strong className="text-slate-200">{activeFirm.name}</strong> • Physical Drawer Cash & Electronic Inward Balancing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsHistoricalArchive(e.target.value === '2024-08-12');
              }}
              className="bg-transparent text-amber-200 font-bold font-mono focus:outline-none"
            />
            {isHistoricalArchive && (
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                Audit Archive
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm shadow transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT DAY BOOK</span>
          </button>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Summary Cards (Resolves Audit P1 Cash vs Electronic Distinction) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Opening Cash */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">1. Opening Cash in Drawer</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-1 font-mono">
            {formatCurrency(openingBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cash brought forward at day start</p>
        </div>

        {/* 2. Physical Cash Inward */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 md:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">2. Physical Cash Inward</p>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">DRAWER</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1 font-mono">
            + {formatCurrency(totalPhysicalCashInward)}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            Cash Sales (₹{physicalCashFromSales.toLocaleString('en-IN')}) + Cash Udhaar (₹{physicalCashFromUdhaar.toLocaleString('en-IN')})
          </p>
        </div>

        {/* 3. Physical Cash Outward */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 md:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">3. Cash Outward (Expenses)</p>
            <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800">DRAWER</span>
          </div>
          <p className="text-2xl font-extrabold text-rose-300 mt-1 font-mono">
            - {formatCurrency(totalCashExpenses)}
          </p>
          <p className="text-[11px] text-rose-400/80 mt-1">Shop maintenance & petty cash payouts</p>
        </div>

        {/* 4. Closing Physical Cash */}
        <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-4 md:p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">4. Closing Cash in Drawer</p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">PHYSICAL</span>
          </div>
          <p className="text-2xl font-black text-amber-200 mt-1 font-mono">
            {formatCurrency(closingDrawerCash)}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Opening + Cash In − Out = Closing</span>
          </p>
        </div>
      </div>

      {/* Non-Cash / Electronic Mode Inward Summary Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <CreditCard className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-100">Electronic & Bank Receipts (Direct Bank Deposit):</span>
            <p className="text-[11px] text-slate-400">These funds directly credit bank accounts and do not affect physical drawer cash.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono font-bold text-xs">
          <span className="text-blue-300">Bank: {formatCurrency(totalBankInward)}</span>
          <span className="text-amber-300">Card: {formatCurrency(totalCardInward)}</span>
          <span className="text-purple-300">UPI/Online: {formatCurrency(totalOnlineInward)}</span>
          <span className="text-slate-100 pl-2 border-l border-slate-700">Total Electronic: {formatCurrency(totalElectronicInward)}</span>
        </div>
      </div>

      {/* TODAY SELL DETAILS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              1. Today Sell Details (Invoice Breakdown By Payment Modes)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            TOTAL SALES: {formatCurrency(todaySellTotal)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-3">INV NO</th>
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">FIRM</th>
                <th className="py-3 px-3">CUSTOMER NAME</th>
                <th className="py-3 px-3">CITY</th>
                <th className="py-3 px-3 text-right">CASH (₹)</th>
                <th className="py-3 px-3 text-right">BANK (₹)</th>
                <th className="py-3 px-3 text-right">CARD (₹)</th>
                <th className="py-3 px-3 text-right">ONLINE (₹)</th>
                <th className="py-3 px-3 text-right">TOTAL INVOICE (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {sellList.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-amber-300">{row.invNo}</td>
                  <td className="py-3 px-3 text-slate-400">{selectedDate}</td>
                  <td className="py-3 px-3 text-slate-300">KJJ</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-100">{row.customer}</td>
                  <td className="py-3 px-3 text-slate-300">{row.city}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {row.cash > 0 ? formatCurrency(row.cash) : '–'}
                  </td>
                  <td className="py-3 px-3 text-right text-blue-300">
                    {row.bank > 0 ? formatCurrency(row.bank) : '–'}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-300">
                    {row.card > 0 ? formatCurrency(row.card) : '–'}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-300">
                    {row.online > 0 ? formatCurrency(row.online) : '–'}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-100">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950 font-mono text-xs font-bold border-t border-slate-700">
              <tr>
                <td colSpan={5} className="py-3 px-3 text-slate-300">TOTAL COLLECTIONS:</td>
                <td className="py-3 px-3 text-right text-emerald-400">{formatCurrency(physicalCashFromSales)}</td>
                <td className="py-3 px-3 text-right text-blue-300">{formatCurrency(totalBankInward)}</td>
                <td className="py-3 px-3 text-right text-amber-300">{formatCurrency(totalCardInward)}</td>
                <td className="py-3 px-3 text-right text-purple-300">{formatCurrency(totalOnlineInward)}</td>
                <td className="py-3 px-3 text-right text-amber-300">{formatCurrency(todaySellTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2. Old Metal Jama & Udhaar Recoveries Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Old Metal Jama Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">
                Old Metal Jama / Exchange (Non-Cash Inward)
              </h4>
            </div>
            <span className="font-mono text-xs font-bold text-amber-300">
              {formatCurrency(dailyDiary.oldMetalJamaTotal)}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono pt-1">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300">IS86 Avinash Kale (Old 22K 4.500g)</span>
              <span className="font-bold text-emerald-400">₹24,000.00</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300">IS85 Deva Jadhav (Scrap 20K 12.000g)</span>
              <span className="font-bold text-emerald-400">₹68,400.00</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300">IS82 Lata Shinde (Old 24K Bar 250g)</span>
              <span className="font-bold text-emerald-400">₹17,43,268.00</span>
            </div>
          </div>
        </div>

        {/* Udhaar Deposit & Counter Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">
                Udhaar Recoveries & Counter Expenses
              </h4>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-400">
              + {formatCurrency(dailyDiary.udhaarMoneyDepositedTotal)}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono pt-1">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300">Rushi More (Udhaar Installment)</span>
              <span className="font-bold text-emerald-400">+ ₹5,000.00 (Cash Inward)</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-rose-400">Petty Cash & Karigar Payouts</span>
              <span className="font-bold text-rose-400">- {formatCurrency(totalCashExpenses)} (Cash Outward)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Counter Cash Drawer Net Movement:</span>
            <span className="font-bold font-mono text-slate-200">
              {formatCurrency(totalPhysicalCashInward - totalCashExpenses)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
