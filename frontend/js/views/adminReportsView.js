/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Reports, Hospital Leave Calendar & Safe CSV Export View
 */

window.NRSLJ_ADMIN_REPORTS_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || user.Role !== 'ADMIN') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading hospital calendar and report generators...</p></div>';

    var now = new Date();
    var curMonth = now.getMonth() + 1;
    var curYear = now.getFullYear();

    Promise.all([
      window.NRSLJ_API.call('getLeaveCalendar', { month: curMonth, year: curYear }),
      window.NRSLJ_API.call('getDepartments', {}),
      window.NRSLJ_API.call('getDashboardMetrics', {})
    ])
    .then(function(results) {
      var events = results[0] || [];
      var depts = results[1] || [];
      var metrics = results[2] || {};
      renderReports(container, events, depts, metrics, curMonth, curYear);
    })
    .catch(function(err) {
      container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
        '<strong>Error loading reports:</strong> ' + escapeHtml(err.message) +
        '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_ADMIN_REPORTS_VIEW.render(\'' + containerId + '\')">Retry</button>' +
        '</div>';
    });
  }

  function renderReports(container, events, depts, metrics, curMonth, curYear) {
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var html = '' +
      '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">Hospital Leave Calendar & Reports</h1>' +
          '<p class="text-sm text-muted">NRSLJ Speciality Hospitals, Musiri &bull; Monthly duty calendar & auditable CSV exports</p>' +
        '</div>' +
        '<div class="flex gap-sm flex-wrap">' +
          '<button type="button" class="btn btn-navy btn-sm" id="btn-export-leaves">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>' +
            '<span>Export All Leaves CSV</span>' +
          '</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-export-balances">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>' +
            '<span>Export Balances CSV</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Calendar Filter & View Card
      '<div class="card mb-lg">' +
        '<div class="card-header flex justify-between items-center flex-wrap gap-sm">' +
          '<div>' +
            '<div class="card-title">' + monthNames[curMonth - 1] + ' ' + curYear + ' Hospital Attendance</div>' +
            '<div class="card-subtitle">Approved absences scheduled for this month</div>' +
          '</div>' +
          '<div class="flex gap-sm items-center">' +
            '<select id="cal-dept-filter" class="form-select form-select-sm" style="width: 200px;">' +
              '<option value="">All Departments</option>';

    for (var d = 0; d < depts.length; d++) {
      html += '<option value="' + depts[d].DepartmentID + '">' + escapeHtml(depts[d].DepartmentName) + '</option>';
    }

    html += '</select></div></div>' +
        '<div class="card-body">' +
          renderCalendarGrid(curYear, curMonth, events) +
        '</div>' +
      '</div>' +

      // Data Export Suite Card
      '<div class="card">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Hospital CSV Data Export Suite</div>' +
            '<div class="card-subtitle">Download sanitized, formula-injection protected reports for payroll and records</div>' +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="grid grid-cols-3 gap-md">' +

            '<div style="border: 1px solid var(--color-border); padding: 16px; border-radius: var(--radius-md);">' +
              '<h4 style="font-size: 1rem; margin-bottom: 6px;">Leave Transactions Export</h4>' +
              '<p class="text-xs text-muted mb-md">Complete export of all leave applications, statuses, timestamps and approved days.</p>' +
              '<button type="button" class="btn btn-outline btn-sm w-full" id="export-trans-btn">Download Leave History CSV</button>' +
            '</div>' +

            '<div style="border: 1px solid var(--color-border); padding: 16px; border-radius: var(--radius-md);">' +
              '<h4 style="font-size: 1rem; margin-bottom: 6px;">Staff Leave Balances Export</h4>' +
              '<p class="text-xs text-muted mb-md">Current allocated, used, adjusted, and available leave balances for all hospital staff.</p>' +
              '<button type="button" class="btn btn-outline btn-sm w-full" id="export-bal-btn">Download Balances CSV</button>' +
            '</div>' +

            '<div style="border: 1px solid var(--color-border); padding: 16px; border-radius: var(--radius-md);">' +
              '<h4 style="font-size: 1rem; margin-bottom: 6px;">System Audit Trail Export</h4>' +
              '<p class="text-xs text-muted mb-md">Security and compliance audit logs of administrative actions and status updates.</p>' +
              '<button type="button" class="btn btn-outline btn-sm w-full" id="export-audit-btn">Download Audit Logs CSV</button>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // Attach CSV Export triggers
    document.getElementById('btn-export-leaves').addEventListener('click', function() { triggerExport('LEAVE_REQUESTS'); });
    document.getElementById('export-trans-btn').addEventListener('click', function() { triggerExport('LEAVE_REQUESTS'); });
    document.getElementById('btn-export-balances').addEventListener('click', function() { triggerExport('EMPLOYEE_BALANCES'); });
    document.getElementById('export-bal-btn').addEventListener('click', function() { triggerExport('EMPLOYEE_BALANCES'); });
    document.getElementById('export-audit-btn').addEventListener('click', function() { triggerExport('AUDIT_LOGS'); });

    // Calendar Dept Filter
    document.getElementById('cal-dept-filter').addEventListener('change', function() {
      var deptId = this.value;
      window.NRSLJ_API.call('getLeaveCalendar', { month: curMonth, year: curYear, departmentId: deptId })
        .then(function(newEvents) {
          var calContainer = container.querySelector('.card-body');
          if (calContainer) {
            calContainer.innerHTML = renderCalendarGrid(curYear, curMonth, newEvents);
          }
        });
    });
  }

  function renderCalendarGrid(year, month, events) {
    var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var firstDay = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();

    var html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">';

    // Day headers
    for (var d = 0; d < 7; d++) {
      html += '<div style="text-align: center; font-weight: 700; font-size: 0.8rem; color: var(--color-text-muted); padding: 8px 0; background: var(--color-surface-hover); border-radius: var(--radius-sm);">' + daysOfWeek[d] + '</div>';
    }

    // Leading blanks
    for (var b = 0; b < firstDay; b++) {
      html += '<div style="min-height: 80px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed var(--color-border); opacity: 0.4;"></div>';
    }

    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      var dayStr = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
      var dayEvents = events.filter(function(e) {
        return dayStr >= e.startDate && dayStr <= e.endDate;
      });

      var isToday = new Date().toISOString().substring(0, 10) === dayStr;

      html += '<div style="min-height: 85px; background: var(--color-surface); border: 1px solid ' + (isToday ? 'var(--color-teal-600)' : 'var(--color-border)') + '; border-radius: var(--radius-sm); padding: 6px; display: flex; flex-direction: column;">' +
        '<div class="flex justify-between items-center mb-xs">' +
          '<strong style="font-size: 0.8rem;' + (isToday ? ' color: var(--color-teal-600);' : '') + '">' + day + '</strong>' +
          (dayEvents.length > 0 ? '<span class="badge badge-active" style="font-size: 0.65rem; padding: 1px 5px;">' + dayEvents.length + '</span>' : '') +
        '</div>' +
        '<div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">';

      for (var ev = 0; ev < dayEvents.length; ev++) {
        var eItem = dayEvents[ev];
        html += '<div style="background: var(--color-teal-50); border: 1px solid var(--color-teal-100); border-radius: 3px; padding: 2px 4px; font-size: 0.7rem; color: var(--color-teal-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title="' + escapeHtml(eItem.employeeName) + ' (' + escapeHtml(eItem.leaveType) + ')">' +
          '<strong>' + escapeHtml(eItem.employeeName) + '</strong> (' + escapeHtml(eItem.departmentName) + ')' +
          '</div>';
      }

      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  function triggerExport(reportType) {
    window.NRSLJ_TOAST.info('Preparing ' + reportType + ' export...');

    window.NRSLJ_API.call('exportReportCsv', { reportType: reportType })
      .then(function(res) {
        if (!res || !res.content) {
          throw new Error('Export returned empty content');
        }

        // Trigger safe client-side file download
        var blob = new Blob([res.content], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = res.filename || 'NRSLJ_Report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.NRSLJ_TOAST.success('Report downloaded: ' + a.download);
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error('Export failed: ' + err.message);
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
