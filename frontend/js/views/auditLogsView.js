/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Security & System Audit Logs View
 */

window.NRSLJ_AUDIT_LOGS_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || user.Role !== 'ADMIN') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading system audit trail...</p></div>';

    window.NRSLJ_API.call('getAuditLogs', { limit: 150 })
      .then(function(logs) {
        renderTable(container, logs || []);
      })
      .catch(function(err) {
        container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
          '<strong>Error loading audit logs:</strong> ' + escapeHtml(err.message) +
          '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_AUDIT_LOGS_VIEW.render(\'' + containerId + '\')">Retry</button>' +
          '</div>';
      });
  }

  function renderTable(container, logs) {
    var html = '' +
      '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">System Audit Trail</h1>' +
          '<p class="text-sm text-muted">Immutable log of security actions, approval transitions, and administrative operations</p>' +
        '</div>' +
        '<div class="flex gap-sm">' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-refresh-audit">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' +
            '<span>Refresh</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Search Filter
      '<div class="card mb-md">' +
        '<div class="card-body" style="padding: 14px 20px;">' +
          '<input type="text" id="audit-search-input" class="form-control" placeholder="Search by Actor, Action (e.g. LOGIN, APPROVAL), or Entity ID...">' +
        '</div>' +
      '</div>' +

      // Table Card
      '<div class="card">' +
        '<div class="table-responsive">' +
          '<table class="data-table table-responsive-cards">' +
            '<thead>' +
              '<tr>' +
                '<th>Audit ID</th>' +
                '<th>Timestamp</th>' +
                '<th>Actor</th>' +
                '<th>Action</th>' +
                '<th>Entity</th>' +
                '<th>Result</th>' +
                '<th>Details</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="audit-table-body">';

    html += renderRows(logs);

    html += '</tbody></table></div></div>';

    container.innerHTML = html;

    // Filter Logic
    var searchInput = document.getElementById('audit-search-input');
    var tbody = document.getElementById('audit-table-body');

    searchInput.addEventListener('input', function() {
      var q = searchInput.value.toLowerCase().trim();
      var filtered = logs.filter(function(l) {
        return !q ||
          (l.AuditID || '').toLowerCase().indexOf(q) !== -1 ||
          (l.ActorID || '').toLowerCase().indexOf(q) !== -1 ||
          (l.Action || '').toLowerCase().indexOf(q) !== -1 ||
          (l.EntityID || '').toLowerCase().indexOf(q) !== -1 ||
          (l.SanitizedDetails || '').toLowerCase().indexOf(q) !== -1;
      });
      tbody.innerHTML = renderRows(filtered);
      attachDetailEvents();
    });

    document.getElementById('btn-refresh-audit').addEventListener('click', function() {
      window.NRSLJ_AUDIT_LOGS_VIEW.render('main-content');
    });

    attachDetailEvents();
  }

  function renderRows(list) {
    if (list.length === 0) {
      return '<tr><td colspan="7" class="text-center text-muted" style="padding: 30px;">No audit records found.</td></tr>';
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var l = list[i];
      var isSuccess = l.Result === 'SUCCESS';

      html += '' +
        '<tr>' +
          '<td data-label="Audit ID"><code style="font-size: 0.8rem;">' + escapeHtml(l.AuditID) + '</code></td>' +
          '<td data-label="Timestamp" class="text-xs">' + (l.Timestamp ? l.Timestamp.replace('T', ' ').substring(0, 19) : '') + '</td>' +
          '<td data-label="Actor"><strong>' + escapeHtml(l.ActorID) + '</strong></td>' +
          '<td data-label="Action"><span class="badge ' + (isSuccess ? 'badge-active' : 'badge-rejected') + '">' + escapeHtml(l.Action) + '</span></td>' +
          '<td data-label="Entity">' + escapeHtml(l.EntityType) + (l.EntityID ? ' (' + escapeHtml(l.EntityID) + ')' : '') + '</td>' +
          '<td data-label="Result">' +
            '<span class="badge ' + (isSuccess ? 'badge-approved' : 'badge-rejected') + '">' + escapeHtml(l.Result) + '</span>' +
          '</td>' +
          '<td data-label="Details">' +
            '<button type="button" class="btn btn-outline btn-sm action-view-audit-detail" data-json="' + escapeHtml(l.SanitizedDetails || '{}') + '">Inspect</button>' +
          '</td>' +
        '</tr>';
    }
    return html;
  }

  function attachDetailEvents() {
    var btns = document.querySelectorAll('.action-view-audit-detail');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var rawJson = this.getAttribute('data-json');
        var pretty = rawJson;
        try {
          pretty = JSON.stringify(JSON.parse(rawJson), null, 2);
        } catch (e) {}

        window.NRSLJ_MODAL.open({
          title: 'Audit Event Details',
          body: '<pre style="background: var(--color-surface-hover); padding: 14px; border-radius: var(--radius-md); font-size: 0.8rem; overflow-x: auto; max-height: 350px;">' +
            escapeHtml(pretty) +
            '</pre>',
          footer: '<button type="button" class="btn btn-secondary btn-sm" onclick="window.NRSLJ_MODAL.close()">Close</button>'
        });
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
