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
