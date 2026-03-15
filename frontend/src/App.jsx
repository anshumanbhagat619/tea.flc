import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const INITIAL_DB = { users: [], parties: [], samples: [], counters: { samples: 0 } };

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
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {view === 'setup' && <SetupView saveDB={saveDB} setView={setView} toast={toast} />}
      {view === 'login' && <LoginView db={db} setCurrentUser={setCurrentUser} setView={setView} saveDB={saveDB} toast={toast} />}
      {view === 'main' && <MainView db={db} saveDB={saveDB} currentUser={currentUser} handleLogout={handleLogout} toast={toast} />}
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
    const upperId = id.trim().toUpperCase();
    const newDb = { users: [{ id: upperId, name: name.trim(), role: 'master', password: password.trim() }], parties: [], samples: [], counters: { samples: 0 } };
    saveDB(newDb);
    toast("Admin Created! Please login.");
    setView('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-green-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-black text-center mb-2 text-green-800 uppercase">System Setup</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Create the first Admin (Master) ID.</p>
        <div className="space-y-4">
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl" />
          <input type="text" placeholder="Create Admin User ID" value={id} onChange={e => setId(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl font-mono" />
          <input type="password" placeholder="Set Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl" />
          <button onClick={handleSetup} className="w-full bg-green-700 text-white py-4 rounded-xl font-black text-lg">ACTIVATE SYSTEM</button>
        </div>
      </div>
    </div>
  );
}

function LoginView({ db, setCurrentUser, setView, toast }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const upperId = id.trim().toUpperCase();
    const user = db.users.find(u => u.id === upperId && u.password === password.trim());
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('teaAppUserId', upperId);
      setView('main');
    } else {
      setError("INVALID USER ID OR PASSWORD");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-8 border-green-700">
        <h1 className="text-3xl font-black text-center mb-8 text-slate-800 tracking-tight">TEA LEAF FLC</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="USER ID"
            value={id}
            onChange={e => setId(e.target.value)}
            className="w-full px-4 py-4 border-2 rounded-xl font-mono text-lg outline-none focus:border-green-500"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-4 border-2 rounded-xl text-lg outline-none focus:border-green-500"
          />
          <button onClick={handleLogin} className="w-full bg-green-700 text-white py-4 rounded-xl font-black text-lg shadow-lg">SIGN IN</button>
          {error && <p className="text-red-600 text-center font-bold mt-2">{error}</p>}
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
    <div className="pb-20">
      <header className="bg-slate-900 text-white p-5 shadow-2xl mb-6 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center font-black italic shadow-inner">TEA</div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter">Factory Quality System</h1>
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">{currentUser.name} // {currentUser.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportDatabase} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-bold text-xs">BACKUP</button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg font-black text-xs">EXIT</button>
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

        <div className="bg-white rounded-2xl shadow-md p-6 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg font-black text-slate-800 uppercase italic">Daily Quality Summary</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-2 p-2 rounded-xl text-xs font-bold focus:border-green-500" />
              <button onClick={downloadCSV} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black shadow-md">DOWNLOAD CSV</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="p-4">Serial</th><th className="p-4">Garden/Transport</th><th className="p-4">Weight Breakup</th><th className="p-4">QC Data</th><th className="p-4 text-green-700 font-black">Final Weight</th>{currentUser.role === 'master' && <th className="p-4">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFilteredSamples.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-black text-slate-400">#{s.sampleSerialNo}</td>
                    <td className="p-4">
                      <div className="font-black text-slate-800">{s.partyName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.vehicleNo}</div>
                    </td>
                    <td className="p-4 leading-tight">
                      <div className="text-xs text-slate-500">Gross: {s.grossLoadedWeight} Kgs</div>
                      <div className="text-xs text-slate-500 italic">Empty: {s.emptyVehicleWeight || 0} Kgs</div>
                      <div className="font-bold text-slate-700 underline">Net: {s.netWeight || 0} Kgs</div>
                    </td>
                    <td className="p-4 leading-tight">
                      <div className="text-[10px] font-bold">FLC: {s.flcPercent}%</div>
                      <div className="text-[10px] text-slate-500 mt-1">Moisture: {s.moistureDeduction}%</div>
                      <div className="text-[10px] text-slate-500">Damage: {s.damagedLeaf}%</div>
                      <div className="text-[10px] text-orange-600 font-bold mt-1">Total: {((s.moistureDeduction || 0) + (s.damagedLeaf || 0)).toFixed(2)}%</div>
                    </td>
                    <td className="p-4">
                      <div className="text-lg font-black text-green-700">{s.finalCalculatedWeight || 0} <span className="text-[10px] font-normal">Kgs</span></div>
                    </td>
                    {currentUser.role === 'master' && (
                      <td className="p-4">
                        <button onClick={() => {
                          if (window.confirm("Erase record?")) {
                            saveDB({ ...db, samples: db.samples.filter(x => x.id !== s.id) });
                          }
                        }} className="text-red-200 hover:text-red-500 transition font-bold">DEL</button>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-2xl shadow-md p-6 border-l-8 border-blue-500">
        <h2 className="text-xl font-black mb-4 text-blue-900 uppercase">1. Initial Entry (Gross)</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Vehicle No" maxLength="15" value={vehicle} onChange={e => setVehicle(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl font-mono" />
            <select value={garden} onChange={e => setGarden(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl bg-white text-sm font-bold">
              <option value="">Select Garden</option>
              {db.parties.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <input type="number" placeholder="Gross Loaded Weight (Kgs)" value={gross} onChange={e => setGross(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl font-black text-xl text-blue-700" />
          <button onClick={onGenerate} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg">GENERATE TAG</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border-l-8 border-indigo-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-indigo-900 uppercase">2. Final Weight</h2>
          <button onClick={openScanner} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase">SCAN TAG</button>
        </div>
        <p className="text-xs text-gray-400 mb-4 uppercase font-bold">Samples waiting for tare weight: {pendingFinal.length}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {pendingFinal.map(s => (
            <button key={s.id} onClick={() => openFinalWeightModal(s.id)} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-indigo-700 text-sm"># {s.sampleSerialNo}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalystSection({ pendingQC, openFlcModal, openScanner }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-l-8 border-orange-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-orange-900 uppercase tracking-tight">Quality Lab Entry</h2>
        <button onClick={openScanner} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 tracking-widest uppercase">
          SCAN SAMPLE QR
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {pendingQC.length === 0 ? (
          <p className="col-span-full text-center py-10 text-gray-300 font-bold bg-gray-50 rounded-xl">NO SAMPLES PENDING IN LAB</p>
        ) : pendingQC.map(s => (
          <button key={s.id} onClick={() => openFlcModal(s.id)} className="p-4 bg-orange-50 border-2 border-orange-100 rounded-xl text-center font-black text-orange-700 hover:scale-105 transition"># {s.sampleSerialNo}</button>
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

  const addUser = () => {
    const id = nuId.trim().toUpperCase();
    if (!nuName || !id || !nuPass) return toast("Enter name, ID and password", "error");
    if (db.users.some(u => u.id === id)) return toast("User ID exists", "error");
    const newDb = { ...db, users: [...db.users, { id, name: nuName.trim(), role: nuRole, password: nuPass }] };
    saveDB(newDb);
    toast("Staff Member Added");
    setNuName(''); setNuId(''); setNuPass(''); setNuRole('clerk');
  };

  const deleteUser = (id) => {
    if (id === currentUser.id) return;
    saveDB({ ...db, users: db.users.filter(u => u.id !== id) });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-indigo-600">
        <h3 className="font-black mb-6 text-indigo-900 uppercase italic">Staff Management</h3>
        <div className="space-y-4 mb-8">
          <input type="text" placeholder="Full Name" value={nuName} onChange={e => setNuName(e.target.value)} className="w-full p-3 border-2 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="User ID (Login ID)" value={nuId} onChange={e => setNuId(e.target.value)} className="w-full p-3 border-2 rounded-xl font-mono" />
            <input type="text" placeholder="Password" value={nuPass} onChange={e => setNuPass(e.target.value)} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <select value={nuRole} onChange={e => setNuRole(e.target.value)} className="w-full p-3 border-2 rounded-xl bg-white font-bold">
            <option value="clerk">Entry Clerk</option>
            <option value="analyst">QC Analyst</option>
            <option value="viewer">Viewer</option>
            <option value="master">Admin</option>
          </select>
          <button onClick={addUser} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">REGISTER STAFF</button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {db.users.map(u => (
            <div key={u.id} className="text-xs bg-slate-50 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-black text-indigo-900">{u.id} <span className="font-normal text-slate-400 lowercase">({u.role})</span></div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{u.name} // Pass: {u.password}</div>
              </div>
              {u.id !== currentUser.id && <button onClick={() => deleteUser(u.id)} className="text-red-300 hover:text-red-500 font-black">REMOVE</button>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-emerald-600">
        <h3 className="font-black mb-6 text-emerald-900 uppercase italic tracking-tighter">Garden Registry</h3>
        <div className="flex gap-2 mb-6">
          <input type="text" placeholder="NEW GARDEN NAME" value={npName} onChange={e => setNpName(e.target.value)} className="flex-grow p-3 border-2 rounded-xl font-bold text-sm" />
          <button onClick={addParty} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xl shadow-md">+</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
          {db.parties.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
            <div key={p.id} className="text-[10px] flex justify-between items-center p-3 bg-slate-50 rounded-xl font-black tracking-tight">
              <span className="truncate">{p.name}</span>
              <button onClick={() => deleteParty(p.id)} className="text-red-300 hover:text-red-500 ml-2 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Restore Database from File</label>
          <input type="file" onChange={importDatabase} className="text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
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
    <div className="modal">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border-4 border-blue-600 printable-area relative">
        <h2 className="font-black text-2xl mb-1 text-blue-900 uppercase">Sample Bag Tag</h2>
        <p className="text-slate-400 font-bold mb-6 tracking-widest italic uppercase">Serial # {serial}</p>
        <div ref={qrRef} className="flex justify-center p-4 bg-white border-2 border-slate-50 rounded-2xl mb-8 flex-col items-center"></div>
        <div className="flex gap-3 no-print">
          <button onClick={() => window.print()} className="flex-grow bg-blue-600 text-white py-4 px-6 rounded-2xl font-black shadow-lg uppercase">PRINT TAG</button>
          <button onClick={close} className="bg-slate-100 text-slate-500 py-4 px-6 rounded-2xl font-bold uppercase transition hover:bg-slate-200">CLOSE</button>
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
    <div className="modal">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border-t-8 border-orange-500">
        <h3 className="font-black text-xl mb-1 text-orange-900 uppercase italic">Lab Analysis</h3>
        <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase">Sample # {sample?.sampleSerialNo} // {sample?.partyName}</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase">FLC Percentage %</label>
            <input ref={inputRef} type="number" step="0.01" value={fPct} onChange={e => setF(e.target.value)} className="w-full p-4 border-2 rounded-xl text-2xl font-black text-orange-700 outline-none" placeholder="0.00" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase">Moisture Deduction %</label>
            <input type="number" step="0.01" value={mPct} onChange={e => setM(e.target.value)} className="w-full p-4 border-2 rounded-xl text-2xl font-black text-orange-700 outline-none" placeholder="0.00" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase">Damage Leaf %</label>
            <input type="number" step="0.01" value={dPct} onChange={e => setD(e.target.value)} className="w-full p-4 border-2 rounded-xl text-2xl font-black text-orange-700 outline-none" placeholder="0.00" />
          </div>
        </div>
        <button onClick={() => submitQC(sample.id, fPct, mPct, dPct)} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl uppercase">SAVE ANALYSIS</button>
        <button onClick={close} className="w-full text-slate-400 font-bold mt-4 text-xs uppercase hover:underline">Cancel</button>
      </div>
    </div>
  );
}

function FinalWeightModal({ sample, close, submitFinal }) {
  const [tare, setTare] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  return (
    <div className="modal">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border-t-8 border-indigo-600">
        <h3 className="font-black text-xl mb-1 text-indigo-900 uppercase">Final Tare Weight</h3>
        <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase">Sample # {sample?.sampleSerialNo} // Veh: {sample?.vehicleNo}</p>

        <div className="bg-slate-50 p-4 rounded-xl mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase">Gross Loaded Weight</p>
          <p className="text-2xl font-black text-slate-800">{sample?.grossLoadedWeight} Kgs</p>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-500 uppercase">Empty Vehicle Weight (Kgs)</label>
          <input ref={inputRef} type="number" value={tare} onChange={e => setTare(e.target.value)} className="w-full p-4 border-2 rounded-xl text-3xl font-black text-indigo-700 outline-none" placeholder="0.00" />
        </div>

        <button onClick={() => submitFinal(tare)} className="w-full bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl uppercase">Complete Entry</button>
        <button onClick={close} className="w-full text-slate-400 font-bold mt-4 text-xs uppercase underline hover:text-slate-600">Cancel</button>
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
