# Database Schema & Sheet Architecture
**Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI  
**Database Engine:** Google Sheets  
**Backend:** Google Apps Script V8

---

## Overview

The database consists of 14 structured sheets within a single Google Spreadsheet. Every record uses immutable, stable alphanumeric IDs (e.g. `REQ_XXXXXXXX`, `EMP_XXXXXXXX`, `LED_XXXXXXXX`) rather than volatile spreadsheet row numbers.

```
       +-------------------------------------------------------+
       |             NRSLJ Leave Management Sheets             |
       +-------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
+-----------------+       +-----------------+       +-----------------+
|    Employees    |       |  Departments    |       |  Designations   |
+-----------------+       +-----------------+       +-----------------+
         |
         +--------------------+---------------------+
         |                    |                     |
+-----------------+  +-----------------+  +-------------------+
|  LeaveRequests  |  |  LeaveBalances  |  |   BalanceLedger   |
+-----------------+  +-----------------+  +-------------------+
         |
+-----------------+
| ApprovalHistory |
+-----------------+
```

---

## Table Schemas

### 1. `Employees`
Stores staff authentication profiles, account statuses, and organizational hierarchy. Plaintext passwords are never stored.

| Column | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `EmployeeID` | String | Primary Key | Hospital staff ID (e.g., `DOC102`, `NUR045`, `ADMIN001`) |
| `FullName` | String | Required | Full employee name with prefix (e.g., `Dr. A. Kumar`) |
| `Username` | String | Unique | Alphanumeric login identifier (e.g., `drkumar`) |
| `Phone` | String | Required | 10-digit mobile number |
| `PasswordHash` | String | Sensitive | Iterative HMAC-SHA256 salted hash (1000 rounds) |
| `PasswordSalt` | String | Sensitive | 32-character cryptographically random per-user salt |
| `Role` | Enum | `EMPLOYEE` \| `MANAGER` \| `ADMIN` | Role-based permission tier |
| `DepartmentID` | String | Foreign Key &rarr; `Departments` | Assigned clinical/administrative department |
| `DesignationID` | String | Foreign Key &rarr; `Designations` | Clinical or administrative designation |
| `ReportingManagerID`| String | Foreign Key &rarr; `Employees` | Designated approving manager EmployeeID |
| `AccountStatus` | Enum | `ACTIVE` \| `INACTIVE` \| `PENDING` \| `REJECTED` | Account operational status |
| `RegistrationStatus`| Enum | `PENDING` \| `APPROVED` \| `REJECTED` | Approval queue status |
| `CreatedAt` | ISO Timestamp | Required | Registration timestamp |
| `UpdatedAt` | ISO Timestamp | Required | Last update timestamp |
| `LastLoginAt` | ISO Timestamp | Optional | Last successful authentication timestamp |

---

### 2. `Departments`
Clinical and administrative units of the hospital.

| Column | Data Type | Description |
|---|---|---|
| `DepartmentID` | String (PK) | Unique code (e.g. `DEP_MED`, `DEP_CARDIO`, `DEP_SURG`) |
| `DepartmentName` | String | Display name (e.g. `General Medicine`, `Cardiology`) |
| `IsActive` | Boolean | Operational status flag (`TRUE` / `FALSE`) |
| `CreatedAt` | ISO Timestamp | Creation timestamp |

---

### 3. `Designations`
Staff positions and clinical ranks.

| Column | Data Type | Description |
|---|---|---|
| `DesignationID` | String (PK) | Unique code (e.g. `DES_CMO`, `DES_SR_CONS`, `DES_STAFF_NURSE`) |
| `DesignationName` | String | Designation title (e.g. `Chief Medical Officer`, `Staff Nurse`) |
| `IsActive` | Boolean | Operational status flag |
| `CreatedAt` | ISO Timestamp | Creation timestamp |

---

### 4. `LeaveTypes`
Configurable leave categories offered by the hospital.

| Column | Data Type | Description |
|---|---|---|
| `LeaveTypeID` | String (PK) | Unique code (e.g. `LT_CL`, `LT_SL`, `LT_EL`, `LT_LOP`) |
| `LeaveTypeName` | String | Name (e.g. `Casual Leave (CL)`, `Sick Leave (SL)`) |
| `Description` | String | Category guidelines and medical criteria |
| `RequiresBalance` | Boolean | `TRUE` if deducted from quota; `FALSE` for Loss of Pay |
| `RequiresAttachment` | Boolean | `TRUE` if medical certificate or document required |
| `IsActive` | Boolean | Enable or disable leave category |
| `CreatedAt` | ISO Timestamp | Creation timestamp |
| `UpdatedAt` | ISO Timestamp | Last modification timestamp |

---

### 5. `LeavePolicies`
Hospital policies governing allowances and counting rules for each leave type.

| Column | Data Type | Description |
|---|---|---|
| `PolicyID` | String (PK) | Unique policy ID |
| `LeaveTypeID` | String (FK) | Target leave type code |
| `AnnualAllocation`| Number | Annual allotted days (e.g. `12`, `15`) |
| `AccrualRule` | String | `ANNUAL_UPFRONT` or `MONTHLY_ACCRUAL` |
| `CarryForwardRule`| String | `NO_CARRY_FORWARD` or `CARRY_FORWARD_MAX_30` |
| `ExpiryRule` | String | `END_OF_YEAR` or `NO_EXPIRY` |
| `NoticePeriod` | Number | Minimum advance notice in calendar days |
| `MaximumDuration` | Number | Max consecutive days per single request |
| `WeekendsPolicy` | String | `EXCLUDE_SUNDAYS`, `EXCLUDE_WEEKENDS`, or `INCLUDE_ALL` |
| `HolidaysPolicy` | String | `EXCLUDE_HOLIDAYS` or `INCLUDE_ALL` |
| `NegativeBalanceAllowed`| Boolean | Allow negative balance (`FALSE` by default) |
| `EffectiveFrom` | ISO Timestamp | Policy effective date |
| `EffectiveTo` | ISO Timestamp | Policy expiry date (empty if perpetual) |

---

### 6. `LeaveBalances`
Annual balance ledger per employee per leave category.

| Column | Data Type | Description |
|---|---|---|
| `BalanceID` | String (PK) | Unique record ID |
| `EmployeeID` | String (FK) | Staff member EmployeeID |
| `LeaveTypeID` | String (FK) | Leave category |
| `LeaveYear` | Number | Calendar year (e.g. `2026`) |
| `OpeningBalance` | Number | Balance carried over from prior year |
| `Allocated` | Number | Annual entitlement credited |
| `Accrued` | Number | Periodically accrued days |
| `Used` | Number | Approved leaves deducted |
| `Adjustments` | Number | Administrative adjustments (credits or debits) |
| `AvailableBalance` | Number | Net available (`Opening + Allocated + Accrued - Used + Adjustments`) |
| `UpdatedAt` | ISO Timestamp | Last balance update timestamp |

---

### 7. `LeaveRequests`
Submitted leave applications.

| Column | Data Type | Description |
|---|---|---|
| `RequestID` | String (PK) | Alphanumeric identifier (`REQ_XXXXXXXXXX`) |
| `EmployeeID` | String (FK) | Submitting employee |
| `LeaveTypeID` | String (FK) | Requested leave category |
| `StartDate` | Date (YYYY-MM-DD)| Leave start date |
| `EndDate` | Date (YYYY-MM-DD)| Leave end date |
| `DayPart` | Enum | `FULL`, `FIRST_HALF`, `SECOND_HALF` |
| `RequestedDays` | Number | Calculated net working days |
| `Reason` | String | Employee justification (minimum 5 characters) |
| `AttachmentReference`| String | Document reference or link |
| `Status` | Enum | `PENDING_MANAGER`, `PENDING_HR`, `APPROVED`, `REJECTED`, `WITHDRAWN`, `CANCELLED` |
| `CurrentApproverID` | String | Assigned manager EmployeeID or `ADMIN_HR_QUEUE` |
| `SubmittedAt` | ISO Timestamp | Application submission timestamp |
| `UpdatedAt` | ISO Timestamp | Last transition timestamp |
| `FinalDecisionAt` | ISO Timestamp | Final approval or rejection timestamp |

---

### 8. `ApprovalHistory`
Immutable transition audit trail of every review step.

| Column | Data Type | Description |
|---|---|---|
| `ApprovalID` | String (PK) | Step transition ID |
| `RequestID` | String (FK) | Related leave request |
| `ApproverID` | String (FK) | Reviewer EmployeeID |
| `ApproverRole` | Enum | `MANAGER` or `ADMIN` |
| `Decision` | Enum | `APPROVE` or `REJECT` |
| `Comment` | String | Reviewer remarks (mandatory on rejection) |
| `StepNumber` | Number | Workflow step index (`1` = Manager, `2` = HR) |
| `ActionAt` | ISO Timestamp | Decision timestamp |

---

### 9. `BalanceLedger`
Double-entry style financial-grade ledger of all balance movements.

| Column | Data Type | Description |
|---|---|---|
| `LedgerID` | String (PK) | Transaction ID |
| `EmployeeID` | String (FK) | Staff member |
| `LeaveTypeID` | String (FK) | Leave category |
| `RequestID` | String | Linked leave request or `MANUAL_ADJUSTMENT` |
| `TransactionType` | Enum | `ALLOCATION`, `USAGE`, `CANCELLATION_REVERSAL`, `WITHDRAWAL_REVERSAL`, `MANUAL_ADJUSTMENT` |
| `Amount` | Number | Days credited (+) or debited (-) |
| `Reason` | String | Transaction justification |
| `CreatedBy` | String | Actor EmployeeID or `SYSTEM` |
| `CreatedAt` | ISO Timestamp | Transaction timestamp |
| `IdempotencyKey` | String (Unique) | Deduplication key preventing repeat deductions |

---

### 10. `Holidays`
Hospital holiday calendar.

| Column | Data Type | Description |
|---|---|---|
| `HolidayID` | String (PK) | Holiday code |
| `HolidayDate` | Date (YYYY-MM-DD)| Holiday date |
| `HolidayName` | String | Name (e.g. `Pongal`, `Independence Day`) |
| `ApplicableDepartment`| String | `ALL` or specific DepartmentID |
| `IsActive` | Boolean | Active status flag |

---

### 11. `Notifications`
In-app notification messages.

| Column | Data Type | Description |
|---|---|---|
| `NotificationID` | String (PK) | Notification ID |
| `RecipientEmployeeID` | String (FK) | Target employee |
| `NotificationType` | String | `LEAVE_SUBMITTED`, `LEAVE_DECISION`, `REGISTRATION_APPROVED`, etc. |
| `Title` | String | Notification headline |
| `Message` | String | Notification body |
| `RelatedRequestID` | String | Optional linked request ID |
| `CreatedAt` | ISO Timestamp | Dispatch timestamp |
| `ReadAt` | ISO Timestamp | Read timestamp (empty if unread) |

---

### 12. `AuditLogs`
Security and administrative compliance events.

| Column | Data Type | Description |
|---|---|---|
| `AuditID` | String (PK) | Unique audit ID |
| `ActorID` | String | Initiator EmployeeID or `ANONYMOUS` |
| `Action` | String | Operation code (e.g. `LOGIN_SUCCESS`, `APPROVAL_DECISION`, `UPDATE_POLICY`) |
| `EntityType` | String | Target entity (`Employee`, `LeaveRequest`, `Settings`) |
| `EntityID` | String | Target record ID |
| `Timestamp` | ISO Timestamp | Event timestamp |
| `Result` | Enum | `SUCCESS` or `FAILED` |
| `SanitizedDetails` | JSON String | Redacted event parameters (passwords/tokens omitted) |

---

### 13. `HospitalSettings`
Hospital branding and global system configuration.

| Column | Data Type | Description |
|---|---|---|
| `SettingKey` | String (PK) | Setting identifier |
| `SettingValue` | String | Configuration value |
| `UpdatedBy` | String | Administrator EmployeeID |
| `UpdatedAt` | ISO Timestamp | Modification timestamp |

---

### 14. `Sessions`
Server-side active user sessions with automatic expiry.

| Column | Data Type | Description |
|---|---|---|
| `SessionToken` | String (PK) | Cryptographically random session identifier |
| `EmployeeID` | String (FK) | Authenticated employee ID |
| `Role` | Enum | Authorized role |
| `ExpiresAt` | ISO Timestamp | Expiration timestamp (24 hours from login) |
| `CreatedAt` | ISO Timestamp | Session creation timestamp |
