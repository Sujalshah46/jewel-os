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
  X,
  Truck,
  Briefcase,
  Landmark,
  BadgePercent,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/numberToWords';

export default function CustomerModule() {
  const { customers, addCustomer, updateCustomer, udhaarList } = useJewellery();
  const [activePartyTab, setActivePartyTab] = useState('CUSTOMER LIST *');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const partyTabs = [
    'CUSTOMER LIST *',
    'SUPPLIER LIST',
    'STAFF LIST',
    'MONEY LENDER LIST'
  ];

  // Helper to map active tab to userType
  const getTargetUserType = (tab) => {
    switch (tab) {
      case 'SUPPLIER LIST': return 'Supplier';
      case 'STAFF LIST': return 'Staff';
      case 'MONEY LENDER LIST': return 'Money Lender';
      case 'CUSTOMER LIST *':
      default: return 'Customer';
    }
  };

  const currentTargetType = getTargetUserType(activePartyTab);

  // New Party Form State
  const [newCust, setNewCust] = useState({
    mr: 'Mr.',
    firstName: '',
    lastName: '',
    companyName: '',
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
    creditLimit: 50000,
    designation: '',
    monthlySalary: '',
    speciality: '',
    licenseNo: '',
    girviInterestRate: '1.50% / Month'
  });

  const handleOpenAddModal = () => {
    const targetType = getTargetUserType(activePartyTab);
    const prefix = targetType === 'Supplier' ? 'SUP-' : targetType === 'Staff' ? 'STF-' : targetType === 'Money Lender' ? 'ML-' : 'KIT-';
    setNewCust({
      mr: targetType === 'Supplier' || targetType === 'Money Lender' ? 'M/s' : 'Mr.',
      firstName: '',
      lastName: '',
      companyName: '',
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
      kit: prefix + Math.floor(1000 + Math.random() * 9000),
      userType: targetType,
      email: '',
      creditLimit: targetType === 'Supplier' ? 2000000 : targetType === 'Money Lender' ? 5000000 : 50000,
      designation: targetType === 'Staff' ? 'Sales Executive' : '',
      monthlySalary: targetType === 'Staff' ? 30000 : '',
      speciality: targetType === 'Supplier' ? '24K Gold Bars & Bullion' : '',
      licenseNo: targetType === 'Money Lender' ? 'MH-PUN-ML-2024/' + Math.floor(100 + Math.random() * 900) : '',
      girviInterestRate: '1.50% / Month'
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCust.firstName || !newCust.mobile) {
      alert('Name and Mobile Number are required.');
      return;
    }
    const targetType = getTargetUserType(activePartyTab);
    const fullName = `${newCust.firstName} ${newCust.lastName}`.trim();
    addCustomer({
      ...newCust,
      userType: targetType,
      fullName: newCust.companyName ? `${newCust.companyName} (${fullName})` : fullName
    });
    setShowAddModal(false);
  };

  // Filter parties by active tab and search term
  const partyList = customers.filter(c => {
    if (currentTargetType === 'Customer') {
      return !c.userType || c.userType === 'Customer';
    }
    return c.userType === currentTargetType;
  });

  const filteredParties = partyList.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(term) ||
      c.companyName?.toLowerCase().includes(term) ||
      c.mobile?.includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.pan?.toLowerCase().includes(term) ||
      c.aadhaar?.includes(term) ||
      c.designation?.toLowerCase().includes(term) ||
      c.speciality?.toLowerCase().includes(term)
    );
  });

  const getAddButtonLabel = () => {
    switch (activePartyTab) {
      case 'SUPPLIER LIST': return '+ ADD NEW SUPPLIER';
      case 'STAFF LIST': return '+ ADD NEW STAFF';
      case 'MONEY LENDER LIST': return '+ ADD NEW MONEY LENDER';
      case 'CUSTOMER LIST *':
      default: return '+ ADD NEW CUSTOMER';
    }
  };

  const getCountSummaryLabel = () => {
    switch (activePartyTab) {
      case 'SUPPLIER LIST': return 'Registered Bullion & Ornament Suppliers';
      case 'STAFF LIST': return 'Registered Showroom Staff & Cashiers';
      case 'MONEY LENDER LIST': return 'Registered Money Lenders & Girvi Partners';
      case 'CUSTOMER LIST *':
      default: return 'Registered Retail & Wholesale Customers';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              PARTY & CRM DIRECTORY
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Full KYC, Aadhaar & PAN Registry, Credit Balances & Contacts for Customers, Suppliers, Staff & Lenders
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{getAddButtonLabel()}</span>
        </button>
      </div>

      {/* Master 4 Party Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        {partyTabs.map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActivePartyTab(tab);
              setSearchTerm('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activePartyTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
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
            placeholder={`Search ${activePartyTab.replace(' LIST *', '').replace(' LIST', '')} by Name, Phone, City, GST/PAN...`}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-amber-300 font-bold">{filteredParties.length}</strong> {getCountSummaryLabel()}
        </div>
      </div>

      {/* Party Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map(cust => (
          <div
            key={cust.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow ${
                    currentTargetType === 'Supplier'
                      ? 'bg-gradient-to-br from-blue-400 to-indigo-600'
                      : currentTargetType === 'Staff'
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-600'
                      : currentTargetType === 'Money Lender'
                      ? 'bg-gradient-to-br from-purple-400 to-pink-600'
                      : 'bg-gradient-to-br from-amber-500 to-amber-700'
                  }`}>
                    {currentTargetType === 'Supplier' ? (
                      <Truck className="w-4 h-4 text-slate-950" />
                    ) : currentTargetType === 'Staff' ? (
                      <Briefcase className="w-4 h-4 text-slate-950" />
                    ) : currentTargetType === 'Money Lender' ? (
                      <Landmark className="w-4 h-4 text-slate-950" />
                    ) : (
                      cust.firstName?.[0] || 'C'
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      {cust.mr && `${cust.mr} `}{cust.companyName || cust.fullName}
                    </h4>
                    <p className="text-[10px] text-amber-400/90 font-mono">ID: {cust.kit || cust.id}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  currentTargetType === 'Supplier'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : currentTargetType === 'Staff'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : currentTargetType === 'Money Lender'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {cust.userType || 'Customer'}
                </span>
              </div>

              {/* Body Details customized by Party Type */}
              <div className="space-y-1.5 text-xs text-slate-300 my-3 font-medium">
                {/* Contact Phone */}
                <p className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-mono font-bold">{cust.mobile}</span>
                  {cust.phone && <span className="text-slate-500 text-[10px]">({cust.phone})</span>}
                </p>

                {/* City & Address */}
                <p className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{cust.address || `${cust.city || 'Pune'}, ${cust.state || 'Maharashtra'}`}</span>
                </p>

                {/* Special Attributes based on tab */}
                {currentTargetType === 'Supplier' && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                    <p className="text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <strong>Speciality:</strong> {cust.speciality || 'Bullion & Diamond Supplies'}
                    </p>
                    <p className="text-slate-400">
                      <strong>Tax ID:</strong> <span className="font-mono text-slate-200">{cust.aadhaar || cust.pan || 'GSTIN Pending'}</span>
                    </p>
                  </div>
                )}

                {currentTargetType === 'Staff' && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                    <p className="text-emerald-300 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <strong>Designation:</strong> {cust.designation || 'Sales Executive'}
                    </p>
                    <p className="text-slate-400">
                      <strong>Monthly Salary:</strong> <span className="font-mono text-slate-200">{cust.monthlySalary ? formatCurrency(cust.monthlySalary) : '₹30,000'}</span>
                    </p>
                  </div>
                )}

                {currentTargetType === 'Money Lender' && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                    <p className="text-purple-300 flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" />
                      <strong>Girvi Interest Rate:</strong> <span className="font-bold text-amber-300">{cust.girviInterestRate || '1.50% / Month'}</span>
                    </p>
                    <p className="text-slate-400">
                      <strong>License Reg:</strong> <span className="font-mono text-slate-200">{cust.licenseNo || cust.aadhaar || 'MH-PUN-ML-2024'}</span>
                    </p>
                  </div>
                )}

                {currentTargetType === 'Customer' && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                    <span className="text-slate-400">PAN: <strong className="font-mono text-slate-200">{cust.pan || 'N/A'}</strong></span>
                    <span className="text-slate-400">Aadhaar: <strong className="font-mono text-slate-200">{cust.aadhaar || 'N/A'}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">
                  {currentTargetType === 'Supplier' ? 'Payable Due:' : currentTargetType === 'Money Lender' ? 'Active Portfolio:' : currentTargetType === 'Staff' ? 'Staff Status:' : 'Udhaar Due:'}
                </span>
                <p className={`font-bold ${
                  currentTargetType === 'Staff' ? 'text-emerald-400' : cust.currentUdhaarBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {currentTargetType === 'Staff' ? 'Active' : formatCurrency(cust.currentUdhaarBalance || 0)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">
                  {currentTargetType === 'Customer' ? 'Loyalty Points:' : 'Credit Limit:'}
                </span>
                <p className="font-bold text-amber-300">
                  {currentTargetType === 'Customer' ? `${cust.loyaltyPoints || 0} Pts` : formatCurrency(cust.creditLimit || 500000)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {filteredParties.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">No {activePartyTab.replace(' LIST *', '').replace(' LIST', '')} records found</p>
            <p className="text-xs text-slate-500 mt-1">Click "{getAddButtonLabel()}" above to register a new party.</p>
          </div>
        )}
      </div>

      {/* Add New Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-slate-100 uppercase tracking-wider">
                  REGISTER NEW {currentTargetType.toUpperCase()} (MASTER DIRECTORY)
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">PARTY TYPE</label>
                  <select
                    value={newCust.userType}
                    onChange={(e) => setNewCust(prev => ({ ...prev, userType: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-bold"
                  >
                    <option value="Customer">Retail / Wholesale Customer</option>
                    <option value="Supplier">Bullion / Gem Supplier</option>
                    <option value="Staff">Showroom Staff / Cashier</option>
                    <option value="Money Lender">Money Lender / Girvi Partner</option>
                  </select>
                </div>

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
                    <option value="M/s">M/s (Company / Firm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                    {currentTargetType === 'Supplier' || currentTargetType === 'Money Lender' ? 'FIRM / CONTACT FIRST NAME *' : 'FIRST NAME *'}
                  </label>
                  <input
                    type="text"
                    value={newCust.firstName}
                    onChange={(e) => setNewCust(prev => ({ ...prev, firstName: e.target.value.toUpperCase() }))}
                    placeholder="e.g. RAMESH"
                    className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">LAST NAME / SURNAME</label>
                  <input
                    type="text"
                    value={newCust.lastName}
                    onChange={(e) => setNewCust(prev => ({ ...prev, lastName: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SHARMA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1">MOBILE NUMBER *</label>
                  <input
                    type="text"
                    value={newCust.mobile}
                    onChange={(e) => setNewCust(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    required
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

                {/* Category-specific fields */}
                {currentTargetType === 'Supplier' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">COMPANY / REFINERY NAME</label>
                      <input
                        type="text"
                        value={newCust.companyName}
                        onChange={(e) => setNewCust(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="e.g. RS Bullion Refinery Ltd"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">SPECIALITY / PRODUCT SUPPLIED</label>
                      <input
                        type="text"
                        value={newCust.speciality}
                        onChange={(e) => setNewCust(prev => ({ ...prev, speciality: e.target.value }))}
                        placeholder="e.g. 24K Pure Gold Bullion & 999 Silver"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">GSTIN NUMBER</label>
                      <input
                        type="text"
                        value={newCust.aadhaar}
                        onChange={(e) => setNewCust(prev => ({ ...prev, aadhaar: e.target.value.toUpperCase() }))}
                        placeholder="27AABCR1234K1Z5"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </>
                )}

                {currentTargetType === 'Staff' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-400 mb-1">DESIGNATION / ROLE</label>
                      <input
                        type="text"
                        value={newCust.designation}
                        onChange={(e) => setNewCust(prev => ({ ...prev, designation: e.target.value }))}
                        placeholder="e.g. Head Cashier / Sales Executive"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-400 mb-1">MONTHLY SALARY (₹)</label>
                      <input
                        type="number"
                        value={newCust.monthlySalary}
                        onChange={(e) => setNewCust(prev => ({ ...prev, monthlySalary: Number(e.target.value) }))}
                        placeholder="35000"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">AADHAAR CARD NO</label>
                      <input
                        type="text"
                        value={newCust.aadhaar}
                        onChange={(e) => setNewCust(prev => ({ ...prev, aadhaar: e.target.value }))}
                        placeholder="xxxx xxxx xxxx"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </>
                )}

                {currentTargetType === 'Money Lender' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-400 mb-1">MONEYLENDING LICENSE NO</label>
                      <input
                        type="text"
                        value={newCust.licenseNo}
                        onChange={(e) => setNewCust(prev => ({ ...prev, licenseNo: e.target.value }))}
                        placeholder="MH-PUN-ML-2024/091"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-400 mb-1">GIRVI INTEREST RATE (% / MONTH)</label>
                      <input
                        type="text"
                        value={newCust.girviInterestRate}
                        onChange={(e) => setNewCust(prev => ({ ...prev, girviInterestRate: e.target.value }))}
                        placeholder="1.50% / Month"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">CREDIT ADVANCE LIMIT (₹)</label>
                      <input
                        type="number"
                        value={newCust.creditLimit}
                        onChange={(e) => setNewCust(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                        placeholder="5000000"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </>
                )}

                {currentTargetType === 'Customer' && (
                  <>
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
                  </>
                )}

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">FULL ADDRESS / PREMISES</label>
                  <input
                    type="text"
                    value={newCust.address}
                    onChange={(e) => setNewCust(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street, Landmark, City..."
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
                  SAVE {currentTargetType.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
