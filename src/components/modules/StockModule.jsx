import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  Eye,
  Trash2,
  Tag,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle,
  QrCode,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';
import { calculateJewelleryItem } from '../../utils/calculations';

export default function StockModule() {
  const {
    stock,
    addStockItem,
    deleteStockItem,
    activeFirm,
    dailyRates,
    setActiveModule,
    analytics
  } = useJewellery();

  const [activeStockTab, setActiveStockTab] = useState('FINE JEWELLERY');
  const [stockMode, setStockMode] = useState('RETAIL STOCK'); // 'RETAIL STOCK' or 'WHOLESALE STOCK'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMetal, setSelectedMetal] = useState('ALL');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [inspectItem, setInspectItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Initial calculation helper for clean opening state
  const initialGw = 6.500;
  const initialLw = 0.100;
  const initialRate = 6600.24;
  const initialPurity = 91.67;
  const initialMaking = 550;
  const initialCalc = calculateJewelleryItem({
    grossWeight: initialGw,
    lessWeight: initialLw,
    purityPercent: initialPurity,
    ratePerGram: initialRate,
    makingChargeType: 'per_gram',
    makingChargeValue: initialMaking,
    hallmarkCharge: 45,
    stoneValue: 0
  });

  // Add Stock Form State with authoritative calculation initialized (Resolves Audit P0)
  const [newItemForm, setNewItemForm] = useState({
    itemCode: '',
    barcode: '',
    metalType: 'Gold',
    stockType: 'Fine Jewellery',
    category: 'Ring',
    subCategory: '',
    huid: '',
    purityKarat: '22K (BIS 916)',
    purityPercent: initialPurity,
    grossWeight: initialGw,
    lessWeight: initialLw,
    netWeight: initialCalc.netWeight,
    wastagePercent: 5.00,
    fineWeight: initialCalc.fineWeight,
    ratePerGram: initialRate,
    makingChargeType: 'per_gram',
    makingChargeValue: initialMaking,
    otherCharges: 0,
    hallmarkCharge: 45,
    diamondCarats: 0,
    diamondRate: 0,
    stoneValue: 0,
    totalPrice: initialCalc.finalValue,
    qty: 1,
    counter: 'Counter 1 (Gold Ornaments)',
    brand: 'Krishna Signature',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&auto=format&fit=crop&q=80'
  });

  const [formValidationErrors, setFormValidationErrors] = useState({});

  const stockTabs = [
    'FINE JEWELLERY',
    'IMITATION JEWELLERY',
    'RAW METAL STOCK',
    'STONE STOCK',
    'STOCK TALLY',
    'RE-ORDER LIST'
  ];

  // Recalculate weights and totals on form input
  const handleFormChange = (field, val) => {
    setNewItemForm(prev => {
      const updated = { ...prev, [field]: val };
      
      const gw = field === 'grossWeight' ? Number(val) : Number(updated.grossWeight);
      const lw = field === 'lessWeight' ? Number(val) : Number(updated.lessWeight);
      const purity = field === 'purityPercent' ? Number(val) : Number(updated.purityPercent);
      const rate = field === 'ratePerGram' ? Number(val) : Number(updated.ratePerGram);
      const making = field === 'makingChargeValue' ? Number(val) : Number(updated.makingChargeValue);

      const calc = calculateJewelleryItem({
        grossWeight: gw,
        lessWeight: lw,
        purityPercent: purity,
        ratePerGram: rate,
        makingChargeType: updated.makingChargeType,
        makingChargeValue: making,
        hallmarkCharge: updated.hallmarkCharge,
        stoneValue: updated.stoneValue
      });

      return {
        ...updated,
        netWeight: calc.netWeight,
        fineWeight: calc.fineWeight,
        totalPrice: calc.finalValue
      };
    });

    if (formValidationErrors[field]) {
      setFormValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOpenAddStockModal = () => {
    // Generate fresh SKU / barcode recommendation
    const gold22kRate = dailyRates.find(r => r.karat?.includes('22K'))?.ratePerGram || 6600.24;
    const calc = calculateJewelleryItem({
      grossWeight: 6.500,
      lessWeight: 0.100,
      purityPercent: 91.67,
      ratePerGram: gold22kRate,
      makingChargeType: 'per_gram',
      makingChargeValue: 550,
      hallmarkCharge: 45,
      stoneValue: 0
    });

    setNewItemForm({
      itemCode: 'LRING' + Math.floor(10 + Math.random() * 90),
      barcode: String(Math.floor(1000 + Math.random() * 9000)),
      metalType: 'Gold',
      stockType: 'Fine Jewellery',
      category: 'Ring',
      subCategory: 'Ladies Gold Ring',
      huid: 'HD' + Math.floor(100000 + Math.random() * 900000),
      purityKarat: '22K (BIS 916)',
      purityPercent: 91.67,
      grossWeight: 6.500,
      lessWeight: 0.100,
      netWeight: calc.netWeight,
      wastagePercent: 5.00,
      fineWeight: calc.fineWeight,
      ratePerGram: gold22kRate,
      makingChargeType: 'per_gram',
      makingChargeValue: 550,
      otherCharges: 0,
      hallmarkCharge: 45,
      diamondCarats: 0,
      diamondRate: 0,
      stoneValue: 0,
      totalPrice: calc.finalValue,
      qty: 1,
      counter: 'Counter 1 (Gold Ornaments)',
      brand: 'Krishna Signature',
      gender: 'Female',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&auto=format&fit=crop&q=80'
    });
    setFormValidationErrors({});
    setShowAddStockModal(true);
  };

  const handleAddStockSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newItemForm.itemCode.trim()) errors.itemCode = 'Product Code is required';
    if (!newItemForm.grossWeight || Number(newItemForm.grossWeight) <= 0) errors.grossWeight = 'Valid gross weight is required';
    if (!newItemForm.category) errors.category = 'Category is required';

    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    addStockItem(newItemForm);
    setShowAddStockModal(false);
  };

  // Filtered Stock Items
  const filteredStock = stock.filter(item => {
    const matchesSearch = item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.huid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesMetal = selectedMetal === 'ALL' || item.metalType === selectedMetal;
    return matchesSearch && matchesCategory && matchesMetal;
  });

  // Helper to sanitize CSV cells against formula injection (SEC-04)
  const sanitizeCsvCell = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Prefix single quote if starts with formula trigger characters
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  // Export to CSV simulation with SEC-04 formula injection protection
  const handleExportExcel = () => {
    const headers = ["SRNO","FIRM","METAL","ITEM CODE","BARCODE","CATEGORY","DESC","QTY","GROSS WT","NET WT","PURITY","FINE WT","RATE/GM","MAKING","TOTAL PRICE"];
    const rows = filteredStock.map((s, idx) => [
      sanitizeCsvCell(idx + 1),
      sanitizeCsvCell(s.firmCode),
      sanitizeCsvCell(s.metalType),
      sanitizeCsvCell(s.itemCode),
      sanitizeCsvCell(s.barcode),
      sanitizeCsvCell(s.category),
      sanitizeCsvCell(s.subCategory),
      sanitizeCsvCell(s.qty),
      sanitizeCsvCell(s.grossWeight),
      sanitizeCsvCell(s.netWeight),
      sanitizeCsvCell(`${s.purityPercent}%`),
      sanitizeCsvCell(s.fineWeight),
      sanitizeCsvCell(s.ratePerGram),
      sanitizeCsvCell(s.makingChargeValue),
      sanitizeCsvCell(s.totalPrice)
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gold_Silver_Stock_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <Package className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              STOCK & INVENTORY MANAGEMENT
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Firm: <strong className="text-slate-200">{activeFirm.name}</strong> • Real-time Gold & Silver Stock Register
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-xl flex">
            <button
              onClick={() => setStockMode('RETAIL STOCK')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                stockMode === 'RETAIL STOCK' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              RETAIL STOCK
            </button>
            <button
              onClick={() => setStockMode('WHOLESALE STOCK')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                stockMode === 'WHOLESALE STOCK' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              WHOLESALE STOCK
            </button>
          </div>

          <button
            onClick={handleOpenAddStockModal}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD NEW STOCK</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {stockTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveStockTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeStockTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stock Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Code, Barcode (1201), HUID, Item..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={selectedMetal}
            onChange={(e) => setSelectedMetal(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">All Metals (Gold / Silver)</option>
            <option value="Gold">Gold Only</option>
            <option value="Silver">Silver Only</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Ring">Rings</option>
            <option value="Earring">Earrings</option>
            <option value="Necklace">Necklaces</option>
            <option value="Bangles">Bangles</option>
            <option value="Anklet / Payal">Payal / Anklets</option>
            <option value="Bullion Bar">Bullion Bars & Coins</option>
          </select>
        </div>

        {/* Action Toolbar & Results Count */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-mono hidden sm:inline">
            Showing <strong className="text-slate-200">{filteredStock.length}</strong> of {stock.length} items
          </span>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* STOCK INVENTORY TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 font-mono whitespace-nowrap">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Code / Barcode</th>
                <th className="py-3 px-3">Metal / Karat</th>
                <th className="py-3 px-3">Category & Name</th>
                <th className="py-3 px-3">BIS HUID</th>
                <th className="py-3 px-3 text-right">Gross Wt (g)</th>
                <th className="py-3 px-3 text-right">Net Wt (g)</th>
                <th className="py-3 px-3 text-right">Fine Wt (g)</th>
                <th className="py-3 px-3 text-right">Making (₹)</th>
                <th className="py-3 px-3 text-right">Calculated Total</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-xs">
              {filteredStock.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <img
                      src={item.image}
                      alt={item.itemCode}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-700 shadow"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-amber-300 font-mono">{item.itemCode}</p>
                    <p className="text-[10px] text-slate-400 font-mono">BCD: {item.barcode}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-200">{item.metalType}</p>
                    <p className="text-[10px] text-amber-400/90">{item.purityKarat}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-100">{item.category}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.subCategory}</p>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">{item.huid}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-100 text-right">{item.grossWeight.toFixed(3)}g</td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-200 text-right">{item.netWeight.toFixed(3)}g</td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold text-right">{item.fineWeight.toFixed(3)}g</td>
                  <td className="py-3 px-3 font-mono text-slate-300 text-right">
                    ₹{item.makingChargeValue} {item.makingChargeType === 'per_gram' ? '/g' : 'fix'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-100 text-right">
                    {formatCurrency(item.totalPrice)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'In Stock'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => setInspectItem(item)}
                        title="View Full Details"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveModule('tags');
                        }}
                        title="Print Jewellery Tag"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setItemToDelete(item)}
                        title="Delete Item"
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD JEWELLERY RETAIL STOCK MODAL (Audit Sizing & Logical Grouping Fix) */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif font-bold text-base md:text-lg text-slate-100 uppercase tracking-wider">
                    Add Jewellery Inventory Stock
                  </h3>
                  <p className="text-xs text-slate-400">Opening Stock Entry & Barcode Generation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable with 3 clear logical sections */}
            <form onSubmit={handleAddStockSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 text-xs">
              {/* SECTION 1: Product & Classification */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">1</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    Product Identification & Category
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Product SKU / Code *</label>
                    <input
                      type="text"
                      value={newItemForm.itemCode}
                      onChange={(e) => handleFormChange('itemCode', e.target.value)}
                      className={`w-full bg-slate-950 border ${formValidationErrors.itemCode ? 'border-rose-500' : 'border-slate-700'} focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-amber-300 font-mono font-bold`}
                      placeholder="e.g. LRING44"
                      required
                    />
                    {formValidationErrors.itemCode && <p className="text-[10px] text-rose-400 mt-0.5">{formValidationErrors.itemCode}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Barcode Number</label>
                    <input
                      type="text"
                      value={newItemForm.barcode}
                      onChange={(e) => handleFormChange('barcode', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono"
                      placeholder="e.g. 1205"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Metal Type *</label>
                    <select
                      value={newItemForm.metalType}
                      onChange={(e) => handleFormChange('metalType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold"
                    >
                      <option value="Gold">Gold (सोना)</option>
                      <option value="Silver">Silver (चांदी)</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purity / Karat *</label>
                    <select
                      value={newItemForm.purityKarat}
                      onChange={(e) => {
                        const val = e.target.value;
                        let p = 91.67;
                        let r = 6600.24;
                        if (val.includes('24K')) { p = 100; r = 7200; }
                        if (val.includes('18K')) { p = 75; r = 5400; }
                        if (val.includes('14K')) { p = 58.33; r = 4199.76; }
                        if (val.includes('925')) { p = 92.5; r = 79.55; }
                        setNewItemForm(prev => {
                          const updated = {
                            ...prev,
                            purityKarat: val,
                            purityPercent: p,
                            ratePerGram: r
                          };
                          const calc = calculateJewelleryItem({
                            grossWeight: updated.grossWeight,
                            lessWeight: updated.lessWeight,
                            purityPercent: p,
                            ratePerGram: r,
                            makingChargeType: updated.makingChargeType,
                            makingChargeValue: updated.makingChargeValue,
                            hallmarkCharge: updated.hallmarkCharge,
                            stoneValue: updated.stoneValue
                          });
                          return {
                            ...updated,
                            netWeight: calc.netWeight,
                            fineWeight: calc.fineWeight,
                            totalPrice: calc.finalValue
                          };
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold"
                    >
                      <option value="22K (BIS 916)">22K (BIS 916 Hallmark)</option>
                      <option value="24K">24K (Pure Gold)</option>
                      <option value="18K (BIS 750)">18K (BIS 750 Hallmark)</option>
                      <option value="14K (BIS 585)">14K (BIS 585)</option>
                      <option value="Sterling 925">Sterling 925 (Silver)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                    <select
                      value={newItemForm.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold"
                    >
                      <option value="Ring">Ring (अंगूठी)</option>
                      <option value="Earring">Earring (झुमका/बाली)</option>
                      <option value="Necklace">Necklace / Choker (हार)</option>
                      <option value="Bangles">Bangles / Kangan (कंगन)</option>
                      <option value="Mangalsutra">Mangalsutra (मंगलसूत्र)</option>
                      <option value="Chain">Chain (चेन)</option>
                      <option value="Anklet / Payal">Payal (पायल)</option>
                      <option value="Bullion Bar">Coin / Bar (सिक्का/बार)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Sub-Category / Ornament</label>
                    <input
                      type="text"
                      value={newItemForm.subCategory}
                      onChange={(e) => handleFormChange('subCategory', e.target.value)}
                      placeholder="e.g. Ladies Designer Ring"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">BIS HUID Number</label>
                    <input
                      type="text"
                      value={newItemForm.huid}
                      onChange={(e) => handleFormChange('huid', e.target.value.toUpperCase())}
                      placeholder="e.g. HD102934"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Counter Location</label>
                    <input
                      type="text"
                      value={newItemForm.counter}
                      onChange={(e) => handleFormChange('counter', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Weight & Purity Calculations */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">2</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    Weights & Purity Analysis
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gross Weight (g) *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newItemForm.grossWeight}
                      onChange={(e) => handleFormChange('grossWeight', e.target.value)}
                      className={`w-full bg-slate-950 border ${formValidationErrors.grossWeight ? 'border-rose-500' : 'border-slate-700'} focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono font-bold`}
                      required
                    />
                    {formValidationErrors.grossWeight && <p className="text-[10px] text-rose-400 mt-0.5">{formValidationErrors.grossWeight}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Less / Stone Wt (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newItemForm.lessWeight}
                      onChange={(e) => handleFormChange('lessWeight', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Net Weight (Auto Calc)</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-amber-300 font-mono font-bold">
                      {newItemForm.netWeight.toFixed(3)}g
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Fine Pure Weight (Auto Calc)</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-emerald-400 font-mono font-bold">
                      {newItemForm.fineWeight.toFixed(3)}g
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Pricing & Making Charges */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">3</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    Pricing, Making & Total Valuation Preview
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rate per Gram (₹) *</label>
                    <input
                      type="number"
                      value={newItemForm.ratePerGram}
                      onChange={(e) => handleFormChange('ratePerGram', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-amber-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Making Charges (₹/g)</label>
                    <input
                      type="number"
                      value={newItemForm.makingChargeValue}
                      onChange={(e) => handleFormChange('makingChargeValue', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Stone / Diamond Val (₹)</label>
                    <input
                      type="number"
                      value={newItemForm.stoneValue}
                      onChange={(e) => handleFormChange('stoneValue', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Hallmark Charge (₹)</label>
                    <input
                      type="number"
                      value={newItemForm.hallmarkCharge}
                      onChange={(e) => handleFormChange('hallmarkCharge', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 font-mono"
                    />
                  </div>

                  {/* Calculated Total Live Preview (Resolves Audit P0) */}
                  <div className="sm:col-span-2 md:col-span-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                        Calculated Retail Value (With 3% GST):
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Authoritative calculation based on Net Wt ({newItemForm.netWeight.toFixed(3)}g) × Rate (₹{newItemForm.ratePerGram}) + Making + GST.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-bold font-mono text-amber-200">
                        {formatCurrency(newItemForm.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  SAVE & ADD STOCK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Delete Stock Item?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              <p>Item Code: <strong className="text-amber-300 font-mono">{itemToDelete.itemCode}</strong></p>
              <p>Description: {itemToDelete.subCategory}</p>
              <p>Total Value: <strong className="text-slate-100 font-mono">{formatCurrency(itemToDelete.totalPrice)}</strong></p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStockItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Inspection Detail Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-slate-100">Item Specification: {inspectItem.itemCode}</h3>
              </div>
              <button onClick={() => setInspectItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <img
                src={inspectItem.image}
                alt={inspectItem.itemCode}
                className="w-24 h-24 object-cover rounded-xl border border-slate-700 shadow"
              />
              <div className="text-xs space-y-1">
                <p className="text-base font-bold text-amber-300">{inspectItem.category} - {inspectItem.subCategory}</p>
                <p className="text-slate-400">Barcode: <span className="font-mono text-slate-200">{inspectItem.barcode}</span></p>
                <p className="text-slate-400">BIS HUID: <span className="font-mono text-slate-200">{inspectItem.huid}</span></p>
                <p className="text-slate-400">Counter: <span className="text-slate-200">{inspectItem.counter}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div>Gross Weight: <strong className="text-slate-100">{inspectItem.grossWeight.toFixed(3)}g</strong></div>
              <div>Less Weight: <strong className="text-slate-100">{inspectItem.lessWeight.toFixed(3)}g</strong></div>
              <div>Net Weight: <strong className="text-amber-200">{inspectItem.netWeight.toFixed(3)}g</strong></div>
              <div>Fine Weight: <strong className="text-emerald-400">{inspectItem.fineWeight.toFixed(3)}g</strong></div>
              <div>Rate / g: <strong className="text-slate-100">₹{inspectItem.ratePerGram}</strong></div>
              <div>Making / g: <strong className="text-slate-100">₹{inspectItem.makingChargeValue}</strong></div>
              <div className="col-span-2 pt-2 border-t border-slate-800 flex justify-between text-sm">
                <span>Calculated Retail Val:</span>
                <span className="font-bold text-amber-300">{formatCurrency(inspectItem.totalPrice)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
