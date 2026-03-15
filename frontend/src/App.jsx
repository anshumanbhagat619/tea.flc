import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Leaf, User, KeyRound, Lock, UserPlus, Database, Search, ArrowRight, Save, Download, FileSpreadsheet, Trash2, Printer, X, ShieldAlert, Zap, Cpu, Pencil } from 'lucide-react';
import './index.css';

// System Identity Signature (DO NOT MODIFY)
const _auth_sig = "U2hhaCBOYXdheiBIdXNzYWluIHwgKzkxIDkxMDExNDQ2MzM="; 
const _creator_id = "U2hhaCBOYXdheiBIdXNzYWlu"; 
const _creator_contact = "OTEwMTE0NDYzMw==";

const INITIAL_DB = { users: [], pendingUsers: [], parties: [], samples: [], counters: { samples: 0 } };

function SlideshowBackground() {
  const images = [
    '/backgrounds/bg1.png', '/backgrounds/bg2.png', '/backgrounds/bg3.png', 
    '/backgrounds/bg4.png', '/backgrounds/bg5.png', '/backgrounds/bg6.png', 
    '/backgrounds/bg7.png', '/backgrounds/bg8.png', '/backgrounds/bg9.png', 
    '/backgrounds/bg10.png'
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-slate-50">
      {images.map((img, i) => (
        <div
          key={img}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[3000ms] ease-in-out ${
            i === index ? 'opacity-90' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${img})` }}
        ></div>
      ))}
      <div className="absolute inset-0 bg-white/40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-white/40 to-teal-50/20"></div>
    </div>
  );
}

function validatePassword(pass) {
  if (pass.length < 4) return "PASSWORD TOO SHORT (MIN 4 CHARS)";
  if (!/[A-Z]/.test(pass)) return "PASSWORD MUST HAVE AT LEAST ONE UPPER CASE LETTER";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "PASSWORD MUST HAVE AT LEAST ONE SPECIAL CHARACTER";
  return null;
}

function PasswordHints({ password }) {
  const requirements = [
    { label: "4+ Characters", met: password.length >= 4 },
    { label: "Uppercase Letter", met: /[A-Z]/.test(password) },
    { label: "Special Character (!@#$)", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
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
    <div className="modal z-[500] p-4 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] w-full max-w-2xl relative border border-white modal-enter overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner"><Pencil className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <h3 className="font-serif font-black text-2xl text-slate-800 uppercase tracking-tight">System Record Edit</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Serial Tag: <span className="text-emerald-600">#{sample.sampleSerialNo}</span></p>
            </div>
          </div>
          <button onClick={close} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-300" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Garden / Party Name</label>
            <input type="text" value={party} onChange={e => setParty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Vehicle No</label>
            <input type="text" value={veh} onChange={e => setVeh(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Gross Weight</label>
            <div className="relative">
              <input type="number" value={gross} onChange={e => setGross(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Empty Weight</label>
            <div className="relative">
              <input type="number" value={tare} onChange={e => setTare(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">FLC %</label>
            <input type="number" value={flc} onChange={e => setFlc(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Moisture %</label>
            <input type="number" value={mois} onChange={e => setMois(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Damaged %</label>
            <input type="number" value={dmg} onChange={e => setDmg(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none" />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => updateSample(sample.id, { 
            partyName: party, vehicleNo: veh, 
            grossLoadedWeight: gross, emptyVehicleWeight: tare,
            flcPercent: flc, moistureDeduction: mois, damagedLeaf: dmg
          })} className="flex-grow bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-4 rounded-[1.25rem] font-black text-xs tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 uppercase group">
            <Save className="w-4 h-4 group-hover:rotate-12 transition-transform"/> Commit Update
          </button>
          <button onClick={close} className="bg-slate-100 text-slate-500 hover:text-slate-800 py-4 px-8 rounded-[1.25rem] font-black text-xs uppercase transition tracking-widest hover:bg-slate-200">Discard</button>
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
        const response = await fetch(`http://${window.location.hostname}:4000/api/data`);
        if (response.ok) {
          const parsedDb = await response.json();
          setDb(parsedDb);
          const savedUserId = sessionStorage.getItem('teaAppUserId');
          if (savedUserId && parsedDb.users.length > 0) {
            const user = parsedDb.users.find(u => u.id === savedUserId);
            if (user) {
              setCurrentUser(user);
              setView('main');
            } else {
              setView('login');
            }
          } else if (parsedDb.users && parsedDb.users.length === 0) {
            // No users in remote DB = setup screen
            setView('setup');
          } else {
            setView('login');
          }
        }
      } catch (err) {
        console.error("No connection to factory server. Checking local backup...");
        // Fallback to local storage (safety only, usually we want it to block if server down to prevent desync)
        const stored = localStorage.getItem('teaAppDb');
        if (stored) {
          setDb(JSON.parse(stored));
          setView('login');
        } else {
          setView('setup');
        }
      }
    };

    fetchData();

    // REAL-TIME WEBSOCKET SYNC
    const socket = io(`http://${window.location.hostname}:4000`);

    socket.on('database_updated', (newData) => {
      if (newData) {
        setDb(newData);
      }
    });

    return () => socket.disconnect();

  }, [view]);

  // Sync DB to the remote ON-PREM server
  const saveDB = (newDb) => {
    // Save to server first
    fetch(`http://${window.location.hostname}:4000/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDb)
    }).catch(err => console.error("Could not write to on-prem server:", err));

    // Local memory update
    localStorage.setItem('teaAppDb', JSON.stringify(newDb)); // Local backup
    setDb(newDb);
  };

  const toast = (msg, type = 'success') => {
    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white py-3 px-6 rounded-xl shadow-2xl z-[100] font-bold`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('teaAppUserId');
    setCurrentUser(null);
    setView('login');
  };

  if (view === 'loading') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen text-slate-800 w-full flex flex-col relative bg-[#f8fafc]">
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

  const handleSetup = () => {
    if (!name || !id || !password) return toast("Complete all fields", "error");
    const passError = validatePassword(password);
    if (passError) return toast(passError, "error");
    const upperId = id.trim().toUpperCase();
    const newDb = { users: [{ id: upperId, name: name.trim(), role: 'master', password: password.trim() }], parties: [], samples: [], counters: { samples: 0 } };
    saveDB(newDb);
    toast("Admin Created! Please login.");
    setView('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-white/60 backdrop-blur-3xl border border-white rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,0.1)] w-full max-w-md p-8 sm:p-12 relative z-10 animate-bloom overflow-hidden card-3d">
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

  const handleLogin = () => {
    const upperId = id.trim().toUpperCase();
    // Check if they're in pendingUsers (awaiting approval)
    const pending = (db.pendingUsers || []).find(u => u.id === upperId);
    if (pending) {
      setError('YOUR ACCOUNT IS PENDING ADMIN APPROVAL');
      return;
    }
    const user = db.users.find(u => u.id === upperId && u.password === password.trim());
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('teaAppUserId', upperId);
      setView('main');
    } else {
      setError('INVALID USER ID OR PASSWORD');
    }
  };

  const handleRegister = () => {
    setError('');
    if (!rName.trim() || !rId.trim() || !rPass || !rPass2) return setError('PLEASE FILL ALL FIELDS');
    if (rPass !== rPass2) return setError('PASSWORDS DO NOT MATCH');
    const passError = validatePassword(rPass);
    if (passError) return setError(passError);
    const upperId = rId.trim().toUpperCase();
    const exists = db.users.some(u => u.id === upperId) || (db.pendingUsers || []).some(u => u.id === upperId);
    if (exists) return setError('USER ID ALREADY EXISTS OR PENDING');
    const newPending = { id: upperId, name: rName.trim(), role: 'clerk', password: rPass, requestedAt: new Date().toISOString() };
    const newDb = { ...db, pendingUsers: [...(db.pendingUsers || []), newPending] };
    saveDB(newDb);
    setRegSuccess(true);
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
        <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-white rounded-full shadow-[0_15px_50px_rgba(16,185,129,0.1)] mb-5 ring-1 ring-emerald-500/20 animate-float">
          <Leaf className="w-10 h-10 text-emerald-600 opacity-90" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-800 tracking-wide drop-shadow-xl">TEA LEAF FLC</h1>
        <div className="flex items-center justify-center gap-4 mt-4 opacity-60">
          <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-emerald-500"></div>
          <p className="text-emerald-700 font-black uppercase tracking-[0.3em] text-[10px]">Quality Control System</p>
          <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-emerald-500"></div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] w-full max-w-md relative z-10 overflow-hidden animate-scaleIn border-beam-wrapper card-3d">
        <div className="absolute top-0 left-0 w-full h-[1px] shimmer-bar"></div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setTab('login'); setError(''); setRegSuccess(false); }}
            className={`flex-1 py-4 text-xs tracking-[0.2em] uppercase font-bold transition-all ${
              tab === 'login'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-4 text-xs tracking-[0.2em] uppercase font-bold transition-all ${
              tab === 'register'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Request Access
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {tab === 'login' ? (
            <div className="space-y-6">
              <div className="relative group/input animate-slideInLeft">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600/50 group-focus-within/input:text-emerald-500 transition-colors" />
                <input type="text" placeholder="USER ID" value={id} onChange={e => { setId(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all font-mono tracking-widest text-sm" />
              </div>
              <div className="relative group/input animate-slideInLeft delay-100">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600/50 group-focus-within/input:text-emerald-500 transition-colors" />
                <input type="password" placeholder="PASSWORD" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all tracking-widest text-sm" />
              </div>
              <div className="pt-2 animate-fadeUp delay-200">
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-4 rounded-xl font-bold tracking-[0.2em] text-xs shadow-lg transition-all flex items-center justify-center gap-3 group uppercase">
                  Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300 opacity-70" />
                </button>
              </div>
              {error && <p className="text-red-500 text-center font-bold py-2 border-b border-red-100 text-xs tracking-wider uppercase animate-fadeUp">{error}</p>}
              <p className="text-center text-slate-400 text-[10px] uppercase tracking-widest pt-2">Don't have access? <button onClick={() => setTab('register')} className="text-emerald-600 font-bold hover:text-emerald-500 font-bold transition-colors">Request Here</button></p>
            </div>
          ) : regSuccess ? (
            // Success state
            <div className="text-center py-6 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <UserPlus className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-800 mb-2">Request Submitted!</h3>
              <p className="text-slate-500 text-xs leading-relaxed tracking-wide mb-6">Your access request has been sent to the administrator for approval. You'll be able to sign in once approved.</p>
              <button onClick={() => { setTab('login'); setRegSuccess(false); setRName(''); setRId(''); setRPass(''); setRPass2(''); }} className="text-emerald-600 text-xs uppercase tracking-widest font-bold hover:text-emerald-500 transition-colors">← Back to Sign In</button>
            </div>
          ) : (
            // Registration form
            <div className="space-y-5 animate-fadeUp">
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.25em] mb-4">Fill in details for Admin approval.</p>
              <div className="relative group/input">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/40 group-focus-within/input:text-emerald-500 transition-colors" />
                <input type="text" placeholder="FULL NAME" value={rName} onChange={e => { setRName(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all text-sm tracking-wide" />
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/40 group-focus-within/input:text-emerald-500 transition-colors" />
                <input type="text" placeholder="CHOOSE USER ID" value={rId} onChange={e => { setRId(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all font-mono tracking-widest text-sm" />
              </div>
              <div className="relative group/input">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/40 group-focus-within/input:text-emerald-500 transition-colors" />
                <input type="password" placeholder="PASSWORD" value={rPass} onChange={e => { setRPass(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all tracking-widest text-sm" />
                <PasswordHints password={rPass} />
              </div>
              <div className="relative group/input">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/40 group-focus-within/input:text-emerald-500 transition-colors" />
                <input type="password" placeholder="CONFIRM PASSWORD" value={rPass2} onChange={e => { setRPass2(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all tracking-widest text-sm" />
              </div>
              {error && <p className="text-red-500 text-xs tracking-wider uppercase font-bold border-b border-red-100 py-1">{error}</p>}
              <button onClick={handleRegister} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-4 rounded-xl font-bold tracking-[0.2em] text-xs shadow-lg transition-all flex items-center justify-center gap-3 group uppercase mt-2">
                Submit Access Request <UserPlus className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
              </button>
              <p className="text-center text-slate-400 text-[10px] uppercase tracking-widest"><button onClick={() => { setTab('login'); setError(''); }} className="text-emerald-600 font-bold hover:text-emerald-500 transition-colors">← Back to Sign In</button></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function MainView({ db, saveDB, currentUser, handleLogout, toast }) {
  const [activeModal, setActiveModal] = useState(null); // { type, sampleId, serial }
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterGarden, setFilterGarden] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerRole, setScannerRole] = useState(null);

  // Helper arrays
  const pendingFinal = db.samples.filter(s => s.status === 'awaiting_final_weight');
  const pendingQC = db.samples.filter(s => s.status === 'pending_qc');

  let sortedFilteredSamples = db.samples.filter(s => s.status === 'complete');
  if (filterDate) {
    sortedFilteredSamples = sortedFilteredSamples.filter(s => s.createdAt?.startsWith(filterDate));
  }
  if (filterGarden) {
    sortedFilteredSamples = sortedFilteredSamples.filter(s => s.partyName === filterGarden);
  }
  sortedFilteredSamples.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = useMemo(() => {
    if (!sortedFilteredSamples.length) return null;
    const totalNet = sortedFilteredSamples.reduce((acc, s) => acc + (s.netWeight || 0), 0);
    const totalFinal = sortedFilteredSamples.reduce((acc, s) => acc + (s.finalCalculatedWeight || 0), 0);
    const avgFLC = sortedFilteredSamples.reduce((acc, s) => acc + (s.flcPercent || 0), 0) / sortedFilteredSamples.length;
    return { totalNet, totalFinal, avgFLC };
  }, [sortedFilteredSamples]);

  // Modals Data
  const closeModals = () => { setActiveModal(null); };

  const submitSample = (veh, garden, gross) => {
    if (!veh || !garden || isNaN(gross)) return toast("Fill Garden, Vehicle and Weight", "error");
    const serial = generateRandomSerial();
    const sample = {
      id: generateId(),
      sampleSerialNo: serial,
      vehicleNo: veh.trim(),
      partyName: garden,
      grossLoadedWeight: gross,
      status: 'pending_qc',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    const newDb = { ...db, samples: [...db.samples, sample] };
    saveDB(newDb);
    setActiveModal({ type: 'qr', serial });
  };

  const submitQC = (sampleId, fPct, mPct, dPct) => {
    const f = parseFloat(fPct) || 0;
    const m = parseFloat(mPct) || 0;
    const d = parseFloat(dPct) || 0;

    const newSamples = [...db.samples];
    const idx = newSamples.findIndex(s => s.id === sampleId);
    if (idx > -1) {
      newSamples[idx] = { ...newSamples[idx], flcPercent: f, moistureDeduction: m, damagedLeaf: d, status: 'awaiting_final_weight', qcAnalyst: currentUser.id };
      saveDB({ ...db, samples: newSamples });
      toast("Analysis Saved - Pending Tare Weight");
      closeModals();
    }
  };

  const submitFinalWeight = (sampleId, tare) => {
    const tareVal = parseFloat(tare);
    if (isNaN(tareVal)) return toast("Enter valid weight", "error");

    const newSamples = [...db.samples];
    const idx = newSamples.findIndex(s => s.id === sampleId);
    if (idx > -1) {
      const s = newSamples[idx];
      const netLeaf = s.grossLoadedWeight - tareVal;
      const finalWt = netLeaf * (1 - ((s.moistureDeduction + s.damagedLeaf) / 100));

      newSamples[idx] = { ...s, emptyVehicleWeight: tareVal, netWeight: netLeaf, finalCalculatedWeight: parseFloat(finalWt.toFixed(2)), status: 'complete' };
      saveDB({ ...db, samples: newSamples });
      toast("Report Completed Successfully");
      closeModals();
    }
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
      <div className={`min-h-screen flex flex-col relative ${(activeModal || isScannerOpen) ? '' : 'perspective-deep'}`}>
        <SlideshowBackground />
        
        <nav className="p-4 md:p-6 mb-8 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-2.5 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-500 shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-black text-xl md:text-2xl text-slate-800 tracking-tighter leading-none">FLC System</h1>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-1 ml-0.5 opacity-80 overflow-hidden relative">
                Premium Tea Control
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-500/30 transform -translate-x-full animate-[shimmer_3s_infinite]"></span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Accessing as</span>
              <span className="text-xs font-bold text-slate-800 tracking-tight">{currentUser.name}</span>
            </div>
            <button onClick={handleLogout} className="bg-white/80 hover:bg-white text-slate-800 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-95 flex items-center gap-2 group">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-12 transition-transform"/> EXIT
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 pb-12 z-10">
          {currentUser.role === 'clerk' && (
            <ClerkSection
              db={db} submitSample={submitSample}
              pendingFinal={pendingFinal}
              openFinalWeightModal={(id) => setActiveModal({ type: 'finalWeight', sampleId: id })}
              openScanner={() => { setScannerRole('clerk'); setIsScannerOpen(true); }}
            />
          )}

          {currentUser.role === 'analyst' && (
            <AnalystSection
              pendingQC={pendingQC}
              openFlcModal={(id) => setActiveModal({ type: 'qcAnalysis', sampleId: id })}
              openScanner={() => { setScannerRole('analyst'); setIsScannerOpen(true); }}
            />
          )}

          <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white p-6 md:p-8 overflow-hidden relative z-10 card-hover border-beam-wrapper animate-fadeUp card-3d">
            <div className="absolute top-0 left-0 w-full h-[2px] shimmer-bar"></div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-inner"><FileSpreadsheet className="w-6 h-6 text-emerald-600" /></div>
                <h2 className="text-xl font-serif font-black text-slate-800 uppercase tracking-widest">Daily Quality Summary</h2>
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
                <div className="relative flex-grow md:flex-grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 pl-10 pr-4 py-3 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
                <button onClick={downloadCSV} className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-6 py-3 rounded-xl text-xs tracking-widest font-black shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0 uppercase"><Download className="w-4 h-4 opacity-70" /> CSV</button>
              </div>
            </div>

            {stats && filterGarden && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group hover:bg-emerald-500/10 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform"><Leaf className="w-16 h-16 text-emerald-600" /></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-60">Total Net leaf</span>
                  <div className="text-2xl font-serif font-black text-slate-800">{stats.totalNet.toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span></div>
                </div>
                <div className="bg-teal-500/5 border border-teal-500/10 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group hover:bg-teal-500/10 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform"><Database className="w-16 h-16 text-teal-600" /></div>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest opacity-60">Final Weight</span>
                  <div className="text-2xl font-serif font-black text-slate-800">{stats.totalFinal.toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span></div>
                </div>
                <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group hover:bg-orange-500/10 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform"><Search className="w-16 h-16 text-orange-600" /></div>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest opacity-60">Avg FLC %</span>
                  <div className="text-2xl font-serif font-black text-slate-800">{stats.avgFLC.toFixed(2)}%</div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm bg-white/40">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr><th className="p-5 border-b border-slate-100">Serial</th><th className="p-5 border-b border-slate-100">Garden/Transport</th><th className="p-5 border-b border-slate-100">Weight Breakup</th><th className="p-5 border-b border-slate-100">QC Data</th><th className="p-5 border-b border-slate-100 text-emerald-600 font-black">Final Weight</th>{currentUser.role === 'master' && <th className="p-5 border-b border-slate-100 text-center">Action</th>}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedFilteredSamples.map((s, i) => (
                    <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors row-anim" style={{ animationDelay: `${i * 60}ms` }}>
                      <td className="p-4 font-black text-slate-400">#{s.sampleSerialNo}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 tracking-wide">{s.partyName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">{s.vehicleNo}</div>
                      </td>
                      <td className="p-4 leading-tight">
                        <div className="text-xs text-slate-400">Gross: {s.grossLoadedWeight} Kgs</div>
                        <div className="text-xs text-slate-500 italic mt-0.5">Empty: {s.emptyVehicleWeight || 0} Kgs</div>
                        <div className="font-bold text-emerald-400/80 mt-1">Net: {s.netWeight || 0} Kgs</div>
                      </td>
                      <td className="p-4 leading-tight space-y-1">
                        <div className="text-[10px] font-bold text-slate-300"><span className="text-slate-500">FLC:</span> {s.flcPercent}%</div>
                        <div className="text-[10px] text-slate-400"><span className="text-slate-500">M:</span> {s.moistureDeduction}%</div>
                        <div className="text-[10px] text-slate-400"><span className="text-slate-500">D:</span> {s.damagedLeaf}%</div>
                        <div className="text-[10px] text-amber-500/80 font-black mt-1">Total: {((s.moistureDeduction || 0) + (s.damagedLeaf || 0)).toFixed(2)}%</div>
                      </td>
                      <td className="p-4">
                        <div className="text-lg font-black text-emerald-400 drop-shadow-sm">{s.finalCalculatedWeight || 0} <span className="text-[10px] font-medium text-emerald-500/50">Kgs</span></div>
                      </td>
                      {currentUser.role === 'master' && (
                        <td className="p-5">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => setActiveModal({ type: 'edit', sampleId: s.id })} className="p-2 text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"><Pencil className="w-5 h-5"/></button>
                            <button onClick={() => {
                              if (window.confirm("Erase record?")) {
                                saveDB({ ...db, samples: db.samples.filter(x => x.id !== s.id) });
                              }
                            }} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {currentUser.role === 'master' && <AdminSection db={db} saveDB={saveDB} toast={toast} importDatabase={importDatabase} currentUser={currentUser} exportDatabase={exportDatabase} setFilterGarden={setFilterGarden} />}
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
            updateSample={(id, fields) => {
              const newSamples = [...db.samples];
              const idx = newSamples.findIndex(x => x.id === id);
              if (idx > -1) {
                const updated = { ...newSamples[idx], ...fields };
                const net = updated.grossLoadedWeight - (updated.emptyVehicleWeight || 0);
                const totalDed = (updated.moistureDeduction || 0) + (updated.damagedLeaf || 0);
                const final = net * (1 - (totalDed / 100));
                newSamples[idx] = { ...updated, netWeight: net, finalCalculatedWeight: parseFloat(final.toFixed(2)) };
                saveDB({ ...db, samples: newSamples });
                toast("Record updated");
                closeModals();
              }
            }} 
          />
        }
        {isScannerOpen &&
          <ScannerModal
            close={useCallback(() => setIsScannerOpen(false), [])}
            onScan={useCallback((serial) => {
              const sample = db.samples.find(s => String(s.sampleSerialNo) === String(serial));
              if (sample) {
                if (scannerRole === 'analyst' && sample.status === 'pending_qc') {
                  setIsScannerOpen(false);
                  setActiveModal({ type: 'qcAnalysis', sampleId: sample.id });
                }
                else if (scannerRole === 'clerk' && sample.status === 'awaiting_final_weight') {
                  setIsScannerOpen(false);
                  setActiveModal({ type: 'finalWeight', sampleId: sample.id });
                }
                else toast("Sample state not correct for this scan", "error");
              } else { toast("Tag not recognized", "error"); }
            }, [db.samples, scannerRole, toast])}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 transform-style-preserve-3d">
      <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white p-6 md:p-8 relative overflow-hidden z-20 card-3d animate-slideInLeft border-beam-wrapper">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-inner"><Database className="w-5 h-5 text-emerald-600" /></div>
          <h2 className="text-xl font-serif font-black text-slate-800 uppercase tracking-widest">1. Initial Entry (Gross)</h2>
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

      <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white p-6 md:p-8 relative overflow-hidden flex flex-col z-10 card-hover animate-slideInRight card-3d">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-teal-500 to-sky-700"></div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 shadow-inner"><Save className="w-5 h-5 text-teal-600" /></div>
            <h2 className="text-xl font-serif font-black text-slate-800 uppercase tracking-widest">2. Final Tare Weight</h2>
          </div>
          <button onClick={openScanner} className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2.5 rounded-lg border border-teal-200 font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all">
            <Search className="w-4 h-4 opacity-70" /> SCAN TAG
          </button>
        </div>
        <div className="flex-grow">
          <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div> waiting for tare weight: <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{pendingFinal.length}</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pendingFinal.map(s => (
              <button key={s.id} onClick={() => openFinalWeightModal(s.id)} className="p-4 bg-white/40 hover:bg-white border border-slate-100 hover:border-teal-400 rounded-xl font-mono font-black text-slate-600 text-sm transition-all hover:scale-[1.03] shadow-sm group">
                <span className="text-teal-400 group-hover:text-teal-600 transition-colors">#</span> {s.sampleSerialNo}
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
    <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white p-6 md:p-8 mb-12 relative overflow-hidden z-10 card-hover animate-fadeUp border-beam-wrapper card-3d">
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-amber-700"></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-inner"><Leaf className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h2 className="text-xl font-serif font-black text-slate-800 uppercase tracking-widest">Quality Lab Entry</h2>
            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase mt-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pending Analysis: <span className="text-amber-700">{pendingQC.length}</span></p>
          </div>
        </div>
        <button onClick={openScanner} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-4 rounded-xl font-bold tracking-[0.2em] shadow-lg flex items-center gap-3 uppercase transition-all group w-full md:w-auto justify-center text-sm">
          <Search className="w-4 h-4 group-hover:scale-110 transition-transform opacity-80" /> SCAN SAMPLE QR
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {pendingQC.length === 0 ? (
          <p className="col-span-full text-center py-16 text-slate-400 font-bold tracking-widest uppercase bg-slate-50 border border-slate-100 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-xs"><Leaf className="w-8 h-8 opacity-20" /> No Samples Pending</p>
        ) : pendingQC.map(s => (
          <button key={s.id} onClick={() => openFlcModal(s.id)} className="p-5 bg-white/40 hover:bg-white border border-slate-100 hover:border-amber-400 rounded-xl text-center font-mono font-bold text-slate-800 hover:scale-[1.03] transition-all shadow-sm group">
            <span className="text-[9px] block font-sans tracking-[0.3em] text-amber-500 mb-2 uppercase">Serial</span>
            <span className="text-xl text-slate-800 group-hover:text-amber-600 transition-colors">#{s.sampleSerialNo}</span>
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

  const addUser = () => {
    const id = nuId.trim().toUpperCase();
    if (!nuName || !id || !nuPass) return toast("Enter name, ID and password", "error");
    if (db.users.some(u => u.id === id)) return toast("User ID exists", "error");
    const passError = validatePassword(nuPass);
    if (passError) return toast(passError, "error");
    const newDb = { ...db, users: [...db.users, { id, name: nuName.trim(), role: nuRole, password: nuPass }] };
    saveDB(newDb);
    toast("Staff Member Added");
    setNuName(''); setNuId(''); setNuPass(''); setNuRole('clerk');
  };

  const deleteUser = (id) => {
    if (id === currentUser.id) return;
    saveDB({ ...db, users: db.users.filter(u => u.id !== id) });
  };

  const updateUserRole = (userId, newRole) => {
    const updatedUsers = db.users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    saveDB({ ...db, users: updatedUsers });
    toast(`Role updated for ${userId}`);
  };

  const addParty = () => {
    const n = npName.trim();
    if (!n) return;
    saveDB({ ...db, parties: [...db.parties, { id: generateId(), name: n }] });
    setNpName('');
  };

  const deleteParty = (id) => {
    saveDB({ ...db, parties: db.parties.filter(p => p.id !== id) });
  };

  const resetSystem = () => {
    const backupFirst = window.confirm("Before wiping the system, would you like to download a BACKUP of the current data? (Highly Recommended)");
    if (backupFirst) {
      exportDatabase();
      toast("Backup Downloaded. You may now proceed with the reset.");
      return; // Stop here so they can see the download
    }

    const confirm1 = window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE all users, gardens, and processing samples. This action CANNOT be undone. Are you absolutely sure?");
    if (confirm1) {
      const confirm2 = window.confirm("FINAL CONFIRMATION: You are about to wipe the entire system database. Type 'OK' in the next prompt if you want to proceed.");
      if (confirm2) {
        saveDB(INITIAL_DB);
        toast("System Reset Successful. Redirecting to setup...");
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  const pendingUsers = db.pendingUsers || [];

  const approveUser = (pending) => {
    const chosenRole = approvalRoles[pending.id] || 'clerk';
    const newDb = {
      ...db,
      users: [...db.users, { id: pending.id, name: pending.name, role: chosenRole, password: pending.password }],
      pendingUsers: db.pendingUsers.filter(u => u.id !== pending.id)
    };
    saveDB(newDb);
    toast(`${pending.name} approved as ${chosenRole}!`);
  };

  const rejectUser = (id) => {
    saveDB({ ...db, pendingUsers: db.pendingUsers.filter(u => u.id !== id) });
    toast('Access request rejected', 'error');
  };

  return (
    <div className="space-y-8 mb-12 relative z-10">

      {/* ── Pending Approvals ── */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative card-hover animate-fadeUp z-20 card-3d">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-inner relative">
              <UserPlus className="w-5 h-5 text-amber-600" />
              {pendingUsers.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-[9px] text-white font-black flex items-center justify-center animate-pulse">{pendingUsers.length}</span>}
            </div>
            <div>
              <h3 className="font-serif font-black text-xl text-slate-800 uppercase tracking-widest">Pending Approvals</h3>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mt-1">{pendingUsers.length === 0 ? 'No pending requests' : `${pendingUsers.length} awaiting your review`}</p>
            </div>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs uppercase tracking-widest bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-3">
              <UserPlus className="w-8 h-8 opacity-20" />
              No access requests pending
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u, i) => (
                <div key={u.id} className="bg-white/40 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 row-anim" style={{animationDelay:`${i*70}ms`}}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm tracking-wide">{u.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 tracking-widest">({u.id})</span>
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
                      <button onClick={() => rejectUser(u.id)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2">
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
      <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative card-hover animate-slideInLeft card-3d">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-600"></div>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner"><UserPlus className="w-5 h-5 text-indigo-600" /></div>
          <h3 className="font-serif font-black text-xl text-slate-800 uppercase tracking-widest">Staff Management</h3>
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
        <div className="space-y-3 p-2 bg-slate-50 rounded-xl border border-slate-100 overflow-visible">
          {db.users.map(u => (
            <div key={u.id} className="text-sm bg-white border border-slate-100 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-all group relative">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-black text-slate-800 tracking-widest text-xs uppercase">{u.id}</span>
                  <RoleDropdown 
                    variant="compact"
                    value={u.role}
                    onChange={newRole => updateUserRole(u.id, newRole)}
                    options={ROLES}
                    icon={ShieldAlert}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">{u.name} <span className="opacity-20 mx-2">|</span> Pass: <span className="text-slate-400 blur-[2.5px] font-mono hover:blur-none transition-all ml-1">{u.password}</span></div>
              </div>
              {u.id !== currentUser.id && <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-4 self-center"><Trash2 className="w-4 h-4"/></button>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden flex flex-col card-hover animate-slideInRight">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-inner"><Leaf className="w-5 h-5 text-emerald-600" /></div>
          <h3 className="font-serif font-black text-xl text-slate-800 uppercase tracking-widest">Garden Registry</h3>
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
      <div className="bg-white/90 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] text-center relative printable-area border border-white modal-enter">
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
      <div className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden border border-white relative modal-enter">
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
