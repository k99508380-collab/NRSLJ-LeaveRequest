/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Admin/HR Executive Dashboard View
 */

window.NRSLJ_ADMIN_DASHBOARD = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || user.Role !== 'ADMIN') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading hospital metrics and management overview...</p></div>';

    window.NRSLJ_API.call('getDashboardMetrics', {})
      .then(function(metrics) {
        renderMetrics(container, user, metrics);
      })
      .catch(function(err) {
        container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
          '<strong>Error loading admin dashboard:</strong> ' + escapeHtml(err.message) +
          '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_ADMIN_DASHBOARD.render(\'' + containerId + '\')">Retry</button>' +
          '</div>';
      });
  }

  function renderMetrics(container, user, metrics) {
    var html = '' +
      '<div class="flex justify-between items-center mb-lg flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.5rem;">Hospital Administration Portal</h1>' +
          '<p class="text-sm text-muted">NRSLJ Speciality Hospitals, Musiri &bull; Leave & Staff Attendance Overview</p>' +
        '</div>' +
        '<div class="flex gap-sm flex-wrap">' +
          '<button type="button" class="btn btn-primary btn-sm" id="admin-quick-reg-btn">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>' +
            '<span>Review Registrations (' + (metrics.pendingRegistrationsCount || 0) + ')</span>' +
          '</button>' +
          '<button type="button" class="btn btn-navy btn-sm" id="admin-quick-export-btn">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>' +
            '<span>Reports & Exports</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Top Metric Cards Grid
      '<div class="grid grid-cols-4 gap-md mb-lg">' +
        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Active Hospital Staff</div>' +
            '<div class="stat-value">' + (metrics.totalEmployees || 0) + '</div>' +
            '<div class="stat-subtitle">Registered employees</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-navy">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Pending Registrations</div>' +
            '<div class="stat-value" style="color: var(--color-warning);">' + (metrics.pendingRegistrationsCount || 0) + '</div>' +
            '<div class="stat-subtitle">Awaiting activation</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-amber">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Pending Approvals</div>' +
            '<div class="stat-value" style="color: var(--color-danger);">' + (metrics.pendingApprovalsCount || 0) + '</div>' +
            '<div class="stat-subtitle">Leave requests in queue</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-red">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Staff On Leave Today</div>' +
            '<div class="stat-value" style="color: var(--color-teal-600);">' + (metrics.onLeaveTodayCount || 0) + '</div>' +
            '<div class="stat-subtitle">Active hospital absences</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-teal">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Secondary Grid: Staff on Leave Today (With Date Picker) + Department Breakdown
      '<div class="grid grid-cols-2 gap-md mb-lg">' +
        // Staff on Leave Date Selector Card
        '<div class="card" id="admin-roster-card">' +
          '<div class="card-header" style="display: flex; flex-direction: column; gap: 10px;">' +
            '<div class="flex justify-between items-center flex-wrap gap-xs">' +
              '<div>' +
                '<div class="card-title" style="display: flex; align-items: center; gap: 6px;">' +
                  '<span>🏥 Staff Absences & Duty Roster</span>' +
                '</div>' +
                '<div class="card-subtitle" id="admin-roster-subtitle">' + new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</div>' +
              '</div>' +
              '<span id="admin-roster-badge" class="badge badge-teal" style="font-size: 0.8rem; padding: 4px 10px; font-weight: 700;">' +
                ((metrics.onLeaveToday ? metrics.onLeaveToday.length : 0) + (metrics.pendingOnLeaveToday ? metrics.pendingOnLeaveToday.length : 0)) + ' Total Absence(s)' +
              '</span>' +
            '</div>' +
            '<div class="flex items-center gap-xs flex-wrap" style="background: var(--color-surface-hover); padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">' +
              '<label for="admin-roster-datepicker" class="text-xs text-muted" style="font-weight: 600; white-space: nowrap;">📅 Select Date:</label>' +
              '<input type="date" id="admin-roster-datepicker" class="form-control" value="' + window.NRSLJ_CONFIG.getLocalDateString(0) + '" style="padding: 3px 8px; font-size: 0.82rem; height: 30px; max-width: 140px; font-weight: 600; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">' +
              '<div class="flex gap-xs" style="margin-left: auto;">' +
                '<button type="button" class="btn btn-outline btn-sm admin-roster-quick-btn" data-day="0" style="padding: 2px 8px; font-size: 0.75rem;">Today</button>' +
                '<button type="button" class="btn btn-outline btn-sm admin-roster-quick-btn" data-day="1" style="padding: 2px 8px; font-size: 0.75rem;">Tomorrow</button>' +
                '<button type="button" class="btn btn-outline btn-sm admin-roster-quick-btn" data-day="-1" style="padding: 2px 8px; font-size: 0.75rem;">Yesterday</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card-body" id="admin-roster-body" style="padding: 16px;">' +
            renderRosterList(metrics.onLeaveToday || [], metrics.pendingOnLeaveToday || []) +
          '</div>' +
        '</div>' +

        // Department Utilization Breakdown
        '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">Leave Utilization by Department</div>' +
              '<div class="card-subtitle">Cumulative approved days taken in ' + new Date().getFullYear() + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="flex flex-col gap-sm">';

    var deptUtil = metrics.departmentUtilization || {};
    var deptKeys = Object.keys(deptUtil);
    if (deptKeys.length === 0) {
      html += '<p class="text-center text-muted" style="padding: 20px;">No leave taken this year yet.</p>';
    } else {
      var maxDays = 1;
      deptKeys.forEach(function(k) { if (deptUtil[k] > maxDays) maxDays = deptUtil[k]; });

      for (var d = 0; d < deptKeys.length; d++) {
        var dName = deptKeys[d];
        var days = deptUtil[dName];
        var pct = Math.round((days / maxDays) * 100);

        html += '<div>' +
          '<div class="flex justify-between text-xs mb-xs">' +
            '<strong>' + escapeHtml(dName) + '</strong>' +
            '<span>' + days + ' day(s)</span>' +
          '</div>' +
          '<div class="balance-progress-bar" style="height: 8px;">' +
            '<div class="balance-progress-fill" style="width: ' + pct + '%; background-color: var(--color-primary-700);"></div>' +
          '</div>' +
        '</div>';
      }
    }

    html += '</div></div></div></div>' +

      // Administrative Quick Action Shortcuts
      '<div class="card mb-lg">' +
        '<div class="card-header">' +
          '<div class="card-title">Administrative Operations & Setup Shortcuts</div>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="grid grid-cols-4 gap-md">' +
            '<button type="button" class="btn btn-outline" id="shortcut-reg-btn" style="flex-direction: column; height: 80px; justify-content: center;">' +
              '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>' +
              '<span class="mt-xs">Registrations Queue</span>' +
            '</button>' +

            '<button type="button" class="btn btn-outline" id="shortcut-emp-btn" style="flex-direction: column; height: 80px; justify-content: center;">' +
              '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' +
              '<span class="mt-xs">Employee List</span>' +
            '</button>' +

            '<button type="button" class="btn btn-outline" id="shortcut-config-btn" style="flex-direction: column; height: 80px; justify-content: center;">' +
              '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>' +
              '<span class="mt-xs">Leave & Policies</span>' +
            '</button>' +

            '<button type="button" class="btn btn-outline" id="shortcut-settings-btn" style="flex-direction: column; height: 80px; justify-content: center;">' +
              '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' +
              '<span class="mt-xs">Hospital Branding</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // Attach shortcut links
    document.getElementById('admin-quick-reg-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('admin-registrations');
    });
    document.getElementById('shortcut-reg-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('admin-registrations');
    });
    document.getElementById('admin-quick-export-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('admin-reports');
    });
    document.getElementById('shortcut-emp-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('admin-employees');
    });
    document.getElementById('shortcut-config-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('admin-leave-config');
    });
    document.getElementById('shortcut-settings-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('hospital-settings');
    });

    // Date Picker for Staff Absences
    var datePicker = document.getElementById('admin-roster-datepicker');
    var rosterBody = document.getElementById('admin-roster-body');
    var rosterSubtitle = document.getElementById('admin-roster-subtitle');
    var rosterBadge = document.getElementById('admin-roster-badge');

    function loadRosterForDate(dateStr) {
      if (!dateStr || !rosterBody) return;
      rosterBody.innerHTML = '<div class="text-center" style="padding: 24px;"><span class="spinner"></span><p class="text-xs text-muted mt-xs">Fetching staff roster for ' + dateStr + '...</p></div>';

      var dateObj = new Date(dateStr + 'T00:00:00');
      if (!isNaN(dateObj.getTime()) && rosterSubtitle) {
        rosterSubtitle.textContent = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }

      window.NRSLJ_API.call('getStaffOnLeaveByDate', { date: dateStr })
        .then(function(res) {
          rosterBody.innerHTML = renderRosterList(res.approvedLeaves || [], res.pendingLeaves || []);
          var appCount = res.approvedCount || 0;
          var pendCount = res.pendingCount || 0;
          var total = appCount + pendCount;
          if (rosterBadge) {
            rosterBadge.textContent = total + ' Total Absence(s)' + (pendCount > 0 ? (' (' + pendCount + ' Pending)') : '');
          }
          attachRosterPendingHandlers(container);
        })
        .catch(function(err) {
          rosterBody.innerHTML = '<div class="alert alert-danger text-xs">' + escapeHtml(err.message) + '</div>';
        });
    }

    if (datePicker) {
      datePicker.addEventListener('change', function() {
        loadRosterForDate(this.value);
      });
    }

    var quickBtns = container.querySelectorAll('.admin-roster-quick-btn');
    for (var q = 0; q < quickBtns.length; q++) {
      quickBtns[q].addEventListener('click', function() {
        var offset = parseInt(this.getAttribute('data-day'), 10) || 0;
        var targetDate = window.NRSLJ_CONFIG.getLocalDateString(offset);
        if (datePicker) datePicker.value = targetDate;
        loadRosterForDate(targetDate);
      });
    }

    attachRosterPendingHandlers(container);
  }

  function attachRosterPendingHandlers(container) {
    var btns = container.querySelectorAll('.action-review-pending');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        window.NRSLJ_STATE.setRoute('manager-dashboard');
      });
    }
  }

  function renderRosterList(approved, pending) {
    approved = approved || [];
    pending = pending || [];

    if (approved.length === 0 && pending.length === 0) {
      return '<div class="text-center text-muted" style="padding: 28px 16px;">' +
        '<div style="font-size: 1.8rem; margin-bottom: 6px;">🏥</div>' +
        '<div style="font-weight: 600; color: var(--color-text-main);">No Absences on this Date</div>' +
        '<p class="text-xs text-muted" style="margin-top: 2px;">All hospital departments scheduled for standard staffing.</p>' +
      '</div>';
    }

    var html = '<div class="flex flex-col gap-sm">';

    // Approved leaves section
    if (approved.length > 0) {
      html += '<div class="text-xs text-muted" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-teal-700); margin-bottom: 4px;">' +
        'Approved Absences (' + approved.length + ')' +
      '</div>';

      for (var i = 0; i < approved.length; i++) {
        var ol = approved[i];
        var olInitials = (ol.FullName || 'U').split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
        var sDate = window.NRSLJ_CONFIG.formatDate(ol.StartDate);
        var eDate = window.NRSLJ_CONFIG.formatDate(ol.EndDate);
        var isSingleDay = sDate === eDate;
        var dateRange = isSingleDay ? sDate : (sDate + ' &rarr; ' + eDate);

        html += '' +
          '<div class="staff-on-leave-card" style="box-shadow: none; border-color: var(--color-border); padding: 10px 12px;">' +
            '<div class="staff-avatar-placeholder" style="width: 36px; height: 36px; font-size: 0.85rem;">' + olInitials + '</div>' +
            '<div class="staff-on-leave-info">' +
              '<div class="flex justify-between items-center">' +
                '<strong style="color: var(--color-primary-900); font-size: 0.9rem;">' + escapeHtml(ol.FullName) + '</strong>' +
                '<span class="badge badge-active" style="font-size: 0.72rem; padding: 2px 8px;">' + escapeHtml(ol.LeaveTypeName || ol.LeaveType) + '</span>' +
              '</div>' +
              '<div class="text-xs text-muted" style="margin-top: 2px;">' +
                '<span>' + escapeHtml(ol.DepartmentName) + '</span>' +
                (ol.EmployeeId || ol.EmployeeID ? (' &bull; ID: ' + escapeHtml(ol.EmployeeId || ol.EmployeeID)) : '') +
              '</div>' +
              '<div class="flex justify-between items-center text-xs" style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed var(--color-border);">' +
                '<span style="color: var(--color-teal-700); font-weight: 600;">' + dateRange + '</span>' +
                '<span class="text-muted">' + (ol.DayPart || 'Full Day') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
    }

    // Pending requests section
    if (pending.length > 0) {
      html += '<div class="text-xs text-muted" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #b45309; margin: 10px 0 4px;">' +
        'Pending Requests for this Date (' + pending.length + ')' +
      '</div>';

      for (var j = 0; j < pending.length; j++) {
        var p = pending[j];
        var pInitials = (p.FullName || 'U').split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
        var psDate = window.NRSLJ_CONFIG.formatDate(p.StartDate);
        var peDate = window.NRSLJ_CONFIG.formatDate(p.EndDate);
        var pSingleDay = psDate === peDate;
        var pDateRange = pSingleDay ? psDate : (psDate + ' &rarr; ' + peDate);

        html += '' +
          '<div class="staff-on-leave-card" style="box-shadow: none; border: 1px solid #fde68a; background: #fffbeb; padding: 10px 12px;">' +
            '<div class="staff-avatar-placeholder" style="width: 36px; height: 36px; font-size: 0.85rem; background: #f59e0b; color: #fff;">' + pInitials + '</div>' +
            '<div class="staff-on-leave-info">' +
              '<div class="flex justify-between items-center">' +
                '<strong style="color: var(--color-primary-900); font-size: 0.9rem;">' + escapeHtml(p.FullName) + '</strong>' +
                '<span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.72rem; padding: 2px 8px; font-weight: 700;">' + (p.Status === 'PENDING_HR' ? 'Pending HR' : 'Pending Manager') + '</span>' +
              '</div>' +
              '<div class="text-xs text-muted" style="margin-top: 2px;">' +
                '<span>' + escapeHtml(p.DepartmentName) + '</span>' +
                (p.EmployeeId || p.EmployeeID ? (' &bull; ID: ' + escapeHtml(p.EmployeeId || p.EmployeeID)) : '') +
                ' &bull; ' + escapeHtml(p.LeaveTypeName || p.LeaveType) +
              '</div>' +
              '<div class="flex justify-between items-center text-xs" style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #fcd34d;">' +
                '<span style="color: #b45309; font-weight: 600;">' + pDateRange + ' (' + (p.RequestedDays || 1) + 'd)</span>' +
                '<button type="button" class="btn btn-outline btn-sm action-review-pending" data-id="' + p.RequestId + '" style="padding: 2px 8px; font-size: 0.72rem; background: #fff;">Review Request</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
    }

    html += '</div>';
    return html;
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    render: render
  };
})();
