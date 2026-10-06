import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle,
  QrCode,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { formatCurrency, formatWeight, numberToWordsIndian } from '../../utils/numberToWords';

export default function InvoiceViewModal() {
  const { previewInvoice, setPreviewInvoice, activeFirm } = useJewellery();
  const [printFormat, setPrintFormat] = useState('A4'); // 'A4', 'A5', 'Thermal'

  if (!previewInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*Tax Invoice from ${activeFirm.name}*\n`
      + `Invoice No: ${previewInvoice.invoiceNo}\n`
      + `Date: ${previewInvoice.date}\n`
      + `Customer: ${previewInvoice.customerName}\n`
      + `Total Amount: ${formatCurrency(previewInvoice.totalInvoiceAmount)}\n`
      + `Payment Received: ${formatCurrency(previewInvoice.payments?.totalReceived || 0)}\n`
      + (previewInvoice.payments?.balanceUdhaarDue > 0 ? `Balance Due: ${formatCurrency(previewInvoice.payments.balanceUdhaarDue)}\n` : '')
      + `Thank you for shopping with ${activeFirm.name}! Contact: ${activeFirm.phone}`;
    
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/91${previewInvoice.customerPhone || ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-4xl w-full shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Toolbar (No-Print) */}
        <div className="no-print p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              INVOICE PRINT PREVIEW — {previewInvoice.invoiceNo}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-lg flex text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-2.5 py-1 rounded ${printFormat === 'A4' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                A4 Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('A5')}
                className={`px-2.5 py-1 rounded ${printFormat === 'A5' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                A5 Half-Page
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('Thermal')}
                className={`px-2.5 py-1 rounded ${printFormat === 'Thermal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                3-Inch POS
              </button>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>

            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setPreviewInvoice(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet (Krishna Jewellers Tax Invoice) */}
        <div className={`p-6 overflow-y-auto bg-white text-slate-950 rounded-b-2xl font-sans text-xs ${
          printFormat === 'A4' ? 'print-format-a4' : printFormat === 'A5' ? 'print-format-a5' : 'print-format-thermal'
        }`}>
          <div className="border border-slate-300 p-5 rounded-lg space-y-4">
            {/* Top Slogan & BIS Hallmark Header */}
            <div className="text-center border-b border-slate-300 pb-3">
              <p className="font-serif font-bold text-slate-700 tracking-widest text-xs">|| SHUBH LABH ||</p>
              <h1 className="text-2xl font-serif font-black tracking-wider text-slate-900 mt-0.5">
                {activeFirm.name}
              </h1>
              <p className="text-xs font-semibold text-amber-700 tracking-wide">{activeFirm.tagline}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {activeFirm.address}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-slate-700 mt-1">
                <span>GSTIN: <strong className="font-mono">{activeFirm.gstin}</strong></span>
                <span>•</span>
                <span>PAN: <strong className="font-mono">{activeFirm.pan}</strong></span>
                <span>•</span>
                <span>REG NO: <strong className="font-mono">{activeFirm.regNo}</strong></span>
                <span>•</span>
                <span>Phone: {activeFirm.phone}</span>
              </div>
            </div>

            {/* Invoice Metadata & Customer Information Strip */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">BILLED TO (CUSTOMER DETAILS):</p>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{previewInvoice.customerName}</p>
                <p className="text-slate-600">{previewInvoice.customerAddress || 'Pune, Maharashtra'}</p>
                <p className="text-slate-600">Mobile: <strong className="font-mono">{previewInvoice.customerPhone || 'N/A'}</strong></p>
                <p className="text-slate-500 text-[11px]">Salesperson: {previewInvoice.salesperson || 'Mansi Anil'}</p>
              </div>

              <div className="text-right">
                <span className="inline-block bg-slate-100 border border-slate-300 text-slate-800 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">
                  GST TAX INVOICE / GOLD SELL
                </span>
                <p className="font-mono font-bold text-base text-slate-900 mt-1">
                  INVOICE NO: {previewInvoice.invoiceNo}
                </p>
                <p className="text-slate-600 text-xs">Date: <strong className="font-mono">{previewInvoice.date}</strong></p>
                <p className="text-slate-500 text-[11px]">Place of Supply: Maharashtra (27)</p>
              </div>
            </div>

            {/* Itemized Table (Matching Audit columns) */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-2 border-r border-slate-300">SR</th>
                    <th className="py-2 px-2 border-r border-slate-300">PROD ID</th>
                    <th className="py-2 px-2 border-r border-slate-300">DESCRIPTION</th>
                    <th className="py-2 px-2 border-r border-slate-300">HSN</th>
                    <th className="py-2 px-2 border-r border-slate-300">PURITY</th>
                    <th className="py-2 px-2 border-r border-slate-300 text-right">GS WT</th>
                    <th className="py-2 px-2 border-r border-slate-300 text-right">NT WT</th>
                    <th className="py-2 px-2 border-r border-slate-300 text-right">RATE/10GM</th>
                    <th className="py-2 px-2 border-r border-slate-300 text-right">LABOUR</th>
                    <th className="py-2 px-2 text-right">FINAL AMT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {(previewInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 border-r border-slate-300">{idx + 1}</td>
                      <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900">{item.itemCode}</td>
                      <td className="py-2 px-2 border-r border-slate-300 font-sans">{item.description}</td>
                      <td className="py-2 px-2 border-r border-slate-300">{item.hsn || '7113'}</td>
                      <td className="py-2 px-2 border-r border-slate-300">{item.purityKarat || item.purity || '92%'}</td>
                      <td className="py-2 px-2 border-r border-slate-300 text-right">{item.grossWeight?.toFixed(3)} GM</td>
                      <td className="py-2 px-2 border-r border-slate-300 text-right font-bold">{item.netWeight?.toFixed(3)} GM</td>
                      <td className="py-2 px-2 border-r border-slate-300 text-right">₹{Math.round(item.ratePer10Gm || item.rate || (item.ratePerGram ? item.ratePerGram * 10 : 72000)).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 border-r border-slate-300 text-right">₹{Math.round(item.totalMakingCharges || item.labour || item.makingChargeValue || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">
                        ₹{(item.finalValue || item.finalAmount || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Old Metal Exchange & Split Payment Box (Audit 10:40) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Left Column: Received Breakdown */}
              <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 space-y-1.5 font-mono text-xs">
                <p className="font-bold font-sans text-[11px] uppercase text-slate-700 pb-1 border-b border-slate-200">
                  PAYMENT MODES RECEIVED:
                </p>
                <div className="flex justify-between">
                  <span>CASH:</span>
                  <span className="font-bold">₹{(previewInvoice.payments?.cash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>CHEQUE / BANK:</span>
                  <span className="font-bold">₹{(previewInvoice.payments?.cheque || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>DEBIT / CC CARD:</span>
                  <span className="font-bold">₹{(previewInvoice.payments?.card || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>ONLINE / UPI:</span>
                  <span className="font-bold">₹{(previewInvoice.payments?.online || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {previewInvoice.payments?.loyaltyRedeemed > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>LOYALTY DISCOUNT:</span>
                    <span>₹{previewInvoice.payments.loyaltyRedeemed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {previewInvoice.payments?.balanceUdhaarDue > 0 && (
                  <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-slate-200">
                    <span>BALANCE DUE (UDHAAR):</span>
                    <span>₹{previewInvoice.payments.balanceUdhaarDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Tax Breakdown & Grand Total */}
              <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>TAXABLE AMOUNT:</span>
                  <span>₹{(previewInvoice.taxableAmount || 62135.92).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>CGST @ 1.5%:</span>
                  <span>₹{(previewInvoice.cgst || 932.04).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>SGST @ 1.5%:</span>
                  <span>₹{(previewInvoice.sgst || 932.04).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300 text-sm">
                  <span>TOTAL INVOICE AMOUNT:</span>
                  <span>₹{(previewInvoice.totalInvoiceAmount || 64868.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="p-2 bg-slate-100 rounded border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">AMOUNT IN WORDS: </span>
              <span className="italic font-serif font-bold text-slate-900">
                {previewInvoice.payableInWords || numberToWordsIndian(previewInvoice.totalInvoiceAmount)}
              </span>
            </div>

            {/* Bank Details & QR Code */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600 border-t border-slate-200">
              <div className="col-span-2">
                <p className="font-bold text-slate-800">BANK ACCOUNT DETAILS FOR NEFT/RTGS:</p>
                <p>Bank Name: {activeFirm.bankName} • Branch: {activeFirm.branch}</p>
                <p>A/C No: <strong className="font-mono text-slate-900">{activeFirm.accountNumber}</strong> • IFSC: <strong className="font-mono text-slate-900">{activeFirm.ifscCode}</strong></p>
                <p className="text-[10px] text-slate-500 mt-1">{activeFirm.footerInfo}</p>
              </div>
              <div className="text-right flex flex-col items-end justify-center">
                <div className="w-16 h-16 bg-slate-950 p-1 rounded flex items-center justify-center text-white">
                  <QrCode className="w-14 h-14" />
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">UPI ID: {activeFirm.upiId}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-300 text-xs">
              <div className="text-center">
                <div className="h-10"></div>
                <p className="font-bold text-slate-700 border-t border-slate-400 pt-1">Customer's Signature</p>
              </div>
              <div className="text-center">
                <div className="h-10 flex items-center justify-center italic text-amber-800 font-serif font-bold">
                  {activeFirm.name} Signatory
                </div>
                <p className="font-bold text-slate-700 border-t border-slate-400 pt-1">Authorized Signatory</p>
              </div>
            </div>

            {/* DIWALI / FESTIVAL MARKETING BANNER (Jewellery OS Invoice Format) */}
            <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-900 via-yellow-800 to-amber-950 text-amber-100 p-4 text-center border-2 border-amber-600 shadow-md">
              <div className="flex items-center justify-center space-x-2 text-yellow-300 font-serif font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>✨ {activeFirm.diwaliBannerText} ✨</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-amber-200/90 mt-1 font-serif italic">
                "Unique, Brilliant and Beautiful Just Like You — Certified BIS Hallmark 100% Purity Guaranteed"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
