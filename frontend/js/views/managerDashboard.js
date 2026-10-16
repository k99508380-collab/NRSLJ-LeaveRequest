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
        var isSingleDay = req.StartDate === req.EndDate;
        var dateDisplay = isSingleDay ? req.StartDate : (req.StartDate + ' &rarr; ' + req.EndDate);

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
              '<button type="button" class="btn btn-primary btn-sm review-req-btn" data-json="' + escapeHtml(JSON.stringify(req)) + '" style="padding: 8px 20px; font-weight: 600;">' +
                '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 6px;"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                '<span>Review & Decide</span>' +
              '</button>' +
            '</div>' +
          '</div>';
      }
      html += '</div>';
    }

    html += '</div></div>';

    // Staff On Leave Today Section (Expanded Cards)
    html += '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">Hospital Staff on Leave Today</div>' +
          '<div class="card-subtitle">Active absences across departments for duty roster planning &bull; ' + new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</div>' +
        '</div>' +
        '<span class="badge badge-teal" style="font-size: 0.85rem; padding: 6px 14px; font-weight: 700;">' + (metrics.onLeaveToday ? metrics.onLeaveToday.length : 0) + ' On Leave</span>' +
      '</div>' +
      '<div class="card-body" style="padding: 20px;">';

    var onLeave = metrics.onLeaveToday || [];
    if (onLeave.length === 0) {
      html += '' +
        '<div class="text-center text-muted" style="padding: 36px 20px; background: var(--color-surface-hover); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">' +
          '<div style="font-size: 1.8rem; margin-bottom: 6px;">🏥</div>' +
          '<div style="font-weight: 600; color: var(--color-text-main);">All Hospital Staff on Duty Today</div>' +
          '<p class="text-sm text-muted" style="margin-top: 4px;">No approved leaves recorded for today. Full staffing across all hospital departments.</p>' +
        '</div>';
    } else {
      html += '<div class="staff-on-leave-grid">';
      for (var j = 0; j < onLeave.length; j++) {
        var ol = onLeave[j];
        var olInitials = (ol.FullName || 'U').split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
        var isSingleDay = ol.StartDate === ol.EndDate;
        var dateRange = isSingleDay ? ol.StartDate : (ol.StartDate + ' to ' + ol.EndDate);

        html += '' +
          '<div class="staff-on-leave-card">' +
            '<div class="staff-avatar-placeholder">' + olInitials + '</div>' +
            '<div class="staff-on-leave-info">' +
              '<div class="flex justify-between items-center" style="gap: 8px;">' +
                '<strong style="color: var(--color-primary-900); font-size: 0.95rem;">' + escapeHtml(ol.FullName) + '</strong>' +
                '<span class="badge badge-active" style="font-size: 0.75rem;">' + escapeHtml(ol.LeaveType) + '</span>' +
              '</div>' +
              '<div class="text-xs text-muted" style="margin-top: 2px;">' +
                '<span>' + escapeHtml(ol.DepartmentName) + '</span>' +
                (ol.EmployeeId ? (' &bull; ID: ' + escapeHtml(ol.EmployeeId)) : '') +
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

    html += '</div></div>';

    container.innerHTML = html;

    // Attach Review & Decide button handlers
    var reviewBtns = container.querySelectorAll('.review-req-btn');
    for (var k = 0; k < reviewBtns.length; k++) {
      reviewBtns[k].addEventListener('click', function() {
        var reqData = JSON.parse(this.getAttribute('data-json'));
        openDecisionModal(reqData);
      });
    }
  }

  function openDecisionModal(req) {
    var bodyHtml = '' +
      '<div style="margin-bottom: 16px;">' +
        '<div style="background-color: var(--color-surface-hover); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 16px;" class="grid grid-cols-2 gap-sm text-sm">' +
          '<div><span class="text-muted text-xs">Employee:</span><br><strong>' + escapeHtml(req.FullName) + '</strong> (' + escapeHtml(req.EmployeeID) + ')</div>' +
          '<div><span class="text-muted text-xs">Department / Role:</span><br>' + escapeHtml(req.DepartmentName) + ' &bull; ' + escapeHtml(req.DesignationName) + '</div>' +
          '<div><span class="text-muted text-xs">Leave Category:</span><br><strong>' + escapeHtml(req.LeaveTypeName) + '</strong></div>' +
          '<div><span class="text-muted text-xs">Requested Dates:</span><br><strong>' + req.StartDate + ' to ' + req.EndDate + ' (' + req.RequestedDays + ' days, ' + req.DayPart + ')</strong></div>' +
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
    var div = document.createElement('div');
    div.innerText = text || '';
    return div.innerHTML;
  }

  return {
    render: render
  };
})();
