import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Key,
  Lock,
  Eye,
  Sliders,
  Check
} from 'lucide-react';

export default function AdminStaffRolesTab() {
  const {
    staffUsers,
    addStaffUser,
    updateStaffUser,
    deleteStaffUser,
    branches,
    systemRolesPermissions,
    currentRole,
    setCurrentRole
  } = useJewellery();

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState('Salesperson / Cashier');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Salesperson / Cashier',
    branchId: branches[0]?.id || 'BR-001',
    status: 'Active',
    discountLimitPercent: 5,
    maxRefundLimit: 10000,
    canAdjustStock: false,
    canChangeRates: false
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

  const handleOpenAddStaff = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Salesperson / Cashier',
      branchId: branches[0]?.id || 'BR-001',
      status: 'Active',
      discountLimitPercent: 5,
      maxRefundLimit: 10000,
      canAdjustStock: false,
      canChangeRates: false
    });
    setIsAddStaffModalOpen(true);
  };

  const handleSaveNewStaff = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Staff member name is required.', true);
      return;
    }
    try {
      addStaffUser(formData);
      setIsAddStaffModalOpen(false);
      showNotification(`Staff member "${formData.name}" added with role "${formData.role}".`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleSaveEditStaff = (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      updateStaffUser(editingStaff.id, {
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        branchId: editingStaff.branchId,
        status: editingStaff.status,
        discountLimitPercent: Number(editingStaff.discountLimitPercent) || 0,
        maxRefundLimit: Number(editingStaff.maxRefundLimit) || 0,
        canAdjustStock: editingStaff.canAdjustStock,
        canChangeRates: editingStaff.canChangeRates
      });
      setEditingStaff(null);
      showNotification(`Staff profile for "${editingStaff.name}" updated.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteStaff = (staffId, staffName) => {
    if (window.confirm(`Revoke access for staff member "${staffName}"?`)) {
      try {
        deleteStaffUser(staffId);
        showNotification(`Access revoked for "${staffName}".`);
      } catch (err) {
        showNotification(err.message, true);
      }
    }
  };

  const allRoleNames = Object.keys(systemRolesPermissions);

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
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              STAFF DIRECTORY & ROLE-BASED ACCESS (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage showroom staff, assign hierarchical roles, set cash & discount authorization ceilings, and restrict branch access.
          </p>
        </div>

        <button
          onClick={handleOpenAddStaff}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>INVITE STAFF MEMBER</span>
        </button>
      </div>

      {/* Live Role Switcher Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Interactive RBAC Simulator
            </span>
            <p className="text-xs text-slate-200 font-semibold">
              Currently operating as: <strong className="text-amber-300 underline">{currentRole}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Switch Role:</span>
          <select
            value={currentRole}
            onChange={(e) => {
              setCurrentRole(e.target.value);
              showNotification(`Switched active session view to "${e.target.value}".`);
            }}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
          >
            {allRoleNames.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between">
          <span>Active Staff Accounts ({staffUsers.length})</span>
          <span className="text-[11px] text-slate-400 normal-case">
            Branch-scoped and authorization-limited
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Staff Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Assigned Branch</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Max Discount</th>
                <th className="py-2.5 px-3">Max Refund</th>
                <th className="py-2.5 px-3">Stock Adjust</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {staffUsers.map(staff => {
                const branchObj = branches.find(b => b.id === staff.branchId);

                return (
                  <tr key={staff.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-100">{staff.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{staff.id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {branchObj?.name || 'All Branches'}
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-slate-200 font-mono text-[11px]">{staff.phone}</p>
                      <p className="text-slate-400 text-[10px] truncate max-w-[140px]">{staff.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {staff.discountLimitPercent}%
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      ₹{(staff.maxRefundLimit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      {staff.canAdjustStock ? (
                        <span className="text-emerald-400 font-bold text-[11px]">Authorized</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Locked</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          staff.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setEditingStaff(staff)}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Staff"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Remove Staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Permissions Matrix Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Key className="w-4 h-4" /> Role Capabilities & Permissions Contract
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Backend-ready capability matrix enforced on POS actions and financial ledgers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Inspect Role:</span>
            <select
              value={selectedRoleForMatrix}
              onChange={(e) => setSelectedRoleForMatrix(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none"
            >
              {allRoleNames.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div>
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span className="text-amber-400">{selectedRoleForMatrix}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {systemRolesPermissions[selectedRoleForMatrix]?.description}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Granted Capabilities ({systemRolesPermissions[selectedRoleForMatrix]?.permissions.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {systemRolesPermissions[selectedRoleForMatrix]?.permissions.map(perm => (
                <span
                  key={perm}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{perm}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- MODAL: INVITE STAFF ----------------- */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Invite Staff Member
                </h3>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="staff@store.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    PHONE / MOBILE
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 9822000000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    SECURITY ROLE
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    {allRoleNames.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ASSIGNED BRANCH
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX DISCOUNT LIMIT (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountLimitPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountLimitPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX REFUND APPROVAL (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxRefundLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxRefundLimit: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canAdjustStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, canAdjustStock: e.target.checked }))}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Authorize Physical Stock Adjustments & Write-Offs</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canChangeRates}
                    onChange={(e) => setFormData(prev => ({ ...prev, canChangeRates: e.target.checked }))}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Authorize Publishing Daily Bullion Rates</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save & Issue Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: EDIT STAFF ----------------- */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Edit Staff: {editingStaff.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ROLE
                  </label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    {allRoleNames.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    STATUS
                  </label>
                  <select
                    value={editingStaff.status}
                    onChange={(e) => setEditingStaff(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    DISCOUNT LIMIT (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingStaff.discountLimitPercent}
                    onChange={(e) => setEditingStaff(prev => ({ ...prev, discountLimitPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MAX REFUND LIMIT (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingStaff.maxRefundLimit}
                    onChange={(e) => setEditingStaff(prev => ({ ...prev, maxRefundLimit: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingStaff.canAdjustStock || false}
                    onChange={(e) => setEditingStaff(prev => ({ ...prev, canAdjustStock: e.target.checked }))}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Authorize Physical Stock Adjustments</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingStaff.canChangeRates || false}
                    onChange={(e) => setEditingStaff(prev => ({ ...prev, canChangeRates: e.target.checked }))}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Authorize Daily Rates Publishing</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
