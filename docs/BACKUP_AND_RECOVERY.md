# Database Backup, Disaster Recovery & Incident Procedures
**Hospital Name:** NRSLJ SPECIALITY HOSPITALS, MUSIRI

---

## 1. Google Sheets Automated & Manual Backups

Because the database resides in Google Sheets, hospital administrators benefit from built-in version history as well as independent archival procedures.

### Method 1: Google Drive Built-in Version History (Instant Rollback)
1. Open the Google Spreadsheet: `NRSLJ Hospital Leave Management`.
2. Click **File &rarr; Version history &rarr; See version history** (or press `Ctrl + Alt + Shift + H`).
3. Google maintains granular, timestamped snapshots of every edit.
4. If an inadvertent manual edit occurs:
   - Select the desired timestamp on the right panel.
   - Click **Restore this version**.

### Method 2: Scheduled Weekly / Monthly Backup Archive (Recommended)
1. Open the Google Spreadsheet.
2. Click **File &rarr; Download &rarr; Microsoft Excel (.xlsx)** or **PDF**.
3. Save the file to a secure hospital offline drive or local server using the naming convention:  
   `NRSLJ_LeaveDB_Backup_YYYYMMDD.xlsx`
4. Store backups in accordance with the hospital's data retention guidelines.

---

## 2. Automated Google Apps Script Backup Function

Administrators can set up an automatic backup script that copies the database spreadsheet to a dedicated "Hospital Backups" Google Drive folder weekly.

Add this utility function to `google-apps-script/Code.gs` or a standalone backup script:

```javascript
/**
 * Automatically creates a timestamped copy of the database
 * Can be configured to run weekly via an Apps Script Time-driven trigger
 */
function createDatabaseBackup() {
  var ss = getSpreadsheet();
  var backupName = "BACKUP_" + ss.getName() + "_" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMdd_HHmmss");
  
  // Create copy
  var copyFile = DriveApp.getFileById(ss.getId()).makeCopy(backupName);
  
  logAuditEvent("SYSTEM", "AUTOMATED_BACKUP", "Database", copyFile.getId(), "SUCCESS", {
    backupName: backupName,
    originalId: ss.getId()
  });
  
  Logger.log("Backup created successfully: " + backupName + " (ID: " + copyFile.getId() + ")");
  return copyFile.getId();
}
```

To schedule this automatically:
1. In the Apps Script editor, click the clock icon (**Triggers**) on the left sidebar.
2. Click **Add Trigger** (bottom right).
3. Select function: `createDatabaseBackup`.
4. Event source: `Time-driven`.
5. Type of time based trigger: `Week timer` (e.g. Every Sunday midnight).
6. Click **Save**.

---

## 3. Disaster Recovery & Reconnection Procedure

If the primary spreadsheet is accidentally corrupted, deleted, or ownership changes:

1. Locate your latest backup spreadsheet or make a copy of the previous week's backup file in Google Drive.
2. Open the restored spreadsheet and copy its new **Spreadsheet ID** from the URL.
3. Open the Google Apps Script project editor (**Extensions &rarr; Apps Script**).
4. Click **Project Settings** (gear icon) &rarr; **Script Properties**.
5. Update `SPREADSHEET_ID` with the new Spreadsheet ID and click **Save script properties**.
6. In the function dropdown, run **`runDiagnostics`** to verify that all 14 sheets, columns, and records are properly connected.
7. Open the frontend portal and verify that the connection status reports **All Schemas Healthy**.
