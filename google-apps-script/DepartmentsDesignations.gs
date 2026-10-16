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
