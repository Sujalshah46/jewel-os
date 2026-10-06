import React from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  X,
  Printer,
  Sparkles,
  FileText,
  Building2
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';

export default function EstimateModal() {
  const { previewEstimate, setPreviewEstimate, activeFirm } = useJewellery();

  if (!previewEstimate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full shadow-2xl p-6 text-slate-100 space-y-4">
        <div className="no-print flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-amber-300 uppercase tracking-wider">
              {activeFirm.name} — ESTIMATE / QUOTATION
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={() => setPreviewEstimate(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estimate Content matching Audit 129 */}
        <div className="bg-white text-slate-950 p-4 rounded-xl space-y-3 font-mono text-xs shadow-inner">
          <div className="text-center border-b border-slate-200 pb-2 font-sans">
            <h4 className="font-serif font-bold text-base text-slate-900">{activeFirm.name}</h4>
            <p className="text-[10px] text-slate-500">{activeFirm.address}</p>
            <p className="text-xs font-bold text-amber-800 mt-1 uppercase">ESTIMATE / ROUGH QUOTATION</p>
            <p className="text-[10px] text-slate-500">Date: {previewEstimate.date || new Date().toISOString().split('T')[0]}</p>
          </div>

          <table className="w-full text-[11px] text-left border-b border-slate-200">
            <thead className="text-[10px] uppercase bg-slate-100 text-slate-700">
              <tr>
                <th className="py-1.5 px-2">ITEM / NAME</th>
                <th className="py-1.5 px-2">WEIGHT</th>
                <th className="py-1.5 px-2">METAL / RATE</th>
                <th className="py-1.5 px-2 text-right">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(previewEstimate.items || []).map((i, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2 font-bold">{i.itemCode || 'LRING29'}</td>
                  <td className="py-1.5 px-2">{formatWeight(i.grossWeight || 2.0)}</td>
                  <td className="py-1.5 px-2">{i.purityKarat || '22K (91.6)'}</td>
                  <td className="py-1.5 px-2 text-right font-bold">
                    ₹{(i.finalValue || 17200).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
            <span>TOTAL ESTIMATE VALUE:</span>
            <span>{formatCurrency(previewEstimate.total || 17200)}</span>
          </div>

          <p className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-200 font-sans">
            * This is an estimate based on today's gold rate and is valid for today only. GST & making charges subject to final bill.
          </p>
        </div>

        <div className="no-print flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setPreviewEstimate(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Quotation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
