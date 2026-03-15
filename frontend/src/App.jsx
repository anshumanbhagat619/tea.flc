import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Leaf, User, KeyRound, Lock, UserPlus, Database, Search, ArrowRight, Save, Download, FileSpreadsheet, Trash2, Printer, X, ShieldAlert, Zap, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-slate-950">
      {images.map((img, i) => (
        <div
          key={img}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[3000ms] ease-in-out ${
            i === index ? 'opacity-80' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${img})` }}
        ></div>
      ))}
      <div className="absolute inset-0 bg-black/40"></div>
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
            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 ring-4 ring-indigo-500/10' 
            : 'bg-slate-950/60 border-slate-700/50 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200'
          }`}
        >
          {Icon && <Icon className={`w-3 h-3 ${isOpen ? 'text-indigo-400' : 'text-indigo-500/60'}`} />}
          <span>{currentLabel}</span>
          <ArrowRight className={`w-3 h-3 transition-transform duration-500 ${isOpen ? 'rotate-180 text-indigo-400' : 'rotate-90 opacity-40'}`} />
        </button>
        
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-48 z-[3000] bg-slate-900 border border-slate-700/80 rounded-xl shadow-[0_-20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-scaleIn origin-bottom backdrop-blur-3xl ring-1 ring-white/10">
            <div className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between group/opt ${
                    value === opt.value 
                      ? 'bg-indigo-500/25 text-indigo-200 border-l-2 border-indigo-400' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                  {value === opt.value && <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />}
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
        className={`w-full flex items-center justify-between p-4 rounded-xl outline-none transition-all duration-500 border backdrop-blur-md shadow-inner group ${
          isOpen 
          ? 'bg-indigo-500/10 border-indigo-500/50 ring-4 ring-indigo-500/5' 
          : 'bg-slate-950/40 border-slate-700/50 hover:border-indigo-500/40 hover:bg-slate-950/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-500/20' : 'bg-slate-800/50'}`}>
            {Icon && <Icon className={`w-4 h-4 ${isOpen ? 'text-indigo-400' : 'text-indigo-400/60'}`} />}
          </div>
          <span className={`text-sm tracking-[0.15em] font-bold uppercase transition-colors ${isOpen ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'}`}>
            {currentLabel}
          </span>
        </div>
        <div className={`p-1 rounded-full transition-all duration-500 ${isOpen ? 'bg-indigo-500/20 rotate-180' : 'rotate-90 opacity-20 group-hover:opacity-100 group-hover:bg-slate-800'}`}>
          <ArrowRight className={`w-4 h-4 ${isOpen ? 'text-indigo-400' : 'text-slate-400'}`} />
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-3 z-[3000] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden animate-scaleIn origin-top backdrop-blur-3xl ring-1 ring-white/10">
          <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-5 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-all rounded-lg flex items-center justify-between mb-1 last:mb-0 ${
                  value === opt.value 
                    ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30' 
                    : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)] animate-pulse" />
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

// Global variable for scanner
let html5QrCode = null;

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
    if (html5QrCode) {
      html5QrCode.stop().catch(() => { });
      html5QrCode = null;
    }
    sessionStorage.removeItem('teaAppUserId');
    setCurrentUser(null);
    setView('login');
  };

  if (view === 'loading') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen text-slate-200 w-full flex flex-col relative selection:bg-emerald-500/30 overflow-x-hidden perspective-deep">
      <SlideshowBackground />
      <div className="flex-grow z-10 w-full relative transform-style-preserve-3d">
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
      <div className="bg-slate-900/70 backdrop-blur-3xl border border-slate-700/40 rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,0.8)] w-full max-w-md p-8 sm:p-12 relative z-10 animate-bloom overflow-hidden card-3d">
        <div className="absolute top-0 left-0 w-full h-[1px] shimmer-bar opacity-50"></div>
        <div className="flex justify-center mb-10">
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 group-hover/logo:opacity-40 transition-opacity animate-pulse"></div>
            <div className="p-6 bg-gradient-to-br from-emerald-800 to-teal-950 rounded-full shadow-[0_15px_50px_rgba(2,44,34,0.8)] ring-2 ring-emerald-500/20 relative animate-float">
              <ShieldAlert className="w-12 h-12 text-emerald-100 opacity-90" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-serif font-medium text-center text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-300 tracking-wide mb-2 uppercase animate-fadeUp">System Setup</h1>
        <p className="text-xs text-slate-400 mb-10 text-center font-medium tracking-[0.2em] uppercase animate-fadeUp delay-100">Create the master administrator account.</p>
        <div className="space-y-5">
          <div className="relative group/input animate-fadeUp delay-200">
            <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/70 group-focus-within/input:text-emerald-400 transition-colors" />
            <input type="text" placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all font-mono tracking-widest text-sm" />
          </div>
          <div className="relative group/input animate-fadeUp delay-300">
            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/70 group-focus-within/input:text-emerald-400 transition-colors" />
            <input type="text" placeholder="ADMIN USER ID" value={id} onChange={e => setId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all font-mono tracking-widest text-sm" />
          </div>
          <div className="relative group/input animate-fadeUp delay-400">
            <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/70 group-focus-within/input:text-emerald-400 transition-colors" />
            <input type="password" placeholder="SET PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all font-mono tracking-widest text-sm" />
            <PasswordHints password={password} />
          </div>
          <div className="pt-4 animate-fadeUp delay-500">
            <button onClick={handleSetup} className="w-full bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 border border-emerald-700/50 text-emerald-50 py-4 rounded-lg font-medium tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(2,44,34,0.5)] hover:shadow-[0_15px_40px_rgba(2,44,34,0.7)] transition-all flex items-center justify-center gap-3 uppercase group/btn">
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
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-emerald-900/25 rounded-full blur-3xl animate-breathe"></div>
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-teal-900/20 rounded-full blur-3xl animate-breathe delay-500"></div>
      </div>

      {/* Logo */}
      <div className="mb-10 text-center select-none z-10 animate-fadeDown depth-element">
        <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-emerald-800 to-teal-950 rounded-full shadow-[0_15px_50px_rgba(2,44,34,0.8)] mb-5 ring-1 ring-emerald-500/30 animate-float">
          <Leaf className="w-10 h-10 text-emerald-50 opacity-90" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-300 tracking-wide drop-shadow-2xl">TEA LEAF FLC</h1>
        <div className="flex items-center justify-center gap-4 mt-4 opacity-60">
          <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-emerald-400"></div>
          <p className="text-emerald-100 font-medium uppercase tracking-[0.3em] text-[10px]">Quality Control System</p>
          <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-emerald-400"></div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] w-full max-w-md relative z-10 overflow-hidden animate-scaleIn border-beam-wrapper card-3d">
        <div className="absolute top-0 left-0 w-full h-[1px] shimmer-bar"></div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/80">
          <button
            onClick={() => { setTab('login'); setError(''); setRegSuccess(false); }}
            className={`flex-1 py-4 text-xs tracking-[0.2em] uppercase font-bold transition-all ${
              tab === 'login'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-4 text-xs tracking-[0.2em] uppercase font-bold transition-all ${
              tab === 'register'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Request Access
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {tab === 'login' ? (
            <div className="space-y-6">
              <div className="relative group/input animate-slideInLeft">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/70 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="text" placeholder="USER ID" value={id} onChange={e => { setId(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all font-mono tracking-widest text-sm" />
              </div>
              <div className="relative group/input animate-slideInLeft delay-100">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/70 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="password" placeholder="PASSWORD" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all tracking-widest text-sm" />
              </div>
              <div className="pt-2 animate-fadeUp delay-200">
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 border border-emerald-700/50 text-emerald-50 py-4 rounded-xl font-medium tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(2,44,34,0.5)] hover:shadow-[0_15px_40px_rgba(2,44,34,0.7)] transition-all flex items-center justify-center gap-3 group uppercase">
                  Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300 opacity-70" />
                </button>
              </div>
              {error && <p className="text-red-400 text-center font-medium py-2 border-b border-red-500/30 text-xs tracking-wider uppercase animate-fadeUp">{error}</p>}
              <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest pt-2">Don't have access? <button onClick={() => setTab('register')} className="text-emerald-500 hover:text-emerald-400 transition-colors">Request Here</button></p>
            </div>
          ) : regSuccess ? (
            // Success state
            <div className="text-center py-6 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-900/50 border border-emerald-600/50 flex items-center justify-center mx-auto mb-5">
                <UserPlus className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-100 mb-2">Request Submitted!</h3>
              <p className="text-slate-400 text-xs leading-relaxed tracking-wide mb-6">Your access request has been sent to the administrator for approval. You'll be able to sign in once approved.</p>
              <button onClick={() => { setTab('login'); setRegSuccess(false); setRName(''); setRId(''); setRPass(''); setRPass2(''); }} className="text-emerald-500 text-xs uppercase tracking-widest hover:text-emerald-400 transition-colors">← Back to Sign In</button>
            </div>
          ) : (
            // Registration form
            <div className="space-y-5 animate-fadeUp">
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.25em] mb-4">Fill in your details. Admin will review and approve your access.</p>
              <div className="relative group/input">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="text" placeholder="FULL NAME" value={rName} onChange={e => { setRName(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all text-sm tracking-wide" />
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="text" placeholder="CHOOSE USER ID" value={rId} onChange={e => { setRId(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all font-mono tracking-widest text-sm" />
              </div>
              <div className="relative group/input">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="password" placeholder="PASSWORD" value={rPass} onChange={e => { setRPass(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all tracking-widest text-sm" />
                <PasswordHints password={rPass} />
              </div>
              <div className="relative group/input">
                <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 group-focus-within/input:text-emerald-400 transition-colors" />
                <input type="password" placeholder="CONFIRM PASSWORD" value={rPass2} onChange={e => { setRPass2(e.target.value); setError(''); }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 outline-none transition-all tracking-widest text-sm" />
              </div>
              {error && <p className="text-red-400 text-xs tracking-wider uppercase font-medium border-b border-red-500/30 py-1">{error}</p>}
              <button onClick={handleRegister} className="w-full bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 border border-emerald-700/50 text-emerald-50 py-4 rounded-xl font-medium tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(2,44,34,0.5)] transition-all flex items-center justify-center gap-3 group uppercase mt-2">
                Submit Access Request <UserPlus className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
              </button>
              <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest"><button onClick={() => { setTab('login'); setError(''); }} className="text-emerald-500/70 hover:text-emerald-400 transition-colors">← Back to Sign In</button></p>
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerRole, setScannerRole] = useState(null);

  // Helper arrays
  const pendingFinal = db.samples.filter(s => s.status === 'awaiting_final_weight');
  const pendingQC = db.samples.filter(s => s.status === 'pending_qc');

  let sortedFilteredSamples = db.samples.filter(s => s.status === 'complete');
  if (filterDate) {
    sortedFilteredSamples = sortedFilteredSamples.filter(s => s.createdAt?.startsWith(filterDate));
  }
  sortedFilteredSamples.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Modals Data
  const closeModals = () => { setActiveModal(null); };

  const submitSample = (veh, garden, gross) => {
    if (!veh || !garden || isNaN(gross)) return toast("Fill Garden, Vehicle and Weight", "error");
    const serial = db.counters.samples + 1;
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
    const newDb = { ...db, samples: [...db.samples, sample], counters: { ...db.counters, samples: serial } };
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
    const a = document.createElement('a');
    a.href = url; a.download = `flc_report_${new Date().toLocaleDateString()}.csv`; a.click();
  };

  // Sub-components
  return (
    <div className="pb-20 text-slate-200 font-sans">
      <header className="bg-slate-950/70 backdrop-blur-2xl text-white p-4 lg:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.8)] mb-10 sticky top-0 z-40 no-print border-b border-white/5 animate-fadeDown">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center border border-slate-700/50 shadow-inner animate-breathe">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-medium uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 to-emerald-300 opacity-90">TEA LEAF</h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-1"><User className="w-3 h-3 text-emerald-500/70" /> {currentUser.name} <span className="text-slate-600 hidden sm:inline">|</span> <span className="text-emerald-500 font-mono hidden sm:inline">{currentUser.role}</span></p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={exportDatabase} className="text-slate-400 hover:text-emerald-300 px-3 py-2 font-medium tracking-widest text-xs transition-colors flex items-center gap-2 uppercase"><Database className="w-4 h-4 opacity-70" /> <span className="hidden sm:inline">Backup</span></button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 px-3 py-2 font-medium tracking-widest text-xs transition-colors flex items-center gap-2 uppercase"><Lock className="w-4 h-4 opacity-70" /> <span className="hidden sm:inline">Exit</span></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
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

        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 p-6 md:p-8 overflow-hidden relative z-10 card-hover border-beam-wrapper animate-fadeUp card-3d">
          <div className="absolute top-0 left-0 w-full h-[2px] shimmer-bar"></div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner"><FileSpreadsheet className="w-6 h-6 text-emerald-400" /></div>
              <h2 className="text-xl font-serif font-black text-slate-100 uppercase tracking-widest drop-shadow-md">Daily Quality Summary</h2>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm font-bold focus:border-emerald-500/80 outline-none transition-all shadow-inner [color-scheme:dark]" />
              </div>
              <button onClick={downloadCSV} className="bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 border border-emerald-600/30 text-white px-6 py-3 rounded-xl text-xs tracking-widest font-bold shadow-[0_10px_20px_rgba(2,44,34,0.6)] transition-all flex items-center justify-center gap-2 flex-shrink-0 uppercase"><Download className="w-4 h-4 opacity-70" /> CSV</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-700/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] bg-slate-950/40">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-900/80 text-emerald-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr><th className="p-5 border-b border-slate-700/50">Serial</th><th className="p-5 border-b border-slate-700/50">Garden/Transport</th><th className="p-5 border-b border-slate-700/50">Weight Breakup</th><th className="p-5 border-b border-slate-700/50">QC Data</th><th className="p-5 border-b border-slate-700/50 text-emerald-400 font-black">Final Weight</th>{currentUser.role === 'master' && <th className="p-5 border-b border-slate-700/50 text-center">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedFilteredSamples.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors row-anim" style={{ animationDelay: `${i * 60}ms` }}>
                    <td className="p-4 font-black text-emerald-500/50">#{s.sampleSerialNo}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200 tracking-wide">{s.partyName}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">{s.vehicleNo}</div>
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
                        <button onClick={() => {
                          if (window.confirm("Erase record?")) {
                            saveDB({ ...db, samples: db.samples.filter(x => x.id !== s.id) });
                          }
                        }} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mx-auto block"><Trash2 className="w-5 h-5"/></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {currentUser.role === 'master' && <AdminSection db={db} saveDB={saveDB} toast={toast} importDatabase={importDatabase} currentUser={currentUser} />}
      </main>

      {/* Modals Injection */}
      {activeModal?.type === 'qr' && <QRModal serial={activeModal.serial} close={closeModals} />}
      {activeModal?.type === 'qcAnalysis' &&
        <QCModal sample={db.samples.find(s => s.id === activeModal.sampleId)} close={closeModals} submitQC={submitQC} />
      }
      {activeModal?.type === 'finalWeight' &&
        <FinalWeightModal sample={db.samples.find(s => s.id === activeModal.sampleId)} close={closeModals} submitFinal={(tare) => submitFinalWeight(activeModal.sampleId, tare)} />
      }
      {isScannerOpen &&
        <ScannerModal
          close={() => setIsScannerOpen(false)}
          onScan={(serial) => {
            const sample = db.samples.find(s => s.sampleSerialNo === serial);
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
          }}
        />
      }
    </div>
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
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 p-6 md:p-8 relative overflow-hidden z-20 card-3d animate-slideInLeft border-beam-wrapper">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-800"></div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner"><Database className="w-5 h-5 text-emerald-400" /></div>
          <h2 className="text-xl font-serif font-black text-slate-100 uppercase tracking-widest drop-shadow-md">1. Initial Entry (Gross)</h2>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Vehicle No" maxLength="15" value={vehicle} onChange={e => setVehicle(e.target.value)} className="w-full px-4 py-4 bg-slate-950/50 border border-slate-700/50 rounded-xl font-mono text-slate-200 focus:border-emerald-500/80 outline-none transition-all shadow-inner tracking-widest" />
            <select value={garden} onChange={e => setGarden(e.target.value)} className="w-full px-4 py-4 bg-slate-950/50 border border-slate-700/50 rounded-xl font-medium text-slate-200 focus:border-emerald-500/80 outline-none transition-all shadow-inner tracking-wider">
              <option value="" className="bg-slate-900">Select Garden</option>
              {db.parties.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.name} className="bg-slate-900">{p.name}</option>
              ))}
            </select>
          </div>
          <input type="number" placeholder="Gross Loaded Weight (Kgs)" value={gross} onChange={e => setGross(e.target.value)} className="w-full px-4 py-6 bg-slate-950/50 border border-slate-700/50 rounded-xl font-black text-3xl text-emerald-400 placeholder-slate-600 focus:border-emerald-500/80 outline-none transition-all shadow-inner" />
          <button onClick={onGenerate} className="w-full bg-gradient-to-r from-emerald-700 to-teal-900 hover:from-emerald-600 hover:to-teal-800 text-emerald-50 py-5 rounded-xl font-bold tracking-[0.2em] shadow-[0_10px_30px_rgba(2,44,34,0.6)] flex items-center justify-center gap-3 transition-all group uppercase text-sm border border-emerald-600/30">
            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform opacity-80" /> GENERATE TAG
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 p-6 md:p-8 relative overflow-hidden flex flex-col z-10 card-hover animate-slideInRight card-3d">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-teal-500 to-sky-900"></div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner"><Save className="w-5 h-5 text-teal-400" /></div>
            <h2 className="text-xl font-serif font-black text-slate-100 uppercase tracking-widest drop-shadow-md">2. Final Tare Weight</h2>
          </div>
          <button onClick={openScanner} className="bg-teal-900/80 hover:bg-teal-800 text-teal-100 px-4 py-2.5 rounded-lg border border-teal-700/50 font-bold text-xs uppercase tracking-widest shadow-[0_5px_15px_rgba(17,94,89,0.5)] flex items-center gap-2 transition-all">
            <Search className="w-4 h-4 opacity-70" /> SCAN TAG
          </button>
        </div>
        <div className="flex-grow">
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest font-medium flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div> waiting for tare weight: <span className="text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800/50">{pendingFinal.length}</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pendingFinal.map(s => (
              <button key={s.id} onClick={() => openFinalWeightModal(s.id)} className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-teal-500/50 rounded-xl font-mono font-bold text-slate-300 text-sm transition-all hover:scale-[1.03] shadow-inner group">
                <span className="text-teal-500/50 group-hover:text-teal-400 transition-colors">#</span> {s.sampleSerialNo}
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
    <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 p-6 md:p-8 mb-12 relative overflow-hidden z-10 card-hover animate-fadeUp border-beam-wrapper card-3d">
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-amber-900"></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner"><Leaf className="w-5 h-5 text-amber-500" /></div>
          <div>
            <h2 className="text-xl font-serif font-black text-slate-100 uppercase tracking-widest drop-shadow-md">Quality Lab Entry</h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pending Analysis: <span className="text-amber-500">{pendingQC.length}</span></p>
          </div>
        </div>
        <button onClick={openScanner} className="bg-gradient-to-r from-amber-700 to-amber-950 hover:from-amber-600 hover:to-amber-900 border border-amber-600/30 text-amber-50 px-6 py-4 rounded-xl font-bold tracking-[0.2em] shadow-[0_10px_30px_rgba(120,53,15,0.6)] flex items-center gap-3 uppercase transition-all group w-full md:w-auto justify-center text-sm">
          <Search className="w-4 h-4 group-hover:scale-110 transition-transform opacity-80" /> SCAN SAMPLE QR
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {pendingQC.length === 0 ? (
          <p className="col-span-full text-center py-16 text-slate-500 font-medium tracking-widest uppercase bg-slate-950/30 border border-slate-800/50 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-xs"><Leaf className="w-8 h-8 opacity-20" /> No Samples Pending</p>
        ) : pendingQC.map(s => (
          <button key={s.id} onClick={() => openFlcModal(s.id)} className="p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/50 rounded-xl text-center font-mono font-bold text-slate-200 hover:scale-[1.03] transition-all shadow-inner group">
            <span className="text-[9px] block font-sans tracking-[0.3em] text-amber-500/70 mb-2 uppercase">Serial</span>
            <span className="text-xl text-slate-100 group-hover:text-amber-400 transition-colors">#{s.sampleSerialNo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminSection({ db, saveDB, toast, importDatabase, currentUser }) {
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
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 relative card-hover animate-fadeUp z-20 card-3d">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner relative">
              <UserPlus className="w-5 h-5 text-amber-400" />
              {pendingUsers.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-[9px] text-slate-950 font-black flex items-center justify-center animate-pulse">{pendingUsers.length}</span>}
            </div>
            <div>
              <h3 className="font-serif font-black text-xl text-slate-100 uppercase tracking-widest">Pending Approvals</h3>
              <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase mt-1">{pendingUsers.length === 0 ? 'No pending requests' : `${pendingUsers.length} awaiting your review`}</p>
            </div>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-xs uppercase tracking-widest bg-slate-950/30 rounded-xl border border-dashed border-slate-800/50 flex flex-col items-center gap-3">
              <UserPlus className="w-8 h-8 opacity-20" />
              No access requests pending
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u, i) => (
                <div key={u.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 row-anim" style={{animationDelay:`${i*70}ms`}}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-200 text-sm tracking-wide">{u.name}</span>
                        <span className="font-mono text-[10px] text-slate-500 tracking-widest">({u.id})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 tracking-widest uppercase">Requested {new Date(u.requestedAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
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
                      <button onClick={() => approveUser(u)} className="px-4 py-2.5 bg-emerald-800/60 hover:bg-emerald-700/70 border border-emerald-600/50 text-emerald-200 rounded-xl text-xs uppercase tracking-widest font-bold transition-all hover:shadow-[0_5px_20px_rgba(2,44,34,0.5)] flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => rejectUser(u.id)} className="px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/40 text-red-400 rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2">
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
      <div className="bg-slate-900/60 backdrop-blur-2xl p-6 md:p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 relative card-hover animate-slideInLeft card-3d">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none border-beam-wrapper">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-600"></div>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner"><UserPlus className="w-5 h-5 text-indigo-400" /></div>
          <h3 className="font-serif font-black text-xl text-slate-100 uppercase tracking-widest drop-shadow-md">Staff Management</h3>
        </div>
        <div className="space-y-5 mb-8">
          <input type="text" placeholder="Full Name" value={nuName} onChange={e => setNuName(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 rounded-xl focus:border-indigo-500/80 outline-none transition-all shadow-inner tracking-wider text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="User ID" value={nuId} onChange={e => setNuId(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 rounded-xl focus:border-indigo-500/80 outline-none transition-all shadow-inner tracking-widest font-mono text-sm" />
            <div className="space-y-1">
              <input type="password" placeholder="Password" value={nuPass} onChange={e => setNuPass(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 rounded-xl focus:border-indigo-500/80 outline-none transition-all shadow-inner tracking-widest text-sm" />
              <div className="px-2"><PasswordHints password={nuPass} /></div>
            </div>
          </div>
          <RoleDropdown 
            value={nuRole}
            onChange={setNuRole}
            options={ROLES}
            icon={ShieldAlert}
          />
          <button onClick={addUser} className="w-full bg-gradient-to-r from-indigo-700 to-blue-900 hover:from-indigo-600 hover:to-blue-800 border border-indigo-600/30 text-indigo-50 py-4 rounded-xl font-bold tracking-[0.2em] shadow-[0_10px_30px_rgba(30,27,75,0.6)] transition-all flex items-center justify-center gap-3 mt-4 text-xs uppercase group">
            Register Staff <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-70"/>
          </button>
        </div>
        <div className="space-y-3 p-2 bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-visible">
          {db.users.map(u => (
            <div key={u.id} className="text-sm bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center hover:bg-slate-800/60 transition-colors group relative">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-slate-300 tracking-widest text-xs">{u.id}</span>
                  <RoleDropdown 
                    variant="compact"
                    value={u.role}
                    onChange={newRole => updateUserRole(u.id, newRole)}
                    options={ROLES}
                    icon={ShieldAlert}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-medium tracking-[0.2em] uppercase">{u.name} <span className="text-slate-600 mx-2">|</span> Pass: <span className="text-slate-400 blur-[2px] font-mono hover:blur-none transition-all ml-1">{u.password}</span></div>
              </div>
              {u.id !== currentUser.id && <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-4 self-center"><Trash2 className="w-4 h-4"/></button>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-2xl p-6 md:p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-700/50 relative overflow-hidden flex flex-col card-hover animate-slideInRight">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-inner"><Leaf className="w-5 h-5 text-emerald-400" /></div>
          <h3 className="font-serif font-black text-xl text-slate-100 uppercase tracking-widest drop-shadow-md">Garden Registry</h3>
        </div>
        <div className="flex gap-3 mb-8">
          <input type="text" placeholder="NEW GARDEN NAME" value={npName} onChange={e => setNpName(e.target.value)} className="flex-grow p-4 bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 rounded-xl font-medium tracking-wide text-sm focus:border-emerald-500/80 outline-none transition-all shadow-inner" />
          <button onClick={addParty} className="bg-gradient-to-r from-emerald-700 to-teal-900 hover:from-emerald-600 hover:to-teal-800 border border-emerald-600/30 text-emerald-50 px-6 py-4 rounded-xl font-bold shadow-[0_10px_30px_rgba(2,44,34,0.6)] transition-all flex items-center justify-center">+</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 flex-grow p-2 bg-slate-950/20 rounded-xl border border-slate-800/30">
          {db.parties.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
            <div key={p.id} className="text-xs flex justify-between items-center p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl font-medium tracking-wider text-slate-300 hover:bg-slate-800/60 transition-colors">
              <span className="truncate">{p.name}</span>
              <button onClick={() => deleteParty(p.id)} className="text-slate-600 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-all"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col gap-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-4 tracking-[0.2em] uppercase flex items-center gap-3"><Database className="w-3 h-3 text-emerald-500/50"/> Restore System Backup</label>
            <input type="file" onChange={importDatabase} className="text-[10px] w-full file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.2em] file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 file:transition-all cursor-pointer bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-500 shadow-inner" />
          </div>
          
          <div className="pt-4 border-t border-slate-800/50">
            <button 
              onClick={resetSystem}
              className="w-full bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Factory Reset System
            </button>
            <p className="text-[9px] text-red-900/60 mt-3 text-center font-bold uppercase tracking-widest">Warning: This action wipes all data including admin accounts</p>
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
        colorDark: "#1e3a8a",
        correctLevel: window.QRCode.CorrectLevel.H
      });
    }
  }, [serial]);

  return (
    <div className="modal bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center relative printable-area border border-slate-200 modal-enter">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 no-print"></div>
        <div className="flex justify-center mb-6 no-print">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100"><Printer className="w-8 h-8 text-blue-600" /></div>
        </div>
        <h2 className="font-black text-3xl mb-1 text-slate-800 uppercase tracking-tight">Bag Tag</h2>
        <p className="text-slate-400 font-bold mb-8 tracking-widest uppercase">SERIAL #{serial}</p>
        <div ref={qrRef} className="flex justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] mb-10 flex-col items-center"></div>
        <div className="flex gap-4 no-print flex-col sm:flex-row">
          <button onClick={() => window.print()} className="flex-grow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 px-6 rounded-2xl font-black shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 group"><Printer className="w-5 h-5 group-hover:scale-110 transition-transform"/> PRINT TAG</button>
          <button onClick={close} className="bg-slate-100 text-slate-500 hover:text-slate-700 py-4 px-6 rounded-2xl font-bold uppercase transition hover:bg-slate-200">CLOSE</button>
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
    <div className="modal bg-slate-900/40 backdrop-blur-sm z-50">
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-sm relative overflow-hidden border border-slate-200 modal-enter">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
        <div className="flex items-center gap-4 mb-6 mt-2">
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100"><Search className="w-6 h-6 text-orange-600" /></div>
          <div>
            <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Lab Analysis</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">SAMPLE #{sample?.sampleSerialNo} // {sample?.partyName}</p>
          </div>
        </div>
        <div className="space-y-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2"><Leaf className="w-3 h-3"/> FLC Percentage %</label>
            <input ref={inputRef} type="number" step="0.01" value={fPct} onChange={e => setF(e.target.value)} className="w-full bg-transparent border-0 text-3xl font-black text-orange-700 outline-none p-0 focus:ring-0 placeholder:text-orange-200" placeholder="0.00" />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2">Moisture Deduction %</label>
            <input type="number" step="0.01" value={mPct} onChange={e => setM(e.target.value)} className="w-full bg-transparent border-0 text-3xl font-black text-orange-700 outline-none p-0 focus:ring-0 placeholder:text-orange-200" placeholder="0.00" />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2">Damage Leaf %</label>
            <input type="number" step="0.01" value={dPct} onChange={e => setD(e.target.value)} className="w-full bg-transparent border-0 text-3xl font-black text-orange-700 outline-none p-0 focus:ring-0 placeholder:text-orange-200" placeholder="0.00" />
          </div>
        </div>
        <button onClick={() => submitQC(sample.id, fPct, mPct, dPct)} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(234,88,12,0.3)] uppercase transition-all flex justify-center items-center gap-2 group"><Save className="w-5 h-5 group-hover:scale-110 transition-transform"/> SAVE ANALYSIS</button>
        <button onClick={close} className="w-full text-slate-400 font-bold mt-4 text-xs uppercase hover:text-slate-600 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function FinalWeightModal({ sample, close, submitFinal }) {
  const [tare, setTare] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  return (
    <div className="modal bg-slate-900/40 backdrop-blur-sm z-50">
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-sm relative overflow-hidden border border-slate-200 modal-enter">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="flex items-center gap-4 mb-6 mt-2">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100"><Database className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Final Tare</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">SAMPLE #{sample?.sampleSerialNo} // VEH: {sample?.vehicleNo}</p>
          </div>
        </div>
        <div className="bg-indigo-50/50 border border-indigo-100/50 p-5 rounded-2xl mb-6">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gross Loaded Weight</p>
          <div className="text-3xl font-black text-indigo-950 flex items-baseline gap-1">
            {sample?.grossLoadedWeight} <span className="text-sm font-bold text-indigo-400 uppercase">Kgs</span>
          </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8 shadow-inner">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Empty Vehicle Weight</label>
          <div className="flex items-baseline gap-2">
            <input ref={inputRef} type="number" value={tare} onChange={e => setTare(e.target.value)} className="w-full bg-transparent border-0 text-4xl font-black text-slate-800 outline-none p-0 focus:ring-0 placeholder:text-slate-300" placeholder="0.00" />
            <span className="text-slate-400 font-bold uppercase text-sm">Kgs</span>
          </div>
        </div>
        <button onClick={() => submitFinal(tare)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(79,70,229,0.3)] uppercase transition-all flex justify-center items-center gap-2 group"><Database className="w-5 h-5 group-hover:scale-110 transition-transform"/> COMPLETE ENTRY</button>
        <button onClick={close} className="w-full text-slate-400 font-bold mt-4 text-xs uppercase hover:text-slate-600 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function ScannerModal({ close, onScan }) {
  useEffect(() => {
    // Only mount scanner once
    if (window.Html5Qrcode && !html5QrCode) {
      html5QrCode = new window.Html5Qrcode("reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: 250 },
        (decodedText) => {
          const serial = parseInt(decodedText);
          onScan(serial);
        }
      ).catch(e => console.error(e));
    }

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().then(() => {
          html5QrCode = null;
        }).catch(e => console.log(e));
      }
    };
  }, [onScan]);

  const handleManualClose = () => {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        html5QrCode = null;
        close();
      }).catch(() => close());
    } else {
      close();
    }
  }

  return (
    <div className="modal z-[100]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-4 border-slate-800 relative">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center z-10 relative">
          <span className="font-black italic uppercase text-xs">Live Scanner Ready</span>
          <button onClick={handleManualClose} className="font-black text-xl leading-none">&times;</button>
        </div>
        <div id="reader" className="min-h-[300px] w-full bg-black relative flex items-center justify-center">
          <span className="text-white text-xs opacity-50 absolute">Initializing camera...</span>
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
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-500/30"></div>
        <div 
          onClick={() => setShowContact(!showContact)}
          className="flex items-center gap-2 px-5 py-2 bg-slate-900/40 border border-slate-800/80 rounded-full select-none cursor-pointer hover:bg-slate-800/60 transition-all active:scale-95 group"
        >
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] ${showContact ? 'bg-indigo-400' : 'bg-emerald-500'}`}></div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">
            {showContact ? `Support: +91 ${atob(_creator_contact)}` : `Designed by ${atob(_creator_id)}`}
          </span>
        </div>
        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-500/30"></div>
      </div>
      <div className="text-[8px] text-slate-800 uppercase tracking-[0.5em] font-black opacity-[0.05] hover:opacity-100 transition-all duration-1000 select-none cursor-default">
        &copy; {new Date().getFullYear()} {atob(_auth_sig)} • BUILD v4.0.2
      </div>
    </footer>
  );
}
