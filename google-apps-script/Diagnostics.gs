/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * System Diagnostics, Connection Test & Health Checks
 */

function healthCheck() {
  var isConfigured = false;
  var dbConnected = false;
  var adminExists = false;
  var sheetsStatus = {};

  try {
    var ss = getSpreadsheet();
    if (ss) {
      dbConnected = true;
      var sheets = ss.getSheets().map(function(s) { return s.getName(); });
      var requiredSheets = Object.keys(CONFIG.SCHEMAS);
      for (var i = 0; i < requiredSheets.length; i++) {
        var sName = requiredSheets[i];
        sheetsStatus[sName] = sheets.indexOf(sName) !== -1;
      }

      // Check if admin exists
      if (sheetsStatus[CONFIG.SHEET_NAMES.EMPLOYEES]) {
        var emps = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
        for (var j = 0; j < emps.length; j++) {
          if (emps[j].Role === CONFIG.ROLES.ADMIN && emps[j].AccountStatus === CONFIG.ACCOUNT_STATUS.ACTIVE) {
            adminExists = true;
            break;
          }
        }
      }
      isConfigured = true;
    }
  } catch (e) {
    // Spreadsheet not yet connected or missing
  }

  return {
    status: 'ONLINE',
    app: 'NRSLJ Hospital Leave Management Backend',
    version: '1.0.0',
    timestamp: getIsoTimestamp(),
    dbConnected: dbConnected,
    isConfigured: isConfigured,
    adminExists: adminExists,
    hospitalName: CONFIG.HOSPITAL_NAME
  };
}

function runDiagnostics(sessionUser) {
  var results = {
    timestamp: getIsoTimestamp(),
    spreadsheetIdValid: false,
    spreadsheetName: '',
    sheetsCheck: {},
    allSheetsPresent: false,
    headersValid: true,
    roundtripTestPassed: false,
    adminCount: 0,
    employeeCount: 0,
    errors: []
  };

  try {
    var ss = getSpreadsheet();
    results.spreadsheetIdValid = true;
    results.spreadsheetName = ss.getName();

    var existingSheets = ss.getSheets().map(function(s) { return s.getName(); });
    var allPresent = true;

    var schemas = CONFIG.SCHEMAS;
    var tableNames = Object.keys(schemas);

    for (var i = 0; i < tableNames.length; i++) {
      var tName = tableNames[i];
      var sheet = ss.getSheetByName(tName);
      if (!sheet) {
        results.sheetsCheck[tName] = { exists: false, headersOk: false };
        allPresent = false;
        results.errors.push('Sheet "' + tName + '" is missing');
      } else {
        var lastCol = sheet.getLastColumn();
        var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); }) : [];
        var expected = schemas[tName];
        var headersOk = true;

        for (var h = 0; h < expected.length; h++) {
          if (headers.indexOf(expected[h]) === -1) {
            headersOk = false;
            results.headersValid = false;
            results.errors.push('Sheet "' + tName + '" missing expected column: ' + expected[h]);
          }
        }

        results.sheetsCheck[tName] = { exists: true, headersOk: headersOk };
      }
    }

    results.allSheetsPresent = allPresent;

    // Check counts
    if (results.sheetsCheck[CONFIG.SHEET_NAMES.EMPLOYEES] && results.sheetsCheck[CONFIG.SHEET_NAMES.EMPLOYEES].exists) {
      var emps = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
      results.employeeCount = emps.length;
      results.adminCount = emps.filter(function(e) { return e.Role === CONFIG.ROLES.ADMIN; }).length;
    }

    // Harmless round-trip write and delete test on AuditLogs
    if (results.sheetsCheck[CONFIG.SHEET_NAMES.AUDIT_LOGS] && results.sheetsCheck[CONFIG.SHEET_NAMES.AUDIT_LOGS].exists) {
      var testAuditId = 'TEST_DIAG_' + Utilities.getUuid().substring(0, 8);
      var testRecord = {
        AuditID: testAuditId,
        ActorID: sessionUser ? sessionUser.EmployeeID : 'SYSTEM_TEST',
        Action: 'DIAGNOSTIC_PING',
        EntityType: 'System',
        EntityID: 'TEST',
        Timestamp: getIsoTimestamp(),
        Result: 'TEST_SUCCESS',
        SanitizedDetails: '{"test":true}'
      };

      appendRow(CONFIG.SHEET_NAMES.AUDIT_LOGS, testRecord);

      // Verify read back
      var readIdx = findRowIndexById(CONFIG.SHEET_NAMES.AUDIT_LOGS, 'AuditID', testAuditId);
      if (readIdx !== -1) {
        // Clean up
        deleteRowById(CONFIG.SHEET_NAMES.AUDIT_LOGS, 'AuditID', testAuditId);
        results.roundtripTestPassed = true;
      }
    }

  } catch (e) {
    results.errors.push('Exception during diagnostics: ' + e.message);
  }

  return results;
}
