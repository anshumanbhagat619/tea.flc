# Tea Leaf FLC Quality Control System - Data Structure

This document outlines the core data structures used in the Tea Leaf FLC application to help developers and DevOps engineers understand the system's architecture.

## 1. Database Schema (Cloudflare D1 / SQL)

The system uses a relational schema designed for efficiency and traceability.

### `users` Table
Stores staff and administrator accounts.
- `id`: UUID (Primary Key)
- `userId`: Human-readable ID (e.g., "ADMIN01")
- `fullName`: Full name of the user
- `password`: User password
- `role`: One of `clerk`, `analyst`, `viewer`, `master`
- `status`: `pending` or `approved`
- `requestedAt`: ISO Timestamp

### `samples` Table
The heart of the system. Tracks tea leaf loads from entry to completion.
- `id`: UUID (Primary Key)
- `sampleSerialNo`: Sequential ID (e.g., "QC-00001")
- `partyName`: Garden/Garden name
- `vehicleNo`: Transport vehicle number
- `grossLoadedWeight`: Weight on entry (Kgs)
- `emptyVehicleWeight`: Weight on exit (Kgs)
- `netWeight`: `grossLoadedWeight - emptyVehicleWeight`
- `flcPercent`: Fine Leaf Count percentage
- `moistureDeduction`: Moisture deduction percentage
- `damagedLeaf`: Damaged leaf deduction percentage
- `finalCalculatedWeight`: Final weight after deductions
- `status`: `pending_qc`, `awaiting_final_weight`, `complete`
- `createdAt`: ISO Timestamp

### `parties` Table
Registry of gardens/gardens.
- `id`: UUID (Primary Key)
- `name`: Garden name

### `counters` Table
Manages sequential IDs (like `sampleSerialNo`).
- `id`: Counter name (e.g., "samples")
- `value`: Current count

---

## 2. Frontend State Machine (`App.jsx`)

The React application manages the UI flow via a structured `db` object and some helper states.

### `db` Object structure:
```json
{
  "users": [],
  "samples": [],
  "parties": [],
  "pendingUsers": []
}
```

### Sample Workflow Logic
1. **Entry Clerk**: Creates a record.
   - Sets: `partyName`, `vehicleNo`, `grossLoadedWeight`.
   - Initial Status: `pending_qc`.
2. **QC Analyst**: Performs analysis.
   - Sets: `flcPercent`, `moistureDeduction`, `damagedLeaf`.
   - Transition Status: `awaiting_final_weight`.
3. **Entry Clerk (Final Step)**: Weighs empty vehicle.
   - Sets: `emptyVehicleWeight`.
   - Transition Status: `complete`.

---

## 3. DevOps & Deployment

- **Hosting**: Cloudflare Pages (Frontend) & Cloudflare Workers (Backend).
- **Database**: Cloudflare D1 (Serverless SQL).
- **API URL**: Configured via environment variables or hardcoded in `App.jsx` for the specific deployment.
