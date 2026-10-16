# First Administrator Setup & Access Recovery Guide
**Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI

---

## 1. Principles of Initial Administrator Security

1. **No Automatic Elevation:** The public employee signup form strictly assigns the `EMPLOYEE` role with `PENDING` status. It is architecturally impossible for a public registrant to gain `ADMIN` or `MANAGER` privileges.
2. **No Hardcoded Credentials:** No administrative passwords exist anywhere in the frontend code or public GitHub repository.
3. **One-Time Initialization Guard:** The backend `createFirstAdmin` method checks the `Employees` sheet for any existing active administrator. Once an administrator exists, further public invocations are permanently rejected.
4. **Iterative Salted Hashing:** Admin passwords are protected with 1,000 iterations of HMAC-SHA256 using a unique 32-character cryptographically random salt.

---

## 2. Setting Up the First Administrator

### Method A: Via the Web Diagnostics Wizard (Easiest)
1. Deploy the Apps Script Web App as described in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
2. Open the frontend portal and click the **Connection Diagnostics** button (pulse icon in the header) or navigate to `#diagnostics`.
3. Scroll to the **First Administrator Account Initialization** card.
4. The system will detect that no active administrator exists and display the initialization form.
5. Enter:
   - **Admin Username:** (e.g., `admin` or `hr.admin`)
   - **Admin Full Name:** (e.g., `Hospital Administrator` or `Dr. Director`)
   - **Phone Number:** (e.g., `9876543210`)
   - **Master Password:** (Must be at least 8 characters)
6. Click **Initialize Administrator Account**.
7. The wizard will create the account, activate it, initialize their leave balances, log an audit event, and lock the setup wizard.

### Method B: Via the Google Apps Script Editor (Direct & Secure)
1. In the Apps Script project editor, open `Setup.gs`.
2. Add or run this function at the bottom of the file:
   ```javascript
   function initializeHospitalAdmin() {
     var admin = createFirstAdmin(
       "admin",                       // Username
       "Hospital Administrator",      // Full Name
       "9876543210",                  // Phone Number
       "HospitalAdmin@2026Secure"     // Strong Password
     );
     Logger.log("Admin initialized successfully: " + admin.EmployeeID);
   }
   ```
3. In the toolbar function dropdown, select **`initializeHospitalAdmin`** and click **Run**.
4. Check the execution log to confirm creation.
5. Delete the temporary `initializeHospitalAdmin` function from `Setup.gs` or save the file without it.

---

## 3. Post-Initialization Configuration Steps

Once logged in as the initial administrator:
1. Navigate to **Registrations Queue** to review and activate pending staff signups.
2. Navigate to **Leave & Policies** to adjust annual allocations or policy rules if needed.
3. Navigate to **Hospital Settings** to verify hospital contact information, upload the hospital logo, or adjust the approval workflow (`MANAGER_THEN_HR`, `MANAGER_ONLY`, or `HR_ONLY`).

---

## 4. Emergency Administrative Access Recovery

If the hospital administrator forgets their password or administrative access is lost:

1. Open your private Google Spreadsheet (`NRSLJ Hospital Leave Management`).
2. Only the Google account owner who holds the spreadsheet has recovery authority.
3. Open **Extensions &rarr; Apps Script**.
4. Run the following emergency recovery function in the Apps Script editor:
   ```javascript
   function emergencyResetAdminPassword() {
     var newPassword = "NewEmergencyAdminPass@2026";
     var adminUsername = "admin"; // or target admin username

     var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
     for (var i = 0; i < employees.length; i++) {
       var emp = employees[i];
       if (String(emp.Username).toLowerCase() === adminUsername.toLowerCase() && emp.Role === CONFIG.ROLES.ADMIN) {
         var newSalt = AUTH.generateSalt();
         var newHash = AUTH.hashPassword(newPassword, newSalt);

         updateRowById(CONFIG.SHEET_NAMES.EMPLOYEES, "EmployeeID", emp.EmployeeID, {
           PasswordHash: newHash,
           PasswordSalt: newSalt,
           AccountStatus: CONFIG.ACCOUNT_STATUS.ACTIVE,
           UpdatedAt: getIsoTimestamp()
         });

         logAuditEvent("EMERGENCY_RECOVERY", "ADMIN_PASSWORD_RESET", "Employee", emp.EmployeeID, "SUCCESS", {
           reason: "Google Account Owner emergency password reset"
         });

         Logger.log("SUCCESS: Password reset for " + emp.EmployeeID + ". New password: " + newPassword);
         return;
       }
     }
     Logger.log("ERROR: Admin user not found.");
   }
   ```
5. Select `emergencyResetAdminPassword` and click **Run**.
6. Immediately log in with the new password and delete the recovery script snippet from Apps Script.
