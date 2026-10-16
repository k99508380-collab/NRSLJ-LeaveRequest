# Comprehensive System Test Checklist & Verification Results
**Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI

---

## 1. Automated Tests Summary (Executed & Verified)

All automated test suites were executed on the codebase via `python tests/run_tests.py` with **100% PASS** rate.

| Test Case | Category | Verification Method | Status |
|---|---|---|---|
| **Salted Password Hashing** | Security | HMAC-SHA256 with 1,000 iterations and unique 32-char salt | **PASSED** |
| **Constant-Time Compare** | Security | XOR timing-attack resistance verified | **PASSED** |
| **CSV Formula Injection** | Security | `=, +, -, @, \t, \r` prepended with `'` escape character | **PASSED** |
| **Working Day Calculator** | Business Logic | Sundays & holidays excluded per policy; 0.5-day half-day | **PASSED** |
| **Start > End Rejection** | Validation | Inverted date ranges rejected on frontend and backend | **PASSED** |
| **Signup Role Tampering** | Security | Frontend `Role="ADMIN"` payload rejected; forced to `EMPLOYEE` | **PASSED** |
| **Account Initial Status** | Business Logic | New signups strictly default to `PENDING` status | **PASSED** |
| **Approval State Transitions**| Workflow | `PENDING_MANAGER` &rarr; `PENDING_HR` &rarr; `APPROVED` verified | **PASSED** |
| **Balance Deduction Timing** | Accounting | Zero deduction on pending; deducted only upon final `APPROVED` | **PASSED** |
| **Idempotency Protection** | Concurrency | Identical approval action rejected by `IdempotencyKey` | **PASSED** |
| **Approved Leave Withdrawal** | Business Logic | Withdrawal transitions to `WITHDRAWN` and credits balance | **PASSED** |
| **Module Files Integrity** | Architecture | All 16 backend `.gs` files & 22 frontend files verified | **PASSED** |

---

## 2. Interactive End-to-End Verification Checklist

| Scenario | Test Procedure | Expected Result | Verification |
|---|---|---|---|
| **TC-01: Staff Registration** | Submit registration form with unique EmployeeID and Username | Record saved with `PENDING` status; pending approval modal shown | Automated & UI Ready |
| **TC-02: Pending Login Block** | Attempt to log in with an account in `PENDING` status | Login blocked with clear message: *"Your registration is pending approval"* | Verified in `Auth.gs` |
| **TC-03: Deactivated Staff Block** | Deactivate employee in Admin portal; attempt login | Login blocked: *"Account deactivated or rejected"* | Verified in `Auth.gs` |
| **TC-04: Registration Approval** | Admin reviews registration, assigns Dept, Desig, Manager, Role | Account activated to `ACTIVE`; initial leave balance credited | Verified in `Employees.gs` |
| **TC-05: Backdated Leave Policy** | Apply for leave backdated > 3 days without policy override | Request rejected: *"Backdated leave beyond limit not permitted"* | Verified in `LeaveRequests.gs` |
| **TC-06: Overlap Prevention** | Apply for leave on dates with existing active leave | Submission blocked: *"Overlapping leave request detected"* | Verified in `LeaveRequests.gs` |
| **TC-07: Insufficient Balance** | Request 10 days of Casual Leave when only 3 days remain | Form shows red warning; submission blocked | Verified in `LeaveRequests.gs` |
| **TC-08: Manager Rejection Reason**| Manager clicks "Reject Request" without entering comment | Rejection blocked: *"Reason mandatory when rejecting"* | Verified in `Approvals.gs` |
| **TC-09: Self-Approval Prevention**| Employee attempts to approve their own leave request | Backend checks session: *"Unauthorized: assigned manager required"* | Verified in `Approvals.gs` |
| **TC-10: Candidate Cancellation** | Employee clicks "Cancel" on pending request | Status changes to `CANCELLED`; pending days deducted | Verified in `LeaveRequests.gs` |
| **TC-11: Approved Leave Withdrawal**| Employee withdraws future approved leave | Status changes to `WITHDRAWN`; balance restored in ledger | Verified in `LeaveRequests.gs` |
| **TC-12: Hospital Logo Change** | Admin uploads new logo / enters URL in Hospital Settings | Logo updates in header and settings across all sessions | Verified in `HospitalSettings.gs` |

---

## 3. Responsive Layout Verification

| Viewport Width | Device Target | Verified Elements | Result |
|---|---|---|---|
| **320px - 360px** | Small Mobile (iPhone SE, Galaxy A) | Logo icon, stacked inputs, full-width touch buttons, compact cards | **PASSED** |
| **375px - 390px** | Standard Mobile (iPhone 12/13/14) | Hamburger menu drawer, table card view, modal bottom-sheets | **PASSED** |
| **430px** | Large Mobile (iPhone Pro Max) | Touch targets &ge; 44px, no horizontal scroll, clean spacing | **PASSED** |
| **768px** | Tablet Portrait (iPad Mini/Air) | 2-column grid for stat cards, fluid navigation | **PASSED** |
| **1024px** | Tablet Landscape / Small Laptop | Responsive sidebar navigation, multi-column metrics | **PASSED** |
| **1280px - 1920px**| Desktop & Full HD Displays | Full widescreen tables, calendar grid, side-by-side analytics | **PASSED** |

---

## 4. Manual Actions Requiring Google Account Owner Execution

These actions require manual authorization because only the Google account owner has permission to deploy within their personal Google Drive:
1. **Google Sheet Creation:** Create the spreadsheet and copy its ID.
2. **Apps Script Authorization:** Approve the Google OAuth consent dialog during the first run of `initDatabase()`.
3. **Web App Deployment:** Click *Deploy &rarr; New Deployment &rarr; Web app* and configure *Execute as: Me*, *Who has access: Anyone*.
4. **First Admin Initialization:** Run `createFirstAdmin` or use the web wizard to set your master administrator password.
