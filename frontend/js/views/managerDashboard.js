/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Manager Dashboard & Approval Queue View
 */

window.NRSLJ_MANAGER_DASHBOARD = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || (user.Role !== 'MANAGER' && user.Role !== 'ADMIN')) {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading team approvals & calendar...</p></div>';

    Promise.all([
      window.NRSLJ_API.call('getPendingApprovals', {}),
      window.NRSLJ_API.call('getDashboardMetrics', {})
    ])
    .then(function(results) {
      var pending = results[0] || [];
      var metrics = results[1] || {};
      renderContent(container, user, pending, metrics);
    })
    .catch(function(err) {
      container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
        '<strong>Error loading manager dashboard:</strong> ' + escapeHtml(err.message) +
        '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_MANAGER_DASHBOARD.render(\'' + containerId + '\')">Retry</button>' +
        '</div>';
    });
  }

  function renderContent(container, user, pending, metrics) {
    var html = '' +
      '<div class="flex justify-between items-center mb-lg flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">Manager Approvals & Team Leave</h1>' +
          '<p class="text-sm text-muted">Review leave submissions for your assigned team & coordinate hospital staffing</p>' +
        '</div>' +
        '<div class="flex gap-sm">' +
          '<span class="badge badge-pending" style="font-size: 0.85rem; padding: 6px 14px;">' +
            pending.length + ' Pending Action' + (pending.length === 1 ? '' : 's') +
          '</span>' +
        '</div>' +
      '</div>' +

      // Top stats
      '<div class="grid grid-cols-3 gap-md mb-lg">' +
        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Awaiting Your Approval</div>' +
            '<div class="stat-value" style="color: var(--color-warning);">' + pending.length + '</div>' +
            '<div class="stat-subtitle">Action required</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-amber">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Staff on Leave Today</div>' +
            '<div class="stat-value" style="color: var(--color-teal-600);">' + (metrics.onLeaveTodayCount || 0) + '</div>' +
            '<div class="stat-subtitle">Active hospital absences</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-teal">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Approved Leaves</div>' +
            '<div class="stat-value" style="color: var(--color-success);">' + (metrics.approvedLeavesCount || 0) + '</div>' +
            '<div class="stat-subtitle">Year to date</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-green">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Pending Approvals Section (Expanded Cards)
      '<div class="card mb-lg">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Pending Leave Requests</div>' +
            '<div class="card-subtitle">Requests requiring your review and recommendation &bull; Full details and reasons</div>' +
          '</div>' +
          '<span class="badge badge-pending" style="font-size: 0.85rem; padding: 6px 14px; font-weight: 700;">' + pending.length + ' Pending</span>' +
        '</div>' +
        '<div class="card-body" style="padding: 20px;">';

    if (pending.length === 0) {
      html += '' +
        '<div class="text-center text-muted" style="padding: 40px 20px; background: var(--color-surface-hover); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">' +
          '<div style="font-size: 2rem; margin-bottom: 8px;">🎉</div>' +
          '<div style="font-weight: 600; font-size: 1rem; color: var(--color-text-main);">No Pending Leave Requests</div>' +
          '<p class="text-sm text-muted" style="margin-top: 4px;">All employee leave applications assigned to you have been reviewed.</p>' +
        '</div>';
    } else {
      html += '<div class="pending-requests-deck">';
      for (var i = 0; i < pending.length; i++) {
        var req = pending[i];
        var initials = (req.FullName || 'U').split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
        var sDate = window.NRSLJ_CONFIG.formatDate(req.StartDate);
        var eDate = window.NRSLJ_CONFIG.formatDate(req.EndDate);
        var isSingleDay = sDate === eDate;
        var dateDisplay = isSingleDay ? sDate : (sDate + ' &rarr; ' + eDate);

        html += '' +
          '<div class="pending-request-card">' +
            '<div class="pending-request-top">' +
              '<div class="flex items-center gap-md">' +
                '<div class="staff-avatar-placeholder">' + initials + '</div>' +
                '<div>' +
                  '<div style="font-weight: 700; font-size: 1.05rem; color: var(--color-primary-900);">' + escapeHtml(req.FullName) + '</div>' +
                  '<div class="text-xs text-muted" style="margin-top: 2px;">' +
                    '<span class="badge" style="background: var(--color-surface-hover); border: 1px solid var(--color-border); margin-right: 6px; font-weight: 600;">ID: ' + escapeHtml(req.EmployeeID) + '</span>' +
                    '<span>' + escapeHtml(req.DepartmentName) + ' &bull; ' + escapeHtml(req.DesignationName) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-sm">' +
                '<span class="badge badge-active" style="font-size: 0.85rem; padding: 5px 12px; font-weight: 600;">' + escapeHtml(req.LeaveTypeName) + '</span>' +
                '<span class="text-xs text-muted">Submitted ' + (req.SubmittedAt ? req.SubmittedAt.substring(0, 10) : '') + '</span>' +
              '</div>' +
            '</div>' +

            '<div class="pending-request-mid">' +
              '<div style="display: flex; flex-direction: column; gap: 8px;">' +
                '<div style="background: var(--color-surface-hover); border-radius: var(--radius-md); padding: 12px 14px; border: 1px solid var(--color-border);">' +
                  '<div class="text-xs text-muted" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Requested Dates</div>' +
                  '<div style="font-weight: 700; font-size: 1rem; color: var(--color-primary-900); margin-top: 4px;">' + dateDisplay + '</div>' +
                  '<div style="margin-top: 6px;">' +
                    '<span class="badge badge-teal" style="font-size: 0.8rem; font-weight: 700;">' + req.RequestedDays + ' Day(s) (' + req.DayPart + ')</span>' +
                  '</div>' +
                '</div>' +
                (req.EmergencyContact ? ('<div class="text-xs text-muted"><strong>Emergency Contact:</strong> ' + escapeHtml(req.EmergencyContact) + '</div>') : '') +
              '</div>' +

              '<div>' +
                '<div class="text-xs text-muted" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Reason for Leave Request:</div>' +
                '<div class="pending-reason-box">' +
                  escapeHtml(req.Reason || 'No reason provided.') +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="flex justify-between items-center" style="padding-top: 12px; border-top: 1px solid var(--color-border); flex-wrap: wrap; gap: 10px;">' +
              '<div class="text-xs text-muted">Request Ref: <code style="font-weight: 600; color: var(--color-primary-900);">' + escapeHtml(req.RequestID) + '</code></div>' +
              '<button type="button" class="btn btn-primary btn-sm review-req-btn" data-id="' + escapeHtml(req.RequestID) + '" style="padding: 8px 20px; font-weight: 600;">' +
                '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 6px;"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                '<span>Review & Decide</span>' +
              '</button>' +
            '</div>' +
          '</div>';
      }
      html += '</div>';
    }

    html += '</div></div>';

    // Staff Absences & Duty Roster (With Date Picker)
    html += '<div class="card" id="manager-roster-card">' +
      '<div class="card-header" style="display: flex; flex-direction: column; gap: 10px;">' +
        '<div class="flex justify-between items-center flex-wrap gap-xs">' +
          '<div>' +
            '<div class="card-title" style="display: flex; align-items: center; gap: 6px;">' +
              '<span>🏥 Hospital Staff Absences by Date</span>' +
            '</div>' +
            '<div class="card-subtitle" id="manager-roster-subtitle">' + new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</div>' +
          '</div>' +
          '<span id="manager-roster-badge" class="badge badge-teal" style="font-size: 0.85rem; padding: 6px 14px; font-weight: 700;">' +
            ((metrics.onLeaveToday ? metrics.onLeaveToday.length : 0) + (metrics.pendingOnLeaveToday ? metrics.pendingOnLeaveToday.length : 0)) + ' Total Absence(s)' +
          '</span>' +
        '</div>' +
        '<div class="flex items-center gap-xs flex-wrap" style="background: var(--color-surface-hover); padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">' +
          '<label for="manager-roster-datepicker" class="text-xs text-muted" style="font-weight: 600; white-space: nowrap;">📅 Select Date:</label>' +
          '<input type="date" id="manager-roster-datepicker" class="form-control" value="' + window.NRSLJ_CONFIG.getLocalDateString(0) + '" style="padding: 3px 8px; font-size: 0.85rem; height: 32px; max-width: 150px; font-weight: 600; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">' +
          '<div class="flex gap-xs" style="margin-left: auto;">' +
            '<button type="button" class="btn btn-outline btn-sm manager-roster-quick-btn" data-day="0" style="padding: 3px 10px; font-size: 0.78rem;">Today</button>' +
            '<button type="button" class="btn btn-outline btn-sm manager-roster-quick-btn" data-day="1" style="padding: 3px 10px; font-size: 0.78rem;">Tomorrow</button>' +
            '<button type="button" class="btn btn-outline btn-sm manager-roster-quick-btn" data-day="-1" style="padding: 3px 10px; font-size: 0.78rem;">Yesterday</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card-body" id="manager-roster-body" style="padding: 20px;">' +
        renderManagerRosterList(metrics.onLeaveToday || [], metrics.pendingOnLeaveToday || []) +
      '</div></div>';

    container.innerHTML = html;

    // Attach Review & Decide button handlers
    var reviewBtns = container.querySelectorAll('.review-req-btn');
    for (var k = 0; k < reviewBtns.length; k++) {
      reviewBtns[k].addEventListener('click', function() {
        var reqId = this.getAttribute('data-id');
        var reqData = null;
        for (var r = 0; r < pending.length; r++) {
          if (pending[r].RequestID === reqId) {
            reqData = pending[r];
            break;
          }
        }
        if (reqData) {
          openDecisionModal(reqData);
        } else {
          window.NRSLJ_TOAST.error('Leave request record not found for ' + reqId);
        }
      });
    }

    // Manager Absences Date Picker
    var datePicker = document.getElementById('manager-roster-datepicker');
    var rosterBody = document.getElementById('manager-roster-body');
    var rosterSubtitle = document.getElementById('manager-roster-subtitle');
    var rosterBadge = document.getElementById('manager-roster-badge');

    function loadRosterForDate(dateStr) {
      if (!dateStr || !rosterBody) return;
      rosterBody.innerHTML = '<div class="text-center" style="padding: 30px;"><span class="spinner"></span><p class="text-xs text-muted mt-xs">Fetching staff roster for ' + dateStr + '...</p></div>';

      var dateObj = new Date(dateStr + 'T00:00:00');
      if (!isNaN(dateObj.getTime()) && rosterSubtitle) {
        rosterSubtitle.textContent = 'Active absences &bull; ' + dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }

      window.NRSLJ_API.call('getStaffOnLeaveByDate', { date: dateStr })
        .then(function(res) {
          rosterBody.innerHTML = renderManagerRosterList(res.approvedLeaves || [], res.pendingLeaves || []);
          var appCount = res.approvedCount || 0;
          var pendCount = res.pendingCount || 0;
          var total = appCount + pendCount;
          if (rosterBadge) {
            rosterBadge.textContent = total + ' Total Absence(s)' + (pendCount > 0 ? (' (' + pendCount + ' Pending)') : '');
          }
          attachRosterPendingReviewHandlers(container, res.pendingLeaves || []);
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

    var quickBtns = container.querySelectorAll('.manager-roster-quick-btn');
    for (var q = 0; q < quickBtns.length; q++) {
      quickBtns[q].addEventListener('click', function() {
        var offset = parseInt(this.getAttribute('data-day'), 10) || 0;
        var targetDate = window.NRSLJ_CONFIG.getLocalDateString(offset);
        if (datePicker) datePicker.value = targetDate;
        loadRosterForDate(targetDate);
      });
    }

    attachRosterPendingReviewHandlers(container, metrics.pendingOnLeaveToday || []);
  }

  function attachRosterPendingReviewHandlers(container, pendingList) {
    var btns = container.querySelectorAll('.review-roster-pending-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var reqId = this.getAttribute('data-id');
        var found = null;
        for (var p = 0; p < pendingList.length; p++) {
          if (pendingList[p].RequestId === reqId || pendingList[p].RequestID === reqId) {
            found = pendingList[p];
            break;
          }
        }
        if (found) {
          // Normalize properties for modal
          if (!found.RequestID) found.RequestID = found.RequestId;
          openDecisionModal(found);
        } else {
          // Fallback: look in main pending list or open by id
          var allPendingCards = container.querySelectorAll('.review-req-btn[data-id="' + reqId + '"]');
          if (allPendingCards.length > 0) {
            allPendingCards[0].click();
          } else {
            window.NRSLJ_TOAST.info('Viewing leave request #' + reqId);
            openDecisionModal({ RequestID: reqId, FullName: 'Staff Member', EmployeeID: 'EMP', DepartmentName: 'Department', DesignationName: 'Role', LeaveTypeName: 'Leave', StartDate: '', EndDate: '', RequestedDays: 1, DayPart: 'FULL', Reason: 'Review pending' });
          }
        }
      });
    }
  }

  function renderManagerRosterList(approved, pending) {
    approved = approved || [];
    pending = pending || [];

    if (approved.length === 0 && pending.length === 0) {
      return '' +
        '<div class="text-center text-muted" style="padding: 36px 20px; background: var(--color-surface-hover); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">' +
          '<div style="font-size: 1.8rem; margin-bottom: 6px;">🏥</div>' +
          '<div style="font-weight: 600; color: var(--color-text-main);">All Hospital Staff on Duty for this Date</div>' +
          '<p class="text-sm text-muted" style="margin-top: 4px;">No approved absences or pending leave applications recorded for this date.</p>' +
        '</div>';
    }

    var html = '';

    // Approved leaves grid
    if (approved.length > 0) {
      html += '<div class="text-xs text-muted" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-teal-700); margin-bottom: 8px;">' +
        'Approved Absences (' + approved.length + ')' +
      '</div>';
      html += '<div class="staff-on-leave-grid" style="margin-bottom: 16px;">';
      for (var j = 0; j < approved.length; j++) {
        var ol = approved[j];
        var olInitials = (ol.FullName || 'U').split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
        var sDate = window.NRSLJ_CONFIG.formatDate(ol.StartDate);
        var eDate = window.NRSLJ_CONFIG.formatDate(ol.EndDate);
        var isSingleDay = sDate === eDate;
        var dateRange = isSingleDay ? sDate : (sDate + ' to ' + eDate);

        html += '' +
          '<div class="staff-on-leave-card">' +
            '<div class="staff-avatar-placeholder">' + olInitials + '</div>' +
            '<div class="staff-on-leave-info">' +
              '<div class="flex justify-between items-center" style="gap: 8px;">' +
                '<strong style="color: var(--color-primary-900); font-size: 0.95rem;">' + escapeHtml(ol.FullName) + '</strong>' +
                '<span class="badge badge-active" style="font-size: 0.75rem;">' + escapeHtml(ol.LeaveTypeName || ol.LeaveType) + '</span>' +
              '</div>' +
              '<div class="text-xs text-muted" style="margin-top: 2px;">' +
                '<span>' + escapeHtml(ol.DepartmentName) + '</span>' +
                (ol.EmployeeId || ol.EmployeeID ? (' &bull; ID: ' + escapeHtml(ol.EmployeeId || ol.EmployeeID)) : '') +
              '</div>' +
              '<div class="flex justify-between items-center text-xs" style="margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--color-border);">' +
                '<span style="color: var(--color-teal-700); font-weight: 600;">' + dateRange + '</span>' +
                '<span class="text-muted">' + (ol.DayPart || 'Full Day') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
      html += '</div>';
    }

    // Pending requests section
    if (pending.length > 0) {
      html += '<div class="text-xs text-muted" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #b45309; margin-bottom: 8px;">' +
        'Pending Leave Requests for this Date (' + pending.length + ')' +
      '</div>';
      html += '<div class="staff-on-leave-grid">';
      for (var p = 0; p < pending.length; p++) {
        var pl = pending[p];
        var pInitials = (pl.FullName || 'U').split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
        var psDate = window.NRSLJ_CONFIG.formatDate(pl.StartDate);
        var peDate = window.NRSLJ_CONFIG.formatDate(pl.EndDate);
        var pSingle = psDate === peDate;
        var pRange = pSingle ? psDate : (psDate + ' to ' + peDate);

        html += '' +
          '<div class="staff-on-leave-card" style="border: 1px solid #fde68a; background: #fffbeb;">' +
            '<div class="staff-avatar-placeholder" style="background: #f59e0b; color: #fff;">' + pInitials + '</div>' +
            '<div class="staff-on-leave-info">' +
              '<div class="flex justify-between items-center" style="gap: 8px;">' +
                '<strong style="color: var(--color-primary-900); font-size: 0.95rem;">' + escapeHtml(pl.FullName) + '</strong>' +
                '<span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.72rem; padding: 2px 8px; font-weight: 700;">' + (pl.Status === 'PENDING_HR' ? 'Pending HR' : 'Pending Manager') + '</span>' +
              '</div>' +
              '<div class="text-xs text-muted" style="margin-top: 2px;">' +
                '<span>' + escapeHtml(pl.DepartmentName) + '</span>' +
                (pl.EmployeeId || pl.EmployeeID ? (' &bull; ID: ' + escapeHtml(pl.EmployeeId || pl.EmployeeID)) : '') +
                ' &bull; ' + escapeHtml(pl.LeaveTypeName || pl.LeaveType) +
              '</div>' +
              '<div class="flex justify-between items-center text-xs" style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #fcd34d;">' +
                '<span style="color: #b45309; font-weight: 600;">' + pRange + ' (' + (pl.RequestedDays || 1) + 'd)</span>' +
                '<button type="button" class="btn btn-outline btn-sm review-roster-pending-btn" data-id="' + (pl.RequestId || pl.RequestID) + '" style="padding: 2px 8px; font-size: 0.72rem; background: #fff;">Review & Decide</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
      html += '</div>';
    }

    return html;
  }

  function openDecisionModal(req) {
    var bodyHtml = '' +
      '<div style="margin-bottom: 16px;">' +
        '<div style="background-color: var(--color-surface-hover); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 16px;" class="grid grid-cols-2 gap-sm text-sm">' +
          '<div><span class="text-muted text-xs">Employee:</span><br><strong>' + escapeHtml(req.FullName) + '</strong> (' + escapeHtml(req.EmployeeID) + ')</div>' +
          '<div><span class="text-muted text-xs">Department / Role:</span><br>' + escapeHtml(req.DepartmentName) + ' &bull; ' + escapeHtml(req.DesignationName) + '</div>' +
          '<div><span class="text-muted text-xs">Leave Category:</span><br><strong>' + escapeHtml(req.LeaveTypeName) + '</strong></div>' +
          '<div><span class="text-muted text-xs">Requested Dates:</span><br><strong>' + window.NRSLJ_CONFIG.formatDate(req.StartDate) + (req.StartDate !== req.EndDate ? (' to ' + window.NRSLJ_CONFIG.formatDate(req.EndDate)) : '') + ' (' + req.RequestedDays + ' days, ' + req.DayPart + ')</strong></div>' +
        '</div>' +

        '<div style="margin-bottom: 16px;">' +
          '<label class="form-label">Employee Reason:</label>' +
          '<div style="background: var(--color-surface); border: 1px solid var(--color-border); padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.9rem;">' +
            escapeHtml(req.Reason) +
          '</div>' +
        '</div>' +

        (req.AttachmentReference ? '<div style="margin-bottom: 16px;"><span class="text-xs text-muted">Supporting Document / Reference:</span><br><code>' + escapeHtml(req.AttachmentReference) + '</code></div>' : '') +

        '<div class="form-group">' +
          '<label class="form-label" for="decision-comment">Decision Comment / Justification:</label>' +
          '<textarea id="decision-comment" class="form-textarea" placeholder="Enter comments or reason (Mandatory if rejecting)..."></textarea>' +
          '<span class="form-hint">Note: If rejecting, a clear administrative reason must be recorded.</span>' +
        '</div>' +
      '</div>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-danger" id="modal-reject-btn">Reject Request</button>' +
      '<button type="button" class="btn btn-success" id="modal-approve-btn">' +
        '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
        '<span>Approve Request</span>' +
      '</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Review Leave Request #' + req.RequestID,
      body: bodyHtml,
      footer: footerHtml
    });

    var commentInput = dialog.querySelector('#decision-comment');
    var approveBtn = dialog.querySelector('#modal-approve-btn');
    var rejectBtn = dialog.querySelector('#modal-reject-btn');

    approveBtn.addEventListener('click', function() {
      processDecision(req.RequestID, 'APPROVE', commentInput.value.trim(), approveBtn, rejectBtn);
    });

    rejectBtn.addEventListener('click', function() {
      var comment = commentInput.value.trim();
      if (comment.length < 3) {
        window.NRSLJ_TOAST.error('A rejection reason is mandatory (at least 3 characters)');
        commentInput.focus();
        return;
      }
      processDecision(req.RequestID, 'REJECT', comment, rejectBtn, approveBtn);
    });
  }

  function processDecision(requestId, decision, comment, activeBtn, otherBtn) {
    activeBtn.disabled = true;
    otherBtn.disabled = true;
    activeBtn.innerHTML = '<span class="spinner"></span> Processing...';

    window.NRSLJ_API.call('processApprovalDecision', {
      requestId: requestId,
      decision: decision,
      comment: comment
    })
    .then(function(res) {
      window.NRSLJ_TOAST.success('Request ' + requestId + ' marked as ' + res.newStatus);
      window.NRSLJ_MODAL.close();
      window.NRSLJ_MANAGER_DASHBOARD.render('main-content');
    })
    .catch(function(err) {
      window.NRSLJ_TOAST.error(err.message);
      activeBtn.disabled = false;
      otherBtn.disabled = false;
      activeBtn.innerHTML = decision === 'APPROVE' ? 'Approve Request' : 'Reject Request';
    });
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
