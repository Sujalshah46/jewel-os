import React, { useState, useEffect, useRef } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';
import { 
  Settings, ChevronRight, ArrowUpRight, Clock, Plus, 
  BarChart3, Users, FileText, ShoppingBag, Check, 
  ChevronDown, ChevronUp, Briefcase, Play, Pause, RotateCcw,
  Search, X, Bell, Calendar as CalendarIcon, Download, Sparkles,
  Phone, Mail, MapPin, Award, CheckCircle2, Shield, Eye
} from 'lucide-react';

// --- Custom Hooks for Animations ---

const useCounter = (end, duration = 1400) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};

const useProgress = (target, duration = 1400) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const prog = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = prog === 1 ? 1 : 1 - Math.pow(2, -10 * prog);
      setProgress(easeOut * target);
      if (prog < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const timer = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, 80); 
    return () => clearTimeout(timer);
  }, [target, duration]);
  return progress;
};

// --- Reusable Subcomponents ---

const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 1400, format = false, isCurrency = false, isWeight = false }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const count = useCounter(numericValue, duration);
  
  let displayValue = count;
  if (format && isCurrency) displayValue = formatCurrency(count);
  else if (format && isWeight) displayValue = formatWeight(count);
  else if (format) displayValue = count.toLocaleString('en-IN');

  return <span>{prefix}{displayValue}{suffix}</span>;
};

const AnimatedProgressBar = ({ label, target, color, bgClass, labelColor, striped = false }) => {
  const progress = useProgress(target);
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-stone-600">{label}</span>
        <span className={`px-2 py-0.5 rounded-full ${bgClass} ${labelColor} font-mono text-[11px]`}>
          <AnimatedNumber value={target} suffix="%" duration={1200} />
        </span>
      </div>
      <div className="h-2 w-full bg-stone-100/90 rounded-full overflow-hidden p-0.5 border border-stone-200/50">
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out ${striped ? 'bg-stripes' : ''}`}
          style={{ 
            width: `${progress}%`, 
            backgroundColor: color,
            backgroundImage: striped ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 8px)' : 'none'
          }}
        />
      </div>
    </div>
  );
};

const BentoCard = ({ children, className = '', index = 0 }) => (
  <div 
    className={`stagger-card bento-hover bg-white rounded-3xl border border-[#EDE4D3]/80 p-6 shadow-sm relative overflow-hidden ${className}`}
    style={{ animationDelay: `${index * 80}ms` }}
  >
    {children}
  </div>
);

// --- 1. OVERVIEW TAB COMPONENTS ---

// Live Interactive Time Tracker matching Coterie stopwatch
const InteractiveTimeTracker = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [seconds, setSeconds] = useState(15);
  const [minutes, setMinutes] = useState(2);
  const [hours, setHours] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 59) {
            setMinutes((m) => {
              if (m >= 59) {
                setHours((h) => h + 1);
                return 0;
              }
              return m + 1;
            });
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
  };

  const totalSecs = hours * 3600 + minutes * 60 + seconds;
  const targetSecs = 180; // 3 min visual target loop
  const progressRatio = Math.min((totalSecs % targetSecs) / targetSecs, 1);
  const circumference = 2 * Math.PI * 48; // radius 48
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-bold text-stone-800">Time tracker</h3>
        <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer">
          <ArrowUpRight size={14} />
        </span>
      </div>

      {/* Clock Dial */}
      <div className="relative flex flex-col items-center justify-center my-3">
        {/* Outer tick marks */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            {/* Background circle track */}
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#F2EDE4"
              strokeWidth="7"
            />
            {/* Animated gold track */}
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#E5A93C"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Tick lines overlay */}
          <div className="absolute inset-2 rounded-full border border-dashed border-stone-300/60 pointer-events-none" />

          {/* Digital Time Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold tracking-tight text-stone-900 font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-stone-300'}`} />
              <span className="text-[11px] font-semibold text-stone-500">
                {isRunning ? (
                  <>Tracking · <strong className="text-emerald-700">{seconds}s</strong></>
                ) : (
                  'Paused'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isRunning 
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20'
            }`}
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>
          <button 
            onClick={handleReset}
            className="w-9 h-9 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center transition-colors"
            title="Reset"
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center shadow-sm">
          <Clock size={15} />
        </div>
      </div>
    </div>
  );
};

// Interactive Onboarding & Daily Checklist matching dark card in Coterie video
const InteractiveOnboardingCard = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Verify Gold 24K MCX Rate', time: '09:00 AM', completed: true },
    { id: 2, title: 'Physical Drawer Cash Audit', time: '09:30 AM', completed: true },
    { id: 3, title: 'Karigar Metal Issue Voucher', time: '11:00 AM', completed: false },
    { id: 4, title: 'Bridal Set Trial Appointment', time: '01:30 PM', completed: false },
    { id: 5, title: 'Udhaar Reminder WhatsApp Dispatch', time: '03:15 PM', completed: false },
    { id: 6, title: 'Hallmark 916 Tagging Check', time: '04:45 PM', completed: false },
    { id: 7, title: 'Evening Counter Tally & Ledger', time: '07:30 PM', completed: false },
    { id: 8, title: 'Vault Lock & Insurance Close', time: '08:30 PM', completed: false },
  ]);

  const [sparkles, setSparkles] = useState([]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const toggleTask = (id, e) => {
    // Generate sparkle burst effect at click coordinates
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const newSparkle = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setSparkles(prev => [...prev, newSparkle]);
      setTimeout(() => {
        setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
      }, 800);
    }

    setTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, completed: !t.completed };
      return t;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#18181B] text-white rounded-3xl p-6 relative overflow-hidden border border-stone-800">
      {/* Top Onboarding Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-stone-400">Store Readiness</span>
          <div className="text-xs text-amber-400 font-semibold mt-0.5">Today's Protocol</div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-amber-400 font-mono">{progressPercent}%</span>
        </div>
      </div>

      {/* Progress pill stages */}
      <div className="grid grid-cols-3 gap-1.5 mb-5 text-[11px] font-semibold text-center">
        <div className={`py-1.5 rounded-lg border transition-all ${completedCount >= 2 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-stone-800 border-stone-700 text-stone-500'}`}>
          Morning ({Math.min(completedCount, 2)}/2)
        </div>
        <div className={`py-1.5 rounded-lg border transition-all ${completedCount >= 5 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-stone-800 border-stone-700 text-stone-500'}`}>
          Mid-Day ({Math.max(0, Math.min(completedCount - 2, 3))}/3)
        </div>
        <div className={`py-1.5 rounded-lg border transition-all ${completedCount >= 8 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-stone-800 border-stone-700 text-stone-500'}`}>
          Closing ({Math.max(0, completedCount - 5)}/3)
        </div>
      </div>

      {/* Dark Tasks List */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-300">Daily Tasks</span>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {completedCount}/{totalCount}
          </span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1 hide-scrollbar relative">
          {sparkles.map(sp => (
            <div 
              key={sp.id} 
              className="absolute pointer-events-none text-amber-400 animate-ping z-20 flex items-center gap-1"
              style={{ left: sp.x, top: sp.y }}
            >
              <Sparkles size={16} />
            </div>
          ))}

          {tasks.map(task => (
            <div 
              key={task.id}
              onClick={(e) => toggleTask(task.id, e)}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                task.completed ? 'bg-stone-900/40 hover:bg-stone-900/80' : 'bg-stone-850 hover:bg-stone-800 border border-stone-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  task.completed 
                    ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/30' 
                    : 'border border-stone-600 hover:border-amber-400'
                }`}>
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={`text-xs font-medium truncate ${task.completed ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                  {task.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-500 ml-2 shrink-0">{task.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Add Protocol Button */}
        <button 
          onClick={() => {
            const title = prompt('Enter new task name:');
            if (title) {
              setTasks(prev => [...prev, { id: Date.now(), title, time: 'Now', completed: false }]);
            }
          }}
          className="mt-3 w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-stone-700/80"
        >
          <Plus size={14} /> Add Daily Task
        </button>
      </div>
    </div>
  );
};

// Interactive Weekly Calendar with navigation buttons
const InteractiveWeeklyCalendar = () => {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayDates = dayNames.map((day, idx) => {
    const d = new Date(baseDate);
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0
    d.setDate(d.getDate() - dayOfWeek + idx);
    return {
      day,
      dateNum: d.getDate(),
      month: d.toLocaleString('en-US', { month: 'short' }),
      isToday: weekOffset === 0 && idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
    };
  });

  const weekRangeLabel = `${dayDates[0].month} ${dayDates[0].dateNum} – ${dayDates[5].month} ${dayDates[5].dateNum}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <button 
          onClick={() => setWeekOffset(prev => prev - 1)}
          className="text-xs font-bold text-stone-500 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
        >
          ‹ Prev Week
        </button>
        <span className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
          {weekRangeLabel}
        </span>
        <button 
          onClick={() => setWeekOffset(prev => prev + 1)}
          className="text-xs font-bold text-stone-500 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
        >
          Next Week ›
        </button>
      </div>

      {/* Week Day Pills */}
      <div className="grid grid-cols-6 gap-1.5">
        {dayDates.map((item, idx) => (
          <div 
            key={idx}
            className={`flex flex-col items-center py-2 rounded-2xl transition-all cursor-pointer ${
              item.isToday 
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20 -translate-y-0.5' 
                : 'bg-stone-50 hover:bg-amber-50/60 text-stone-600'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{item.day}</span>
            <span className="text-sm font-extrabold mt-0.5 font-mono">{item.dateNum}</span>
            {item.isToday && <span className="w-1.5 h-1.5 rounded-full bg-stone-950 mt-1" />}
          </div>
        ))}
      </div>

      {/* Appointments List for Selected Week */}
      <div className="space-y-2 mt-1">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 to-amber-100/40 border border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div>
              <p className="text-xs font-bold text-stone-900">Bridal Jewellery Trial</p>
              <p className="text-[10px] text-stone-500">Kavita Singhania • Counter 1</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-800 bg-white px-2 py-1 rounded-md border border-amber-200/60">
            11:30 AM
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <p className="text-xs font-bold text-stone-900">Karigar Delivery Batch #4</p>
              <p className="text-[10px] text-stone-500">Ramesh Goldsmith • 120g Gold bangles</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-stone-700 bg-white px-2 py-1 rounded-md border border-stone-200">
            03:00 PM
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div>
              <p className="text-xs font-bold text-stone-900">Bullion Refinery Rate Settlement</p>
              <p className="text-[10px] text-stone-500">MMTC PAMP • RTGS Transfer</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-stone-700 bg-white px-2 py-1 rounded-md border border-stone-200">
            05:30 PM
          </span>
        </div>
      </div>
    </div>
  );
};

// Left Accordion for Details matching Coterie video
const InteractiveDetailsAccordion = ({ dailyRates, activeFirm, analytics }) => {
  const [openSection, setOpenSection] = useState('rates');

  return (
    <div className="space-y-2">
      {/* 1. Metal Rates */}
      <div className="border border-stone-200/70 rounded-2xl overflow-hidden bg-white">
        <button
          onClick={() => setOpenSection(openSection === 'rates' ? null : 'rates')}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-stone-800 uppercase tracking-wider hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-amber-600" />
            <span>Today's Metal Rates (Live)</span>
          </div>
          {openSection === 'rates' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openSection === 'rates' && (
          <div className="px-4 pb-4 space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="font-bold text-amber-900">Gold 24K (99.9%)</span>
              <span className="font-mono font-extrabold text-amber-700">₹{dailyRates?.gold24k || 7250}/g</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/40 border border-amber-100">
              <span className="font-medium text-stone-700">Gold 22K (Hallmark 916)</span>
              <span className="font-mono font-bold text-amber-700">₹{dailyRates?.gold22k || 6650}/g</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="font-medium text-stone-700">Silver 999 Fine</span>
              <span className="font-mono font-bold text-stone-700">₹{dailyRates?.silver999 || 88.5}/g</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Devices & Scale */}
      <div className="border border-stone-200/70 rounded-2xl overflow-hidden bg-white">
        <button
          onClick={() => setOpenSection(openSection === 'devices' ? null : 'devices')}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-stone-800 uppercase tracking-wider hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-amber-600" />
            <span>Connected Devices & Scales</span>
          </div>
          {openSection === 'devices' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openSection === 'devices' && (
          <div className="px-4 pb-4 space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-800">Essae Teraoka Weigh Scale</p>
                <p className="text-[10px] text-stone-500">COM3 • Precision 0.001g</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Connected
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-800">TVS LP-46 Barcode Thermal</p>
                <p className="text-[10px] text-stone-500">USB 2.0 • 203 DPI</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cash & Drawer Balance */}
      <div className="border border-stone-200/70 rounded-2xl overflow-hidden bg-white">
        <button
          onClick={() => setOpenSection(openSection === 'cash' ? null : 'cash')}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-stone-800 uppercase tracking-wider hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-600" />
            <span>Counter Cash & Security</span>
          </div>
          {openSection === 'cash' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openSection === 'cash' && (
          <div className="px-4 pb-4 space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
              <span className="text-[11px] font-semibold text-emerald-800">Cash in Drawer</span>
              <p className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">
                {formatCurrency(activeFirm?.cashBalance || 250000)}
              </p>
              <p className="text-[10px] text-emerald-600 mt-1">Verified with morning opening balance</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 2. PEOPLE TAB (STAFF & KARIGARS DIRECTORY) ---
const PeopleDirectoryView = () => {
  const [filterRole, setFilterRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([1]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [members, setMembers] = useState([
    { id: 1, name: 'Ramesh Soni', role: 'Master Karigar', team: 'Gold Workshop', location: 'Counter 1 / Lab', started: 'Mar 2021', status: 'Active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
    { id: 2, name: 'Pooja Verma', role: 'Head of Sales', team: 'Bridal Gallery', location: 'Main Showroom', started: 'Aug 2022', status: 'Active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
    { id: 3, name: 'Vikram Mehta', role: 'Gemologist & Valuer', team: 'Diamond Lab', location: 'Cabin 2', started: 'Jan 2023', status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
    { id: 4, name: 'Sunil Rao', role: 'Setter (Kundan / Polki)', team: 'Stone Setting', location: 'Workshop B', started: 'Nov 2021', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80' },
    { id: 5, name: 'Ananya Sharma', role: 'Billing Cashier', team: 'Front Counter', location: 'POS Station 1', started: 'Sep 2023', status: 'Active', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80' },
    { id: 6, name: 'Gopal Sahu', role: 'Polisher & Plater', team: 'Finishing Unit', location: 'Workshop C', started: 'May 2022', status: 'Away', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80' },
    { id: 7, name: 'Kavita Patel', role: 'Client Relations Lead', team: 'VIP Salon', location: 'Floor 1', started: 'Feb 2024', status: 'New', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' },
  ]);

  const [newMember, setNewMember] = useState({ name: '', role: 'Goldsmith', team: 'Workshop', location: 'Main Counter' });

  const filtered = members.filter(m => {
    const matchesRole = filterRole === 'All' || m.team.toLowerCase().includes(filterRole.toLowerCase()) || m.role.toLowerCase().includes(filterRole.toLowerCase());
    const matchesSearch = searchQuery === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name) return;
    const added = {
      id: Date.now(),
      name: newMember.name,
      role: newMember.role,
      team: newMember.team,
      location: newMember.location,
      started: 'Today',
      status: 'New',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    };
    setMembers([added, ...members]);
    setShowAddModal(false);
    setNewMember({ name: '', role: 'Goldsmith', team: 'Workshop', location: 'Main Counter' });
  };

  return (
    <div className="space-y-6">
      {/* People Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">People & Karigars</h2>
          <p className="text-sm text-stone-500 mt-1">Manage showroom staff, sales associates, and workshop goldsmiths</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-full border border-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                <X size={12} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Workshop', 'Bridal', 'Diamond', 'Front Counter'].map(pill => (
          <button
            key={pill}
            onClick={() => setFilterRole(pill)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterRole === pill 
                ? 'bg-amber-500 text-stone-950 shadow-sm' 
                : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200/80'
            }`}
          >
            {pill === 'All' ? `All ${members.length}` : pill}
          </button>
        ))}
      </div>

      {/* People Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 text-[11px] uppercase tracking-wider text-stone-400 bg-stone-50/50">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded text-amber-500 focus:ring-0" />
                </th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Counter / Location</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filtered.map(person => {
                const isSelected = selectedIds.includes(person.id);
                return (
                  <tr 
                    key={person.id} 
                    onClick={() => handleToggleSelect(person.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-100/60 font-medium' : 'hover:bg-amber-50/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-amber-600 focus:ring-0 cursor-pointer" 
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={person.avatar} 
                          alt={person.name} 
                          className="w-8 h-8 rounded-full object-cover border border-amber-300 shadow-sm" 
                        />
                        <span className="font-bold text-stone-900">{person.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-700">{person.role}</td>
                    <td className="py-3.5 px-4 text-stone-600">{person.team}</td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">{person.location}</td>
                    <td className="py-3.5 px-4 text-stone-500">{person.started}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        person.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : person.status === 'Away' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-stone-900 text-amber-300'
                      }`}>
                        • {person.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-stone-900">Add Staff or Karigar</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-600">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Anand Soni"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600">Designation</label>
                  <input 
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">Team / Department</label>
                  <input 
                    type="text"
                    value={newMember.team}
                    onChange={(e) => setNewMember({ ...newMember, team: e.target.value })}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-stone-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600">Location / Counter</label>
                <input 
                  type="text"
                  value={newMember.location}
                  onChange={(e) => setNewMember({ ...newMember, location: e.target.value })}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-stone-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl shadow-md">
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 3. PAYROLL & KARIGAR WAGES TAB ---
const PayrollAccountsView = () => {
  const staffList = [
    { id: 1, name: 'Ramesh Soni', role: 'Master Karigar', hours: 148.5, wage: 89100, regular: 88, overtime: 4, leave: 8, email: 'ramesh.soni@jewel.os', phone: '+91 98201 12345', location: 'Jaipur Workshop', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
    { id: 2, name: 'Pooja Verma', role: 'Head of Sales', hours: 142.0, wage: 75000, regular: 92, overtime: 2, leave: 6, email: 'pooja.verma@jewel.os', phone: '+91 98202 23456', location: 'Mumbai Flagship', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
    { id: 3, name: 'Vikram Mehta', role: 'Gemologist', hours: 138.0, wage: 82000, regular: 90, overtime: 0, leave: 10, email: 'vikram.m@jewel.os', phone: '+91 98203 34567', location: 'Surat Lab', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
    { id: 4, name: 'Sunil Rao', role: 'Kundan Setter', hours: 154.2, wage: 92500, regular: 85, overtime: 8, leave: 7, email: 'sunil.rao@jewel.os', phone: '+91 98204 45678', location: 'Workshop B', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80' },
  ];

  const [selectedStaff, setSelectedStaff] = useState(staffList[0]);

  // Calendar days grid for payroll
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Team Members Sidebar */}
      <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3 px-1">Staff & Karigars</h3>
          <div className="space-y-1.5">
            {staffList.map(person => {
              const isActive = person.id === selectedStaff.id;
              return (
                <div 
                  key={person.id}
                  onClick={() => setSelectedStaff(person)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                    isActive ? 'bg-amber-100 text-stone-900 font-bold shadow-sm' : 'hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full object-cover border border-amber-300" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{person.name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{person.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-stone-100">
          <p className="text-[11px] text-stone-400">Payroll Cycle: Oct 2026</p>
          <p className="text-xs font-bold text-amber-700 mt-0.5">Disbursement: 1st of month</p>
        </div>
      </div>

      {/* Center - Monthly Hours & Wages Grid */}
      <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-900 font-mono">{selectedStaff.hours} hrs</span>
                <span className="text-2xl font-bold text-amber-600 font-mono">/ ₹{selectedStaff.wage.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-stone-400 font-medium mt-1">Calculated base + piece rate making charges</p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full">
              September 2026
            </span>
          </div>

          {/* Ratio bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-stone-600 mb-2">
              <span>Work hours: {selectedStaff.regular}%</span>
              <span>Overtime: {selectedStaff.overtime}%</span>
              <span>Leave: {selectedStaff.leave}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden flex">
              <div style={{ width: `${selectedStaff.regular}%` }} className="bg-amber-500 h-full" />
              <div style={{ width: `${selectedStaff.overtime}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${selectedStaff.leave}%` }} className="bg-stone-300 h-full" />
            </div>
          </div>

          {/* Month Attendance Grid */}
          <div className="border border-stone-200/70 rounded-2xl p-4 bg-stone-50/50">
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold text-stone-400 mb-2">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map(day => {
                const isOff = day % 7 === 0;
                const hoursLogged = isOff ? 'Leave' : day === 15 ? '10.5h' : '7.5h';
                return (
                  <div 
                    key={day}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-mono transition-colors ${
                      isOff ? 'bg-stone-100 border-stone-200 text-stone-400' : 'bg-white border-amber-100 text-stone-800 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-stone-400">{day}</span>
                    <span className={`text-[10px] font-bold mt-0.5 ${hoursLogged === '10.5h' ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : hoursLogged === 'Leave' ? 'text-rose-500' : 'text-amber-800'}`}>
                      {hoursLogged}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-500">Includes Karigar waste allowance: <strong>0.850g</strong></span>
          <button 
            onClick={() => alert(`Payslip generated and sent to ${selectedStaff.name}`)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold rounded-xl text-xs transition-colors"
          >
            Approve & Pay Slip
          </button>
        </div>
      </div>

      {/* Right Sidebar - Staff Detail Card */}
      <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col items-center text-center pb-5 border-b border-stone-100">
            <img 
              src={selectedStaff.avatar} 
              alt={selectedStaff.name} 
              className="w-20 h-20 rounded-full object-cover border-4 border-amber-200 shadow-md mb-3" 
            />
            <h4 className="text-lg font-bold text-stone-900">{selectedStaff.name}</h4>
            <p className="text-xs text-amber-700 font-semibold">{selectedStaff.role}</p>
          </div>

          <div className="space-y-3 py-4 text-xs">
            <div className="flex items-center gap-2 text-stone-600">
              <Mail size={14} className="text-stone-400" />
              <span>{selectedStaff.email}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Phone size={14} className="text-stone-400" />
              <span>{selectedStaff.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <MapPin size={14} className="text-stone-400" />
              <span>{selectedStaff.location}</span>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <p className="text-xs font-bold text-stone-700 mb-2">Documents</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
                <span className="text-stone-700">Contract_2026.pdf</span>
                <Download size={14} className="text-stone-400 hover:text-amber-600 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
                <span className="text-stone-700">Payslip_Sep26.pdf</span>
                <Download size={14} className="text-stone-400 hover:text-amber-600 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100">
          <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
            <span>Hours vs Plan</span>
            <span>148 / 168</span>
          </div>
          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD MODULE ---
export default function DashboardModule() {
  const { 
    activeFirm, 
    dailyRates, 
    invoices, 
    setActiveModule, 
    setPreviewInvoice, 
    analytics 
  } = useJewellery();

  const [activeTab, setActiveTab] = useState('Overview');
  const [mousePos, setMousePos] = useState({ x: 300, y: 300 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-full bg-[#FAF6EE] -mx-6 -mt-6 p-6 md:p-8 font-sans text-stone-900 relative overflow-y-auto transition-colors"
      style={{
        backgroundImage: `radial-gradient(circle 750px at ${mousePos.x}px ${mousePos.y}px, rgba(230, 185, 90, 0.12), transparent 75%)`
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-card {
          opacity: 0;
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bento-hover {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(220, 165, 45, 0.45);
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.06), 0 8px 16px -6px rgba(212, 160, 23, 0.08);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-[1440px] mx-auto space-y-7 pb-12 relative z-10">

        {/* 1. TOP HEADER & PILL TABS (Overview, People, Payroll, Settings) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 stagger-card" style={{ animationDelay: '0ms' }}>
          <div className="flex flex-col gap-4">
            {/* Coterie-style Pill Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-[#E9DFCB] w-fit">
              {['Overview', 'People', 'Payroll', 'Settings'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button 
                    key={tab} 
                    onClick={() => {
                      if (tab === 'Settings') {
                        setActiveModule('settings');
                      } else {
                        setActiveTab(tab);
                      }
                    }}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-stone-900 text-amber-300 shadow-md shadow-stone-950/20' 
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Greeting Headline */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
                Good morning, {activeFirm?.name ? activeFirm.name.split(' ')[0] : 'Jeweller'}
                <span className="text-amber-500">✨</span>
              </h1>
              <div className="text-stone-500 mt-1 flex flex-wrap items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Showroom Live
                </span>
                <span>•</span>
                <span>Store: <strong className="text-stone-700">{activeFirm?.code || 'MAIN'}</strong></span>
                <span>•</span>
                <span>GSTIN: <strong className="text-stone-700">{activeFirm?.gstin || '27AAECB2234L1ZT'}</strong></span>
              </div>
            </div>
          </div>

          {/* Top Right Big Metric Stats Bar */}
          <div className="flex items-center gap-6 sm:gap-8 bg-white/90 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-[#E9DFCB] shadow-sm">
            <div 
              onClick={() => setActiveModule('stock')}
              className="flex flex-col items-end cursor-pointer group"
            >
              <span className="text-3xl font-extrabold text-stone-900 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
                <AnimatedNumber value={analytics?.totalStockCount || 84} />
              </span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">Stock Items</span>
            </div>
            <div className="w-px h-10 bg-stone-200" />
            <div 
              onClick={() => setActiveModule('billing')}
              className="flex flex-col items-end cursor-pointer group"
            >
              <span className="text-3xl font-extrabold text-stone-900 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
                <AnimatedNumber value={analytics?.totalInvoicesCount || 37} />
              </span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">Bills Today</span>
            </div>
            <div className="w-px h-10 bg-stone-200" />
            <div 
              onClick={() => setActiveModule('customers')}
              className="flex flex-col items-end cursor-pointer group"
            >
              <span className="text-3xl font-extrabold text-stone-900 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
                <AnimatedNumber value={analytics?.totalCustomersCount || 212} />
              </span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">Customers</span>
            </div>
          </div>
        </div>

        {/* 2. TAB CONTENT ROUTING */}
        {activeTab === 'People' && <PeopleDirectoryView />}
        {activeTab === 'Payroll' && <PayrollAccountsView />}
        {activeTab === 'Overview' && (
          <div className="space-y-7">
            {/* MINI PROGRESS BARS ROW */}
            <div className="stagger-card" style={{ animationDelay: '80ms' }}>
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-[#E9DFCB] flex flex-wrap items-center gap-6 lg:gap-8">
                <AnimatedProgressBar label="24K Gold Stock" target={78} color="#D4A017" bgClass="bg-amber-100" labelColor="text-amber-900" />
                <div className="w-px h-8 bg-stone-200 hidden sm:block" />
                <AnimatedProgressBar label="Silver 925 Stock" target={45} color="#78716C" bgClass="bg-stone-100" labelColor="text-stone-800" />
                <div className="w-px h-8 bg-stone-200 hidden md:block" />
                <AnimatedProgressBar label="Sales Target (Monthly)" target={62} color="#16A34A" bgClass="bg-emerald-100" labelColor="text-emerald-900" striped />
                <div className="w-px h-8 bg-stone-200 hidden lg:block" />
                <AnimatedProgressBar label="Udhaar Collections" target={89} color="#9333EA" bgClass="bg-purple-100" labelColor="text-purple-900" />
              </div>
            </div>

            {/* BENTO MIDDLE SECTION: Profile Card, Weekly Chart, Time Tracker, Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
              
              {/* Profile Card (4 cols) */}
              <BentoCard className="lg:col-span-3 flex flex-col justify-between !p-0 bg-[#1C1917] text-white border-0 shadow-lg" index={1}>
                <div className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-4 ring-white/10">
                      <span className="text-2xl font-extrabold text-stone-950 font-serif">
                        {activeFirm?.name ? activeFirm.name.charAt(0) : 'J'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveModule('settings')}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-amber-400"
                    >
                      <Settings size={16} />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Owner & Manager</span>
                    <h3 className="text-xl font-bold mt-0.5 text-stone-100">{activeFirm?.name || 'Jewellery Showroom'}</h3>
                    <p className="text-xs text-stone-400 mt-1">
                      {activeFirm?.address ? activeFirm.address.substring(0, 32) : 'Main Bazaar, Flagship Counter'}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 relative z-10">
                  <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl p-4 border border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-400">Cash in Counter</span>
                    <p className="text-2xl font-extrabold text-amber-300 font-mono mt-0.5">
                      <AnimatedNumber value={activeFirm?.cashBalance || 250000} format isCurrency />
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <ArrowUpRight size={13} />
                      <span>+₹1,55,120 Bills Today</span>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              </BentoCard>

              {/* Weekly Performance Bar Chart (3 cols) */}
              <BentoCard className="lg:col-span-3 flex flex-col justify-between" index={2}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Weekly Sales</h3>
                      <p className="text-xs text-stone-500 mt-0.5">Last 7 days turnover</p>
                    </div>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <BarChart3 size={18} />
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-extrabold text-stone-900 font-mono">₹4.8L</span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">+14.2%</span>
                  </div>
                </div>

                {/* Vertical Bar Chart with W T F S S M T days */}
                <div className="flex items-end justify-between gap-1.5 h-36 pt-4">
                  {[
                    { day: 'W', height: 45, val: '₹3.2L' },
                    { day: 'T', height: 65, val: '₹4.5L' },
                    { day: 'F', height: 35, val: '₹2.8L' },
                    { day: 'S', height: 95, val: '₹6.8L' },
                    { day: 'S', height: 80, val: '₹5.4L' },
                    { day: 'M', height: 50, val: '₹3.6L' },
                    { day: 'T', height: 75, val: '₹5.1L', isToday: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 bg-stone-900 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {item.val}
                      </div>

                      <div className="w-full flex items-end justify-center h-28">
                        <div 
                          className={`w-full max-w-[20px] rounded-lg transition-all duration-500 ease-out ${
                            item.isToday 
                              ? 'bg-amber-500 shadow-md shadow-amber-500/30' 
                              : 'bg-stone-200 group-hover:bg-amber-300'
                          }`}
                          style={{ height: `${item.height}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${item.isToday ? 'text-amber-700' : 'text-stone-400'}`}>
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </BentoCard>

              {/* Time Tracker Stopwatch Card (3 cols) */}
              <BentoCard className="lg:col-span-3 flex flex-col justify-between" index={3}>
                <InteractiveTimeTracker />
              </BentoCard>

              {/* Onboarding & Protocol Dark Tasks Card (3 cols) */}
              <BentoCard className="lg:col-span-3 !p-0 border-0 overflow-visible" index={4}>
                <InteractiveOnboardingCard />
              </BentoCard>
            </div>

            {/* BOTTOM ROW: Accordion details, Weekly Calendar, Recent Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Accordion (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <BentoCard index={5}>
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-stone-900">Store Quick Info</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Rates, Scales, and Cash Drawer</p>
                  </div>
                  <InteractiveDetailsAccordion 
                    dailyRates={dailyRates} 
                    activeFirm={activeFirm} 
                    analytics={analytics} 
                  />
                </BentoCard>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setActiveModule('billing')}
                    className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Plus size={16} />
                    <span>New Bill (F2)</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule('stock')}
                    className="p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <ShoppingBag size={16} />
                    <span>Stock Tally</span>
                  </button>
                </div>
              </div>

              {/* Weekly Calendar (4 cols) */}
              <BentoCard className="lg:col-span-4 flex flex-col justify-between" index={6}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Showroom Schedule</h3>
                      <p className="text-xs text-stone-500 mt-0.5">Trials & Workshop deliveries</p>
                    </div>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <CalendarIcon size={18} />
                    </span>
                  </div>

                  <InteractiveWeeklyCalendar />
                </div>
              </BentoCard>

              {/* Recent Invoices Table (4 cols) */}
              <BentoCard className="lg:col-span-4 flex flex-col justify-between" index={7}>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Recent Bills</h3>
                      <p className="text-xs text-stone-500 mt-0.5">Live store transactions</p>
                    </div>
                    <button 
                      onClick={() => setActiveModule('billing')}
                      className="text-xs font-bold text-amber-700 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 hide-scrollbar">
                    {invoices?.slice(0, 5).map((inv) => (
                      <div 
                        key={inv.id}
                        onClick={() => setPreviewInvoice(inv)}
                        className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50/80 border border-stone-100 hover:border-amber-200/80 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-amber-600 font-mono font-bold text-xs shadow-sm">
                            <FileText size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900 truncate max-w-[130px]">{inv.customerName}</p>
                            <p className="text-[10px] font-mono text-stone-400">{inv.invoiceNo}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold font-mono text-stone-900">
                            {formatCurrency(inv.totalInvoiceAmount)}
                          </p>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveModule('billing')}
                  className="mt-4 w-full py-2.5 rounded-xl border border-stone-200 hover:border-amber-500 hover:bg-amber-50 text-stone-700 font-bold text-xs transition-all"
                >
                  Create New Bill
                </button>
              </BentoCard>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
