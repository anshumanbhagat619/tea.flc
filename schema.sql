CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    role TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS samples (
    id TEXT PRIMARY KEY,
    sampleSerialNo TEXT UNIQUE,
    partyName TEXT,
    vehicleNo TEXT,
    grossLoadedWeight REAL,
    emptyVehicleWeight REAL,
    netWeight REAL,
    flcPercent REAL,
    moistureDeduction REAL,
    damagedLeaf REAL,
    finalCalculatedWeight REAL,
    status TEXT DEFAULT 'pending_qc',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    samples INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO counters (id, samples) VALUES ('global', 0);
