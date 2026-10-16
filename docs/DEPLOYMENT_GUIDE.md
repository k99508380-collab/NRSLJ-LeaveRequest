# Google Apps Script & Frontend Deployment Guide
**Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI  
**Target Platform:** Google Sheets + Google Apps Script + GitHub / Web Hosting

This guide provides step-by-step instructions for Windows users and Google account owners to deploy the Leave Management System without requiring paid databases or paid services.

---

## Deployment Architecture Overview

You have two supported deployment options:

- **Option 1: 100% Native Google Apps Script (Zero-Hosting Deployment)**  
  The frontend and backend both run directly inside Google Apps Script using HTML Service. No GitHub Pages or external web server is needed.
- **Option 2: Standalone Web App (GitHub Pages / Web Server + Apps Script Backend)**  
  The frontend is hosted on GitHub Pages or any static web host, and communicates with the Google Apps Script Web App URL via secure POST requests.

---

## Step A — Create the Private Google Spreadsheet

1. Open your web browser and sign in to the Google Account that will own the hospital application.
2. Visit [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
3. In the top-left title box, name the spreadsheet:  
   `NRSLJ Hospital Leave Management`
4. Copy the **Spreadsheet ID** from your browser address bar:  
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`  
   *(The long alphanumeric string between `/d/` and `/edit` is your Spreadsheet ID).*
5. **Security Check:** Ensure the spreadsheet remains **Private** (do NOT click "Anyone with the link can view").

---

## Step B — Set Up the Google Apps Script Project

1. In your newly created Google Sheet, click **Extensions &rarr; Apps Script** in the top menu.
2. In the Apps Script editor, rename the project at the top to:  
   `NRSLJ Leave Management Backend`
3. Click on **Project Settings** (gear icon on the left sidebar):
   - Check the box: `Show "appsscript.json" manifest file in editor`.
4. Return to the **Editor** (`< >` icon):
   - Open `appsscript.json` and replace its contents with the contents of `google-apps-script/appsscript.json`.
5. For each file in the `google-apps-script/` directory of this repository:
   - Click the **+** button next to *Files* &rarr; select **Script**.
   - Create a file with the corresponding name (e.g. `Config`, `Audit`, `Auth`, `DepartmentsDesignations`, `Holidays`, `LeaveBalances`, `LeaveRequests`, `Approvals`, `Employees`, `Reports`, `Notifications`, `HospitalSettings`, `Diagnostics`, `Setup`, `Code`).
   - Copy and paste the code from each local `.gs` file into the editor.
6. **(For Option 1 only)** Create the HTML Service file:
   - Click **+** next to *Files* &rarr; select **HTML**.
   - Name the file `GasApp`.
   - Copy the contents of `standalone-gas/GasApp.html` into `GasApp.html`.
7. Configure the Spreadsheet ID:
   - In the Apps Script left sidebar, click **Project Settings** (gear icon).
   - Under **Script Properties**, click **Add script property**.
   - **Property:** `SPREADSHEET_ID`
   - **Value:** Paste your Spreadsheet ID from Step A.
   - Click **Save script properties**.

---

## Step C — Initialize the Database

1. In the Apps Script editor toolbar, locate the function dropdown menu.
2. Select the function: **`initDatabase`**.
3. Click **Run**.
4. **Google Authorization:**
   - A popup will request authorization. Click **Review Permissions**.
   - Select your Google Account.
   - Click **Advanced** &rarr; click **Go to NRSLJ Leave Management Backend (unsafe)**.
   - Click **Allow**.
5. Inspect the **Execution log** at the bottom:
   - You will see all 14 sheets (`Employees`, `Departments`, `Designations`, `LeaveTypes`, `LeavePolicies`, `LeaveBalances`, `LeaveRequests`, `ApprovalHistory`, `BalanceLedger`, `Holidays`, `Notifications`, `AuditLogs`, `HospitalSettings`, `Sessions`) created with headers and initial seeds.
6. Switch to your Google Spreadsheet tab to verify that the 14 sheets are present with dark navy headers (`#0f2942`) and white text.

---

## Step D — Initialize the First Administrator Account

1. In the Apps Script function dropdown, select **`createFirstAdmin`** (or use the web wizard in Step F).
2. Alternatively, create the first administrator by opening `Code.gs` or running this one-line command in Apps Script:
   ```javascript
   function runSetupFirstAdmin() {
     createFirstAdmin("admin", "Hospital Administrator", "9876543210", "MasterAdminPass@2026");
   }
   ```
3. Run `runSetupFirstAdmin()`.
4. The first admin account is created with `ADMIN` privileges and activated.
5. **Security Safeguard:** Once created, `createFirstAdmin` is permanently locked and rejects any further public creation attempts.

---

## Step E — Deploy the Web Application

1. In the Apps Script editor, click the blue **Deploy** button (top right) &rarr; **New deployment**.
2. Click the gear icon next to *Select type* &rarr; choose **Web app**.
3. Configure the deployment settings:
   - **Description:** `NRSLJ Leave Management Production v1`
   - **Execute as:** `Me (your email address)`  
     *(This allows the script to read and write to the private spreadsheet securely while enforcing the application's internal authentication).*
   - **Who has access:** `Anyone`  
     *(Allows staff to access the portal and sign in from hospital devices or mobile phones without needing Google account access to your private spreadsheet).*
4. Click **Deploy**.
5. Copy the resulting **Web app URL**  
   *(e.g., `https://script.google.com/macros/s/AKfycb.../exec`).*

---

## Step F — Connect Frontend & Verify

### If using Option 1 (Native Apps Script):
Open your Web App URL directly in any browser. The full hospital portal will render immediately!

### If using Option 2 (GitHub Pages / Static Host):
1. Open `frontend/index.html` in your browser, or push the repository to GitHub and enable GitHub Pages (Settings &rarr; Pages &rarr; Source: main branch, `/frontend` or root).
2. Click the **Connection Diagnostics** button (pulse icon in the top header).
3. Paste your **Web app URL** into the *Google Apps Script Web App URL* field.
4. Click **Save URL**, then click **Test Health Ping**.
5. Click **Run Full Diagnostics** to verify:
   - Spreadsheet connection: Connected
   - 14 Database tables: Verified
   - Roundtrip write & delete test: Passed
   - Administrator status: Active
6. Click **Back to Dashboard** / **Sign In**.
7. Log in with:
   - **Username:** `admin`
   - **Password:** `MasterAdminPass@2026` (or the password you set)
8. You now have full access to the Admin Portal!
