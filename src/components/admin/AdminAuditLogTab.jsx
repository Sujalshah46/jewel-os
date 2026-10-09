import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  AlertTriangle,
  Activity,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function AdminAuditLogTab() {
  const { auditLogs } = useJewellery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'SaaS Platform', 'Organization', 'Staff & Roles', 'Inventory', 'Pricing', 'Integrations'];

  const filteredLogs = auditLogs.filter(log => {
    const matchesCat = selectedCategory === 'All' || log.category === selectedCategory;
    const matchesSearch =
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actorName && log.actorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SYSTEM SECURITY & AUDIT TRAIL
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Local demonstration event history. These records can be edited or replaced and are not a security audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Integrity: Unverified</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, target or keyword..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Recorded Audit Events ({filteredLogs.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Browser history • No tamper protection
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Operational Details</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <p className="font-bold text-slate-200">{log.actorName}</p>
                    <span className="text-[10px] text-amber-400/90">{log.actorRole}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-amber-300 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-200 max-w-[160px] truncate">
                    {log.target}
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-xs truncate text-[11px]">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        log.status === 'Success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
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
