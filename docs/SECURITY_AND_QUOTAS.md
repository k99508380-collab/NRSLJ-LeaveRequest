# Google Apps Script Security, Quotas & Reliability Architecture
**Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI

---

## 1. Security Architecture

### A. Password Hashing & Salt Architecture
- **No Plaintext Passwords:** Passwords are never stored in plaintext.
- **Salt Generation:** Each employee record receives an independent, cryptographically random 32-character salt generated with `Utilities.computeDigest(SHA_256, UUID + Timestamp + Entropy)`.
- **Key Derivation (PBKDF2/HMAC Simulation):** Uses 1,000 iterations of HMAC-SHA256 (`Utilities.computeHmacSha256Signature(current, salt)`).
- **Constant-Time Comparison:** Prevents side-channel timing attacks by checking character-by-character XOR difference through the entire hash length.
- **Data Minimization:** `PasswordHash` and `PasswordSalt` are filtered out before any employee object is sent over the network or written to audit logs.

### B. Session Management
- **Token Generation:** Unique 48-character web-safe token (`NRSLJ_<uuid>_<random_sha256_suffix>`).
- **Session Expiry:** Sessions expire automatically after 24 hours.
- **Multi-Level Storage:** Tokens are stored in the `Sessions` sheet and cached in `CacheService.getScriptCache()` for sub-second validation.
- **Session Invalidation:** Logging out explicitly clears both the server-side cache and sheet record.

### C. Role-Based Access Control (RBAC)
- All private backend operations validate the session token on the server.
- The server extracts the authenticated `EmployeeID` and `Role` directly from the database—never trusting parameters from the frontend request.
- Permissions:
  - **EMPLOYEE:** Access only to own profile, own balance records, and own leave requests.
  - **MANAGER:** Can approve or reject requests for direct reports assigned in `ReportingManagerID`.
  - **ADMIN:** Full hospital configuration, staff approval, policy management, audit logs, and manual balance adjustments.

### D. Formula Injection (CSV Injection) Prevention
When exporting CSV reports, all cells are sanitized by prefixing characters `=`, `+`, `-`, `@`, `\t`, and `\r` with a single apostrophe (`'`). This prevents spreadsheet software (Excel, LibreOffice) from executing arbitrary commands or formulas when opening exported reports.

---

## 2. Google Sheets & Apps Script Quotas

| Service / Quota | Free Google Account Limit | Google Workspace Limit | System Design & Optimization |
|---|---|---|---|
| **Script Runtime per Execution** | 6 minutes | 6 minutes | All API requests complete in < 1.5 seconds. |
| **URL Fetch / Day** | 20,000 calls | 100,000 calls | Used only for external health checks. |
| **Properties Read/Write** | 50,000 / day | 500,000 / day | ScriptProperties used only for `SPREADSHEET_ID`. |
| **Triggers / Automations** | 20 triggers / user | 20 triggers / user | Architecture is purely request-driven; no background cron trigger needed for standard operations. |
| **Simultaneous Executions** | 30 concurrent | 30 concurrent | `LockService.getScriptLock()` prevents race conditions on balance adjustments with a 30s timeout. |
| **Google Sheet Cell Limit** | 10 Million cells | 10 Million cells | Current schema uses ~10,000 cells for 500 employees over 3 years. |

---

## 3. High-Concurrency & Reliability Safeguards

### A. Atomic Concurrency Locking
During critical operations (e.g. Leave Approval, Balance Deductions, Account Activation), the backend acquires an exclusive script lock:
```javascript
var lock = LockService.getScriptLock();
var hasLock = lock.waitLock(30000); // 30s timeout
try {
  // 1. Re-read record fresh from sheet to verify current status
  // 2. Check idempotency key in BalanceLedger
  // 3. Atomically update balance and log transaction
} finally {
  lock.releaseLock();
}
```

### B. Idempotency Protection
Every balance change receives a deterministic `IdempotencyKey`:
- Approval: `APPROVE_USAGE_<RequestID>`
- Cancellation: `CANCEL_REV_<RequestID>`
- Withdrawal: `WITHDRAW_REV_<RequestID>`

If network timeouts or double-clicks cause duplicate requests, the ledger recognizes the key and returns the existing result without deducting or crediting twice.

### C. Performance Optimizations
- Batch reads (`getRange(1, 1, lastRow, lastCol).getValues()`) instead of cell-by-cell loops.
- In-memory column index mapping from row 1 headers.
- Apps Script `CacheService` for sub-second session verification.
