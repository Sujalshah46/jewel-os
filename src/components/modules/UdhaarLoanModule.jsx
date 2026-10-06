import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  CreditCard,
  PlusCircle,
  Search,
  CheckCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  Coins,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  UserCheck,
  X,
  FileText
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';
import { calculateGirviInterest } from '../../utils/calculations';

export default function UdhaarLoanModule() {
  const {
    udhaarList,
    customers,
    activeFirm,
    recordUdhaarDeposit,
    createGirviLoan
  } = useJewellery();

  const [activeTab, setActiveTab] = useState('ACTIVE UDHAAR');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showGirviModal, setShowGirviModal] = useState(false);
  const [selectedUdhaarForDeposit, setSelectedUdhaarForDeposit] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMode, setDepositMode] = useState('Cash');

  // Girvi Form State
  const [girviForm, setGirviForm] = useState({
    customerId: customers[0]?.id || 'CUST-001',
    customerName: customers[0]?.fullName || 'Avinash Kale',
    mobile: customers[0]?.mobile || '9822012345',
    city: 'Pune',
    principalAmount: 50000,
    roiMonthlyPercent: 1.5,
    transType: 'Girvi Gold Loan',
    pledgedGoldGrossWt: 10.500,
    pledgedGoldFineWt: 9.600,
    ornamentDetails: '1 Pair 22K Gold Bangles',
    dueDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
  });

  // Clean, professional tabs (Replaces confusing "ACT. ADV. MONEY" from audit)
  const tabs = [
    { id: 'ACTIVE UDHAAR', label: 'Active Udhaar & Loans' },
    { id: 'UDHAAR DEPOSIT', label: 'Repayment & Deposit History' },
    { id: 'ADVANCE ORDERS', label: 'Active Customer Advances' },
    { id: 'GIRVI LOANS', label: 'Girvi / Pledged Gold Ledger' }
  ];

  // Filtered List
  const filteredList = udhaarList.filter(u => {
    const matches = u.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mainInvoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobile?.includes(searchTerm);
    if (activeTab === 'ACTIVE UDHAAR') return matches && u.status === 'Active';
    if (activeTab === 'UDHAAR DEPOSIT') return matches && u.depositedAmount > 0;
    if (activeTab === 'GIRVI LOANS') return matches && u.transType.toLowerCase().includes('girvi');
    return matches;
  });

  // Calculate Column Totals
  const totalPrincipal = filteredList.reduce((acc, curr) => acc + (Number(curr.principalAmount) || 0), 0);
  const totalDeposited = filteredList.reduce((acc, curr) => acc + (Number(curr.depositedAmount) || 0), 0);
  const totalLeftBalance = filteredList.reduce((acc, curr) => acc + (Number(curr.leftBalance) || 0), 0);

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!selectedUdhaarForDeposit || !depositAmount) return;
    recordUdhaarDeposit(selectedUdhaarForDeposit.id, Number(depositAmount), depositMode);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  const handleGirviSubmit = (e) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === girviForm.customerId) || customers[0];
    createGirviLoan({
      ...girviForm,
      customerName: cust.fullName,
      mobile: cust.mobile,
      leftBalance: Number(girviForm.principalAmount),
      amountWithInterest: Number(girviForm.principalAmount),
      depositedAmount: 0
    });
    setShowGirviModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <CreditCard className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              LOANS, UDHAAR & GIRVI MANAGEMENT
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Customer Credit Ledger, Repayment Tracking & BIS Gold Pledge (Girvi) Pawnbroking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGirviModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Coins className="w-4 h-4" />
            <span>+ BOOK GIRVI GOLD LOAN</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Stats Bar: Clearly explaining Principal - Repayments = Net Due (Audit P1 Fix) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">1. Total Principal Issued</p>
            <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{formatCurrency(totalPrincipal)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sale credit & Girvi disbursements</p>
          </div>
          <div className="p-3 bg-amber-500/15 rounded-xl text-amber-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">2. Repayments Recovered</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(totalDeposited)}</p>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">Deposited cash & UPI receipts</p>
          </div>
          <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">3. Net Balance Due (Left)</p>
            <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">{formatCurrency(totalLeftBalance)}</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">Principal − Repayments = Net Left</p>
          </div>
          <div className="p-3 bg-rose-500/15 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Customer name, Mobile number, Invoice KUM..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-mono hidden sm:inline">
            Records: <strong className="text-slate-200">{filteredList.length}</strong>
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Active Loans & Credit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 font-mono whitespace-nowrap">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Loan / Ref No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Original Bill</th>
                <th className="py-3 px-3">Customer Party</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Transaction Type</th>
                <th className="py-3 px-3">Pledged Gold</th>
                <th className="py-3 px-3 text-right">Principal (₹)</th>
                <th className="py-3 px-3 text-right">Deposited (₹)</th>
                <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {filteredList.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-amber-300">{u.invoiceNo}</td>
                  <td className="py-3 px-3 text-slate-400">{u.date}</td>
                  <td className="py-3 px-3 text-slate-300">{u.mainInvoiceNo}</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-100">{u.customerName}</td>
                  <td className="py-3 px-3 text-slate-300">{u.mobile}</td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.transType.toLowerCase().includes('girvi') 
                        ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.transType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-200">
                    {u.pledgedGoldGrossWt > 0 ? `${u.pledgedGoldGrossWt.toFixed(3)}g` : '–'}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-100 text-right">{formatCurrency(u.principalAmount)}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold text-right">{formatCurrency(u.depositedAmount || 0)}</td>
                  <td className="py-3 px-3 font-extrabold text-rose-400 text-right">{formatCurrency(u.leftBalance)}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'Active' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {u.leftBalance > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedUdhaarForDeposit(u);
                          setDepositAmount(String(u.leftBalance));
                          setShowDepositModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow"
                      >
                        Receive ₹
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-sans font-semibold">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Deposit Modal */}
      {showDepositModal && selectedUdhaarForDeposit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Receive Udhaar / Loan Repayment</h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-400">Customer: <strong className="text-slate-100">{selectedUdhaarForDeposit.customerName}</strong></p>
                <p className="text-slate-400">Reference: <strong className="font-mono text-amber-300">{selectedUdhaarForDeposit.invoiceNo}</strong></p>
                <p className="text-slate-400">Current Balance Due: <strong className="font-mono text-rose-400">{formatCurrency(selectedUdhaarForDeposit.leftBalance)}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">DEPOSIT AMOUNT (₹) *</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  max={selectedUdhaarForDeposit.leftBalance}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-base text-emerald-300 font-mono font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PAYMENT MODE</label>
                <select
                  value={depositMode}
                  onChange={(e) => setDepositMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                >
                  <option value="Cash">Cash (Physical Counter)</option>
                  <option value="Online/UPI">Online / UPI (GPay/PhonePe)</option>
                  <option value="Bank">Bank Transfer / Cheque</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  CONFIRM RECEIPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Girvi Gold Loan Modal */}
      {showGirviModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-purple-400" />
                <h3 className="font-serif font-bold text-base text-purple-300 uppercase tracking-wider">
                  Book Girvi / Gold Pledge Loan
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowGirviModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGirviSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Customer / Borrower *</label>
                  <select
                    value={girviForm.customerId}
                    onChange={(e) => setGirviForm(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 font-bold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.mobile})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1">Loan Principal (₹) *</label>
                  <input
                    type="number"
                    value={girviForm.principalAmount}
                    onChange={(e) => setGirviForm(prev => ({ ...prev, principalAmount: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly ROI %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={girviForm.roiMonthlyPercent}
                    onChange={(e) => setGirviForm(prev => ({ ...prev, roiMonthlyPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">Pledged Gold Gross Wt (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={girviForm.pledgedGoldGrossWt}
                    onChange={(e) => setGirviForm(prev => ({ ...prev, pledgedGoldGrossWt: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fine Pure Wt (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={girviForm.pledgedGoldFineWt}
                    onChange={(e) => setGirviForm(prev => ({ ...prev, pledgedGoldFineWt: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pledged Ornament Description</label>
                  <input
                    type="text"
                    value={girviForm.ornamentDetails}
                    onChange={(e) => setGirviForm(prev => ({ ...prev, ornamentDetails: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGirviModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 text-white font-bold rounded-xl shadow-lg"
                >
                  DISBURSE & PRINT GIRVI VOUCHER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
