/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Reports, Calendar & Safe CSV Export Module
 */

function getDashboardMetrics(sessionUser) {
  if (!sessionUser) throw new Error('Unauthorized');

  var allEmployees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var departments = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  var designations = readAllRows(CONFIG.SHEET_NAMES.DESIGNATIONS);
  var leaveTypes = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);

  var deptMap = {};
  for (var d = 0; d < departments.length; d++) {
    deptMap[departments[d].DepartmentID] = departments[d].DepartmentName;
  }
  var desigMap = {};
  for (var dg = 0; dg < designations.length; dg++) {
    desigMap[designations[dg].DesignationID] = designations[dg].DesignationName;
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
  var pendingOnLeaveToday = [];
  var upcomingApproved = [];
  var approvedCount = 0;
  var rejectedCount = 0;
  var deptCounts = {};

  for (var i = 0; i < allRequests.length; i++) {
    var req = allRequests[i];
    if (req.Status === CONFIG.REQUEST_STATUS.APPROVED) {
      approvedCount++;
      var start = parseDateOnly(req.StartDate);
      var end = parseDateOnly(req.EndDate);
      if (!start || !end) continue;

      var emp = empMap[req.EmployeeID] || {};
      var deptName = deptMap[emp.DepartmentID] || 'General';
      var desigName = desigMap[emp.DesignationID] || 'Staff';

      if (todayObj >= start && todayObj <= end) {
        onLeaveToday.push({
          RequestId: req.RequestID,
          EmployeeId: req.EmployeeID,
          EmployeeID: req.EmployeeID,
          FullName: emp.FullName || 'Staff',
          DepartmentName: deptName,
          DesignationName: desigName,
          LeaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
          LeaveTypeName: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
          StartDate: formatDateOnlyStr(req.StartDate),
          EndDate: formatDateOnlyStr(req.EndDate),
          DayPart: req.DayPart,
          Status: req.Status
        });
      } else if (start > todayObj) {
        // Next 14 days
        var diffTime = start.getTime() - todayObj.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 14) {
          upcomingApproved.push({
            RequestId: req.RequestID,
            EmployeeId: req.EmployeeID,
            EmployeeID: req.EmployeeID,
            FullName: emp.FullName || 'Staff',
            DepartmentName: deptName,
            DesignationName: desigName,
            LeaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
            LeaveTypeName: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
            StartDate: formatDateOnlyStr(req.StartDate),
            EndDate: formatDateOnlyStr(req.EndDate),
            RequestedDays: req.RequestedDays
          });
        }
      }

      // Department distribution
      deptCounts[deptName] = (deptCounts[deptName] || 0) + Number(req.RequestedDays || 0);
    } else if (req.Status === CONFIG.REQUEST_STATUS.REJECTED) {
      rejectedCount++;
    } else if (req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER || req.Status === CONFIG.REQUEST_STATUS.PENDING_HR) {
      var start = parseDateOnly(req.StartDate);
      var end = parseDateOnly(req.EndDate);
      if (start && end && todayObj >= start && todayObj <= end) {
        var emp = empMap[req.EmployeeID] || {};
        var deptName = deptMap[emp.DepartmentID] || 'General';
        var desigName = desigMap[emp.DesignationID] || 'Staff';
        pendingOnLeaveToday.push({
          RequestId: req.RequestID,
          EmployeeId: req.EmployeeID,
          EmployeeID: req.EmployeeID,
          FullName: emp.FullName || 'Staff',
          DepartmentName: deptName,
          DesignationName: desigName,
          LeaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
          LeaveTypeName: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
          StartDate: formatDateOnlyStr(req.StartDate),
          EndDate: formatDateOnlyStr(req.EndDate),
          DayPart: req.DayPart,
          RequestedDays: req.RequestedDays,
          Status: req.Status,
          Reason: req.Reason || '',
          CurrentApproverID: req.CurrentApproverID || ''
        });
      }
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
    pendingOnLeaveTodayCount: pendingOnLeaveToday.length,
    pendingOnLeaveToday: pendingOnLeaveToday,
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

    var start = parseDateOnly(req.StartDate);
    var end = parseDateOnly(req.EndDate);
    if (!start || !end) continue;

    if (end >= monthStart && start <= monthEnd) {
      events.push({
        requestId: req.RequestID,
        employeeId: isSelf || canViewDetails ? emp.EmployeeID : 'Staff',
        employeeName: canViewDetails ? emp.FullName : (emp.FullName ? emp.FullName.split(' ')[0] + ' (Staff)' : 'Staff'),
        departmentName: deptMap[emp.DepartmentID] || 'General',
        leaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
        startDate: formatDateOnlyStr(req.StartDate),
        endDate: formatDateOnlyStr(req.EndDate),
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

/**
 * Retrieves staff on leave (both approved and pending) for any specified calendar date
 */
function getStaffOnLeaveByDate(sessionUser, targetDateStr) {
  if (!sessionUser) throw new Error('Unauthorized');

  var todayStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
  var queryDateStr = targetDateStr ? formatDateOnlyStr(targetDateStr) : todayStr;
  var queryDateObj = parseDateOnly(queryDateStr);

  if (!queryDateObj || isNaN(queryDateObj.getTime())) {
    queryDateStr = todayStr;
    queryDateObj = parseDateOnly(todayStr);
  }

  var allEmployees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
  var empMap = {};
  for (var e = 0; e < allEmployees.length; e++) {
    empMap[allEmployees[e].EmployeeID] = allEmployees[e];
  }

  var allDepts = readAllRows(CONFIG.SHEET_NAMES.DEPARTMENTS);
  var deptMap = {};
  for (var d = 0; d < allDepts.length; d++) {
    deptMap[allDepts[d].DepartmentID] = allDepts[d].DepartmentName;
  }

  var allDesigs = readAllRows(CONFIG.SHEET_NAMES.DESIGNATIONS);
  var desigMap = {};
  for (var dg = 0; dg < allDesigs.length; dg++) {
    desigMap[allDesigs[dg].DesignationID] = allDesigs[dg].DesignationName;
  }

  var allTypes = readAllRows(CONFIG.SHEET_NAMES.LEAVE_TYPES);
  var typeMap = {};
  for (var t = 0; t < allTypes.length; t++) {
    typeMap[allTypes[t].LeaveTypeID] = allTypes[t].LeaveTypeName;
  }

  var allRequests = readAllRows(CONFIG.SHEET_NAMES.LEAVE_REQUESTS);
  var approvedList = [];
  var pendingList = [];

  for (var i = 0; i < allRequests.length; i++) {
    var req = allRequests[i];
    var start = parseDateOnly(req.StartDate);
    var end = parseDateOnly(req.EndDate);
    if (!start || !end) continue;

    if (queryDateObj >= start && queryDateObj <= end) {
      var emp = empMap[req.EmployeeID] || {};
      var deptName = deptMap[emp.DepartmentID] || emp.DepartmentID || 'General';
      var desigName = desigMap[emp.DesignationID] || emp.DesignationID || 'Staff';

      var item = {
        RequestId: req.RequestID,
        EmployeeId: req.EmployeeID,
        EmployeeID: req.EmployeeID,
        FullName: emp.FullName || 'Staff',
        DepartmentName: deptName,
        DesignationName: desigName,
        LeaveType: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
        LeaveTypeName: typeMap[req.LeaveTypeID] || req.LeaveTypeID,
        StartDate: formatDateOnlyStr(req.StartDate),
        EndDate: formatDateOnlyStr(req.EndDate),
        DayPart: req.DayPart,
        RequestedDays: req.RequestedDays,
        Reason: req.Reason || '',
        Status: req.Status,
        CurrentApproverID: req.CurrentApproverID || '',
        EmergencyContact: emp.Phone || ''
      };

      if (req.Status === CONFIG.REQUEST_STATUS.APPROVED) {
        approvedList.push(item);
      } else if (req.Status === CONFIG.REQUEST_STATUS.PENDING_MANAGER || req.Status === CONFIG.REQUEST_STATUS.PENDING_HR) {
        pendingList.push(item);
      }
    }
  }

  return {
    queryDate: queryDateStr,
    isToday: queryDateStr === todayStr,
    approvedCount: approvedList.length,
    approvedLeaves: approvedList,
    pendingCount: pendingList.length,
    pendingLeaves: pendingList,
    totalCount: approvedList.length + pendingList.length
  };
}
