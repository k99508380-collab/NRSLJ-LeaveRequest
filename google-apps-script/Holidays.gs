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
  var start = parseDateOnly(startDateStr);
  var end = parseDateOnly(endDateStr);

  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
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
