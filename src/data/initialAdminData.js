// Initial Seed Data for SaaS Admin Panel & Multi-Tenant Management

export const ALL_SYSTEM_MODULES = [
  {
    key: 'dashboard',
    name: 'Executive Dashboard',
    description: 'High-level KPI metrics, sales summary, bullion tickers & stock charts',
    category: 'Core',
    required: true
  },
  {
    key: 'billing',
    name: 'Sell / POS Billing Engine',
    description: '27-Column deep jewellery billing, barcode scanner, old metal exchange & GST invoice',
    category: 'Sales',
    required: true
  },
  {
    key: 'stock',
    name: 'Stock & Inventory Management',
    description: '9-Tile stock dashboard, serialized jewellery, opening stock wizard, HUID tracking',
    category: 'Inventory',
    required: false
  },
  {
    key: 'customers',
    name: 'Customer CRM & Loyalty',
    description: 'Customer directory, purchase history, loyalty points, KYC documents',
    category: 'Parties',
    required: false
  },
  {
    key: 'karigars',
    name: 'Karigar (Goldsmith) Job Work',
    description: '24K bullion issue/return vouchers, wastage tracking, labour charges ledger',
    category: 'Manufacturing',
    required: false
  },
  {
    key: 'schemes',
    name: 'Gold Savings Schemes (11+1)',
    description: 'Chit funds, 11+1 bonus monthly installments, customer passbooks & maturity claims',
    category: 'Savings',
    required: false
  },
  {
    key: 'udhaar',
    name: 'Loans & Udhaar (Girvi)',
    description: 'Customer credit ledger, gold pledge pawn loans, monthly interest calculations',
    category: 'Credit',
    required: false
  },
  {
    key: 'daily_diary',
    name: 'Daily Diary (Day Cash Book)',
    description: 'Cash counter reconciliation, drawer balance, cash in/out journal',
    category: 'Cash',
    required: false
  },
  {
    key: 'ecommerce',
    name: 'Digital Catalogue & Online Store',
    description: 'WhatsApp storefront, social sharing, instant quotes & customer inquiries',
    category: 'Marketing',
    required: false
  },
  {
    key: 'tags',
    name: 'Jewellery Tag Layout Preview',
    description: 'Demo tag layout preview; barcode/QR payloads, HUID checks, and printer output are not implemented',
    category: 'Printing',
    required: false
  },
  {
    key: 'sms_whatsapp',
    name: 'SMS & WhatsApp Notifications',
    description: 'Direct transaction receipts, payment reminders, festival marketing campaigns',
    category: 'Marketing',
    required: false
  },
  {
    key: 'accounts_reports',
    name: 'Accounts & GST Reports',
    description: 'Dynamic P&L, Trial Balance, Balance Sheet, Stock Valuation, HSN GST summary',
    category: 'Finance',
    required: false
  },
  {
    key: 'daily_rates',
    name: 'Daily Rates & Digital LED Board',
    description: 'Today bullion prices (24K, 22K, 18K, Silver) and customer-facing LED rate board',
    category: 'Pricing',
    required: false
  },
  {
    key: 'firm_master',
    name: 'Multi-Firm Setup',
    description: 'Multi-firm configuration, GSTIN, bank accounts, UPI QR code & invoice templates',
    category: 'Master',
    required: false
  },
  {
    key: 'backup',
    name: 'Database Backup & Sync',
    description: 'Offline JSON database export, import with validation, local recovery',
    category: 'System',
    required: false
  }
];

export const INITIAL_CLIENTS = [
  {
    id: 'CLIENT-001',
    name: 'Krishna Gems & Jewellers Group',
    code: 'KJJ-GROUP',
    subdomain: 'krishna',
    plan: 'Enterprise',
    status: 'Active',
    contactPerson: 'Rajesh Soni',
    email: 'admin@krishnajewellers.com',
    phone: '+91 8956693545',
    city: 'Pune',
    state: 'Maharashtra',
    maxUsers: 25,
    maxBranches: 5,
    storageQuotaMb: 5000,
    validUntil: '2026-12-31',
    createdAt: '2024-01-15',
    linkedFirmIds: ['FIRM-001'],
    enabledModules: [
      'dashboard',
      'billing',
      'stock',
      'customers',
      'karigars',
      'schemes',
      'udhaar',
      'daily_diary',
      'ecommerce',
      'tags',
      'sms_whatsapp',
      'accounts_reports',
      'daily_rates',
      'firm_master',
      'backup'
    ]
  },
  {
    id: 'CLIENT-002',
    name: 'Shubh Laxmi Retailers Pvt Ltd',
    code: 'SLJ-RETAIL',
    subdomain: 'shubhlaxmi',
    plan: 'Professional',
    status: 'Active',
    contactPerson: 'Amitabh Joshi',
    email: 'support@shubhlaxmi.com',
    phone: '+91 8551036608',
    city: 'Pune',
    state: 'Maharashtra',
    maxUsers: 10,
    maxBranches: 2,
    storageQuotaMb: 2000,
    validUntil: '2025-10-30',
    createdAt: '2024-03-20',
    linkedFirmIds: ['FIRM-002'],
    enabledModules: [
      'dashboard',
      'billing',
      'stock',
      'customers',
      'daily_diary',
      'accounts_reports',
      'daily_rates',
      'firm_master',
      'backup',
      'tags'
    ]
  },
  {
    id: 'CLIENT-003',
    name: 'Navkar Gold Ornaments',
    code: 'NGO-PUNE',
    subdomain: 'navkar',
    plan: 'Starter',
    status: 'Trial',
    contactPerson: 'Vipul Jain',
    email: 'vipul@navkargold.in',
    phone: '+91 9765432109',
    city: 'Nagpur',
    state: 'Maharashtra',
    maxUsers: 3,
    maxBranches: 1,
    storageQuotaMb: 500,
    validUntil: '2025-05-15',
    createdAt: '2024-09-01',
    linkedFirmIds: [],
    enabledModules: [
      'dashboard',
      'billing',
      'stock',
      'customers',
      'daily_rates'
    ]
  }
];

export const INITIAL_BRANCHES = [
  {
    id: 'BR-001',
    firmId: 'FIRM-001',
    name: 'Hadapsar Flagship Showroom',
    code: 'HDP-01',
    type: 'Showroom',
    address: 'Marvel Fuego, Office No. 402, Hadapsar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411028',
    phone: '+91 8956693545',
    managerName: 'Rajesh Soni',
    counters: ['Counter 1 (Gold Billing)', 'Counter 2 (Silver & Diamond)', 'Counter 3 (Exchange Desk)'],
    invoicePrefix: 'IS/HDP/',
    status: 'Active',
    linkedStockCount: 2
  },
  {
    id: 'BR-002',
    firmId: 'FIRM-001',
    name: 'Central Vault & Storage',
    code: 'VAULT-01',
    type: 'Warehouse',
    address: 'Hadapsar Industrial Estate, Unit 12',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411028',
    phone: '+91 8956582027',
    managerName: 'Kishore Patil',
    counters: ['Inward Inspection Bay', 'Karigar Issue Bay'],
    invoicePrefix: 'WH/HDP/',
    status: 'Active',
    linkedStockCount: 0
  },
  {
    id: 'BR-003',
    firmId: 'FIRM-002',
    name: 'Laxmi Road Heritage Branch',
    code: 'LXM-01',
    type: 'Showroom',
    address: 'Shop No 14, Laxmi Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411030',
    phone: '+91 8551036608',
    managerName: 'Amitabh Joshi',
    counters: ['Main Counter', 'Bridal Consultation Desk'],
    invoicePrefix: 'IS/LXM/',
    status: 'Active',
    linkedStockCount: 1
  }
];

export const INITIAL_STAFF = [
  {
    id: 'STAFF-001',
    name: 'Mansi Anil',
    email: 'mansi@jewelleryos.com',
    phone: '+91 9822019283',
    role: 'Platform Super Admin',
    branchId: 'BR-001',
    status: 'Active',
    discountLimitPercent: 15,
    maxRefundLimit: 100000,
    canAdjustStock: true,
    canChangeRates: true,
    lastActive: 'Just now'
  },
  {
    id: 'STAFF-002',
    name: 'Rajesh Soni',
    email: 'rajesh@krishnajewellers.com',
    phone: '+91 8956693545',
    role: 'Business Owner',
    branchId: 'BR-001',
    status: 'Active',
    discountLimitPercent: 12,
    maxRefundLimit: 50000,
    canAdjustStock: true,
    canChangeRates: true,
    lastActive: '10 mins ago'
  },
  {
    id: 'STAFF-003',
    name: 'Priya Verma',
    email: 'priya.v@krishnajewellers.com',
    phone: '+91 9822199201',
    role: 'Salesperson / Cashier',
    branchId: 'BR-001',
    status: 'Active',
    discountLimitPercent: 3,
    maxRefundLimit: 5000,
    canAdjustStock: false,
    canChangeRates: false,
    lastActive: 'Today, 11:30 AM'
  },
  {
    id: 'STAFF-004',
    name: 'Kishore Patil',
    email: 'kishore@krishnajewellers.com',
    phone: '+91 9822456789',
    role: 'Inventory Manager',
    branchId: 'BR-002',
    status: 'Active',
    discountLimitPercent: 0,
    maxRefundLimit: 0,
    canAdjustStock: true,
    canChangeRates: false,
    lastActive: 'Yesterday'
  },
  {
    id: 'STAFF-005',
    name: 'Sunil Joshi, CA',
    email: 'auditor@joshico.in',
    phone: '+91 9422012345',
    role: 'Read-only Auditor',
    branchId: 'BR-001',
    status: 'Active',
    discountLimitPercent: 0,
    maxRefundLimit: 0,
    canAdjustStock: false,
    canChangeRates: false,
    lastActive: '3 days ago'
  }
];

export const SYSTEM_ROLES_PERMISSIONS = {
  'Platform Super Admin': {
    description: 'Full cross-tenant access to manage clients, subscriptions, modules, and platform health',
    permissions: [
      'manage_clients',
      'manage_modules',
      'view_all_tenants',
      'manage_firms',
      'manage_branches',
      'manage_staff',
      'view_audit_logs',
      'manage_integrations',
      'manage_billing',
      'manage_stock',
      'adjust_stock',
      'approve_discounts',
      'view_reports',
      'manage_settings',
      'export_data'
    ]
  },
  'Business Owner': {
    description: 'Tenant administrator with unrestricted control over own firms, branches, staff, rates & finances',
    permissions: [
      'manage_firms',
      'manage_branches',
      'manage_staff',
      'view_audit_logs',
      'manage_integrations',
      'manage_billing',
      'manage_stock',
      'adjust_stock',
      'approve_discounts',
      'view_reports',
      'manage_settings',
      'export_data'
    ]
  },
  'Branch Manager': {
    description: 'Supervises branch sales, inventory receipts, staff counters & daily drawer reconciliation',
    permissions: [
      'manage_billing',
      'manage_stock',
      'adjust_stock',
      'approve_discounts',
      'view_reports',
      'view_audit_logs'
    ]
  },
  'Inventory Manager': {
    description: 'Demo stock adjustments and tag layout previews; transfer custody and barcode generation are unavailable',
    permissions: [
      'manage_stock',
      'adjust_stock',
      'view_reports'
    ]
  },
  'Salesperson / Cashier': {
    description: 'Processes sales POS bills, customer receipts, old gold exchange within discount thresholds',
    permissions: [
      'manage_billing'
    ]
  },
  'Karigar / Workshop Manager': {
    description: 'Issues bullion to goldsmiths, tracks stage loss, receives finished jewellery',
    permissions: [
      'manage_karigars',
      'manage_stock'
    ]
  },
  'Accountant': {
    description: 'Manages Day Book, Udhaar recoveries, bank reconciliation, GST filing reports and P&L',
    permissions: [
      'view_reports',
      'manage_billing',
      'manage_accounts'
    ]
  },
  'Read-only Auditor': {
    description: 'Read-only access to transaction ledgers, inventory counts, audit trails and balance sheets',
    permissions: [
      'view_reports',
      'view_audit_logs'
    ]
  }
};

export const INITIAL_CATALOGUE_SETTINGS = {
  categories: [
    { id: 'CAT-1', name: 'Rings', defaultWastagePercent: 3.5, hsnCode: '71131910' },
    { id: 'CAT-2', name: 'Necklaces & Chokers', defaultWastagePercent: 4.5, hsnCode: '71131920' },
    { id: 'CAT-3', name: 'Bangles & Kada', defaultWastagePercent: 3.0, hsnCode: '71131930' },
    { id: 'CAT-4', name: 'Earrings & Jhumkas', defaultWastagePercent: 4.0, hsnCode: '71131940' },
    { id: 'CAT-5', name: 'Chains & Mangalsutra', defaultWastagePercent: 2.5, hsnCode: '71131950' },
    { id: 'CAT-6', name: 'Coins & Bullion Bars', defaultWastagePercent: 0.5, hsnCode: '71131960' },
    { id: 'CAT-7', name: 'Silver Articles & Utensils', defaultWastagePercent: 6.0, hsnCode: '71141110' },
    { id: 'CAT-8', name: 'Diamond Solitaire Jewellery', defaultWastagePercent: 5.0, hsnCode: '71131990' }
  ],
  metalPurities: [
    { code: 'GOLD-24K', metal: 'Gold', karat: '24K', purityPercent: 100.0, description: 'Fine Gold 999 Bullion' },
    { code: 'GOLD-22K', metal: 'Gold', karat: '22K', purityPercent: 91.67, description: 'Hallmark 916 Standard' },
    { code: 'GOLD-20K', metal: 'Gold', karat: '20K', purityPercent: 83.34, description: 'Traditional Ornaments' },
    { code: 'GOLD-18K', metal: 'Gold', karat: '18K', purityPercent: 75.0, description: 'Hallmark 750 Diamond Mounts' },
    { code: 'GOLD-14K', metal: 'Gold', karat: '14K', purityPercent: 58.5, description: 'Modern Lightweight Jewels' },
    { code: 'SILV-999', metal: 'Silver', karat: '99.9%', purityPercent: 99.9, description: 'Fine Silver Bullion' },
    { code: 'SILV-925', metal: 'Silver', karat: '92.5%', purityPercent: 92.5, description: 'Sterling Silver 925' }
  ],
  weightUnits: ['Grams (g)', 'Milligrams (mg)', 'Tola (11.664g)', 'Carat (ct)', 'Kilogram (kg)'],
  makingChargeMethods: ['Per Gram (Gross Wt)', 'Flat Fixed Amount', 'Percentage (%) of Metal Base'],
  hallmarkChargePerPiece: 45.0,
  taxGstPercent: 3.0,
  allowNegativeStock: false,
  autoGenerateBarcode: true,
  barcodePrefix: 'JOS'
};

export const INITIAL_INTEGRATIONS = [
  {
    id: 'INT-PAY-01',
    category: 'Payments',
    name: 'Razorpay Payment Gateway & UPI',
    provider: 'Razorpay India',
    status: 'Connected',
    apiKeyMasked: 'rzp_live_••••••••••••9421',
    webhookStatus: 'Active',
    lastPing: '2 mins ago',
    endpoint: 'https://api.razorpay.com/v1',
    description: 'Instant UPI dynamic QR generation on counter POS'
  },
  {
    id: 'INT-POS-02',
    category: 'Payments',
    name: 'PineLabs EDC Card Machine',
    provider: 'Pine Labs',
    status: 'Ready',
    apiKeyMasked: 'pl_term_••••••••••••8819',
    webhookStatus: 'Standby',
    lastPing: '1 hour ago',
    endpoint: 'https://pos.pinelabs.com/api',
    description: 'Integrated card swipe terminal for contactless Visa/MasterCard'
  },
  {
    id: 'INT-MSG-01',
    category: 'Messaging',
    name: 'Gupshup WhatsApp Enterprise',
    provider: 'Gupshup API',
    status: 'Connected',
    apiKeyMasked: 'gup_wa_••••••••••••1092',
    webhookStatus: 'Active',
    lastPing: 'Just now',
    endpoint: 'https://api.gupshup.io/sm/api/v1/msg',
    description: 'Automated GST invoice PDF delivery & festive discount broadcasts'
  },
  {
    id: 'INT-SMS-02',
    category: 'Messaging',
    name: 'MSG91 DLT Registered SMS Gateway',
    provider: 'MSG91',
    status: 'Connected',
    apiKeyMasked: 'msg91_••••••••••••4432',
    webhookStatus: 'Active',
    lastPing: '4 hours ago',
    endpoint: 'https://api.msg91.com/api/v5',
    description: 'Transactional OTPs, payment receipts and gold scheme reminders'
  },
  {
    id: 'INT-GOV-01',
    category: 'Compliance',
    name: 'NIC GST E-Invoice & E-Way Bill',
    provider: 'Govt. of India NIC Portal',
    status: 'Connected',
    apiKeyMasked: 'nic_irn_••••••••••••5519',
    webhookStatus: 'Active',
    lastPing: 'Today, 09:15 AM',
    endpoint: 'https://einvoice1.gst.gov.in/api',
    description: 'Direct IRN number and QR code stamping for B2B tax compliance'
  },
  {
    id: 'INT-PRN-01',
    category: 'Hardware',
    name: 'TVS / Zebra Thermal Tag Printer',
    provider: 'ESC/POS Driver',
    status: 'Connected',
    apiKeyMasked: 'USB001 / COM3 (9600 baud)',
    webhookStatus: 'Local Ready',
    lastPing: 'Local Ready',
    endpoint: 'localhost:9100',
    description: 'Direct thermal barcode dumbbell jewellery tag printing'
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'AUD-901',
    timestamp: '2024-10-06 14:30:12',
    actorName: 'Mansi Anil',
    actorRole: 'Platform Super Admin',
    action: 'Client Created',
    category: 'SaaS Platform',
    target: 'Navkar Gold Ornaments (CLIENT-003)',
    details: 'Provisioned Starter Trial license with 5 active core modules',
    status: 'Success'
  },
  {
    id: 'AUD-902',
    timestamp: '2024-10-06 13:15:44',
    actorName: 'Mansi Anil',
    actorRole: 'Platform Super Admin',
    action: 'Module Entitlements Updated',
    category: 'SaaS Platform',
    target: 'Shubh Laxmi Retailers (CLIENT-002)',
    details: 'Enabled Tag & Barcode Studio module on client subscription plan',
    status: 'Success'
  },
  {
    id: 'AUD-903',
    timestamp: '2024-10-06 11:20:00',
    actorName: 'Rajesh Soni',
    actorRole: 'Business Owner',
    action: 'Daily Rates Published',
    category: 'Pricing',
    target: '24K Gold Rate adjusted to ₹7,200/g',
    details: 'Updated 22K (916) Hallmark rate to ₹6,600.24/g across all counters',
    status: 'Success'
  },
  {
    id: 'AUD-904',
    timestamp: '2024-10-06 10:05:18',
    actorName: 'Rajesh Soni',
    actorRole: 'Business Owner',
    action: 'Staff Invited',
    category: 'Staff & Roles',
    target: 'Priya Verma (STAFF-003)',
    details: 'Assigned role "Salesperson / Cashier" with 3% discount authorization ceiling',
    status: 'Success'
  },
  {
    id: 'AUD-905',
    timestamp: '2024-10-05 18:40:22',
    actorName: 'Kishore Patil',
    actorRole: 'Inventory Manager',
    action: 'Stock Item Registered',
    category: 'Inventory',
    target: 'STK-001 (Gold Men Ring 22K)',
    details: 'Registered 8.200g gross weight with HUID "H76291"',
    status: 'Success'
  },
  {
    id: 'AUD-906',
    timestamp: '2024-10-05 15:10:05',
    actorName: 'Mansi Anil',
    actorRole: 'Platform Super Admin',
    action: 'Integration Ping Tested',
    category: 'Integrations',
    target: 'NIC GST E-Invoice Portal',
    details: 'Verified health handshake: Status 200 OK (Response: 42ms)',
    status: 'Success'
  }
];
