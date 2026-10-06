import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Sliders,
  Check,
  Building2,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

export default function AdminClientsTab() {
  const {
    clients,
    activeClientId,
    setActiveClientId,
    addClient,
    updateClient,
    toggleClientModule,
    deleteClient,
    allSystemModules
  } = useJewellery();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [selectedClientForModules, setSelectedClientForModules] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for Add Client
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subdomain: '',
    plan: 'Professional',
    status: 'Active',
    contactPerson: '',
    email: '',
    phone: '',
    city: 'Pune',
    state: 'Maharashtra',
    maxUsers: 10,
    maxBranches: 2,
    storageQuotaMb: 2000,
    validUntil: '2026-12-31',
    enabledModules: [
      'dashboard',
      'billing',
      'stock',
      'customers',
      'daily_rates',
      'accounts_reports',
      'daily_diary',
      'firm_master',
      'backup'
    ]
  });

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: 'CL-' + Math.floor(1000 + Math.random() * 9000),
      subdomain: '',
      plan: 'Professional',
      status: 'Active',
      contactPerson: '',
      email: '',
      phone: '',
      city: 'Pune',
      state: 'Maharashtra',
      maxUsers: 10,
      maxBranches: 2,
      storageQuotaMb: 2000,
      validUntil: '2026-12-31',
      enabledModules: [
        'dashboard',
        'billing',
        'stock',
        'customers',
        'daily_rates',
        'accounts_reports',
        'daily_diary',
        'firm_master',
        'backup'
      ]
    });
    setIsAddModalOpen(true);
  };

  const handlePlanPreset = (planName) => {
    let modules = [];
    if (planName === 'Enterprise') {
      modules = allSystemModules.map(m => m.key);
    } else if (planName === 'Professional') {
      modules = [
        'dashboard',
        'billing',
        'stock',
        'customers',
        'daily_rates',
        'accounts_reports',
        'daily_diary',
        'firm_master',
        'backup',
        'tags',
        'sms_whatsapp'
      ];
    } else {
      // Starter
      modules = ['dashboard', 'billing', 'stock', 'customers', 'daily_rates'];
    }
    setFormData(prev => ({
      ...prev,
      plan: planName,
      maxUsers: planName === 'Enterprise' ? 25 : planName === 'Professional' ? 10 : 3,
      maxBranches: planName === 'Enterprise' ? 5 : planName === 'Professional' ? 2 : 1,
      enabledModules: modules
    }));
  };

  const handleToggleModuleInForm = (moduleKey) => {
    const isCurrentlyChecked = formData.enabledModules.includes(moduleKey);
    let updated;
    if (isCurrentlyChecked) {
      // Dashboard and billing are required
      if (moduleKey === 'dashboard' || moduleKey === 'billing') {
        showNotification('Core Billing & Dashboard cannot be disabled.', true);
        return;
      }
      updated = formData.enabledModules.filter(m => m !== moduleKey);
    } else {
      updated = [...formData.enabledModules, moduleKey];
    }
    setFormData(prev => ({ ...prev, enabledModules: updated }));
  };

  const handleSubmitNewClient = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Client business name is required.', true);
      return;
    }
    try {
      const created = addClient(formData);
      setIsAddModalOpen(false);
      showNotification(`Client "${created.name}" created successfully with ${created.enabledModules.length} enabled modules!`);
    } catch (err) {
      showNotification(err.message || 'Failed to create client', true);
    }
  };

  const handleSaveEditClient = (e) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      updateClient(editingClient.id, {
        name: editingClient.name,
        contactPerson: editingClient.contactPerson,
        email: editingClient.email,
        phone: editingClient.phone,
        plan: editingClient.plan,
        status: editingClient.status,
        maxUsers: Number(editingClient.maxUsers) || 1,
        maxBranches: Number(editingClient.maxBranches) || 1,
        validUntil: editingClient.validUntil
      });
      setEditingClient(null);
      showNotification(`Client "${editingClient.name}" updated successfully!`);
    } catch (err) {
      showNotification(err.message || 'Failed to update client', true);
    }
  };

  const handleDeleteClient = (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action will remove all their tenant configuration.`)) {
      try {
        deleteClient(clientId);
        showNotification(`Client "${clientName}" removed successfully.`);
      } catch (err) {
        showNotification(err.message, true);
      }
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'All' || c.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header with Add Client Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              CLIENTS & MODULE ENTITLEMENTS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Control registered client accounts, license validity, branch quotas, and dynamically toggle individual module permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW CLIENT</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client by name, code, city..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end text-xs">
          <span className="text-slate-400 font-medium">Plan:</span>
          {['All', 'Enterprise', 'Professional', 'Starter'].map(plan => (
            <button
              key={plan}
              onClick={() => setFilterPlan(plan)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filterPlan === plan
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {plan}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map(client => {
          const isCurrentActive = client.id === activeClientId;
          const enabledCount = client.enabledModules?.length || 0;
          const totalCount = allSystemModules.length;

          return (
            <div
              key={client.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl transition-all relative flex flex-col justify-between ${
                isCurrentActive
                  ? 'border-amber-500 shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Active Badge */}
              {isCurrentActive && (
                <div className="absolute -top-3 right-4 bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                  Active Workspace
                </div>
              )}

              <div>
                {/* Client Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{client.name}</h3>
                    <p className="text-[11px] font-mono text-amber-300 mt-0.5">
                      {client.code} • {client.subdomain}.jewelleryos.com
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      client.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : client.status === 'Trial'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                {/* Details */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Subscription Tier:</span>
                    <span className="font-bold text-purple-300">{client.plan} Plan</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Contact Person:</span>
                    <span className="font-medium">{client.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Phone / Email:</span>
                    <span className="font-mono text-[11px] text-slate-300">{client.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Quotas:</span>
                    <span>Max {client.maxUsers} Users • {client.maxBranches} Branches</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Valid Until:</span>
                    <span className="font-mono text-emerald-400">{client.validUntil}</span>
                  </div>
                </div>

                {/* Module Bar */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 my-2">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-bold text-slate-300">Enabled Modules</span>
                    <span className="font-mono text-amber-400 font-bold">{enabledCount} / {totalCount}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full"
                      style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedClientForModules(client)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Modules</span>
                  </button>

                  <button
                    onClick={() => setEditingClient(client)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Info</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!isCurrentActive ? (
                    <button
                      onClick={() => {
                        setActiveClientId(client.id);
                        showNotification(`Switched active workspace to "${client.name}".`);
                      }}
                      className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                    >
                      Switch To Tenant
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-medium text-center">
                      Current Workspace
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/20 transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ----------------- MODAL 1: ADD NEW CLIENT ----------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Provision New SaaS Client Account
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewClient} className="space-y-4">
              {/* Presets by Plan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  QUICK PLAN TEMPLATE PRESET
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Starter', 'Professional', 'Enterprise'].map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => handlePlanPreset(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.plan === p
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {p} Tier
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                    CLIENT / BUSINESS NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
                    }))}
                    placeholder="e.g. Navkar Ornaments"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    CLIENT SHORT CODE
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    PRIMARY CONTACT PERSON
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="e.g. Vipul Jain"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    CONTACT PHONE / MOBILE
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 9822019283"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX ALLOWED USERS
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX ALLOWED BRANCHES
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxBranches}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxBranches: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    SUBSCRIPTION EXPIRY DATE
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ACCOUNT STATUS
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Module Entitlement Checkboxes */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    MODULE ENTITLEMENTS FOR THIS CLIENT ({formData.enabledModules.length} selected)
                  </label>
                  <div className="space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, enabledModules: allSystemModules.map(m => m.key) }))}
                      className="text-amber-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, enabledModules: ['dashboard', 'billing'] }))}
                      className="text-slate-400 hover:underline"
                    >
                      Reset Core Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {allSystemModules.map(mod => {
                    const isChecked = formData.enabledModules.includes(mod.key);
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModuleInForm(mod.key)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span className="truncate font-medium">{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  Provision Client Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: MANAGE MODULE ENTITLEMENTS LIVE ----------------- */}
      {selectedClientForModules && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h3 className="font-serif font-bold text-base text-slate-100">
                    Module Entitlements: {selectedClientForModules.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toggle which features this client organization can access. Changes apply immediately in real time.
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForModules(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick Bulk Toggles */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-300 font-semibold">Bulk Actions:</span>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    const allKeys = allSystemModules.map(m => m.key);
                    updateClient(selectedClientForModules.id, { enabledModules: allKeys });
                    setSelectedClientForModules(prev => ({ ...prev, enabledModules: allKeys }));
                    showNotification(`All modules enabled for "${selectedClientForModules.name}".`);
                  }}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => {
                    const coreOnly = ['dashboard', 'billing'];
                    updateClient(selectedClientForModules.id, { enabledModules: coreOnly });
                    setSelectedClientForModules(prev => ({ ...prev, enabledModules: coreOnly }));
                    showNotification(`Restricted to core modules for "${selectedClientForModules.name}".`);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
                >
                  Core Only
                </button>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {allSystemModules.map(mod => {
                const currentClient = clients.find(c => c.id === selectedClientForModules.id) || selectedClientForModules;
                const isEnabled = currentClient.enabledModules?.includes(mod.key);

                return (
                  <div
                    key={mod.key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isEnabled
                        ? 'bg-slate-950 border-amber-500/30'
                        : 'bg-slate-950/50 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-xs">{mod.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                          {mod.category}
                        </span>
                        {mod.required && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                            Required Core
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{mod.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={mod.required}
                      onClick={() => {
                        toggleClientModule(selectedClientForModules.id, mod.key);
                        setSelectedClientForModules(prev => {
                          const has = prev.enabledModules?.includes(mod.key);
                          const updated = has
                            ? prev.enabledModules.filter(m => m !== mod.key)
                            : [...(prev.enabledModules || []), mod.key];
                          return { ...prev, enabledModules: updated };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                      } ${mod.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isEnabled ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <span>Disabled</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedClientForModules(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: EDIT CLIENT PROFILE ----------------- */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Edit Client Profile: {editingClient.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  CLIENT BUSINESS NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    CONTACT PERSON
                  </label>
                  <input
                    type="text"
                    value={editingClient.contactPerson || ''}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    SUBSCRIPTION TIER
                  </label>
                  <select
                    value={editingClient.plan}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    STATUS
                  </label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX ALLOWED USERS
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingClient.maxUsers}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX ALLOWED BRANCHES
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingClient.maxBranches}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, maxBranches: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  RENEWAL / VALIDITY DATE
                </label>
                <input
                  type="date"
                  value={editingClient.validUntil}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
