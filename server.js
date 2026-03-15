const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'teafactory.db');
const db = new sqlite3.Database(dbPath);

const usersExcelPath = path.join(__dirname, 'System_Users.xlsx');

function syncUsersToExcel(usersArray) {
    try {
        // Map the internal JSON keys to nice human-readable column headers for Excel
        const excelData = usersArray.map(u => ({
            "System ID": u.id,
            "Login ID": u.userId || u.id,
            "Full Name": u.name,
            "Role (admin/clerk/analyst/viewer)": u.role,
            "Password": u.password
        }));

        const ws = xlsx.utils.json_to_sheet(excelData);

        // Auto-sizing columns roughly
        ws['!cols'] = [
            { wch: 15 }, // System ID
            { wch: 15 }, // Login ID
            { wch: 25 }, // Full Name
            { wch: 30 }, // Role
            { wch: 20 }  // Password
        ];

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Users");
        xlsx.writeFile(wb, usersExcelPath);
    } catch (err) {
        console.error("Failed to write Excel", err);
    }
}

function readUsersFromExcel() {
    if (!fs.existsSync(usersExcelPath)) {
        return [];
    }
    try {
        const wb = xlsx.readFile(usersExcelPath);
        const ws = wb.Sheets["Users"];
        if (!ws) return [];
        const data = xlsx.utils.sheet_to_json(ws);

        // Map the human-readable Excel headers back to the internal React JSON structure
        return data.map(u => ({
            id: String(u["System ID"] || u.id || Date.now()),
            userId: String(u["Login ID"] || u.userId || u["System ID"]),
            name: String(u["Full Name"] || u.name),
            role: String(u["Role (admin/clerk/analyst/viewer)"] || u.role).toLowerCase(),
            password: String(u["Password"] || u.password)
        }));
    } catch (err) {
        console.error("Error reading Excel:", err);
        return [];
    }
}

// Initialize Database structure tracking the exact JSON structure of GLMS2
db.serialize(() => {
    // 1. App State (Single row to store full JSON representation to perfectly mirror your old system instantly)
    db.run(`CREATE TABLE IF NOT EXISTS system_state (
        id INTEGER PRIMARY KEY,
        app_data TEXT
    )`);

    // Insert initial blank state if empty
    db.get("SELECT COUNT(*) as count FROM system_state", (err, row) => {
        if (row && row.count === 0) {
            const initialData = JSON.stringify({
                users: [],
                parties: [],
                samples: [],
                counters: { samples: 0 }
            });
            db.run("INSERT INTO system_state (id, app_data) VALUES (1, ?)", [initialData]);
        }
    });
});

// API Routes
app.get('/api/data', (req, res) => {
    db.get("SELECT app_data FROM system_state WHERE id = 1", (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        let data = JSON.parse(row.app_data);

        // ----------------------------------------------------
        // Override users stored in SQLite with live Excel File
        // ----------------------------------------------------
        let excelUsers = readUsersFromExcel();
        if (excelUsers.length > 0 || fs.existsSync(usersExcelPath)) {
            data.users = excelUsers;
        } else if (data.users && data.users.length > 0) {
            // First time migrating SQLite users out to Excel
            syncUsersToExcel(data.users);
            data.users = readUsersFromExcel(); // Re-read to ensure structure format
        }

        res.json(data);
    });
});

app.post('/api/data', (req, res) => {
    const newData = req.body;

    // Always sync updated users from frontend back into Excel
    if (newData.users) {
        syncUsersToExcel(newData.users);
    }

    const newDataStr = JSON.stringify(newData);
    db.run("UPDATE system_state SET app_data = ? WHERE id = 1", [newDataStr], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // INJECT WEBSOCKET EVENT TO FORCE UPDATE ON ALL BROWSERS
        io.emit('database_updated', newData);

        res.json({ success: true });
    });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`SERVER RUNNING: http://localhost:${PORT}`);
    console.log(`USERS ARE STORED IN: ${usersExcelPath}`);
    console.log(`REAL-TIME WEB SOCKETS ENABLED`);
    console.log(`===============================================`);
});

// Socket.io connection logging
io.on('connection', (socket) => {
    console.log('- Device connected for real-time updates:', socket.id);
    socket.on('disconnect', () => {
        console.log('- Device disconnected:', socket.id);
    });
});
