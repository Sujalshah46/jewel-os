import React, { useState, useMemo } from 'react';
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
  ChevronDown,
  Layers,
  Scale,
  Gem,
  Coins,
  ClipboardCheck,
  ShoppingCart,
  Send,
  Building,
  Check,
  RefreshCw,
  Box
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

  // Stock Tally Audit State
  const [tallyScannedBarcodes, setTallyScannedBarcodes] = useState(new Set(['1201', '1150', '1088']));
  const [tallyInputBarcode, setTallyInputBarcode] = useState('');
  const [tallyAuditCommitted, setTallyAuditCommitted] = useState(false);

  // Re-Order State
  const [reorderSuccessItem, setReorderSuccessItem] = useState(null);

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

  // Add Stock Form State
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
    wholesalePrice: Math.round(initialCalc.finalValue * 0.88),
    wholesaleMinLot: 5,
    reorderLevel: 2,
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
        totalPrice: updated.stockType === 'Imitation Jewellery' ? Number(updated.totalPrice) || 2500 : calc.finalValue,
        wholesalePrice: updated.wholesalePrice || Math.round(calc.finalValue * 0.88)
      };
    });

    if (formValidationErrors[field]) {
      setFormValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOpenAddStockModal = () => {
    // Generate fresh SKU / barcode recommendation adapted to current tab
    const gold22kRate = dailyRates.find(r => r.karat?.includes('22K'))?.ratePerGram || 6600.24;
    const rndNum = Math.floor(10 + Math.random() * 90);
    const rndBarcode = String(Math.floor(1000 + Math.random() * 9000));

    let defaultStockType = 'Fine Jewellery';
    let defaultMetal = 'Gold';
    let defaultCategory = 'Ring';
    let defaultSubCategory = '22K Hallmarked Gold Ladies Ring';
    let defaultHuid = 'HD' + Math.floor(100000 + Math.random() * 900000);
    let defaultGw = 6.500;
    let defaultPrice = 57872.00;
    let defaultCounter = 'Counter 1 (Gold Ornaments)';

    if (activeStockTab === 'IMITATION JEWELLERY') {
      defaultStockType = 'Imitation Jewellery';
      defaultMetal = 'Brass Alloy / 1-Gram Gold';
      defaultCategory = 'Necklace';
      defaultSubCategory = '1-Gram Micro Gold Plated Bridal Choker Set';
      defaultHuid = 'N/A (Fashion)';
      defaultGw = 65.000;
      defaultPrice = 4500.00;
      defaultCounter = 'Counter 6 (Fashion / 1-Gram Gold)';
    } else if (activeStockTab === 'RAW METAL STOCK') {
      defaultStockType = 'Raw Metal Stock';
      defaultMetal = 'Gold';
      defaultCategory = 'Bullion Bar';
      defaultSubCategory = '24K 999 Fine Gold Minted Bar 100 GM';
      defaultHuid = 'MINT' + Math.floor(10000 + Math.random() * 90000);
      defaultGw = 100.000;
      defaultPrice = 720545.00;
      defaultCounter = 'Vault / Bullion Counter';
    } else if (activeStockTab === 'STONE STOCK') {
      defaultStockType = 'Stone Stock';
      defaultMetal = 'Natural Diamond';
      defaultCategory = 'Loose Diamond';
      defaultSubCategory = '1.00 Ct Certified Solitaire Diamond (VVS1 / E Color)';
      defaultHuid = 'GIA-' + Math.floor(10000000 + Math.random() * 90000000);
      defaultGw = 0.200;
      defaultPrice = 165000.00;
      defaultCounter = 'Diamond Studio & Vault';
    }

    setNewItemForm({
      itemCode: (activeStockTab === 'IMITATION JEWELLERY' ? 'IM' : activeStockTab === 'STONE STOCK' ? 'DIA' : activeStockTab === 'RAW METAL STOCK' ? 'RAW' : 'LRING') + rndNum,
      barcode: rndBarcode,
      metalType: defaultMetal,
      stockType: defaultStockType,
      category: defaultCategory,
      subCategory: defaultSubCategory,
      huid: defaultHuid,
      purityKarat: defaultStockType === 'Fine Jewellery' ? '22K (BIS 916)' : defaultStockType === 'Raw Metal Stock' ? '24K (Fine 999)' : 'N/A',
      purityPercent: defaultStockType === 'Fine Jewellery' ? 91.67 : defaultStockType === 'Raw Metal Stock' ? 99.9 : 0,
      grossWeight: defaultGw,
      lessWeight: 0.000,
      netWeight: defaultGw,
      wastagePercent: defaultStockType === 'Fine Jewellery' ? 5.00 : 0,
      fineWeight: defaultStockType === 'Fine Jewellery' ? Number((defaultGw * 0.9167).toFixed(3)) : defaultGw,
      ratePerGram: defaultStockType === 'Fine Jewellery' ? gold22kRate : defaultStockType === 'Raw Metal Stock' ? 7200 : 0,
      makingChargeType: 'per_gram',
      makingChargeValue: defaultStockType === 'Fine Jewellery' ? 550 : 0,
      otherCharges: 0,
      hallmarkCharge: defaultStockType === 'Fine Jewellery' ? 45 : 0,
      diamondCarats: defaultStockType === 'Stone Stock' ? 1.00 : 0,
      diamondRate: defaultStockType === 'Stone Stock' ? 165000 : 0,
      stoneValue: defaultStockType === 'Stone Stock' ? 165000 : 0,
      totalPrice: defaultPrice,
      wholesalePrice: Math.round(defaultPrice * (stockMode === 'WHOLESALE STOCK' ? 0.85 : 0.88)),
      wholesaleMinLot: stockMode === 'WHOLESALE STOCK' ? 10 : 5,
      reorderLevel: 2,
      qty: stockMode === 'WHOLESALE STOCK' ? 10 : 1,
      counter: defaultCounter,
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

  // Base Filtered Stock Items (Multi-Firm Isolation: INV-02)
  const baseFilteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchesFirm = !item.firmCode || item.firmCode === activeFirm.code;
      const matchesSearch = item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.huid?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesMetal = selectedMetal === 'ALL' || item.metalType === selectedMetal;
      return matchesFirm && matchesSearch && matchesCategory && matchesMetal;
    });
  }, [stock, activeFirm, searchTerm, selectedCategory, selectedMetal]);

  // Tab-Specific Filtered Stock
  const filteredStock = useMemo(() => {
    return baseFilteredStock.filter(item => {
      if (activeStockTab === 'FINE JEWELLERY') {
        return !item.stockType || item.stockType === 'Fine Jewellery' || (item.purityKarat?.includes('K') || item.purityKarat?.includes('925'));
      }
      if (activeStockTab === 'IMITATION JEWELLERY') {
        return item.stockType === 'Imitation Jewellery' || item.metalType?.toLowerCase().includes('alloy') || item.purityKarat?.includes('Plated');
      }
      if (activeStockTab === 'RAW METAL STOCK') {
        return item.stockType === 'Raw Metal Stock' || item.category === 'Bullion Bar' || item.category === 'Scrap';
      }
      if (activeStockTab === 'STONE STOCK') {
        return item.stockType === 'Stone Stock' || item.category?.includes('Diamond') || item.category?.includes('Gemstone') || (item.diamondCarats && item.diamondCarats > 0);
      }
      if (activeStockTab === 'RE-ORDER LIST') {
        const threshold = item.reorderLevel || 2;
        return (item.qty || 1) <= threshold;
      }
      return true; // STOCK TALLY includes all stock
    });
  }, [baseFilteredStock, activeStockTab]);

  // Stock Tally Statistics
  const tallyStats = useMemo(() => {
    const totalItems = baseFilteredStock.length;
    const verifiedCount = baseFilteredStock.filter(item => tallyScannedBarcodes.has(item.barcode)).length;
    const uncountedCount = totalItems - verifiedCount;
    const totalBookWeight = baseFilteredStock.reduce((acc, i) => acc + (Number(i.grossWeight) || 0), 0);
    const verifiedWeight = baseFilteredStock
      .filter(item => tallyScannedBarcodes.has(item.barcode))
      .reduce((acc, i) => acc + (Number(i.grossWeight) || 0), 0);
    const weightVariance = verifiedWeight - totalBookWeight;

    return {
      totalItems,
      verifiedCount,
      uncountedCount,
      totalBookWeight: totalBookWeight.toFixed(3),
      verifiedWeight: verifiedWeight.toFixed(3),
      weightVariance: weightVariance.toFixed(3)
    };
  }, [baseFilteredStock, tallyScannedBarcodes]);

  // Handle Scanning Barcode in Tally
  const handleTallyScan = (e) => {
    e.preventDefault();
    if (!tallyInputBarcode.trim()) return;
    const found = baseFilteredStock.find(i => i.barcode === tallyInputBarcode.trim() || i.itemCode?.toLowerCase() === tallyInputBarcode.trim().toLowerCase());
    if (found) {
      setTallyScannedBarcodes(prev => new Set(prev).add(found.barcode));
      setTallyInputBarcode('');
    } else {
      alert(`Barcode "${tallyInputBarcode}" not found in current firm inventory.`);
    }
  };

  const handleVerifyAllTally = () => {
    const allBarcodes = baseFilteredStock.map(i => i.barcode).filter(Boolean);
    setTallyScannedBarcodes(new Set(allBarcodes));
  };

  // Handle Raising Re-order / Karigar PO
  const handleRaiseReorder = (item) => {
    setReorderSuccessItem(item);
    setTimeout(() => setReorderSuccessItem(null), 4000);
  };

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
    const headers = [
      "SRNO", "FIRM", "MODE", "TAB", "METAL", "ITEM CODE", "BARCODE",
      "CATEGORY", "DESC", "QTY", "GROSS WT", "NET WT", "PURITY",
      "FINE WT", "RATE/GM", "MAKING", "RETAIL PRICE", "WHOLESALE PRICE", "MIN LOT"
    ];
    const rows = filteredStock.map((s, idx) => [
      sanitizeCsvCell(idx + 1),
      sanitizeCsvCell(s.firmCode),
      sanitizeCsvCell(stockMode),
      sanitizeCsvCell(activeStockTab),
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
      sanitizeCsvCell(s.totalPrice),
      sanitizeCsvCell(s.wholesalePrice || Math.round(s.totalPrice * 0.88)),
      sanitizeCsvCell(s.wholesaleMinLot || 5)
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jewellery_OS_${activeStockTab.replace(/\s+/g, '_')}_${stockMode.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
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
              STOCK &amp; INVENTORY MANAGEMENT
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Firm: <strong className="text-slate-200">{activeFirm.name}</strong> • Real-time Gold &amp; Silver Stock Register
          </p>
        </div>

        <div className="no-print flex items-center space-x-2">
          {/* Mode Switcher: RETAIL vs WHOLESALE */}
          <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-xl flex shadow">
            <button
              type="button"
              onClick={() => setStockMode('RETAIL STOCK')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                stockMode === 'RETAIL STOCK'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              RETAIL STOCK
            </button>
            <button
              type="button"
              onClick={() => setStockMode('WHOLESALE STOCK')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                stockMode === 'WHOLESALE STOCK'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              WHOLESALE STOCK
            </button>
          </div>

          {/* ADD NEW STOCK Button */}
          <button
            type="button"
            onClick={handleOpenAddStockModal}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD NEW STOCK</span>
          </button>
        </div>
      </div>

      {/* Mode Indicator Banner when Wholesale is Active */}
      {stockMode === 'WHOLESALE STOCK' && (
        <div className="p-3.5 bg-amber-950/70 border border-amber-500/50 rounded-2xl text-amber-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <Building className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>B2B Wholesale Catalog Active:</strong> Showing trade lot prices, minimum order quantities (MOQ), and volume discounts for jewelers &amp; dealers.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-bold">
            Trade Mode
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="no-print flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {stockTabs.map(tab => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveStockTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeStockTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reorder Success Feedback */}
      {reorderSuccessItem && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center space-x-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>
            Karigar Manufacturing Work Order generated for <strong>{reorderSuccessItem.itemCode}</strong> ({reorderSuccessItem.subCategory})!
          </span>
        </div>
      )}

      {/* Stock Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Code, Barcode, HUID, Item..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={selectedMetal}
            onChange={(e) => setSelectedMetal(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">All Metals / Types</option>
            <option value="Gold">Gold Only</option>
            <option value="Silver">Silver Only</option>
            <option value="Natural Diamond">Diamond</option>
            <option value="Brass Alloy / 1-Gram Gold">1-Gram Gold</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-semibold focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Ring">Rings</option>
            <option value="Earring">Earrings</option>
            <option value="Necklace">Necklaces / Chokers</option>
            <option value="Bangles">Bangles &amp; Kadas</option>
            <option value="Anklet / Payal">Payal / Anklets</option>
            <option value="Bullion Bar">Bullion Bars &amp; Coins</option>
            <option value="Loose Diamond">Loose Diamonds</option>
            <option value="Precious Gemstone">Precious Gemstones</option>
          </select>
        </div>

        {/* Action Toolbar & Results Count */}
        <div className="no-print flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-mono hidden sm:inline">
            Showing <strong className="text-slate-200">{filteredStock.length}</strong> of {stock.length} items
          </span>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RAW METAL STOCK STATS CARDS                        */}
      {/* ========================================================= */}
      {activeStockTab === 'RAW METAL STOCK' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" /> Vault Bullion Weight
            </p>
            <p className="text-xl font-bold font-mono text-slate-100">1,100.000 GM</p>
            <p className="text-[11px] text-amber-400">100g 24K Gold Bar + 1,000g Fine Silver Bar</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" /> Pure Fine Weight
            </p>
            <p className="text-xl font-bold font-mono text-emerald-400">1,099.000 GM</p>
            <p className="text-[11px] text-slate-400">99.9% - 100% Certified Pure Assay</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-amber-300" /> Total Bullion Valuation
            </p>
            <p className="text-xl font-bold font-mono text-amber-300">₹8,06,845.00</p>
            <p className="text-[11px] text-slate-400">Vault Custody: Main Fireproof Safe A</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: STONE STOCK STATS CARDS                            */}
      {/* ========================================================= */}
      {activeStockTab === 'STONE STOCK' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Gem className="w-4 h-4 text-cyan-400" /> Loose Certified Diamonds
            </p>
            <p className="text-xl font-bold font-mono text-slate-100">3.50 CARATS</p>
            <p className="text-[11px] text-cyan-300">GIA Certified Solitaires (VVS1 / E Color)</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Precious Colored Gemstones
            </p>
            <p className="text-xl font-bold font-mono text-emerald-400">4.25 CARATS</p>
            <p className="text-[11px] text-slate-400">Zambian Emerald (Panna), Burmese Rubies</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-300" /> Total Stone Inventory Value
            </p>
            <p className="text-xl font-bold font-mono text-amber-300">₹3,28,500.00</p>
            <p className="text-[11px] text-slate-400">Available for Custom Ring / Choker Setting</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STOCK TALLY AUDIT WORKSPACE                        */}
      {/* ========================================================= */}
      {activeStockTab === 'STOCK TALLY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-400" /> Physical Inventory Tally Reconciliation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan trays or barcodes to verify physical stock against book balance.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleVerifyAllTally}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Verify All In Stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setTallyAuditCommitted(true);
                  setTimeout(() => setTallyAuditCommitted(false), 5000);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
              >
                Commit Audit Tally
              </button>
            </div>
          </div>

          {tallyAuditCommitted && (
            <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center space-x-2 shadow">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                Physical Stock Audit Tally finalized and logged in System Audit Register with zero discrepancies!
              </span>
            </div>
          )}

          {/* Audit KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400">Total Book Items</p>
              <p className="text-lg font-bold font-mono text-slate-100">{tallyStats.totalItems} Items</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-emerald-400">Physically Verified</p>
              <p className="text-lg font-bold font-mono text-emerald-400">{tallyStats.verifiedCount} Items</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-rose-400">Uncounted / Pending</p>
              <p className="text-lg font-bold font-mono text-rose-400">{tallyStats.uncountedCount} Items</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-amber-400">Weight Discrepancy</p>
              <p className="text-lg font-bold font-mono text-amber-300">{tallyStats.weightVariance} GM</p>
            </div>
          </div>

          {/* Barcode Scanner Input */}
          <form onSubmit={handleTallyScan} className="flex gap-2">
            <input
              type="text"
              placeholder="Scan or type barcode (e.g. 1201, 1150, 1104)..."
              value={tallyInputBarcode}
              onChange={(e) => setTallyInputBarcode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              Scan Barcode
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: RE-ORDER LIST ALERT BANNER                         */}
      {/* ========================================================= */}
      {activeStockTab === 'RE-ORDER LIST' && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-2xl text-rose-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Low Inventory Replenishment Alert:</strong> {filteredStock.length} items have reached or breached their minimum reorder safety threshold.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-bold">
            Restock Required
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN STOCK INVENTORY TABLE                                */}
      {/* ========================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 font-mono whitespace-nowrap">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Code / Barcode</th>
                <th className="py-3 px-3">Type / Metal</th>
                <th className="py-3 px-3">Category &amp; Description</th>
                <th className="py-3 px-3">BIS HUID / Cert</th>
                <th className="py-3 px-3 text-right">Gross Wt (g)</th>
                <th className="py-3 px-3 text-right">Net Wt (g)</th>
                <th className="py-3 px-3 text-right">Qty / Lot</th>
                <th className="py-3 px-3 text-right">
                  {stockMode === 'WHOLESALE STOCK' ? 'Wholesale Price' : 'Calculated Price'}
                </th>
                {stockMode === 'WHOLESALE STOCK' && (
                  <th className="py-3 px-3 text-right">Min Lot MOQ</th>
                )}
                {activeStockTab === 'STOCK TALLY' && (
                  <th className="py-3 px-3 text-center">Tally Status</th>
                )}
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-xs">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm">No inventory items found in this tab.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click <strong>ADD NEW STOCK</strong> to add items to {activeStockTab}.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStock.map((item, idx) => {
                  const isTallyVerified = tallyScannedBarcodes.has(item.barcode);
                  const isLowStock = (item.qty || 1) <= (item.reorderLevel || 2);

                  return (
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
                        <p className="text-[10px] text-amber-400/90">{item.purityKarat || item.stockType}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-100">{item.category}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{item.subCategory}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">{item.huid || '—'}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-100 text-right">
                        {item.grossWeight ? item.grossWeight.toFixed(3) + 'g' : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-200 text-right">
                        {item.netWeight ? item.netWeight.toFixed(3) + 'g' : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isLowStock
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-200'
                        }`}>
                          {item.qty || 1} {item.wholesaleMinLot ? 'pcs' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-100 text-right">
                        {stockMode === 'WHOLESALE STOCK'
                          ? formatCurrency(item.wholesalePrice || Math.round(item.totalPrice * 0.88))
                          : formatCurrency(item.totalPrice)}
                      </td>
                      {stockMode === 'WHOLESALE STOCK' && (
                        <td className="py-3 px-3 font-mono text-emerald-400 text-right font-bold">
                          {item.wholesaleMinLot || 5} Pcs Lot
                        </td>
                      )}
                      {activeStockTab === 'STOCK TALLY' && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setTallyScannedBarcodes(prev => {
                                const next = new Set(prev);
                                if (next.has(item.barcode)) next.delete(item.barcode);
                                else next.add(item.barcode);
                                return next;
                              });
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              isTallyVerified
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {isTallyVerified ? '✓ Verified' : '○ Pending'}
                          </button>
                        </td>
                      )}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Re-order action if on Re-order tab */}
                          {activeStockTab === 'RE-ORDER LIST' && (
                            <button
                              type="button"
                              onClick={() => handleRaiseReorder(item)}
                              title="Raise Karigar Work Order"
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" /> Reorder
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInspectItem(item)}
                            title="View Full Details"
                            aria-label={`View details for ${item.itemCode}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveModule('tags');
                            }}
                            title="Print Jewellery Tag"
                            aria-label={`Print jewellery tag for ${item.itemCode}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            title="Delete Item"
                            aria-label={`Delete item ${item.itemCode}`}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD JEWELLERY RETAIL / WHOLESALE STOCK MODAL              */}
      {/* ========================================================= */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif font-bold text-base md:text-lg text-slate-100 uppercase tracking-wider">
                    Add Inventory Item ({activeStockTab})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mode: <strong className="text-amber-400">{stockMode}</strong> • Opening Stock Entry &amp; Barcode Generation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStockSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 text-xs">
              {/* SECTION 1: Product & Classification */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">1</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    Product Identification &amp; Category
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
                    <label className="block text-slate-300 font-semibold mb-1">Stock Classification *</label>
                    <select
                      value={newItemForm.stockType}
                      onChange={(e) => handleFormChange('stockType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold"
                    >
                      <option value="Fine Jewellery">Fine Jewellery (Gold / Silver)</option>
                      <option value="Imitation Jewellery">Imitation / 1-Gram Gold</option>
                      <option value="Raw Metal Stock">Raw Metal Bullion (Vault)</option>
                      <option value="Stone Stock">Loose Stone / Diamond</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Metal / Material *</label>
                    <input
                      type="text"
                      value={newItemForm.metalType}
                      onChange={(e) => handleFormChange('metalType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold"
                      placeholder="e.g. Gold, Silver, Brass"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                    <input
                      type="text"
                      value={newItemForm.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold"
                      placeholder="Ring, Necklace, Bullion Bar"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Description / Subcategory</label>
                    <input
                      type="text"
                      value={newItemForm.subCategory}
                      onChange={(e) => handleFormChange('subCategory', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs"
                      placeholder="e.g. Ladies Floral Gold Ring"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">BIS HUID / Cert No</label>
                    <input
                      type="text"
                      value={newItemForm.huid}
                      onChange={(e) => handleFormChange('huid', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
                      placeholder="e.g. HD884391 or GIA-Cert"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Weights & Gold Rate */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">2</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    Weights, Purity &amp; Pricing
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gross Wt (g) *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newItemForm.grossWeight}
                      onChange={(e) => handleFormChange('grossWeight', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Less Wt (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newItemForm.lessWeight}
                      onChange={(e) => handleFormChange('lessWeight', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Net Wt (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newItemForm.netWeight}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-800 text-amber-300 rounded-lg px-3 py-2 text-xs font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rate / GM (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItemForm.ratePerGram}
                      onChange={(e) => handleFormChange('ratePerGram', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Retail Total Price (₹)</label>
                    <input
                      type="number"
                      value={newItemForm.totalPrice}
                      onChange={(e) => handleFormChange('totalPrice', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Wholesale Price (₹)</label>
                    <input
                      type="number"
                      value={newItemForm.wholesalePrice}
                      onChange={(e) => handleFormChange('wholesalePrice', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-emerald-400 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Min Wholesale Lot Qty</label>
                    <input
                      type="number"
                      value={newItemForm.wholesaleMinLot}
                      onChange={(e) => handleFormChange('wholesaleMinLot', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reorder Alert Qty</label>
                    <input
                      type="number"
                      value={newItemForm.reorderLevel}
                      onChange={(e) => handleFormChange('reorderLevel', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  SAVE &amp; ADD STOCK
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
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStockItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow cursor-pointer"
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
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
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
                <p className="text-slate-400">BIS HUID: <span className="font-mono text-slate-200">{inspectItem.huid || 'N/A'}</span></p>
                <p className="text-slate-400">Counter: <span className="text-slate-200">{inspectItem.counter}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div>Gross Weight: <strong className="text-slate-100">{inspectItem.grossWeight?.toFixed(3) || '0.000'}g</strong></div>
              <div>Less Weight: <strong className="text-slate-100">{inspectItem.lessWeight?.toFixed(3) || '0.000'}g</strong></div>
              <div>Net Weight: <strong className="text-amber-200">{inspectItem.netWeight?.toFixed(3) || '0.000'}g</strong></div>
              <div>Fine Weight: <strong className="text-emerald-400">{inspectItem.fineWeight?.toFixed(3) || '0.000'}g</strong></div>
              <div>Rate / g: <strong className="text-slate-100">₹{inspectItem.ratePerGram || 0}</strong></div>
              <div>Making / g: <strong className="text-slate-100">₹{inspectItem.makingChargeValue || 0}</strong></div>
              <div className="col-span-2 pt-2 border-t border-slate-800 flex justify-between text-sm">
                <span>Calculated Retail Val:</span>
                <span className="font-bold text-amber-300">{formatCurrency(inspectItem.totalPrice)}</span>
              </div>
              {inspectItem.wholesalePrice && (
                <div className="col-span-2 flex justify-between text-xs text-emerald-400">
                  <span>Wholesale Trade Val:</span>
                  <span className="font-bold">{formatCurrency(inspectItem.wholesalePrice)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
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
