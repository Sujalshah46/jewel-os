import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Package,
  ArrowRightLeft,
  Sliders,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Building2,
  Tag,
  Scale
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function AdminInventoryTab() {
  const {
    stock,
    branches,
    transferStockBetweenBranches,
    adjustStockItem
  } = useJewellery();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [transferModalItem, setTransferModalItem] = useState(null);
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Transfer Form State
  const [targetBranchId, setTargetBranchId] = useState(branches[1]?.id || branches[0]?.id || '');
  const [transferReason, setTransferReason] = useState('Display replenishment for upcoming festive wedding season');

  // Adjustment Form State
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Physical audit stock verification');

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (!transferModalItem) return;
    try {
      transferStockBetweenBranches(transferModalItem.id, targetBranchId, transferReason);
      setTransferModalItem(null);
      showNotification(`Item ${transferModalItem.itemCode || transferModalItem.id} transferred successfully.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleExecuteAdjustment = (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    try {
      adjustStockItem(adjustModalItem.id, adjustQty, adjustReason);
      setAdjustModalItem(null);
      showNotification(`Stock adjustment applied for item ${adjustModalItem.itemCode || adjustModalItem.id}.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesBranch = selectedBranchFilter === 'All' || item.branchId === selectedBranchFilter;
    const matchesSearch =
      (item.itemCode && item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBranch && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              INVENTORY ADMINISTRATION & LOGISTICS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inter-branch stock distribution, custody transfers between showrooms, and privileged inventory reconciliations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Barcode, Item Code, HUID..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="text-slate-400 font-medium">Filter by Branch:</span>
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-amber-300 font-bold focus:outline-none"
          >
            <option value="All">All Locations & Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Serialized Stock Records ({filteredStock.length} items)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Barcode / Tag</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Karat / Metal</th>
                <th className="py-2.5 px-3">Current Location</th>
                <th className="py-2.5 px-3">Gross Wt</th>
                <th className="py-2.5 px-3">Net Wt</th>
                <th className="py-2.5 px-3">Valuation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStock.map(item => {
                const branchObj = branches.find(b => b.id === item.branchId);

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-amber-300">{item.barcode || item.itemCode || item.id}</span>
                      {item.huid && (
                        <span className="block text-[10px] text-slate-400 font-mono">HUID: {item.huid}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100">
                      {item.description || item.category}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {item.metalType} {item.karat}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-400" />
                        <span>{branchObj?.name || item.location || 'Main Showroom'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                      {Number(item.grossWeight).toFixed(3)}g
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {Number(item.netWeight).toFixed(3)}g
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          item.status === 'In Stock'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setTransferModalItem(item)}
                          className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                        <button
                          onClick={() => setAdjustModalItem(item)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- MODAL: INTER-BRANCH TRANSFER ----------------- */}
      {transferModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Inter-Branch Stock Transfer
                </h3>
              </div>
              <button
                onClick={() => setTransferModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <p>Item Code: <strong className="text-amber-300 font-mono">{transferModalItem.itemCode || transferModalItem.id}</strong></p>
                <p>Description: <strong className="text-slate-100">{transferModalItem.description}</strong></p>
                <p>Weight: <strong className="text-slate-100 font-mono">{transferModalItem.grossWeight}g</strong></p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  DESTINATION BRANCH / SHOWROOM
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  TRANSFER REASON / AUTHORIZATION NOTE
                </label>
                <textarea
                  rows="2"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferModalItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: STOCK ADJUSTMENT ----------------- */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Physical Stock Adjustment
                </h3>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <p>Item: <strong className="text-amber-300 font-mono">{adjustModalItem.itemCode || adjustModalItem.id}</strong></p>
                <p>Current Quantity: <strong className="text-emerald-400 font-mono">{adjustModalItem.quantity || 1}</strong></p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  QUANTITY ADJUSTMENT DELTA (+/-)
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  REASON / AUDIT NOTE
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
