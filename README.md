# NRSLJ SPECIALITY HOSPITALS, MUSIRI
## Hospital Employee Leave Management System

A production-structured, responsive web application for employee leave management designed specifically for **NRSLJ Speciality Hospitals, Musiri**. Built using **Google Sheets as the database** and **Google Apps Script as the backend**, supporting dual deployment (native Google Apps Script HTML Service or standalone hosting via GitHub Pages).

---

## 🏥 Hospital Identity & Branding

- **Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI
- **Color Palette:** Navy blue (`#0f2942`), healthcare teal (`#0d9488`), white/slate (`#f8fafc`), restrained green accents (`#16a34a`).
- **Logo:** Custom medical shield with cross & pulse line, plus Admin logo customization tool in Hospital Settings.
- **Responsive Viewports Tested:** 320px, 360px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1920px.

---

## 🌟 Key Features & Workflow

### 1. Multi-Tier Role-Based Access Control (RBAC)
- **Employee:** Register, login, apply for leave (with live working day duration calculation), view balances, track approval status, cancel pending requests, withdraw future approved leaves, and receive in-app notifications.
- **Manager:** Review assigned team submissions, view team leave calendar, approve or reject requests with mandatory justification.
- **Admin/HR:** Approve/reject staff signups with department, designation, and manager assignment; manage leave types & policies; execute manual balance adjustments with auditable ledger logging; configure hospital logo & workflows; view system audit logs; export formula-sanitized CSV reports.

### 2. Approval Workflow
```
[Employee Submits Request]
            |
            v
[Manager Review & Decision]
    | (Approve)           | (Reject)
    v                     v
[Routes to HR]       [Status: REJECTED]
    | (Approve)
    v
[Status: APPROVED] ---> [Deduct Balance Atomically via BalanceLedger]
```

### 3. Financial-Grade Accounting & Concurrency
- `LockService` concurrency locking (30s) prevents race conditions.
- `IdempotencyKey` prevents duplicate deductions on network retry or double-click.
- Zero balance deducted while in `PENDING` or `REJECTED` state.
- Cancellation and withdrawal reverse deductions exactly once.

---

## 📁 Repository Structure

```
NRSLJ/
├── google-apps-script/                 # Complete backend source files
│   ├── appsscript.json                 # Manifest with V8 runtime & permissions
│   ├── Code.gs                         # Web App router (doGet, doPost, apiDispatcher)
│   ├── Config.gs                       # Configuration, table schemas & sheet CRUD
│   ├── Audit.gs                        # Immutable audit logging with sanitization
│   ├── Auth.gs                         # Salted HMAC-SHA256 hashing & 24h sessions
│   ├── DepartmentsDesignations.gs      # Department and designation management
│   ├── Holidays.gs                     # Holiday list & working day calculator
│   ├── LeaveBalances.gs                # Balance calculations, policies & ledger
│   ├── LeaveRequests.gs                # Leave requests, validations & cancellations
│   ├── Approvals.gs                    # Multi-tier approval workflow & transitions
│   ├── Employees.gs                    # Registration queue & employee management
│   ├── Reports.gs                      # Dashboard metrics, calendar & CSV exports
│   ├── Notifications.gs                # In-app notification dispatcher & reader
│   ├── HospitalSettings.gs             # Hospital branding & workflow settings
│   ├── Diagnostics.gs                  # Connection health checks & roundtrip tests
│   ├── Setup.gs                        # Schema initialization & first admin wizard
│   └── GasApp.html                     # Pre-bundled template for HTML Service
├── frontend/                           # Modern responsive frontend SPA
│   ├── index.html                      # Entry point for static hosting / GitHub Pages
│   ├── assets/
│   │   └── logo.svg                    # NRSLJ Hospital vector logo
│   ├── css/
│   │   ├── variables.css               # Design tokens & color system
│   │   ├── base.css                    # Resets & layout container
│   │   ├── components.css              # Cards, tables, forms, modals & badges
│   │   └── responsive.css              # Breakpoints (320px to 1920px)
│   └── js/
│       ├── config.js                   # Client configuration & storage keys
│       ├── api.js                      # Dual adapter (google.script.run & fetch POST)
│       ├── state.js                    # Global reactive state store
│       ├── auth.js                     # Authentication controller & session guard
│       ├── app.js                      # Main router & orchestrator
│       ├── components/                 # UI components (header, sidebar, toast, modal)
│       └── views/                      # All view controllers
├── standalone-gas/                     # Standalone deployment bundle
│   └── GasApp.html                     # Single-file bundled app for Google HTML Service
├── tests/
│   ├── run_tests.py                    # Automated test suite (6/6 tests passing)
│   ├── build_gas_bundle.py             # Bundle generator script
│   └── test_checklist.md               # Test matrix and manual verification steps
├── docs/
│   ├── DATABASE_SCHEMA.md              # 14 Google Sheet schemas & column definitions
│   ├── DEPLOYMENT_GUIDE.md             # Beginner-friendly deployment instructions
│   ├── FIRST_ADMIN_SETUP.md            # Secure initial administrator initialization
│   ├── SECURITY_AND_QUOTAS.md          # Concurrency locks, quotas & formula security
│   └── BACKUP_AND_RECOVERY.md          # Version history & automated backup script
├── README.md                           # Project documentation
└── .gitignore                          # Git ignore rules
```

---

## 🚀 Quick Start Deployment Guide

For complete, step-by-step instructions, see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

### Step 1: Create the Google Sheet
1. Create a blank private spreadsheet in Google Drive named:  
   `NRSLJ Hospital Leave Management`
2. Copy the **Spreadsheet ID** from its URL.

### Step 2: Set Up Apps Script
1. Open **Extensions &rarr; Apps Script**.
2. Copy the files from `google-apps-script/` into the project editor.
3. In **Project Settings &rarr; Script Properties**, add:  
   - Property: `SPREADSHEET_ID`  
   - Value: *(Your copied Spreadsheet ID)*

### Step 3: Initialize Database & Deploy
1. In the function dropdown, run **`initDatabase`** and grant Google permissions.
2. In the top-right, click **Deploy &rarr; New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
3. Copy the deployed **Web app URL**.

### Step 4: Access the Application
- **Zero-Hosting Option:** Open the Web App URL directly in any browser (it serves `GasApp.html` with zero external hosting!).
- **GitHub Pages Option:** Open `frontend/index.html`, click **Connection Diagnostics** (top-right pulse icon), paste your Web app URL, and click **Save URL**.

---

## 🔒 First Administrator Setup

1. Open the portal and navigate to **Connection Diagnostics** (`#diagnostics`).
2. Fill out the **First Administrator Account Initialization** form:
   - **Username:** `admin`
   - **Password:** *(At least 8 characters)*
3. Click **Initialize Administrator Account**.
4. Log in as Admin/HR to manage staff, leave policies, and review registrations.
5. See [docs/FIRST_ADMIN_SETUP.md](docs/FIRST_ADMIN_SETUP.md) for recovery details.

---

## 🧪 Automated Testing

Run the automated test suite locally:
```bash
python tests/run_tests.py
```

All 6 test suites verify:
- ✅ PBKDF2/HMAC-SHA256 iterative salted password hashing
- ✅ Constant-time XOR comparison against timing attacks
- ✅ CSV Formula Injection sanitization (`=, +, -, @` escaping)
- ✅ Policy-driven working days calculation (Sundays & holidays excluded)
- ✅ Multi-tier approval state transitions and balance deduction timing
- ✅ Balance ledger idempotency protection against duplicate requests
- ✅ Database schema completeness across all 14 tables

---

## 📤 Pushing Code to Your GitHub Repository

To push this codebase to your GitHub repository from Windows PowerShell:

```powershell
# 1. Initialize git if not already done
git init

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "feat: complete NRSLJ Speciality Hospitals leave management system"

# 4. Set main branch
git branch -M main

# 5. Link to your existing GitHub repository URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 📋 Manual Steps Requiring Your Action

Only the Google Account owner can perform these actions in their personal Google Drive:
1. **Google Sheet Creation:** Create the spreadsheet and note its ID.
2. **Google OAuth Authorization:** Grant permission when running `initDatabase()` the first time.
3. **Web App Deployment:** Click *Deploy &rarr; New deployment &rarr; Web app* in Google Apps Script.
4. **GitHub Push:** Run the git commands above to push to your repository.
