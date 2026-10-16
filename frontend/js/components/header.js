/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Top Header Navigation Component
 */

window.NRSLJ_HEADER = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    var settings = state.hospitalSettings;
    var unread = state.unreadCount;

    var logoSrc = settings.LOGO_URL && settings.LOGO_URL.trim().length > 0 ? settings.LOGO_URL : window.NRSLJ_CONFIG.DEFAULT_LOGO_PATH;
    var hospitalName = settings.HOSPITAL_NAME || window.NRSLJ_CONFIG.HOSPITAL_NAME;

    var html = '' +
      '<div class="flex items-center gap-md">' +
        '<button type="button" class="btn-icon mobile-menu-btn" id="sidebar-toggle-btn" aria-label="Toggle navigation menu">' +
          '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
        '</button>' +
        '<div class="header-brand">' +
          '<img src="' + logoSrc + '" alt="' + hospitalName + ' Logo" class="brand-logo-img" id="header-brand-logo" onerror="this.src=\'assets/logo.svg\'">' +
          '<div class="brand-text-container">' +
            '<span class="brand-title">' + hospitalName + '</span>' +
            '<span class="brand-subtitle">Leave Management Portal</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="header-actions">' +
        // Diagnostics button
        '<button type="button" class="btn-icon" id="header-diag-btn" title="System Connection Diagnostics" aria-label="Connection diagnostics">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' +
        '</button>';

    if (user) {
      var initials = (user.FullName || 'U').split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();

      html += '' +
        // Notification bell
        '<button type="button" class="btn-icon" id="header-notif-btn" aria-label="Notifications" title="Notifications">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>' +
          (unread > 0 ? '<span class="badge-counter">' + (unread > 9 ? '9+' : unread) + '</span>' : '') +
        '</button>' +

        // User badge
        '<div class="user-profile-badge">' +
          '<div class="user-avatar">' + initials + '</div>' +
          '<span>' + (user.FullName || user.Username) + '</span>' +
          '<span class="badge badge-role-' + user.Role.toLowerCase() + '">' + user.Role + '</span>' +
        '</div>' +

        // Logout button
        '<button type="button" class="btn btn-outline btn-sm" id="header-logout-btn" title="Log out">' +
          '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>' +
          '<span class="sr-only-mobile">Logout</span>' +
        '</button>';
    }

    html += '</div>';

    container.innerHTML = html;

    // Attach events
    var toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        var sidebar = document.getElementById('app-sidebar');
        var backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('active');
      });
    }

    var diagBtn = document.getElementById('header-diag-btn');
    if (diagBtn) {
      diagBtn.addEventListener('click', function() {
        window.NRSLJ_STATE.setRoute('diagnostics');
      });
    }

    var notifBtn = document.getElementById('header-notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', openNotificationsModal);
    }

    var logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to log out?')) {
          window.NRSLJ_AUTH.logout();
        }
      });
    }
  }

  function openNotificationsModal() {
    var state = window.NRSLJ_STATE.get();
    var notifs = state.notifications || [];

    var bodyHtml = '';
    if (notifs.length === 0) {
      bodyHtml = '<div class="text-center text-muted" style="padding: 30px;">' +
        '<svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 12px;"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>' +
        '<p>You have no notifications at this time.</p></div>';
    } else {
      bodyHtml = '<div class="flex flex-col gap-sm" style="max-height: 400px; overflow-y: auto;">';
      for (var i = 0; i < notifs.length; i++) {
        var n = notifs[i];
        var isUnread = !n.ReadAt;
        bodyHtml += '<div style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background-color: ' + (isUnread ? 'var(--color-teal-50)' : 'var(--color-surface)') + ';">' +
          '<div class="flex justify-between items-center mb-xs">' +
            '<strong style="font-size: 0.9rem; color: var(--color-primary-900);">' + escapeHtml(n.Title) + '</strong>' +
            '<span class="text-xs text-muted">' + (n.CreatedAt ? n.CreatedAt.substring(0, 10) : '') + '</span>' +
          '</div>' +
          '<p class="text-sm" style="margin: 0; color: var(--color-text-main);">' + escapeHtml(n.Message) + '</p>' +
        '</div>';
      }
      bodyHtml += '</div>';
    }

    var footerHtml = '' +
      '<button type="button" class="btn btn-outline btn-sm" id="mark-all-read-btn">Mark All as Read</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" onclick="window.NRSLJ_MODAL.close()">Close</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'In-App Notifications',
      body: bodyHtml,
      footer: footerHtml
    });

    var markAllBtn = dialog.querySelector('#mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function() {
        window.NRSLJ_API.call('markAllNotificationsRead', {})
          .then(function() {
            window.NRSLJ_TOAST.success('All notifications marked as read');
            // Refresh
            window.NRSLJ_API.call('getNotifications', {})
              .then(function(res) {
                window.NRSLJ_STATE.setNotifications(res);
                window.NRSLJ_MODAL.close();
              });
          })
          .catch(function(err) {
            window.NRSLJ_TOAST.error(err.message);
          });
      });
    }
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.innerText = str || '';
    return d.innerHTML;
  }

  return {
    render: render
  };
})();
