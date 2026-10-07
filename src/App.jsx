import React, { useState, useEffect } from 'react';
import { JewelleryProvider, useJewellery } from './context/JewelleryContext';
import AppShell, { DesktopSidebar } from './components/layout/AppShell';
import CalculatorModal from './components/common/CalculatorModal';
import DashboardModule from './components/modules/DashboardModule';
import StockModule from './components/modules/StockModule';
import BillingModule from './components/modules/BillingModule';
import UdhaarLoanModule from './components/modules/UdhaarLoanModule';
import DailyDiaryModule from './components/modules/DailyDiaryModule';
import CustomerModule from './components/modules/CustomerModule';
import KarigarModule from './components/modules/KarigarModule';
import SchemeModule from './components/modules/SchemeModule';
import ECommerceModule from './components/modules/ECommerceModule';
import TagGeneratorModule from './components/modules/TagGeneratorModule';
import SmsWhatsappModule from './components/modules/SmsWhatsappModule';
import AccountsReportsModule from './components/modules/AccountsReportsModule';
import DailyRatesModule from './components/modules/DailyRatesModule';
import FirmMasterModule from './components/modules/FirmMasterModule';
import BackupRestoreModule from './components/modules/BackupRestoreModule';
import InvoiceViewModal from './components/modules/InvoiceViewModal';
import EstimateModal from './components/modules/EstimateModal';
import AdminPanel from './components/admin/AdminPanel';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Lock, ShieldAlert } from 'lucide-react';

function MainApp() {
  const {
    activeModule,
    setActiveModule,
    previewInvoice,
    setPreviewInvoice,
    previewEstimate,
    setPreviewEstimate,
    isModuleEnabled,
    activeClient
  } = useJewellery();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Dedicated Portal State: 'retail' vs 'admin'
  const [currentPortal, setCurrentPortal] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      return 'admin';
    }
    return activeModule === 'admin' ? 'admin' : 'retail';
  });

  // Synchronize URL Hash and browser history
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentPortal('admin');
      } else {
        setCurrentPortal('retail');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const switchPortal = (portal) => {
    setCurrentPortal(portal);
    if (portal === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#retail';
      if (activeModule === 'admin') {
        setActiveModule('dashboard');
      }
    }
  };

  // Keyboard Shortcuts (F2 -> POS Billing, Esc -> Close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (currentPortal === 'admin') {
          switchPortal('retail');
        }
        setActiveModule('billing');
      }
      if (e.key === 'Escape') {
        if (previewInvoice) setPreviewInvoice(null);
        if (previewEstimate) setPreviewEstimate(null);
        if (calculatorOpen) setCalculatorOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewInvoice, previewEstimate, calculatorOpen, mobileMenuOpen, currentPortal, setActiveModule, setPreviewInvoice, setPreviewEstimate]);

  // =========================================================================
  // 1. DEDICATED SAAS PLATFORM ADMIN PORTAL VIEW (Independent Full-Screen UI)
  // =========================================================================
  if (currentPortal === 'admin') {
    return (
      <div className="jos-app jos-light-module jos-admin-portal min-h-screen flex flex-col font-sans">
        <main className="jos-main flex-1 w-full">
          <AdminPanel onSwitchToRetail={() => switchPortal('retail')} />
        </main>

        {/* Dedicated Admin Console Footer */}
        <footer className="no-print jos-footer">
          <div className="flex items-center space-x-3">
            <span className="font-bold">Jewellery OS</span>
            <span>•</span>
            <span>Local SaaS administration demonstration</span>
            <span>•</span>
            <span>No server-side tenant enforcement</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => switchPortal('retail')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>← Return to Retail Store POS (F2)</span>
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // 2. DEDICATED RETAIL STORE POS & SHOWROOM PORTAL VIEW
  // =========================================================================
  const renderActiveModule = () => {
    // Module Entitlement Guard
    if (!isModuleEnabled(activeModule)) {
      return (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-100">
              Module Access Restricted
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              This module is not enabled for <strong className="text-amber-300">{activeClient?.name}</strong> under the current <strong>{activeClient?.plan}</strong> plan.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => switchPortal('admin')}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Open SaaS Admin Panel to Enable Module
            </button>
            <button
              onClick={() => setActiveModule('dashboard')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'stock':
        return <StockModule />;
      case 'billing':
        return <BillingModule />;
      case 'udhaar':
        return <UdhaarLoanModule />;
      case 'daily_diary':
        return <DailyDiaryModule />;
      case 'customers':
        return <CustomerModule />;
      case 'karigars':
        return <KarigarModule />;
      case 'schemes':
        return <SchemeModule />;
      case 'ecommerce':
        return <ECommerceModule />;
      case 'tags':
        return <TagGeneratorModule />;
      case 'sms_whatsapp':
        return <SmsWhatsappModule />;
      case 'accounts_reports':
        return <AccountsReportsModule />;
      case 'daily_rates':
        return <DailyRatesModule />;
      case 'firm_master':
        return <FirmMasterModule />;
      case 'backup':
        return <BackupRestoreModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="jos-app min-h-screen flex flex-col font-sans">
      <AppShell
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenCalculator={() => setCalculatorOpen(prev => !prev)}
        onSwitchToAdmin={() => switchPortal('admin')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Unified Left Sidebar for Desktop Store Operations */}
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          onOpenCalculator={() => setCalculatorOpen(prev => !prev)}
          onSwitchToAdmin={() => switchPortal('admin')}
        />

        {/* Main Content Area */}
        <main className="jos-main flex-1 overflow-y-auto w-full">
          <div className="jos-light-module jos-module-frame">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Floating Modals */}
      <div className="jos-light-module">
        <CalculatorModal isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
        <InvoiceViewModal />
        <EstimateModal />
      </div>

      {/* Bottom Footer with Status */}
      <footer className="no-print jos-footer">
        <div className="flex items-center space-x-3">
          <span className="font-bold">Jewellery OS</span>
          <span>•</span>
          <span>Jewellery Store POS &amp; Showroom Portal</span>
          <span>•</span>
          <span>Local demonstration workspace</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="jos-status-dot warning"></span>
            <span>No live payments, messaging or cloud sync</span>
          </span>
          <span>•</span>
          <span>Shortcut: <kbd>F2</kbd> New Bill</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <JewelleryProvider>
        <MainApp />
      </JewelleryProvider>
    </ErrorBoundary>
  );
}
