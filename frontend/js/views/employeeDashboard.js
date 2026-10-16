/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Dashboard View
 */

window.NRSLJ_EMPLOYEE_DASHBOARD = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user) {
      window.NRSLJ_STATE.setRoute('auth');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading your leave summary...</p></div>';

    // Parallel fetch balances and recent requests
    Promise.all([
      window.NRSLJ_API.call('getEmployeeBalances', { leaveYear: new Date().getFullYear() }),
      window.NRSLJ_API.call('getMyLeaveRequests', {})
    ])
    .then(function(results) {
      var balances = results[0] || [];
      var requests = results[1] || [];
      renderContent(container, user, balances, requests);
    })
    .catch(function(err) {
      container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
        '<strong>Error loading dashboard:</strong> ' + escapeHtml(err.message) +
        '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_EMPLOYEE_DASHBOARD.render(\'' + containerId + '\')">Retry</button>' +
        '</div>';
    });
  }

  function renderContent(container, user, balances, requests) {
    var totalAllocated = 0;
    var totalUsed = 0;
    var totalPending = 0;
    var totalAvailable = 0;

    for (var i = 0; i < balances.length; i++) {
      var b = balances[i];
      if (b.RequiresBalance) {
        totalAllocated += Number(b.Allocated) || 0;
        totalUsed += Number(b.Used) || 0;
        totalPending += Number(b.PendingDays) || 0;
        totalAvailable += Number(b.AvailableBalance) || 0;
      }
    }

    var html = '' +
      // Welcome banner
      '<div class="flex justify-between items-center mb-lg flex-wrap gap-md">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.5rem;">Welcome, ' + escapeHtml(user.FullName || user.Username) + '</h1>' +
          '<p class="text-sm text-muted" style="margin-top: 2px;">' +
            '<span>Employee ID: <strong>' + escapeHtml(user.EmployeeID) + '</strong></span> &bull; ' +
            '<span>Role: <strong class="badge badge-role-' + user.Role.toLowerCase() + '">' + user.Role + '</strong></span>' +
          '</p>' +
        '</div>' +
        '<div class="flex gap-sm flex-wrap">' +
          '<button type="button" class="btn btn-primary" id="dash-apply-btn">' +
            '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>' +
            '<span>Apply for Leave</span>' +
          '</button>' +
          '<button type="button" class="btn btn-outline" id="dash-history-btn">' +
            '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
            '<span>View History</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Top Metric Cards
      '<div class="grid grid-cols-4 gap-md mb-lg">' +
        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Total Allocated</div>' +
            '<div class="stat-value">' + totalAllocated + ' <span class="text-sm text-muted">days</span></div>' +
            '<div class="stat-subtitle">Calendar Year ' + new Date().getFullYear() + '</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-navy">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Available Balance</div>' +
            '<div class="stat-value" style="color: var(--color-teal-600);">' + totalAvailable + ' <span class="text-sm text-muted">days</span></div>' +
            '<div class="stat-subtitle">Remaining balance</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-teal">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Pending Approval</div>' +
            '<div class="stat-value" style="color: var(--color-warning);">' + totalPending + ' <span class="text-sm text-muted">days</span></div>' +
            '<div class="stat-subtitle">In manager / HR queue</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-amber">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
          '</div>' +
        '</div>' +

        '<div class="stat-card">' +
          '<div>' +
            '<div class="stat-title">Leaves Taken</div>' +
            '<div class="stat-value">' + totalUsed + ' <span class="text-sm text-muted">days</span></div>' +
            '<div class="stat-subtitle">Approved & utilized</div>' +
          '</div>' +
          '<div class="stat-icon stat-icon-green">' +
            '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Balance Breakdown by Leave Type
      '<div class="mb-lg">' +
        '<h2 class="mb-md" style="font-size: 1.15rem; color: var(--color-primary-900);">Leave Type Balances</h2>' +
        '<div class="grid grid-cols-3 gap-md">';

    for (var j = 0; j < balances.length; j++) {
      var bal = balances[j];
      var alloc = Number(bal.Allocated) || 0;
      var used = Number(bal.Used) || 0;
      var avail = Number(bal.AvailableBalance) || 0;
      var pend = Number(bal.PendingDays) || 0;
      var pct = alloc > 0 ? Math.min(100, Math.round((used / alloc) * 100)) : 0;

      html += '' +
        '<div class="card balance-card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title" style="font-size: 1rem;">' + escapeHtml(bal.LeaveTypeName) + '</div>' +
              '<div class="card-subtitle text-xs">' + escapeHtml(bal.Description || 'Standard leave') + '</div>' +
            '</div>' +
            '<div class="badge badge-active">' + avail + ' Left</div>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="flex justify-between items-center text-sm mb-xs">' +
              '<span class="text-muted">Used: <strong>' + used + '</strong> / ' + alloc + ' d</span>' +
              (pend > 0 ? '<span class="text-warning text-xs font-semibold">' + pend + ' d pending</span>' : '') +
            '</div>' +
            '<div class="balance-progress-bar">' +
              '<div class="balance-progress-fill" style="width: ' + pct + '%;"></div>' +
            '</div>' +
            '<div class="flex justify-between text-xs text-muted mt-sm">' +
              '<span>Notice: ' + bal.NoticePeriod + ' day(s)</span>' +
              '<span>Max: ' + bal.MaximumDuration + ' d/request</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    html += '</div></div>' +

      // Recent Activity Table
      '<div class="card mb-lg">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Recent Leave Requests</div>' +
            '<div class="card-subtitle">Your latest leave applications and decision updates</div>' +
          '</div>' +
          '<button type="button" class="btn btn-outline btn-sm" id="recent-view-all-btn">View All</button>' +
        '</div>' +
        '<div class="table-responsive">' +
          '<table class="data-table table-responsive-cards">' +
            '<thead>' +
              '<tr>' +
                '<th>Request ID</th>' +
                '<th>Leave Type</th>' +
                '<th>Dates</th>' +
                '<th>Days</th>' +
                '<th>Reason</th>' +
                '<th>Status</th>' +
                '<th>Submitted</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>';

    if (requests.length === 0) {
      html += '<tr><td colspan="7" class="text-center text-muted" style="padding: 30px;">You have not submitted any leave requests yet. Click "Apply for Leave" above to create one.</td></tr>';
    } else {
      var recent = requests.slice(0, 5);
      for (var k = 0; k < recent.length; k++) {
        var r = recent[k];
        var badgeCls = 'badge-pending';
        if (r.Status === 'APPROVED') badgeCls = 'badge-approved';
        else if (r.Status === 'REJECTED') badgeCls = 'badge-rejected';
        else if (r.Status === 'CANCELLED' || r.Status === 'WITHDRAWN') badgeCls = 'badge-cancelled';

        html += '' +
          '<tr>' +
            '<td data-label="Request ID"><strong style="color: var(--color-primary-900);">' + escapeHtml(r.RequestID) + '</strong></td>' +
            '<td data-label="Leave Type">' + escapeHtml(r.LeaveTypeName || r.LeaveTypeID) + '</td>' +
            '<td data-label="Dates">' + r.StartDate + (r.StartDate !== r.EndDate ? ' to ' + r.EndDate : '') + '</td>' +
            '<td data-label="Days">' + r.RequestedDays + ' (' + r.DayPart + ')</td>' +
            '<td data-label="Reason" style="max-width: 260px; word-break: break-word;" title="' + escapeHtml(r.Reason) + '">' + escapeHtml(r.Reason) + '</td>' +
            '<td data-label="Status"><span class="badge ' + badgeCls + '">' + r.Status.replace('_', ' ') + '</span></td>' +
            '<td data-label="Submitted">' + (r.SubmittedAt ? r.SubmittedAt.substring(0, 10) : '') + '</td>' +
          '</tr>';
      }
    }

    html += '</tbody></table></div></div>';

    container.innerHTML = html;

    // Attach Click Events
    document.getElementById('dash-apply-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('apply-leave');
    });

    document.getElementById('dash-history-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('leave-history');
    });

    var viewAllBtn = document.getElementById('recent-view-all-btn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', function() {
        window.NRSLJ_STATE.setRoute('leave-history');
      });
    }
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
