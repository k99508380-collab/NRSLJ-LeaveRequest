/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * In-App Notification System
 */

function sendNotification(recipientEmployeeId, notificationType, title, message, relatedRequestId) {
  if (!recipientEmployeeId || !title || !message) return null;

  try {
    var notifId = 'NOTIF_' + Utilities.getUuid().substring(0, 8).toUpperCase();
    var record = {
      NotificationID: notifId,
      RecipientEmployeeID: recipientEmployeeId,
      NotificationType: notificationType || 'INFO',
      Title: String(title).trim(),
      Message: String(message).trim(),
      RelatedRequestID: relatedRequestId || '',
      CreatedAt: getIsoTimestamp(),
      ReadAt: ''
    };

    appendRow(CONFIG.SHEET_NAMES.NOTIFICATIONS, record);
    return record;
  } catch (e) {
    Logger.log('Failed to create notification: ' + e.message);
    return null;
  }
}

function getEmployeeNotifications(sessionUser, onlyUnread) {
  if (!sessionUser) throw new Error('Unauthorized');

  var all = readAllRows(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var userNotifs = all.filter(function(n) {
    return n.RecipientEmployeeID === sessionUser.EmployeeID;
  });

  if (onlyUnread) {
    userNotifs = userNotifs.filter(function(n) {
      return !n.ReadAt || n.ReadAt === '';
    });
  }

  // Sort newest first
  userNotifs.sort(function(a, b) {
    return (b.CreatedAt || '').localeCompare(a.CreatedAt || '');
  });

  return userNotifs.slice(0, 50); // limit to 50 latest
}

function markNotificationAsRead(sessionUser, notificationId) {
  if (!sessionUser) throw new Error('Unauthorized');
  if (!notificationId) throw new Error('Notification ID is required');

  var notifSheet = getSheet(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var rowIdx = findRowIndexById(CONFIG.SHEET_NAMES.NOTIFICATIONS, 'NotificationID', notificationId);
  if (rowIdx === -1) {
    throw new Error('Notification not found');
  }

  // Verify recipient
  var rows = readAllRows(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var notif = rows.filter(function(n) { return n.NotificationID === notificationId; })[0];
  if (notif && notif.RecipientEmployeeID !== sessionUser.EmployeeID) {
    throw new Error('Unauthorized: cannot mark another user\'s notification');
  }

  var updates = { ReadAt: getIsoTimestamp() };
  updateRowById(CONFIG.SHEET_NAMES.NOTIFICATIONS, 'NotificationID', notificationId, updates);
  return { success: true };
}

function markAllNotificationsAsRead(sessionUser) {
  if (!sessionUser) throw new Error('Unauthorized');

  var notifSheet = getSheet(CONFIG.SHEET_NAMES.NOTIFICATIONS);
  var lastRow = notifSheet.getLastRow();
  var lastCol = notifSheet.getLastColumn();
  if (lastRow < 2) return { count: 0 };

  var values = notifSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var recCol = headers.indexOf('RecipientEmployeeID');
  var readCol = headers.indexOf('ReadAt');

  if (recCol === -1 || readCol === -1) return { count: 0 };

  var nowIso = getIsoTimestamp();
  var count = 0;
  for (var i = 1; i < values.length; i++) {
    if (values[i][recCol] === sessionUser.EmployeeID && (!values[i][readCol] || values[i][readCol] === '')) {
      values[i][readCol] = nowIso;
      count++;
    }
  }

  if (count > 0) {
    notifSheet.getRange(1, 1, lastRow, lastCol).setValues(values);
  }

  return { count: count };
}
