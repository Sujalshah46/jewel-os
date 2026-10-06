import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle,
  FileText,
  UserCheck,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function CustomerModule() {
  const { customers, addCustomer, updateCustomer, udhaarList } = useJewellery();
  const [activePartyTab, setActivePartyTab] = useState('CUSTOMER LIST *');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Customer Form State (Matching Audit 0:16 Customer Form)
  const [newCust, setNewCust] = useState({
    mr: 'Mr.',
    firstName: '',
    lastName: '',
    gender: 'Male',
    mobile: '',
    phone: '',
    fatherName: '',
    country: 'India',
    state: 'Maharashtra',
    city: 'Pune',
    pincode: '411028',
    address: '',
    dob: '1990-01-01',
    pan: '',
    aadhaar: '',
    kit: 'KIT-' + Math.floor(1000 + Math.random() * 9000),
    userType: 'Customer',
    email: '',
    creditLimit: 50000
  });

  const partyTabs = [
    'CUSTOMER LIST *',
    'SUPPLIER LIST',
    'STAFF LIST',
    'MONEY LENDER LIST'
  ];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCust.firstName || !newCust.mobile) {
      alert('First Name and Mobile Number are required.');
      return;
    }
    addCustomer({
      ...newCust,
      fullName: `${newCust.firstName} ${newCust.lastName}`.trim()
    });
    setShowAddModal(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm) ||
    c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.aadhaar?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Header matching Audit 0:16 & 11:39 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              PARTY & CUSTOMER CRM DIRECTORY
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Full KYC, Aadhaar & PAN Registry, Credit Limits and Live Ledger Balances
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ ADD NEW CUSTOMER</span>
        </button>
      </div>

      {/* Master Party Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {partyTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActivePartyTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activePartyTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[280px] flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Customer Name (Avinash, Deva), Mobile, Aadhaar, City..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-amber-300">{filteredCustomers.length}</strong> Registered Customers
        </div>
      </div>

      {/* Customer Directory Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(cust => (
          <div
            key={cust.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-slate-950 text-xs shadow">
                    {cust.firstName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{cust.mr} {cust.fullName}</h4>
                    <p className="text-[10px] text-amber-400/90 font-mono">KIT: {cust.kit || 'KIT-001'}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {cust.userType || 'Customer'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 my-3 font-medium">
                <p className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono">{cust.mobile}</span>
                  {cust.phone && <span className="text-slate-500 text-[10px]">({cust.phone})</span>}
                </p>

                <p className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{cust.address || `${cust.city}, ${cust.state}`}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <span className="text-slate-400">PAN: <strong className="font-mono text-slate-200">{cust.pan || 'N/A'}</strong></span>
                  <span className="text-slate-400">Aadhaar: <strong className="font-mono text-slate-200">{cust.aadhaar || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Udhaar Due:</span>
                <p className={`font-mono font-bold ${cust.currentUdhaarBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(cust.currentUdhaarBalance)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Loyalty Points:</span>
                <p className="font-mono font-bold text-amber-300">{cust.loyaltyPoints || 0} Pts</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Customer Modal (Matching Audit 0:16 Customer Form) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100 uppercase tracking-wider">
                  REGISTER NEW CUSTOMER (FULL KYC FORM)
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">TITLE</label>
                  <select
                    value={newCust.mr}
                    onChange={(e) => setNewCust(prev => ({ ...prev, mr: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="M/s">M/s (Company)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1">FIRST NAME *</label>
                  <input
                    type="text"
                    value={newCust.firstName}
                    onChange={(e) => setNewCust(prev => ({ ...prev, firstName: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">LAST NAME</label>
                  <input
                    type="text"
                    value={newCust.lastName}
                    onChange={(e) => setNewCust(prev => ({ ...prev, lastName: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1">MOBILE NUMBER *</label>
                  <input
                    type="text"
                    value={newCust.mobile}
                    onChange={(e) => setNewCust(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">FATHER / HUSBAND NAME (S/O)</label>
                  <input
                    type="text"
                    value={newCust.fatherName}
                    onChange={(e) => setNewCust(prev => ({ ...prev, fatherName: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">CITY / VILLAGE</label>
                  <input
                    type="text"
                    value={newCust.city}
                    onChange={(e) => setNewCust(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">AADHAAR CARD NUMBER</label>
                  <input
                    type="text"
                    value={newCust.aadhaar}
                    onChange={(e) => setNewCust(prev => ({ ...prev, aadhaar: e.target.value }))}
                    placeholder="xxxx xxxx xxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">PAN NUMBER</label>
                  <input
                    type="text"
                    value={newCust.pan}
                    onChange={(e) => setNewCust(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">CREDIT LIMIT (₹)</label>
                  <input
                    type="number"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">FULL ADDRESS</label>
                  <input
                    type="text"
                    value={newCust.address}
                    onChange={(e) => setNewCust(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  SAVE CUSTOMER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
