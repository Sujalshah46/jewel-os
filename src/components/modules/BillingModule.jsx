import React, { useEffect, useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Receipt,
  Search,
  PlusCircle,
  Trash2,
  Printer,
  FileText,
  UserCheck,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Coins,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  UserPlus
} from 'lucide-react';
import { formatCurrency, formatWeight, numberToWordsIndian } from '../../utils/numberToWords';
import { calculateJewelleryItem, calculateOldMetalExchange } from '../../utils/calculations';
import { addStockItemToCart } from '../../utils/billingCart';

export default function BillingModule() {
  const {
    activeFirm,
    stock,
    customers,
    addCustomer,
    dailyRates,
    createInvoice,
    setPreviewInvoice,
    setPreviewEstimate,
    setActiveModule,
    pendingBillingItem,
    setPendingBillingItem
  } = useJewellery();

  // Invoice / POS Header state
  // P0 Fix: Start empty by default or allow loading audit demo draft deliberately
  const [isDemoDraft, setIsDemoDraft] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [salesperson, setSalesperson] = useState('Mansi Anil');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Cart items start EMPTY by default
  const [cartItems, setCartItems] = useState([]);
  const [expandedItemIds, setExpandedItemIds] = useState({});
  const [showAllDetails, setShowAllDetails] = useState(false);

  useEffect(() => {
    if (!pendingBillingItem) return;
    const selected = stock.find(item => item.id === pendingBillingItem);
    if (selected && selected.status === 'In Stock' && (!selected.firmCode || selected.firmCode === activeFirm.code)) {
      setCartItems(current => addStockItemToCart(current, selected));
    }
    setPendingBillingItem(null);
  }, [pendingBillingItem, stock, activeFirm.code, setPendingBillingItem]);

  // Old Metal / Gold Exchange State
  const [hasOldGold, setHasOldGold] = useState(false);
  const [oldGoldData, setOldGoldData] = useState({
    metalType: 'Gold',
    description: 'Old 22K Gold Bangle scrap exchange',
    grossWeight: 0,
    lessWeight: 0,
    netWeight: 0,
    touchPercent: 82.00,
    fineWeight: 0,
    rateDeduction: 0,
    valuationRatePerGram: 5333.33,
    valuationAmount: 0,
    rateCutMode: 'RATE CUT'
  });

  // Multi-Payment Mode Split start EMPTY by default
  const [payments, setPayments] = useState({
    cash: 0,
    cheque: 0,
    card: 0,
    online: 0,
    loyaltyRedeemed: 0,
    onlineNarration: ''
  });

  // Tax Configuration
  const [taxConfig, setTaxConfig] = useState({
    cgstActive: true,
    sgstActive: true,
    igstActive: false
  });

  // Submission Guard
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({
    mr: 'Mr.',
    firstName: '',
    lastName: '',
    mobile: '',
    city: 'Pune',
    address: '',
    creditLimit: 50000
  });

  // Function to load the historical Audit Demo Bill (IS86) deliberately
  const handleLoadDemoDraft = () => {
    setIsDemoDraft(true);
    setSelectedCustomerId('CUST-001'); // Avinash Kale
    setCartItems([
      {
        id: 'cart-1',
        itemId: 'STK-001',
        metalType: 'Gold',
        itemCode: 'LRING33',
        description: 'L ring [BCD: 1201] [WDF445]',
        hsn: '7113',
        qty: 1,
        grossWeight: 8.000,
        lessWeight: 0.100,
        netWeight: 7.900,
        purityKarat: '22K (BIS 916)',
        purityPercent: 92.00,
        wastagePercent: 7.00,
        finePurityPercent: 92.00,
        customerWastagePercent: 7.00,
        fineWeight: 7.268,
        ratePerGram: 7200.00,
        ratePer10Gm: 72000.00,
        makingChargeType: 'per_gram',
        makingChargeValue: 700.00,
        makingDiscountPercent: 0,
        totalMakingCharges: 5530.00,
        stoneValue: 0,
        hallmarkCharge: 45.00,
        otherCharges: 0,
        itemDiscount: 0,
        taxableAmount: 62135.92,
        cgst: 932.04,
        sgst: 932.04,
        finalValue: 62978.80,
        status: 'Ready'
      }
    ]);
    setHasOldGold(true);
    setOldGoldData({
      metalType: 'Gold',
      description: 'Old 22K Gold Bangle scrap exchange',
      grossWeight: 5.000,
      lessWeight: 0.500,
      netWeight: 4.500,
      touchPercent: 82.00,
      fineWeight: 3.690,
      rateDeduction: 0,
      valuationRatePerGram: 5333.33,
      valuationAmount: 24000.00,
      rateCutMode: 'RATE CUT'
    });
    // Set realistic payment: exact balance split
    // Net payable will be 62,979 - 24,000 = 38,979
    setPayments({
      cash: 18979.00,
      cheque: 0,
      card: 10000.00,
      online: 10000.00,
      loyaltyRedeemed: 0,
      onlineNarration: 'GPay UTR: 99120481239'
    });
  };

  // Function to clear transaction and start clean
  const handleClearTransaction = () => {
    setIsDemoDraft(false);
    setSelectedCustomerId('');
    setCartItems([]);
    setHasOldGold(false);
    setOldGoldData({
      metalType: 'Gold',
      description: 'Old Gold Exchange',
      grossWeight: 0,
      lessWeight: 0,
      netWeight: 0,
      touchPercent: 82.00,
      fineWeight: 0,
      rateDeduction: 0,
      valuationRatePerGram: 5333.33,
      valuationAmount: 0,
      rateCutMode: 'RATE CUT'
    });
    setPayments({
      cash: 0,
      cheque: 0,
      card: 0,
      online: 0,
      loyaltyRedeemed: 0,
      onlineNarration: ''
    });
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Recalculate item when columns change
  const handleItemChange = (cartId, field, value) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === cartId) {
        const updated = { ...item, [field]: value };
        const gw = field === 'grossWeight' ? Number(value) : Number(updated.grossWeight);
        const lw = field === 'lessWeight' ? Number(value) : Number(updated.lessWeight);
        const nw = Math.max(0, gw - lw);
        const purity = field === 'purityPercent' ? Number(value) : Number(updated.purityPercent);
        const rate = field === 'ratePerGram' ? Number(value) : Number(updated.ratePerGram);
        const making = field === 'makingChargeValue' ? Number(value) : Number(updated.makingChargeValue);

        const calc = calculateJewelleryItem({
          grossWeight: gw,
          lessWeight: lw,
          purityPercent: purity,
          ratePerGram: rate,
          makingChargeType: updated.makingChargeType,
          makingChargeValue: making,
          stoneValue: updated.stoneValue,
          hallmarkCharge: updated.hallmarkCharge,
          otherCharges: updated.otherCharges,
          itemDiscount: updated.itemDiscount
        });

        return {
          ...updated,
          netWeight: calc.netWeight,
          fineWeight: calc.fineWeight,
          totalMakingCharges: calc.totalMakingCharges,
          taxableAmount: calc.taxableAmount,
          cgst: calc.cgst,
          sgst: calc.sgst,
          finalValue: calc.finalValue
        };
      }
      return item;
    }));
  };

  // Add Item via Barcode Scan
  const handleBarcodeScan = (e, explicitCode) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = (explicitCode !== undefined && explicitCode !== null ? explicitCode : barcodeInput).trim();
    if (!query) return;
    const found = stock.find(s => 
      (!s.firmCode || s.firmCode === activeFirm.code) &&
      (s.barcode?.trim() === query || 
       s.itemCode?.toLowerCase() === query.toLowerCase())
    );
    if (found) {
      // Prevent double selling (INV-01)
      if (found.status === 'Sold' || found.status === 'Sold Out') {
        alert(`Cannot add item "${found.itemCode}": This item is already marked as ${found.status}.`);
        return;
      }
      // Prevent duplicate scan in same invoice
      if (cartItems.some(item => item.itemId === found.id)) {
        alert(`Item "${found.itemCode}" is already in your billing cart.`);
        return;
      }
      const newItem = createBillingCartItem(found, `cart-${Date.now()}`);
      setCartItems(prev => [...prev, newItem]);
      setBarcodeInput('');
    } else {
      alert(`Product with barcode/code "${query}" not found in stock. Try 1201, 1150, or check Inventory.`);
    }
  };

  // Remove Item
  const handleRemoveCartItem = (cartId) => {
    setCartItems(prev => prev.filter(i => i.id !== cartId));
  };

  // Old Gold calculations
  const handleOldGoldChange = (field, val) => {
    setOldGoldData(prev => {
      const updated = { ...prev, [field]: val };
      const gw = field === 'grossWeight' ? Number(val) : Number(updated.grossWeight);
      const lw = field === 'lessWeight' ? Number(val) : Number(updated.lessWeight);
      const nw = Math.max(0, gw - lw);
      const touch = field === 'touchPercent' ? Number(val) : Number(updated.touchPercent);
      const base24k = dailyRates.find(r => r.karat?.includes('24K'))?.ratePerGram || 7200;

      const calc = calculateOldMetalExchange({
        grossWeight: gw,
        lessWeight: lw,
        touchPercent: touch,
        currentBaseRate: base24k
      });

      return {
        ...updated,
        netWeight: calc.netWeight,
        fineWeight: calc.fineWeight,
        valuationRatePerGram: calc.effectiveRatePerGram,
        valuationAmount: calc.valuation
      };
    });
  };

  // Aggregate Totals
  const totalGrossWeight = cartItems.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);
  const totalNetWeight = cartItems.reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);
  const totalFineWeight = cartItems.reduce((acc, curr) => acc + (Number(curr.fineWeight) || 0), 0);
  const totalTaxableAmount = cartItems.reduce((acc, curr) => acc + (Number(curr.taxableAmount) || 0), 0);
  const totalCgst = cartItems.reduce((acc, curr) => acc + (Number(curr.cgst) || 0), 0);
  const totalSgst = cartItems.reduce((acc, curr) => acc + (Number(curr.sgst) || 0), 0);
  const totalGrossBillValue = cartItems.reduce((acc, curr) => acc + (Number(curr.finalValue) || 0), 0);

  // Less Old Gold exchange value
  const oldGoldCredit = hasOldGold ? (Number(oldGoldData.valuationAmount) || 0) : 0;
  
  // Total Invoice Amount after Old Gold deduction
  const finalInvoicePayable = Math.max(0, totalGrossBillValue - oldGoldCredit);
  const roundOff = Number((Math.round(finalInvoicePayable) - finalInvoicePayable).toFixed(2));
  const roundedInvoiceTotal = Math.round(finalInvoicePayable);

  // Received sum
  const totalReceivedAmount = (Number(payments.cash) || 0) +
    (Number(payments.cheque) || 0) +
    (Number(payments.card) || 0) +
    (Number(payments.online) || 0) +
    (Number(payments.loyaltyRedeemed) || 0);

  // Precise difference between received and payable (Audit P0 Fix)
  const paymentDifference = totalReceivedAmount - roundedInvoiceTotal;
  const balanceUdhaarDue = paymentDifference < 0 ? Math.abs(paymentDifference) : 0;
  const excessReceived = paymentDifference > 0 ? paymentDifference : 0;

  // Submit Invoice Handler
  const handleSubmitInvoice = (shouldPrint = false) => {
    if (isSubmitting) return;

    if (cartItems.length === 0) {
      alert('Cart is empty. Please add items to bill.');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select or add a customer to bill.');
      return;
    }

    setIsSubmitting(true);

    const invoicePayload = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.fullName,
      customerPhone: selectedCustomer.mobile,
      customerAddress: selectedCustomer.address,
      salesperson,
      items: cartItems,
      hasOldGold,
      metalReceived: hasOldGold ? oldGoldData : null,
      taxableAmount: totalTaxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      totalTax: totalCgst + totalSgst,
      roundOff,
      totalInvoiceAmount: roundedInvoiceTotal,
      payments: {
        ...payments,
        totalReceived: totalReceivedAmount,
        balanceUdhaarDue,
        excessReceived
      },
      payableInWords: numberToWordsIndian(roundedInvoiceTotal)
    };

    try {
      const newInv = createInvoice(invoicePayload);
      setIsSubmitting(false);

      if (shouldPrint) {
        setPreviewInvoice(newInv);
      } else {
        alert(`Invoice ${newInv.invoiceNo} successfully generated & saved!`);
        handleClearTransaction();
      }
    } catch (err) {
      setIsSubmitting(false);
      alert('Error saving invoice: ' + err.message);
    }
  };

  // Add Customer Handler
  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustForm.firstName || !newCustForm.mobile) return;
    const added = addCustomer({
      mr: newCustForm.mr,
      firstName: newCustForm.firstName,
      lastName: newCustForm.lastName,
      fullName: `${newCustForm.firstName} ${newCustForm.lastName}`.trim(),
      mobile: newCustForm.mobile,
      city: newCustForm.city,
      address: newCustForm.address,
      creditLimit: Number(newCustForm.creditLimit) || 50000
    });
    setSelectedCustomerId(added.id);
    setShowAddCustomerModal(false);
    setNewCustForm({ mr: 'Mr.', firstName: '', lastName: '', mobile: '', city: 'Pune', address: '', creditLimit: 50000 });
  };

  return (
    <div className="jos-light-module pos-workspace space-y-6">
      {/* Top POS Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <Receipt className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SELL / POINT OF SALE BILLING
            </h2>
            {isDemoDraft && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                SAMPLE AUDIT DRAFT (IS86)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Firm: <strong className="text-slate-200">{activeFirm.name}</strong> • Local draft and tax invoice workflow
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDemoDraft && cartItems.length === 0 ? (
            <button
              type="button"
              onClick={handleLoadDemoDraft}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Audit Sample (IS86)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClearTransaction}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear / New Empty Bill</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPreviewEstimate({
                shopName: activeFirm.name,
                customer: selectedCustomer || { fullName: 'Valued Customer', mobile: '' },
                date: invoiceDate,
                items: cartItems,
                total: roundedInvoiceTotal
              });
            }}
            disabled={cartItems.length === 0}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Estimate / Quote</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmitInvoice(true)}
            disabled={cartItems.length === 0 || isSubmitting}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Submit & Print Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Customer Selection & Barcode Scan Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Customer Select */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Customer *</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-0.5"
            >
              <UserPlus className="w-3 h-3" /> + New
            </button>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="">-- Choose Party / Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.mr} {c.fullName} ({c.city}) - {c.mobile}
              </option>
            ))}
          </select>
          {selectedCustomer ? (
            <div className="mt-1.5 text-[11px] text-slate-400 flex flex-wrap gap-x-2">
              <span>City: <strong className="text-slate-200">{selectedCustomer.city}</strong></span>
              <span>•</span>
              <span>Outstanding: <strong className={selectedCustomer.currentUdhaarBalance > 0 ? "text-rose-400 font-mono" : "text-emerald-400 font-mono"}>₹{selectedCustomer.currentUdhaarBalance || 0}</strong></span>
            </div>
          ) : (
            <p className="text-[11px] text-amber-400/80 mt-1">Please select customer to proceed</p>
          )}
        </div>

        {/* Barcode / RFID Fast Scanner Input */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Add Product Barcode / SKU Code (e.g. 1201 / 1150 / LRING33)
          </label>
          <form onSubmit={handleBarcodeScan} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or type code and press Enter..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
              />
              <QrCode className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow"
            >
              Add Item
            </button>
          </form>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
            <span>Quick add from inventory:</span>
            {stock.slice(0, 3).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setBarcodeInput(s.barcode);
                  handleBarcodeScan(null, s.barcode);
                }}
                className="text-amber-400 hover:underline font-mono"
              >
                {s.itemCode} ({s.barcode})
              </button>
            ))}
          </div>
        </div>

        {/* Salesperson & Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Salesperson / Counter
          </label>
          <select
            value={salesperson}
            onChange={(e) => setSalesperson(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="Mansi Anil">Mansi Anil (Senior)</option>
            <option value="Manoj Anil">Manoj Anil (Manager)</option>
            <option value="Rohan Saraf">Rohan Saraf (Sales Exec)</option>
          </select>
        </div>
      </div>

      {/* BILLED ITEMS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100">
              Billed Items ({cartItems.length})
            </h3>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={() => setShowAllDetails(!showAllDetails)}
              className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>{showAllDetails ? 'Hide Detailed Columns' : 'Show All 27-Column Calculation Fields'}</span>
              {showAllDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-slate-400 font-mono">
              Gross Wt: <strong className="text-amber-300">{totalGrossWeight.toFixed(3)}g</strong>
            </span>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No items in bill yet</p>
            <p className="text-xs text-slate-500 mt-1">Scan a barcode above or click "Load Audit Sample (IS86)" to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800 font-mono whitespace-nowrap">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Metal / Karat</th>
                  <th className="py-2.5 px-3 text-right">Gross Wt (g)</th>
                  <th className="py-2.5 px-3 text-right">Net Wt (g)</th>
                  {showAllDetails && <th className="py-2.5 px-3 text-right">Fine Wt (g)</th>}
                  <th className="py-2.5 px-3 text-right">Rate / g (₹)</th>
                  <th className="py-2.5 px-3 text-right">Making (₹)</th>
                  {showAllDetails && <th className="py-2.5 px-3 text-right">Taxable (₹)</th>}
                  <th className="py-2.5 px-3 text-right">Total Val (₹)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {cartItems.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-amber-300">{item.itemCode}</td>
                      <td className="py-3 px-3 font-sans font-medium text-slate-100 min-w-[160px]">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{item.metalType} ({item.purityKarat})</td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={item.grossWeight}
                          onChange={(e) => handleItemChange(item.id, 'grossWeight', e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right font-bold text-slate-100"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-200">
                        {item.netWeight.toFixed(3)}g
                      </td>
                      {showAllDetails && (
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {item.fineWeight.toFixed(3)}g
                        </td>
                      )}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          value={item.ratePerGram}
                          onChange={(e) => handleItemChange(item.id, 'ratePerGram', e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right font-bold text-amber-300"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          value={item.makingChargeValue}
                          onChange={(e) => handleItemChange(item.id, 'makingChargeValue', e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200"
                        />
                      </td>
                      {showAllDetails && (
                        <td className="py-3 px-3 text-right text-slate-200">
                          ₹{item.taxableAmount.toFixed(2)}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right font-extrabold text-amber-300 text-sm">
                        ₹{item.finalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setExpandedItemIds(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className="p-1 rounded text-slate-400 hover:text-amber-300"
                            title="Inspect item breakdown"
                          >
                            {expandedItemIds[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(item.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expanded Detail Drawer for item */}
                    {expandedItemIds[item.id] && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={showAllDetails ? 12 : 10} className="p-3 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Less / Stone Wt:</span>
                              <input
                                type="number"
                                step="0.001"
                                value={item.lessWeight}
                                onChange={(e) => handleItemChange(item.id, 'lessWeight', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 mt-0.5"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Purity %:</span>
                              <span className="font-bold text-slate-200">{item.purityPercent}%</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Wastage %:</span>
                              <input
                                type="number"
                                value={item.wastagePercent}
                                onChange={(e) => handleItemChange(item.id, 'wastagePercent', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 mt-0.5"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Total Making:</span>
                              <span className="font-bold text-slate-200">₹{item.totalMakingCharges.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Hallmark (HMC):</span>
                              <span className="font-bold text-slate-200">₹{item.hallmarkCharge}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">CGST / SGST (1.5% ea):</span>
                              <span className="font-bold text-slate-200">₹{(item.cgst + item.sgst).toFixed(2)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Old Metal Exchange & Multi-Payment Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 spans): Old Gold Exchange + Multi Payment breakdown */}
        <div className="lg:col-span-2 space-y-5">
          {/* Old Metal (Gold/Silver) Received Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
                  Old Metal Exchange / Jama (Optional)
                </h3>
              </div>
              <label className="flex items-center space-x-2 text-xs text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOldGold}
                  onChange={(e) => setHasOldGold(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
                />
                <span className="font-semibold">Include Old Metal Exchange</span>
              </label>
            </div>

            {hasOldGold && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">GROSS WT (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={oldGoldData.grossWeight}
                    onChange={(e) => handleOldGoldChange('grossWeight', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">LESS / DUST WT (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={oldGoldData.lessWeight}
                    onChange={(e) => handleOldGoldChange('lessWeight', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">TOUCH / PURITY %</label>
                  <input
                    type="number"
                    value={oldGoldData.touchPercent}
                    onChange={(e) => handleOldGoldChange('touchPercent', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">FINE WT (CALCULATED)</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold">
                    {oldGoldData.fineWeight.toFixed(3)}g
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">OLD GOLD VALUATION (₹)</label>
                  <input
                    type="number"
                    value={oldGoldData.valuationAmount}
                    onChange={(e) => handleOldGoldChange('valuationAmount', e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <div className="bg-slate-950 border border-slate-700 p-0.5 rounded-lg flex w-full">
                    <button
                      type="button"
                      onClick={() => setOldGoldData(prev => ({ ...prev, rateCutMode: 'RATE CUT' }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
                        oldGoldData.rateCutMode === 'RATE CUT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      RATE CUT
                    </button>
                    <button
                      type="button"
                      onClick={() => setOldGoldData(prev => ({ ...prev, rateCutMode: 'NO RATE CUT' }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
                        oldGoldData.rateCutMode === 'NO RATE CUT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      NO RATE CUT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Details & Multi-Payment Split */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payment Breakdown & Settlement</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">CASH RECEIVED (₹)</label>
                <input
                  type="number"
                  value={payments.cash}
                  onChange={(e) => setPayments(prev => ({ ...prev, cash: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-400 mb-1">CHEQUE / BANK (₹)</label>
                <input
                  type="number"
                  value={payments.cheque}
                  onChange={(e) => setPayments(prev => ({ ...prev, cheque: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-blue-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">CARD / POS (₹)</label>
                <input
                  type="number"
                  value={payments.card}
                  onChange={(e) => setPayments(prev => ({ ...prev, card: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-400 mb-1">ONLINE / UPI (₹)</label>
                <input
                  type="number"
                  value={payments.online}
                  onChange={(e) => setPayments(prev => ({ ...prev, online: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-purple-300 font-mono font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">ONLINE / UPI NARRATION (UTR)</label>
                <input
                  type="text"
                  value={payments.onlineNarration}
                  onChange={(e) => setPayments(prev => ({ ...prev, onlineNarration: e.target.value }))}
                  placeholder="GPay / PhonePe / UTR Reference No."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">LOYALTY REDEEMED</label>
                <input
                  type="number"
                  value={payments.loyaltyRedeemed}
                  onChange={(e) => setPayments(prev => ({ ...prev, loyaltyRedeemed: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">TOTAL RECEIVED</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 font-mono font-bold">
                  {formatCurrency(totalReceivedAmount)}
                </div>
              </div>
            </div>

            {/* Difference / Balance Status Notification (P0 Audit Resolution) */}
            <div className="pt-2">
              {paymentDifference > 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-start space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-300">
                      EXCESS PAYMENT / CHANGE DUE: {formatCurrency(excessReceived)}
                    </p>
                    <p className="text-emerald-400/80 text-[11px] mt-0.5">
                      Received amount exceeds net payable. Returned as counter change or credited to party advance.
                    </p>
                  </div>
                </div>
              )}

              {paymentDifference < 0 && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">
                      BALANCE DUE / BOOK TO UDHAAR: {formatCurrency(balanceUdhaarDue)}
                    </p>
                    <p className="text-amber-400/80 text-[11px] mt-0.5">
                      Remaining balance will automatically post to customer's active Udhaar loan ledger.
                    </p>
                  </div>
                </div>
              )}

              {paymentDifference === 0 && roundedInvoiceTotal > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Invoice is balanced — fully settled in cash/electronic modes.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary Panel */}
        <div className="pos-summary bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-amber-300 pb-2 border-b border-slate-800">
              Tax Invoice Summary
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-800/80 pt-2 font-mono">
              <div className="flex justify-between text-slate-300 pt-1">
                <span>Taxable Item Value:</span>
                <span>{formatCurrency(totalTaxableAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>CGST (1.5%):</span>
                <span>{formatCurrency(totalCgst)}</span>
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>SGST (1.5%):</span>
                <span>{formatCurrency(totalSgst)}</span>
              </div>

              <div className="flex justify-between text-slate-200 font-bold pt-1">
                <span>Gross Bill Value:</span>
                <span>{formatCurrency(totalGrossBillValue)}</span>
              </div>

              {hasOldGold && (
                <div className="flex justify-between text-emerald-400 font-bold pt-1">
                  <span>Less: Old Gold Credit:</span>
                  <span>- {formatCurrency(oldGoldCredit)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Round Off:</span>
                <span>{roundOff >= 0 ? `+${roundOff}` : roundOff}</span>
              </div>

              <div className="flex justify-between text-amber-300 font-extrabold text-base pt-2 border-t border-amber-500/40">
                <span>NET PAYABLE:</span>
                <span>{formatCurrency(roundedInvoiceTotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-400 font-bold pt-1">
                <span>Total Received:</span>
                <span>{formatCurrency(totalReceivedAmount)}</span>
              </div>

              {balanceUdhaarDue > 0 && (
                <div className="flex justify-between text-rose-400 font-bold pt-1 bg-rose-950/40 px-2 py-1 rounded">
                  <span>Balance Udhaar Due:</span>
                  <span>{formatCurrency(balanceUdhaarDue)}</span>
                </div>
              )}

              {excessReceived > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold pt-1 bg-emerald-950/40 px-2 py-1 rounded">
                  <span>Change / Advance Credit:</span>
                  <span>{formatCurrency(excessReceived)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleSubmitInvoice(true)}
              disabled={cartItems.length === 0 || isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'PROCESSING...' : 'SUBMIT & PRINT TAX INVOICE'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitInvoice(false)}
              disabled={cartItems.length === 0 || isSubmitting}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-colors disabled:opacity-50"
            >
              Save Without Printing
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Add New Customer Party</h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Title</label>
                  <select
                    value={newCustForm.mr}
                    onChange={(e) => setNewCustForm(prev => ({ ...prev, mr: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Miss">Miss</option>
                    <option value="M/s">M/s</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newCustForm.firstName}
                    onChange={(e) => setNewCustForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="e.g. Ramesh"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newCustForm.lastName}
                  onChange={(e) => setNewCustForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="e.g. Patil"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={newCustForm.mobile}
                  onChange={(e) => setNewCustForm(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder="e.g. 9822012345"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={newCustForm.city}
                    onChange={(e) => setNewCustForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustForm.creditLimit}
                    onChange={(e) => setNewCustForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
