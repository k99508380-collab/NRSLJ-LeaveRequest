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
