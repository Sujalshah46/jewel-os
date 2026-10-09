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
              JEWELLERY TAG LAYOUT PREVIEW
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Demo print layout only. Codes and QR graphics are placeholders; no barcode payload, HUID, hallmark, or printer output is verified.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT LAYOUT PREVIEW</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Selector */}
        <div className="no-print bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300">
            Select Demo Item for Preview
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
                  {s.itemCode} - {s.category} ({s.grossWeight} GM, demo ref: {s.barcode})
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
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[360px] print:border-none print:p-0 print:m-0 print:bg-white">
          <div className="no-print flex items-center justify-between w-full max-w-lg mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                {tagFormat === 'Dumbbell'
                  ? 'Dumbbell (Rat-tail) Tag • 86mm × 14mm'
                  : 'Butterfly (Foldover Flap) Tag • 60mm × 28mm'}
              </h3>
              <p className="text-[11px] text-amber-400">
                {tagFormat === 'Dumbbell'
                  ? 'Two printable oval heads connected by a narrow rat-tail wrap loop'
                  : 'Two equal rectangular wings folding symmetrically over ornament string'}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {tagFormat.toUpperCase()} TEMPLATE
            </span>
          </div>

          {selectedItem && tagFormat === 'Dumbbell' && (
            /* DUMBBELL (RAT-TAIL) JEWELLERY TAG */
            <div className="print-tag-dumbbell bg-white text-slate-950 p-2.5 rounded-2xl border-2 border-slate-400 shadow-2xl flex items-center justify-between font-mono text-[9px] w-full max-w-lg print:max-w-none print:shadow-none print:border-slate-800 print:m-0">
              {/* Left Head (Front Face) */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-2 w-[44%] space-y-0.5 shadow-sm">
                <div className="flex items-center justify-between pb-0.5 border-b border-slate-200">
                  <span className="font-serif font-black text-[11px] text-slate-900 tracking-tight leading-none">
                    {activeFirm.code || 'KJJ'}
                  </span>
                  <span className="text-[9px] font-bold text-amber-800 px-1 rounded bg-amber-100">
                    {selectedItem.purityKarat || '22K'}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-[10px] leading-tight pt-0.5">{selectedItem.itemCode}</p>
                <p className="text-slate-600 font-mono text-[8.5px]">ITEM REF: {selectedItem.barcode}</p>
                <p className="text-[8.5px] text-slate-500 truncate">HUID (unverified): {selectedItem.huid || '—'}</p>
              </div>

              {/* Narrow Tail (Clear plastic string loop that wraps around the ring / chain) */}
              <div className="w-[12%] flex flex-col items-center justify-center px-1">
                <div className="h-0.5 w-full bg-slate-300 border-t border-b border-dashed border-slate-400"></div>
                <span className="text-[7px] text-slate-400 uppercase font-sans tracking-tighter my-0.5">LOOP</span>
                <div className="h-0.5 w-full bg-slate-300 border-t border-b border-dashed border-slate-400"></div>
              </div>

              {/* Right Head (Back Face / QR Code) */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-2 w-[44%] flex items-center justify-between gap-1 shadow-sm">
                <div className="space-y-0.5 flex-1">
                  <p className="text-[8.5px] text-slate-600">GW: <strong className="text-slate-900">{selectedItem.grossWeight.toFixed(3)}g</strong></p>
                  <p className="text-[8.5px] text-slate-600">NW: <strong className="text-slate-900">{selectedItem.netWeight.toFixed(3)}g</strong></p>
                  <p className="text-[8.5px] text-slate-600">M/G: ₹{selectedItem.makingChargeValue}</p>
                  <p className="font-black text-slate-950 text-[10.5px] leading-tight pt-0.5">
                    ₹{Math.round(selectedItem.totalPrice).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-950 p-0.5 rounded flex items-center justify-center text-white flex-shrink-0">
                  <QrCode aria-label="QR placeholder; no encoded data" className="w-9 h-9" />
                </div>
              </div>
            </div>
          )}

          {selectedItem && tagFormat === 'Butterfly' && (
            /* BUTTERFLY (FOLDOVER DUAL WING) JEWELLERY TAG */
            <div className="print-tag-butterfly bg-white text-slate-950 p-3 rounded-lg border-2 border-slate-400 shadow-2xl flex flex-col items-center font-mono text-[9px] w-full max-w-sm print:max-w-none print:shadow-none print:border-slate-800 print:m-0 space-y-2">
              {/* Upper Wing (Front Face with Firm & Ornament Specs) */}
              <div className="w-full bg-amber-50/60 border border-amber-200/80 rounded p-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-serif font-black text-xs text-slate-900 tracking-wider">
                      {activeFirm.name || 'KRISHNA JEWELLERS'}
                    </span>
                    <span className="text-[8px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-bold">
                      {selectedItem.purityKarat || '22K916'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-[10px] mt-0.5">{selectedItem.itemCode} ({selectedItem.category})</p>
                  <p className="text-slate-600 text-[8.5px]">ITEM REF: {selectedItem.barcode} • HUID (unverified): {selectedItem.huid || '—'}</p>
                </div>
                <div className="text-right">
                    <span className="text-[8px] text-slate-500 uppercase font-sans">DEMO PRICE DISPLAY</span>
                  <p className="font-bold text-amber-900 text-xs mt-0.5">₹{Math.round(selectedItem.totalPrice).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Fold Line (Central Crease for Thread) */}
              <div className="w-full flex items-center justify-center relative my-0.5">
                <div className="w-full border-t-2 border-dashed border-amber-400"></div>
                <span className="absolute bg-white px-2 text-[7.5px] font-sans font-bold text-amber-700 tracking-wider uppercase">
                  ✂ FOLD LINE (THREAD CREASE) ✂
                </span>
              </div>

              {/* Lower Wing (Mirror Back Face with QR Code & Detailed Weight Breakdown) */}
              <div className="w-full bg-slate-50 border border-slate-300 rounded p-2 flex items-center justify-between">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8.5px]">
                  <span>GROSS WT: <strong className="text-slate-900 font-bold">{selectedItem.grossWeight.toFixed(3)}g</strong></span>
                  <span>NET WT: <strong className="text-slate-900 font-bold">{selectedItem.netWeight.toFixed(3)}g</strong></span>
                  <span>LESS WT: <strong className="text-slate-900 font-bold">{(selectedItem.lessWeight || 0).toFixed(3)}g</strong></span>
                  <span>MAKING: <strong className="text-slate-900 font-bold">₹{selectedItem.makingChargeValue}/g</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-300">
                  <div className="text-right">
                    <p className="text-[7.5px] text-slate-500">SAMPLE ITEM CODE</p>
                    <p className="font-mono text-[8px] font-bold text-slate-800">{selectedItem.barcode}</p>
                  </div>
                  <div className="w-9 h-9 bg-slate-950 p-0.5 rounded flex items-center justify-center text-white flex-shrink-0">
                    <QrCode aria-label="QR placeholder; no encoded data" className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="no-print text-[11px] text-slate-400 mt-4">
            Layout preview only: the QR artwork is not scannable. HUID, hallmark, RFID, barcode generation, and printer compatibility have not been verified.
          </p>
        </div>
      </div>
    </div>
  );
}
