import React, { useEffect, useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  CreditCard,
  Database,
  Gem,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Tag,
  TrendingUp,
  Users,
  X
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    title: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3 }]
  },
  {
    title: 'Sales',
    items: [
      { id: 'billing', label: 'POS Billing', icon: Receipt, badge: 'F2' },
      { id: 'schemes', label: 'Gold Schemes', icon: TrendingUp },
      { id: 'ecommerce', label: 'Digital Catalog', icon: ShoppingBag }
    ]
  },
  {
    title: 'Inventory',
    items: [
      { id: 'stock', label: 'Stock & Inventory', icon: Package },
      { id: 'tags', label: 'Tags & Barcodes', icon: Tag }
    ]
  },
  {
    title: 'Parties',
    items: [
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'karigars', label: 'Karigar Ledger', icon: Gem }
    ]
  },
  {
    title: 'Finance',
    items: [
      { id: 'udhaar', label: 'Loans & Udhaar', icon: CreditCard },
      { id: 'daily_diary', label: 'Daily Diary', icon: BookOpen },
      { id: 'accounts_reports', label: 'Reports & GST', icon: BarChart3 }
    ]
  },
  {
    title: 'Management',
    items: [
      { id: 'daily_rates', label: 'Daily Rates', icon: TrendingUp },
      { id: 'firm_master', label: 'Multi-Firm Setup', icon: Building2 },
      { id: 'sms_whatsapp', label: 'SMS & WhatsApp', icon: MessageSquare },
      { id: 'backup', label: 'Data & Backup', icon: Database }
    ]
  }
];

const allItems = NAVIGATION_GROUPS.flatMap(group => group.items);

export default function AppShell({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenCalculator
}) {
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
    apiMode
  } = useJewellery();
  const [firmDropdownOpen, setFirmDropdownOpen] = useState(false);
  const [ratesExpanded, setRatesExpanded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('jewellery-os-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('jewellery-os-theme', theme);
  }, [theme]);

  const activeLabel = allItems.find(item => item.id === activeModule)?.label || 'Dashboard';
  const gold24k = dailyRates.find(rate => rate.karat?.includes('24K'))?.ratePerGram || 7200;
  const gold22k = dailyRates.find(rate => rate.karat?.includes('22K'))?.ratePerGram || 6600.24;
  const silver999 = dailyRates.find(rate => rate.metalType === 'Silver' && rate.karat?.includes('999'))?.ratePerGram || 86;

  const openModule = moduleId => {
    setActiveModule(moduleId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="no-print jos-header">
        <div className="jos-header-main">
          <div className="jos-header-leading">
            <button
              type="button"
              className="jos-icon-button jos-mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              className="jos-icon-button jos-desktop-menu"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={20} />
            </button>
            <button type="button" className="jos-brand jos-header-brand" onClick={() => openModule('dashboard')}>
              <span className="jos-brand-mark"><Gem size={20} /></span>
              <span>
                <strong>Jewellery OS</strong>
                <small>{activeLabel}</small>
              </span>
            </button>
          </div>

          <div className="jos-global-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Global search"
              value={globalSearch}
              onChange={event => setGlobalSearch(event.target.value)}
              placeholder="Search item, barcode, customer or invoice"
            />
            <kbd>F2</kbd>
          </div>

          <div className="jos-header-actions">
            <div className="relative hidden md:block">
              <button
                type="button"
                className="jos-firm-button"
                onClick={() => setFirmDropdownOpen(!firmDropdownOpen)}
                aria-expanded={firmDropdownOpen}
              >
                <Building2 size={17} />
                <span>
                  <strong>{activeFirm.name}</strong>
                  <small>{activeFirm.city} · FY 2024–25</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {firmDropdownOpen && (
                <div className="jos-popover">
                  <p>Switch firm</p>
                  {firms.map(firm => (
                    <button
                      type="button"
                      key={firm.id}
                      className={firm.id === activeFirm.id ? 'is-active' : ''}
                      onClick={() => {
                        setActiveFirmId(firm.id);
                        setFirmDropdownOpen(false);
                      }}
                    >
                      <span>
                        <strong>{firm.name}</strong>
                        <small>{firm.city} · GSTIN {firm.gstin}</small>
                      </span>
                    </button>
                  ))}
                  <button type="button" onClick={() => openModule('firm_master')}>
                    <Settings size={15} /> Manage firm settings
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="jos-icon-button jos-theme-button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button type="button" className="jos-primary-button" onClick={() => openModule('billing')}>
              <Receipt size={18} />
              <span>New Bill</span>
              <kbd>F2</kbd>
            </button>
          </div>
        </div>

        <div className="jos-rate-strip">
          <button type="button" onClick={() => setRatesExpanded(!ratesExpanded)} aria-expanded={ratesExpanded}>
            <span className="jos-status-dot warning" />
            {apiMode ? 'Rate master' : 'Demo rate master'}
            <ChevronDown size={14} className={ratesExpanded ? 'rotate-180' : ''} />
          </button>
          <span><strong>24K</strong> ₹{gold24k.toLocaleString('en-IN')}/g</span>
          <span><strong>22K</strong> ₹{gold22k.toLocaleString('en-IN')}/g</span>
          <span><strong>Silver 999</strong> ₹{silver999.toLocaleString('en-IN')}/g</span>
          <span className="hidden lg:inline">{apiMode ? `Synced rates · updated ${mcxData.updatedAt || 'on load'}` : `Stored locally · MCX simulation updated ${mcxData.updatedAt || 'on load'}`}</span>
        </div>
        {ratesExpanded && (
          <div className="jos-rate-drawer">
            {dailyRates.map(rate => (
              <button type="button" key={rate.id} onClick={() => openModule('daily_rates')}>
                <span>{rate.metalType} {rate.karat}</span>
                <strong>₹{rate.ratePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g</strong>
              </button>
            ))}
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="no-print jos-mobile-shell">
          <button className="jos-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />
          <aside className="jos-mobile-drawer">
            <div className="jos-mobile-heading">
              <span className="jos-brand-mark"><Gem size={20} /></span>
              <span><strong>Jewellery OS</strong><small>{activeFirm.name}</small></span>
              <button className="jos-icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">
                <X size={19} />
              </button>
            </div>
            <Navigation
              activeModule={activeModule}
              openModule={openModule}
              collapsed={false}
            />
            <button
              type="button"
              className="jos-sidebar-utility"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              {theme === 'light' ? 'Dark appearance' : 'Light appearance'}
            </button>
            <button type="button" className="jos-sidebar-utility" onClick={onOpenCalculator}>
              <Calculator size={18} /> Gold Calculator
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

function Navigation({ activeModule, openModule, collapsed, isModuleEnabled = () => true }) {
  return (
    <nav className="jos-navigation" aria-label="Primary navigation">
      {NAVIGATION_GROUPS.map(group => (
        <div className="jos-nav-group" key={group.title}>
          {!collapsed && <p>{group.title}</p>}
          {group.items.map(item => {
            const Icon = item.icon;
            const enabled = isModuleEnabled(item.id);
            return (
              <button
                type="button"
                key={item.id}
                title={collapsed ? item.label : undefined}
                className={`${activeModule === item.id ? 'is-active' : ''} ${!enabled ? 'is-disabled' : ''}`}
                onClick={() => openModule(item.id)}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && <kbd>{item.badge}</kbd>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function DesktopSidebar({
  collapsed,
  activeModule,
  setActiveModule,
  onOpenCalculator,
  onSwitchToAdmin
}) {
  const { isModuleEnabled, activeFirm } = useJewellery();
  return (
    <aside className={`no-print jos-sidebar hidden lg:flex ${collapsed ? 'is-collapsed' : ''}`}>
      {!collapsed && (
        <div className="jos-sidebar-context">
          <span className="jos-brand-mark small"><Building2 size={17} /></span>
          <span>
            <small>Active workspace</small>
            <strong>{activeFirm.name}</strong>
          </span>
        </div>
      )}
      <Navigation
        activeModule={activeModule}
        openModule={setActiveModule}
        collapsed={collapsed}
        isModuleEnabled={isModuleEnabled}
      />
      <div className="jos-sidebar-footer">
        <button type="button" onClick={onOpenCalculator} title="Gold Calculator">
          <Calculator size={18} /> {!collapsed && <span>Gold Calculator</span>}
        </button>
        <button type="button" onClick={onSwitchToAdmin} title="SaaS Admin Panel">
          <ShieldCheck size={18} /> {!collapsed && <span>SaaS Admin Panel</span>}
        </button>
      </div>
    </aside>
  );
}
