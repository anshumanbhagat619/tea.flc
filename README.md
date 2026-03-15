# Tea FLC - Local On-Premise Quality Control System

A complete React and Node.js-based Quality Control tracking system for tea factory weighbridges. This system replaces the legacy `GLMS2.html/exe` and runs fully **offline** on local factory Wi-Fi networks.

##  Architecture & Data Flow

The system operates across a **Main PC** (Server) and any number of **Tablets/Phones/Laptops** (Clients) connected on the factory network.

### 1. The Backend Server
*   **File:** `server.js` (Express.js)
*   **Database:** `data/teafactory.db` (SQLite)
*   **Role:** Acts as the central brain. It receives real-time JSON payloads from any connected tablet and saves them instantly to the local SQLite database.
*   **Users Engine:** The server physically reads the `System_Users.xlsx` Excel file to dictate who is allowed to log in.

### 2. The Frontend (Client UI)
*   **Core File:** `frontend/src/App.jsx` (React + Tailwind)
*   **Role:** The visual interface served to the user's browser. It queries the Express API endpoint (`http://localhost:4000/api/data`) every 5 seconds. If it detects a change made by another tablet (like a newly generated QR Code tag), it instantly updates the UI across all viewing devices.

### 3. Data Storage & Flow Lifecycle
1.  **Add Staff:** The Master Admin opens `System_Users.xlsx` natively in Excel, adds a new user, and hits "Save". The Express backend instantly detects the file change and accepts new logins.
2.  **Weighbridge Entry:** The Clerk enters a truck's Gross Weight. The React Frontend sends a `POST` request to the Backend. The SQLite database updates.
3.  **Cross-Device Sync:** The Lab Analyst holding an iPad queries the server on the refresh cycle. The new tag instantly appears on their screen.
4.  **Lab Scanning:** The Analyst uses the device camera to scan the QR printed by the Weighbridge. They input FLC % data. Another `POST` is sent.
5.  **Finalization:** The Weighbridge clerk pulls up the tag again, the backend calculates the % deductions, and Final Net Weight is mathematically stamped to the DB.
6.  **Backup/Export:** From the Admin panel, the Master can click "Download CSV", which requests the SQLite data and converts it into a clean spreadsheet report.

---

##  Project Structure

```text
tea.flc/
│
├── server.js              # The central API Backend Server (Node/Express)
├── System_Users.xlsx      # The Master File mapping Login IDs and Passwords
├── README.md              # Project Documentation
│
├── data/                  
│   └── teafactory.db      # The local SQLite Storage (DO NOT DELETE)
│
└── frontend/              # Web application interface files
    ├── index.html         # Entry HTML holding Tailwind CDN and QR Scripts
    ├── package.json       # React dependencies
    └── src/
        ├── App.jsx        # The entire React Application Logic & Views
        ├── index.css      # Very basic resets; styling is controlled by Tailwind classes
        └── main.jsx       # React DOM Injector
```

##  Running the System

To boot up the system for the day (from the `tea.flc` root folder):

1. **Start the Frontend UI Router:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Start the Database Server (in a new terminal):**
   ```bash
   node server.js
   ```

The Main PC can access it at `http://localhost:5173`.
Other factory devices can access it by typing the Main PC's IP address and Port (e.g. `192.168.1.50:5173`) into their browser.
