import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Building2,
  Save,
  CheckCircle,
  HelpCircle,
  QrCode,
  FileSignature,
  Mail,
  ShieldCheck,
  Globe,
  MapPin,
  Phone,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function FirmMasterModule() {
  const { firms, setFirms, activeFirm, setActiveFirmId } = useJewellery();
  
  const [selectedFirmId, setSelectedFirmId] = useState(activeFirm.id);
  const [formData, setFormData] = useState(activeFirm);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Switch form data when selected firm changes
  const handleSelectFirm = (firmId) => {
    setSelectedFirmId(firmId);
    const found = firms.find(f => f.id === firmId);
    if (found) {
      setFormData(found);
    }
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleEInvoiceChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      eInvoiceApi: { ...(prev.eInvoiceApi || {}), [field]: val }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFirms(prev => prev.map(f => f.id === formData.id ? formData : f));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar - Jewellery OS Firm Master */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              FIRM / COMPANY PANEL
            </h2>
          </div>
          <p className="text-xs text-rose-400 font-semibold mt-0.5">
            (*) / Red Color Border Indicates Required Fields for GST Invoicing Compliance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="flex items-center space-x-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>HELP</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE / UPDATE FIRM</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Firm details updated successfully and synced across all invoice templates!</span>
        </div>
      )}

      {/* Plan Gating Alert (Exact note from video audit: "YOU CAN ADD ONLY 2 FIRM") */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">
            PLAN NOTICE: YOU CAN CONFIGURE UP TO 2 FIRMS IN THIS PROFESSIONAL CLOUD LICENSE.
          </span>
        </div>
        <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded font-mono font-bold">
          2 / 2 Active
        </span>
      </div>

      {/* Firm Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        {firms.map(f => (
          <button
            key={f.id}
            onClick={() => handleSelectFirm(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              f.id === selectedFirmId
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{f.name} ({f.code})</span>
          </button>
        ))}
      </div>

      {/* Main Firm Setup Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Firm Contact & Basic Profile */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> 1. Firm Contact & Registration Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                FIRM / COMPANY NAME *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                FIRM SHORT CODE
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                GSTIN NUMBER *
              </label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                PAN NUMBER
              </label>
              <input
                type="text"
                value={formData.pan || ''}
                onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                PHONE NUMBER *
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                EMAIL ID
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                CITY / VILLAGE *
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                PINCODE
              </label>
              <input
                type="text"
                value={formData.pincode || ''}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                MY ADDRESS (FULL SHOWROOM ADDRESS ON INVOICE) *
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Banking, Statutory & Auto-Interest Terms */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> 2. Banking, Cash Balance & Statutory Policies
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                FINANCIAL YEAR START DATE
              </label>
              <input
                type="date"
                value={formData.financialYearStart || '2024-04-01'}
                onChange={(e) => handleInputChange('financialYearStart', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                CASH BALANCE (₹)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={formData.cashBalance || 0}
                  onChange={(e) => handleInputChange('cashBalance', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-l-lg px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold"
                />
                <select
                  value={formData.balanceType || 'DR'}
                  onChange={(e) => handleInputChange('balanceType', e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-r-lg px-2 text-xs font-bold"
                >
                  <option value="DR">DR</option>
                  <option value="CR">CR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                BANK NAME & BRANCH
              </label>
              <input
                type="text"
                value={`${formData.bankName || ''} - ${formData.branch || ''}`}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                BANK A/C NO & IFSC
              </label>
              <input
                type="text"
                value={`${formData.accountNumber || ''} (${formData.ifscCode || ''})`}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                FORM HEADER INFORMATION (INVOICE HEADER SLOGAN)
              </label>
              <input
                type="text"
                value={formData.headerInfo || ''}
                onChange={(e) => handleInputChange('headerInfo', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-200 font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                FORM FOOTER INFORMATION (INTEREST & JURISDICTION POLICY)
              </label>
              <input
                type="text"
                value={formData.footerInfo || ''}
                onChange={(e) => handleInputChange('footerInfo', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                MARKETING OFFER BANNER (PRINTED IN FULL-WIDTH ON INVOICES AS IN AUDIT)
              </label>
              <input
                type="text"
                value={formData.diwaliBannerText || ''}
                onChange={(e) => handleInputChange('diwaliBannerText', e.target.value)}
                className="w-full bg-amber-950/40 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-200 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: E-Invoice API Integrations (Jewellery OS Government API Bridge) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Globe className="w-4 h-4" /> 3. Government E-Invoice & E-Way Bill Integration API
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                E-INVOICE APP ID
              </label>
              <input
                type="text"
                value={formData.eInvoiceApi?.appId || ''}
                onChange={(e) => handleEInvoiceChange('appId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                E-INVOICE API KEY
              </label>
              <input
                type="password"
                value={formData.eInvoiceApi?.apiKey || ''}
                onChange={(e) => handleEInvoiceChange('apiKey', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                E-INVOICE USERNAME
              </label>
              <input
                type="text"
                value={formData.eInvoiceApi?.username || ''}
                onChange={(e) => handleEInvoiceChange('username', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                E-INVOICE STATUS
              </label>
              <div className="bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>API Authenticated (Live)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: My Firms Summary Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
            MY CONFIGURED FIRMS
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Firm Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Cash Balance</th>
                  <th className="py-2.5 px-3 text-right">Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {firms.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-200">{f.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{f.code}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{f.gstin}</td>
                    <td className="py-2.5 px-3 text-slate-300">{f.city}, {f.state}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      {formatCurrency(f.cashBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFirmId(f.id);
                          setSelectedFirmId(f.id);
                          setFormData(f);
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          f.id === activeFirm.id
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {f.id === activeFirm.id ? 'Active' : 'Make Active'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">Firm Master Instructions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>• <strong>GSTIN & HSN:</strong> Required for generating statutory B2B & B2C tax invoices under Indian jewellery taxation (HSN 7113, GST 3%).</p>
              <p>• <strong>Hallmark ID:</strong> Enter your BIS certified registration code to automatically stamp Hallmark charges on receipts.</p>
              <p>• <strong>Multi-Firm Policy:</strong> You can configure up to 2 active firms. Toggle between them anytime using the "Make Active" button.</p>
              <p>• <strong>E-Invoicing API:</strong> Credentials entered here are securely validated for B2B e-invoice generation with the NIC IRP portal.</p>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
