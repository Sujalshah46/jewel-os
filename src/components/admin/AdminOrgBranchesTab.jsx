import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Layers,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  Server
} from 'lucide-react';

export default function AdminOrgBranchesTab() {
  const {
    firms,
    activeFirm,
    setActiveFirmId,
    branches,
    addBranch,
    updateBranch,
    deleteBranch,
    stock
  } = useJewellery();

  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    firmId: activeFirm.id,
    type: 'Showroom',
    address: '',
    city: activeFirm.city || 'Pune',
    state: activeFirm.state || 'Maharashtra',
    pincode: activeFirm.pincode || '',
    phone: '',
    managerName: '',
    invoicePrefix: 'IS/BR/',
    counters: 'Counter 1 (Billing), Counter 2 (Exchange)',
    status: 'Active'
  });

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleOpenAddBranch = () => {
    setBranchFormData({
      name: '',
      code: 'BR-' + Math.floor(10 + Math.random() * 90),
      firmId: activeFirm.id,
      type: 'Showroom',
      address: '',
      city: activeFirm.city || 'Pune',
      state: activeFirm.state || 'Maharashtra',
      pincode: activeFirm.pincode || '',
      phone: activeFirm.phone || '',
      managerName: '',
      invoicePrefix: `IS/${Math.floor(10 + Math.random() * 90)}/`,
      counters: 'Counter 1, Counter 2',
      status: 'Active'
    });
    setIsAddBranchModalOpen(true);
  };

  const handleSaveNewBranch = (e) => {
    e.preventDefault();
    if (!branchFormData.name.trim()) {
      showNotification('Branch name is required', true);
      return;
    }
    try {
      const countersArray = branchFormData.counters
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      addBranch({
        ...branchFormData,
        counters: countersArray.length > 0 ? countersArray : ['Counter 1 (POS)']
      });
      setIsAddBranchModalOpen(false);
      showNotification(`Branch "${branchFormData.name}" added successfully.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleSaveEditBranch = (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    try {
      const countersArray = Array.isArray(editingBranch.counters)
        ? editingBranch.counters
        : editingBranch.counters.split(',').map(c => c.trim()).filter(Boolean);

      updateBranch(editingBranch.id, {
        name: editingBranch.name,
        code: editingBranch.code,
        type: editingBranch.type,
        address: editingBranch.address,
        city: editingBranch.city,
        phone: editingBranch.phone,
        managerName: editingBranch.managerName,
        invoicePrefix: editingBranch.invoicePrefix,
        counters: countersArray,
        status: editingBranch.status
      });
      setEditingBranch(null);
      showNotification(`Branch "${editingBranch.name}" updated successfully.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteBranch = (branchId, branchName) => {
    // Check if there are linked stock items
    const linkedStockCount = stock.filter(s => s.branchId === branchId).length;
    if (linkedStockCount > 0) {
      showNotification(`Cannot delete branch "${branchName}"! It currently has ${linkedStockCount} active stock items linked. Please transfer inventory first.`, true);
      return;
    }

    if (window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) {
      try {
        deleteBranch(branchId);
        showNotification(`Branch "${branchName}" removed.`);
      } catch (err) {
        showNotification(err.message, true);
      }
    }
  };

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
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              ORGANIZATION, FIRMS & BRANCHES
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Administer multi-firm legal entities, retail showrooms, central warehouses, and POS billing terminals.
          </p>
        </div>

        <button
          onClick={handleOpenAddBranch}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW BRANCH</span>
        </button>
      </div>

      {/* Section 1: Registered Firms */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> 1. Registered Legal Firms ({firms.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {firms.map(f => (
            <div
              key={f.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                f.id === activeFirm.id
                  ? 'bg-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{f.name}</h4>
                    <span className="text-[10px] font-mono text-amber-300">Code: {f.code}</span>
                  </div>
                  {f.id === activeFirm.id ? (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500 text-slate-950">
                      Active Firm
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveFirmId(f.id)}
                      className="text-[10px] px-2.5 py-1 rounded font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Make Active
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3 text-slate-300">
                  <div>
                    <span className="text-slate-400 text-[11px] block">GSTIN:</span>
                    <span className="font-mono">{f.gstin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">PAN:</span>
                    <span className="font-mono">{f.pan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Location:</span>
                    <span>{f.city}, {f.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Phone:</span>
                    <span>{f.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Bank: {f.bankName}</span>
                <span className="font-mono text-emerald-400 font-bold">A/C: {f.accountNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Showroom Branches & Warehouses */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> 2. Retail Showrooms & Storage Warehouses ({branches.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Scoped to Tenant Multi-Location Logistics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => {
            const linkedFirm = firms.find(f => f.id === branch.firmId);
            const linkedStockItems = stock.filter(s => s.branchId === branch.id).length;

            return (
              <div
                key={branch.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{branch.name}</h4>
                      <p className="text-[11px] font-mono text-amber-300">
                        {branch.code} • {branch.type}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        branch.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {branch.status}
                    </span>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{branch.address}, {branch.city}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{branch.phone || 'No direct phone'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Manager: <strong className="text-slate-200">{branch.managerName || 'Not Assigned'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Invoice Prefix: <strong className="text-amber-300">{branch.invoicePrefix}</strong>
                    </p>

                    {/* Counters */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Billing Terminals / Counters:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(branch.counters || ['Counter 1']).map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Inventory: <strong className="text-emerald-400 font-mono">{linkedStockItems} items</strong>
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setEditingBranch({
                        ...branch,
                        counters: Array.isArray(branch.counters) ? branch.counters.join(', ') : branch.counters
                      })}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id, branch.name)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------- MODAL: ADD BRANCH ----------------- */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Register New Branch / Warehouse
                </h3>
              </div>
              <button
                onClick={() => setIsAddBranchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                  BRANCH / SHOWROOM NAME *
                </label>
                <input
                  type="text"
                  required
                  value={branchFormData.name}
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Phoenix Mall Showroom"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    BRANCH SHORT CODE
                  </label>
                  <input
                    type="text"
                    value={branchFormData.code}
                    onChange={(e) => setBranchFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    LOCATION TYPE
                  </label>
                  <select
                    value={branchFormData.type}
                    onChange={(e) => setBranchFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    <option value="Showroom">Retail Showroom</option>
                    <option value="Warehouse">Storage Vault / Warehouse</option>
                    <option value="Workshop">Manufacturing Workshop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    INVOICE PREFIX
                  </label>
                  <input
                    type="text"
                    value={branchFormData.invoicePrefix}
                    onChange={(e) => setBranchFormData(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    BRANCH MANAGER NAME
                  </label>
                  <input
                    type="text"
                    value={branchFormData.managerName}
                    onChange={(e) => setBranchFormData(prev => ({ ...prev, managerName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  FULL ADDRESS
                </label>
                <input
                  type="text"
                  value={branchFormData.address}
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  BILLING COUNTERS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={branchFormData.counters}
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, counters: e.target.value }))}
                  placeholder="Counter 1 (Gold), Counter 2 (Diamond)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBranchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: EDIT BRANCH ----------------- */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Edit Branch: {editingBranch.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  BRANCH NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    SHORT CODE
                  </label>
                  <input
                    type="text"
                    value={editingBranch.code}
                    onChange={(e) => setEditingBranch(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    STATUS
                  </label>
                  <select
                    value={editingBranch.status}
                    onChange={(e) => setEditingBranch(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  MANAGER NAME
                </label>
                <input
                  type="text"
                  value={editingBranch.managerName || ''}
                  onChange={(e) => setEditingBranch(prev => ({ ...prev, managerName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  COUNTERS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={editingBranch.counters || ''}
                  onChange={(e) => setEditingBranch(prev => ({ ...prev, counters: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
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
