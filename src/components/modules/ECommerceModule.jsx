import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  ShoppingBag,
  Search,
  Eye,
  ShoppingCart,
  Receipt,
  Sparkles,
  QrCode,
  Tag,
  Share2,
  Printer,
  FileText,
  X
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';
import { getProductImage } from '../../utils/productImages';

export default function ECommerceModule() {
  const { stock, activeFirm, setActiveModule, setPreviewEstimate } = useJewellery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

  const filteredStock = stock.filter(s =>
    s.status === 'In Stock' && (
      s.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subCategory?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Top Header matching Audit 8:07 - 9:36 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              E-COMMERCE SHOWROOM & JEWELLERY PHOTO CATALOG
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Digital showroom using stored bullion rates, making charge breakdown and local billing
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Showroom Catalog..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* 4 Cards / Row Grid matching Audit 93 & 172 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStock.map(item => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-950">
              <img
                src={getProductImage(item)}
                alt={`${item.subCategory || item.category} product photograph`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {item.purityKarat}
              </div>
              <div className="absolute top-2 right-2 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-300 border border-emerald-800">
                Qty: {item.qty} PP
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 font-mono">{item.itemCode}</h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{item.subCategory}</p>
                </div>
                <p className="text-sm font-extrabold text-amber-300 font-mono">
                  {formatCurrency(item.totalPrice)}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                <span>GS WT: <strong className="text-slate-200">{item.grossWeight.toFixed(3)} GM</strong></span>
                <span>NT WT: <strong className="text-slate-200">{item.netWeight.toFixed(3)} GM</strong></span>
                <span>MAKING: <strong className="text-slate-200">₹{item.makingChargeValue}/GM</strong></span>
                <span>HUID: <strong className="text-slate-200">{item.huid}</strong></span>
              </div>
            </div>

            <div className="p-3 pt-0 flex gap-2">
              <button
                onClick={() => setSelectedItemDetails(item)}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/30 transition-colors"
              >
                MORE DETAILS
              </button>
              <button
                onClick={() => setActiveModule('billing')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center"
                title="Bill this item in POS"
              >
                <Receipt className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ITEM DETAILS PANEL (Audit 174) */}
      {selectedItemDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full shadow-2xl p-6 text-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-amber-300 uppercase tracking-wider">
                  ITEM DETAILS PANEL — {selectedItemDetails.itemCode}
                </h3>
              </div>
              <button onClick={() => setSelectedItemDetails(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img
                  src={getProductImage(selectedItemDetails)}
                  alt={`${selectedItemDetails.subCategory || selectedItemDetails.category} product photograph`}
                  className="w-full h-64 object-cover rounded-xl border border-slate-700 shadow-xl"
                />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Barcode / SKU:</span>
                  <span className="font-bold text-amber-300">{selectedItemDetails.barcode}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Gold Purity:</span>
                  <span className="font-bold text-slate-100">{selectedItemDetails.purityKarat} ({selectedItemDetails.purityPercent}%)</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Gross Weight:</span>
                  <span className="font-bold text-slate-100">{formatWeight(selectedItemDetails.grossWeight)}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Net Weight:</span>
                  <span className="font-bold text-amber-200">{formatWeight(selectedItemDetails.netWeight)}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Fine Gold Weight:</span>
                  <span className="font-bold text-emerald-400">{formatWeight(selectedItemDetails.fineWeight)}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Making Charges:</span>
                  <span className="font-bold text-slate-200">₹{selectedItemDetails.makingChargeValue}/GM</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-extrabold text-amber-300">
                  <span>Price (Incl. Tax):</span>
                  <span>{formatCurrency(selectedItemDetails.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setPreviewEstimate({
                    shopName: activeFirm.name,
                    customer: { fullName: 'Walk-in Customer' },
                    date: new Date().toISOString().split('T')[0],
                    items: [selectedItemDetails],
                    total: selectedItemDetails.totalPrice
                  });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/30 flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Estimate</span>
              </button>

              <button
                onClick={() => {
                  setSelectedItemDetails(null);
                  setActiveModule('billing');
                }}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
              >
                BUY NOW / BILL THIS ITEM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
