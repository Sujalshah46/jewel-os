import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle,
  Users,
  Bell,
  Share2
} from 'lucide-react';

export default function SmsWhatsappModule() {
  const { activeFirm, dailyRates, customers } = useJewellery();
  const [selectedTemplate, setSelectedTemplate] = useState('rate_alert');
  const [targetGroup, setTargetGroup] = useState('all');
  const [customMessage, setCustomMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const gold22k = dailyRates.find(r => r.karat?.includes('22K'))?.ratePerGram || 6600.24;

  const templates = {
    rate_alert: `✨ *Today's Gold Rate Alert from ${activeFirm.name}* ✨\nGold 22K (916): ₹${(gold22k*10).toLocaleString('en-IN')}/10GM\nSilver 999: ₹86,000/KG\nVisit showroom today for exclusive making discounts! Phone: ${activeFirm.phone}`,
    festival_offer: `🪔 *Happy Dhanteras & Diwali from ${activeFirm.name}!* 🪔\nEnjoy 5% OFF on Gold Jewellery Making Charges & 15% OFF on Certified Diamond Jewellery.\nShop now: ${activeFirm.address}`,
    payment_receipt: `Dear Customer, thank you for purchasing from ${activeFirm.name}. Your tax invoice has been generated. Contact: ${activeFirm.phone}`,
    udhaar_reminder: `Dear Customer, this is a gentle reminder regarding your outstanding jewellery account balance at ${activeFirm.name}. Kindly visit or GPay at ${activeFirm.upiId}.`
  };

  const currentText = customMessage || templates[selectedTemplate] || '';

  const handleSend = (e) => {
    e.preventDefault();
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Audit 11:56 SMS PANEL */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SMS & WHATSAPP MARKETING PANEL
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Automated Rate Broadcasts, Billing Receipts, Festive Campaigns & Payment Reminders
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1.5 rounded-xl font-mono font-bold">
            SMS CREDITS: 5,420
          </span>
          <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> WhatsApp API Connected
          </span>
        </div>
      </div>

      {sentSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Campaign successfully broadcasted to {customers.length} registered customers!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template Selector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300">
            Select Campaign Template
          </h3>

          <div className="space-y-2">
            {[
              { id: 'rate_alert', title: 'Daily Gold Rate Alert' },
              { id: 'festival_offer', title: 'Diwali & Festival Offer' },
              { id: 'payment_receipt', title: 'Bill / Payment Receipt' },
              { id: 'udhaar_reminder', title: 'Udhaar Balance Reminder' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTemplate(t.id);
                  setCustomMessage('');
                }}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all ${
                  selectedTemplate === t.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">TARGET AUDIENCE</label>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
            >
              <option value="all">All Registered Customers ({customers.length})</option>
              <option value="udhaar">Customers with Active Udhaar Only</option>
              <option value="vip">VIP Gold Club Members</option>
            </select>
          </div>
        </div>

        {/* Message Editor & Phone Mockup */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
            Message Preview & Direct WhatsApp Dispatch
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">EDIT MESSAGE TEXT</label>
            <textarea
              rows={6}
              value={currentText}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs text-slate-100 font-sans focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 text-right mt-1 font-mono">
              {currentText.length} chars (1 SMS credit / recipient)
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                const encoded = encodeURIComponent(currentText);
                window.open(`https://wa.me/?text=${encoded}`, '_blank');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              onClick={handleSend}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>SEND BROADCAST SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
