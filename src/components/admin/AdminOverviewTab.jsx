import React from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Users,
  Building2,
  Package,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Server,
  Zap,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function AdminOverviewTab({ onNavigateTab }) {
  const {
    clients,
    activeClient,
    firms,
    branches,
    staffUsers,
    stock,
    invoices,
    dailyRates,
    allSystemModules,
    analytics,
    auditLogs
  } = useJewellery();

  // Metrics derived from live real data
  const totalClients = clients.length;
  const activeClientsCount = clients.filter(c => c.status === 'Active').length;
  const trialClientsCount = clients.filter(c => c.status === 'Trial').length;
  const totalBranches = branches.length;
  const totalStaff = staffUsers.length;

  const totalSalesRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.totalInvoiceAmount) || 0), 0);
  const totalStockItems = stock.filter(s => s.status === 'In Stock').length;
  const gold24kRate = dailyRates.find(r => r.karat?.includes('24K'))?.ratePerGram || 7200;

  // Client Plan Distribution
  const enterpriseCount = clients.filter(c => c.plan === 'Enterprise').length;
  const proCount = clients.filter(c => c.plan === 'Professional').length;
  const starterCount = clients.filter(c => c.plan === 'Starter').length;

  return (
    <div className="space-y-6">
      {/* SaaS Platform Health Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Server className="w-48 h-48 text-amber-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SaaS Super Administrator Control Node
              </span>
              <span className="text-xs text-slate-400 font-mono">v2.7.364 Multi-Tenant</span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-100">
              Jewellery OS Platform Command Center
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Currently supervising <strong className="text-amber-300">{totalClients} client organizations</strong> with multi-firm architectures, role-based security isolation, and dynamic module provisioning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('clients')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Manage Clients & Modules</span>
            </button>
            <button
              onClick={() => onNavigateTab('audit')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SaaS Clients</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">{totalClients}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="text-emerald-400 font-medium">{activeClientsCount} Active</span>
            <span className="text-amber-400 font-medium">{trialClientsCount} In Trial</span>
            <button
              onClick={() => onNavigateTab('clients')}
              className="text-amber-400 hover:underline font-bold"
            >
              Manage →
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Firms & Branches</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">{firms.length} Firms / {totalBranches} Branches</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{totalStaff} Staff Members</span>
            <button
              onClick={() => onNavigateTab('organization')}
              className="text-amber-400 hover:underline font-bold"
            >
              Show Branches →
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Local Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">{formatCurrency(analytics.totalStockValue)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{totalStockItems} Items in Stock</span>
            <span>Gold: {analytics.totalStockGoldGrams.toFixed(2)}g</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Invoiced</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">{formatCurrency(totalSalesRevenue)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{invoices.length} Bills Issued</span>
            <span>Udhaar: {formatCurrency(analytics.totalUdhaarOutstanding)}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Client Health & Module Allocation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Client Spotlight */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif font-bold text-slate-100 text-sm uppercase tracking-wide">
                Active Client Workspace: {activeClient?.name}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {activeClient?.plan} Plan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400">Subdomain & Code</p>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{activeClient?.subdomain}.jewelleryos.com</p>
              <p className="text-[10px] text-amber-400 mt-1">Code: {activeClient?.code}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400">Primary Contact</p>
              <p className="font-bold text-slate-200 mt-0.5">{activeClient?.contactPerson}</p>
              <p className="text-[10px] text-slate-400 mt-1">{activeClient?.phone}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400">License Expiration</p>
              <p className="font-mono font-bold text-emerald-400 mt-0.5">{activeClient?.validUntil}</p>
              <p className="text-[10px] text-slate-400 mt-1">Status: {activeClient?.status}</p>
            </div>
          </div>

          {/* Module Entitlement Preview for Active Client */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Module Entitlements ({activeClient?.enabledModules?.length || 0} / {allSystemModules.length} Enabled)
              </span>
              <button
                onClick={() => onNavigateTab('clients')}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Configure Entitlements →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allSystemModules.map(mod => {
                const isEnabled = activeClient?.enabledModules?.includes(mod.key);
                return (
                  <span
                    key={mod.key}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1 font-medium ${
                      isEnabled
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    {isEnabled ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <span className="w-3 h-3 text-center leading-none text-slate-600">✕</span>}
                    <span>{mod.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* License Plan Breakdown & Fast Shortcuts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-slate-100 text-sm uppercase tracking-wide border-b border-slate-800 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            License Plan Breakdown
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="text-slate-300 font-medium">Enterprise Tier</span>
              </div>
              <span className="font-mono font-bold text-purple-300">{enterpriseCount} Clients</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${(enterpriseCount / totalClients) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-slate-300 font-medium">Professional Tier</span>
              </div>
              <span className="font-mono font-bold text-blue-300">{proCount} Clients</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(proCount / totalClients) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-300 font-medium">Starter / Trial Tier</span>
              </div>
              <span className="font-mono font-bold text-amber-300">{starterCount} Clients</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full"
                style={{ width: `${(starterCount / totalClients) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Management Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('clients')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-xs font-semibold text-amber-300 flex items-center justify-between"
              >
                <span>+ Add Client</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('staff')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between"
              >
                <span>Staff & Roles</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('catalogue')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between"
              >
                <span>Jewellery Rules</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('integrations')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between"
              >
                <span>Integrations</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent System Audit Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-slate-100 text-sm uppercase tracking-wide">
              Recent Privileged Actions & Security Events
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('audit')}
            className="text-xs text-amber-400 hover:underline font-bold"
          >
            View Complete Log ({auditLogs.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-200">{log.actorName}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.actorRole}</td>
                  <td className="py-2.5 px-3 text-amber-300 font-medium">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.target}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
