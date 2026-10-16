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
