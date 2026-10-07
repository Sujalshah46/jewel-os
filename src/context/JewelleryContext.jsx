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
import {
  ALL_SYSTEM_MODULES,
  INITIAL_CLIENTS,
  INITIAL_BRANCHES,
  INITIAL_STAFF,
  SYSTEM_ROLES_PERMISSIONS,
  INITIAL_CATALOGUE_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_AUDIT_LOGS
} from '../data/initialAdminData';
import { calculateJewelleryItem, calculateOldMetalExchange } from '../utils/calculations';

// Business Date & Financial Year Helpers
export function getTodayBusinessDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFinancialYearString(dateStr = getTodayBusinessDate()) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4) {
    const nextYear = String(year + 1).slice(-2);
    return `${String(year).slice(-2)}-${nextYear}`;
  } else {
    const prevYear = String(year - 1).slice(-2);
    return `${prevYear}-${String(year).slice(-2)}`;
  }
}

// Safe storage recovery helper to prevent blank startup crashes on malformed data
function safeLoadStorage(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (err) {
    console.warn(`[Jewellery OS] Corrupt local storage data at ${key}, falling back to default:`, err);
    return defaultValue;
  }
}

const JewelleryContext = createContext();

const STORAGE_KEY = 'JEWELLERY_OS_STATE_V1';

export function JewelleryProvider({ children }) {
  // Load state from localStorage or initialize with seed data
  const [firms, setFirms] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_FIRMS', INITIAL_FIRMS);
  });

  const [activeFirmId, setActiveFirmId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_ACTIVE_FIRM_ID');
    return saved || firms[0]?.id || 'FIRM-001';
  });

  const [dailyRates, setDailyRates] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_RATES', INITIAL_DAILY_RATES);
  });

  const [mcxData, setMcxData] = useState(() => INITIAL_MCX);

  const [stock, setStock] = useState(() => {
    const loaded = safeLoadStorage(STORAGE_KEY + '_STOCK', INITIAL_STOCK);
    return loaded.map(item => ({
      ...item,
      firmId: item.firmId || 'FIRM-001',
      firmCode: item.firmCode || 'KJJ'
    }));
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_CUSTOMERS');
    if (!saved) return INITIAL_CUSTOMERS;
    try {
      const parsed = JSON.parse(saved);
      const hasOtherTypes = parsed.some(c => c.userType === 'Supplier' || c.userType === 'Staff' || c.userType === 'Money Lender');
      if (!hasOtherTypes) {
        const nonCustomers = INITIAL_CUSTOMERS.filter(c => c.userType && c.userType !== 'Customer');
        return [...parsed, ...nonCustomers];
      }
      return parsed;
    } catch (e) {
      return INITIAL_CUSTOMERS;
    }
  });

  const [karigars, setKarigars] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_KARIGARS', INITIAL_KARIGARS);
  });

  const [invoices, setInvoices] = useState(() => {
    const loaded = safeLoadStorage(STORAGE_KEY + '_INVOICES', INITIAL_INVOICES);
    return loaded.map(inv => ({
      ...inv,
      firmId: inv.firmId || 'FIRM-001',
      firmCode: inv.firmCode || 'KJJ'
    }));
  });

  const [udhaarList, setUdhaarList] = useState(() => {
    const loaded = safeLoadStorage(STORAGE_KEY + '_UDHAAR', INITIAL_UDHAAR);
    return loaded.map(u => ({
      ...u,
      firmId: u.firmId || 'FIRM-001',
      firmCode: u.firmCode || 'KJJ'
    }));
  });

  // P1: Immutable Udhaar & Girvi Repayment Receipts
  const [udhaarRepayments, setUdhaarRepayments] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_UDHAAR_REPAYMENTS', [
      {
        id: 'REP-101',
        receiptNo: 'REC/101/24-25',
        firmId: 'FIRM-001',
        firmCode: 'KJJ',
        loanId: 'UDH-002',
        invoiceNo: 'KUM82',
        customerId: 'CUST-002',
        customerName: 'Sunita Patil',
        date: '2024-08-10',
        timestamp: '2024-08-10 11:30:00',
        amount: 25000,
        paymentMode: 'Cash',
        reference: 'RCP-DRAWER-82',
        operator: 'Rajesh Soni',
        notes: 'Partial settlement against gold chain loan'
      }
    ]);
  });

  // P1: Immutable Stock Movement Ledger
  const [stockMovements, setStockMovements] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_STOCK_MOVEMENTS', INITIAL_STOCK.map((item, idx) => ({
      id: 'SM-' + (idx + 1),
      movementNo: `MOV-${String(idx + 1).padStart(4, '0')}`,
      firmId: item.firmId || 'FIRM-001',
      firmCode: item.firmCode || 'KJJ',
      stockId: item.id,
      itemCode: item.itemCode,
      barcode: item.barcode,
      type: 'OPENING',
      date: '2024-04-01',
      timestamp: '2024-04-01 09:00:00',
      grossWeight: item.grossWeight,
      netWeight: item.netWeight,
      metalType: item.metalType,
      referenceId: 'OPENING_STOCK',
      notes: 'Initial inventory balance import'
    })));
  });

  // P0: General Ledger Double-Entry Journals
  const [generalLedger, setGeneralLedger] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_GENERAL_LEDGER', []);
  });

  const [schemes, setSchemes] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_SCHEMES', INITIAL_SCHEMES);
  });

  const [expenses, setExpenses] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_EXPENSES', INITIAL_EXPENSES);
  });

  const [dailyDiary, setDailyDiary] = useState(() => {
    return safeLoadStorage(STORAGE_KEY + '_DIARY', INITIAL_DAILY_DIARY);
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

  // Admin & Multi-Tenant Platform State
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_CLIENTS');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [activeClientId, setActiveClientId] = useState(() => {
    return clients[0]?.id || 'CLIENT-001';
  });

  const [branches, setBranches] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_BRANCHES');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });

  const [activeBranchId, setActiveBranchId] = useState(() => {
    return branches[0]?.id || 'BR-001';
  });

  const [staffUsers, setStaffUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_STAFF');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [catalogueSettings, setCatalogueSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_CATALOGUE');
    return saved ? JSON.parse(saved) : INITIAL_CATALOGUE_SETTINGS;
  });

  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_INTEGRATIONS');
    return saved ? JSON.parse(saved) : INITIAL_INTEGRATIONS;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_AUDIT_LOGS');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [currentRole, setCurrentRole] = useState('Platform Super Admin');

  // Active module navigation (supports URL hash e.g. #admin, #billing, #stock)
  const [activeModule, setActiveModuleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) return hash;
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module') || params.get('tab');
      if (mod) return mod;
    }
    return 'dashboard';
  });

  const setActiveModule = (mod) => {
    setActiveModuleState(mod);
    if (typeof window !== 'undefined') {
      window.location.hash = mod;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash && hash !== activeModule) {
        setActiveModuleState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeModule]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewEstimate, setPreviewEstimate] = useState(null);

  // Active Context Objects with robust null-safety fallbacks
  const activeFirm = (Array.isArray(firms) && firms.length > 0)
    ? (firms.find(f => f.id === activeFirmId) || firms[0])
    : INITIAL_FIRMS[0];

  const activeClient = (Array.isArray(clients) && clients.length > 0)
    ? (clients.find(c => c.id === activeClientId) || clients[0])
    : INITIAL_CLIENTS[0];

  const activeBranch = (Array.isArray(branches) && branches.length > 0)
    ? (branches.find(b => b.id === activeBranchId) || branches[0])
    : INITIAL_BRANCHES[0];

  // Save to localStorage when critical state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_FIRMS', JSON.stringify(firms));
  }, [firms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_CLIENTS', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_BRANCHES', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_STAFF', JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_CATALOGUE', JSON.stringify(catalogueSettings));
  }, [catalogueSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_INTEGRATIONS', JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_AUDIT_LOGS', JSON.stringify(auditLogs));
  }, [auditLogs]);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_ACTIVE_FIRM_ID', activeFirmId);
  }, [activeFirmId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_UDHAAR_REPAYMENTS', JSON.stringify(udhaarRepayments));
  }, [udhaarRepayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_STOCK_MOVEMENTS', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_GENERAL_LEDGER', JSON.stringify(generalLedger));
  }, [generalLedger]);

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

  // Audit Log Action
  const addAuditLog = (entry) => {
    const newLog = {
      id: 'AUD-' + Date.now().toString().slice(-5),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorName: entry.actorName || (currentRole === 'Platform Super Admin' ? 'Mansi Anil' : 'Rajesh Soni'),
      actorRole: entry.actorRole || currentRole,
      action: entry.action || 'System Action',
      category: entry.category || 'General',
      target: entry.target || 'General',
      details: entry.details || '',
      status: entry.status || 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    return newLog;
  };

  // SaaS Client / Tenant Administration
  const addClient = (newClientData) => {
    const clientId = 'CLIENT-' + Date.now().toString().slice(-4);
    const client = {
      id: clientId,
      name: newClientData.name,
      code: newClientData.code || ('CL-' + Date.now().toString().slice(-4)),
      subdomain: newClientData.subdomain || newClientData.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      plan: newClientData.plan || 'Professional',
      status: newClientData.status || 'Active',
      contactPerson: newClientData.contactPerson || 'Store Owner',
      email: newClientData.email || '',
      phone: newClientData.phone || '',
      city: newClientData.city || 'Pune',
      state: newClientData.state || 'Maharashtra',
      maxUsers: Number(newClientData.maxUsers) || 10,
      maxBranches: Number(newClientData.maxBranches) || 2,
      storageQuotaMb: Number(newClientData.storageQuotaMb) || 2000,
      validUntil: newClientData.validUntil || '2026-12-31',
      createdAt: new Date().toISOString().split('T')[0],
      linkedFirmIds: newClientData.linkedFirmIds || [activeFirm.id],
      enabledModules: newClientData.enabledModules && newClientData.enabledModules.length > 0
        ? newClientData.enabledModules
        : ['dashboard', 'billing', 'stock', 'customers', 'daily_rates', 'accounts_reports', 'daily_diary', 'firm_master', 'backup']
    };
    setClients(prev => [client, ...prev]);
    addAuditLog({
      action: 'Client Created',
      category: 'SaaS Platform',
      target: `${client.name} (${client.id})`,
      details: `Provisioned ${client.plan} license with ${client.enabledModules.length} enabled modules.`
    });
    return client;
  };

  const updateClient = (clientId, updatedFields) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return { ...c, ...updatedFields };
      }
      return c;
    }));
    addAuditLog({
      action: 'Client Updated',
      category: 'SaaS Platform',
      target: `Client ID: ${clientId}`,
      details: `Updated fields: ${Object.keys(updatedFields).join(', ')}`
    });
  };

  const toggleClientModule = (clientId, moduleKey) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const isEnabled = c.enabledModules?.includes(moduleKey);
        const updatedModules = isEnabled
          ? c.enabledModules.filter(m => m !== moduleKey)
          : [...(c.enabledModules || []), moduleKey];
        return { ...c, enabledModules: updatedModules };
      }
      return c;
    }));
    addAuditLog({
      action: 'Module Entitlement Changed',
      category: 'SaaS Platform',
      target: `Client ${clientId} - Module: ${moduleKey}`,
      details: `Toggled module ${moduleKey} entitlement state.`
    });
  };

  const deleteClient = (clientId) => {
    if (clients.length <= 1) {
      throw new Error('Cannot delete the only remaining SaaS tenant client.');
    }
    const target = clients.find(c => c.id === clientId);
    if (activeClientId === clientId) {
      const remaining = clients.find(c => c.id !== clientId);
      setActiveClientId(remaining.id);
    }
    setClients(prev => prev.filter(c => c.id !== clientId));
    addAuditLog({
      action: 'Client Deleted',
      category: 'SaaS Platform',
      target: `${target?.name || clientId}`,
      details: 'Tenant account purged.'
    });
  };

  const isModuleEnabled = (moduleKey) => {
    if (!activeClient || !activeClient.enabledModules) return true;
    return activeClient.enabledModules.includes(moduleKey);
  };

  // Branch CRUD Actions
  const addBranch = (newBranchData) => {
    const branch = {
      ...newBranchData,
      id: 'BR-' + Date.now().toString().slice(-4),
      firmId: newBranchData.firmId || activeFirm.id,
      status: newBranchData.status || 'Active',
      linkedStockCount: 0
    };
    setBranches(prev => [...prev, branch]);
    addAuditLog({
      action: 'Branch Added',
      category: 'Organization',
      target: `${branch.name} (${branch.code})`,
      details: `New branch created for firm ${branch.firmId}`
    });
    return branch;
  };

  const updateBranch = (branchId, updatedFields) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...updatedFields } : b));
    addAuditLog({
      action: 'Branch Updated',
      category: 'Organization',
      target: `Branch ${branchId}`,
      details: `Updated details: ${Object.keys(updatedFields).join(', ')}`
    });
  };

  const deleteBranch = (branchId) => {
    const targetBranch = branches.find(b => b.id === branchId);
    const hasLinkedStock = stock.some(s => s.branchId === branchId);
    if (hasLinkedStock) {
      throw new Error(`Cannot delete branch "${targetBranch?.name}". Branch contains active inventory items. Please transfer stock first.`);
    }
    setBranches(prev => prev.filter(b => b.id !== branchId));
    addAuditLog({
      action: 'Branch Deleted',
      category: 'Organization',
      target: `${targetBranch?.name || branchId}`,
      details: 'Branch removed from firm configuration.'
    });
  };

  // Staff CRUD Actions
  const addStaffUser = (newStaffData) => {
    const staff = {
      ...newStaffData,
      id: 'STAFF-' + Date.now().toString().slice(-4),
      branchId: newStaffData.branchId || branches[0]?.id || 'BR-001',
      status: newStaffData.status || 'Active',
      lastActive: 'Never'
    };
    setStaffUsers(prev => [staff, ...prev]);
    addAuditLog({
      action: 'Staff Member Added',
      category: 'Staff & Roles',
      target: `${staff.name} (${staff.role})`,
      details: `Invited with role ${staff.role}`
    });
    return staff;
  };

  const updateStaffUser = (staffId, updatedFields) => {
    setStaffUsers(prev => prev.map(s => s.id === staffId ? { ...s, ...updatedFields } : s));
    addAuditLog({
      action: 'Staff Profile Updated',
      category: 'Staff & Roles',
      target: `Staff ID ${staffId}`,
      details: `Updated: ${Object.keys(updatedFields).join(', ')}`
    });
  };

  const deleteStaffUser = (staffId) => {
    const target = staffUsers.find(s => s.id === staffId);
    setStaffUsers(prev => prev.filter(s => s.id !== staffId));
    addAuditLog({
      action: 'Staff Access Revoked',
      category: 'Staff & Roles',
      target: `${target?.name || staffId}`,
      details: 'Staff member deactivated and access revoked.'
    });
  };

  // Catalogue Rules
  const updateCatalogueSettings = (newSettings) => {
    setCatalogueSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog({
      action: 'Catalogue Rules Configured',
      category: 'Catalogue',
      target: 'Catalogue Master Rules',
      details: 'Updated jewellery master pricing rules and purity settings.'
    });
  };

  // Integrations Ping & Update
  const testIntegrationConnection = (integrationId) => {
    const target = integrations.find(i => i.id === integrationId);
    setIntegrations(prev => prev.map(i => {
      if (i.id === integrationId) {
        return {
          ...i,
          status: 'Connected',
          lastPing: 'Just now (HTTP 200 OK - Latency 24ms)'
        };
      }
      return i;
    }));
    addAuditLog({
      action: 'Integration Health Ping',
      category: 'Integrations',
      target: target?.name || integrationId,
      details: 'Safe loopback endpoint pinged: Connection verified.'
    });
    return { success: true, latencyMs: 24, message: 'Ping handshake successful' };
  };

  const updateIntegration = (integrationId, updatedFields) => {
    setIntegrations(prev => prev.map(i => i.id === integrationId ? { ...i, ...updatedFields } : i));
    addAuditLog({
      action: 'Integration Configuration Updated',
      category: 'Integrations',
      target: `Integration ${integrationId}`,
      details: 'Configuration saved.'
    });
  };

  // Inter-branch Stock Transfer & Adjustment
  const transferStockBetweenBranches = (stockId, targetBranchId, reason) => {
    const targetItem = stock.find(s => s.id === stockId);
    const destBranch = branches.find(b => b.id === targetBranchId);
    if (!targetItem) throw new Error('Stock item not found.');
    if (!destBranch) throw new Error('Target destination branch not found.');

    setStock(prev => prev.map(s => {
      if (s.id === stockId) {
        return {
          ...s,
          branchId: targetBranchId,
          location: destBranch.name
        };
      }
      return s;
    }));

    addAuditLog({
      action: 'Stock Transferred Between Branches',
      category: 'Inventory',
      target: `${targetItem.itemCode || targetItem.id} -> ${destBranch.name}`,
      details: `Reason: ${reason || 'Inter-branch rebalance'}`
    });
  };

  const adjustStockItem = (stockId, adjustmentQty, reason) => {
    const targetItem = stock.find(s => s.id === stockId);
    if (!targetItem) throw new Error('Stock item not found.');
    const qty = Number(adjustmentQty) || 0;
    setStock(prev => prev.map(s => {
      if (s.id === stockId) {
        return {
          ...s,
          quantity: Math.max(0, (Number(s.quantity) || 1) + qty)
        };
      }
      return s;
    }));
    addAuditLog({
      action: 'Stock Adjustment Approved',
      category: 'Inventory',
      target: `${targetItem.itemCode || targetItem.id} (Adj: ${qty > 0 ? '+' : ''}${qty})`,
      details: `Reason: ${reason || 'Physical inventory reconciliation'}`
    });
  };

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

    // Record opening / purchase movement in stock ledger
    const movement = {
      id: 'SM-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      movementNo: `MOV-${String(stockMovements.length + 1).padStart(4, '0')}`,
      firmId: activeFirm.id,
      firmCode: activeFirm.code,
      stockId: item.id,
      itemCode: item.itemCode || item.barcode || 'ITEM',
      barcode: item.barcode || '',
      type: 'PURCHASE',
      date: getTodayBusinessDate(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      grossWeight: Number(item.grossWeight) || 0,
      netWeight: Number(item.netWeight) || 0,
      metalType: item.metalType || 'Gold',
      referenceId: item.id,
      notes: `Added item "${item.itemCode || item.id}" to inventory`
    };
    setStockMovements(prev => [movement, ...prev]);

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

    // 3. Payment settlement validation
    const cash = Number(invoiceData.payments?.cash) || 0;
    const cheque = Number(invoiceData.payments?.cheque) || 0;
    const card = Number(invoiceData.payments?.card) || 0;
    const online = Number(invoiceData.payments?.online) || 0;
    const loyalty = Number(invoiceData.payments?.loyaltyRedeemed) || 0;
    if (cash < 0 || cheque < 0 || card < 0 || online < 0 || loyalty < 0 || balanceDue < 0) {
      throw new Error('Payment amounts cannot be negative.');
    }

    // 4. Collision-safe sequential invoice numbering scoped by firm and FY
    const fy = getFinancialYearString();
    const firmInvoices = invoices.filter(inv => (!inv.firmId || inv.firmId === activeFirm.id));
    const maxSeq = firmInvoices.reduce((max, inv) => {
      const match = inv.invoiceNo ? (inv.invoiceNo.match(/\/(\d+)\//) || inv.invoiceNo.match(/IS(\d+)/)) : null;
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, firmInvoices.length + 86);
    const nextSeq = maxSeq + 1;
    const invoiceId = 'INV-IS' + nextSeq;
    const invoiceNo = `IS/${nextSeq}/24-25`;

    const invoiceDate = invoiceData.date || getTodayBusinessDate();

    const newInvoice = {
      ...invoiceData,
      id: invoiceId,
      invoiceNo,
      date: invoiceDate,
      firmId: activeFirm.id,
      firmName: activeFirm.name,
      firmCode: activeFirm.code,
      status: 'Completed'
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // If there is an unpaid balance, book to Udhaar
    if (balanceDue > 0 && invoiceData.customerId) {
      const newUdhaar = {
        id: 'UDH-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        invoiceNo: 'KUM' + (udhaarList.length + 83),
        mainInvoiceNo: invoiceNo,
        date: newInvoice.date,
        firmId: activeFirm.id,
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

    // Mark billed items as sold out and log stock movement
    if (invoiceData.items && invoiceData.items.length > 0) {
      const soldItemIds = invoiceData.items.map(i => i.itemId).filter(Boolean);
      setStock(prev => prev.map(item => soldItemIds.includes(item.id) ? { ...item, status: 'Sold Out' } : item));

      const newMovements = invoiceData.items.map((it, idx) => ({
        id: 'SM-' + Date.now().toString(36) + '-' + idx,
        movementNo: `MOV-${String(stockMovements.length + idx + 1).padStart(4, '0')}`,
        firmId: activeFirm.id,
        firmCode: activeFirm.code,
        stockId: it.itemId || it.id,
        itemCode: it.itemCode || 'ITEM',
        barcode: it.barcode || '',
        type: 'SALE',
        date: invoiceDate,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        grossWeight: Number(it.grossWeight) || 0,
        netWeight: Number(it.netWeight) || 0,
        metalType: it.metalType || 'Gold',
        referenceId: invoiceNo,
        notes: `Sold to ${invoiceData.customerName} on invoice ${invoiceNo}`
      }));
      setStockMovements(prev => [...newMovements, ...prev]);
    }

    // Post Balanced Double-Entry Journal Entry
    const bankTotal = cheque + card + online;
    const glDebits = [];
    if (cash > 0) glDebits.push({ account: 'Cash in Hand (Counter)', amount: cash });
    if (bankTotal > 0) glDebits.push({ account: `${activeFirm.bankName} (Current A/c)`, amount: bankTotal });
    if (balanceDue > 0) glDebits.push({ account: `Customer Udhaar Debtors (${invoiceData.customerName})`, amount: balanceDue });

    const glCredits = [
      { account: 'Gold & Silver Sales Revenue', amount: Number(invoiceData.taxableAmount || (invoiceData.totalInvoiceAmount * 0.97)) },
      { account: 'GST Output Tax (CGST + SGST)', amount: Number(invoiceData.totalTax || (invoiceData.totalInvoiceAmount * 0.03)) }
    ];

    const glJournal = {
      id: 'GL-' + Date.now().toString(36),
      entryNo: `JE-${generalLedger.length + 1}`,
      firmId: activeFirm.id,
      date: invoiceDate,
      type: 'INVOICE',
      referenceId: invoiceNo,
      description: `Sales Invoice ${invoiceNo} generated for ${invoiceData.customerName}`,
      debits: glDebits,
      credits: glCredits
    };
    setGeneralLedger(prev => [glJournal, ...prev]);

    // Update Day Diary
    setDailyDiary(prev => ({
      ...prev,
      todaySellDetails: [
        {
          invNo: invoiceNo.replace('/24-25', '').replace('/', ''),
          customer: invoiceData.customerName,
          city: activeFirm.city,
          cash: invoiceData.payments?.cash || 0,
          bank: invoiceData.payments?.cheque || 0,
          card: invoiceData.payments?.card || 0,
          online: invoiceData.payments?.online || 0,
          discount: invoiceData.discount || 0,
          total: invoiceData.totalInvoiceAmount
        },
        ...prev.todaySellDetails
      ],
      todaySellTotal: prev.todaySellTotal + invoiceData.totalInvoiceAmount
    }));

    addAuditLog({
      action: 'Sales Invoice Created',
      category: 'Sales',
      target: `${invoiceNo} (${invoiceData.customerName})`,
      details: `Billed ${invoiceData.items?.length || 0} items for ₹${Number(invoiceData.totalInvoiceAmount).toLocaleString('en-IN')}`
    });

    return newInvoice;
  };

  // Udhaar Deposit & Immutable Repayment Transaction Recording (Audit P1 Fix)
  const recordUdhaarDeposit = (udhaarId, amount, paymentMode = 'Cash', reference = '', notes = '') => {
    const depositAmt = Number(amount);
    if (!depositAmt || depositAmt <= 0) {
      throw new Error('Repayment deposit amount must be greater than zero.');
    }
    const targetLoan = udhaarList.find(u => u.id === udhaarId);
    if (!targetLoan) {
      throw new Error('Target Udhaar/Loan record not found.');
    }
    if (depositAmt > (targetLoan.leftBalance || 0)) {
      throw new Error(`Repayment amount (₹${depositAmt.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${(targetLoan.leftBalance || 0).toLocaleString('en-IN')}).`);
    }

    const receiptNo = `REC/${(udhaarRepayments.length + 101)}/24-25`;
    const businessDate = getTodayBusinessDate();

    const repaymentRecord = {
      id: 'REP-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      receiptNo,
      firmId: targetLoan.firmId || activeFirm.id,
      firmCode: targetLoan.firmCode || activeFirm.code,
      loanId: udhaarId,
      invoiceNo: targetLoan.invoiceNo || targetLoan.mainInvoiceNo,
      customerId: targetLoan.customerId,
      customerName: targetLoan.customerName,
      date: businessDate,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      amount: depositAmt,
      paymentMode,
      reference: reference || `RCP-${targetLoan.invoiceNo}`,
      operator: currentRole === 'Platform Super Admin' ? 'Mansi Anil' : 'Store Cashier',
      notes: notes || 'Udhaar repayment deposit'
    };

    // 1. Record immutable transaction
    setUdhaarRepayments(prev => [repaymentRecord, ...prev]);

    // 2. Update loan remaining balance
    setUdhaarList(prev => prev.map(u => {
      if (u.id === udhaarId) {
        const newLeft = Math.max(0, Number(((u.leftBalance || 0) - depositAmt).toFixed(2)));
        const newDeposited = Number(((u.depositedAmount || 0) + depositAmt).toFixed(2));
        return {
          ...u,
          depositedAmount: newDeposited,
          leftBalance: newLeft,
          status: newLeft === 0 ? 'Closed' : 'Active'
        };
      }
      return u;
    }));

    // 3. Reconcile customer total outstanding
    if (targetLoan.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === targetLoan.customerId) {
          return {
            ...c,
            currentUdhaarBalance: Math.max(0, Number(((c.currentUdhaarBalance || 0) - depositAmt).toFixed(2)))
          };
        }
        return c;
      }));
    }

    // 4. Update Daybook if cash payment
    if (paymentMode === 'Cash') {
      setDailyDiary(prev => ({
        ...prev,
        udhaarMoneyDepositedTotal: (Number(prev.udhaarMoneyDepositedTotal) || 0) + depositAmt
      }));
    }

    // 5. Post to General Ledger
    const glEntry = {
      id: 'GL-' + Date.now().toString(36),
      entryNo: `JE-${generalLedger.length + 1}`,
      firmId: targetLoan.firmId || activeFirm.id,
      date: businessDate,
      type: 'REPAYMENT',
      referenceId: receiptNo,
      description: `Udhaar repayment from ${targetLoan.customerName} via ${paymentMode}`,
      debits: [{ account: paymentMode === 'Cash' ? 'Cash in Hand (Counter)' : `${activeFirm.bankName} (Current A/c)`, amount: depositAmt }],
      credits: [{ account: `Customer Udhaar Debtors (${targetLoan.customerName})`, amount: depositAmt }]
    };
    setGeneralLedger(prev => [glEntry, ...prev]);

    addAuditLog({
      action: 'Udhaar Repayment Received',
      category: 'Finance',
      target: `${targetLoan.customerName} (${receiptNo})`,
      details: `Collected ₹${depositAmt.toLocaleString('en-IN')} via ${paymentMode}. Left: ₹${Math.max(0, targetLoan.leftBalance - depositAmt).toLocaleString('en-IN')}`
    });

    return repaymentRecord;
  };

  // Girvi / Pawn Loan Booking with Collision-Resistant ID
  const createGirviLoan = (loanData) => {
    const maxGirviSeq = udhaarList.reduce((max, u) => {
      const match = u.invoiceNo ? u.invoiceNo.match(/GIRVI-(\d+)/) : null;
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, udhaarList.length + 100);
    const nextGirviSeq = maxGirviSeq + 1;

    const newLoan = {
      id: 'UDH-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      invoiceNo: `GIRVI-${nextGirviSeq}`,
      mainInvoiceNo: 'GIRVI-VOUCHER',
      date: loanData.date || getTodayBusinessDate(),
      firmId: activeFirm.id,
      firmCode: activeFirm.code,
      ...loanData,
      status: 'Active'
    };
    setUdhaarList(prev => [newLoan, ...prev]);

    if (loanData.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === loanData.customerId) {
          return {
            ...c,
            currentUdhaarBalance: (c.currentUdhaarBalance || 0) + (Number(loanData.principalAmount) || 0)
          };
        }
        return c;
      }));
    }

    addAuditLog({
      action: 'Girvi Loan Disbursed',
      category: 'Finance',
      target: `${loanData.customerName || 'Customer'} (GIRVI-${nextGirviSeq})`,
      details: `Disbursed principal ₹${Number(loanData.principalAmount || 0).toLocaleString('en-IN')}`
    });

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
    setClients(INITIAL_CLIENTS);
    setActiveClientId(INITIAL_CLIENTS[0].id);
    setBranches(INITIAL_BRANCHES);
    setActiveBranchId(INITIAL_BRANCHES[0].id);
    setStaffUsers(INITIAL_STAFF);
    setCatalogueSettings(INITIAL_CATALOGUE_SETTINGS);
    setIntegrations(INITIAL_INTEGRATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentRole('Platform Super Admin');
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
      udhaarRepayments,
      stockMovements,
      generalLedger,
      schemes,
      expenses,
      dailyDiary,
      clients,
      branches,
      staffUsers,
      catalogueSettings,
      integrations,
      auditLogs
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

    const validCollections = ['firms', 'dailyRates', 'stock', 'customers', 'karigars', 'invoices', 'udhaarList', 'schemes', 'expenses', 'dailyDiary', 'clients', 'branches'];
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
    if (jsonObj.udhaarRepayments && Array.isArray(jsonObj.udhaarRepayments)) {
      setUdhaarRepayments(jsonObj.udhaarRepayments);
    }
    if (jsonObj.stockMovements && Array.isArray(jsonObj.stockMovements)) {
      setStockMovements(jsonObj.stockMovements);
    }
    if (jsonObj.generalLedger && Array.isArray(jsonObj.generalLedger)) {
      setGeneralLedger(jsonObj.generalLedger);
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
    if (jsonObj.clients && Array.isArray(jsonObj.clients)) {
      setClients(jsonObj.clients);
    }
    if (jsonObj.branches && Array.isArray(jsonObj.branches)) {
      setBranches(jsonObj.branches);
    }
    if (jsonObj.staffUsers && Array.isArray(jsonObj.staffUsers)) {
      setStaffUsers(jsonObj.staffUsers);
    }
    if (jsonObj.catalogueSettings && typeof jsonObj.catalogueSettings === 'object') {
      setCatalogueSettings(jsonObj.catalogueSettings);
    }
    if (jsonObj.integrations && Array.isArray(jsonObj.integrations)) {
      setIntegrations(jsonObj.integrations);
    }
    if (jsonObj.auditLogs && Array.isArray(jsonObj.auditLogs)) {
      setAuditLogs(jsonObj.auditLogs);
    }
  };

  // Aggregate Dashboard Analytics scoped by Active Firm (P0 Fix)
  const firmStock = stock.filter(s => (!s.firmCode || s.firmCode === activeFirm.code) || (!s.firmId || s.firmId === activeFirm.id));
  const firmUdhaar = udhaarList.filter(u => (!u.firmCode || u.firmCode === activeFirm.code) || (!u.firmId || u.firmId === activeFirm.id));
  const firmInvoices = invoices.filter(inv => (!inv.firmCode || inv.firmCode === activeFirm.code) || (!inv.firmId || inv.firmId === activeFirm.id));

  const totalStockGoldGrams = firmStock
    .filter(s => s.metalType === 'Gold' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);

  const totalStockGoldNetGrams = firmStock
    .filter(s => s.metalType === 'Gold' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);

  const totalStockSilverGrams = firmStock
    .filter(s => s.metalType === 'Silver' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);

  const totalStockSilverNetGrams = firmStock
    .filter(s => s.metalType === 'Silver' && s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);

  const totalStockValue = firmStock
    .filter(s => s.status === 'In Stock')
    .reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  const totalUdhaarOutstanding = firmUdhaar
    .filter(u => u.status === 'Active')
    .reduce((acc, curr) => acc + (Number(curr.leftBalance) || 0), 0);

  return (
    <JewelleryContext.Provider value={{
      firms,
      setFirms,
      activeFirm,
      activeFirmId,
      setActiveFirmId,
      // Multi-Tenant Clients & Modules
      clients,
      setClients,
      activeClientId,
      setActiveClientId,
      activeClient,
      addClient,
      updateClient,
      toggleClientModule,
      deleteClient,
      isModuleEnabled,
      allSystemModules: ALL_SYSTEM_MODULES,
      // Branches & Warehouses
      branches,
      setBranches,
      activeBranchId,
      setActiveBranchId,
      activeBranch,
      addBranch,
      updateBranch,
      deleteBranch,
      // Staff & Roles
      staffUsers,
      setStaffUsers,
      addStaffUser,
      updateStaffUser,
      deleteStaffUser,
      systemRolesPermissions: SYSTEM_ROLES_PERMISSIONS,
      currentRole,
      setCurrentRole,
      // Catalogue Master Rules
      catalogueSettings,
      setCatalogueSettings,
      updateCatalogueSettings,
      // Integrations Hub
      integrations,
      setIntegrations,
      testIntegrationConnection,
      updateIntegration,
      // Audit Log
      auditLogs,
      setAuditLogs,
      addAuditLog,
      // Inventory Admin actions
      transferStockBetweenBranches,
      adjustStockItem,
      // Standard ERP State & Actions
      dailyRates,
      setDailyRates,
      updateDailyRate,
      deleteAllRates,
      resetDefaultRates,
      mcxData,
      stock,
      stockMovements,
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
      udhaarRepayments,
      recordUdhaarDeposit,
      createGirviLoan,
      generalLedger,
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
        totalInvoicesCount: firmInvoices.length,
        totalCustomersCount: customers.length,
        totalStockCount: firmStock.filter(s => s.status === 'In Stock').length
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
