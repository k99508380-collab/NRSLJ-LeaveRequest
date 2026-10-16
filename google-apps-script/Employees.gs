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
