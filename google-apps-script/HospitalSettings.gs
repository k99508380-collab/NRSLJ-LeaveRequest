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
