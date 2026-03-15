import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Leaf, User, KeyRound, Lock, UserPlus, Database, Search, ArrowRight, ArrowLeft, Calendar, Save, Download, FileSpreadsheet, Trash2, Printer, X, ShieldAlert, Zap, Cpu, Pencil } from 'lucide-react';
import './index.css';

// System Identity Signature (DO NOT MODIFY)
const _auth_sig = "U2hhaCBOYXdheiBIdXNzYWluIHwgKzkxIDkxMDExNDQ2MzM="; 
const _creator_id = "U2hhaCBOYXdheiBIdXNzYWlu"; 
const _creator_contact = "OTEwMTE0NDYzMw==";

const API_URL = "https://tea-flc-api.malashbhagat420.workers.dev";
const INITIAL_DB = { users: [], pendingUsers: [], parties: [], samples: [], counters: { samples: 0 } };

function SlideshowBackground() {
  const images = useMemo(() => [
    '/backgrounds/bg1.png', '/backgrounds/bg2.png', '/backgrounds/bg3.png', 
    '/backgrounds/bg4.png', '/backgrounds/bg5.png', '/backgrounds/bg6.png',
    '/backgrounds/bg7.png', '/backgrounds/bg8.png', '/backgrounds/bg9.png',
    '/backgrounds/bg10.png'
  ], []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 15000); // Very slow, luxurious rotation
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none bg-[#0f172a]">
      {images.map((img, i) => (
        <div
          key={img}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-[10000ms] ease-in-out ${
            i === index ? 'opacity-80 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{ 
            backgroundImage: `url(${img})`,
            filter: 'contrast(1.05) brightness(0.9) saturate(1.1)'
          }}
        ></div>
      ))}
      {/* High-End Cinematic Blending Stack */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a] z-[1] opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.5)_100%)] z-[2]"></div>
      <div className="absolute inset-0 bg-teal-900/20 mix-blend-color z-[3]"></div>
      <div className="absolute inset-0 backdrop-blur-[2px] z-[4]"></div>
      {/* Subtle Analogue UI Layer */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-[5] bg-repeat" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
}

function validatePassword(pass) {
  if (pass.length < 4) return "PASSWORD MUST BE AT LEAST 4 CHARACTERS";
  return null;
}

function PasswordHints({ password }) {
  const requirements = [
    { label: "4+ Characters", met: password.length >= 4 },
  ];

  if (!password) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 animate-fadeUp">
      {requirements.map((req, i) => (
        <span key={i} className={`text-[9px] uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-300 ${req.met ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
          <div className={`w-1 h-1 rounded-full ${req.met ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></div>
          {req.label}
        </span>
      ))}
    </div>
  );
}

const ROLES = [
  { value: 'clerk', label: 'Entry Clerk' },
  { value: 'analyst', label: 'QC Analyst' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'master', label: 'Admin' }
];

function RoleDropdown({ value, onChange, options, variant = "full", icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLabel = options.find(o => o.value === value)?.label || 'Select Role';

  if (variant === "compact") {
    return (
      <div className="relative inline-block" ref={ref}>
        <button
          onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border backdrop-blur-md shadow-lg ${
            isOpen 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-4 ring-indigo-500/10' 
            : 'bg-white/60 border-slate-200 text-slate-600 hover:border-indigo-500/40 hover:text-indigo-600'
          }`}
        >
          {Icon && <Icon className={`w-3 h-3 ${isOpen ? 'text-indigo-600' : 'text-indigo-400'}`} />}
          <span>{currentLabel}</span>
          <ArrowRight className={`w-3 h-3 transition-transform duration-500 ${isOpen ? 'rotate-180 text-indigo-600' : 'rotate-90 opacity-40'}`} />
        </button>
        
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-48 z-[3000] bg-white border border-slate-200 rounded-xl shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-scaleIn origin-bottom backdrop-blur-3xl ring-1 ring-black/5">
            <div className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between group/opt ${
                    value === opt.value 
                      ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  {opt.label}
                  {value === opt.value && <Zap className="w-3 h-3 text-indigo-500 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={ref}>
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className={`w-full flex items-center justify-between p-4 rounded-xl outline-none transition-all duration-500 border backdrop-blur-md shadow-sm group ${
          isOpen 
          ? 'bg-white border-indigo-400 ring-4 ring-indigo-500/5' 
          : 'bg-white/40 border-slate-200 hover:border-indigo-300 hover:bg-white/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-50' : 'bg-slate-100'}`}>
            {Icon && <Icon className={`w-4 h-4 ${isOpen ? 'text-indigo-600' : 'text-indigo-500'}`} />}
          </div>
          <span className={`text-sm tracking-[0.15em] font-bold uppercase transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
            {currentLabel}
          </span>
        </div>
        <div className={`p-1 rounded-full transition-all duration-500 ${isOpen ? 'bg-indigo-50 rotate-180' : 'rotate-90 opacity-20 group-hover:opacity-100 group-hover:bg-slate-200'}`}>
          <ArrowRight className={`w-4 h-4 ${isOpen ? 'text-indigo-600' : 'text-slate-600'}`} />
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-3 z-[3000] bg-white border border-slate-200 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden animate-scaleIn origin-top backdrop-blur-3xl ring-1 ring-black/5">
          <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-5 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-all rounded-lg flex items-center justify-between mb-1 last:mb-0 ${
                  value === opt.value 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)] animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
}

function generateRandomSerial() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 0, I, 1
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Global variable for scanner
// Removed global scanner variable for React stability

function EditModal({ sample, close, updateSample }) {
  const [party, setParty] = useState(sample?.partyName || '');
  const [veh, setVeh] = useState(sample?.vehicleNo || '');
  const [gross, setGross] = useState(sample?.grossLoadedWeight || 0);
  const [tare, setTare] = useState(sample?.emptyVehicleWeight || 0);
  const [flc, setFlc] = useState(sample?.flcPercent || 0);
  const [mois, setMois] = useState(sample?.moistureDeduction || 0);
  const [dmg, setDmg] = useState(sample?.damagedLeaf || 0);

  if (!sample) {
    return (
      <div className="modal z-[200]">
        <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12 text-amber-500 opacity-20" />
          <p className="text-slate-800 font-black uppercase tracking-widest text-xs">Record context lost</p>
          <button onClick={close} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px]">Back to list</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal z-[500] p-3 sm:p-4 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] w-full max-w-2xl max-h-[92vh] relative border border-white modal-enter flex flex-col">
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-t-[2rem] sm:rounded-t-[2.5rem]"></div>

        {/* Scrollable content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-5 sm:p-8 pt-6 sm:pt-10">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner"><Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /></div>
              <div>
                <h3 className="font-serif font-black text-xl sm:text-2xl text-slate-800 uppercase tracking-tight">System Record Edit</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Serial Tag: <span className="text-emerald-600">#{sample.sampleSerialNo}</span></p>
              </div>
            </div>
            <button onClick={close} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"><X className="w-6 h-6 text-slate-300" /></button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-1.5 col-span-2 sm:col-span-1 lg:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Garden / Party Name</label>
              <input type="text" value={party} onChange={e => setParty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Vehicle No</label>
              <input type="text" value={veh} onChange={e => setVeh(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Gross Weight</label>
              <div className="relative">
                <input type="number" value={gross} onChange={e => setGross(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none pr-10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Empty Weight</label>
              <div className="relative">
                <input type="number" value={tare} onChange={e => setTare(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none pr-10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">FLC %</label>
              <input type="number" value={flc} onChange={e => setFlc(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Moisture %</label>
              <input type="number" value={mois} onChange={e => setMois(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Damaged %</label>
              <input type="number" value={dmg} onChange={e => setDmg(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Sticky footer with action buttons - always visible */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-slate-100 bg-white/80 backdrop-blur-sm rounded-b-[2rem] sm:rounded-b-[2.5rem] flex flex-col sm:flex-row gap-3">
          <button onClick={() => updateSample(sample.id, { 
            partyName: party, vehicleNo: veh, 
            grossLoadedWeight: gross, emptyVehicleWeight: tare,
            flcPercent: flc, moistureDeduction: mois, damagedLeaf: dmg
          })} className="flex-grow bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-4 rounded-[1.25rem] font-black text-[10px] sm:text-xs tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 uppercase group">
            <Save className="w-4 h-4 group-hover:rotate-12 transition-transform"/> Commit Update
          </button>
          <button onClick={close} className="bg-slate-100 text-slate-500 hover:text-slate-800 py-4 px-8 rounded-[1.25rem] font-black text-[10px] sm:text-xs uppercase transition tracking-widest hover:bg-slate-200">Discard</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [db, setDb] = useState(INITIAL_DB);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('loading'); // setup, login, main

  // App initialization (Fetch from Backend)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/db`);
        if (!res.ok) throw new Error("API DOWN");
        const data = await res.json();
        setDb(data);
        
        // Logical Routing
        if (data.users.length === 0) {
          setView('setup');
        } else if (!currentUser) {
          const savedUserId = sessionStorage.getItem('teaAppUserId');
          if (savedUserId) {
            const user = data.users.find(u => u.id === savedUserId);
            if (user) {
              setCurrentUser(user);
              if (view === 'login' || view === 'setup' || view === 'loading') setView('main');
            } else {
              setView('login');
            }
          } else {
            if (view === 'loading') setView('login');
          }
        }
      } catch (e) {
        console.error("Cloud Sync Error:", e);
        // Local fallback if cloud is unreachable
        const stored = localStorage.getItem('teaAppDb');
        if (stored && view === 'loading') {
          setDb(JSON.parse(stored));
          setView('login');
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, [view, currentUser]);

  // Sync DB to the remote ON-PREM server
  const saveDB = async (newDb) => {
    setDb(newDb);
    // Note: The Worker handles specific entity updates via dedicated endpoints.
    // For direct DB updates from UI actions, we'll implement individual save triggers 
    // to keep it efficient on Cloudflare D1.
  };

  const toast = (msg, type = 'success') => {
    const t = document.createElement('div');
    t.className = `fixed bottom-8 right-8 flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600/90' : 'bg-red-600/90'} backdrop-blur-xl text-white py-4 px-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[99999] font-black uppercase tracking-widest text-[10px] animate-bloom border border-white/20`;
    t.innerHTML = `
      <div class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-300' : 'bg-red-300'} animate-pulse"></div>
      ${msg}
    `;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(20px) scale(0.9)';
      t.style.transition = 'all 0.5s ease-in-out';
      setTimeout(() => t.remove(), 500);
    }, 3500);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('teaAppUserId');
    setCurrentUser(null);
    setView('login');
  };

  if (view === 'loading') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen text-slate-100 w-full flex flex-col relative bg-transparent font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden">
      <SlideshowBackground />
      
      <div className="flex-grow z-10 w-full relative">
        {view === 'setup' && <SetupView saveDB={saveDB} setView={setView} toast={toast} />}
        {view === 'login' && <LoginView db={db} setCurrentUser={setCurrentUser} setView={setView} saveDB={saveDB} toast={toast} />}
        {view === 'main' && <MainView db={db} saveDB={saveDB} currentUser={currentUser} handleLogout={handleLogout} toast={toast} />}
      </div>
      <GlobalFooter />
    </div>
  );
}

// --- VIEWS ---

function SetupView({ saveDB, setView, toast }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleSetup = async () => {
    if (!name || !id || !password) return toast("Complete all fields", "error");
    const passError = validatePassword(password);
    if (passError) return toast(passError, "error");
    
    try {
      const res = await fetch(`${API_URL}/api/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id.trim().toUpperCase(), fullName: name.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (data.success) {
        toast("System Activated! Please login with your new credentials.");
        setView('login');
      }
    } catch (e) {
      toast("Connection Failed", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      <div className="glass-card rounded-[3rem] w-full max-w-md p-8 sm:p-14 relative z-10 animate-bloom overflow-hidden card-3d">
        <div className="absolute top-0 left-0 w-full h-[1px] shimmer-bar opacity-50"></div>
        <div className="flex justify-center mb-10">
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-10 group-hover/logo:opacity-20 transition-opacity animate-pulse"></div>
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-full shadow-[0_15px_50px_rgba(16,185,129,0.1)] ring-2 ring-emerald-500/10 relative animate-float">
              <ShieldAlert className="w-12 h-12 text-emerald-600 opacity-90" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-serif font-black text-center text-slate-800 tracking-wide mb-2 uppercase animate-fadeUp">System Setup</h1>
        <p className="text-xs text-slate-500 mb-10 text-center font-bold tracking-[0.2em] uppercase animate-fadeUp delay-100">Create the master administrator account.</p>
        <div className="space-y-5">
          <div className="relative group/input animate-fadeUp delay-200">
            <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600/50 group-focus-within/input:text-emerald-500 transition-colors" />
            <input type="text" placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all font-mono tracking-widest text-sm" />
          </div>
          <div className="relative group/input animate-fadeUp delay-300">
            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600/50 group-focus-within/input:text-emerald-500 transition-colors" />
            <input type="text" placeholder="ADMIN USER ID" value={id} onChange={e => setId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all font-mono tracking-widest text-sm" />
          </div>
          <div className="relative group/input animate-fadeUp delay-400">
            <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600/50 group-focus-within/input:text-emerald-500 transition-colors" />
            <input type="password" placeholder="SET PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all font-mono tracking-widest text-sm" />
            <PasswordHints password={password} />
          </div>
          <div className="pt-4 animate-fadeUp delay-500">
            <button onClick={handleSetup} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-4 rounded-lg font-bold tracking-[0.2em] text-xs shadow-lg transition-all flex items-center justify-center gap-3 uppercase group/btn">
              Activate System
              <Zap className="w-4 h-4 group-hover/btn:scale-110 transition-transform opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const count = 60;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: -(Math.random() * 0.5 + 0.2),
      o: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52,211,153,${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
      });
      // subtle connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(52,211,153,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

function LoginView({ db, saveDB, setCurrentUser, setView, toast }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // register fields
  const [rName, setRName] = useState('');
  const [rId, setRId] = useState('');
  const [rPass, setRPass] = useState('');
  const [rPass2, setRPass2] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async () => {
    setError('');
    const upperId = id.trim().toUpperCase();
    try {
      const res = await fetch(`${API_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: upperId, password: password.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        sessionStorage.setItem('teaAppUserId', data.user.id);
        setView('main');
        toast(`Welcome back, ${data.user.fullName}`);
      } else {
        setError(data.message || 'INVALID CREDENTIALS');
      }
    } catch (e) {
      setError('CONNECTION FAILED');
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!rName.trim() || !rId.trim() || !rPass || !rPass2) return setError('PLEASE FILL ALL FIELDS');
    if (rPass !== rPass2) return setError('PASSWORDS DO NOT MATCH');
    const passError = validatePassword(rPass);
    if (passError) return setError(passError);
    const upperId = rId.trim().toUpperCase();
    
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: upperId, fullName: rName.trim(), password: rPass })
      });
      const data = await res.json();
      if (data.success) {
        setRegSuccess(true);
      } else {
        setError(data.message || 'REGISTRATION FAILED');
      }
    } catch (e) {
      setError('CONNECTION FAILED');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Animated particle canvas */}
      <ParticleCanvas />
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-breathe"></div>
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-breathe delay-500"></div>
      </div>

      {/* Logo */}
      <div className="mb-10 text-center select-none z-10 animate-fadeDown depth-element">
        <div className="inline-flex items-center justify-center p-5 bg-emerald-500/10 rounded-full shadow-[0_15px_50px_rgba(16,185,129,0.15)] mb-5 ring-1 ring-emerald-500/30 animate-float backdrop-blur-md">
          <Leaf className="w-10 h-10 text-emerald-400 opacity-90" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-black text-white tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">TEA LEAF FLC</h1>
        <div className="flex items-center justify-center gap-4 mt-4 opacity-80">
          <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-emerald-400"></div>
          <p className="text-emerald-300 font-black uppercase tracking-[0.4em] text-[10px] text-shadow-sm">Quality Control System</p>
          <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-emerald-400"></div>
        </div>
      </div>

      {/* Card */}
      <div className="glass-card rounded-[2.5rem] p-4 w-full max-w-md relative z-10 overflow-hidden animate-bloom border-beam-wrapper card-3d">
        <div className="absolute top-0 left-0 w-full h-[1px] shimmer-bar"></div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => { setTab('login'); setError(''); setRegSuccess(false); }}
            className={`flex-1 py-5 text-xs tracking-[0.25em] uppercase font-black transition-all ${
              tab === 'login'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/40 text-shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-4 text-xs tracking-[0.2em] uppercase font-bold transition-all ${
              tab === 'register'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/40 text-shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Request Access
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {tab === 'login' ? (
            <div className="space-y-6">
              <div className="relative group/input animate-slideInLeft">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="text" placeholder="USER ID" value={id} onChange={e => { setId(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition-all font-mono tracking-widest text-sm" />
              </div>
              <div className="relative group/input animate-slideInLeft delay-100">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="password" placeholder="PASSWORD" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition-all tracking-widest text-sm" />
              </div>
              <div className="pt-2 animate-fadeUp delay-200">
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-4 rounded-xl font-bold tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 group uppercase">
                  Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300 opacity-90" />
                </button>
              </div>
              {error && <p className="text-red-400 text-center font-bold py-2 border-b border-red-500/20 text-xs tracking-wider uppercase animate-fadeUp">{error}</p>}
              <p className="text-center text-slate-300 text-[10px] uppercase tracking-widest pt-2">Don't have access? <button onClick={() => setTab('register')} className="text-emerald-400 font-black hover:text-emerald-300 transition-colors drop-shadow-sm ml-1">Request Here</button></p>
            </div>
          ) : regSuccess ? (
            // Success state
            <div className="text-center py-6 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-md">
                <UserPlus className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-serif font-black text-white mb-2">Request Submitted!</h3>
              <p className="text-slate-300 text-xs leading-relaxed tracking-wide mb-6">Your access request has been sent to the administrator for approval. You'll be able to sign in once approved.</p>
              <button onClick={() => { setTab('login'); setRegSuccess(false); setRName(''); setRId(''); setRPass(''); setRPass2(''); }} className="text-emerald-400 text-xs uppercase tracking-widest font-black hover:text-emerald-300 transition-colors">← Back to Sign In</button>
            </div>
          ) : (
            // Registration form
            <div className="space-y-5 animate-fadeUp">
              <p className="text-slate-300 text-[10px] uppercase tracking-[0.25em] mb-4">Fill in details for Admin approval.</p>
              <div className="relative group/input">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="text" placeholder="FULL NAME" value={rName} onChange={e => { setRName(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition-all text-sm tracking-wide" />
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="text" placeholder="CHOOSE USER ID" value={rId} onChange={e => { setRId(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition-all font-mono tracking-widest text-sm" />
              </div>
              <div className="relative group/input">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="password" placeholder="PASSWORD" value={rPass} onChange={e => { setRPass(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition-all tracking-widest text-sm" />
                <PasswordHints password={rPass} />
              </div>
              <div className="relative group/input">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="password" placeholder="CONFIRM PASSWORD" value={rPass2} onChange={e => { setRPass2(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition-all tracking-widest text-sm" />
              </div>
              {error && <p className="text-red-400 text-xs tracking-wider uppercase font-bold border-b border-red-500/20 py-1">{error}</p>}
              <button onClick={handleRegister} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-4 rounded-xl font-bold tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 group uppercase mt-2">
                Submit Access Request <UserPlus className="w-4 h-4 opacity-90 group-hover:scale-110 transition-transform" />
              </button>
              <p className="text-center text-slate-300 text-[10px] uppercase tracking-widest"><button onClick={() => { setTab('login'); setError(''); }} className="text-emerald-400 font-black hover:text-emerald-300 transition-colors ml-1">← Back to Sign In</button></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function MainView({ db, saveDB, currentUser, handleLogout, toast }) {
  const today = new Date().toISOString().split('T')[0];
  const [activeModal, setActiveModal] = useState(null); // { type, sampleId, serial }
  const [filterStartDate, setFilterStartDate] = useState(today);
  const [filterEndDate, setFilterEndDate] = useState(today);
  const [filterGarden, setFilterGarden] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerRole, setScannerRole] = useState(null);

  const handleScannerClose = useCallback(() => setIsScannerOpen(false), []);
  const handleScan = useCallback((serial) => {
    const sample = db.samples.find(s => String(s.sampleSerialNo) === String(serial));
    if (sample) {
      if (scannerRole === 'analyst' && sample.status === 'pending_qc') {
        setIsScannerOpen(false);
        setActiveModal({ type: 'qcAnalysis', sampleId: sample.id });
      } else if (scannerRole === 'clerk' && sample.status === 'awaiting_final_weight') {
        setIsScannerOpen(false);
        setActiveModal({ type: 'finalWeight', sampleId: sample.id });
      } else {
        toast('Sample state not correct for this scan', 'error');
      }
    } else {
      toast('Tag not recognized', 'error');
    }
  }, [db.samples, scannerRole, toast]);

  // Helper arrays
  const pendingFinal = db.samples.filter(s => s.status === 'awaiting_final_weight');
  const pendingQC = db.samples.filter(s => s.status === 'pending_qc');

  let sortedFilteredSamples = [...db.samples];
  if (filterStartDate || filterEndDate) {
    sortedFilteredSamples = sortedFilteredSamples.filter(s => {
      if (!s.createdAt) return false;
      const createdDate = s.createdAt.slice(0, 10);
      if (filterStartDate && createdDate < filterStartDate) return false;
      if (filterEndDate && createdDate > filterEndDate) return false;
      return true;
    });
  }
  if (filterGarden) {
    sortedFilteredSamples = sortedFilteredSamples.filter(s => s.partyName === filterGarden);
  }
  sortedFilteredSamples.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(sortedFilteredSamples.length / itemsPerPage);
  const paginatedSamples = sortedFilteredSamples.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStartDate, filterEndDate, filterGarden]);

  const stats = useMemo(() => {
    if (!sortedFilteredSamples.length) return null;
    const totalNet = sortedFilteredSamples.reduce((acc, s) => acc + (s.netWeight || 0), 0);
    const totalFinal = sortedFilteredSamples.reduce((acc, s) => acc + (s.finalCalculatedWeight || 0), 0);
    const avgFLC = sortedFilteredSamples.reduce((acc, s) => acc + (s.flcPercent || 0), 0) / sortedFilteredSamples.length;
    return { totalNet, totalFinal, avgFLC };
  }, [sortedFilteredSamples]);

  // Modals Data
  const closeModals = () => { setActiveModal(null); };

  const submitSample = async (veh, garden, gross) => {
    if (!veh || !garden || isNaN(gross)) return toast("Fill Garden, Vehicle and Weight", "error");
    
    const sample = {
      partyName: garden,
      vehicleNo: veh.trim(),
      grossLoadedWeight: gross,
      netWeight: 0,
      flcPercent: 0,
      moistureDeduction: 0,
      damagedLeaf: 0,
      finalCalculatedWeight: 0,
      status: 'pending_qc'
    };

    try {
      const res = await fetch(`${API_URL}/api/save-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample)
      });
      const data = await res.json();
      if (data.success) {
        toast("Record Created!");
        // OPEN QR MODAL IMMEDIATELY
        if (data.serial) {
          setActiveModal({ type: 'qr', serial: data.serial });
        }
      } else {
        toast(data.message || "Save Failed", "error");
      }
    } catch (e) { toast("Sync failed", "error"); }
  };

  const submitQC = async (sampleId, fPct, mPct, dPct) => {
    const s = db.samples.find(x => x.id === sampleId);
    if (!s) return;

    const payload = {
      ...s,
      flcPercent: parseFloat(fPct) || 0,
      moistureDeduction: parseFloat(mPct) || 0,
      damagedLeaf: parseFloat(dPct) || 0,
      status: 'awaiting_final_weight'
    };

    try {
      const res = await fetch(`${API_URL}/api/save-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast("Analysis Saved!");
        closeModals();
      } else {
        toast(data.message || "Save Failed", "error");
      }
    } catch (e) { toast("Sync Error", "error"); }
  };

  const submitFinalWeight = async (sampleId, tare) => {
    const s = db.samples.find(x => x.id === sampleId);
    if (!s) return;

    const tareVal = parseFloat(tare) || 0;
    const netLeaf = s.grossLoadedWeight - tareVal;
    const finalWt = netLeaf * (1 - ((s.moistureDeduction + s.damagedLeaf) / 100));

    const payload = {
      ...s,
      emptyVehicleWeight: tareVal,
      netWeight: netLeaf,
      finalCalculatedWeight: parseFloat(finalWt.toFixed(2)),
      status: 'complete'
    };

    try {
      const res = await fetch(`${API_URL}/api/save-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast("Record Completed!");
        closeModals();
      } else {
        toast(data.message || "Save Failed", "error");
      }
    } catch (e) { toast("Sync Error", "error"); }
  };

  const updateSample = async (id, payload) => {
    const s = db.samples.find(x => x.id === id);
    if (!s) return;
    const finalPayload = { ...s, ...payload };
    try {
      await fetch(`${API_URL}/api/save-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      toast("Record Updated!");
      closeModals();
    } catch (e) { toast("Sync Error", "error"); }
  };

  const deleteSample = async (id) => {
    if (!window.confirm("ARE YOU SURE?")) return;
    try {
      await fetch(`${API_URL}/api/delete-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      toast("Record Deleted", "error");
    } catch (e) { toast("Delete error", "error"); }
  };


  // Export / Backup handling
  const exportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `tea_flc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
    toast("Database Backup Saved to Downloads");
  };

  const importDatabase = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.users) {
          saveDB(imported);
          toast("Data Restored Successfully!");
        }
      } catch (err) { toast("Error: Invalid Backup File", "error"); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const downloadCSV = () => {
    if (!sortedFilteredSamples.length) return toast("No completed reports to export", "error");
    const head = "Date,Serial,Garden,Vehicle,Gross Loaded,Empty Vehicle,Net Leaf,FLC%,Moisture%,Damage%,Final Weight\n";
    const body = sortedFilteredSamples.map(x => {
      return `${new Date(x.createdAt).toLocaleDateString()},${x.sampleSerialNo},${x.partyName},${x.vehicleNo},${x.grossLoadedWeight},${x.emptyVehicleWeight},${x.netWeight},${x.flcPercent},${x.moistureDeduction},${x.damagedLeaf},${x.finalCalculatedWeight}`;
    }).join('\n');
    const blob = new Blob([head + body], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const fileName = `flc_report_${new Date().toISOString().split('T')[0]}.csv`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeModal || isScannerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeModal, isScannerOpen]);

  return (
    <>
      <div className="relative w-full flex flex-col">
        
        <nav className="p-4 md:p-6 mb-8 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-2.5 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-500 shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-black text-xl md:text-2xl text-white tracking-tighter leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">FLC System</h1>
              <p className="text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] mt-1 ml-0.5 opacity-90 overflow-hidden relative text-shadow-sm">
                Premium Tea Control
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-400/50 transform -translate-x-full animate-[shimmer_3s_infinite]"></span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none drop-shadow-sm">Accessing as</span>
              <span className="text-xs font-bold text-emerald-400 tracking-tight drop-shadow-sm">{currentUser.fullName}</span>
            </div>
            <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-white/10 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-95 flex items-center gap-2 group backdrop-blur-md">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform"/> EXIT
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 pb-12 z-10">
          {(currentUser.role === 'clerk' || currentUser.role === 'analyst' || currentUser.role === 'master') && (
            <ClerkSection
              db={db} submitSample={submitSample}
              pendingFinal={pendingFinal}
              openFinalWeightModal={(id) => setActiveModal({ type: 'finalWeight', sampleId: id })}
              openScanner={() => { setScannerRole('clerk'); setIsScannerOpen(true); }}
            />
          )}

          {(currentUser.role === 'clerk' || currentUser.role === 'analyst' || currentUser.role === 'master') && (
            <AnalystSection
              pendingQC={pendingQC}
              openFlcModal={(id) => setActiveModal({ type: 'qcAnalysis', sampleId: id })}
              openScanner={() => { setScannerRole('analyst'); setIsScannerOpen(true); }}
            />
          )}

          <div className="glass-card rounded-[2.5rem] p-6 md:p-10 overflow-hidden relative z-10 card-3d animate-bloom delay-300 border-beam-wrapper">
            <div className="absolute top-0 left-0 w-full h-[2px] shimmer-bar"></div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner"><FileSpreadsheet className="w-8 h-8 text-emerald-600" /></div>
                <h2 className="text-2xl font-serif font-black text-white uppercase tracking-widest">Daily Quality Summary</h2>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                  <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 z-10" />
                  <select 
                    value={filterGarden} 
                    onChange={e => setFilterGarden(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 pl-10 pr-8 py-3 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">All Gardens</option>
                    {db.parties.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow md:flex-grow-0">
                    <span className="absolute -top-5 left-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest">From</span>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                    <input 
                      type="date" 
                      value={filterStartDate} 
                      onChange={e => setFilterStartDate(e.target.value)} 
                      disabled={currentUser.role !== 'master'}
                      title={currentUser.role !== 'master' ? "Date selection locked (Master Only)" : ""}
                      className={`w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm ${currentUser.role !== 'master' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`} 
                    />
                  </div>
                  <div className="relative flex-grow md:flex-grow-0">
                    <span className="absolute -top-5 left-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest">To</span>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                    <input 
                      type="date" 
                      value={filterEndDate} 
                      onChange={e => setFilterEndDate(e.target.value)} 
                      disabled={currentUser.role !== 'master'}
                      title={currentUser.role !== 'master' ? "Date selection locked (Master Only)" : ""}
                      className={`w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm ${currentUser.role !== 'master' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}  
                    />
                  </div>
                </div>
                <button onClick={downloadCSV} className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-6 py-3 rounded-xl text-xs tracking-widest font-black shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0 uppercase"><Download className="w-4 h-4 opacity-70" /> CSV</button>
              </div>
            </div>

            {stats && filterGarden && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group hover:bg-emerald-500/10 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform"><Leaf className="w-16 h-16 text-emerald-600" /></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-60">Total Net leaf</span>
                  <div className="text-2xl font-serif font-black text-white">{stats.totalNet.toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span></div>
                </div>
                <div className="bg-teal-500/5 border border-teal-500/10 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group hover:bg-teal-500/10 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform"><Database className="w-16 h-16 text-teal-600" /></div>
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest opacity-60">Final Weight</span>
                  <div className="text-2xl font-serif font-black text-white">{stats.totalFinal.toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span></div>
                </div>
                <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group hover:bg-orange-500/10 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform"><Search className="w-16 h-16 text-orange-600" /></div>
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest opacity-60">Avg FLC %</span>
                  <div className="text-2xl font-serif font-black text-white">{stats.avgFLC.toFixed(2)}%</div>
                </div>
              </div>
            )}            {/* Mobile: card layout — Desktop: table layout */}
            <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {sortedFilteredSamples.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold tracking-widest uppercase bg-white/5 border border-slate-100/10 border-dashed rounded-xl flex flex-col items-center gap-3 text-xs">
                  <FileSpreadsheet className="w-8 h-8 opacity-20" />No records for selected filters
                </div>
              ) : paginatedSamples.map((s, i) => (
                <div key={s.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-sm row-anim" style={{ animationDelay: `${i * 60}ms` }}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-black text-white font-mono tracking-widest text-sm">#{s.sampleSerialNo}</span>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">{s.partyName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.vehicleNo}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                      s.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      s.status === 'awaiting_final_weight' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {s.status?.replace('_', ' ')}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-60">Final</div>
                      <div className="text-lg font-black text-emerald-400">{s.status === 'complete' ? s.finalCalculatedWeight : '---'}</div>
                      <div className="text-[9px] font-bold text-emerald-500/50 uppercase">Kgs</div>
                    </div>
                  </div>
                  {/* Card Details Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross</div>
                      <div className="text-xs font-bold text-white">{s.grossLoadedWeight}</div>
                      <div className="text-[9px] text-slate-500">Kgs</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Empty</div>
                      <div className="text-xs font-bold text-white">{s.emptyVehicleWeight || '---'}</div>
                      <div className="text-[9px] text-slate-500">Kgs</div>
                    </div>
                    <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center">
                      <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Net</div>
                      <div className="text-xs font-bold text-emerald-400">{s.status === 'complete' ? s.netWeight : '---'}</div>
                      <div className="text-[9px] text-emerald-500/40">Kgs</div>
                    </div>
                  </div>
                  {/* Admin Actions */}
                  {currentUser.role === 'master' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5 justify-end">
                      <button onClick={() => setActiveModal({ type: 'edit', sampleId: s.id })} className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => deleteSample(s.id)} className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">
                        <Trash2 className="w-3.5 h-3.5" /> Del
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar rounded-xl border border-white/10 shadow-sm bg-white/5">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-white/40 backdrop-blur-md sticky top-0 z-[5]">
                  <tr>
                    <th className="p-5 text-left rounded-tl-[1.5rem] border-b border-slate-100">Serial</th>
                    <th className="p-5 text-left border-b border-slate-100">Status</th>
                    <th className="p-5 text-left border-b border-slate-100">Garden/Transport</th>
                    <th className="p-5 text-left border-b border-slate-100">Weight Breakup</th>
                    <th className="p-5 text-left border-b border-slate-100">QC Data</th>
                    <th className="p-5 text-left border-b border-slate-100 text-emerald-600 font-black">Final Weight</th>
                    {currentUser.role === 'master' && <th className="p-5 border-b border-slate-100 text-center rounded-tr-[1.5rem]">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSamples.map((s, i) => (
                    <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors row-anim" style={{ animationDelay: `${i * 60}ms` }}>
                      <td className="p-4 font-black text-slate-400">#{s.sampleSerialNo}</td>
                      <td className="p-4 px-2">
                         <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                            s.status === 'complete' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                            s.status === 'awaiting_final_weight' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            'bg-slate-500/10 border-slate-500/20 text-slate-500 text-center'
                          }`}>
                            {s.status?.replace(/_/g, ' ')}
                            {(currentUser.role === 'master' || currentUser.role === 'analyst' || currentUser.role === 'clerk') && (
                              <button 
                                onClick={() => {
                                  if (s.status === 'pending_qc') setActiveModal({ type: 'qcAnalysis', sampleId: s.id });
                                  if (s.status === 'awaiting_final_weight') setActiveModal({ type: 'finalWeight', sampleId: s.id });
                                }}
                                className={`ml-2 px-2 py-0.5 rounded border text-[8px] font-bold transition-all active:scale-95 ${
                                  s.status === 'pending_qc' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/40' :
                                  s.status === 'awaiting_final_weight' ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 hover:bg-teal-500/40' :
                                  'hidden'
                                }`}
                              >
                                {s.status === 'pending_qc' ? 'DO QC' : s.status === 'awaiting_final_weight' ? 'DO TARE' : ''}
                              </button>
                            )}
                          </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 tracking-wide">{s.partyName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">{s.vehicleNo}</div>
                      </td>
                      <td className="p-4 leading-tight">
                        <div className="text-xs text-slate-400">Gross: <span className="text-white font-bold">{s.grossLoadedWeight}</span> Kgs</div>
                        <div className="text-xs text-slate-500 italic mt-0.5">Empty: <span className="text-slate-300">{s.emptyVehicleWeight || '---'}</span> Kgs</div>
                        <div className="font-bold text-emerald-400 mt-1">Net: {s.status === 'complete' ? `${s.netWeight} Kgs` : '---'}</div>
                      </td>
                      <td className="p-4 leading-tight space-y-1">
                        <div className="text-[10px] font-bold text-slate-300"><span className="text-slate-500">FLC:</span> {s.flcPercent}%</div>
                        <div className="text-[10px] text-slate-400"><span className="text-slate-500">M:</span> {s.moistureDeduction}%</div>
                        <div className="text-[10px] text-slate-400"><span className="text-slate-500">D:</span> {s.damagedLeaf}%</div>
                        <div className="text-[10px] text-amber-500/80 font-black mt-1">Total: {((s.moistureDeduction || 0) + (s.damagedLeaf || 0)).toFixed(2)}%</div>
                      </td>
                      <td className="p-4">
                        {s.status === 'complete' ? (
                          <div className="text-lg font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{s.finalCalculatedWeight} <span className="text-[10px] font-medium opacity-50">Kgs</span></div>
                        ) : (
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-40">Awaiting completion</div>
                        )}
                      </td>
                      {currentUser.role === 'master' && (
                        <td className="p-5">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => setActiveModal({ type: 'edit', sampleId: s.id })} className="p-2 text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"><Pencil className="w-5 h-5"/></button>
                            <button onClick={() => deleteSample(s.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage * itemsPerPage, sortedFilteredSamples.length)}</span> of <span className="text-white">{sortedFilteredSamples.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3 h-3" /> Prev
                  </button>
                  <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar pb-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black transition-all ${
                          currentPage === i + 1 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentUser.role === 'master' && (
            <AdminSection 
              db={db} saveDB={saveDB} toast={toast} 
              importDatabase={importDatabase} currentUser={currentUser} 
              exportDatabase={exportDatabase} setFilterGarden={setFilterGarden} 
            />
          )}
        </main>
      </div>

      {/* PORTAL STYLE MODALS (Rendered outside transformed container) */}
      <div className={`fixed inset-0 z-[1000] pointer-events-none transition-opacity duration-300 ${(activeModal || isScannerOpen) ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}>
        {activeModal?.type === 'qr' && <QRModal serial={activeModal.serial} close={closeModals} />}
        {activeModal?.type === 'qcAnalysis' &&
          <QCModal sample={db.samples.find(s => String(s.id) === String(activeModal.sampleId))} close={closeModals} submitQC={submitQC} />
        }
        {activeModal?.type === 'finalWeight' &&
          <FinalWeightModal sample={db.samples.find(s => String(s.id) === String(activeModal.sampleId))} close={closeModals} submitFinal={(tare) => submitFinalWeight(activeModal.sampleId, tare)} />
        }
        {activeModal?.type === 'edit' &&
          <EditModal 
            key={activeModal.sampleId}
            sample={db.samples.find(s => String(s.id) === String(activeModal.sampleId))} 
            close={closeModals} 
            updateSample={updateSample} 
          />
        }
        {isScannerOpen &&
          <ScannerModal
            close={handleScannerClose}
            onScan={handleScan}
          />
        }
      </div>
    </>
  );
}

// --- Specific Roles Sections ---

function ClerkSection({ db, submitSample, pendingFinal, openFinalWeightModal, openScanner }) {
  const [vehicle, setVehicle] = useState('');
  const [garden, setGarden] = useState('');
  const [gross, setGross] = useState('');

  const onGenerate = () => {
    submitSample(vehicle, garden, parseFloat(gross));
    setVehicle(''); setGarden(''); setGross('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 transform-style-preserve-3d relative z-10">
      <div className="glass-card rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden card-3d animate-bloom border-beam-wrapper">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-400/10 rounded-xl border border-emerald-400/20 shadow-inner"><Database className="w-5 h-5 text-emerald-400" /></div>
          <h2 className="text-xl font-serif font-black text-white uppercase tracking-widest">1. Initial Entry (Gross)</h2>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Vehicle No" maxLength="15" value={vehicle} onChange={e => setVehicle(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all shadow-sm tracking-widest" />
            <select value={garden} onChange={e => setGarden(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all shadow-sm tracking-wider">
              <option value="" className="bg-white">Select Garden</option>
              {db.parties.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.name} className="bg-white">{p.name}</option>
              ))}
            </select>
          </div>
          <input type="number" placeholder="Gross Loaded Weight (Kgs)" value={gross} onChange={e => setGross(e.target.value)} className="w-full px-4 py-6 bg-white border border-slate-200 rounded-xl font-black text-3xl text-emerald-600 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all shadow-sm" />
          <button onClick={onGenerate} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-5 rounded-xl font-bold tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 transition-all group uppercase text-sm">
            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform opacity-80" /> GENERATE TAG
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden flex flex-col card-3d animate-bloom delay-100">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-teal-500 to-sky-700"></div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-400/10 rounded-xl border border-teal-400/20 shadow-inner"><Save className="w-5 h-5 text-teal-400" /></div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-widest">2. Final Tare Weight</h2>
          </div>
          <button onClick={openScanner} className="bg-teal-400/10 hover:bg-teal-400/20 text-teal-300 px-5 py-3 rounded-2xl border border-teal-400/20 font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all active:scale-95">
            <Search className="w-4 h-4 opacity-70" /> SCAN TAG
          </button>
        </div>
        <div className="flex-grow">
          <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${pendingFinal.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></div> 
            waiting for tare weight: <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{pendingFinal.length}</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {pendingFinal.length === 0 ? (
              <div className="col-span-full py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white/5 rounded-2xl border border-dashed border-white/10">
                No samples awaiting tare.<br/>
                <span className="text-[8px] opacity-60">Complete QC Analysis first to move samples here.</span>
              </div>
            ) : pendingFinal.map(s => (
              <button key={s.id} onClick={() => openFinalWeightModal(s.id)} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-teal-400 rounded-2xl font-mono font-black text-slate-300 text-sm transition-all hover:scale-[1.03] shadow-sm group text-left">
                <span className="text-teal-400 group-hover:text-teal-300 transition-colors">#</span> {s.sampleSerialNo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalystSection({ pendingQC, openFlcModal, openScanner }) {
  return (
    <div className="glass-card rounded-[2.5rem] p-6 md:p-10 mb-12 relative overflow-hidden z-10 card-3d animate-bloom delay-200 border-beam-wrapper">
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-amber-700"></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 rounded-xl border border-amber-400/20 shadow-inner"><Leaf className="w-5 h-5 text-amber-400" /></div>
          <div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-widest">Quality Lab Entry</h2>
            <p className="text-[10px] text-slate-300 font-black tracking-[0.2em] uppercase mt-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pending Analysis: <span className="text-amber-400">{pendingQC.length}</span></p>
          </div>
        </div>
        <button onClick={openScanner} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-4 rounded-xl font-bold tracking-[0.2em] shadow-lg flex items-center gap-3 uppercase transition-all group w-full md:w-auto justify-center text-sm">
          <Search className="w-4 h-4 group-hover:scale-110 transition-transform opacity-80" /> SCAN SAMPLE QR
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
        {pendingQC.length === 0 ? (
          <p className="col-span-full text-center py-16 text-slate-400 font-bold tracking-widest uppercase bg-white/5 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-xs"><Leaf className="w-8 h-8 opacity-20" /> No Samples Pending</p>
        ) : pendingQC.map(s => (
          <button key={s.id} onClick={() => openFlcModal(s.id)} className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-400 rounded-xl text-center font-mono font-bold text-white hover:scale-[1.03] transition-all shadow-sm group">
            <span className="text-[9px] block font-sans tracking-[0.3em] text-amber-500 mb-2 uppercase">Serial</span>
            <span className="text-white group-hover:text-amber-400 transition-colors font-black">#{s.sampleSerialNo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


function AdminSection({ db, saveDB, toast, importDatabase, currentUser, exportDatabase, setFilterGarden }) {
  const [nuName, setNuName] = useState('');
  const [nuId, setNuId] = useState('');
  const [nuPass, setNuPass] = useState('');
  const [nuRole, setNuRole] = useState('clerk');
  const [npName, setNpName] = useState('');
  const [approvalRoles, setApprovalRoles] = useState({});

  const addUser = async () => {
    const id = nuId.trim().toUpperCase();
    if (!nuName || !id || !nuPass) return toast("Enter name, ID and password", "error");
    if (db.users.some(u => u.id === id)) return toast("User ID exists", "error");
    const passError = validatePassword(nuPass);
    if (passError) return toast(passError, "error");
    
    try {
      const res = await fetch(`${API_URL}/api/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, fullName: nuName.trim(), role: nuRole, password: nuPass })
      });
      const data = await res.json();
      if (data.success) {
        toast("Staff Member Added");
        setNuName(''); setNuId(''); setNuPass(''); setNuRole('clerk');
      } else {
        toast(data.message, "error");
      }
    } catch (e) { toast("Sync Error", "error"); }
  };

  const deleteUser = async (id) => {
    if (id === currentUser.id) return;
    if (!window.confirm("ARE YOU SURE?")) return;
    try {
      await fetch(`${API_URL}/api/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      toast("Staff Removed");
    } catch (e) { toast("Sync Error", "error"); }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await fetch(`${API_URL}/api/update-user-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole })
      });
      toast(`Role updated for ${userId}`);
    } catch (e) { toast("Sync Error", "error"); }
  };

  const addParty = async () => {
    const n = npName.trim();
    if (!n) return;
    try {
      const res = await fetch(`${API_URL}/api/add-party`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n })
      });
      const data = await res.json();
      if (data.success) {
        toast("Garden Registered");
        setNpName('');
      } else {
        toast(data.message, "error");
      }
    } catch (e) { toast("Sync Error", "error"); }
  };

  const deleteParty = async (id) => {
    if (!window.confirm("DELETE THIS GARDEN?")) return;
    try {
      await fetch(`${API_URL}/api/delete-party`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      toast("Garden Removed");
    } catch (e) { toast("Sync Error", "error"); }
  };

  const resetSystem = async () => {
    const backupFirst = window.confirm("Before wiping the system, would you like to download a BACKUP of the current data? (Highly Recommended)");
    if (backupFirst) {
      exportDatabase();
      toast("Backup Downloaded. Proceeding to safety checks...");
      // Small delay to let the toast be seen
      await new Promise(r => setTimeout(r, 1000));
    }

    const confirm1 = window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE all users, gardens, and processing samples. This action CANNOT be undone. Are you absolutely sure?");
    if (confirm1) {
      const confirm2 = window.prompt("FINAL CONFIRMATION: To verify you understand this is a TOTAL SYSTEM WIPE, please type 'OK' (uppercase) in the box below:");
      if (confirm2 === 'OK') {
        try {
          const res = await fetch(`${API_URL}/api/reset-db`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            toast("System Reset Successful. Redirecting to setup...");
            sessionStorage.clear();
            setTimeout(() => window.location.reload(), 2000);
          } else {
            toast("Reset failed on server", "error");
          }
        } catch (e) { 
          console.error("Reset Sync Error:", e);
          toast("Sync Error: Backend unreachable", "error"); 
        }
      } else if (confirm2 !== null) {
        toast("Reset Cancelled: Verification failed", "error");
      }
    }
  };

  const pendingUsers = db.pendingUsers || [];

  const approveUser = async (pending) => {
    const chosenRole = approvalRoles[pending.id] || 'clerk';
    try {
      await fetch(`${API_URL}/api/approve-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pending.id, role: chosenRole })
      });
      toast(`${pending.fullName} approved as ${chosenRole}!`);
    } catch (e) { toast("Sync Error", "error"); }
  };

  const rejectUser = async (id) => {
    try {
      await fetch(`${API_URL}/api/reject-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      toast('Access request rejected', 'error');
    } catch (e) { toast("Sync Error", "error"); }
  };

  return (
    <div className="space-y-8 mb-12 relative z-10">

      {/* ── Pending Approvals ── */}
      <div className="glass-card rounded-[2.5rem] relative card-3d animate-bloom delay-300">
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
        </div>
        <div className="p-6 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner relative">
              <UserPlus className="w-6 h-6 text-amber-600" />
              {pendingUsers.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-[10px] text-white font-black flex items-center justify-center animate-pulse shadow-md">{pendingUsers.length}</span>}
            </div>
            <div>
              <h3 className="font-serif font-black text-2xl text-slate-800 uppercase tracking-widest">Pending Approvals</h3>
              <p className="text-[10px] text-slate-500 tracking-[0.25em] uppercase mt-1 font-bold">{pendingUsers.length === 0 ? 'No pending requests' : `${pendingUsers.length} awaiting your review`}</p>
            </div>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs uppercase tracking-widest bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-3">
              <UserPlus className="w-8 h-8 opacity-20" />
              No access requests pending
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {pendingUsers.map((u, i) => (
                <div key={u.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 group gap-4 row-anim" style={{animationDelay:`${i*70}ms`}}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm tracking-wide">{u.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-400 tracking-widest">({u.userId})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 tracking-widest uppercase">Requested {new Date(u.requestedAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <RoleDropdown 
                      variant="compact"
                      value={approvalRoles[u.id] || 'clerk'}
                      onChange={val => setApprovalRoles(prev => ({ ...prev, [u.id]: val }))}
                      options={ROLES}
                      icon={ShieldAlert}
                    />
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approveUser(u)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs uppercase tracking-widest font-bold shadow-md transition-all flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => rejectUser(u.id)} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Staff + Garden grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-6 md:p-10 rounded-[2.5rem] relative card-3d animate-bloom delay-400">
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-600"></div>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-400/10 rounded-2xl border border-indigo-400/20 shadow-inner"><UserPlus className="w-6 h-6 text-indigo-400" /></div>
          <h3 className="font-serif font-black text-2xl text-white uppercase tracking-widest">Staff Management</h3>
        </div>
        <div className="space-y-5 mb-8">
          <input type="text" placeholder="Full Name" value={nuName} onChange={e => setNuName(e.target.value)} className="w-full p-4 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm tracking-wider text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="User ID" value={nuId} onChange={e => setNuId(e.target.value)} className="w-full p-4 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm tracking-widest font-mono text-sm" />
            <div className="space-y-1">
              <input type="password" placeholder="Password" value={nuPass} onChange={e => setNuPass(e.target.value)} className="w-full p-4 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm tracking-widest text-sm" />
              <div className="px-2"><PasswordHints password={nuPass} /></div>
            </div>
          </div>
          <RoleDropdown 
            value={nuRole}
            onChange={setNuRole}
            options={ROLES}
            icon={ShieldAlert}
          />
          <button onClick={addUser} className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white py-4 rounded-xl font-bold tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 mt-4 text-xs uppercase group">
            Register Staff <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-70"/>
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {db.users.filter(u => u.status === 'approved').sort((a,b) => a.fullName.localeCompare(b.fullName)).map(u => (
            <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 group gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-black text-white tracking-widest text-xs uppercase">{u.userId}</span>
                  <RoleDropdown 
                    variant="compact"
                    value={u.role}
                    onChange={newRole => updateUserRole(u.id, newRole)}
                    options={ROLES}
                    icon={ShieldAlert}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">{u.fullName} <span className="opacity-20 mx-2">|</span> Pass: <span className="text-slate-400 blur-[2.5px] font-mono hover:blur-none transition-all ml-1">{u.password}</span></div>
              </div>
              {u.id !== currentUser.id && <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-4 self-center"><Trash2 className="w-4 h-4"/></button>}
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-6 md:p-10 rounded-[2.5rem] relative card-3d animate-bloom delay-500">
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-emerald-400/10 rounded-2xl border border-emerald-400/20 shadow-inner"><Leaf className="w-6 h-6 text-emerald-400" /></div>
          <h3 className="font-serif font-black text-2xl text-white uppercase tracking-widest">Garden Registry</h3>
        </div>
        <div className="flex gap-3 mb-8">
          <input type="text" placeholder="NEW GARDEN NAME" value={npName} onChange={e => setNpName(e.target.value)} className="flex-grow p-4 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl font-bold tracking-wide text-sm focus:border-emerald-500 outline-none transition-all shadow-sm" />
          <button onClick={addParty} className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center">+</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 flex-grow p-2 bg-slate-50 rounded-xl border border-slate-100">
          {db.parties.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
            <div 
              key={p.id} 
              onClick={() => {
                setFilterGarden(p.name);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toast(`Filtering for ${p.name}`);
              }}
              className="text-xs flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl font-bold tracking-wider text-slate-600 hover:shadow-md cursor-pointer transition-all hover:border-emerald-300 group"
            >
              <span className="truncate group-hover:text-emerald-600">{p.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteParty(p.id); }} className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-all"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-4 tracking-[0.2em] uppercase flex items-center gap-3"><Database className="w-3 h-3 text-emerald-500/50"/> Restore System Backup</label>
            <input type="file" onChange={importDatabase} className="text-[10px] w-full file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-[0.2em] file:bg-slate-100 file:text-emerald-700 hover:file:bg-emerald-50 file:transition-all cursor-pointer bg-white border border-slate-200 rounded-xl text-slate-400 shadow-sm" />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={resetSystem}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Factory Reset System
            </button>
            <p className="text-[9px] text-red-700/60 mt-3 text-center font-black uppercase tracking-widest">Warning: This action wipes all data including admin accounts</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// --- MODALS ---

function QRModal({ serial, close }) {
  const qrRef = useRef(null);

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
      qrRef.current.innerHTML = ''; // clear previous
      new window.QRCode(qrRef.current, {
        text: serial.toString(),
        width: 220, height: 220,
        colorDark: "#0f172a",
        correctLevel: window.QRCode.CorrectLevel.H
      });
    }
  }, [serial]);

  return (
    <div className="modal bg-white/10 backdrop-blur-md">
      <div className="bg-white/90 backdrop-blur-2xl p-6 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] text-center relative printable-area border border-white modal-enter max-h-[95vh] overflow-y-auto custom-scrollbar w-full max-w-sm sm:max-w-md">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 no-print"></div>
        <div className="flex justify-center mb-6 no-print">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100"><Printer className="w-8 h-8 text-blue-600" /></div>
        </div>
        <h2 className="font-serif font-black text-3xl mb-1 text-slate-800 uppercase tracking-tight">Bag Tag</h2>
        <p className="text-slate-400 font-black mb-8 tracking-widest uppercase">SERIAL #{serial}</p>
        <div ref={qrRef} className="flex justify-center p-6 bg-white border border-slate-100 rounded-[2rem] mb-10 flex-col items-center shadow-inner"></div>
        <div className="flex gap-4 no-print flex-col sm:flex-row">
          <button onClick={() => window.print()} className="flex-grow bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white py-4 px-6 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 group"><Printer className="w-5 h-5 group-hover:scale-110 transition-transform"/> PRINT TAG</button>
          <button onClick={close} className="bg-slate-100 text-slate-500 hover:text-slate-800 py-4 px-6 rounded-2xl font-black uppercase transition hover:bg-slate-200">CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function QCModal({ sample, close, submitQC }) {
  const [fPct, setF] = useState('');
  const [mPct, setM] = useState('');
  const [dPct, setD] = useState('');

  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  return (
    <div className="modal bg-white/10 backdrop-blur-md z-50">
      <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-sm relative overflow-hidden border border-white modal-enter">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
        <div className="flex items-center gap-4 mb-6 mt-2">
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100"><Search className="w-6 h-6 text-orange-600" /></div>
          <div>
            <h3 className="font-serif font-black text-2xl text-slate-800 uppercase tracking-tight">Lab Analysis</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase">SAMPLE #{sample?.sampleSerialNo} // {sample?.partyName}</p>
          </div>
        </div>
        <div className="space-y-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2"><Leaf className="w-3 h-3"/> FLC Percentage %</label>
            <input ref={inputRef} type="number" step="0.01" value={fPct} onChange={e => setF(e.target.value)} className="w-full bg-transparent border-0 text-3xl font-black text-orange-700 outline-none p-0 focus:ring-0 placeholder:text-orange-200" placeholder="0.00" />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2">Moisture Deduction %</label>
            <input type="number" step="0.01" value={mPct} onChange={e => setM(e.target.value)} className="w-full bg-transparent border-0 text-3xl font-black text-orange-700 outline-none p-0 focus:ring-0 placeholder:text-orange-200" placeholder="0.00" />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2">Damage Leaf %</label>
            <input type="number" step="0.01" value={dPct} onChange={e => setD(e.target.value)} className="w-full bg-transparent border-0 text-3xl font-black text-orange-700 outline-none p-0 focus:ring-0 placeholder:text-orange-200" placeholder="0.00" />
          </div>
        </div>
        <button onClick={() => submitQC(sample.id, fPct, mPct, dPct)} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white py-5 rounded-2xl font-black text-lg shadow-lg uppercase transition-all flex justify-center items-center gap-2 group"><Save className="w-5 h-5 group-hover:scale-110 transition-transform"/> SAVE ANALYSIS</button>
        <button onClick={close} className="w-full text-slate-400 font-black mt-4 text-xs uppercase hover:text-slate-800 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function FinalWeightModal({ sample, close, submitFinal }) {
  const [tare, setTare] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  return (
    <div className="modal bg-white/10 backdrop-blur-md z-50">
      <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-sm relative overflow-hidden border border-white modal-enter">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="flex items-center gap-4 mb-6 mt-2">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner"><Database className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <h3 className="font-serif font-black text-2xl text-slate-800 uppercase tracking-tight">Final Tare</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase">SAMPLE #{sample?.sampleSerialNo} // VEH: {sample?.vehicleNo}</p>
          </div>
        </div>
        <div className="bg-indigo-50/50 border border-indigo-100/50 p-5 rounded-2xl mb-6 shadow-sm">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gross Loaded Weight</p>
          <div className="text-3xl font-black text-indigo-950 flex items-baseline gap-1">
            {sample?.grossLoadedWeight} <span className="text-sm font-bold text-indigo-400 uppercase">Kgs</span>
          </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8 shadow-inner">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Empty Vehicle Weight</label>
          <div className="flex items-baseline gap-2">
            <input ref={inputRef} type="number" value={tare} onChange={e => setTare(e.target.value)} className="w-full bg-transparent border-0 text-4xl font-black text-slate-800 outline-none p-0 focus:ring-0 placeholder:text-slate-300" placeholder="0.00" />
            <span className="text-slate-400 font-bold uppercase text-sm">Kgs</span>
          </div>
        </div>
        <button onClick={() => submitFinal(tare)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg uppercase transition-all flex justify-center items-center gap-2 group"><Database className="w-5 h-5 group-hover:scale-110 transition-transform"/> COMPLETE ENTRY</button>
        <button onClick={close} className="w-full text-slate-400 font-black mt-4 text-xs uppercase hover:text-slate-800 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function ScannerModal({ close, onScan }) {
  const scannerRef = useRef(null);
  const [manualSerial, setManualSerial] = useState('');

  useEffect(() => {
    // Only mount scanner if library is ready
    if (window.Html5Qrcode) {
      const scanner = new window.Html5Qrcode("reader");
      scannerRef.current = scanner;
      
      scanner.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: 250 },
        (decodedText) => {
          const serial = decodedText.trim().toUpperCase();
          onScan(serial);
        }
      ).catch(e => {
        console.error("Scanner start error:", e);
      });
    }

    return () => {
      const scanner = scannerRef.current;
      if (scanner && scanner.isScanning) {
        scanner.stop().then(() => {
          scanner.clear();
        }).catch(e => console.error("Scanner stop error:", e));
      }
    };
  }, [onScan]);

  const handleManualClose = () => {
    const scanner = scannerRef.current;
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => {
        scanner.clear();
        close();
      }).catch(() => close());
    } else {
      close();
    }
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (!manualSerial.trim()) return;
    onScan(manualSerial.trim().toUpperCase());
  };

  return (
    <div className="modal z-[100]">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] w-full max-w-[calc(100%-2rem)] sm:max-w-lg overflow-y-auto max-h-[95vh] border border-white relative modal-enter custom-scrollbar">
        <div className="p-6 bg-slate-50/80 backdrop-blur-sm text-slate-800 border-b border-slate-100 flex justify-between items-center z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-black uppercase text-[10px] tracking-[0.25em]">Live Scanner Ready</span>
          </div>
          <button onClick={handleManualClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div id="reader" className="min-h-[300px] w-full bg-slate-900 relative flex items-center justify-center">
          <span className="text-slate-500 text-xs font-bold absolute animate-pulse">Initializing Vision System...</span>
        </div>

        <div className="p-8 bg-white border-t border-slate-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[1px] flex-grow bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Or Entry Manually</span>
            <div className="h-[1px] flex-grow bg-slate-100"></div>
          </div>
          
          <form onSubmit={handleManualSubmit} className="flex gap-3">
            <div className="relative flex-grow">
              <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input 
                type="text" 
                placeholder="ENTER SERIAL TAG" 
                value={manualSerial}
                onChange={e => setManualSerial(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-mono font-black text-emerald-600 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all shadow-inner tracking-[0.2em]"
              />
            </div>
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">Use manual entry if camera focus is slow or hardware is unavailable</p>
        </div>
      </div>
    </div>
  );
}


function GlobalFooter() {
  const [showContact, setShowContact] = useState(false);

  return (
    <footer className="mt-16 pb-8 flex flex-col items-center gap-4 animate-fadeUp delay-700">
      <div className="flex items-center gap-3">
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-500/20"></div>
        <div 
          onClick={() => setShowContact(!showContact)}
          className="flex items-center gap-2 px-5 py-2 bg-white/40 border border-white rounded-full select-none cursor-pointer hover:bg-white transition-all active:scale-95 group shadow-sm"
        >
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)] ${showContact ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">
            {showContact ? `Support: +91 ${atob(_creator_contact)}` : `Designed by ${atob(_creator_id)}`}
          </span>
        </div>
        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-500/20"></div>
      </div>
      <div className="text-[8px] text-slate-800 uppercase tracking-[0.5em] font-black opacity-[0.05] hover:opacity-100 transition-all duration-1000 select-none cursor-default">
        &copy; {new Date().getFullYear()} {atob(_auth_sig)} • BUILD v4.1.0
      </div>
    </footer>
  );
}
