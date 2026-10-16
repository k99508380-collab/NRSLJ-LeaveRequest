/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Audit Logging Module
 */

function logAuditEvent(actorId, action, entityType, entityId, result, detailsObj) {
  try {
    var sanitizedDetails = '';
    if (detailsObj) {
      // Strip any sensitive keys like passwords, tokens, hashes
      var safeDetails = JSON.parse(JSON.stringify(detailsObj));
      var sensitiveFields = ['password', 'passwordHash', 'passwordSalt', 'token', 'sessionToken'];
      for (var i = 0; i < sensitiveFields.length; i++) {
        var key = sensitiveFields[i];
        if (safeDetails.hasOwnProperty(key)) {
          safeDetails[key] = '[REDACTED]';
        }
      }
      sanitizedDetails = JSON.stringify(safeDetails);
    }

    var record = {
      AuditID: 'AUD_' + Utilities.getUuid().substring(0, 12),
      ActorID: actorId || 'SYSTEM',
      Action: action,
      EntityType: entityType,
      EntityID: entityId || '',
      Timestamp: getIsoTimestamp(),
      Result: result || 'SUCCESS',
      SanitizedDetails: sanitizedDetails
    };

    appendRow(CONFIG.SHEET_NAMES.AUDIT_LOGS, record);
    return record;
  } catch (e) {
    Logger.log('Failed to write audit log: ' + e.message);
    return null;
  }
}

function getAuditLogs(sessionEmployee, limit) {
  // Only admins can view audit logs
  if (!sessionEmployee || sessionEmployee.Role !== CONFIG.ROLES.ADMIN) {
    throw new Error('Unauthorized: Only Admin/HR can inspect audit logs.');
  }

  var logs = readAllRows(CONFIG.SHEET_NAMES.AUDIT_LOGS);
  // Sort reverse chronological
  logs.sort(function(a, b) {
    return (b.Timestamp || '').localeCompare(a.Timestamp || '');
  });

  var maxLogs = limit || 200;
  return logs.slice(0, maxLogs);
}
