/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Leave History & Request Tracking View
 */

window.NRSLJ_LEAVE_HISTORY_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user) {
      window.NRSLJ_STATE.setRoute('auth');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading leave history...</p></div>';

    window.NRSLJ_API.call('getMyLeaveRequests', {})
      .then(function(requests) {
        renderTable(container, user, requests || []);
      })
      .catch(function(err) {
        container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
          '<strong>Error loading leave history:</strong> ' + escapeHtml(err.message) +
          '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_LEAVE_HISTORY_VIEW.render(\'' + containerId + '\')">Retry</button>' +
          '</div>';
      });
  }

  function renderTable(container, user, requests) {
    var html = '' +
      '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">My Leave History</h1>' +
          '<p class="text-sm text-muted">Track your leave applications, approval progress, and decision notes</p>' +
        '</div>' +
        '<div class="flex gap-sm">' +
          '<button type="button" class="btn btn-primary btn-sm" id="history-apply-btn">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>' +
            '<span>New Request</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Filter Bar
      '<div class="card mb-md">' +
        '<div class="card-body" style="padding: 14px 20px;">' +
          '<div class="flex items-center gap-md flex-wrap">' +
            '<div style="flex: 1; min-width: 200px;">' +
              '<input type="text" id="history-search-input" class="form-control" placeholder="Search by reason or Request ID...">' +
            '</div>' +
            '<div style="width: 200px;">' +
              '<select id="history-status-filter" class="form-select">' +
                '<option value="ALL">All Statuses</option>' +
                '<option value="PENDING_MANAGER">Pending Manager</option>' +
                '<option value="PENDING_HR">Pending HR</option>' +
                '<option value="APPROVED">Approved</option>' +
                '<option value="REJECTED">Rejected</option>' +
                '<option value="CANCELLED">Cancelled</option>' +
                '<option value="WITHDRAWN">Withdrawn</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // History Table
      '<div class="card">' +
        '<div class="table-responsive">' +
          '<table class="data-table table-responsive-cards" id="history-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Request ID</th>' +
                '<th>Leave Type</th>' +
                '<th>Dates</th>' +
                '<th>Days</th>' +
                '<th>Reason</th>' +
                '<th>Status</th>' +
                '<th>Submitted</th>' +
                '<th>Actions</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="history-table-body">';

    html += renderTableRows(requests);

    html += '</tbody></table></div></div>';

    container.innerHTML = html;

    // Filter Logic
    var searchInput = document.getElementById('history-search-input');
    var statusSelect = document.getElementById('history-status-filter');
    var tbody = document.getElementById('history-table-body');

    function applyFilters() {
      var query = searchInput.value.toLowerCase().trim();
      var selectedStatus = statusSelect.value;

      var filtered = requests.filter(function(r) {
        var matchesQuery = !query ||
          r.RequestID.toLowerCase().indexOf(query) !== -1 ||
          (r.Reason || '').toLowerCase().indexOf(query) !== -1 ||
          (r.LeaveTypeName || '').toLowerCase().indexOf(query) !== -1;

        var matchesStatus = selectedStatus === 'ALL' || r.Status === selectedStatus;
        return matchesQuery && matchesStatus;
      });

      tbody.innerHTML = renderTableRows(filtered);
      attachRowEvents();
    }

    searchInput.addEventListener('input', applyFilters);
    statusSelect.addEventListener('change', applyFilters);

    document.getElementById('history-apply-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('apply-leave');
    });

    attachRowEvents();
  }

  function renderTableRows(list) {
    if (list.length === 0) {
      return '<tr><td colspan="8" class="text-center text-muted" style="padding: 40px;">No leave requests found matching your filter.</td></tr>';
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var badgeCls = 'badge-pending';
      if (r.Status === 'APPROVED') badgeCls = 'badge-approved';
      else if (r.Status === 'REJECTED') badgeCls = 'badge-rejected';
      else if (r.Status === 'CANCELLED' || r.Status === 'WITHDRAWN') badgeCls = 'badge-cancelled';

      var canCancel = (r.Status === 'PENDING_MANAGER' || r.Status === 'PENDING_HR');
      var canWithdraw = (r.Status === 'APPROVED');

      html += '' +
        '<tr data-reqid="' + r.RequestID + '">' +
          '<td data-label="Request ID"><strong style="color: var(--color-primary-900);">' + escapeHtml(r.RequestID) + '</strong></td>' +
          '<td data-label="Leave Type">' + escapeHtml(r.LeaveTypeName || r.LeaveTypeID) + '</td>' +
          '<td data-label="Dates">' + r.StartDate + (r.StartDate !== r.EndDate ? ' to ' + r.EndDate : '') + '</td>' +
          '<td data-label="Days">' + r.RequestedDays + ' (' + r.DayPart + ')</td>' +
          '<td data-label="Reason" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + escapeHtml(r.Reason) + '</td>' +
          '<td data-label="Status"><span class="badge ' + badgeCls + '">' + r.Status.replace('_', ' ') + '</span></td>' +
          '<td data-label="Submitted">' + (r.SubmittedAt ? r.SubmittedAt.substring(0, 10) : '') + '</td>' +
          '<td data-label="Actions">' +
            '<div class="flex gap-xs justify-end">' +
              '<button type="button" class="btn btn-outline btn-sm action-view-details" data-id="' + r.RequestID + '" title="View Details & Approval Progress">' +
                '<span>Details</span>' +
              '</button>' +
              (canCancel ? '<button type="button" class="btn btn-danger btn-sm action-cancel" data-id="' + r.RequestID + '">Cancel</button>' : '') +
              (canWithdraw ? '<button type="button" class="btn btn-outline btn-sm action-withdraw" data-id="' + r.RequestID + '" style="color: var(--color-danger); border-color: var(--color-danger);">Withdraw</button>' : '') +
            '</div>' +
          '</td>' +
        '</tr>';
    }
    return html;
  }

  function attachRowEvents() {
    // View Details buttons
    var detailBtns = document.querySelectorAll('.action-view-details');
    for (var i = 0; i < detailBtns.length; i++) {
      detailBtns[i].addEventListener('click', function() {
        var reqId = this.getAttribute('data-id');
        showRequestDetails(reqId);
      });
    }

    // Cancel buttons
    var cancelBtns = document.querySelectorAll('.action-cancel');
    for (var j = 0; j < cancelBtns.length; j++) {
      cancelBtns[j].addEventListener('click', function() {
        var reqId = this.getAttribute('data-id');
        if (confirm('Are you sure you want to cancel this pending leave request (' + reqId + ')?')) {
          window.NRSLJ_API.call('cancelLeaveRequest', { requestId: reqId })
            .then(function() {
              window.NRSLJ_TOAST.success('Leave request cancelled');
              window.NRSLJ_LEAVE_HISTORY_VIEW.render('main-content');
            })
            .catch(function(err) {
              window.NRSLJ_TOAST.error(err.message);
            });
        }
      });
    }

    // Withdraw buttons
    var withdrawBtns = document.querySelectorAll('.action-withdraw');
    for (var k = 0; k < withdrawBtns.length; k++) {
      withdrawBtns[k].addEventListener('click', function() {
        var reqId = this.getAttribute('data-id');
        var reason = prompt('Please state the reason for withdrawing this approved leave:');
        if (reason && reason.trim().length > 0) {
          window.NRSLJ_API.call('withdrawLeaveRequest', { requestId: reqId, reason: reason.trim() })
            .then(function() {
              window.NRSLJ_TOAST.success('Approved leave withdrawn and balance credited back');
              window.NRSLJ_LEAVE_HISTORY_VIEW.render('main-content');
            })
            .catch(function(err) {
              window.NRSLJ_TOAST.error(err.message);
            });
        }
      });
    }
  }

  function showRequestDetails(requestId) {
    window.NRSLJ_API.call('getApprovalHistory', { requestId: requestId })
      .then(function(history) {
        var historyHtml = '';
        if (!history || history.length === 0) {
          historyHtml = '<p class="text-sm text-muted">No approval transitions recorded yet (Request is awaiting review).</p>';
        } else {
          historyHtml = '<div class="flex flex-col gap-sm" style="margin-top: 10px;">';
          for (var i = 0; i < history.length; i++) {
            var h = history[i];
            var isApproved = h.Decision === 'APPROVE';
            var color = isApproved ? 'var(--color-success)' : 'var(--color-danger)';
            historyHtml += '' +
              '<div style="padding: 10px 14px; border-left: 4px solid ' + color + '; background: var(--color-surface-hover); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">' +
                '<div class="flex justify-between items-center text-xs mb-xs">' +
                  '<strong>Step ' + h.StepNumber + ': ' + h.ApproverRole + ' (' + escapeHtml(h.ApproverName || h.ApproverID) + ')</strong>' +
                  '<span class="text-muted">' + (h.ActionAt ? h.ActionAt.substring(0, 16).replace('T', ' ') : '') + '</span>' +
                '</div>' +
                '<div class="text-sm">Decision: <strong style="color: ' + color + ';">' + h.Decision + '</strong></div>' +
                (h.Comment ? '<div class="text-xs text-muted mt-xs">Comment: "' + escapeHtml(h.Comment) + '"</div>' : '') +
              '</div>';
          }
          historyHtml += '</div>';
        }

        window.NRSLJ_MODAL.open({
          title: 'Leave Request #' + requestId,
          body: '<div>' +
            '<h4 style="font-size: 1rem; margin-bottom: 8px;">Approval History & Workflow Timeline</h4>' +
            historyHtml +
            '</div>',
          footer: '<button type="button" class="btn btn-secondary btn-sm" onclick="window.NRSLJ_MODAL.close()">Close</button>'
        });
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error('Error fetching approval history: ' + err.message);
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
