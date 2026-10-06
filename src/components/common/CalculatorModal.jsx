import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';

export default function CalculatorModal({ isOpen, onClose }) {
  const [calcInput, setCalcInput] = useState('');

  if (!isOpen) return null;

  const handleCalcButton = (val) => {
    if (val === 'C') {
      setCalcInput('');
    } else if (val === '=') {
      try {
        const clean = calcInput.replace(/[^0-9+\-*/.]/g, '');
        const res = Function(`'use strict'; return (${clean})`)();
        setCalcInput(String(res));
      } catch (err) {
        setCalcInput('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-slate-100 backdrop-blur-lg">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs text-amber-300">Gold & Jewellery Counter Calculator</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right font-mono text-xl font-bold text-amber-200 mb-3 min-h-[48px] overflow-x-auto">
        {calcInput || '0'}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '00', '='].map((btn, idx) => (
          <button
            key={idx}
            onClick={() => handleCalcButton(btn)}
            className={`py-2.5 rounded-lg font-bold text-xs transition-colors ${
              btn === '='
                ? 'bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400'
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
  );
}
