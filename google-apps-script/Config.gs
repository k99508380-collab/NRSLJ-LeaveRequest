/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Leave Management System - Backend Configuration & Utilities
 */

var CONFIG = {
  HOSPITAL_NAME: 'NRSLJ SPECIALITY HOSPITALS, MUSIRI',
  DEFAULT_LEAVE_YEAR: new Date().getFullYear(),
  DEFAULT_LOGO_URL: '', // Can be customized in HospitalSettings
  SESSION_EXPIRATION_HOURS: 24,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIMEOUT_MS: 30000, // 30s lock for critical transactions
  
  SHEET_NAMES: {
    EMPLOYEES: 'Employees',
    DEPARTMENTS: 'Departments',
    DESIGNATIONS: 'Designations',
    LEAVE_TYPES: 'LeaveTypes',
    LEAVE_POLICIES: 'LeavePolicies',
    LEAVE_BALANCES: 'LeaveBalances',
    LEAVE_REQUESTS: 'LeaveRequests',
    APPROVAL_HISTORY: 'ApprovalHistory',
    BALANCE_LEDGER: 'BalanceLedger',
    HOLIDAYS: 'Holidays',
    NOTIFICATIONS: 'Notifications',
    AUDIT_LOGS: 'AuditLogs',
    HOSPITAL_SETTINGS: 'HospitalSettings',
    SESSIONS: 'Sessions'
  },

  ROLES: {
    EMPLOYEE: 'EMPLOYEE',
    MANAGER: 'MANAGER',
    ADMIN: 'ADMIN'
  },

  ACCOUNT_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    REJECTED: 'REJECTED'
  },

  REGISTRATION_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
  },

  REQUEST_STATUS: {
    DRAFT: 'DRAFT',
    PENDING_MANAGER: 'PENDING_MANAGER',
    PENDING_HR: 'PENDING_HR',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
    CANCELLED: 'CANCELLED'
  },

  DAY_PART: {
    FULL: 'FULL',
    FIRST_HALF: 'FIRST_HALF',
    SECOND_HALF: 'SECOND_HALF'
  },

  LEDGER_TYPE: {
    ALLOCATION: 'ALLOCATION',
    USAGE: 'USAGE',
    CANCELLATION_REVERSAL: 'CANCELLATION_REVERSAL',
    WITHDRAWAL_REVERSAL: 'WITHDRAWAL_REVERSAL',
    MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT'
  },

  APPROVAL_WORKFLOW: {
    MANAGER_THEN_HR: 'MANAGER_THEN_HR',
    MANAGER_ONLY: 'MANAGER_ONLY',
    HR_ONLY: 'HR_ONLY'
  },

  // Column definitions for each sheet (preserves order during setup)
  SCHEMAS: {
    Employees: [
      'EmployeeID', 'FullName', 'Username', 'Phone', 'PasswordHash', 'PasswordSalt',
      'Role', 'DepartmentID', 'DesignationID', 'ReportingManagerID',
      'AccountStatus', 'RegistrationStatus', 'CreatedAt', 'UpdatedAt', 'LastLoginAt'
    ],
    Departments: [
      'DepartmentID', 'DepartmentName', 'IsActive', 'CreatedAt'
    ],
    Designations: [
      'DesignationID', 'DesignationName', 'IsActive', 'CreatedAt'
    ],
    LeaveTypes: [
      'LeaveTypeID', 'LeaveTypeName', 'Description', 'RequiresBalance',
      'RequiresAttachment', 'IsActive', 'CreatedAt', 'UpdatedAt'
    ],
    LeavePolicies: [
      'PolicyID', 'LeaveTypeID', 'AnnualAllocation', 'AccrualRule',
      'CarryForwardRule', 'ExpiryRule', 'NoticePeriod', 'MaximumDuration',
      'WeekendsPolicy', 'HolidaysPolicy', 'NegativeBalanceAllowed',
      'EffectiveFrom', 'EffectiveTo'
    ],
    LeaveBalances: [
      'BalanceID', 'EmployeeID', 'LeaveTypeID', 'LeaveYear', 'OpeningBalance',
      'Allocated', 'Accrued', 'Used', 'Adjustments', 'AvailableBalance', 'UpdatedAt'
    ],
    LeaveRequests: [
      'RequestID', 'EmployeeID', 'LeaveTypeID', 'StartDate', 'EndDate',
      'DayPart', 'RequestedDays', 'Reason', 'AttachmentReference', 'Status',
      'CurrentApproverID', 'SubmittedAt', 'UpdatedAt', 'FinalDecisionAt'
    ],
    ApprovalHistory: [
      'ApprovalID', 'RequestID', 'ApproverID', 'ApproverRole', 'Decision',
      'Comment', 'StepNumber', 'ActionAt'
    ],
    BalanceLedger: [
      'LedgerID', 'EmployeeID', 'LeaveTypeID', 'RequestID', 'TransactionType',
      'Amount', 'Reason', 'CreatedBy', 'CreatedAt', 'IdempotencyKey'
    ],
    Holidays: [
      'HolidayID', 'HolidayDate', 'HolidayName', 'ApplicableDepartment', 'IsActive'
    ],
    Notifications: [
      'NotificationID', 'RecipientEmployeeID', 'NotificationType', 'Title',
      'Message', 'RelatedRequestID', 'CreatedAt', 'ReadAt'
    ],
    AuditLogs: [
      'AuditID', 'ActorID', 'Action', 'EntityType', 'EntityID',
      'Timestamp', 'Result', 'SanitizedDetails'
    ],
    HospitalSettings: [
      'SettingKey', 'SettingValue', 'UpdatedBy', 'UpdatedAt'
    ],
    Sessions: [
      'SessionToken', 'EmployeeID', 'Role', 'ExpiresAt', 'CreatedAt'
    ]
  }
};

/**
 * Get active or configured Google Spreadsheet instance
 */
function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var configuredId = props.getProperty('SPREADSHEET_ID');

  if (configuredId && configuredId.trim().length > 0) {
    try {
      return SpreadsheetApp.openById(configuredId.trim());
    } catch (e) {
      throw new Error('Configured SPREADSHEET_ID is invalid or inaccessible: ' + e.message);
    }
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Standalone script without active spreadsheet
  }

  throw new Error('No Google Spreadsheet linked. Set "SPREADSHEET_ID" in Script Properties or link the script to a Google Sheet.');
}

/**
 * Get a specific sheet by name, throws error if missing
 */
function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Required sheet "' + sheetName + '" does not exist. Please run Setup/initDatabase.');
  }
  return sheet;
}

/**
 * Reads all rows from a sheet as an array of plain JavaScript objects
 */
function readAllRows(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2 || lastCol < 1) {
    return [];
  }

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowData = values[i];
    var isBlank = true;
    for (var k = 0; k < rowData.length; k++) {
      if (rowData[k] !== '' && rowData[k] !== null && rowData[k] !== undefined) {
        isBlank = false;
        break;
      }
    }
    if (isBlank) continue;

    var obj = { _rowIndex: i + 1 };
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var cellVal = rowData[j];
      // Normalize Date objects to ISO strings if needed
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }
      obj[header] = cellVal;
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * Appends a record to the specified sheet following the schema
 */
function appendRow(sheetName, recordObj) {
  var sheet = getSheet(sheetName);
  var schema = CONFIG.SCHEMAS[sheetName];
  if (!schema) {
    throw new Error('No schema registered for sheet: ' + sheetName);
  }

  var row = schema.map(function(field) {
    var val = recordObj[field];
    if (val === undefined || val === null) {
      return '';
    }
    return val;
  });

  sheet.appendRow(row);
  return recordObj;
}

/**
 * Finds row index (1-based sheet row index) by identifier column
 */
function findRowIndexById(sheetName, idColumnName, idValue) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) return -1;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  var colIdx = headers.indexOf(idColumnName);
  if (colIdx === -1) {
    throw new Error('Column "' + idColumnName + '" not found in sheet: ' + sheetName);
  }

  var idValues = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0]).trim() === String(idValue).trim()) {
      return i + 2; // Row numbers are 1-indexed, headers are at row 1
    }
  }

  return -1;
}

/**
 * Updates a row by ID in the sheet
 */
function updateRowById(sheetName, idColumnName, idValue, updatesObj) {
  var sheet = getSheet(sheetName);
  var rowIdx = findRowIndexById(sheetName, idColumnName, idValue);
  if (rowIdx === -1) {
    throw new Error('Record with ' + idColumnName + '="' + idValue + '" not found in ' + sheetName);
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  var existingVals = sheet.getRange(rowIdx, 1, 1, lastCol).getValues()[0];

  for (var col = 0; col < headers.length; col++) {
    var header = headers[col];
    if (updatesObj.hasOwnProperty(header)) {
      existingVals[col] = updatesObj[header];
    }
  }

  sheet.getRange(rowIdx, 1, 1, lastCol).setValues([existingVals]);
  return updatesObj;
}

/**
 * Deletes a row by ID
 */
function deleteRowById(sheetName, idColumnName, idValue) {
  var sheet = getSheet(sheetName);
  var rowIdx = findRowIndexById(sheetName, idColumnName, idValue);
  if (rowIdx === -1) {
    return false;
  }
  sheet.deleteRow(rowIdx);
  return true;
}

/**
 * Generate a UUID
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Generate a clean timestamp string
 */
function getIsoTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

/**
 * Sanitize strings for CSV export to prevent formula injection attacks
 * Targets characters: = + - @ \t \r
 */
function sanitizeForCsv(val) {
  if (val === null || val === undefined) return '';
  var str = String(val);
  var firstChar = str.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    return "'" + str;
  }
  return str;
}

/**
 * Standard API response envelope
 */
function createSuccessResponse(data, message) {
  return {
    success: true,
    data: data || {},
    message: message || 'Operation completed successfully',
    errorCode: null,
    requestId: generateUUID()
  };
}

function createErrorResponse(errorCode, message) {
  return {
    success: false,
    data: null,
    message: message || 'An error occurred',
    errorCode: errorCode || 'INTERNAL_ERROR',
    requestId: generateUUID()
  };
}
