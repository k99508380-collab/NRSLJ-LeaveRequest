/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Directory & Registration Approval Queue View
 */

window.NRSLJ_ADMIN_EMPLOYEES_VIEW = (function() {
  function render(containerId, initialTab) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || user.Role !== 'ADMIN') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    var activeTab = initialTab || (state.currentRoute === 'admin-registrations' ? 'pending' : 'all');

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading employee records and registration queue...</p></div>';

    Promise.all([
      window.NRSLJ_API.call('getAllEmployees', {}),
      window.NRSLJ_API.call('getPendingRegistrations', {}),
      window.NRSLJ_API.call('getDepartments', {}),
      window.NRSLJ_API.call('getDesignations', {}),
      window.NRSLJ_API.call('getManagersList', {})
    ])
    .then(function(results) {
      var allEmps = results[0] || [];
      var pendingRegs = results[1] || [];
      var depts = results[2] || [];
      var desigs = results[3] || [];
      var managers = results[4] || [];

      renderView(container, allEmps, pendingRegs, depts, desigs, managers, activeTab);
    })
    .catch(function(err) {
      container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
        '<strong>Error loading employee data:</strong> ' + escapeHtml(err.message) +
        '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render(\'' + containerId + '\')">Retry</button>' +
        '</div>';
    });
  }

  function renderView(container, allEmps, pendingRegs, depts, desigs, managers, activeTab) {
    var deptMap = {};
    for (var d = 0; d < depts.length; d++) deptMap[depts[d].DepartmentID] = depts[d].DepartmentName;
    var desigMap = {};
    for (var dg = 0; dg < desigs.length; dg++) desigMap[desigs[dg].DesignationID] = desigs[dg].DesignationName;

    var html = '' +
      '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
        '<div>' +
          '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">Staff & Registration Management</h1>' +
          '<p class="text-sm text-muted">Manage hospital employee accounts, approve new registrations, and assign roles</p>' +
        '</div>' +
      '</div>' +

      // Tab switcher
      '<div class="tabs-nav">' +
        '<button type="button" class="tab-btn' + (activeTab === 'pending' ? ' active' : '') + '" id="tab-btn-pending">' +
          'Pending Registrations <span class="badge badge-pending" style="margin-left: 6px;">' + pendingRegs.length + '</span>' +
        '</button>' +
        '<button type="button" class="tab-btn' + (activeTab === 'all' ? ' active' : '') + '" id="tab-btn-all">' +
          'All Employees <span class="badge badge-active" style="margin-left: 6px;">' + allEmps.length + '</span>' +
        '</button>' +
      '</div>' +

      // 1. PENDING REGISTRATIONS PANE
      '<div id="pane-pending"' + (activeTab !== 'pending' ? ' class="hidden"' : '') + '>' +
        '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">Staff Awaiting Registration Approval</div>' +
              '<div class="card-subtitle">Review signup submissions, assign required Department, Designation, Manager & Role</div>' +
            '</div>' +
          '</div>' +
          '<div class="table-responsive">' +
            '<table class="data-table table-responsive-cards">' +
              '<thead>' +
                '<tr>' +
                  '<th>Employee ID</th>' +
                  '<th>Full Name</th>' +
                  '<th>Username</th>' +
                  '<th>Phone Number</th>' +
                  '<th>Submitted At</th>' +
                  '<th>Actions</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>';

    if (pendingRegs.length === 0) {
      html += '<tr><td colspan="6" class="text-center text-muted" style="padding: 40px;">No pending registrations in queue. All employee accounts are processed.</td></tr>';
    } else {
      for (var p = 0; p < pendingRegs.length; p++) {
        var pr = pendingRegs[p];
        html += '' +
          '<tr>' +
            '<td data-label="Employee ID"><strong style="color: var(--color-primary-900);">' + escapeHtml(pr.EmployeeID) + '</strong></td>' +
            '<td data-label="Full Name">' + escapeHtml(pr.FullName) + '</td>' +
            '<td data-label="Username"><code>' + escapeHtml(pr.Username) + '</code></td>' +
            '<td data-label="Phone Number">' + escapeHtml(pr.Phone) + '</td>' +
            '<td data-label="Submitted At">' + (pr.CreatedAt ? pr.CreatedAt.substring(0, 10) : '') + '</td>' +
            '<td data-label="Actions">' +
              '<div class="flex gap-xs justify-end">' +
                '<button type="button" class="btn btn-primary btn-sm action-approve-reg" data-json="' + escapeHtml(JSON.stringify(pr)) + '">Approve & Assign</button>' +
                '<button type="button" class="btn btn-danger btn-sm action-reject-reg" data-id="' + pr.EmployeeID + '">Reject</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
      }
    }

    html += '</tbody></table></div></div></div>' +

      // 2. ALL EMPLOYEES PANE
      '<div id="pane-all"' + (activeTab !== 'all' ? ' class="hidden"' : '') + '>' +
        // Filter card
        '<div class="card mb-md">' +
          '<div class="card-body" style="padding: 14px 20px;">' +
            '<div class="flex items-center gap-md flex-wrap">' +
              '<div style="flex: 1; min-width: 220px;">' +
                '<input type="text" id="emp-search-input" class="form-control" placeholder="Search by name, ID, phone, or username...">' +
              '</div>' +
              '<div style="width: 180px;">' +
                '<select id="emp-dept-filter" class="form-select">' +
                  '<option value="ALL">All Departments</option>';

    for (var d2 = 0; d2 < depts.length; d2++) {
      html += '<option value="' + depts[d2].DepartmentID + '">' + escapeHtml(depts[d2].DepartmentName) + '</option>';
    }

    html += '</select></div>' +
              '<div style="width: 150px;">' +
                '<select id="emp-role-filter" class="form-select">' +
                  '<option value="ALL">All Roles</option>' +
                  '<option value="EMPLOYEE">Employee</option>' +
                  '<option value="MANAGER">Manager</option>' +
                  '<option value="ADMIN">Admin</option>' +
                '</select>' +
              '</div>' +
              '<div style="width: 150px;">' +
                '<select id="emp-status-filter" class="form-select">' +
                  '<option value="ALL">All Statuses</option>' +
                  '<option value="ACTIVE">Active</option>' +
                  '<option value="INACTIVE">Deactivated</option>' +
                  '<option value="PENDING">Pending</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Employees table
        '<div class="card">' +
          '<div class="table-responsive">' +
            '<table class="data-table table-responsive-cards" id="all-emp-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Employee</th>' +
                  '<th>Department</th>' +
                  '<th>Designation</th>' +
                  '<th>Reporting Manager</th>' +
                  '<th>Role</th>' +
                  '<th>Status</th>' +
                  '<th>Actions</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody id="all-emp-table-body">';

    html += renderEmpRows(allEmps, deptMap, desigMap);

    html += '</tbody></table></div></div></div>';

    container.innerHTML = html;

    // Tab Switch Events
    var tabPending = document.getElementById('tab-btn-pending');
    var tabAll = document.getElementById('tab-btn-all');
    var panePending = document.getElementById('pane-pending');
    var paneAll = document.getElementById('pane-all');

    tabPending.addEventListener('click', function() {
      tabPending.classList.add('active');
      tabAll.classList.remove('active');
      panePending.classList.remove('hidden');
      paneAll.classList.add('hidden');
    });

    tabAll.addEventListener('click', function() {
      tabAll.classList.add('active');
      tabPending.classList.remove('active');
      paneAll.classList.remove('hidden');
      panePending.classList.add('hidden');
    });

    // Employee Table Filter Logic
    var searchInput = document.getElementById('emp-search-input');
    var deptFilter = document.getElementById('emp-dept-filter');
    var roleFilter = document.getElementById('emp-role-filter');
    var statusFilter = document.getElementById('emp-status-filter');
    var empTbody = document.getElementById('all-emp-table-body');

    function filterEmployees() {
      var q = searchInput.value.toLowerCase().trim();
      var dept = deptFilter.value;
      var role = roleFilter.value;
      var status = statusFilter.value;

      var filtered = allEmps.filter(function(e) {
        var matchQ = !q ||
          (e.FullName || '').toLowerCase().indexOf(q) !== -1 ||
          (e.EmployeeID || '').toLowerCase().indexOf(q) !== -1 ||
          (e.Username || '').toLowerCase().indexOf(q) !== -1 ||
          (e.Phone || '').indexOf(q) !== -1;

        var matchDept = dept === 'ALL' || e.DepartmentID === dept;
        var matchRole = role === 'ALL' || e.Role === role;
        var matchStatus = status === 'ALL' || e.AccountStatus === status;

        return matchQ && matchDept && matchRole && matchStatus;
      });

      empTbody.innerHTML = renderEmpRows(filtered, deptMap, desigMap);
      attachEmpActions(depts, desigs, managers);
    }

    searchInput.addEventListener('input', filterEmployees);
    deptFilter.addEventListener('change', filterEmployees);
    roleFilter.addEventListener('change', filterEmployees);
    statusFilter.addEventListener('change', filterEmployees);

    attachPendingActions(depts, desigs, managers);
    attachEmpActions(depts, desigs, managers);
  }

  function renderEmpRows(list, deptMap, desigMap) {
    if (list.length === 0) {
      return '<tr><td colspan="7" class="text-center text-muted" style="padding: 40px;">No employees found matching filter criteria.</td></tr>';
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var isActive = e.AccountStatus === 'ACTIVE';

      html += '' +
        '<tr>' +
          '<td data-label="Employee">' +
            '<strong>' + escapeHtml(e.FullName) + '</strong><br>' +
            '<span class="text-xs text-muted">ID: ' + escapeHtml(e.EmployeeID) + ' &bull; ' + escapeHtml(e.Phone) + '</span>' +
          '</td>' +
          '<td data-label="Department">' + escapeHtml(deptMap[e.DepartmentID] || 'Unassigned') + '</td>' +
          '<td data-label="Designation">' + escapeHtml(desigMap[e.DesignationID] || 'Unassigned') + '</td>' +
          '<td data-label="Reporting Manager">' + (e.ReportingManagerID ? escapeHtml(e.ReportingManagerID) : '<span class="text-muted">None (Direct)</span>') + '</td>' +
          '<td data-label="Role"><span class="badge badge-role-' + e.Role.toLowerCase() + '">' + e.Role + '</span></td>' +
          '<td data-label="Status">' +
            '<span class="badge ' + (isActive ? 'badge-approved' : 'badge-rejected') + '">' + e.AccountStatus + '</span>' +
          '</td>' +
          '<td data-label="Actions">' +
            '<div class="flex gap-xs justify-end">' +
              '<button type="button" class="btn btn-outline btn-sm action-edit-emp" data-json="' + escapeHtml(JSON.stringify(e)) + '">Edit</button>' +
              '<button type="button" class="btn ' + (isActive ? 'btn-danger' : 'btn-success') + ' btn-sm action-toggle-status" data-id="' + e.EmployeeID + '" data-status="' + e.AccountStatus + '">' +
                (isActive ? 'Deactivate' : 'Activate') +
              '</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }
    return html;
  }

  function attachPendingActions(depts, desigs, managers) {
    // Approve Registration buttons
    var approveBtns = document.querySelectorAll('.action-approve-reg');
    for (var i = 0; i < approveBtns.length; i++) {
      approveBtns[i].addEventListener('click', function() {
        var pr = JSON.parse(this.getAttribute('data-json'));
        openApprovalModal(pr, depts, desigs, managers);
      });
    }

    // Reject Registration buttons
    var rejectBtns = document.querySelectorAll('.action-reject-reg');
    for (var j = 0; j < rejectBtns.length; j++) {
      rejectBtns[j].addEventListener('click', function() {
        var empId = this.getAttribute('data-id');
        var reason = prompt('Please enter administrative reason for rejecting registration (' + empId + '):');
        if (reason && reason.trim().length > 0) {
          window.NRSLJ_API.call('rejectRegistration', { employeeId: empId, adminNote: reason.trim() })
            .then(function() {
              window.NRSLJ_TOAST.success('Registration rejected');
              window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render('main-content', 'pending');
            })
            .catch(function(err) {
              window.NRSLJ_TOAST.error(err.message);
            });
        }
      });
    }
  }

  function openApprovalModal(pr, depts, desigs, managers) {
    var deptOptions = depts.map(function(d) {
      return '<option value="' + d.DepartmentID + '">' + escapeHtml(d.DepartmentName) + '</option>';
    }).join('');

    var desigOptions = desigs.map(function(dg) {
      return '<option value="' + dg.DesignationID + '">' + escapeHtml(dg.DesignationName) + '</option>';
    }).join('');

    var managerOptions = '<option value="">-- Direct Hospital Admin / None --</option>' +
      managers.map(function(m) {
        return '<option value="' + m.EmployeeID + '">' + escapeHtml(m.FullName) + ' (' + m.EmployeeID + ' - ' + m.Role + ')</option>';
      }).join('');

    var bodyHtml = '' +
      '<form id="reg-approval-modal-form">' +
        '<div style="background: var(--color-surface-hover); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px;" class="grid grid-cols-2 gap-sm text-sm">' +
          '<div><span class="text-xs text-muted">Applicant Name:</span><br><strong>' + escapeHtml(pr.FullName) + '</strong></div>' +
          '<div><span class="text-xs text-muted">Employee ID:</span><br><strong>' + escapeHtml(pr.EmployeeID) + '</strong></div>' +
          '<div><span class="text-xs text-muted">Username:</span><br><code>' + escapeHtml(pr.Username) + '</code></div>' +
          '<div><span class="text-xs text-muted">Phone:</span><br>' + escapeHtml(pr.Phone) + '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="assign-dept">Assign Department <span class="required">*</span></label>' +
          '<select id="assign-dept" class="form-select" required>' +
            '<option value="">-- Select Department --</option>' +
            deptOptions +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="assign-desig">Assign Designation <span class="required">*</span></label>' +
          '<select id="assign-desig" class="form-select" required>' +
            '<option value="">-- Select Designation --</option>' +
            desigOptions +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="assign-manager">Assign Reporting Manager</label>' +
          '<select id="assign-manager" class="form-select">' +
            managerOptions +
          '</select>' +
          '<span class="form-hint">Leave requests will route to this manager for primary review.</span>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="assign-role">Assign Portal Role <span class="required">*</span></label>' +
          '<select id="assign-role" class="form-select" required>' +
            '<option value="EMPLOYEE">Employee (Standard Leave Access)</option>' +
            '<option value="MANAGER">Manager (Approve Team Requests)</option>' +
            '<option value="ADMIN">Admin/HR (Full Hospital Administration)</option>' +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="assign-note">Administrative Note (Optional)</label>' +
          '<input type="text" id="assign-note" class="form-control" placeholder="Optional notes for account history">' +
        '</div>' +
      '</form>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-success" id="confirm-approve-reg-btn">' +
        '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
        '<span>Approve & Activate Staff</span>' +
      '</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Approve Staff Registration',
      body: bodyHtml,
      footer: footerHtml
    });

    dialog.querySelector('#confirm-approve-reg-btn').addEventListener('click', function() {
      var dept = dialog.querySelector('#assign-dept').value;
      var desig = dialog.querySelector('#assign-desig').value;
      var mgr = dialog.querySelector('#assign-manager').value;
      var role = dialog.querySelector('#assign-role').value;
      var note = dialog.querySelector('#assign-note').value.trim();

      if (!dept || !desig) {
        window.NRSLJ_TOAST.error('Department and Designation assignments are mandatory');
        return;
      }

      var btn = dialog.querySelector('#confirm-approve-reg-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Activating...';

      window.NRSLJ_API.call('approveRegistration', {
        employeeId: pr.EmployeeID,
        departmentId: dept,
        designationId: desig,
        reportingManagerId: mgr,
        role: role,
        adminNote: note
      })
      .then(function() {
        window.NRSLJ_TOAST.success('Employee account activated successfully');
        window.NRSLJ_MODAL.close();
        window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render('main-content', 'pending');
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error(err.message);
        btn.disabled = false;
        btn.innerHTML = '<span>Approve & Activate Staff</span>';
      });
    });
  }

  function attachEmpActions(depts, desigs, managers) {
    // Edit Employee buttons
    var editBtns = document.querySelectorAll('.action-edit-emp');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].addEventListener('click', function() {
        var emp = JSON.parse(this.getAttribute('data-json'));
        openEditEmployeeModal(emp, depts, desigs, managers);
      });
    }

    // Toggle Account Status (Activate / Deactivate)
    var toggleBtns = document.querySelectorAll('.action-toggle-status');
    for (var j = 0; j < toggleBtns.length; j++) {
      toggleBtns[j].addEventListener('click', function() {
        var empId = this.getAttribute('data-id');
        var curStatus = this.getAttribute('data-status');
        var newStatus = curStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        var actionVerb = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

        if (confirm('Are you sure you want to ' + actionVerb + ' employee ' + empId + '?')) {
          window.NRSLJ_API.call('adminUpdateEmployee', {
            employeeId: empId,
            updates: { AccountStatus: newStatus }
          })
          .then(function() {
            window.NRSLJ_TOAST.success('Account status changed to ' + newStatus);
            window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render('main-content', 'all');
          })
          .catch(function(err) {
            window.NRSLJ_TOAST.error(err.message);
          });
        }
      });
    }
  }

  function openEditEmployeeModal(emp, depts, desigs, managers) {
    var deptOptions = depts.map(function(d) {
      return '<option value="' + d.DepartmentID + '"' + (emp.DepartmentID === d.DepartmentID ? ' selected' : '') + '>' + escapeHtml(d.DepartmentName) + '</option>';
    }).join('');

    var desigOptions = desigs.map(function(dg) {
      return '<option value="' + dg.DesignationID + '"' + (emp.DesignationID === dg.DesignationID ? ' selected' : '') + '>' + escapeHtml(dg.DesignationName) + '</option>';
    }).join('');

    var managerOptions = '<option value="">-- Direct Hospital Admin / None --</option>' +
      managers.map(function(m) {
        return '<option value="' + m.EmployeeID + '"' + (emp.ReportingManagerID === m.EmployeeID ? ' selected' : '') + '>' + escapeHtml(m.FullName) + ' (' + m.EmployeeID + ')</option>';
      }).join('');

    var bodyHtml = '' +
      '<form id="edit-emp-form">' +
        '<div class="form-group">' +
          '<label class="form-label" for="edit-emp-name">Full Name</label>' +
          '<input type="text" id="edit-emp-name" class="form-control" value="' + escapeHtml(emp.FullName) + '" required>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="edit-emp-phone">Phone Number</label>' +
          '<input type="tel" id="edit-emp-phone" class="form-control" value="' + escapeHtml(emp.Phone) + '" required>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="edit-emp-dept">Department</label>' +
          '<select id="edit-emp-dept" class="form-select">' + deptOptions + '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="edit-emp-desig">Designation</label>' +
          '<select id="edit-emp-desig" class="form-select">' + desigOptions + '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="edit-emp-manager">Reporting Manager</label>' +
          '<select id="edit-emp-manager" class="form-select">' + managerOptions + '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="edit-emp-role">Role</label>' +
          '<select id="edit-emp-role" class="form-select">' +
            '<option value="EMPLOYEE"' + (emp.Role === 'EMPLOYEE' ? ' selected' : '') + '>Employee</option>' +
            '<option value="MANAGER"' + (emp.Role === 'MANAGER' ? ' selected' : '') + '>Manager</option>' +
            '<option value="ADMIN"' + (emp.Role === 'ADMIN' ? ' selected' : '') + '>Admin/HR</option>' +
          '</select>' +
        '</div>' +
      '</form>';

    var footerHtml = '' +
      '<button type="button" class="btn btn-secondary" onclick="window.NRSLJ_MODAL.close()">Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="save-edit-emp-btn">Save Changes</button>';

    var dialog = window.NRSLJ_MODAL.open({
      title: 'Edit Employee: ' + emp.FullName + ' (' + emp.EmployeeID + ')',
      body: bodyHtml,
      footer: footerHtml
    });

    dialog.querySelector('#save-edit-emp-btn').addEventListener('click', function() {
      var updates = {
        FullName: dialog.querySelector('#edit-emp-name').value.trim(),
        Phone: dialog.querySelector('#edit-emp-phone').value.trim(),
        DepartmentID: dialog.querySelector('#edit-emp-dept').value,
        DesignationID: dialog.querySelector('#edit-emp-desig').value,
        ReportingManagerID: dialog.querySelector('#edit-emp-manager').value,
        Role: dialog.querySelector('#edit-emp-role').value
      };

      window.NRSLJ_API.call('adminUpdateEmployee', {
        employeeId: emp.EmployeeID,
        updates: updates
      })
      .then(function() {
        window.NRSLJ_TOAST.success('Employee updated successfully');
        window.NRSLJ_MODAL.close();
        window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render('main-content', 'all');
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
