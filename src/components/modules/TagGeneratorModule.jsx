import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Tag,
  Printer,
  QrCode,
  Sparkles,
  CheckCircle,
  Building2
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';

export default function TagGeneratorModule() {
  const { stock, activeFirm } = useJewellery();
  const [selectedStockId, setSelectedStockId] = useState(stock[0]?.id || '');
  const [tagFormat, setTagFormat] = useState('Dumbbell'); // 'Dumbbell' or 'Butterfly'

  const selectedItem = stock.find(s => s.id === selectedStockId) || stock[0];

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              JEWELLERY BARCODE & THERMAL TAG DESIGNER
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Dumbbell / Rat-tail Thermal Jewellery Labels with QR Code, HUID & Purity Stamp
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT TAG LABELS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Selector */}
        <div className="no-print bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300">
            Select Ornament for Tag Printing
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">INVENTORY ITEM</label>
            <select
              value={selectedStockId}
              onChange={(e) => setSelectedStockId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
            >
              {stock.map(s => (
                <option key={s.id} value={s.id}>
                  {s.itemCode} - {s.category} ({s.grossWeight} GM, BCD: {s.barcode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">TAG SHAPE / TEMPLATE</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTagFormat('Dumbbell')}
                className={`py-2 text-xs font-bold rounded-xl border ${
                  tagFormat === 'Dumbbell' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Dumbbell (Tail)
              </button>
              <button
                onClick={() => setTagFormat('Butterfly')}
                className={`py-2 text-xs font-bold rounded-xl border ${
                  tagFormat === 'Butterfly' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Butterfly Tag
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High Fidelity Tag Preview */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] print:border-none print:p-0 print:m-0 print:bg-white">
          <h3 className="no-print font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">
            Thermal Label Live Preview (45mm x 12mm Dual Tag)
          </h3>

          {selectedItem && (
            <div className="bg-white text-slate-950 p-3 rounded-lg border-2 border-slate-400 shadow-2xl flex items-center space-x-6 font-mono text-[10px] w-full max-w-md print:max-w-none print:shadow-none print:border-slate-800 print:m-0">
              {/* Left Head */}
              <div className="border-r-2 border-dashed border-slate-300 pr-4 space-y-0.5 flex-1">
                <p className="font-bold font-sans text-xs text-slate-900 leading-tight">{activeFirm.code || 'KJJ'}</p>
                <p className="font-bold text-slate-900">{selectedItem.itemCode}</p>
                <p className="font-mono text-[9px] text-slate-600">BCD: {selectedItem.barcode}</p>
                <p className="font-bold text-amber-700">{selectedItem.purityKarat}</p>
                <p className="text-[9px] text-slate-500">HUID: {selectedItem.huid}</p>
              </div>

              {/* Right Head */}
              <div className="pl-2 space-y-0.5 flex-1 text-right">
                <p className="font-bold text-slate-900">GW: {selectedItem.grossWeight.toFixed(3)}g</p>
                <p className="font-bold text-slate-900">NW: {selectedItem.netWeight.toFixed(3)}g</p>
                <p className="text-slate-700">M: ₹{selectedItem.makingChargeValue}</p>
                <p className="font-bold text-slate-900 text-xs mt-1">₹{Math.round(selectedItem.totalPrice).toLocaleString('en-IN')}</p>
              </div>

              {/* QR */}
              <div className="w-10 h-10 bg-slate-950 p-0.5 rounded flex items-center justify-center text-white">
                <QrCode className="w-9 h-9" />
              </div>
            </div>
          )}

          <p className="no-print text-[11px] text-slate-400 mt-4">
            Compatible with TSC, TVS, Citizen, Zebra & ATPOS Jewelry Thermal Barcode Printers
          </p>
        </div>
      </div>
    </div>
  );
}
