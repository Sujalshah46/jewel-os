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

function MainApp() {
  const { activeModule, setActiveModule, previewInvoice, setPreviewInvoice, previewEstimate, setPreviewEstimate } = useJewellery();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Keyboard Shortcuts (F2 -> POS Billing, Esc -> Close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
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
  }, [previewInvoice, previewEstimate, calculatorOpen, mobileMenuOpen, setActiveModule, setPreviewInvoice, setPreviewEstimate]);

  const renderActiveModule = () => {
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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      <AppShell
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenCalculator={() => setCalculatorOpen(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Unified Left Sidebar for Desktop */}
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          onOpenCalculator={() => setCalculatorOpen(prev => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Floating Modals */}
      <CalculatorModal isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
      <InvoiceViewModal />
      <EstimateModal />

      {/* Bottom Footer with Status */}
      <footer className="no-print bg-[#080c14] border-t border-slate-800/80 py-2.5 px-6 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-serif font-bold text-amber-400">JEWELLERY OS</span>
          <span>•</span>
          <span>Online Munim Certified Architecture</span>
          <span>•</span>
          <span>Multi-Firm Cloud Sync Active</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>System Online</span>
          </span>
          <span>•</span>
          <span>Shortcut: <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">F2</kbd> (New Bill)</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <JewelleryProvider>
      <MainApp />
    </JewelleryProvider>
  );
}
