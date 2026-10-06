import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_FIRMS,
  INITIAL_DAILY_RATES,
  INITIAL_MCX,
  INITIAL_CUSTOMERS,
  INITIAL_KARIGARS,
  INITIAL_STOCK,
  INITIAL_INVOICES,
  INITIAL_UDHAAR,
  INITIAL_SCHEMES,
  INITIAL_EXPENSES,
  INITIAL_DAILY_DIARY
} from '../data/initialData';
import { calculateJewelleryItem, calculateOldMetalExchange } from '../utils/calculations';

const JewelleryContext = createContext();

const STORAGE_KEY = 'JEWELLERY_OS_STATE_V1';

export function JewelleryProvider({ children }) {
  // Load state from localStorage or initialize with seed data
  const [firms, setFirms] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_FIRMS');
    return saved ? JSON.parse(saved) : INITIAL_FIRMS;
  });

  const [activeFirmId, setActiveFirmId] = useState(() => firms[0]?.id || 'FIRM-001');

  const [dailyRates, setDailyRates] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_RATES');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_RATES;
  });

  const [mcxData, setMcxData] = useState(() => INITIAL_MCX);

  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_STOCK');
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_CUSTOMERS');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [karigars, setKarigars] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_KARIGARS');
    return saved ? JSON.parse(saved) : INITIAL_KARIGARS;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_INVOICES');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [udhaarList, setUdhaarList] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_UDHAAR');
    return saved ? JSON.parse(saved) : INITIAL_UDHAAR;
  });

  const [schemes, setSchemes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_SCHEMES');
    return saved ? JSON.parse(saved) : INITIAL_SCHEMES;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_EXPENSES');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [dailyDiary, setDailyDiary] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_DIARY');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_DIARY;
  });

  // Active module navigation
  const [activeModule, setActiveModule] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewEstimate, setPreviewEstimate] = useState(null);

  // Active Firm object
  const activeFirm = firms.find(f => f.id === activeFirmId) || firms[0];

  // Save to localStorage when critical state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_FIRMS', JSON.stringify(firms));
  }, [firms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_RATES', JSON.stringify(dailyRates));
  }, [dailyRates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_STOCK', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_CUSTOMERS', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_INVOICES', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_UDHAAR', JSON.stringify(udhaarList));
  }, [udhaarList]);

  // Live MCX ticker update simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const deltaGold = (Math.random() - 0.48) * 40;
      const deltaSilver = (Math.random() - 0.48) * 80;
      setMcxData(prev => ({
        ...prev,
        gold: Number((prev.gold + deltaGold).toFixed(2)),
        silver: Number((prev.silver + deltaSilver).toFixed(2)),
        goldChange: `${deltaGold >= 0 ? '+' : ''}${deltaGold.toFixed(2)} (${((deltaGold / prev.gold) * 100).toFixed(2)}%)`,
        silverChange: `${deltaSilver >= 0 ? '+' : ''}${deltaSilver.toFixed(2)} (${((deltaSilver / prev.silver) * 100).toFixed(2)}%)`,
        updatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Stock CRUD
  const addStockItem = (newItem) => {
    const item = {
      ...newItem,
      id: 'STK-' + Date.now().toString().slice(-6),
      firmCode: activeFirm.code,
      firmName: activeFirm.name,
      status: 'In Stock'
    };
    setStock(prev => [item, ...prev]);
    return item;
  };

  const updateStockItem = (id, updatedFields) => {
    setStock(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteStockItem = (id) => {
    setStock(prev => prev.filter(item => item.id !== id));
  };

  // Customer CRUD
  const addCustomer = (newCust) => {
    const cust = {
      ...newCust,
      id: 'CUST-' + Date.now().toString().slice(-4),
      currentUdhaarBalance: 0,
      loyaltyPoints: 50
    };
    setCustomers(prev => [cust, ...prev]);
    return cust;
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  // Daily Rates actions
  const updateDailyRate = (id, ratePerGram) => {
    const rateNum = Number(ratePerGram);
    setDailyRates(prev => prev.map(r => {
      if (r.id === id) {
        const ratePer10Gm = rateNum * 10;
        const taxAmount = (rateNum * 3) / 100;
        return {
          ...r,
          ratePerGram: rateNum,
          ratePer10Gm,
          taxAmount,
          rateWithTax: rateNum + taxAmount
        };
      }
      return r;
    }));
  };

  const deleteAllRates = () => {
    setDailyRates([]);
  };

  const resetDefaultRates = () => {
    setDailyRates(INITIAL_DAILY_RATES);
  };

  // Invoicing & Sales actions
  const createInvoice = (invoiceData) => {
    const invoiceId = 'INV-IS' + (invoices.length + 87);
    const invoiceNo = `IS/${invoices.length + 87}/24-25`;
    const newInvoice = {
      ...invoiceData,
      id: invoiceId,
      invoiceNo,
      date: new Date().toISOString().split('T')[0],
      firmId: activeFirm.id,
      firmName: activeFirm.name,
      firmCode: activeFirm.code,
      status: 'Completed'
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // If there is an unpaid balance, book to Udhaar
    if (invoiceData.payments?.balanceUdhaarDue > 0 && invoiceData.customerId) {
      const newUdhaar = {
        id: 'UDH-' + Date.now().toString().slice(-4),
        invoiceNo: 'KUM' + (udhaarList.length + 83),
        mainInvoiceNo: invoiceNo,
        date: newInvoice.date,
        firmCode: activeFirm.code,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        mobile: invoiceData.customerPhone || '',
        city: activeFirm.city,
        transType: 'Udhaar Debit',
        principalAmount: invoiceData.payments.balanceUdhaarDue,
        roiMonthlyPercent: 1.50,
        amountWithInterest: invoiceData.payments.balanceUdhaarDue,
        cashPaid: 0,
        depositedAmount: 0,
        leftBalance: invoiceData.payments.balanceUdhaarDue,
        status: 'Active',
        dueDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
      };
      setUdhaarList(prev => [newUdhaar, ...prev]);

      // Update customer outstanding
      setCustomers(prev => prev.map(c => {
        if (c.id === invoiceData.customerId) {
          return {
            ...c,
            currentUdhaarBalance: (c.currentUdhaarBalance || 0) + invoiceData.payments.balanceUdhaarDue
          };
        }
        return c;
      }));
    }

    // Mark billed items as sold out
    if (invoiceData.items && invoiceData.items.length > 0) {
      const soldItemIds = invoiceData.items.map(i => i.itemId).filter(Boolean);
      setStock(prev => prev.map(item => soldItemIds.includes(item.id) ? { ...item, status: 'Sold Out' } : item));
    }

    // Update Day Diary
    setDailyDiary(prev => ({
      ...prev,
      todaySellDetails: [
        {
          invNo: invoiceNo.replace('/24-25', '').replace('/', ''),
          customer: invoiceData.customerName,
          city: activeFirm.city,
          cash: invoiceData.payments.cash || 0,
          bank: invoiceData.payments.cheque || 0,
          card: invoiceData.payments.card || 0,
          online: invoiceData.payments.online || 0,
          discount: invoiceData.discount || 0,
          total: invoiceData.totalInvoiceAmount
        },
        ...prev.todaySellDetails
      ],
      todaySellTotal: prev.todaySellTotal + invoiceData.totalInvoiceAmount
    }));

    return newInvoice;
  };

  // Udhaar Deposit
  const recordUdhaarDeposit = (udhaarId, amount, paymentMode = 'Cash') => {
    const depositAmt = Number(amount);
    setUdhaarList(prev => prev.map(u => {
      if (u.id === udhaarId) {
        const newLeft = Math.max(0, u.leftBalance - depositAmt);
        return {
          ...u,
          depositedAmount: (u.depositedAmount || 0) + depositAmt,
          leftBalance: newLeft,
          status: newLeft === 0 ? 'Closed' : 'Active'
        };
      }
      return u;
    }));
  };

  // Girvi / Pawn Loan Booking
  const createGirviLoan = (loanData) => {
    const newLoan = {
      id: 'UDH-' + Date.now().toString().slice(-4),
      invoiceNo: 'GIRVI-' + (udhaarList.length + 101),
      mainInvoiceNo: 'GIRVI-VOUCHER',
      date: new Date().toISOString().split('T')[0],
      firmCode: activeFirm.code,
      ...loanData,
      status: 'Active'
    };
    setUdhaarList(prev => [newLoan, ...prev]);
    return newLoan;
  };

  // Reset entire database to audit seed data
  const resetToAuditData = () => {
    localStorage.clear();
    setFirms(INITIAL_FIRMS);
    setActiveFirmId(INITIAL_FIRMS[0].id);
    setDailyRates(INITIAL_DAILY_RATES);
    setStock(INITIAL_STOCK);
    setCustomers(INITIAL_CUSTOMERS);
    setKarigars(INITIAL_KARIGARS);
    setInvoices(INITIAL_INVOICES);
    setUdhaarList(INITIAL_UDHAAR);
    setSchemes(INITIAL_SCHEMES);
    setExpenses(INITIAL_EXPENSES);
    setDailyDiary(INITIAL_DAILY_DIARY);
  };

  // Export full JSON database
  const exportDatabaseJson = () => {
    const fullDb = {
      appName: 'Jewellery OS',
      version: '2.7.364 Pro',
      exportDate: new Date().toISOString(),
      firms,
      dailyRates,
      stock,
      customers,
      karigars,
      invoices,
      udhaarList,
      schemes,
      expenses,
      dailyDiary
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDb, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Jewellery_OS_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON database
  const importDatabaseJson = (jsonObj) => {
    if (jsonObj.firms) setFirms(jsonObj.firms);
    if (jsonObj.dailyRates) setDailyRates(jsonObj.dailyRates);
    if (jsonObj.stock) setStock(jsonObj.stock);
    if (jsonObj.customers) setCustomers(jsonObj.customers);
    if (jsonObj.karigars) setKarigars(jsonObj.karigars);
    if (jsonObj.invoices) setInvoices(jsonObj.invoices);
    if (jsonObj.udhaarList) setUdhaarList(jsonObj.udhaarList);
    if (jsonObj.schemes) setSchemes(jsonObj.schemes);
    if (jsonObj.expenses) setExpenses(jsonObj.expenses);
    if (jsonObj.dailyDiary) setDailyDiary(jsonObj.dailyDiary);
  };

  // Aggregate Dashboard Analytics
  const totalStockGoldGrams = stock
    .filter(s => s.metalType === 'Gold' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);

  const totalStockGoldNetGrams = stock
    .filter(s => s.metalType === 'Gold' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);

  const totalStockSilverGrams = stock
    .filter(s => s.metalType === 'Silver' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);

  const totalStockSilverNetGrams = stock
    .filter(s => s.metalType === 'Silver' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);

  const totalStockValue = stock
    .filter(s => s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  const totalUdhaarOutstanding = udhaarList
    .filter(u => u.status === 'Active')
    .reduce((acc, curr) => acc + (Number(curr.leftBalance) || 0), 0);

  return (
    <JewelleryContext.Provider value={{
      firms,
      setFirms,
      activeFirm,
      activeFirmId,
      setActiveFirmId,
      dailyRates,
      setDailyRates,
      updateDailyRate,
      deleteAllRates,
      resetDefaultRates,
      mcxData,
      stock,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      customers,
      addCustomer,
      updateCustomer,
      karigars,
      invoices,
      createInvoice,
      udhaarList,
      recordUdhaarDeposit,
      createGirviLoan,
      schemes,
      expenses,
      dailyDiary,
      activeModule,
      setActiveModule,
      globalSearch,
      setGlobalSearch,
      previewInvoice,
      setPreviewInvoice,
      previewEstimate,
      setPreviewEstimate,
      resetToAuditData,
      exportDatabaseJson,
      importDatabaseJson,
      analytics: {
        totalStockGoldGrams,
        totalStockGoldNetGrams,
        totalStockSilverGrams,
        totalStockSilverNetGrams,
        totalStockValue,
        totalUdhaarOutstanding,
        totalInvoicesCount: invoices.length,
        totalCustomersCount: customers.length,
        totalStockCount: stock.filter(s => s.status === 'In Stock').length
      }
    }}>
      {children}
    </JewelleryContext.Provider>
  );
}

export function useJewellery() {
  const context = useContext(JewelleryContext);
  if (!context) {
    throw new Error('useJewellery must be used within a JewelleryProvider');
  }
  return context;
}
