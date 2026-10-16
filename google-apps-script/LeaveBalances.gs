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
  try {
    var success = lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    if (!success) {
      throw new Error('Server busy: Could not obtain lock for balance update. Please try again.');
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
    lock.releaseLock();
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
