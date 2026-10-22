import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Tag,
  Printer,
  FileCode,
  Copy,
  Download,
  Check,
  Building2,
  Sparkles,
  CheckCircle,
  X
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';
import DynamicQrCode from '../common/DynamicQrCode';
import { generateDumbbellZpl, generateButterflyZpl, downloadZplFile } from '../../utils/zplGenerator';

export default function TagGeneratorModule() {
  const { stock, activeFirm } = useJewellery();
  const [selectedStockId, setSelectedStockId] = useState(stock[0]?.id || '');
  const [tagFormat, setTagFormat] = useState('Dumbbell'); // 'Dumbbell' or 'Butterfly'
  const [showZplModal, setShowZplModal] = useState(false);
  const [copiedZpl, setCopiedZpl] = useState(false);

  const selectedItem = stock.find(s => s.id === selectedStockId) || stock[0];

  const zplPayload = selectedItem
    ? (tagFormat === 'Dumbbell'
        ? generateDumbbellZpl({
            firmCode: activeFirm.code || 'KJJ',
            itemCode: selectedItem.itemCode,
            barcode: selectedItem.barcode,
            huid: selectedItem.huid,
            purityKarat: selectedItem.purityKarat || '22K916',
            grossWeight: selectedItem.grossWeight,
            netWeight: selectedItem.netWeight,
            makingCharge: selectedItem.makingChargeValue || 0,
            totalPrice: selectedItem.totalPrice || 0
          })
        : generateButterflyZpl({
            firmName: activeFirm.name || 'Krishna Jewellers',
            itemCode: selectedItem.itemCode,
            category: selectedItem.category,
            barcode: selectedItem.barcode,
            huid: selectedItem.huid,
            purityKarat: selectedItem.purityKarat || '22K916',
            grossWeight: selectedItem.grossWeight,
            netWeight: selectedItem.netWeight,
            lessWeight: selectedItem.lessWeight || 0,
            makingCharge: selectedItem.makingChargeValue || 0,
            totalPrice: selectedItem.totalPrice || 0
          }))
    : '';

  const handleCopyZpl = async () => {
    try {
      await navigator.clipboard.writeText(zplPayload);
      setCopiedZpl(true);
      setTimeout(() => setCopiedZpl(false), 2500);
    } catch {
      alert('Failed to copy ZPL code.');
    }
  };

  const handleDownloadZpl = () => {
    const filename = `${selectedItem?.barcode || 'tag'}-${tagFormat.toLowerCase()}.zpl`;
    downloadZplFile(zplPayload, filename);
  };

  return (
    <div className="space-y-6">
      {/* Precision Print Styling for Jewellery Thermal Tags */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-tag-dumbbell {
            width: 86mm !important;
            height: 14mm !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always;
          }
          .print-tag-butterfly {
            width: 60mm !important;
            height: 28mm !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always;
          }
        }
      `}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              JEWELLERY BARCODE & THERMAL TAG DESIGNER
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Dumbbell / Rat-tail & Butterfly Thermal Jewellery Labels with Dynamic QR Code, HUID & ZPL Driver
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowZplModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs shadow transition-all cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>ZPL THERMAL CODE</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT TAG LABELS</span>
          </button>
        </div>
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
                type="button"
                onClick={() => setTagFormat('Dumbbell')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  tagFormat === 'Dumbbell' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Dumbbell (Tail)
              </button>
              <button
                type="button"
                onClick={() => setTagFormat('Butterfly')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  tagFormat === 'Butterfly' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Butterfly Tag
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>Barcode / SKU:</span>
              <strong className="text-slate-200 font-mono">{selectedItem?.barcode}</strong>
            </div>
            <div className="flex justify-between">
              <span>HUID:</span>
              <strong className="text-amber-400 font-mono">{selectedItem?.huid || 'BIS-VERIFIED'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Net Weight:</span>
              <strong className="text-slate-200">{selectedItem?.netWeight?.toFixed(3)}g</strong>
            </div>
            <div className="flex justify-between">
              <span>Purity Stamp:</span>
              <strong className="text-slate-200">{selectedItem?.purityKarat || '22K916'}</strong>
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
                <p className="text-slate-600 font-mono text-[8.5px]">BCD: {selectedItem.barcode}</p>
                <p className="text-[8.5px] text-slate-500 truncate">HUID: {selectedItem.huid || 'HUID8834591'}</p>
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
                <div className="w-10 h-10 bg-white p-0.5 rounded flex items-center justify-center flex-shrink-0">
                  <DynamicQrCode text={selectedItem.barcode} size={36} />
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
                  <p className="text-slate-600 text-[8.5px]">BARCODE: {selectedItem.barcode} • HUID: {selectedItem.huid}</p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-500 uppercase font-sans">BIS CERTIFIED</span>
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
                    <p className="text-[7.5px] text-slate-500">SCAN POS</p>
                    <p className="font-mono text-[8px] font-bold text-slate-800">{selectedItem.barcode}</p>
                  </div>
                  <div className="w-9 h-9 bg-white p-0.5 rounded flex items-center justify-center flex-shrink-0">
                    <DynamicQrCode text={selectedItem.barcode} size={32} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="no-print text-[11px] text-slate-400 mt-4">
            Compatible with Zebra, TSC, Citizen, Godex, TVS & ATPOS Thermal Tag Printers
          </p>
        </div>
      </div>

      {/* ZPL RAW THERMAL CODE MODAL */}
      {showZplModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                  Raw ZPL-II Thermal Tag Code ({tagFormat})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowZplModal(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Send this code directly to your thermal barcode printer (via USB / RAW spooler / Zebra Designer / CUPS) to print exact jewelry tags without browser print margins.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-amber-300 font-mono text-xs overflow-x-auto max-h-64">
                {zplPayload}
              </pre>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCopyZpl}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {copiedZpl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copiedZpl ? 'COPIED TO CLIPBOARD!' : 'COPY ZPL CODE'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadZpl}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD .ZPL FILE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
