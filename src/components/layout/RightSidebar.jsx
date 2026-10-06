import React, { useState } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import { safeEvaluateMath } from '../../utils/calculations';
import {
  Building2,
  Settings,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  BookOpen,
  FileText,
  PieChart,
  Scale,
  Calculator,
  History,
  ArrowUp,
  X
} from 'lucide-react';

export default function RightSidebar() {
  const { setActiveModule, activeModule } = useJewellery();
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  const shortcuts = [
    { id: 'firm_master', label: 'FIRM', icon: Building2 },
    { id: 'daily_rates', label: 'SETTINGS', icon: Settings },
    { id: 'ecommerce', label: 'E COMM', icon: ShoppingBag },
    { id: 'accounts_reports', label: 'ACCOUNTS', icon: CreditCard },
    { id: 'sms_whatsapp', label: 'SMS', icon: MessageSquare },
    { id: 'daily_diary', label: 'DAY BOOK', icon: BookOpen },
    { id: 'accounts_reports', label: 'BOOKS', icon: FileText },
    { id: 'customers', label: 'LEDGER', icon: BookOpen },
    { id: 'accounts_reports', label: 'TRIAL B/L', icon: Scale },
    { id: 'accounts_reports', label: 'P/L REP.', icon: PieChart },
    { id: 'accounts_reports', label: 'B/L SHEET', icon: Scale },
    { id: 'backup', label: 'LOGS', icon: History },
  ];

  const handleCalcButton = (val) => {
    if (val === 'C') {
      setCalcInput('');
    } else if (val === '=') {
      try {
        const clean = calcInput.replace(/[^0-9+\-*/.]/g, '');
        const res = safeEvaluateMath(clean);
        setCalcInput(String(res));
      } catch (err) {
        setCalcInput('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <aside className="fixed right-0 top-36 z-30 hidden xl:flex flex-col items-center bg-[#0c1222]/95 border-l border-y border-amber-500/25 rounded-l-2xl py-2 px-1 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col space-y-1">
          {shortcuts.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={idx}
                onClick={() => setActiveModule(item.id)}
                title={item.label}
                className={`flex flex-col items-center justify-center w-12 py-1.5 rounded-lg text-[9px] font-bold tracking-tighter transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-amber-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-slate-950' : 'text-amber-400 group-hover:scale-110 transition-transform'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick Calculator Button */}
          <button
            onClick={() => setCalcOpen(!calcOpen)}
            title="Jewellery Calculator"
            className="flex flex-col items-center justify-center w-12 py-1.5 rounded-lg text-[9px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 transition-all"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
            <span>CALC</span>
          </button>

          {/* Scroll to Top Arrow */}
          <button
            onClick={scrollToTop}
            title="Scroll to Top"
            className="flex flex-col items-center justify-center w-12 py-1.5 rounded-lg text-[9px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all mt-1"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>TOP</span>
          </button>
        </div>
      </aside>

      {/* Floating Calculator Modal */}
      {calcOpen && (
        <div className="fixed bottom-6 right-20 z-50 w-72 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-slate-100 backdrop-blur-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs text-amber-300">Gold & Metal Calculator</span>
            </div>
            <button onClick={() => setCalcOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-right font-mono text-lg font-bold text-amber-200 mb-3 min-h-[44px] overflow-x-auto">
            {calcInput || '0'}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '00', '='].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleCalcButton(btn)}
                className={`py-2 rounded-lg font-bold text-xs transition-colors ${
                  btn === '='
                    ? 'bg-amber-500 text-slate-950 col-span-1 shadow-md hover:bg-amber-400'
                    : btn === 'C'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : ['/', '*', '-', '+'].includes(btn)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
