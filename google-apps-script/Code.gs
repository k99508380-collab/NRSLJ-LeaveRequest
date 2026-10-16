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
