import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Sparkles,
  Search,
  Building2,
  TrendingUp,
  Receipt,
  Package,
  Users,
  CreditCard,
  BookOpen,
  ShoppingBag,
  Settings,
  PlusCircle,
  Tag,
  MessageSquare,
  BarChart3,
  Database,
  ChevronDown,
  Menu,
  X,
  Calculator,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  HelpCircle,
  Lock,
  Server,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function AppShell({ sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, onOpenCalculator, onSwitchToAdmin }) {
  const {
    activeFirm,
    firms,
    setActiveFirmId,
    dailyRates,
    mcxData,
    activeModule,
    setActiveModule,
    globalSearch,
    setGlobalSearch,
    activeClient,
    currentRole,
    setCurrentRole,
    isModuleEnabled
  } = useJewellery();

  const [firmDropdownOpen, setFirmDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [ratesExpanded, setRatesExpanded] = useState(false);

  const gold24k = dailyRates.find(r => r.karat?.includes('24K'))?.ratePerGram || 7200;
  const gold22k = dailyRates.find(r => r.karat?.includes('22K'))?.ratePerGram || 6600.24;
  const gold18k = dailyRates.find(r => r.karat?.includes('18K'))?.ratePerGram || 5400;
  const silver999 = dailyRates.find(r => r.metalType === 'Silver' && r.karat?.includes('999'))?.ratePerGram || 86;

  // Retail Store Navigation Structure (SaaS Admin is a separate portal)
  const navigationGroups = [
    {
      title: 'Sales & POS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
        { id: 'billing', label: 'Sell / POS Billing', icon: Receipt, badge: 'F2', highlight: true },
        { id: 'schemes', label: 'Gold Schemes (11+1)', icon: TrendingUp },
        { id: 'ecommerce', label: 'Digital Catalog', icon: ShoppingBag }
      ]
    },
    {
      title: 'Inventory',
      items: [
        { id: 'stock', label: 'Stock & Inventory', icon: Package },
        { id: 'tags', label: 'Tag & Barcode Studio', icon: Tag }
      ]
    },
    {
      title: 'Parties & CRM',
      items: [
        { id: 'customers', label: 'Customer Directory', icon: Users },
        { id: 'karigars', label: 'Karigar Ledger', icon: Users }
      ]
    },
    {
      title: 'Loans & Cash Book',
      items: [
        { id: 'udhaar', label: 'Loans & Udhaar (Girvi)', icon: CreditCard },
        { id: 'daily_diary', label: 'Daily Diary (Cash Counter)', icon: BookOpen }
      ]
    },
    {
      title: 'Finance & Master',
      items: [
        { id: 'daily_rates', label: 'Daily Rates & LED Board', icon: TrendingUp },
        { id: 'accounts_reports', label: 'Accounts & GST Reports', icon: BarChart3 },
        { id: 'firm_master', label: 'Multi-Firm Setup', icon: Building2 },
        { id: 'sms_whatsapp', label: 'SMS & WhatsApp Panel', icon: MessageSquare },
        { id: 'backup', label: 'Backup & Database Sync', icon: Database }
      ]
    }
  ];

  return (
    <>
      {/* 1. Global Compact Top Header */}
      <header className="no-print sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
        {/* Compact Rate & Ticker Strip with Expand Toggle */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-3 md:px-5 py-1.5 text-xs text-slate-300 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-3 whitespace-nowrap min-w-max">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              RATES (TODAY):
            </span>

            <div className="flex items-center space-x-3 text-xs">
              <span>
                24K: <strong className="text-amber-200 font-mono">₹{(gold24k * 10).toLocaleString('en-IN')}</strong>
                <span className="text-[11px] text-slate-400 ml-0.5">/10g</span>
              </span>
              <span>•</span>
              <span>
                22K (916): <strong className="text-amber-300 font-mono">₹{(gold22k * 10).toLocaleString('en-IN')}</strong>
                <span className="text-[11px] text-slate-400 ml-0.5">/10g</span>
              </span>
              <span>•</span>
              <span>
                Silver 999: <strong className="text-slate-200 font-mono">₹{(silver999 * 1000).toLocaleString('en-IN')}</strong>
                <span className="text-[11px] text-slate-400 ml-0.5">/kg</span>
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800 text-[11px]">
              <span className="text-slate-400">MCX:</span>
              <span className="font-mono text-amber-300 font-medium">Gold ₹{mcxData.gold.toLocaleString('en-IN')}</span>
              <span className="text-emerald-400 font-mono text-[10px]">{mcxData.goldChange}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 whitespace-nowrap ml-auto">
            <button
              onClick={() => setRatesExpanded(!ratesExpanded)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px] flex items-center gap-1"
            >
              <span>{ratesExpanded ? 'Hide Rates' : 'All Rates & LED'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${ratesExpanded ? 'rotate-180' : ''}`} />
            </button>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Drawer: <strong className="text-emerald-400 font-mono">{formatCurrency(activeFirm.cashBalance)}</strong>
            </span>
          </div>
        </div>

        {/* Expandable Rate Details Drawer */}
        {ratesExpanded && (
          <div className="bg-slate-900 border-b border-amber-500/30 px-4 py-3 shadow-2xl transition-all">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              {dailyRates.map(rate => (
                <div key={rate.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-[11px] font-bold text-amber-400 uppercase">{rate.metalType} {rate.karat}</p>
                  <p className="text-base font-bold text-slate-100 font-mono mt-0.5">
                    ₹{rate.ratePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <span className="text-[10px] text-slate-400 font-normal">/g</span>
                  </p>
                  <p className="text-[10px] text-slate-400">₹{(rate.ratePerGram * 10).toLocaleString('en-IN')}/10g</p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => {
                  setRatesExpanded(false);
                  setActiveModule('daily_rates');
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
              >
                Open Rates Management & LED Board →
              </button>
            </div>
          </div>
        )}

        {/* Main Navbar */}
        <div className="px-3 md:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Mobile hamburger & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveModule('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-[1px] shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <div className="w-full h-full bg-[#0B0F19] rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-base md:text-lg tracking-wider text-slate-100 uppercase font-serif">
                    JEWELLERY <span className="text-amber-400">OS</span>
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Retail ERP & Point of Sale</p>
              </div>
            </div>

            {/* Firm Selector */}
            <div className="relative pl-3 border-l border-slate-800 hidden sm:block">
              <button
                type="button"
                onClick={() => setFirmDropdownOpen(!firmDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-900 border border-amber-500/30 hover:border-amber-400 px-3 py-1.5 rounded-xl text-left text-xs transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-200 leading-none">{activeFirm.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">GSTIN: {activeFirm.gstin}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
              </button>

              {firmDropdownOpen && (
                <div className="absolute left-3 top-full mt-1.5 w-64 bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-3 py-1 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Firm
                  </div>
                  {firms.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFirmId(f.id);
                        setFirmDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                        f.id === activeFirm.id ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{f.name}</p>
                        <p className="text-[10px] text-slate-400">{f.city}, {f.state}</p>
                      </div>
                      {f.id === activeFirm.id && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </button>
                  ))}
                  <div className="px-3 pt-2 border-t border-slate-800 mt-1">
                    <button
                      onClick={() => {
                        setActiveModule('firm_master');
                        setFirmDropdownOpen(false);
                      }}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Settings className="w-3 h-3" /> Manage Firm Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Universal Search */}
          <div className="flex-1 max-w-sm mx-2 hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search Item / Barcode (1201) / Customer / Invoice..."
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-500 rounded-xl pl-8 pr-12 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <div className="absolute right-2 top-1.5">
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">F2=Bill</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Separate Admin Portal Switcher */}
            <button
              type="button"
              onClick={onSwitchToAdmin || (() => setActiveModule('admin'))}
              title="Switch to SaaS Enterprise Admin Console"
              className="flex items-center space-x-1.5 px-3 md:px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 shadow-md cursor-pointer hover:border-amber-400"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="hidden sm:inline">ADMIN PANEL</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">SaaS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('billing')}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Receipt className="w-4 h-4 flex-shrink-0" />
              <span>NEW BILL (F2)</span>
            </button>

            <button
              type="button"
              onClick={onOpenCalculator}
              title="Gold & Jewellery Calculator"
              aria-label="Gold and Jewellery Calculator"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 transition-colors"
            >
              <Calculator className="w-4 h-4" />
            </button>

            {/* Profile & Role Switcher Chip */}
            <div className="relative hidden xl:block">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2 pl-2 border-l border-slate-800 text-xs text-left cursor-pointer hover:opacity-90"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center font-bold text-slate-950 text-[11px] shadow">
                  MA
                </div>
                <div>
                  <p className="font-semibold text-slate-200 leading-tight">Mansi Anil</p>
                  <p className="text-[10px] text-amber-400/90 leading-tight truncate max-w-[110px]">{currentRole}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-3 py-1 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Session Role
                  </div>
                  {[
                    'Platform Super Admin',
                    'Business Owner',
                    'Branch Manager',
                    'Salesperson / Cashier',
                    'Read-only Auditor'
                  ].map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setCurrentRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        r === currentRole ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{r}</span>
                      {r === currentRole && <span className="text-[10px] text-amber-400">Active</span>}
                    </button>
                  ))}
                  <div className="px-3 pt-2 border-t border-slate-800 mt-1">
                    <button
                      onClick={() => {
                        setActiveModule('admin');
                        setRoleDropdownOpen(false);
                      }}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Open Full Admin Panel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Slide-out Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-slate-950 border-r border-slate-800 h-full flex flex-col p-4 overflow-y-auto z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-base text-slate-100">JEWELLERY OS</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Firm Info */}
            <div className="py-3 border-b border-slate-800 text-xs text-slate-400">
              <p className="font-bold text-amber-300">{activeFirm.name}</p>
              <p className="text-[11px]">{activeFirm.city} • GST: {activeFirm.gstin}</p>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-4 py-4">
              {navigationGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    {group.title}
                  </p>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveModule(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : item.highlight
                            ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// 3. Desktop Collapsible Grouped Sidebar Component (Purely Store Operations)
export function DesktopSidebar({ collapsed, activeModule, setActiveModule, onOpenCalculator, onSwitchToAdmin }) {
  const { isModuleEnabled, activeClient } = useJewellery();

  const navigationGroups = [
    {
      title: 'Sales & POS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
        { id: 'billing', label: 'Sell / POS Billing', icon: Receipt, badge: 'F2', highlight: true },
        { id: 'schemes', label: 'Gold Schemes', icon: TrendingUp },
        { id: 'ecommerce', label: 'Digital Catalog', icon: ShoppingBag }
      ]
    },
    {
      title: 'Inventory',
      items: [
        { id: 'stock', label: 'Stock & Inventory', icon: Package },
        { id: 'tags', label: 'Tag & Barcode', icon: Tag }
      ]
    },
    {
      title: 'Parties',
      items: [
        { id: 'customers', label: 'Customers CRM', icon: Users },
        { id: 'karigars', label: 'Karigar Ledger', icon: Users }
      ]
    },
    {
      title: 'Loans & Cash Book',
      items: [
        { id: 'udhaar', label: 'Loans & Udhaar', icon: CreditCard },
        { id: 'daily_diary', label: 'Daily Diary', icon: BookOpen }
      ]
    },
    {
      title: 'Finance & Master',
      items: [
        { id: 'daily_rates', label: 'Daily Rates Master', icon: TrendingUp },
        { id: 'accounts_reports', label: 'Reports & GST', icon: BarChart3 },
        { id: 'firm_master', label: 'Multi-Firm Setup', icon: Building2 },
        { id: 'sms_whatsapp', label: 'SMS & WhatsApp', icon: MessageSquare },
        { id: 'backup', label: 'Data & Backup', icon: Database }
      ]
    }
  ];

  return (
    <aside
      className={`no-print hidden lg:flex flex-col bg-slate-950 border-r border-slate-800/90 transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex-1 py-4 overflow-y-auto no-scrollbar space-y-5 px-2">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 font-sans">
                {group.title}
              </p>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              const isEnabled = item.id === 'admin' || isModuleEnabled(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  title={collapsed ? `${item.label}${!isEnabled ? ' (Disabled on Plan)' : ''}` : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : !isEnabled
                      ? 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-400'
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-slate-950' : !isEnabled ? 'text-slate-600' : item.highlight ? 'text-amber-400' : 'text-slate-400'
                    }`} />
                    {!collapsed && (
                      <span className={`truncate ${!isEnabled ? 'line-through opacity-70' : ''}`}>
                        {item.label}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isEnabled ? (
                        <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-800 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Plan
                        </span>
                      ) : item.badge ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer with Calculator & Admin Switcher */}
      <div className="p-2 border-t border-slate-800 space-y-1.5">
        <button
          onClick={onOpenCalculator}
          className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'space-x-2 px-3 py-2'} rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold border border-amber-500/20 transition-colors`}
          title="Gold Calculator"
        >
          <Calculator className="w-4 h-4 text-amber-400 flex-shrink-0" />
          {!collapsed && <span>Gold Calculator</span>}
        </button>

        <button
          type="button"
          onClick={onSwitchToAdmin}
          className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'space-x-2 px-3 py-2'} rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer`}
          title="Switch to SaaS Admin Panel"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          {!collapsed && <span>SaaS Admin Panel</span>}
        </button>
      </div>
    </aside>
  );
}
