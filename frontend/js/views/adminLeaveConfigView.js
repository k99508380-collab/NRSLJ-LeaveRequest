/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Leave Types, Policies, Manual Balance Adjustment & Holidays View
 */

window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || user.Role !== 'ADMIN') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading leave policies and hospital configuration...</p></div>';

    Promise.all([
      window.NRSLJ_API.call('getLeaveTypes', { onlyActive: false }),
      window.NRSLJ_API.call('getLeavePolicies', {}),
      window.NRSLJ_API.call('getHolidays', {}),
      window.NRSLJ_API.call('getAllEmployees', { filters: { status: 'ACTIVE' } })
    ])
    .then(function(results) {
      var types = results[0] || [];
      var policies = results[1] || [];
      var holidays = results[2] || [];
      var employees = results[3] || [];
      renderContent(container, types, policies, holidays, employees);
    })
    .catch(function(err) {
      container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
        '<strong>Error loading leave configuration:</strong> ' + escapeHtml(err.message) +
        '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW.render(\'' + containerId + '\')">Retry</button>' +
        '</div>';
    });
  }

  function renderContent(container, types, policies, holidays, employees) {
    var policyMap = {};
    for (var p = 0; p < policies.length; p++) {
      policyMap[policies[p].LeaveTypeID] = policies[p];
    }

    var html = '' +
      '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">Leave Configuration & Policies</h1>' +
          '<p class="text-sm text-muted">Configure hospital leave quotas, deduction rules, holidays & staff balance adjustments</p>' +
        '</div>' +
        '<div class="flex gap-sm">' +
          '<button type="button" class="btn btn-navy btn-sm" id="btn-manual-adjust">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>' +
            '<span>Manual Balance Adjustment</span>' +
          '</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-add-leave-type">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>' +
            '<span>Add Leave Category</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // 1. Leave Categories & Policy Section - Expanded Clear View
      '<div class="mb-xl">' +
        '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
          '<div>' +
            '<h2 style="color: var(--color-primary-900); font-size: 1.25rem;">Configured Leave Types & Rules</h2>' +
            '<p class="text-sm text-muted">Annual allowances, notice requirements &amp; weekend/holiday counting rules for all hospital units</p>' +
          '</div>' +
        '</div>' +

        // Expanded Policy Cards Grid
        '<div class="policy-card-grid mb-lg">';

    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      var pol = policyMap[t.LeaveTypeID] || {};
      var isActive = t.IsActive === true || t.IsActive === 'TRUE' || t.IsActive === 'true';
      var weekendText = pol.WeekendsPolicy === 'EXCLUDE_SUNDAYS' ? 'Sundays Excluded' : (pol.WeekendsPolicy === 'EXCLUDE_WEEKENDS' ? 'Sat & Sun Excluded' : 'All Days Counted');
      var holidayText = pol.HolidaysPolicy === 'EXCLUDE_HOLIDAYS' ? 'Hospital Holidays Excluded' : 'Holidays Counted';

      html += '' +
        '<div class="policy-expanded-card">' +
          '<div class="policy-expanded-header">' +
            '<div>' +
              '<h3 style="font-size: 1.15rem; color: var(--color-primary-900); margin-bottom: 4px;">' + escapeHtml(t.LeaveTypeName) + '</h3>' +
              '<span class="badge badge-role-employee text-xs">' + escapeHtml(t.LeaveTypeID) + '</span>' +
            '</div>' +
            '<span class="badge ' + (isActive ? 'badge-approved' : 'badge-rejected') + '">' + (isActive ? 'Active Category' : 'Disabled') + '</span>' +
          '</div>' +

          '<div class="policy-expanded-body">' +
            '<p class="text-sm text-muted" style="margin: 0; min-height: 40px;">' + escapeHtml(t.Description || 'Standard hospital leave category.') + '</p>' +

            // 4 Key Metrics Box
            '<div class="policy-metrics-grid">' +
              '<div class="policy-metric-box">' +
                '<span class="policy-metric-label">Annual Quota</span>' +
                '<span class="policy-metric-val" style="color: var(--color-teal-600);">' + (pol.AnnualAllocation || 0) + ' <small class="text-xs text-muted" style="font-weight: 500;">days/yr</small></span>' +
              '</div>' +
              '<div class="policy-metric-box">' +
                '<span class="policy-metric-label">Max Duration</span>' +
                '<span class="policy-metric-val">' + (pol.MaximumDuration || 30) + ' <small class="text-xs text-muted" style="font-weight: 500;">days/req</small></span>' +
              '</div>' +
              '<div class="policy-metric-box">' +
                '<span class="policy-metric-label">Advance Notice</span>' +
                '<span class="policy-metric-val">' + (pol.NoticePeriod || 0) + ' <small class="text-xs text-muted" style="font-weight: 500;">day(s)</small></span>' +
              '</div>' +
              '<div class="policy-metric-box">' +
                '<span class="policy-metric-label">Balance Required</span>' +
                '<span class="policy-metric-val" style="font-size: 1.05rem;">' + (t.RequiresBalance ? '<span style="color: var(--color-success);">&check; Yes</span>' : '<span style="color: var(--color-text-muted);">&cross; No (LOP)</span>') + '</span>' +
              '</div>' +
            '</div>' +

            // Weekend & Holiday Counting Rules Chips
            '<div>' +
              '<div class="text-xs font-semibold text-muted mb-xs" style="text-transform: uppercase;">Deduction &amp; Counting Policies:</div>' +
              '<div class="policy-chips-row">' +
                '<span class="policy-chip policy-chip-teal" title="Weekend counting policy">' +
                  '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
                  '<span>' + weekendText + '</span>' +
                '</span>' +
                '<span class="policy-chip policy-chip-teal" title="Hospital holiday deduction policy">' +
                  '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 3v4M19 3v4M2 11h20M7 16h2M15 16h2"/></svg>' +
                  '<span>' + holidayText + '</span>' +
                '</span>' +
                '<span class="policy-chip" title="Accrual schedule">' +
                  '<span>Accrual: ' + (pol.AccrualRule || 'ANNUAL_UPFRONT').replace('_', ' ') + '</span>' +
                '</span>' +
                '<span class="policy-chip" title="Carry-forward policy">' +
                  '<span>Carry: ' + (pol.CarryForwardRule || 'NO_CARRY_FORWARD').replace(/_/g, ' ') + '</span>' +
                '</span>' +
              '</div>' +
            '</div>' +

            '<div style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--color-border);" class="flex justify-between items-center">' +
              '<span class="text-xs text-muted">ID: <code>' + t.LeaveTypeID + '</code></span>' +
              '<button type="button" class="btn btn-outline btn-sm action-edit-policy" data-type-id="' + t.LeaveTypeID + '" data-policy-id="' + (pol.PolicyID || '') + '" data-alloc="' + (pol.AnnualAllocation || 0) + '" data-max="' + (pol.MaximumDuration || 30) + '" data-notice="' + (pol.NoticePeriod || 0) + '" data-name="' + escapeHtml(t.LeaveTypeName) + '">' +
                '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                '<span>Edit Policy &amp; Rules</span>' +
              '</button>' +
            '</div>' +

          '</div>' +
        '</div>';
    }

    html += '</div></div>' +

      // 2. Hospital Holidays Calendar Section
      '<div class="card">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Hospital Gazetted Holidays</div>' +
            '<div class="card-subtitle">Hospital holidays excluded from employee leave deductions</div>' +
          '</div>' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-add-holiday">+ Add Holiday</button>' +
        '</div>' +
        '<div class="table-responsive">' +
          '<table class="data-table table-responsive-cards">' +
            '<thead>' +
              '<tr>' +
                '<th>Holiday Name</th>' +
                '<th>Date</th>' +
                '<th>Applicable Department</th>' +
                '<th>Actions</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>';

    if (holidays.length === 0) {
      html += '<tr><td colspan="4" class="text-center text-muted" style="padding: 24px;">No holidays configured for this calendar year.</td></tr>';
    } else {
      for (var h = 0; h < holidays.length; h++) {
        var hol = holidays[h];
        html += '' +
          '<tr>' +
            '<td data-label="Holiday Name"><strong>' + escapeHtml(hol.HolidayName) + '</strong></td>' +
            '<td data-label="Date"><code>' + String(hol.HolidayDate).substring(0, 10) + '</code></td>' +
            '<td data-label="Department">' + escapeHtml(hol.ApplicableDepartment || 'ALL') + '</td>' +
            '<td data-label="Actions">' +
              '<button type="button" class="btn btn-danger btn-sm action-del-holiday" data-id="' + hol.HolidayID + '">Delete</button>' +
            '</td>' +
          '</tr>';
      }
    }

    html += '</tbody></table></div></div>';

    container.innerHTML = html;

    // Attach Action Buttons
    document.getElementById('btn-manual-adjust').addEventListener('click', function() {
      openManualAdjustModal(employees, types);
    });

    document.getElementById('btn-add-leave-type').addEventListener('click', function() {
      openAddLeaveTypeModal();
    });

    document.getElementById('btn-add-holiday').addEventListener('click', function() {
      openAddHolidayModal();
    });

    // Delete Holiday
    var delBtns = container.querySelectorAll('.action-del-holiday');
    for (var d = 0; d < delBtns.length; d++) {
      delBtns[d].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        if (confirm('Delete this hospital holiday?')) {
          window.NRSLJ_API.call('deleteHoliday', { id: id })
            .then(function() {
              window.NRSLJ_TOAST.success('Holiday deleted');
              window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW.render('main-content');
            })
            .catch(function(err) {
              window.NRSLJ_TOAST.error(err.message);
            });
        }
      });
    }

    // Edit Policy
    var editPolicyBtns = container.querySelectorAll('.action-edit-policy');
    for (var ep = 0; ep < editPolicyBtns.length; ep++) {
      editPolicyBtns[ep].addEventListener('click', function() {
        var pid = this.getAttribute('data-policy-id');
        var name = this.getAttribute('data-name');
        var alloc = this.getAttribute('data-alloc');
        var max = this.getAttribute('data-max');
        var notice = this.getAttribute('data-notice');
        openEditPolicyModal(pid, name, alloc, max, notice);
      });
    }
  }

  function openManualAdjustModal(employees, types) {
    var empOptions = employees.map(function(e) {
      return '<option value="' + e.EmployeeID + '">' + escapeHtml(e.FullName) + ' (' + e.EmployeeID + ')</option>';
    }).join('');

    var typeOptions = types.map(function(t) {
      return '<option value="' + t.LeaveTypeID + '">' + escapeHtml(t.LeaveTypeName) + '</option>';
    }).join('');

    var bodyHtml = '' +
      '<form id="manual-adjust-form">' +
        '<div class="alert alert-warning text-xs">' +
          '<span>Every balance adjustment is permanently recorded in the immutable audit ledger with your administrator ID and timestamp.</span>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="adj-emp">Target Employee <span class="required">*</span></label>' +
          '<select id="adj-emp" class="form-select" required>' +
            '<option value="">-- Select Staff Member --</option>' +
            empOptions +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="adj-type">Leave Category <span class="required">*</span></label>' +
          '<select id="adj-type" class="form-select" required>' +
            '<option value="">-- Select Category --</option>' +
            typeOptions +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="adj-amount">Adjustment Amount (Days) <span class="required">*</span></label>' +
          '<input type="number" id="adj-amount" class="form-control" step="0.5" placeholder="e.g. +2 to credit, -1 to debit" required>' +
          '<span class="form-hint">Enter positive number to add leave days; negative number to deduct.</span>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="adj-reason">Mandatory Ledger Reason <span class="required">*</span></label>' +
          '<textarea id="adj-reason" class="form-textarea" placeholder="State the administrative justification for this balance adjustment..." required minlength="5"></textarea>' +
        '</div>' +
      '</form>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="confirm-adjust-btn">Apply Adjustment</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Manual Leave Balance Adjustment',
      body: bodyHtml,
      footer: footerHtml
    });

    dialog.querySelector('#confirm-adjust-btn').addEventListener('click', function() {
      var emp = dialog.querySelector('#adj-emp').value;
      var tid = dialog.querySelector('#adj-type').value;
      var amt = parseFloat(dialog.querySelector('#adj-amount').value);
      var reason = dialog.querySelector('#adj-reason').value.trim();

      if (!emp || !tid || isNaN(amt) || amt === 0 || reason.length < 5) {
        window.NRSLJ_TOAST.error('Please fill all required fields correctly (minimum 5 character reason)');
        return;
      }

      var btn = dialog.querySelector('#confirm-adjust-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Applying...';

      window.NRSLJ_API.call('manualAdjustBalance', {
        employeeId: emp,
        leaveTypeId: tid,
        amount: amt,
        reason: reason
      })
      .then(function() {
        window.NRSLJ_TOAST.success('Leave balance adjusted successfully');
        window.NRSLJ_MODAL.close();
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error(err.message);
        btn.disabled = false;
        btn.innerHTML = '<span>Apply Adjustment</span>';
      });
    });
  }

  function openAddLeaveTypeModal() {
    var bodyHtml = '' +
      '<form id="add-lt-form">' +
        '<div class="form-group">' +
          '<label class="form-label" for="lt-name">Leave Category Name <span class="required">*</span></label>' +
          '<input type="text" id="lt-name" class="form-control" placeholder="e.g. Maternity Leave, Paternity Leave" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="lt-desc">Description</label>' +
          '<input type="text" id="lt-desc" class="form-control" placeholder="Brief policy description">' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="lt-alloc">Annual Allocation (Days) <span class="required">*</span></label>' +
            '<input type="number" id="lt-alloc" class="form-control" value="12" required min="0">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="lt-max">Max Duration per Request <span class="required">*</span></label>' +
            '<input type="number" id="lt-max" class="form-control" value="15" required min="1">' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="flex items-center gap-sm text-sm" style="cursor: pointer;">' +
            '<input type="checkbox" id="lt-reqbal" checked> <span>Requires balance deduction (uncheck for LOP)</span>' +
          '</label>' +
        '</div>' +
      '</form>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="save-new-lt-btn">Create Category</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Add New Leave Category',
      body: bodyHtml,
      footer: footerHtml
    });

    dialog.querySelector('#save-new-lt-btn').addEventListener('click', function() {
      var name = dialog.querySelector('#lt-name').value.trim();
      var desc = dialog.querySelector('#lt-desc').value.trim();
      var alloc = parseFloat(dialog.querySelector('#lt-alloc').value) || 0;
      var max = parseFloat(dialog.querySelector('#lt-max').value) || 30;
      var reqBal = dialog.querySelector('#lt-reqbal').checked;

      if (!name) {
        window.NRSLJ_TOAST.error('Category name is required');
        return;
      }

      window.NRSLJ_API.call('addLeaveType', {
        LeaveTypeName: name,
        Description: desc,
        AnnualAllocation: alloc,
        MaximumDuration: max,
        RequiresBalance: reqBal
      })
      .then(function() {
        window.NRSLJ_TOAST.success('Leave category created');
        window.NRSLJ_MODAL.close();
        window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW.render('main-content');
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error(err.message);
      });
    });
  }

  function openEditPolicyModal(policyId, name, alloc, max, notice) {
    var bodyHtml = '' +
      '<form id="edit-pol-form">' +
        '<div class="form-group">' +
          '<label class="form-label" for="ep-alloc">Annual Allocation (Days)</label>' +
          '<input type="number" id="ep-alloc" class="form-control" value="' + alloc + '" required min="0">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ep-max">Maximum Duration per Request (Days)</label>' +
          '<input type="number" id="ep-max" class="form-control" value="' + max + '" required min="1">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ep-notice">Notice Period (Days in Advance)</label>' +
          '<input type="number" id="ep-notice" class="form-control" value="' + notice + '" required min="0">' +
        '</div>' +
      '</form>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="save-ep-btn">Save Policy</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Edit Policy: ' + name,
      body: bodyHtml,
      footer: footerHtml
    });

    dialog.querySelector('#save-ep-btn').addEventListener('click', function() {
      var newAlloc = parseFloat(dialog.querySelector('#ep-alloc').value);
      var newMax = parseFloat(dialog.querySelector('#ep-max').value);
      var newNotice = parseFloat(dialog.querySelector('#ep-notice').value);

      window.NRSLJ_API.call('updateLeavePolicy', {
        id: policyId,
        AnnualAllocation: newAlloc,
        MaximumDuration: newMax,
        NoticePeriod: newNotice
      })
      .then(function() {
        window.NRSLJ_TOAST.success('Policy updated');
        window.NRSLJ_MODAL.close();
        window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW.render('main-content');
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error(err.message);
      });
    });
  }

  function openAddHolidayModal() {
    var todayStr = new Date().toISOString().substring(0, 10);
    var bodyHtml = '' +
      '<form id="add-hol-form">' +
        '<div class="form-group">' +
          '<label class="form-label" for="hol-name">Holiday Name <span class="required">*</span></label>' +
          '<input type="text" id="hol-name" class="form-control" placeholder="e.g. Tamil New Year" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="hol-date">Date <span class="required">*</span></label>' +
          '<input type="date" id="hol-date" class="form-control" value="' + todayStr + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="hol-dept">Applicable Department</label>' +
          '<select id="hol-dept" class="form-select">' +
            '<option value="ALL">All Departments (Hospital-Wide)</option>' +
          '</select>' +
        '</div>' +
      '</form>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="save-hol-btn">Add Holiday</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Add Hospital Holiday',
      body: bodyHtml,
      footer: footerHtml
    });

    dialog.querySelector('#save-hol-btn').addEventListener('click', function() {
      var name = dialog.querySelector('#hol-name').value.trim();
      var date = dialog.querySelector('#hol-date').value;
      var dept = dialog.querySelector('#hol-dept').value;

      if (!name || !date) {
        window.NRSLJ_TOAST.error('Name and Date are required');
        return;
      }

      window.NRSLJ_API.call('addHoliday', { name: name, date: date, applicableDept: dept })
        .then(function() {
          window.NRSLJ_TOAST.success('Holiday added');
          window.NRSLJ_MODAL.close();
          window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW.render('main-content');
        })
        .catch(function(err) {
          window.NRSLJ_TOAST.error(err.message);
        });
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
