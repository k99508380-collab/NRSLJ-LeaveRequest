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

      // Pending Approvals Table Card
      '<div class="card mb-lg">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Pending Leave Requests</div>' +
            '<div class="card-subtitle">Requests requiring your review and recommendation</div>' +
          '</div>' +
        '</div>' +
        '<div class="table-responsive">' +
          '<table class="data-table table-responsive-cards">' +
            '<thead>' +
              '<tr>' +
                '<th>Employee</th>' +
                '<th>Department / Role</th>' +
                '<th>Leave Type</th>' +
                '<th>Dates & Duration</th>' +
                '<th>Reason</th>' +
                '<th>Submitted</th>' +
                '<th>Review Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>';

    if (pending.length === 0) {
      html += '<tr><td colspan="7" class="text-center text-muted" style="padding: 40px;">No pending leave requests awaiting your action. Good job!</td></tr>';
    } else {
      for (var i = 0; i < pending.length; i++) {
        var req = pending[i];
        html += '' +
          '<tr>' +
            '<td data-label="Employee">' +
              '<strong>' + escapeHtml(req.FullName) + '</strong><br>' +
              '<span class="text-xs text-muted">ID: ' + escapeHtml(req.EmployeeID) + '</span>' +
            '</td>' +
            '<td data-label="Department / Role">' +
              '<span>' + escapeHtml(req.DepartmentName) + '</span><br>' +
              '<span class="text-xs text-muted">' + escapeHtml(req.DesignationName) + '</span>' +
            '</td>' +
            '<td data-label="Leave Type">' +
              '<span class="badge badge-active">' + escapeHtml(req.LeaveTypeName) + '</span>' +
            '</td>' +
            '<td data-label="Dates & Duration">' +
              '<span>' + req.StartDate + (req.StartDate !== req.EndDate ? ' to ' + req.EndDate : '') + '</span><br>' +
              '<strong class="text-xs" style="color: var(--color-teal-700);">' + req.RequestedDays + ' day(s) (' + req.DayPart + ')</strong>' +
            '</td>' +
            '<td data-label="Reason" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="' + escapeHtml(req.Reason) + '">' +
              escapeHtml(req.Reason) +
            '</td>' +
            '<td data-label="Submitted">' + (req.SubmittedAt ? req.SubmittedAt.substring(0, 10) : '') + '</td>' +
            '<td data-label="Review Action">' +
              '<button type="button" class="btn btn-primary btn-sm review-req-btn" data-json="' + escapeHtml(JSON.stringify(req)) + '">' +
                '<span>Review & Decide</span>' +
              '</button>' +
            '</td>' +
          '</tr>';
      }
    }

    html += '</tbody></table></div></div>';

    // Staff On Leave Today Section
    html += '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">Hospital Staff on Leave Today</div>' +
          '<div class="card-subtitle">Active absences across departments for duty roster planning</div>' +
        '</div>' +
      '</div>' +
      '<div class="table-responsive">' +
        '<table class="data-table table-responsive-cards">' +
          '<thead>' +
            '<tr>' +
              '<th>Employee</th>' +
              '<th>Department</th>' +
              '<th>Leave Type</th>' +
              '<th>Duration</th>' +
              '<th>Day Part</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    var onLeave = metrics.onLeaveToday || [];
    if (onLeave.length === 0) {
      html += '<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">No hospital staff on approved leave today.</td></tr>';
    } else {
      for (var j = 0; j < onLeave.length; j++) {
        var ol = onLeave[j];
        html += '' +
          '<tr>' +
            '<td data-label="Employee"><strong>' + escapeHtml(ol.FullName) + '</strong> (' + escapeHtml(ol.EmployeeId) + ')</td>' +
            '<td data-label="Department">' + escapeHtml(ol.DepartmentName) + '</td>' +
            '<td data-label="Leave Type"><span class="badge badge-active">' + escapeHtml(ol.LeaveType) + '</span></td>' +
            '<td data-label="Duration">' + ol.StartDate + ' to ' + ol.EndDate + '</td>' +
            '<td data-label="Day Part">' + ol.DayPart + '</td>' +
          '</tr>';
      }
    }

    html += '</tbody></table></div></div>';

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
