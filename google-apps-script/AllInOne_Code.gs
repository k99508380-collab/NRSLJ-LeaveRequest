/**
 * ==============================================================================
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Leave Management System - Complete All-In-One Apps Script Backend
 * ==============================================================================
 * 
 * QUICK SETUP INSTRUCTIONS:
 * 1. Delete everything in your Apps Script Code.gs file.
 * 2. Paste this ENTIRE file into Code.gs.
 * 3. Press Ctrl + S (or click the 💾 Save icon).
 * 4. In the function dropdown at the top, select 'initDatabase'.
 * 5. Click 'Run' to initialize all 14 sheets in your Google Spreadsheet!
 * 6. (Optional) In the dropdown, select 'runFirstAdminSetup' and click 'Run'.
 * ==============================================================================
 */


// ==========================================
// SECTION: Config.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Leave Management System - Backend Configuration & Utilities
 */

var CONFIG = {
  HOSPITAL_NAME: 'NRSLJ SPECIALITY HOSPITALS, MUSIRI',
  DEFAULT_LEAVE_YEAR: new Date().getFullYear(),
  DEFAULT_LOGO_URL: '', // Can be customized in HospitalSettings
  SPREADSHEET_ID: '1b1gSN-D-P-zbcqt1WQ7Cx4fmpr1LCSkyY7pUJ3cmJF8',
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
  var configuredId = props.getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;

  if (configuredId && configuredId.trim().length > 0) {
    try {
      return SpreadsheetApp.openById(configuredId.trim());
    } catch (e) {
      Logger.log('Could not open spreadsheet by ID: ' + e.message);
    }
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Standalone script without active spreadsheet
  }

  throw new Error('No Google Spreadsheet linked. Ensure spreadsheet ID "1b1gSN-D-P-zbcqt1WQ7Cx4fmpr1LCSkyY7pUJ3cmJF8" is accessible.');
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


// ==========================================
// SECTION: Audit.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Audit Logging Module
 */

function logAuditEvent(actorId, action, entityType, entityId, result, detailsObj) {
  try {
    var sanitizedDetails = '';
    if (detailsObj) {
      // Strip any sensitive keys like passwords, tokens, hashes
      var safeDetails = JSON.parse(JSON.stringify(detailsObj));
      var sensitiveFields = ['password', 'passwordHash', 'passwordSalt', 'token', 'sessionToken'];
      for (var i = 0; i < sensitiveFields.length; i++) {
        var key = sensitiveFields[i];
        if (safeDetails.hasOwnProperty(key)) {
          safeDetails[key] = '[REDACTED]';
        }
      }
      sanitizedDetails = JSON.stringify(safeDetails);
    }

    var record = {
      AuditID: 'AUD_' + Utilities.getUuid().substring(0, 12),
      ActorID: actorId || 'SYSTEM',
      Action: action,
      EntityType: entityType,
      EntityID: entityId || '',
      Timestamp: getIsoTimestamp(),
      Result: result || 'SUCCESS',
      SanitizedDetails: sanitizedDetails
    };

    appendRow(CONFIG.SHEET_NAMES.AUDIT_LOGS, record);
    return record;
  } catch (e) {
    Logger.log('Failed to write audit log: ' + e.message);
    return null;
  }
}

function getAuditLogs(sessionEmployee, limit) {
  // Only admins can view audit logs
  if (!sessionEmployee || sessionEmployee.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Only Admin/HR can inspect audit logs.');
  }

  var logs = readAllRows(CONFIG.SHEET_NAMES.AUDIT_LOGS);
  // Sort reverse chronological
  logs.sort(function(a, b) {
    return (b.Timestamp || '').localeCompare(a.Timestamp || '');
  });

  var maxLogs = limit || 200;
  return logs.slice(0, maxLogs);
}


// ==========================================
// SECTION: Auth.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Authentication & Session Management Module
 */

var AUTH = {
  ROUNDS: 1000,
  SESSION_DURATION_HOURS: 24,

  /**
   * Generates a cryptographically strong unique salt
   */
  generateSalt: function() {
    var raw = Utilities.getUuid() + ':' + new Date().getTime() + ':' + Math.random();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
    return Utilities.base64EncodeWebSafe(digest);
  },

  /**
   * Iterative HMAC-SHA256 salted password hashing
   */
  hashPassword: function(password, salt) {
    if (!password || !salt) {
      throw new Error('Password and salt are required for hashing');
    }
    var current = password + ':' + salt;
    for (var i = 0; i < this.ROUNDS; i++) {
      var sig = Utilities.computeHmacSha256Signature(current, salt);
      current = Utilities.base64EncodeWebSafe(sig);
    }
    return current;
  },

  /**
   * Constant-time comparison to prevent timing attacks
   */
  constantTimeCompare: function(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    var lengthA = a.length;
    var lengthB = b.length;
    var diff = lengthA ^ lengthB;
    var minLen = Math.min(lengthA, lengthB);
    for (var i = 0; i < minLen; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  },

  /**
   * Creates a new authenticated session
   */
  createSession: function(employeeId, role) {
    var token = 'NRSLJ_' + Utilities.getUuid().replace(/-/g, '') + '_' + 
                Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Math.random() + ':' + new Date().getTime())).substring(0, 16);

    var now = new Date();
    var expiresAt = new Date(now.getTime() + (this.SESSION_DURATION_HOURS * 60 * 60 * 1000));
    var expiresIso = Utilities.formatDate(expiresAt, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    var createdIso = Utilities.formatDate(now, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    var sessionRecord = {
      SessionToken: token,
      EmployeeID: employeeId,
      Role: role,
      ExpiresAt: expiresIso,
      CreatedAt: createdIso
    };

    // Store in sheet
    appendRow(CONFIG.SHEET_NAMES.SESSIONS, sessionRecord);

    // Cache session token for fast retrieval (max Apps Script cache is 6 hours = 21600s)
    try {
      var cache = CacheService.getScriptCache();
      cache.put('sess_' + token, JSON.stringify(sessionRecord), 21600);
    } catch (e) {
      // Cache failure is non-fatal
    }

    return {
      sessionToken: token,
      expiresAt: expiresIso
    };
  },

  /**
   * Validates an incoming session token and retrieves the authenticated employee record
   */
  validateSession: function(token, requiredRole) {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('UNAUTHORIZED: Missing session token');
    }
    token = token.trim();

    var sessionData = null;
    var cache = CacheService.getScriptCache();
    var cached = cache.get('sess_' + token);

    if (cached) {
      try {
        sessionData = JSON.parse(cached);
      } catch (e) {
        sessionData = null;
      }
    }

    if (!sessionData) {
      var sessions = readAllRows(CONFIG.SHEET_NAMES.SESSIONS);
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].SessionToken === token) {
          sessionData = sessions[i];
          break;
        }
      }
    }

    if (!sessionData) {
      throw new Error('UNAUTHORIZED: Invalid or expired session');
    }

    // Verify expiration
    var nowIso = getIsoTimestamp();
    if (sessionData.ExpiresAt && sessionData.ExpiresAt < nowIso) {
      // Clean up expired session
      this.destroySession(token);
      throw new Error('UNAUTHORIZED: Session expired. Please log in again.');
    }

    // Retrieve Employee record
    var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
    var employee = null;
    for (var j = 0; j < employees.length; j++) {
      if (employees[j].EmployeeID === sessionData.EmployeeID) {
        employee = employees[j];
        break;
      }
    }

    if (!employee) {
      throw new Error('UNAUTHORIZED: Associated employee account not found');
    }

    if (employee.AccountStatus !== CONFIG.ACCOUNT_STATUS.ACTIVE) {
      throw new Error('FORBIDDEN: Account is not active (' + employee.AccountStatus + ')');
    }

    // Verify Role Hierarchy / Permissions
    if (requiredRole) {
      if (requiredRole === CONFIG.ROLES.ADMIN && employee.Role !== CONFIG.ROLES.ADMIN) {
        throw new Error('FORBIDDEN: Administrative privileges required');
      }
      if (requiredRole === CONFIG.ROLES.MANAGER && employee.Role !== CONFIG.ROLES.MANAGER && employee.Role !== CONFIG.ROLES.ADMIN) {
        throw new Error('FORBIDDEN: Manager or Admin privileges required');
      }
    }

    // Return sanitized employee profile (never expose hashes/salts)
    var sanitized = JSON.parse(JSON.stringify(employee));
    delete sanitized.PasswordHash;
    delete sanitized.PasswordSalt;
    delete sanitized._rowIndex;

    return sanitized;
  },

  /**
   * Destroys/logs out a session
   */
  destroySession: function(token) {
    if (!token) return;
    try {
      CacheService.getScriptCache().remove('sess_' + token);
    } catch (e) {}

    try {
      deleteRowById(CONFIG.SHEET_NAMES.SESSIONS, 'SessionToken', token);
    } catch (e) {}
  },

  /**
   * User login verification with rate-limiting check
   */
  login: function(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Username and password are required');
    }
    identifier = String(identifier).trim().toLowerCase();

    // Rate-limiting check via Cache
    var cache = CacheService.getScriptCache();
    var attemptKey = 'login_fail_' + identifier;
    var failCount = parseInt(cache.get(attemptKey) || '0', 10);
    if (failCount >= CONFIG.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Too many failed login attempts. Please wait 15 minutes before trying again.');
    }

    var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
    var matched = null;

    for (var i = 0; i < employees.length; i++) {
      var emp = employees[i];
      var empUsername = String(emp.Username || '').trim().toLowerCase();
      var empPhone = String(emp.Phone || '').trim();

      if (empUsername === identifier || empPhone === identifier) {
        matched = emp;
        break;
      }
    }

    // Generic error to prevent username enumeration
    if (!matched) {
      cache.put(attemptKey, String(failCount + 1), 900); // 15 mins
      logAuditEvent('ANONYMOUS', 'LOGIN_FAILED', 'User', identifier, 'FAILED', { reason: 'User not found' });
      throw new Error('Invalid username or password');
    }

    // Check account status
    if (matched.RegistrationStatus === CONFIG.REGISTRATION_STATUS.PENDING) {
      throw new Error('Your registration is pending approval by Admin/HR. You will be notified once activated.');
    }
    if (matched.AccountStatus === CONFIG.ACCOUNT_STATUS.INACTIVE || matched.RegistrationStatus === CONFIG.REGISTRATION_STATUS.REJECTED) {
      throw new Error('Your account has been deactivated or rejected. Please contact Hospital Administration.');
    }
    if (matched.AccountStatus !== CONFIG.ACCOUNT_STATUS.ACTIVE) {
      throw new Error('Account is not currently active.');
    }

    // Verify password
    var computedHash = this.hashPassword(password, matched.PasswordSalt);
    var isValid = this.constantTimeCompare(computedHash, matched.PasswordHash);

    if (!isValid) {
      cache.put(attemptKey, String(failCount + 1), 900);
      logAuditEvent(matched.EmployeeID, 'LOGIN_FAILED', 'User', matched.EmployeeID, 'FAILED', { reason: 'Password mismatch' });
      throw new Error('Invalid username or password');
    }

    // Reset failed attempts
    cache.remove(attemptKey);

    // Update LastLoginAt
    var nowIso = getIsoTimestamp();
    updateRowById(CONFIG.SHEET_NAMES.EMPLOYEES, 'EmployeeID', matched.EmployeeID, {
      LastLoginAt: nowIso
    });

    // Create session
    var session = this.createSession(matched.EmployeeID, matched.Role);

    logAuditEvent(matched.EmployeeID, 'LOGIN_SUCCESS', 'User', matched.EmployeeID, 'SUCCESS', { role: matched.Role });

    var userProfile = JSON.parse(JSON.stringify(matched));
    delete userProfile.PasswordHash;
    delete userProfile.PasswordSalt;
    delete userProfile._rowIndex;

    return {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: userProfile
    };
  }
};


// ==========================================
// SECTION: DepartmentsDesignations.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Departments & Designations Management Module
 */

function getDepartments(onlyActive) {
  var rows = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  if (onlyActive) {
    return rows.filter(function(r) { return r.IsActive === true || r.IsActive === 'TRUE' || r.IsActive === 'true'; });
  }
  return rows;
}

function addDepartment(sessionUser, name) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!name || String(name).trim().length === 0) {
    throw new Error('Department name is required');
  }
  name = String(name).trim();

  // Check duplicate
  var existing = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i].DepartmentName).toLowerCase() === name.toLowerCase()) {
      throw new Error('A department with this name already exists');
    }
  }

  var deptId = 'DEP_' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var record = {
    DepartmentID: deptId,
    DepartmentName: name,
    IsActive: true,
    CreatedAt: getIsoTimestamp()
  };

  appendRow(CONFIG.SHEET_NAMES.DEPARTMENTS, record);
  logAuditEvent(sessionUser.EmployeeID, 'CREATE_DEPARTMENT', 'Department', deptId, 'SUCCESS', { name: name });
  return record;
}

function updateDepartment(sessionUser, deptId, name, isActive) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!deptId) throw new Error('Department ID is required');

  var updates = {};
  if (name && String(name).trim().length > 0) {
    updates.DepartmentName = String(name).trim();
  }
  if (isActive !== undefined) {
    updates.IsActive = Boolean(isActive);
  }

  updateRowById(CONFIG.SHEET_NAMES.DEPARTMENTS, 'DepartmentID', deptId, updates);
  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_DEPARTMENT', 'Department', deptId, 'SUCCESS', updates);
  return updates;
}

function getDesignations(onlyActive) {
  var rows = readAllRows(CONFIG.SHEET_NAMES.DESIGNATIONS);
  if (onlyActive) {
    return rows.filter(function(r) { return r.IsActive === true || r.IsActive === 'TRUE' || r.IsActive === 'true'; });
  }
  return rows;
}

function addDesignation(sessionUser, name) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!name || String(name).trim().length === 0) {
    throw new Error('Designation name is required');
  }
  name = String(name).trim();

  var existing = readAllRows(CONFIG.SHEET_NAMES.DESIGNATIONS);
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i].DesignationName).toLowerCase() === name.toLowerCase()) {
      throw new Error('A designation with this name already exists');
    }
  }

  var desigId = 'DES_' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var record = {
    DesignationID: desigId,
    DesignationName: name,
    IsActive: true,
    CreatedAt: getIsoTimestamp()
  };

  appendRow(CONFIG.SHEET_NAMES.DESIGNATIONS, record);
  logAuditEvent(sessionUser.EmployeeID, 'CREATE_DESIGNATION', 'Designation', desigId, 'SUCCESS', { name: name });
  return record;
}

function updateDesignation(sessionUser, desigId, name, isActive) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!desigId) throw new Error('Designation ID is required');

  var updates = {};
  if (name && String(name).trim().length > 0) {
    updates.DesignationName = String(name).trim();
  }
  if (isActive !== undefined) {
    updates.IsActive = Boolean(isActive);
  }

  updateRowById(CONFIG.SHEET_NAMES.DESIGNATIONS, 'DesignationID', desigId, updates);
  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_DESIGNATION', 'Designation', desigId, 'SUCCESS', updates);
  return updates;
}


// ==========================================
// SECTION: Holidays.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Holidays and Working Days Calculation Module
 */

function getHolidays(departmentId) {
  var rows = readAllRows(CONFIG.SHEET_NAMES.HOLIDAYS);
  var active = rows.filter(function(h) {
    return h.IsActive === true || h.IsActive === 'TRUE' || h.IsActive === 'true';
  });

  if (!departmentId) return active;

  return active.filter(function(h) {
    var dept = String(h.ApplicableDepartment || '').trim();
    return dept === '' || dept === 'ALL' || dept === departmentId;
  });
}

function addHoliday(sessionUser, dateStr, name, applicableDept) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!dateStr || !name) {
    throw new Error('Holiday date and name are required');
  }

  var id = 'HOL_' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var record = {
    HolidayID: id,
    HolidayDate: String(dateStr).trim(),
    HolidayName: String(name).trim(),
    ApplicableDepartment: applicableDept || 'ALL',
    IsActive: true
  };

  appendRow(CONFIG.SHEET_NAMES.HOLIDAYS, record);
  logAuditEvent(sessionUser.EmployeeID, 'CREATE_HOLIDAY', 'Holiday', id, 'SUCCESS', record);
  return record;
}

function updateHoliday(sessionUser, holidayId, dateStr, name, applicableDept, isActive) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  var updates = {};
  if (dateStr) updates.HolidayDate = String(dateStr).trim();
  if (name) updates.HolidayName = String(name).trim();
  if (applicableDept !== undefined) updates.ApplicableDepartment = applicableDept;
  if (isActive !== undefined) updates.IsActive = Boolean(isActive);

  updateRowById(CONFIG.SHEET_NAMES.HOLIDAYS, 'HolidayID', holidayId, updates);
  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_HOLIDAY', 'Holiday', holidayId, 'SUCCESS', updates);
  return updates;
}

function deleteHoliday(sessionUser, holidayId) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  var success = deleteRowById(CONFIG.SHEET_NAMES.HOLIDAYS, 'HolidayID', holidayId);
  logAuditEvent(sessionUser.EmployeeID, 'DELETE_HOLIDAY', 'Holiday', holidayId, 'SUCCESS', {});
  return success;
}

/**
 * Calculates net working days for a leave request based on policy
 */
function calculateLeaveDays(startDateStr, endDateStr, dayPart, departmentId, weekendsPolicy, holidaysPolicy) {
  if (!startDateStr || !endDateStr) return 0;
  var start = new Date(startDateStr + 'T00:00:00');
  var end = new Date(endDateStr + 'T00:00:00');

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  if (start > end) {
    throw new Error('Start date cannot be after end date');
  }

  if (dayPart === CONFIG.DAY_PART.FIRST_HALF || dayPart === CONFIG.DAY_PART.SECOND_HALF) {
    if (startDateStr !== endDateStr) {
      throw new Error('Half-day leave can only be applied for a single calendar day');
    }
    return 0.5;
  }

  var holidaysList = [];
  if (holidaysPolicy !== 'INCLUDE_ALL') {
    var rawHolidays = getHolidays(departmentId);
    for (var i = 0; i < rawHolidays.length; i++) {
      holidaysList.push(String(rawHolidays[i].HolidayDate).substring(0, 10));
    }
  }

  var count = 0;
  var cur = new Date(start.getTime());

  while (cur <= end) {
    var dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
    var curIso = Utilities.formatDate(cur, 'Asia/Kolkata', 'yyyy-MM-dd');

    var isWeekend = false;
    if (weekendsPolicy === 'EXCLUDE_SUNDAYS' && dayOfWeek === 0) {
      isWeekend = true;
    } else if (weekendsPolicy === 'EXCLUDE_WEEKENDS' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      isWeekend = true;
    }

    var isHoliday = false;
    if (holidaysPolicy !== 'INCLUDE_ALL' && holidaysList.indexOf(curIso) !== -1) {
      isHoliday = true;
    }

    if (!isWeekend && !isHoliday) {
      count++;
    }

    // Advance 1 day
    cur.setDate(cur.getDate() + 1);
  }

  return count;
}


// ==========================================
// SECTION: LeaveBalances.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Leave Types, Policies, Balances & Transaction Ledger Module
 */

function getLeaveTypes(onlyActive) {
  var rows = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  if (onlyActive) {
    return rows.filter(function(t) { return t.IsActive === true || t.IsActive === 'TRUE' || t.IsActive === 'true'; });
  }
  return rows;
}

function addLeaveType(sessionUser, data) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!data || !data.LeaveTypeName) {
    throw new Error('Leave type name is required');
  }

  var id = 'LT_' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var record = {
    LeaveTypeID: id,
    LeaveTypeName: String(data.LeaveTypeName).trim(),
    Description: String(data.Description || '').trim(),
    RequiresBalance: data.RequiresBalance !== false && data.RequiresBalance !== 'false',
    RequiresAttachment: Boolean(data.RequiresAttachment),
    IsActive: true,
    CreatedAt: getIsoTimestamp(),
    UpdatedAt: getIsoTimestamp()
  };

  appendRow(CONFIG.SHEET_NAMES.LEAVE_TYPES, record);

  // Initialize a default policy entry for this leave type
  var policyRecord = {
    PolicyID: 'POL_' + Utilities.getUuid().substring(0, 8).toUpperCase(),
    LeaveTypeID: id,
    AnnualAllocation: Number(data.AnnualAllocation) || 0,
    AccrualRule: data.AccrualRule || 'ANNUAL_UPFRONT', // or 'MONTHLY_ACCRUAL'
    CarryForwardRule: data.CarryForwardRule || 'NO_CARRY_FORWARD',
    ExpiryRule: data.ExpiryRule || 'END_OF_YEAR',
    NoticePeriod: Number(data.NoticePeriod) || 0,
    MaximumDuration: Number(data.MaximumDuration) || 30,
    WeekendsPolicy: data.WeekendsPolicy || 'EXCLUDE_SUNDAYS',
    HolidaysPolicy: data.HolidaysPolicy || 'EXCLUDE_HOLIDAYS',
    NegativeBalanceAllowed: Boolean(data.NegativeBalanceAllowed),
    EffectiveFrom: getIsoTimestamp(),
    EffectiveTo: ''
  };
  appendRow(CONFIG.SHEET_NAMES.LEAVE_POLICIES, policyRecord);

  logAuditEvent(sessionUser.EmployeeID, 'CREATE_LEAVE_TYPE', 'LeaveType', id, 'SUCCESS', record);
  return { type: record, policy: policyRecord };
}

function updateLeaveType(sessionUser, leaveTypeId, data) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!leaveTypeId) throw new Error('Leave Type ID is required');

  var updates = { UpdatedAt: getIsoTimestamp() };
  if (data.LeaveTypeName !== undefined) updates.LeaveTypeName = String(data.LeaveTypeName).trim();
  if (data.Description !== undefined) updates.Description = String(data.Description).trim();
  if (data.RequiresBalance !== undefined) updates.RequiresBalance = Boolean(data.RequiresBalance);
  if (data.RequiresAttachment !== undefined) updates.RequiresAttachment = Boolean(data.RequiresAttachment);
  if (data.IsActive !== undefined) updates.IsActive = Boolean(data.IsActive);

  updateRowById(CONFIG.SHEET_NAMES.LEAVE_TYPES, 'LeaveTypeID', leaveTypeId, updates);
  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_LEAVE_TYPE', 'LeaveType', leaveTypeId, 'SUCCESS', updates);
  return updates;
}

function getLeavePolicies() {
  return readAllRows(CONFIG.SHEET_NAMES.LEAVE_POLICIES);
}

function getPolicyForLeaveType(leaveTypeId) {
  var policies = getLeavePolicies();
  for (var i = 0; i < policies.length; i++) {
    if (policies[i].LeaveTypeID === leaveTypeId) {
      return policies[i];
    }
  }
  return null;
}

function updateLeavePolicy(sessionUser, policyId, data) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!policyId) throw new Error('Policy ID is required');

  var updates = {};
  if (data.AnnualAllocation !== undefined) updates.AnnualAllocation = Number(data.AnnualAllocation);
  if (data.AccrualRule !== undefined) updates.AccrualRule = String(data.AccrualRule);
  if (data.CarryForwardRule !== undefined) updates.CarryForwardRule = String(data.CarryForwardRule);
  if (data.ExpiryRule !== undefined) updates.ExpiryRule = String(data.ExpiryRule);
  if (data.NoticePeriod !== undefined) updates.NoticePeriod = Number(data.NoticePeriod);
  if (data.MaximumDuration !== undefined) updates.MaximumDuration = Number(data.MaximumDuration);
  if (data.WeekendsPolicy !== undefined) updates.WeekendsPolicy = String(data.WeekendsPolicy);
  if (data.HolidaysPolicy !== undefined) updates.HolidaysPolicy = String(data.HolidaysPolicy);
  if (data.NegativeBalanceAllowed !== undefined) updates.NegativeBalanceAllowed = Boolean(data.NegativeBalanceAllowed);

  updateRowById(CONFIG.SHEET_NAMES.LEAVE_POLICIES, 'PolicyID', policyId, updates);
  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_LEAVE_POLICY', 'LeavePolicy', policyId, 'SUCCESS', updates);
  return updates;
}

/**
 * Ensures a LeaveBalances record exists for the employee and leave type in the given year
 */
function getOrCreateLeaveBalanceRecord(employeeId, leaveTypeId, leaveYear) {
  var currentYear = leaveYear || new Date().getFullYear();
  var balances = readAllRows(CONFIG.SHEET_NAMES.LEAVE_BALANCES);

  for (var i = 0; i < balances.length; i++) {
    var b = balances[i];
    if (b.EmployeeID === employeeId && b.LeaveTypeID === leaveTypeId && Number(b.LeaveYear) === Number(currentYear)) {
      return b;
    }
  }

  // Not found: initialize from Policy
  var policy = getPolicyForLeaveType(leaveTypeId);
  var annualAlloc = policy ? Number(policy.AnnualAllocation) || 0 : 0;
  var balanceId = 'BAL_' + Utilities.getUuid().substring(0, 8).toUpperCase();

  var newRecord = {
    BalanceID: balanceId,
    EmployeeID: employeeId,
    LeaveTypeID: leaveTypeId,
    LeaveYear: currentYear,
    OpeningBalance: annualAlloc,
    Allocated: annualAlloc,
    Accrued: 0,
    Used: 0,
    Adjustments: 0,
    AvailableBalance: annualAlloc,
    UpdatedAt: getIsoTimestamp()
  };

  appendRow(CONFIG.SHEET_NAMES.LEAVE_BALANCES, newRecord);

  // Record initial allocation in ledger
  if (annualAlloc > 0) {
    var ledgerRecord = {
      LedgerID: 'LED_' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      EmployeeID: employeeId,
      LeaveTypeID: leaveTypeId,
      RequestID: 'INITIAL_SETUP',
      TransactionType: CONFIG.LEDGER_TYPE.ALLOCATION,
      Amount: annualAlloc,
      Reason: 'Initial annual allocation for ' + currentYear,
      CreatedBy: 'SYSTEM',
      CreatedAt: getIsoTimestamp(),
      IdempotencyKey: 'INIT_' + employeeId + '_' + leaveTypeId + '_' + currentYear
    };
    appendRow(CONFIG.SHEET_NAMES.BALANCE_LEDGER, ledgerRecord);
  }

  return newRecord;
}

/**
 * Returns complete leave balances for an employee, including calculated pending days
 */
function getEmployeeBalances(employeeId, leaveYear) {
  var currentYear = leaveYear || new Date().getFullYear();
  var activeTypes = getLeaveTypes(true);
  var policies = getLeavePolicies();
  var policyMap = {};
  for (var p = 0; p < policies.length; p++) {
    policyMap[policies[p].LeaveTypeID] = policies[p];
  }

  // Fetch pending requests for this employee to compute pending days
  var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var pendingDaysByType = {};
  for (var r = 0; r < allRequests.length; r++) {
    var req = allRequests[r];
    if (req.EmployeeID === employeeId && 
       (req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER || req.Status === CONFIG.REQUEST_STATUS.PENDING_HR)) {
      var tid = req.LeaveTypeID;
      var days = Number(req.RequestedDays) || 0;
      pendingDaysByType[tid] = (pendingDaysByType[tid] || 0) + days;
    }
  }

  var result = [];
  for (var i = 0; i < activeTypes.length; i++) {
    var lt = activeTypes[i];
    var balRecord = getOrCreateLeaveBalanceRecord(employeeId, lt.LeaveTypeID, currentYear);
    var policy = policyMap[lt.LeaveTypeID] || {};

    var opening = Number(balRecord.OpeningBalance) || 0;
    var allocated = Number(balRecord.Allocated) || 0;
    var accrued = Number(balRecord.Accrued) || 0;
    var used = Number(balRecord.Used) || 0;
    var adjustments = Number(balRecord.Adjustments) || 0;
    var available = Number(balRecord.AvailableBalance) || 0;
    var pending = pendingDaysByType[lt.LeaveTypeID] || 0;

    result.push({
      BalanceID: balRecord.BalanceID,
      EmployeeID: employeeId,
      LeaveTypeID: lt.LeaveTypeID,
      LeaveTypeName: lt.LeaveTypeName,
      Description: lt.Description,
      RequiresBalance: lt.RequiresBalance,
      RequiresAttachment: lt.RequiresAttachment,
      LeaveYear: currentYear,
      OpeningBalance: opening,
      Allocated: allocated,
      Accrued: accrued,
      Used: used,
      Adjustments: adjustments,
      PendingDays: pending,
      AvailableBalance: available,
      NegativeBalanceAllowed: Boolean(policy.NegativeBalanceAllowed),
      MaximumDuration: Number(policy.MaximumDuration) || 30,
      NoticePeriod: Number(policy.NoticePeriod) || 0,
      WeekendsPolicy: policy.WeekendsPolicy || 'EXCLUDE_SUNDAYS',
      HolidaysPolicy: policy.HolidaysPolicy || 'EXCLUDE_HOLIDAYS'
    });
  }

  return result;
}

/**
 * Atomic balance transaction with LockService and idempotency check
 */
function applyBalanceTransaction(employeeId, leaveTypeId, requestId, transactionType, amount, reason, createdBy, idempotencyKey) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  try {
    if (!lock.hasLock()) {
      var ok = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS || 10000);
      if (!ok) {
        throw new Error('Server busy: Could not obtain lock for balance update. Please try again.');
      }
      lockAcquired = true;
    }

    // 1. Check idempotency
    if (idempotencyKey) {
      var ledgerRows = readAllRows(CONFIG.SHEET_NAMES.BALANCE_LEDGER);
      for (var i = 0; i < ledgerRows.length; i++) {
        if (ledgerRows[i].IdempotencyKey === idempotencyKey) {
          Logger.log('Idempotent transaction ignored: ' + idempotencyKey);
          return { idempotent: true, ledgerId: ledgerRows[i].LedgerID };
        }
      }
    }

    var currentYear = new Date().getFullYear();
    var currentBalance = getOrCreateLeaveBalanceRecord(employeeId, leaveTypeId, currentYear);

    var opening = Number(currentBalance.OpeningBalance) || 0;
    var allocated = Number(currentBalance.Allocated) || 0;
    var accrued = Number(currentBalance.Accrued) || 0;
    var used = Number(currentBalance.Used) || 0;
    var adjustments = Number(currentBalance.Adjustments) || 0;
    var available = Number(currentBalance.AvailableBalance) || 0;

    var amt = Number(amount) || 0;

    if (transactionType === CONFIG.LEDGER_TYPE.USAGE) {
      used += amt;
      available -= amt;
    } else if (transactionType === CONFIG.LEDGER_TYPE.CANCELLATION_REVERSAL || 
               transactionType === CONFIG.LEDGER_TYPE.WITHDRAWAL_REVERSAL) {
      used -= amt;
      available += amt;
    } else if (transactionType === CONFIG.LEDGER_TYPE.MANUAL_ADJUSTMENT) {
      adjustments += amt;
      available += amt;
    } else if (transactionType === CONFIG.LEDGER_TYPE.ALLOCATION) {
      allocated += amt;
      available += amt;
    } else {
      throw new Error('Unknown transaction type: ' + transactionType);
    }

    // Update LeaveBalances sheet
    updateRowById(CONFIG.SHEET_NAMES.LEAVE_BALANCES, 'BalanceID', currentBalance.BalanceID, {
      Allocated: allocated,
      Used: used,
      Adjustments: adjustments,
      AvailableBalance: available,
      UpdatedAt: getIsoTimestamp()
    });

    // Append to BalanceLedger
    var ledgerId = 'LED_' + Utilities.getUuid().substring(0, 8).toUpperCase();
    var ledgerRecord = {
      LedgerID: ledgerId,
      EmployeeID: employeeId,
      LeaveTypeID: leaveTypeId,
      RequestID: requestId || '',
      TransactionType: transactionType,
      Amount: amt,
      Reason: reason || '',
      CreatedBy: createdBy || 'SYSTEM',
      CreatedAt: getIsoTimestamp(),
      IdempotencyKey: idempotencyKey || ('AUTO_' + ledgerId)
    };
    appendRow(CONFIG.SHEET_NAMES.BALANCE_LEDGER, ledgerRecord);

    return {
      success: true,
      ledgerId: ledgerId,
      availableBalance: available,
      used: used
    };

  } finally {
    if (lockAcquired) {
      try {
        if (lock.hasLock()) {
          lock.releaseLock();
        }
      } catch (lockErr) {
        Logger.log('Warning releasing lock in applyBalanceTransaction: ' + lockErr);
      }
    }
  }
}

/**
 * Manual balance adjustment by Admin/HR
 */
function manualAdjustBalance(sessionUser, employeeId, leaveTypeId, amount, reason) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!employeeId || !leaveTypeId || amount === undefined || !reason) {
    throw new Error('Employee ID, Leave Type ID, amount, and reason are required');
  }

  var amt = Number(amount);
  if (isNaN(amt) || amt === 0) {
    throw new Error('Adjustment amount must be a non-zero number');
  }

  var idempotencyKey = 'MANUAL_' + employeeId + '_' + leaveTypeId + '_' + new Date().getTime();
  var result = applyBalanceTransaction(
    employeeId,
    leaveTypeId,
    'MANUAL_ADJUSTMENT',
    CONFIG.LEDGER_TYPE.MANUAL_ADJUSTMENT,
    amt,
    String(reason).trim(),
    sessionUser.EmployeeID,
    idempotencyKey
  );

  logAuditEvent(sessionUser.EmployeeID, 'MANUAL_BALANCE_ADJUST', 'LeaveBalance', employeeId, 'SUCCESS', {
    leaveTypeId: leaveTypeId,
    amount: amt,
    reason: reason
  });

  return result;
}

/**
 * Returns ledger transactions for an employee or all (if admin)
 */
function getBalanceLedger(sessionUser, targetEmployeeId) {
  if (!sessionUser) throw new Error('Unauthorized');

  // Non-admins can only view their own ledger
  var empIdToFetch = targetEmployeeId;
  if (sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    empIdToFetch = sessionUser.EmployeeID;
  }

  var rows = readAllRows(CONFIG.SHEET_NAMES.BALANCE_LEDGER);
  if (empIdToFetch) {
    rows = rows.filter(function(r) { return r.EmployeeID === empIdToFetch; });
  }

  // Sort newest first
  rows.sort(function(a, b) {
    return (b.CreatedAt || '').localeCompare(a.CreatedAt || '');
  });

  return rows;
}


// ==========================================
// SECTION: LeaveRequests.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Leave Requests Submission, Validation, Cancellation & Withdrawal Module
 */

function submitLeaveRequest(sessionUser, requestData) {
  if (!sessionUser) throw new Error('Unauthorized');

  // Strict security: Always bind to authenticated user session, never allow submitting on behalf of another user
  var employeeId = sessionUser.EmployeeID;

  var leaveTypeId = String(requestData.LeaveTypeID || '').trim();
  var startDate = String(requestData.StartDate || '').trim();
  var endDate = String(requestData.EndDate || '').trim();
  var dayPart = requestData.DayPart || CONFIG.DAY_PART.FULL;
  var reason = String(requestData.Reason || '').trim();
  var attachmentRef = String(requestData.AttachmentReference || '').trim();

  // 1. Basic validation
  if (!leaveTypeId) throw new Error('Please select a leave type');
  if (!startDate || !endDate) throw new Error('Start date and end date are required');
  if (reason.length < 5) throw new Error('Please enter a detailed reason (at least 5 characters)');

  var startObj = new Date(startDate + 'T00:00:00');
  var endObj = new Date(endDate + 'T00:00:00');
  if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
    throw new Error('Invalid date format');
  }
  if (startObj > endObj) {
    throw new Error('Start date cannot be after end date');
  }

  // 2. Policy-driven validation
  var policy = getPolicyForLeaveType(leaveTypeId);
  if (!policy) {
    throw new Error('Leave policy not found for this leave type');
  }

  // Past dates check against hospital settings
  var settings = getAllSettings();
  var allowPastDays = Number(settings.ALLOW_PAST_LEAVE_DAYS) || 0;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var diffDays = Math.round((today.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > allowPastDays) {
    throw new Error('Backdated leave submission beyond ' + allowPastDays + ' day(s) is not permitted by hospital policy');
  }

  // Calculate requested days
  var calculatedDays = calculateLeaveDays(
    startDate,
    endDate,
    dayPart,
    sessionUser.DepartmentID,
    policy.WeekendsPolicy,
    policy.HolidaysPolicy
  );

  if (calculatedDays <= 0) {
    throw new Error('The selected date range contains no working days (all days are weekends or holidays)');
  }

  // Check maximum duration
  var maxDur = Number(policy.MaximumDuration) || 30;
  if (calculatedDays > maxDur) {
    throw new Error('Requested duration (' + calculatedDays + ' days) exceeds maximum allowed duration (' + maxDur + ' days)');
  }

  // 3. Overlap check with existing active leaves (PENDING_*, APPROVED)
  var existingRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  for (var i = 0; i < existingRequests.length; i++) {
    var req = existingRequests[i];
    if (req.EmployeeID === employeeId &&
       (req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER ||
        req.Status === CONFIG.REQUEST_STATUS.PENDING_HR ||
        req.Status === CONFIG.REQUEST_STATUS.APPROVED)) {
      
      var exStart = new Date(req.StartDate + 'T00:00:00');
      var exEnd = new Date(req.EndDate + 'T00:00:00');

      // Check date range intersection
      if (startObj <= exEnd && endObj >= exStart) {
        throw new Error('Overlapping leave request detected: You already have a ' + req.Status + ' leave request from ' + req.StartDate + ' to ' + req.EndDate);
      }
    }
  }

  // 4. Balance check
  var leaveTypeRows = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  var ltRecord = null;
  for (var j = 0; j < leaveTypeRows.length; j++) {
    if (leaveTypeRows[j].LeaveTypeID === leaveTypeId) {
      ltRecord = leaveTypeRows[j];
      break;
    }
  }

  var requiresBal = ltRecord ? (ltRecord.RequiresBalance !== false && ltRecord.RequiresBalance !== 'false') : true;
  if (requiresBal) {
    var balances = getEmployeeBalances(employeeId, new Date().getFullYear());
    var userBal = null;
    for (var b = 0; b < balances.length; b++) {
      if (balances[b].LeaveTypeID === leaveTypeId) {
        userBal = balances[b];
        break;
      }
    }

    var available = userBal ? userBal.AvailableBalance : 0;
    var pending = userBal ? userBal.PendingDays : 0;
    var netAvailable = available - pending;

    var negAllowed = policy.NegativeBalanceAllowed === true || policy.NegativeBalanceAllowed === 'true' || policy.NegativeBalanceAllowed === 'TRUE';
    if (!negAllowed && (netAvailable < calculatedDays)) {
      throw new Error('Insufficient leave balance. Available: ' + available + ' days, Pending: ' + pending + ' days. Net available: ' + netAvailable + ' days. Requested: ' + calculatedDays + ' days.');
    }
  }

  // 5. Determine initial status and routing
  var workflow = settings.APPROVAL_WORKFLOW || CONFIG.APPROVAL_WORKFLOW.MANAGER_THEN_HR;
  var initialStatus = CONFIG.REQUEST_STATUS.PENDING_MANAGER;
  var targetApprover = sessionUser.ReportingManagerID || '';

  if (workflow === CONFIG.APPROVAL_WORKFLOW.HR_ONLY || !targetApprover) {
    // If HR only or manager is missing, route to HR directly
    initialStatus = CONFIG.REQUEST_STATUS.PENDING_HR;
    targetApprover = 'ADMIN_HR_QUEUE';
  }

  var requestId = 'REQ_' + Utilities.getUuid().substring(0, 10).toUpperCase();
  var nowIso = getIsoTimestamp();

  var record = {
    RequestID: requestId,
    EmployeeID: employeeId,
    LeaveTypeID: leaveTypeId,
    StartDate: startDate,
    EndDate: endDate,
    DayPart: dayPart,
    RequestedDays: calculatedDays,
    Reason: reason,
    AttachmentReference: attachmentRef,
    Status: initialStatus,
    CurrentApproverID: targetApprover,
    SubmittedAt: nowIso,
    UpdatedAt: nowIso,
    FinalDecisionAt: ''
  };

  appendRow(CONFIG.SHEET_NAMES.LEAVE_REQUESTS, record);

  // 6. Notifications
  sendNotification(
    employeeId,
    'LEAVE_SUBMITTED',
    'Leave Request Submitted',
    'Your ' + (ltRecord ? ltRecord.LeaveTypeName : 'Leave') + ' request for ' + calculatedDays + ' day(s) from ' + startDate + ' to ' + endDate + ' has been submitted and is pending review.',
    requestId
  );

  // Alert Manager or HR
  if (targetApprover && targetApprover !== 'ADMIN_HR_QUEUE') {
    sendNotification(
      targetApprover,
      'LEAVE_APPROVAL_REQUIRED',
      'Action Required: Leave Approval',
      sessionUser.FullName + ' has submitted a leave request for ' + calculatedDays + ' day(s) from ' + startDate + ' to ' + endDate + '.',
      requestId
    );
  }

  logAuditEvent(employeeId, 'SUBMIT_LEAVE', 'LeaveRequest', requestId, 'SUCCESS', {
    leaveTypeId: leaveTypeId,
    days: calculatedDays,
    startDate: startDate,
    endDate: endDate
  });

  return {
    success: true,
    requestId: requestId,
    days: calculatedDays,
    status: initialStatus
  };
}

function getEmployeeLeaveRequests(sessionUser, targetEmployeeId) {
  if (!sessionUser) throw new Error('Unauthorized');

  // Regular employees can only see their own requests
  var empId = sessionUser.EmployeeID;
  if (sessionUser.Role === CONFIG.ROLES.ADMIN && targetEmployeeId) {
    empId = targetEmployeeId;
  }

  var all = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var userRequests = all.filter(function(r) { return r.EmployeeID === empId; });

  // Enrich with LeaveTypeName
  var types = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  var typeMap = {};
  for (var t = 0; t < types.length; t++) {
    typeMap[types[t].LeaveTypeID] = types[t].LeaveTypeName;
  }

  var enriched = userRequests.map(function(r) {
    var copy = JSON.parse(JSON.stringify(r));
    copy.LeaveTypeName = typeMap[r.LeaveTypeID] || r.LeaveTypeID;
    return copy;
  });

  // Sort newest first
  enriched.sort(function(a, b) {
    return (b.SubmittedAt || '').localeCompare(a.SubmittedAt || '');
  });

  return enriched;
}

function cancelPendingLeaveRequest(sessionUser, requestId) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!requestId) throw new Error('Request ID is required');

  var requests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var req = null;
  for (var i = 0; i < requests.length; i++) {
    if (requests[i].RequestID === requestId) {
      req = requests[i];
      break;
    }
  }

  if (!req) throw new Error('Leave request not found');

  if (req.EmployeeID !== sessionUser.EmployeeID && sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized to cancel this leave request');
  }

  if (req.Status !== CONFIG.REQUEST_STATUS.PENDING_MANAGER && req.Status !== CONFIG.REQUEST_STATUS.PENDING_HR) {
    throw new Error('Only pending leave requests can be cancelled. Current status: ' + req.Status);
  }

  var nowIso = getIsoTimestamp();
  updateRowById(CONFIG.SHEET_NAMES.LEAVE_REQUESTS, 'RequestID', requestId, {
    Status: CONFIG.REQUEST_STATUS.CANCELLED,
    UpdatedAt: nowIso,
    FinalDecisionAt: nowIso
  });

  // Notification
  sendNotification(
    req.EmployeeID,
    'LEAVE_CANCELLED',
    'Leave Request Cancelled',
    'Your pending leave request (' + requestId + ') has been cancelled.',
    requestId
  );

  logAuditEvent(sessionUser.EmployeeID, 'CANCEL_LEAVE', 'LeaveRequest', requestId, 'SUCCESS', {});

  return { success: true, status: CONFIG.REQUEST_STATUS.CANCELLED };
}

function withdrawApprovedLeaveRequest(sessionUser, requestId, reason) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!requestId) throw new Error('Request ID is required');

  var requests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var req = null;
  for (var i = 0; i < requests.length; i++) {
    if (requests[i].RequestID === requestId) {
      req = requests[i];
      break;
    }
  }

  if (!req) throw new Error('Leave request not found');

  if (req.EmployeeID !== sessionUser.EmployeeID && sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized to withdraw this leave request');
  }

  if (req.Status !== CONFIG.REQUEST_STATUS.APPROVED) {
    throw new Error('Only approved leave requests can be withdrawn. Current status: ' + req.Status);
  }

  // Reverse balance deduction atomically via BalanceLedger
  var nowIso = getIsoTimestamp();
  var idempotencyKey = 'WITHDRAW_REV_' + requestId;

  var reversal = applyBalanceTransaction(
    req.EmployeeID,
    req.LeaveTypeID,
    requestId,
    CONFIG.LEDGER_TYPE.WITHDRAWAL_REVERSAL,
    Number(req.RequestedDays),
    'Withdrawal reversal: ' + (reason || 'Employee withdrew approved leave'),
    sessionUser.EmployeeID,
    idempotencyKey
  );

  updateRowById(CONFIG.SHEET_NAMES.LEAVE_REQUESTS, 'RequestID', requestId, {
    Status: CONFIG.REQUEST_STATUS.WITHDRAWN,
    UpdatedAt: nowIso,
    FinalDecisionAt: nowIso
  });

  // Notification
  sendNotification(
    req.EmployeeID,
    'LEAVE_WITHDRAWN',
    'Approved Leave Withdrawn',
    'Your approved leave request (' + requestId + ') has been withdrawn and ' + req.RequestedDays + ' day(s) have been credited back to your balance.',
    requestId
  );

  logAuditEvent(sessionUser.EmployeeID, 'WITHDRAW_LEAVE', 'LeaveRequest', requestId, 'SUCCESS', {
    reversedDays: req.RequestedDays,
    reason: reason
  });

  return { success: true, status: CONFIG.REQUEST_STATUS.WITHDRAWN };
}


// ==========================================
// SECTION: Approvals.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Multi-Step Leave Approval Workflow Module
 */

function getPendingApprovals(sessionUser) {
  if (!sessionUser) throw new Error('Unauthorized');

  var isManager = sessionUser.Role === CONFIG.ROLES.MANAGER;
  var isAdmin = sessionUser.Role === CONFIG.ROLES.ADMIN;

  if (!isManager && !isAdmin) {
    throw new Error('Unauthorized: Manager or Admin access required');
  }

  var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var empMap = {};
  for (var e = 0; e < employees.length; e++) {
    empMap[employees[e].EmployeeID] = employees[e];
  }

  var departments = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  var deptMap = {};
  for (var d = 0; d < departments.length; d++) {
    deptMap[departments[d].DepartmentID] = departments[d].DepartmentName;
  }

  var designations = readAllRows(CONFIG.SHEET_NAMES.DESIGNATIONS);
  var desigMap = {};
  for (var dg = 0; dg < designations.length; dg++) {
    desigMap[designations[dg].DesignationID] = designations[dg].DesignationName;
  }

  var types = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  var typeMap = {};
  for (var t = 0; t < types.length; t++) {
    typeMap[types[t].LeaveTypeID] = types[t].LeaveTypeName;
  }

  var filtered = allRequests.filter(function(req) {
    var emp = empMap[req.EmployeeID] || {};

    if (isAdmin) {
      // Admins see all PENDING_HR and any unassigned/exception PENDING_MANAGER
      return req.Status === CONFIG.REQUEST_STATUS.PENDING_HR ||
             req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER;
    }

    if (isManager) {
      // Managers see PENDING_MANAGER requests assigned to them or where they are reporting manager
      var isAssigned = req.CurrentApproverID === sessionUser.EmployeeID || emp.ReportingManagerID === sessionUser.EmployeeID;
      return req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER && isAssigned;
    }

    return false;
  });

  // Enrich data for display in approval cards/modals
  var enriched = filtered.map(function(req) {
    var emp = empMap[req.EmployeeID] || {};
    return {
      RequestID: req.RequestID,
      EmployeeID: req.EmployeeID,
      FullName: emp.FullName || 'Unknown',
      DepartmentName: deptMap[emp.DepartmentID] || 'General',
      DesignationName: desigMap[emp.DesignationID] || 'Staff',
      LeaveTypeID: req.LeaveTypeID,
      LeaveTypeName: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
      StartDate: req.StartDate,
      EndDate: req.EndDate,
      DayPart: req.DayPart,
      RequestedDays: req.RequestedDays,
      Reason: req.Reason,
      AttachmentReference: req.AttachmentReference,
      Status: req.Status,
      CurrentApproverID: req.CurrentApproverID,
      SubmittedAt: req.SubmittedAt
    };
  });

  // Sort oldest first (FIFO queue for approvals)
  enriched.sort(function(a, b) {
    return (a.SubmittedAt || '').localeCompare(b.SubmittedAt || '');
  });

  return enriched;
}

function getApprovalHistory(sessionUser, requestId) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!requestId) throw new Error('Request ID is required');

  var rows = readAllRows(CONFIG.SHEET_NAMES.APPROVAL_HISTORY);
  var history = rows.filter(function(h) { return h.RequestID === requestId; });

  // Enrich approver names
  var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var empMap = {};
  for (var e = 0; e < employees.length; e++) {
    empMap[employees[e].EmployeeID] = employees[e].FullName;
  }

  var enriched = history.map(function(h) {
    var copy = JSON.parse(JSON.stringify(h));
    copy.ApproverName = empMap[h.ApproverID] || h.ApproverID;
    return copy;
  });

  enriched.sort(function(a, b) {
    return Number(a.StepNumber) - Number(b.StepNumber);
  });

  return enriched;
}

function processApprovalDecision(sessionUser, requestId, decision, comment) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!requestId) throw new Error('Request ID is required');

  decision = String(decision || '').toUpperCase();
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    throw new Error('Invalid decision. Must be APPROVE or REJECT');
  }

  comment = String(comment || '').trim();
  if (decision === 'REJECT' && comment.length < 3) {
    throw new Error('A reason is mandatory when rejecting a leave request (at least 3 characters)');
  }

  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  try {
    if (!lock.hasLock()) {
      var ok = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS || 10000);
      if (!ok) {
        throw new Error('Server busy: could not acquire lock for approval transaction. Please retry.');
      }
      lockAcquired = true;
    }

    // 1. Fetch current request state fresh from sheet to prevent race conditions
    var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
    var req = null;
    for (var i = 0; i < allRequests.length; i++) {
      if (allRequests[i].RequestID === requestId) {
        req = allRequests[i];
        break;
      }
    }

    if (!req) throw new Error('Leave request not found');

    // 2. Validate current state
    if (req.Status === CONFIG.REQUEST_STATUS.APPROVED ||
        req.Status === CONFIG.REQUEST_STATUS.REJECTED ||
        req.Status === CONFIG.REQUEST_STATUS.CANCELLED ||
        req.Status === CONFIG.REQUEST_STATUS.WITHDRAWN) {
      throw new Error('Decision already processed: Request is in status ' + req.Status);
    }

    // 3. Permission checks
    var isAdmin = sessionUser.Role === CONFIG.ROLES.ADMIN;
    var isAssignedManager = sessionUser.Role === CONFIG.ROLES.MANAGER &&
                           (req.CurrentApproverID === sessionUser.EmployeeID || req.CurrentApproverID === '');

    if (req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER) {
      if (!isAssignedManager && !isAdmin) {
        throw new Error('Unauthorized: You are not the assigned manager for this request');
      }
    } else if (req.Status === CONFIG.REQUEST_STATUS.PENDING_HR) {
      if (!isAdmin) {
        throw new Error('Unauthorized: Final approval requires Admin/HR privileges');
      }
    } else {
      throw new Error('Request is not in a pending approval state (' + req.Status + ')');
    }

    // 4. Determine next state based on workflow settings
    var settings = getAllSettings();
    var workflow = settings.APPROVAL_WORKFLOW || CONFIG.APPROVAL_WORKFLOW.MANAGER_THEN_HR;
    var nextStatus = '';
    var nextApprover = '';
    var isFinalApproval = false;
    var nowIso = getIsoTimestamp();

    if (decision === 'REJECT') {
      nextStatus = CONFIG.REQUEST_STATUS.REJECTED;
      isFinalApproval = true;
    } else {
      // Decision is APPROVE
      if (req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER) {
        if (workflow === CONFIG.APPROVAL_WORKFLOW.MANAGER_ONLY) {
          nextStatus = CONFIG.REQUEST_STATUS.APPROVED;
          isFinalApproval = true;
        } else {
          // Routes to HR
          nextStatus = CONFIG.REQUEST_STATUS.PENDING_HR;
          nextApprover = 'ADMIN_HR_QUEUE';
        }
      } else if (req.Status === CONFIG.REQUEST_STATUS.PENDING_HR) {
        nextStatus = CONFIG.REQUEST_STATUS.APPROVED;
        isFinalApproval = true;
      }
    }

    // 5. Append step to ApprovalHistory
    var existingHistory = readAllRows(CONFIG.SHEET_NAMES.APPROVAL_HISTORY)
      .filter(function(h) { return h.RequestID === requestId; });
    var stepNum = existingHistory.length + 1;

    var approvalRecord = {
      ApprovalID: 'APP_' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      RequestID: requestId,
      ApproverID: sessionUser.EmployeeID,
      ApproverRole: sessionUser.Role,
      Decision: decision,
      Comment: comment,
      StepNumber: stepNum,
      ActionAt: nowIso
    };
    appendRow(CONFIG.SHEET_NAMES.APPROVAL_HISTORY, approvalRecord);

    // 6. If final approval, deduct balance atomically with idempotency key
    if (nextStatus === CONFIG.REQUEST_STATUS.APPROVED) {
      var idempotencyKey = 'APPROVE_USAGE_' + requestId;
      applyBalanceTransaction(
        req.EmployeeID,
        req.LeaveTypeID,
        requestId,
        CONFIG.LEDGER_TYPE.USAGE,
        Number(req.RequestedDays),
        'Leave approved by ' + sessionUser.Role + ' (' + sessionUser.FullName + ')',
        sessionUser.EmployeeID,
        idempotencyKey
      );
    }

    // 7. Update LeaveRequests sheet
    var reqUpdates = {
      Status: nextStatus,
      CurrentApproverID: nextApprover,
      UpdatedAt: nowIso
    };
    if (isFinalApproval) {
      reqUpdates.FinalDecisionAt = nowIso;
    }
    updateRowById(CONFIG.SHEET_NAMES.LEAVE_REQUESTS, 'RequestID', requestId, reqUpdates);

    // 8. Dispatch notification to employee
    var notifTitle = '';
    var notifMsg = '';
    if (nextStatus === CONFIG.REQUEST_STATUS.APPROVED) {
      notifTitle = 'Leave Request Approved';
      notifMsg = 'Your leave request (' + requestId + ') for ' + req.RequestedDays + ' day(s) has been APPROVED.';
    } else if (nextStatus === CONFIG.REQUEST_STATUS.REJECTED) {
      notifTitle = 'Leave Request Rejected';
      notifMsg = 'Your leave request (' + requestId + ') was rejected by ' + sessionUser.Role + '. Reason: ' + comment;
    } else if (nextStatus === CONFIG.REQUEST_STATUS.PENDING_HR) {
      notifTitle = 'Leave Request Manager Approved';
      notifMsg = 'Your leave request (' + requestId + ') has been approved by your manager and routed to HR for final sign-off.';
    }

    sendNotification(req.EmployeeID, 'LEAVE_DECISION', notifTitle, notifMsg, requestId);

    logAuditEvent(sessionUser.EmployeeID, 'APPROVAL_DECISION', 'LeaveRequest', requestId, 'SUCCESS', {
      decision: decision,
      nextStatus: nextStatus,
      comment: comment
    });

    return {
      success: true,
      requestId: requestId,
      previousStatus: req.Status,
      newStatus: nextStatus,
      message: 'Decision processed successfully'
    };

  } finally {
    if (lockAcquired) {
      try {
        if (lock.hasLock()) {
          lock.releaseLock();
        }
      } catch (lockErr) {
        Logger.log('Warning releasing lock in processApprovalDecision: ' + lockErr);
      }
    }
  }
}


// ==========================================
// SECTION: Employees.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Registration & Management Module
 */

function registerEmployee(data) {
  if (!data) throw new Error('Registration payload is required');

  var fullName = String(data.FullName || '').trim();
  var employeeId = String(data.EmployeeID || '').trim().toUpperCase();
  var username = String(data.Username || '').trim().toLowerCase();
  var phone = String(data.Phone || '').trim();
  var password = String(data.Password || '');

  // 1. Validation
  if (fullName.length < 2) {
    throw new Error('Full Name must be at least 2 characters');
  }
  if (!/^[A-Z0-9_-]{2,20}$/i.test(employeeId)) {
    throw new Error('Employee ID must be 2-20 alphanumeric characters (hyphens and underscores allowed)');
  }
  if (!/^[a-z0-9_.]{3,20}$/i.test(username)) {
    throw new Error('Username must be 3-20 characters with letters, numbers, dots, or underscores only');
  }
  var cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.length < 10) {
    throw new Error('Please enter a valid phone number (at least 10 digits)');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // 2. Uniqueness check
  var existingEmployees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  for (var i = 0; i < existingEmployees.length; i++) {
    var emp = existingEmployees[i];
    if (String(emp.EmployeeID).toUpperCase() === employeeId) {
      throw new Error('An account with this Employee ID already exists');
    }
    if (String(emp.Username).toLowerCase() === username) {
      throw new Error('Username is already taken. Please choose another.');
    }
    if (String(emp.Phone).trim() === cleanPhone) {
      throw new Error('Phone number is already registered to an account');
    }
  }

  // 3. Security: Password Hashing (Salt + PBKDF2/HMAC)
  var salt = AUTH.generateSalt();
  var hash = AUTH.hashPassword(password, salt);
  var nowIso = getIsoTimestamp();

  // 4. Create record with PENDING status (NEVER accept role from user input)
  var newEmployee = {
    EmployeeID: employeeId,
    FullName: fullName,
    Username: username,
    Phone: cleanPhone,
    PasswordHash: hash,
    PasswordSalt: salt,
    Role: CONFIG.ROLES.EMPLOYEE, // default strictly employee
    DepartmentID: '',
    DesignationID: '',
    ReportingManagerID: '',
    AccountStatus: CONFIG.ACCOUNT_STATUS.PENDING,
    RegistrationStatus: CONFIG.REGISTRATION_STATUS.PENDING,
    CreatedAt: nowIso,
    UpdatedAt: nowIso,
    LastLoginAt: ''
  };

  appendRow(CONFIG.SHEET_NAMES.EMPLOYEES, newEmployee);

  // 5. Send initial notification to employee & alert admins
  sendNotification(
    employeeId,
    'REGISTRATION_PENDING',
    'Registration Submitted',
    'Your registration for NRSLJ Speciality Hospitals has been submitted. Admin/HR will review and activate your account shortly.',
    ''
  );

  logAuditEvent(employeeId, 'REGISTER_SUBMITTED', 'Employee', employeeId, 'SUCCESS', {
    fullName: fullName,
    username: username
  });

  return {
    employeeId: employeeId,
    fullName: fullName,
    status: 'PENDING',
    message: 'Registration submitted successfully. Please await approval from Hospital Administration.'
  };
}

function getPendingRegistrations(sessionUser) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }

  var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var pending = employees.filter(function(e) {
    return e.RegistrationStatus === CONFIG.REGISTRATION_STATUS.PENDING;
  });

  // Strip sensitive fields
  return pending.map(function(e) {
    var safe = JSON.parse(JSON.stringify(e));
    delete safe.PasswordHash;
    delete safe.PasswordSalt;
    delete safe._rowIndex;
    return safe;
  });
}

function approveRegistration(sessionUser, employeeId, departmentId, designationId, reportingManagerId, role, adminNote) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!employeeId) throw new Error('Employee ID is required');
  if (!departmentId) throw new Error('Department assignment is required to activate an account');
  if (!designationId) throw new Error('Designation assignment is required to activate an account');

  var validRoles = [CONFIG.ROLES.EMPLOYEE, CONFIG.ROLES.MANAGER, CONFIG.ROLES.ADMIN];
  var assignedRole = role && validRoles.indexOf(role) !== -1 ? role : CONFIG.ROLES.EMPLOYEE;

  var updates = {
    DepartmentID: departmentId,
    DesignationID: designationId,
    ReportingManagerID: reportingManagerId || '',
    Role: assignedRole,
    RegistrationStatus: CONFIG.REGISTRATION_STATUS.APPROVED,
    AccountStatus: CONFIG.ACCOUNT_STATUS.ACTIVE,
    UpdatedAt: getIsoTimestamp()
  };

  updateRowById(CONFIG.SHEET_NAMES.EMPLOYEES, 'EmployeeID', employeeId, updates);

  // Initialize leave balances for the newly approved employee
  getEmployeeBalances(employeeId, new Date().getFullYear());

  // Notify the employee
  sendNotification(
    employeeId,
    'REGISTRATION_APPROVED',
    'Account Approved & Activated',
    'Your account at NRSLJ Speciality Hospitals has been activated with role ' + assignedRole + '. You can now log in and submit leave requests.',
    ''
  );

  logAuditEvent(sessionUser.EmployeeID, 'APPROVE_REGISTRATION', 'Employee', employeeId, 'SUCCESS', {
    assignedRole: assignedRole,
    departmentId: departmentId,
    designationId: designationId,
    reportingManagerId: reportingManagerId,
    adminNote: adminNote
  });

  return { success: true, employeeId: employeeId, status: 'ACTIVE' };
}

function rejectRegistration(sessionUser, employeeId, adminNote) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!employeeId) throw new Error('Employee ID is required');

  var updates = {
    RegistrationStatus: CONFIG.REGISTRATION_STATUS.REJECTED,
    AccountStatus: CONFIG.ACCOUNT_STATUS.REJECTED,
    UpdatedAt: getIsoTimestamp()
  };

  updateRowById(CONFIG.SHEET_NAMES.EMPLOYEES, 'EmployeeID', employeeId, updates);

  sendNotification(
    employeeId,
    'REGISTRATION_REJECTED',
    'Registration Not Approved',
    'Your registration was not approved. Reason/Note: ' + (adminNote || 'Please contact Hospital Administration.'),
    ''
  );

  logAuditEvent(sessionUser.EmployeeID, 'REJECT_REGISTRATION', 'Employee', employeeId, 'SUCCESS', {
    adminNote: adminNote
  });

  return { success: true, employeeId: employeeId, status: 'REJECTED' };
}

function getAllEmployees(sessionUser, filters) {
  if (!sessionUser) throw new Error('Unauthorized');

  var all = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);

  // If regular employee, only allow viewing self
  if (sessionUser.Role === CONFIG.ROLES.EMPLOYEE) {
    all = all.filter(function(e) { return e.EmployeeID === sessionUser.EmployeeID; });
  } else if (sessionUser.Role === CONFIG.ROLES.MANAGER) {
    // Managers can view themselves and their direct reports
    all = all.filter(function(e) {
      return e.EmployeeID === sessionUser.EmployeeID || e.ReportingManagerID === sessionUser.EmployeeID;
    });
  }

  // Filter if criteria passed
  if (filters) {
    if (filters.status) {
      all = all.filter(function(e) { return e.AccountStatus === filters.status; });
    }
    if (filters.departmentId) {
      all = all.filter(function(e) { return e.DepartmentID === filters.departmentId; });
    }
    if (filters.role) {
      all = all.filter(function(e) { return e.Role === filters.role; });
    }
    if (filters.search) {
      var s = String(filters.search).toLowerCase();
      all = all.filter(function(e) {
        return (e.FullName || '').toLowerCase().indexOf(s) !== -1 ||
               (e.EmployeeID || '').toLowerCase().indexOf(s) !== -1 ||
               (e.Username || '').toLowerCase().indexOf(s) !== -1 ||
               (e.Phone || '').indexOf(s) !== -1;
      });
    }
  }

  // Sanitize
  return all.map(function(e) {
    var safe = JSON.parse(JSON.stringify(e));
    delete safe.PasswordHash;
    delete safe.PasswordSalt;
    delete safe._rowIndex;
    return safe;
  });
}

function updateEmployee(sessionUser, employeeId, updates) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!employeeId) throw new Error('Employee ID is required');

  var isSelf = sessionUser.EmployeeID === employeeId;
  var isAdmin = sessionUser.Role === CONFIG.ROLES.ADMIN;

  if (!isSelf && !isAdmin) {
    throw new Error('Unauthorized to update this profile');
  }

  var safeUpdates = { UpdatedAt: getIsoTimestamp() };

  // Permitted updates for self
  if (updates.Phone) {
    var cleanPhone = String(updates.Phone).replace(/[^0-9+]/g, '');
    if (cleanPhone.length >= 10) {
      safeUpdates.Phone = cleanPhone;
    }
  }

  // Admin-only updates
  if (isAdmin) {
    if (updates.FullName) safeUpdates.FullName = String(updates.FullName).trim();
    if (updates.DepartmentID !== undefined) safeUpdates.DepartmentID = updates.DepartmentID;
    if (updates.DesignationID !== undefined) safeUpdates.DesignationID = updates.DesignationID;
    if (updates.ReportingManagerID !== undefined) safeUpdates.ReportingManagerID = updates.ReportingManagerID;
    if (updates.Role && [CONFIG.ROLES.EMPLOYEE, CONFIG.ROLES.MANAGER, CONFIG.ROLES.ADMIN].indexOf(updates.Role) !== -1) {
      safeUpdates.Role = updates.Role;
    }
    if (updates.AccountStatus && [CONFIG.ACCOUNT_STATUS.ACTIVE, CONFIG.ACCOUNT_STATUS.INACTIVE].indexOf(updates.AccountStatus) !== -1) {
      safeUpdates.AccountStatus = updates.AccountStatus;
    }
  }

  updateRowById(CONFIG.SHEET_NAMES.EMPLOYEES, 'EmployeeID', employeeId, safeUpdates);
  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_EMPLOYEE', 'Employee', employeeId, 'SUCCESS', safeUpdates);

  return safeUpdates;
}

function getManagersList() {
  var all = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  return all
    .filter(function(e) {
      return (e.Role === CONFIG.ROLES.MANAGER || e.Role === CONFIG.ROLES.ADMIN) &&
             e.AccountStatus === CONFIG.ACCOUNT_STATUS.ACTIVE;
    })
    .map(function(e) {
      return {
        EmployeeID: e.EmployeeID,
        FullName: e.FullName,
        Role: e.Role,
        DepartmentID: e.DepartmentID
      };
    });
}


// ==========================================
// SECTION: Reports.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Reports, Calendar & Safe CSV Export Module
 */

function getDashboardMetrics(sessionUser) {
  if (!sessionUser) throw new Error('Unauthorized');

  var allEmployees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var departments = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  var leaveTypes = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);

  var deptMap = {};
  for (var d = 0; d < departments.length; d++) {
    deptMap[departments[d].DepartmentID] = departments[d].DepartmentName;
  }
  var typeMap = {};
  for (var t = 0; t < leaveTypes.length; t++) {
    typeMap[leaveTypes[t].LeaveTypeID] = leaveTypes[t].LeaveTypeName;
  }
  var empMap = {};
  for (var e = 0; e < allEmployees.length; e++) {
    empMap[allEmployees[e].EmployeeID] = allEmployees[e];
  }

  var activeEmployees = allEmployees.filter(function(e) {
    return e.AccountStatus === CONFIG.ACCOUNT_STATUS.ACTIVE;
  });

  var pendingRegistrations = allEmployees.filter(function(e) {
    return e.RegistrationStatus === CONFIG.REGISTRATION_STATUS.PENDING;
  });

  var pendingApprovals = allRequests.filter(function(r) {
    if (sessionUser.Role === CONFIG.ROLES.ADMIN) {
      return r.Status === CONFIG.REQUEST_STATUS.PENDING_HR || r.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER;
    } else if (sessionUser.Role === CONFIG.ROLES.MANAGER) {
      return r.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER &&
             (r.CurrentApproverID === sessionUser.EmployeeID || (empMap[r.EmployeeID] && empMap[r.EmployeeID].ReportingManagerID === sessionUser.EmployeeID));
    }
    return false;
  });

  var todayStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
  var todayObj = new Date(todayStr + 'T00:00:00');

  var onLeaveToday = [];
  var upcomingApproved = [];
  var approvedCount = 0;
  var rejectedCount = 0;
  var deptCounts = {};

  for (var i = 0; i < allRequests.length; i++) {
    var req = allRequests[i];
    if (req.Status === CONFIG.REQUEST_STATUS.APPROVED) {
      approvedCount++;
      var start = new Date(req.StartDate + 'T00:00:00');
      var end = new Date(req.EndDate + 'T00:00:00');

      var emp = empMap[req.EmployeeID] || {};
      var deptName = deptMap[emp.DepartmentID] || 'General';

      if (todayObj >= start && todayObj <= end) {
        onLeaveToday.push({
          RequestId: req.RequestID,
          EmployeeId: req.EmployeeID,
          FullName: emp.FullName || 'Staff',
          DepartmentName: deptName,
          LeaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
          StartDate: req.StartDate,
          EndDate: req.EndDate,
          DayPart: req.DayPart
        });
      } else if (start > todayObj) {
        // Next 14 days
        var diffTime = start.getTime() - todayObj.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 14) {
          upcomingApproved.push({
            RequestId: req.RequestID,
            EmployeeId: req.EmployeeID,
            FullName: emp.FullName || 'Staff',
            DepartmentName: deptName,
            LeaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
            StartDate: req.StartDate,
            EndDate: req.EndDate,
            RequestedDays: req.RequestedDays
          });
        }
      }

      // Department distribution
      deptCounts[deptName] = (deptCounts[deptName] || 0) + Number(req.RequestedDays || 0);
    } else if (req.Status === CONFIG.REQUEST_STATUS.REJECTED) {
      rejectedCount++;
    }
  }

  return {
    totalEmployees: activeEmployees.length,
    pendingRegistrationsCount: pendingRegistrations.length,
    pendingApprovalsCount: pendingApprovals.length,
    approvedLeavesCount: approvedCount,
    rejectedLeavesCount: rejectedCount,
    onLeaveTodayCount: onLeaveToday.length,
    onLeaveToday: onLeaveToday,
    upcomingLeaves: upcomingApproved.slice(0, 10),
    departmentUtilization: deptCounts
  };
}

function getLeaveCalendar(sessionUser, month, year, departmentId) {
  if (!sessionUser) throw new Error('Unauthorized');

  var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var allEmployees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var empMap = {};
  for (var e = 0; e < allEmployees.length; e++) {
    empMap[allEmployees[e].EmployeeID] = allEmployees[e];
  }

  var types = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  var typeMap = {};
  for (var t = 0; t < types.length; t++) {
    typeMap[types[t].LeaveTypeID] = types[t].LeaveTypeName;
  }

  var departments = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  var deptMap = {};
  for (var d = 0; d < departments.length; d++) {
    deptMap[departments[d].DepartmentID] = departments[d].DepartmentName;
  }

  var m = Number(month); // 1 to 12
  var y = Number(year);
  if (!m || !y) {
    var now = new Date();
    m = now.getMonth() + 1;
    y = now.getFullYear();
  }

  var monthStart = new Date(y, m - 1, 1);
  var monthEnd = new Date(y, m, 0, 23, 59, 59);

  var events = [];
  for (var i = 0; i < allRequests.length; i++) {
    var req = allRequests[i];
    if (req.Status !== CONFIG.REQUEST_STATUS.APPROVED) continue;

    var emp = empMap[req.EmployeeID] || {};
    if (departmentId && emp.DepartmentID !== departmentId) continue;

    // Privacy guard: if regular employee, only show their own detailed reason, others show 'On Leave'
    var isSelf = emp.EmployeeID === sessionUser.EmployeeID;
    var canViewDetails = sessionUser.Role === CONFIG.ROLES.ADMIN || 
                         (sessionUser.Role === CONFIG.ROLES.MANAGER && emp.ReportingManagerID === sessionUser.EmployeeID) ||
                         isSelf;

    var start = new Date(req.StartDate + 'T00:00:00');
    var end = new Date(req.EndDate + 'T00:00:00');

    if (end >= monthStart && start <= monthEnd) {
      events.push({
        requestId: req.RequestID,
        employeeId: isSelf || canViewDetails ? emp.EmployeeID : 'Staff',
        employeeName: canViewDetails ? emp.FullName : (emp.FullName ? emp.FullName.split(' ')[0] + ' (Staff)' : 'Staff'),
        departmentName: deptMap[emp.DepartmentID] || 'General',
        leaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
        startDate: req.StartDate,
        endDate: req.EndDate,
        dayPart: req.DayPart,
        days: req.RequestedDays
      });
    }
  }

  return events;
}

/**
 * Generates safe CSV with formula injection prevention
 */
function exportReportCsv(sessionUser, reportType, filters) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required for report exports');
  }

  var csvRows = [];

  if (reportType === 'LEAVE_REQUESTS') {
    csvRows.push(['RequestID', 'EmployeeID', 'EmployeeName', 'Department', 'LeaveType', 'StartDate', 'EndDate', 'DayPart', 'Days', 'Status', 'SubmittedAt', 'FinalDecisionAt']);
    var reqs = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
    var emps = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
    var depts = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
    var types = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);

    var eMap = {}, dMap = {}, tMap = {};
    emps.forEach(function(e) { eMap[e.EmployeeID] = e; });
    depts.forEach(function(d) { dMap[d.DepartmentID] = d.DepartmentName; });
    types.forEach(function(t) { tMap[t.LeaveTypeID] = t.LeaveTypeName; });

    reqs.forEach(function(r) {
      var emp = eMap[r.EmployeeID] || {};
      csvRows.push([
        sanitizeForCsv(r.RequestID),
        sanitizeForCsv(r.EmployeeID),
        sanitizeForCsv(emp.FullName || ''),
        sanitizeForCsv(dMap[emp.DepartmentID] || ''),
        sanitizeForCsv(tMap[r.LeaveTypeID] || r.LeaveTypeID),
        sanitizeForCsv(r.StartDate),
        sanitizeForCsv(r.EndDate),
        sanitizeForCsv(r.DayPart),
        sanitizeForCsv(r.RequestedDays),
        sanitizeForCsv(r.Status),
        sanitizeForCsv(r.SubmittedAt),
        sanitizeForCsv(r.FinalDecisionAt)
      ]);
    });
  } else if (reportType === 'EMPLOYEE_BALANCES') {
    csvRows.push(['EmployeeID', 'EmployeeName', 'Department', 'LeaveType', 'LeaveYear', 'Allocated', 'Used', 'Adjustments', 'AvailableBalance']);
    var balances = readAllRows(CONFIG.SHEET_NAMES.LEAVE_BALANCES);
    var emps = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
    var depts = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
    var types = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);

    var eMap = {}, dMap = {}, tMap = {};
    emps.forEach(function(e) { eMap[e.EmployeeID] = e; });
    depts.forEach(function(d) { dMap[d.DepartmentID] = d.DepartmentName; });
    types.forEach(function(t) { tMap[t.LeaveTypeID] = t.LeaveTypeName; });

    balances.forEach(function(b) {
      var emp = eMap[b.EmployeeID] || {};
      csvRows.push([
        sanitizeForCsv(b.EmployeeID),
        sanitizeForCsv(emp.FullName || ''),
        sanitizeForCsv(dMap[emp.DepartmentID] || ''),
        sanitizeForCsv(tMap[b.LeaveTypeID] || b.LeaveTypeID),
        sanitizeForCsv(b.LeaveYear),
        sanitizeForCsv(b.Allocated),
        sanitizeForCsv(b.Used),
        sanitizeForCsv(b.Adjustments),
        sanitizeForCsv(b.AvailableBalance)
      ]);
    });
  } else if (reportType === 'AUDIT_LOGS') {
    csvRows.push(['AuditID', 'ActorID', 'Action', 'EntityType', 'EntityID', 'Timestamp', 'Result', 'Details']);
    var logs = readAllRows(CONFIG.SHEET_NAMES.AUDIT_LOGS);
    logs.forEach(function(l) {
      csvRows.push([
        sanitizeForCsv(l.AuditID),
        sanitizeForCsv(l.ActorID),
        sanitizeForCsv(l.Action),
        sanitizeForCsv(l.EntityType),
        sanitizeForCsv(l.EntityID),
        sanitizeForCsv(l.Timestamp),
        sanitizeForCsv(l.Result),
        sanitizeForCsv(l.SanitizedDetails)
      ]);
    });
  } else {
    throw new Error('Unsupported report type: ' + reportType);
  }

  // Convert array to CSV text
  var csvText = csvRows.map(function(row) {
    return row.map(function(cell) {
      var c = String(cell).replace(/"/g, '""');
      return '"' + c + '"';
    }).join(',');
  }).join('\r\n');

  logAuditEvent(sessionUser.EmployeeID, 'EXPORT_REPORT', 'Report', reportType, 'SUCCESS', {});

  return {
    filename: 'NRSLJ_' + reportType + '_' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd_HHmmss') + '.csv',
    mimeType: 'text/csv',
    content: csvText
  };
}


// ==========================================
// SECTION: Notifications.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * In-App Notification System
 */

function sendNotification(recipientEmployeeId, notificationType, title, message, relatedRequestId) {
  if (!recipientEmployeeId || !title || !message) return null;

  try {
    var notifId = 'NOTIF_' + Utilities.getUuid().substring(0, 8).toUpperCase();
    var record = {
      NotificationID: notifId,
      RecipientEmployeeID: recipientEmployeeId,
      NotificationType: notificationType || 'INFO',
      Title: String(title).trim(),
      Message: String(message).trim(),
      RelatedRequestID: relatedRequestId || '',
      CreatedAt: getIsoTimestamp(),
      ReadAt: ''
    };

    appendRow(CONFIG.SHEET_NAMES.NOTIFICATIONS, record);
    return record;
  } catch (e) {
    Logger.log('Failed to create notification: ' + e.message);
    return null;
  }
}

function getEmployeeNotifications(sessionUser, onlyUnread) {
  if (!sessionUser) throw new Error('Unauthorized');

  var all = readAllRows(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var userNotifs = all.filter(function(n) {
    return n.RecipientEmployeeID === sessionUser.EmployeeID;
  });

  if (onlyUnread) {
    userNotifs = userNotifs.filter(function(n) {
      return !n.ReadAt || n.ReadAt === '';
    });
  }

  // Sort newest first
  userNotifs.sort(function(a, b) {
    return (b.CreatedAt || '').localeCompare(a.CreatedAt || '');
  });

  return userNotifs.slice(0, 50); // limit to 50 latest
}

function markNotificationAsRead(sessionUser, notificationId) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!notificationId) throw new Error('Notification ID is required');

  var notifSheet = getSheet(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var rowIdx = findRowIndexById(CONFIG.SHEET_NAMES.NOTIFICATIONS, 'NotificationID', notificationId);
  if (rowIdx === -1) {
    throw new Error('Notification not found');
  }

  // Verify recipient
  var rows = readAllRows(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var notif = rows.filter(function(n) { return n.NotificationID === notificationId; })[0];
  if (notif && notif.RecipientEmployeeID !== sessionUser.EmployeeID) {
    throw new Error('Unauthorized: cannot mark another user\'s notification');
  }

  var updates = { ReadAt: getIsoTimestamp() };
  updateRowById(CONFIG.SHEET_NAMES.NOTIFICATIONS, 'NotificationID', notificationId, updates);
  return { success: true };
}

function markAllNotificationsAsRead(sessionUser) {
  if (!sessionUser) throw new Error('Unauthorized');

  var notifSheet = getSheet(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var lastRow = notifSheet.getLastRow();
  var lastCol = notifSheet.getLastColumn();
  if (lastRow < 2) return { count: 0 };

  var values = notifSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var recCol = headers.indexOf('RecipientEmployeeID');
  var readCol = headers.indexOf('ReadAt');

  if (recCol === -1 || readCol === -1) return { count: 0 };

  var nowIso = getIsoTimestamp();
  var count = 0;
  for (var i = 1; i < values.length; i++) {
    if (values[i][recCol] === sessionUser.EmployeeID && (!values[i][readCol] || values[i][readCol] === '')) {
      values[i][readCol] = nowIso;
      count++;
    }
  }

  if (count > 0) {
    notifSheet.getRange(1, 1, lastRow, lastCol).setValues(values);
  }

  return { count: count };
}


// ==========================================
// SECTION: HospitalSettings.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Hospital Branding & Application Settings Module
 */

function getAllSettings() {
  var rows = readAllRows(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS);
  var map = {
    HOSPITAL_NAME: CONFIG.HOSPITAL_NAME,
    LOGO_URL: '',
    APPROVAL_WORKFLOW: CONFIG.APPROVAL_WORKFLOW.MANAGER_THEN_HR,
    LEAVE_YEAR_START: '01-01',
    LEAVE_YEAR_END: '12-31',
    ALLOW_PAST_LEAVE_DAYS: 3,
    HOSPITAL_PHONE: '+91 4326 260000',
    HOSPITAL_EMAIL: 'hr@nrsljhospitals.com',
    HOSPITAL_ADDRESS: 'Musiri, Tiruchirappalli, Tamil Nadu'
  };

  for (var i = 0; i < rows.length; i++) {
    var key = rows[i].SettingKey;
    var val = rows[i].SettingValue;
    if (key) {
      map[key] = val;
    }
  }

  return map;
}

function getSetting(key) {
  var settings = getAllSettings();
  return settings[key] !== undefined ? settings[key] : null;
}

function updateSettings(sessionUser, settingsObj) {
  if (!sessionUser || sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Admin access required to change hospital settings');
  }
  if (!settingsObj || typeof settingsObj !== 'object') {
    throw new Error('Invalid settings object');
  }

  var sheet = getSheet(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS);
  var nowIso = getIsoTimestamp();

  var keys = Object.keys(settingsObj);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    var val = String(settingsObj[key]);

    var rowIdx = findRowIndexById(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS, 'SettingKey', key);
    if (rowIdx !== -1) {
      updateRowById(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS, 'SettingKey', key, {
        SettingValue: val,
        UpdatedBy: sessionUser.EmployeeID,
        UpdatedAt: nowIso
      });
    } else {
      appendRow(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS, {
        SettingKey: key,
        SettingValue: val,
        UpdatedBy: sessionUser.EmployeeID,
        UpdatedAt: nowIso
      });
    }
  }

  logAuditEvent(sessionUser.EmployeeID, 'UPDATE_HOSPITAL_SETTINGS', 'Settings', 'HOSPITAL', 'SUCCESS', settingsObj);
  return getAllSettings();
}


// ==========================================
// SECTION: Diagnostics.gs
// ==========================================

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


// ==========================================
// SECTION: Setup.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Database Schema Initialization & First Admin Setup Module
 */

function initDatabase() {
  var ss = getSpreadsheet();
  var schemas = CONFIG.SCHEMAS;
  var tableNames = Object.keys(schemas);
  var createdSheets = [];
  var existingSheets = [];

  for (var i = 0; i < tableNames.length; i++) {
    var tableName = tableNames[i];
    var sheet = ss.getSheetByName(tableName);

    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      createdSheets.push(tableName);
    } else {
      existingSheets.push(tableName);
    }

    // Check headers
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var expectedHeaders = schemas[tableName];

    if (lastRow === 0 || lastCol === 0) {
      // Setup headers
      var headerRange = sheet.getRange(1, 1, 1, expectedHeaders.length);
      headerRange.setValues([expectedHeaders]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#0f2942');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }

  // Remove default 'Sheet1' if it exists and is empty
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() <= 1 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  // Seed Initial Departments if empty
  seedDepartments();

  // Seed Initial Designations if empty
  seedDesignations();

  // Seed Initial Leave Types & Policies if empty
  seedLeaveTypesAndPolicies();

  // Seed Initial Settings if empty
  seedHospitalSettings();

  // Seed Initial Holidays if empty
  seedInitialHolidays();

  logAuditEvent('SYSTEM', 'INIT_DATABASE', 'Database', ss.getId(), 'SUCCESS', {
    createdSheets: createdSheets,
    existingSheets: existingSheets
  });

  return {
    success: true,
    message: 'Database initialized successfully',
    createdSheets: createdSheets,
    existingSheets: existingSheets
  };
}

function seedDepartments() {
  var rows = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  if (rows.length > 0) return;

  var defaults = [
    { id: 'DEP_MED', name: 'General Medicine' },
    { id: 'DEP_CARDIO', name: 'Cardiology' },
    { id: 'DEP_PEDIA', name: 'Pediatrics' },
    { id: 'DEP_OBGYN', name: 'Obstetrics & Gynecology' },
    { id: 'DEP_SURG', name: 'General Surgery' },
    { id: 'DEP_EMERG', name: 'Emergency & Trauma' },
    { id: 'DEP_NURSE', name: 'Nursing Services' },
    { id: 'DEP_PHARM', name: 'Pharmacy' },
    { id: 'DEP_LAB', name: 'Laboratory & Diagnostics' },
    { id: 'DEP_ADMIN', name: 'Hospital Administration' },
    { id: 'DEP_HR', name: 'Human Resources' }
  ];

  var nowIso = getIsoTimestamp();
  for (var i = 0; i < defaults.length; i++) {
    appendRow(CONFIG.SHEET_NAMES.DEPARTMENTS, {
      DepartmentID: defaults[i].id,
      DepartmentName: defaults[i].name,
      IsActive: true,
      CreatedAt: nowIso
    });
  }
}

function seedDesignations() {
  var rows = readAllRows(CONFIG.SHEET_NAMES.DESIGNATIONS);
  if (rows.length > 0) return;

  var defaults = [
    { id: 'DES_MS', name: 'Medical Superintendent' },
    { id: 'DES_CMO', name: 'Chief Medical Officer' },
    { id: 'DES_SR_CONS', name: 'Senior Consultant' },
    { id: 'DES_DUTY_DOC', name: 'Duty Medical Officer' },
    { id: 'DES_NS', name: 'Nursing Superintendent' },
    { id: 'DES_HEAD_NURSE', name: 'Head Nurse' },
    { id: 'DES_STAFF_NURSE', name: 'Staff Nurse' },
    { id: 'DES_PHARMACIST', name: 'Chief Pharmacist' },
    { id: 'DES_LAB_TECH', name: 'Senior Lab Technician' },
    { id: 'DES_ADMIN_OFF', name: 'Administrative Officer' },
    { id: 'DES_HR_MGR', name: 'HR Manager' }
  ];

  var nowIso = getIsoTimestamp();
  for (var i = 0; i < defaults.length; i++) {
    appendRow(CONFIG.SHEET_NAMES.DESIGNATIONS, {
      DesignationID: defaults[i].id,
      DesignationName: defaults[i].name,
      IsActive: true,
      CreatedAt: nowIso
    });
  }
}

function seedLeaveTypesAndPolicies() {
  var rows = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  if (rows.length > 0) return;

  var nowIso = getIsoTimestamp();
  var leaveTypes = [
    {
      id: 'LT_CL',
      name: 'Casual Leave (CL)',
      desc: 'Short planned absences for personal or family needs',
      reqBal: true,
      reqAtt: false,
      annual: 12,
      accrual: 'ANNUAL_UPFRONT',
      carry: 'NO_CARRY_FORWARD',
      expiry: 'END_OF_YEAR',
      notice: 1,
      maxDur: 3,
      weekends: 'EXCLUDE_SUNDAYS',
      holidays: 'EXCLUDE_HOLIDAYS',
      negAllowed: false
    },
    {
      id: 'LT_SL',
      name: 'Sick Leave (SL)',
      desc: 'Leave for illness or medical recovery. Certificate required if > 2 days',
      reqBal: true,
      reqAtt: false,
      annual: 12,
      accrual: 'ANNUAL_UPFRONT',
      carry: 'NO_CARRY_FORWARD',
      expiry: 'END_OF_YEAR',
      notice: 0,
      maxDur: 14,
      weekends: 'EXCLUDE_SUNDAYS',
      holidays: 'EXCLUDE_HOLIDAYS',
      negAllowed: false
    },
    {
      id: 'LT_EL',
      name: 'Earned Leave (EL)',
      desc: 'Annual privilege vacation leave requiring prior notice',
      reqBal: true,
      reqAtt: false,
      annual: 15,
      accrual: 'ANNUAL_UPFRONT',
      carry: 'CARRY_FORWARD_MAX_30',
      expiry: 'NO_EXPIRY',
      notice: 7,
      maxDur: 15,
      weekends: 'EXCLUDE_SUNDAYS',
      holidays: 'EXCLUDE_HOLIDAYS',
      negAllowed: false
    },
    {
      id: 'LT_LOP',
      name: 'Loss of Pay (LOP)',
      desc: 'Authorized leave without pay when all paid leave balances are exhausted',
      reqBal: false,
      reqAtt: false,
      annual: 0,
      accrual: 'NONE',
      carry: 'NONE',
      expiry: 'NONE',
      notice: 1,
      maxDur: 60,
      weekends: 'EXCLUDE_SUNDAYS',
      holidays: 'EXCLUDE_HOLIDAYS',
      negAllowed: true
    }
  ];

  for (var i = 0; i < leaveTypes.length; i++) {
    var item = leaveTypes[i];
    appendRow(CONFIG.SHEET_NAMES.LEAVE_TYPES, {
      LeaveTypeID: item.id,
      LeaveTypeName: item.name,
      Description: item.desc,
      RequiresBalance: item.reqBal,
      RequiresAttachment: item.reqAtt,
      IsActive: true,
      CreatedAt: nowIso,
      UpdatedAt: nowIso
    });

    appendRow(CONFIG.SHEET_NAMES.LEAVE_POLICIES, {
      PolicyID: 'POL_' + item.id,
      LeaveTypeID: item.id,
      AnnualAllocation: item.annual,
      AccrualRule: item.accrual,
      CarryForwardRule: item.carry,
      ExpiryRule: item.expiry,
      NoticePeriod: item.notice,
      MaximumDuration: item.maxDur,
      WeekendsPolicy: item.weekends,
      HolidaysPolicy: item.holidays,
      NegativeBalanceAllowed: item.negAllowed,
      EffectiveFrom: nowIso,
      EffectiveTo: ''
    });
  }
}

function seedHospitalSettings() {
  var rows = readAllRows(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS);
  if (rows.length > 0) return;

  var nowIso = getIsoTimestamp();
  var settings = [
    { key: 'HOSPITAL_NAME', val: CONFIG.HOSPITAL_NAME },
    { key: 'LOGO_URL', val: '' },
    { key: 'APPROVAL_WORKFLOW', val: CONFIG.APPROVAL_WORKFLOW.MANAGER_THEN_HR },
    { key: 'LEAVE_YEAR_START', val: '01-01' },
    { key: 'LEAVE_YEAR_END', val: '12-31' },
    { key: 'ALLOW_PAST_LEAVE_DAYS', val: '3' },
    { key: 'HOSPITAL_PHONE', val: '+91 4326 260000' },
    { key: 'HOSPITAL_EMAIL', val: 'hr@nrsljhospitals.com' },
    { key: 'HOSPITAL_ADDRESS', val: 'Musiri, Tiruchirappalli, Tamil Nadu, 621211' }
  ];

  for (var i = 0; i < settings.length; i++) {
    appendRow(CONFIG.SHEET_NAMES.HOSPITAL_SETTINGS, {
      SettingKey: settings[i].key,
      SettingValue: settings[i].val,
      UpdatedBy: 'SYSTEM',
      UpdatedAt: nowIso
    });
  }
}

function seedInitialHolidays() {
  var rows = readAllRows(CONFIG.SHEET_NAMES.HOLIDAYS);
  if (rows.length > 0) return;

  var currentYear = new Date().getFullYear();
  var holidays = [
    { name: 'Pongal / Makar Sankranti', date: currentYear + '-01-14' },
    { name: 'Republic Day', date: currentYear + '-01-26' },
    { name: 'Tamil New Year', date: currentYear + '-04-14' },
    { name: 'May Day', date: currentYear + '-05-01' },
    { name: 'Independence Day', date: currentYear + '-08-15' },
    { name: 'Gandhi Jayanti', date: currentYear + '-10-02' },
    { name: 'Deepavali', date: currentYear + '-11-01' },
    { name: 'Christmas', date: currentYear + '-12-25' }
  ];

  for (var i = 0; i < holidays.length; i++) {
    appendRow(CONFIG.SHEET_NAMES.HOLIDAYS, {
      HolidayID: 'HOL_' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      HolidayDate: holidays[i].date,
      HolidayName: holidays[i].name,
      ApplicableDepartment: 'ALL',
      IsActive: true
    });
  }
}

/**
 * Initializes the first Admin/HR account securely
 * Guards against multiple admin creation via setup
 */
function createFirstAdmin(username, fullName, phone, password) {
  var emps = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);

  // Check if an active Admin already exists
  for (var i = 0; i < emps.length; i++) {
    if (emps[i].Role === CONFIG.ROLES.ADMIN && emps[i].AccountStatus === CONFIG.ACCOUNT_STATUS.ACTIVE) {
      throw new Error('Initial admin setup is permanently closed: An active Admin account already exists. Please log in with existing administrator credentials.');
    }
  }

  var adminUsername = String(username || 'admin').trim().toLowerCase();
  var adminName = String(fullName || 'Hospital Administrator').trim();
  var adminPhone = String(phone || '9876543210').trim();
  var adminPassword = String(password || '');

  if (adminPassword.length < 8) {
    throw new Error('Administrator password must be at least 8 characters long');
  }

  var salt = AUTH.generateSalt();
  var hash = AUTH.hashPassword(adminPassword, salt);
  var nowIso = getIsoTimestamp();

  var adminRecord = {
    EmployeeID: 'ADMIN001',
    FullName: adminName,
    Username: adminUsername,
    Phone: adminPhone,
    PasswordHash: hash,
    PasswordSalt: salt,
    Role: CONFIG.ROLES.ADMIN,
    DepartmentID: 'DEP_ADMIN',
    DesignationID: 'DES_ADMIN_OFF',
    ReportingManagerID: '',
    AccountStatus: CONFIG.ACCOUNT_STATUS.ACTIVE,
    RegistrationStatus: CONFIG.REGISTRATION_STATUS.APPROVED,
    CreatedAt: nowIso,
    UpdatedAt: nowIso,
    LastLoginAt: ''
  };

  appendRow(CONFIG.SHEET_NAMES.EMPLOYEES, adminRecord);

  // Initialize leave balances for admin
  getEmployeeBalances('ADMIN001', new Date().getFullYear());

  sendNotification(
    'ADMIN001',
    'WELCOME',
    'Administrator Account Initialized',
    'Welcome to NRSLJ Speciality Hospitals Leave Management System. Your administrative account has been initialized.',
    ''
  );

  logAuditEvent('ADMIN001', 'INIT_FIRST_ADMIN', 'Employee', 'ADMIN001', 'SUCCESS', {
    username: adminUsername,
    fullName: adminName
  });

  var safeProfile = JSON.parse(JSON.stringify(adminRecord));
  delete safeProfile.PasswordHash;
  delete safeProfile.PasswordSalt;

  return safeProfile;
}

/**
 * One-click runner for first admin initialization
 * You can select this function in the Apps Script dropdown and click Run!
 */
function runFirstAdminSetup() {
  return createFirstAdmin('admin', 'Hospital Administrator', '9876543210', 'MasterAdminPass@2026');
}


// ==========================================
// SECTION: Code.gs
// ==========================================

/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Leave Management System - Main Web App Router & API Dispatcher
 */

/**
 * HTTP GET Handler
 * Serves HTML Service frontend when viewed directly, or returns JSON health check
 */
function doGet(e) {
  var params = e ? e.parameter : {};

  // If queried as API endpoint: ?api=health or ?api=status
  if (params && params.api) {
    var health = healthCheck();
    return ContentService.createTextOutput(JSON.stringify(createSuccessResponse(health, 'Backend active')))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Check if GasApp HTML file exists for direct Apps Script HTML Service hosting
  try {
    return HtmlService.createHtmlOutputFromFile('GasApp')
      .setTitle('NRSLJ Speciality Hospitals - Leave Management System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    // If GasApp template not loaded in Apps Script editor, return a friendly diagnostic page
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>NRSLJ Hospitals Leave Management API</title>' +
      '<style>body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f2942;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}' +
      '.card{background:#ffffff;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:540px;width:100%;text-align:center;}' +
      'h1{color:#0f2942;font-size:22px;margin-bottom:8px;}p{color:#64748b;font-size:14px;line-height:1.6;}' +
      '.badge{display:inline-block;background:#0d9488;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;}' +
      '</style></head><body><div class="card">' +
      '<div class="badge">API Active</div>' +
      '<h1>NRSLJ SPECIALITY HOSPITALS, MUSIRI</h1>' +
      '<p>Employee Leave Management Backend is online and accepting API requests.</p>' +
      '<p>Configure your frontend with this Web App URL, or embed the <code>GasApp.html</code> template into your Apps Script project.</p>' +
      '</div></body></html>';
    return HtmlService.createHtmlOutput(html)
      .setTitle('NRSLJ Hospitals API')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}

/**
 * HTTP POST Handler
 * Accepts JSON payloads with action, sessionToken, and data
 */
function doPost(e) {
  var response = null;

  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);
    var action = payload.action;
    var sessionToken = payload.sessionToken;
    var data = payload.data || {};

    response = handleApiAction(action, sessionToken, data);

  } catch (err) {
    response = createErrorResponse('SERVER_ERROR', err.message || 'Internal server error occurred');
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Direct API dispatcher callable by google.script.run when hosted in HTML Service
 */
function apiDispatcher(action, sessionToken, data) {
  try {
    return handleApiAction(action, sessionToken, data || {});
  } catch (err) {
    return createErrorResponse('SERVER_ERROR', err.message || 'Error executing action');
  }
}

/**
 * Central router and role-based action handler
 */
function handleApiAction(action, sessionToken, data) {
  if (!action) {
    return createErrorResponse('INVALID_ACTION', 'Action parameter is required');
  }

  // ==========================================
  // 1. PUBLIC ACTIONS (No session required)
  // ==========================================
  if (action === 'healthCheck') {
    return createSuccessResponse(healthCheck(), 'Health check passed');
  }

  if (action === 'getPublicHospitalInfo') {
    var settings = getAllSettings();
    return createSuccessResponse({
      hospitalName: settings.HOSPITAL_NAME || CONFIG.HOSPITAL_NAME,
      logoUrl: settings.LOGO_URL || '',
      phone: settings.HOSPITAL_PHONE || '',
      email: settings.HOSPITAL_EMAIL || '',
      address: settings.HOSPITAL_ADDRESS || ''
    }, 'Public info retrieved');
  }

  if (action === 'login') {
    var loginResult = AUTH.login(data.identifier, data.password);
    return createSuccessResponse(loginResult, 'Login successful');
  }

  if (action === 'register') {
    var regResult = registerEmployee(data);
    return createSuccessResponse(regResult, 'Registration submitted');
  }

  if (action === 'setupFirstAdmin') {
    var admin = createFirstAdmin(data.username, data.fullName, data.phone, data.password);
    return createSuccessResponse(admin, 'First administrator account created');
  }

  // ==========================================
  // 2. AUTHENTICATED ACTIONS (Validate session)
  // ==========================================
  var sessionUser = null;
  try {
    sessionUser = AUTH.validateSession(sessionToken);
  } catch (authErr) {
    return createErrorResponse('UNAUTHORIZED', authErr.message);
  }

  // Standard Employee actions
  if (action === 'logout') {
    AUTH.destroySession(sessionToken);
    return createSuccessResponse(null, 'Logged out successfully');
  }

  if (action === 'getProfile') {
    return createSuccessResponse(sessionUser, 'Profile retrieved');
  }

  if (action === 'updateProfile') {
    var profileUpdates = updateEmployee(sessionUser, sessionUser.EmployeeID, data);
    return createSuccessResponse(profileUpdates, 'Profile updated');
  }

  if (action === 'getLeaveTypes') {
    var types = getLeaveTypes(data.onlyActive !== false);
    return createSuccessResponse(types, 'Leave types retrieved');
  }

  if (action === 'getEmployeeBalances') {
    var targetEmp = (sessionUser.Role === CONFIG.ROLES.ADMIN && data.employeeId) ? data.employeeId : sessionUser.EmployeeID;
    var balances = getEmployeeBalances(targetEmp, data.leaveYear);
    return createSuccessResponse(balances, 'Leave balances retrieved');
  }

  if (action === 'submitLeaveRequest') {
    var reqResult = submitLeaveRequest(sessionUser, data);
    return createSuccessResponse(reqResult, 'Leave request submitted successfully');
  }

  if (action === 'getMyLeaveRequests') {
    var myRequests = getEmployeeLeaveRequests(sessionUser);
    return createSuccessResponse(myRequests, 'Leave requests retrieved');
  }

  if (action === 'cancelLeaveRequest') {
    var cancelResult = cancelPendingLeaveRequest(sessionUser, data.requestId);
    return createSuccessResponse(cancelResult, 'Leave request cancelled');
  }

  if (action === 'withdrawLeaveRequest') {
    var withdrawResult = withdrawApprovedLeaveRequest(sessionUser, data.requestId, data.reason);
    return createSuccessResponse(withdrawResult, 'Leave request withdrawn');
  }

  if (action === 'getNotifications') {
    var notifs = getEmployeeNotifications(sessionUser, data.onlyUnread);
    return createSuccessResponse(notifs, 'Notifications retrieved');
  }

  if (action === 'markNotificationRead') {
    var readRes = markNotificationAsRead(sessionUser, data.notificationId);
    return createSuccessResponse(readRes, 'Notification marked as read');
  }

  if (action === 'markAllNotificationsRead') {
    var allReadRes = markAllNotificationsAsRead(sessionUser);
    return createSuccessResponse(allReadRes, 'All notifications marked as read');
  }

  if (action === 'getLeaveCalendar') {
    var calendarEvents = getLeaveCalendar(sessionUser, data.month, data.year, data.departmentId);
    return createSuccessResponse(calendarEvents, 'Calendar events retrieved');
  }

  if (action === 'getHolidays') {
    var hols = getHolidays(sessionUser.DepartmentID);
    return createSuccessResponse(hols, 'Holidays retrieved');
  }

  // ==========================================
  // 3. MANAGER ACTIONS
  // ==========================================
  if (action === 'getPendingApprovals') {
    var pending = getPendingApprovals(sessionUser);
    return createSuccessResponse(pending, 'Pending approvals retrieved');
  }

  if (action === 'processApprovalDecision') {
    var decisionRes = processApprovalDecision(sessionUser, data.requestId, data.decision, data.comment);
    return createSuccessResponse(decisionRes, 'Decision recorded');
  }

  if (action === 'getApprovalHistory') {
    var history = getApprovalHistory(sessionUser, data.requestId);
    return createSuccessResponse(history, 'Approval history retrieved');
  }

  if (action === 'getDashboardMetrics') {
    var metrics = getDashboardMetrics(sessionUser);
    return createSuccessResponse(metrics, 'Dashboard metrics retrieved');
  }

  // ==========================================
  // 4. ADMIN/HR ONLY ACTIONS
  // ==========================================
  if (sessionUser.Role !== CONFIG.ROLES.ADMIN) {
    return createErrorResponse('FORBIDDEN', 'Administrative privileges required for this action');
  }

  if (action === 'getPendingRegistrations') {
    var pendingRegs = getPendingRegistrations(sessionUser);
    return createSuccessResponse(pendingRegs, 'Pending registrations retrieved');
  }

  if (action === 'approveRegistration') {
    var appReg = approveRegistration(
      sessionUser,
      data.employeeId,
      data.departmentId,
      data.designationId,
      data.reportingManagerId,
      data.role,
      data.adminNote
    );
    return createSuccessResponse(appReg, 'Registration approved and account activated');
  }

  if (action === 'rejectRegistration') {
    var rejReg = rejectRegistration(sessionUser, data.employeeId, data.adminNote);
    return createSuccessResponse(rejReg, 'Registration rejected');
  }

  if (action === 'getAllEmployees') {
    var allEmps = getAllEmployees(sessionUser, data.filters);
    return createSuccessResponse(allEmps, 'Employees list retrieved');
  }

  if (action === 'adminUpdateEmployee') {
    var adminUpdate = updateEmployee(sessionUser, data.employeeId, data.updates);
    return createSuccessResponse(adminUpdate, 'Employee updated');
  }

  if (action === 'getManagersList') {
    var managers = getManagersList();
    return createSuccessResponse(managers, 'Managers list retrieved');
  }

  if (action === 'getDepartments') {
    var depts = getDepartments(data.onlyActive);
    return createSuccessResponse(depts, 'Departments retrieved');
  }

  if (action === 'addDepartment') {
    var newDept = addDepartment(sessionUser, data.name);
    return createSuccessResponse(newDept, 'Department added');
  }

  if (action === 'updateDepartment') {
    var updDept = updateDepartment(sessionUser, data.id, data.name, data.isActive);
    return createSuccessResponse(updDept, 'Department updated');
  }

  if (action === 'getDesignations') {
    var desigs = getDesignations(data.onlyActive);
    return createSuccessResponse(desigs, 'Designations retrieved');
  }

  if (action === 'addDesignation') {
    var newDesig = addDesignation(sessionUser, data.name);
    return createSuccessResponse(newDesig, 'Designation added');
  }

  if (action === 'updateDesignation') {
    var updDesig = updateDesignation(sessionUser, data.id, data.name, data.isActive);
    return createSuccessResponse(updDesig, 'Designation updated');
  }

  if (action === 'addLeaveType') {
    var newType = addLeaveType(sessionUser, data);
    return createSuccessResponse(newType, 'Leave type added');
  }

  if (action === 'updateLeaveType') {
    var updType = updateLeaveType(sessionUser, data.id, data);
    return createSuccessResponse(updType, 'Leave type updated');
  }

  if (action === 'getLeavePolicies') {
    var policies = getLeavePolicies();
    return createSuccessResponse(policies, 'Leave policies retrieved');
  }

  if (action === 'updateLeavePolicy') {
    var updPolicy = updateLeavePolicy(sessionUser, data.id, data);
    return createSuccessResponse(updPolicy, 'Leave policy updated');
  }

  if (action === 'manualAdjustBalance') {
    var adjResult = manualAdjustBalance(sessionUser, data.employeeId, data.leaveTypeId, data.amount, data.reason);
    return createSuccessResponse(adjResult, 'Balance adjusted successfully');
  }

  if (action === 'getBalanceLedger') {
    var ledger = getBalanceLedger(sessionUser, data.employeeId);
    return createSuccessResponse(ledger, 'Balance ledger retrieved');
  }

  if (action === 'addHoliday') {
    var newHol = addHoliday(sessionUser, data.date, data.name, data.applicableDept);
    return createSuccessResponse(newHol, 'Holiday added');
  }

  if (action === 'updateHoliday') {
    var updHol = updateHoliday(sessionUser, data.id, data.date, data.name, data.applicableDept, data.isActive);
    return createSuccessResponse(updHol, 'Holiday updated');
  }

  if (action === 'deleteHoliday') {
    var delHol = deleteHoliday(sessionUser, data.id);
    return createSuccessResponse(delHol, 'Holiday deleted');
  }

  if (action === 'getAllSettings') {
    var allSettings = getAllSettings();
    return createSuccessResponse(allSettings, 'Settings retrieved');
  }

  if (action === 'updateSettings') {
    var updSettings = updateSettings(sessionUser, data);
    return createSuccessResponse(updSettings, 'Settings updated');
  }

  if (action === 'getAuditLogs') {
    var logs = getAuditLogs(sessionUser, data.limit);
    return createSuccessResponse(logs, 'Audit logs retrieved');
  }

  if (action === 'exportReportCsv') {
    var exportResult = exportReportCsv(sessionUser, data.reportType, data.filters);
    return createSuccessResponse(exportResult, 'Report exported');
  }

  if (action === 'runDiagnostics') {
    var diag = runDiagnostics(sessionUser);
    return createSuccessResponse(diag, 'Diagnostics complete');
  }

  if (action === 'initDatabase') {
    var initRes = initDatabase();
    return createSuccessResponse(initRes, 'Database initialized');
  }

  return createErrorResponse('UNKNOWN_ACTION', 'Unrecognized action: ' + action);
}

