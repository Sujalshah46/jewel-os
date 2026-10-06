import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Tag,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Percent,
  Coins,
  Scale,
  Sparkles,
  ShieldCheck,
  Edit2,
  Trash2
} from 'lucide-react';

export default function AdminCatalogueTab() {
  const {
    catalogueSettings,
    updateCatalogueSettings
  } = useJewellery();

  const [categories, setCategories] = useState(catalogueSettings.categories || []);
  const [metalPurities, setMetalPurities] = useState(catalogueSettings.metalPurities || []);
  const [hallmarkCharge, setHallmarkCharge] = useState(catalogueSettings.hallmarkChargePerPiece || 45.0);
  const [taxPercent, setTaxPercent] = useState(catalogueSettings.taxGstPercent || 3.0);
  const [barcodePrefix, setBarcodePrefix] = useState(catalogueSettings.barcodePrefix || 'JOS');

  const [newCatName, setNewCatName] = useState('');
  const [newCatHsn, setNewCatHsn] = useState('71131910');
  const [newCatWastage, setNewCatWastage] = useState(3.5);

  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveAll = (e) => {
    e.preventDefault();
    updateCatalogueSettings({
      categories,
      metalPurities,
      hallmarkChargePerPiece: Number(hallmarkCharge),
      taxGstPercent: Number(taxPercent),
      barcodePrefix
    });
    setSuccessMsg('Catalogue pricing rules and master configurations saved successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: 'CAT-' + (categories.length + 1),
      name: newCatName.trim(),
      defaultWastagePercent: Number(newCatWastage) || 3.0,
      hsnCode: newCatHsn.trim() || '71131910'
    };
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setSuccessMsg(`Added category "${newCat.name}". Click Save to persist.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveCategory = (catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              JEWELLERY CATALOGUE & PRICING RULES
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure ornament categories, metal purity standards, default wastage tolerances, BIS Hallmark fees, and GST tax rules.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>SAVE CATALOGUE RULES</span>
        </button>
      </div>

      {/* Global Statutory & Pricing Constants */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Coins className="w-4 h-4" /> 1. Statutory Fees & Pricing Computation Standards
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              BIS HALLMARK CHARGE PER PIECE (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={hallmarkCharge}
                onChange={(e) => setHallmarkCharge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Govt. standard ₹45.00 (+3% GST = ₹46.35)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              JEWELLERY GST TAX RATE (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              CGST 1.5% + SGST 1.5% = 3.0% Standard
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              BARCODE / SKU PREFIX
            </label>
            <input
              type="text"
              value={barcodePrefix}
              onChange={(e) => setBarcodePrefix(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Prepended on thermal barcode stickers
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              PRIMARY WEIGHT UNIT
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none"
            >
              <option value="g">Grams (g - 3 Decimals)</option>
              <option value="tola">Tola (11.664g)</option>
              <option value="mg">Milligrams (mg)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Precision: 0.001g (3 decimal places)
            </span>
          </div>
        </div>
      </div>

      {/* Ornament Categories Management */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> 2. Ornament Categories & Default Wastage Rules ({categories.length})
        </h3>

        {/* Quick Add Form */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-3 text-xs">
          <input
            type="text"
            placeholder="New Category Name (e.g. Bridal Chokers)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            placeholder="HSN Code (71131910)"
            value={newCatHsn}
            onChange={(e) => setNewCatHsn(e.target.value)}
            className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Wastage %:</span>
            <input
              type="number"
              step="0.1"
              value={newCatWastage}
              onChange={(e) => setNewCatWastage(e.target.value)}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-center"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
            >
              <div>
                <p className="font-bold text-slate-200">{cat.name}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">HSN: {cat.hsnCode}</p>
                <span className="text-[10px] text-amber-300 font-medium">
                  Default Wastage: {cat.defaultWastagePercent}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat.id)}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Remove Category"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Metal Purity Masters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Scale className="w-4 h-4" /> 3. Metal Purity & Karat Calculation Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Metal</th>
                <th className="py-2.5 px-3">Karat Label</th>
                <th className="py-2.5 px-3">Fine Purity %</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {metalPurities.map(p => (
                <tr key={p.code} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-amber-300">{p.code}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans">{p.metal}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-100">{p.karat}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{p.purityPercent}%</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
