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

  const [karigarVouchers, setKarigarVouchers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_KARIGAR_VOUCHERS');
    return saved ? JSON.parse(saved) : [
      {
        id: 'KV-101',
        karigarId: 'KAR-001',
        karigarName: 'Gopal Soni (Master Ring Craftsman)',
        type: 'ISSUE',
        metalType: 'Gold',
        weightGm: 20.000,
        date: '2024-10-01',
        notes: 'Issued 24K pure gold for ladies casting rings'
      }
    ];
  });

  const [schemeEnrollments, setSchemeEnrollments] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_SCHEME_ENROLLMENTS');
    return saved ? JSON.parse(saved) : [
      {
        id: 'ENR-101',
        schemeId: 'SCH-001',
        schemeName: 'Swarna Nidhi 11+1 Bonus Plan',
        customerId: 'CUST-001',
        customerName: 'Priya Sharma',
        mobile: '+91 9822019283',
        monthlyInstallment: 5000,
        durationMonths: 11,
        paidInstallmentsCount: 5,
        totalPaidAmount: 25000,
        startDate: '2024-05-10',
        status: 'Active'
      }
    ];
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_KARIGARS', JSON.stringify(karigars));
  }, [karigars]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_KARIGAR_VOUCHERS', JSON.stringify(karigarVouchers));
  }, [karigarVouchers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_SCHEMES', JSON.stringify(schemes));
  }, [schemes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_SCHEME_ENROLLMENTS', JSON.stringify(schemeEnrollments));
  }, [schemeEnrollments]);

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
      firmId: activeFirm.id,
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
    // 1. Prevent double selling of serialized items (INV-01)
    if (invoiceData.items && invoiceData.items.length > 0) {
      const billedItemIds = invoiceData.items.map(i => i.itemId).filter(Boolean);
      const alreadySoldItem = stock.find(item => 
        billedItemIds.includes(item.id) && 
        (item.status === 'Sold' || item.status === 'Sold Out')
      );
      if (alreadySoldItem) {
        throw new Error(`Item "${alreadySoldItem.itemCode || alreadySoldItem.barcode || alreadySoldItem.id}" is already sold out and cannot be billed again.`);
      }
    }

    // 2. Prevent unbooked debt hazard on partial payments (INV-03)
    const balanceDue = Number(invoiceData.payments?.balanceUdhaarDue) || 0;
    if (balanceDue > 0 && !invoiceData.customerId) {
      throw new Error(`Outstanding balance (Udhaar) of ₹${balanceDue.toLocaleString('en-IN')} requires an enrolled customer account.`);
    }

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
    if (balanceDue > 0 && invoiceData.customerId) {
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
        principalAmount: balanceDue,
        roiMonthlyPercent: 1.50,
        amountWithInterest: balanceDue,
        cashPaid: 0,
        depositedAmount: 0,
        leftBalance: balanceDue,
        status: 'Active',
        dueDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
      };
      setUdhaarList(prev => [newUdhaar, ...prev]);

      // Update customer outstanding
      setCustomers(prev => prev.map(c => {
        if (c.id === invoiceData.customerId) {
          return {
            ...c,
            currentUdhaarBalance: (c.currentUdhaarBalance || 0) + balanceDue
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

  // Karigar Job Work Actions (MOD-01)
  const issueMetalToKarigar = (karigarId, { metalType, grams, notes }) => {
    const wt = Number(grams) || 0;
    if (wt <= 0) throw new Error('Valid metal weight is required');
    const targetKarigar = karigars.find(k => k.id === karigarId);
    const voucher = {
      id: 'KV-' + Date.now().toString().slice(-5),
      karigarId,
      karigarName: targetKarigar?.name || 'Karigar',
      type: 'ISSUE',
      metalType: metalType || 'Gold',
      weightGm: wt,
      date: new Date().toISOString().split('T')[0],
      notes: notes || 'Pure metal issued for ornament fabrication'
    };
    setKarigarVouchers(prev => [voucher, ...prev]);
    setKarigars(prev => prev.map(k => {
      if (k.id === karigarId) {
        if (metalType === 'Silver') {
          return { ...k, silverIssuedBalanceGm: Number(((k.silverIssuedBalanceGm || 0) + wt).toFixed(3)) };
        } else {
          return { ...k, pureGoldIssuedBalanceGm: Number(((k.pureGoldIssuedBalanceGm || 0) + wt).toFixed(3)) };
        }
      }
      return k;
    }));
    return voucher;
  };

  const receiveOrnamentFromKarigar = (karigarId, { itemDescription, metalType, grossWeight, fineWeight, labourAmount, ghatLossGm }) => {
    const fineWt = Number(fineWeight) || 0;
    const ghat = Number(ghatLossGm) || 0;
    const totalMetalSettled = fineWt + ghat;
    const labour = Number(labourAmount) || 0;
    const targetKarigar = karigars.find(k => k.id === karigarId);

    const voucher = {
      id: 'KV-' + Date.now().toString().slice(-5),
      karigarId,
      karigarName: targetKarigar?.name || 'Karigar',
      type: 'RECEIVE',
      metalType: metalType || 'Gold',
      itemDescription: itemDescription || 'Finished Ornament',
      grossWeight: Number(grossWeight) || 0,
      fineWeight: fineWt,
      ghatLossGm: ghat,
      labourAmount: labour,
      date: new Date().toISOString().split('T')[0]
    };
    setKarigarVouchers(prev => [voucher, ...prev]);
    setKarigars(prev => prev.map(k => {
      if (k.id === karigarId) {
        const updated = { ...k, labourChargesDue: (k.labourChargesDue || 0) + labour };
        if (metalType === 'Silver') {
          updated.silverIssuedBalanceGm = Math.max(0, Number(((k.silverIssuedBalanceGm || 0) - totalMetalSettled).toFixed(3)));
        } else {
          updated.pureGoldIssuedBalanceGm = Math.max(0, Number(((k.pureGoldIssuedBalanceGm || 0) - totalMetalSettled).toFixed(3)));
        }
        return updated;
      }
      return k;
    }));
    return voucher;
  };

  // Gold Scheme Actions (MOD-02)
  const enrollCustomerInScheme = ({ schemeId, customerId, monthlyInstallment }) => {
    const sch = schemes.find(s => s.id === schemeId);
    const cust = customers.find(c => c.id === customerId);
    if (!sch || !cust) throw new Error('Valid scheme and customer are required.');

    const installment = Number(monthlyInstallment) || sch.monthlyInstallment;
    const enrollment = {
      id: 'ENR-' + Date.now().toString().slice(-5),
      schemeId: sch.id,
      schemeName: sch.name,
      customerId: cust.id,
      customerName: cust.fullName || `${cust.firstName || ''} ${cust.lastName || ''}`.trim(),
      mobile: cust.mobile || cust.phone || '',
      monthlyInstallment: installment,
      durationMonths: sch.durationMonths || 11,
      paidInstallmentsCount: 1,
      totalPaidAmount: installment,
      startDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    setSchemeEnrollments(prev => [enrollment, ...prev]);
    setSchemes(prev => prev.map(s => {
      if (s.id === schemeId) {
        return {
          ...s,
          activeMembersCount: (s.activeMembersCount || 0) + 1,
          totalCollectedAmount: (s.totalCollectedAmount || 0) + installment
        };
      }
      return s;
    }));
    return enrollment;
  };

  const recordSchemeInstallment = (enrollmentId, amount) => {
    const amt = Number(amount) || 0;
    setSchemeEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId) {
        const newCount = (enr.paidInstallmentsCount || 0) + 1;
        const newTotal = (enr.totalPaidAmount || 0) + amt;
        return {
          ...enr,
          paidInstallmentsCount: newCount,
          totalPaidAmount: newTotal,
          status: newCount >= enr.durationMonths ? 'Matured' : 'Active'
        };
      }
      return enr;
    }));
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

  // Import JSON database with schema validation (SEC-06)
  const importDatabaseJson = (jsonObj) => {
    if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
      throw new Error('Invalid backup file: Root structure must be a JSON object.');
    }

    const validCollections = ['firms', 'dailyRates', 'stock', 'customers', 'karigars', 'invoices', 'udhaarList', 'schemes', 'expenses', 'dailyDiary'];
    const hasAtLeastOne = validCollections.some(key => Array.isArray(jsonObj[key]));
    if (!hasAtLeastOne) {
      throw new Error('Invalid backup schema: No valid Jewellery OS collections found in backup.');
    }

    if (jsonObj.firms) {
      if (!Array.isArray(jsonObj.firms)) throw new Error('Schema error: "firms" must be an array.');
      setFirms(jsonObj.firms);
    }
    if (jsonObj.dailyRates) {
      if (!Array.isArray(jsonObj.dailyRates)) throw new Error('Schema error: "dailyRates" must be an array.');
      setDailyRates(jsonObj.dailyRates);
    }
    if (jsonObj.stock) {
      if (!Array.isArray(jsonObj.stock)) throw new Error('Schema error: "stock" must be an array.');
      setStock(jsonObj.stock);
    }
    if (jsonObj.customers) {
      if (!Array.isArray(jsonObj.customers)) throw new Error('Schema error: "customers" must be an array.');
      setCustomers(jsonObj.customers);
    }
    if (jsonObj.karigars) {
      if (!Array.isArray(jsonObj.karigars)) throw new Error('Schema error: "karigars" must be an array.');
      setKarigars(jsonObj.karigars);
    }
    if (jsonObj.invoices) {
      if (!Array.isArray(jsonObj.invoices)) throw new Error('Schema error: "invoices" must be an array.');
      setInvoices(jsonObj.invoices);
    }
    if (jsonObj.udhaarList) {
      if (!Array.isArray(jsonObj.udhaarList)) throw new Error('Schema error: "udhaarList" must be an array.');
      setUdhaarList(jsonObj.udhaarList);
    }
    if (jsonObj.schemes) {
      if (!Array.isArray(jsonObj.schemes)) throw new Error('Schema error: "schemes" must be an array.');
      setSchemes(jsonObj.schemes);
    }
    if (jsonObj.expenses) {
      if (!Array.isArray(jsonObj.expenses)) throw new Error('Schema error: "expenses" must be an array.');
      setExpenses(jsonObj.expenses);
    }
    if (jsonObj.dailyDiary) {
      if (!Array.isArray(jsonObj.dailyDiary)) throw new Error('Schema error: "dailyDiary" must be an array.');
      setDailyDiary(jsonObj.dailyDiary);
    }
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
      karigarVouchers,
      issueMetalToKarigar,
      receiveOrnamentFromKarigar,
      invoices,
      createInvoice,
      udhaarList,
      recordUdhaarDeposit,
      createGirviLoan,
      schemes,
      schemeEnrollments,
      enrollCustomerInScheme,
      recordSchemeInstallment,
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
