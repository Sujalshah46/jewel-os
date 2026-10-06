import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  ShieldCheck,
  Users,
  Building2,
  Package,
  Receipt,
  Settings,
  Globe,
  Activity,
  Layers,
  DollarSign,
  Tag,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Server,
  Zap,
  Award
} from 'lucide-react';

import AdminOverviewTab from './AdminOverviewTab';
import AdminClientsTab from './AdminClientsTab';
import AdminOrgBranchesTab from './AdminOrgBranchesTab';
import AdminStaffRolesTab from './AdminStaffRolesTab';
import AdminCatalogueTab from './AdminCatalogueTab';
import AdminInventoryTab from './AdminInventoryTab';
import AdminSalesPosTab from './AdminSalesPosTab';
import AdminCustomersTab from './AdminCustomersTab';
import AdminFinanceTab from './AdminFinanceTab';
import AdminIntegrationsTab from './AdminIntegrationsTab';
import AdminAuditLogTab from './AdminAuditLogTab';
import AdminSettingsTab from './AdminSettingsTab';

export default function AdminPanel({ onSwitchToRetail }) {
  const {
    activeClient,
    clients,
    currentRole,
    setActiveModule
  } = useJewellery();

  const [activeTab, setActiveTab] = useState('clients'); // Default to the user's primary focus: client & module management

  const adminTabs = [
    { id: 'clients', label: 'Clients & SaaS Modules', icon: Users, highlight: true },
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'organization', label: 'Firms & Branches', icon: Building2 },
    { id: 'staff', label: 'Staff & Roles (RBAC)', icon: ShieldCheck },
    { id: 'catalogue', label: 'Catalogue & Pricing', icon: Tag },
    { id: 'inventory', label: 'Inventory & Transfers', icon: Package },
    { id: 'sales', label: 'Sales & POS Policies', icon: Receipt },
    { id: 'customers', label: 'Customers & Loyalty', icon: Award },
    { id: 'finance', label: 'Finance & Accounts', icon: DollarSign },
    { id: 'integrations', label: 'Integrations Hub', icon: Globe },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'clients':
        return <AdminClientsTab />;
      case 'organization':
        return <AdminOrgBranchesTab />;
      case 'staff':
        return <AdminStaffRolesTab />;
      case 'catalogue':
        return <AdminCatalogueTab />;
      case 'inventory':
        return <AdminInventoryTab />;
      case 'sales':
        return <AdminSalesPosTab />;
      case 'customers':
        return <AdminCustomersTab />;
      case 'finance':
        return <AdminFinanceTab />;
      case 'integrations':
        return <AdminIntegrationsTab />;
      case 'audit':
        return <AdminAuditLogTab />;
      case 'settings':
        return <AdminSettingsTab />;
      default:
        return <AdminClientsTab />;
    }
  };

  const currentTabObj = adminTabs.find(t => t.id === activeTab) || adminTabs[0];

  return (
    <div className="space-y-6">
      {/* Top Admin Control Header */}
      <div className="bg-[#0B0F19] border border-amber-500/30 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-[1px] shadow-lg shadow-amber-500/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                SaaS Administrator Suite
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Multi-Tenant Node</span>
            </div>
            <h1 className="text-lg md:text-xl font-serif font-bold text-slate-100 uppercase tracking-wider mt-0.5">
              JEWELLERY OS — PRODUCTION ADMIN PANEL
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Active Tenant Workspace Indicator */}
          <div className="bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 leading-none">Active Tenant</p>
              <p className="font-bold text-amber-200 leading-tight truncate max-w-[150px]">
                {activeClient?.name}
              </p>
            </div>
          </div>

          {/* Role Chip */}
          <div className="bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-slate-200">{currentRole}</span>
          </div>

          {/* Return to Retail Store POS Button */}
          <button
            type="button"
            onClick={onSwitchToRetail || (() => setActiveModule('billing'))}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02] active:scale-95"
            title="Return to Showroom POS & Retail Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-slate-950" />
            <span>← Return to Retail Store POS (F2)</span>
          </button>
        </div>
      </div>

      {/* Admin Horizontal Tabs Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-xl">
        {adminTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : tab.highlight
                  ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Breadcrumb Context */}
      <div className="flex items-center text-xs text-slate-400 space-x-1.5 px-1">
        <span>Administration</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="font-bold text-amber-300">{currentTabObj.label}</span>
      </div>

      {/* Main Tab Rendering Area */}
      <div className="transition-all duration-150">
        {renderTabContent()}
      </div>
    </div>
  );
}
