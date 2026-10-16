/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * System Diagnostics, Connection Verification & First Administrator Wizard
 */

window.NRSLJ_DIAGNOSTICS_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var currentUrl = window.NRSLJ_CONFIG.getWebAppUrl();
    var isGas = window.NRSLJ_API.isGasEnvironment();

    var html = '' +
      '<div style="max-width: 860px; margin: 0 auto;">' +
        '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
          '<div>' +
            '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">System Diagnostics & Backend Setup</h1>' +
            '<p class="text-sm text-muted">Test Google Apps Script connection, verify database sheets, and initialize first administrator</p>' +
          '</div>' +
          '<button type="button" class="btn btn-outline btn-sm" id="diag-back-btn">' +
            '<span>Back to Dashboard</span>' +
          '</button>' +
        '</div>' +

        // 1. Connection Configuration Card
        '<div class="card mb-lg">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">Backend Connection Endpoint</div>' +
              '<div class="card-subtitle">' +
                (isGas ? 'Running inside Google Apps Script HTML Service' : 'Configured Google Apps Script Web App Deployment URL') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card-body">' +

            (isGas ?
              '<div class="alert alert-success text-xs">' +
                '<strong>Native Google Apps Script Environment Detected:</strong> Calls run directly via <code>google.script.run</code> without cross-origin configuration.' +
              '</div>'
              :
              '<div>' +
                '<div class="form-group">' +
                  '<label class="form-label" for="diag-webapp-url">Google Apps Script Web App URL <span class="required">*</span></label>' +
                  '<input type="url" id="diag-webapp-url" class="form-control" placeholder="https://script.google.com/macros/s/AKfycb.../exec" value="' + escapeHtml(currentUrl) + '">' +
                  '<span class="form-hint">Obtain this from Google Apps Script editor: Deploy &rarr; New deployment &rarr; Web app &rarr; Copy Web app URL.</span>' +
                '</div>' +
                '<div class="flex gap-sm">' +
                  '<button type="button" class="btn btn-primary btn-sm" id="btn-save-webapp-url">Save URL</button>' +
                  '<button type="button" class="btn btn-outline btn-sm" id="btn-test-ping">Test Health Ping</button>' +
                '</div>' +
              '</div>'
            ) +

          '</div>' +
        '</div>' +

        // 2. Comprehensive Diagnostics Execution Card
        '<div class="card mb-lg">' +
          '<div class="card-header flex justify-between items-center flex-wrap gap-sm">' +
            '<div>' +
              '<div class="card-title">Live Spreadsheet & Database Health Check</div>' +
              '<div class="card-subtitle">Verifies Google Sheets connectivity, required tables, headers, and round-trip write access</div>' +
            '</div>' +
            '<button type="button" class="btn btn-navy btn-sm" id="btn-run-full-diag">' +
              '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' +
              '<span>Run Full Diagnostics</span>' +
            '</button>' +
          '</div>' +
          '<div class="card-body" id="diag-results-pane">' +
            '<p class="text-sm text-muted">Click <strong>"Run Full Diagnostics"</strong> above to perform real-time verification against your Google Sheet.</p>' +
          '</div>' +
        '</div>' +

        // 3. First Administrator Setup Wizard (Rendered dynamically based on healthCheck)
        '<div class="card" id="first-admin-setup-card">' +
          '<div class="card-header">' +
            '<div class="card-title">First Administrator Account Initialization</div>' +
          '</div>' +
          '<div class="card-body" id="first-admin-pane">' +
            '<p class="text-sm text-muted">Checking administrator status...</p>' +
          '</div>' +
        '</div>' +

      '</div>';

    container.innerHTML = html;

    // Attach Button Events
    var saveUrlBtn = document.getElementById('btn-save-webapp-url');
    if (saveUrlBtn) {
      saveUrlBtn.addEventListener('click', function() {
        var inputUrl = document.getElementById('diag-webapp-url').value.trim();
        if (!inputUrl) {
          window.NRSLJ_CONFIG.setWebAppUrl('');
          window.NRSLJ_TOAST.info('Cleared Web App URL');
        } else {
          window.NRSLJ_CONFIG.setWebAppUrl(inputUrl);
          window.NRSLJ_TOAST.success('Web App URL saved successfully');
        }
      });
    }

    var testPingBtn = document.getElementById('btn-test-ping');
    if (testPingBtn) {
      testPingBtn.addEventListener('click', function() {
        var inputUrl = document.getElementById('diag-webapp-url').value.trim();
        testPingBtn.disabled = true;
        testPingBtn.innerHTML = '<span class="spinner"></span> Testing...';

        window.NRSLJ_API.ping(inputUrl)
          .then(function(res) {
            window.NRSLJ_TOAST.success('Backend connection successful! Server online: ' + (res.hospitalName || 'NRSLJ Hospitals'));
          })
          .catch(function(err) {
            window.NRSLJ_TOAST.error('Connection failed: ' + err.message);
          })
          .finally(function() {
            testPingBtn.disabled = false;
            testPingBtn.innerHTML = 'Test Health Ping';
          });
      });
    }

    document.getElementById('btn-run-full-diag').addEventListener('click', executeDiagnostics);

    document.getElementById('diag-back-btn').addEventListener('click', function() {
      var user = window.NRSLJ_STATE.get().currentUser;
      if (user) {
        window.NRSLJ_STATE.setRoute(user.Role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
      } else {
        window.NRSLJ_STATE.setRoute('auth');
      }
    });

    // Auto-check health on load
    checkAdminStatus();
  }

  function checkAdminStatus() {
    var adminPane = document.getElementById('first-admin-pane');
    if (!adminPane) return;

    window.NRSLJ_API.call('healthCheck', {})
      .then(function(res) {
        if (res && res.adminExists) {
          adminPane.innerHTML = '<div class="alert alert-success text-sm">' +
            '<svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
            '<span>An active Administrator account already exists. One-time setup is closed for security.</span>' +
            '</div>' +
            '<p class="text-xs text-muted">To recover administrative access or add additional administrators, log in with existing administrator credentials.</p>';
        } else {
          renderFirstAdminForm(adminPane);
        }
      })
      .catch(function(err) {
        adminPane.innerHTML = '<div class="alert alert-warning text-xs">' +
          '<span>Could not query administrator status: ' + escapeHtml(err.message) + '. Please ensure your Web App URL is configured and database is initialized.</span>' +
          '</div>';
      });
  }

  function renderFirstAdminForm(pane) {
    pane.innerHTML = '' +
      '<div class="alert alert-info text-xs mb-md">' +
        '<span>No active Administrator account found in the database. Use this one-time wizard to initialize the first Admin/HR account.</span>' +
      '</div>' +
      '<form id="first-admin-form">' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="fa-username">Admin Username <span class="required">*</span></label>' +
            '<input type="text" id="fa-username" class="form-control" value="admin" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="fa-name">Admin Full Name <span class="required">*</span></label>' +
            '<input type="text" id="fa-name" class="form-control" value="Hospital Administrator" required>' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="fa-phone">Phone Number <span class="required">*</span></label>' +
            '<input type="tel" id="fa-phone" class="form-control" value="9876543210" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="fa-password">Master Password <span class="required">*</span></label>' +
            '<input type="password" id="fa-password" class="form-control" placeholder="Min 8 characters" required minlength="8">' +
          '</div>' +
        '</div>' +
        '<button type="submit" class="btn btn-navy" id="btn-create-fa">' +
          '<span>Initialize Administrator Account</span>' +
        '</button>' +
      '</form>';

    document.getElementById('first-admin-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var u = document.getElementById('fa-username').value.trim();
      var n = document.getElementById('fa-name').value.trim();
      var p = document.getElementById('fa-phone').value.trim();
      var pass = document.getElementById('fa-password').value;

      var btn = document.getElementById('btn-create-fa');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating...';

      window.NRSLJ_API.call('setupFirstAdmin', {
        username: u,
        fullName: n,
        phone: p,
        password: pass
      })
      .then(function(adminProfile) {
        window.NRSLJ_TOAST.success('First Administrator created successfully! You can now log in.');
        checkAdminStatus();
      })
      .catch(function(err) {
        window.NRSLJ_TOAST.error(err.message);
        btn.disabled = false;
        btn.innerHTML = '<span>Initialize Administrator Account</span>';
      });
    });
  }

  function executeDiagnostics() {
    var pane = document.getElementById('diag-results-pane');
    var btn = document.getElementById('btn-run-full-diag');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Running diagnostics...';
    pane.innerHTML = '<div class="text-center" style="padding: 30px;"><span class="spinner"></span><p class="text-sm text-muted mt-sm">Testing spreadsheet connection, schemas, and roundtrip write...</p></div>';

    window.NRSLJ_API.call('runDiagnostics', {})
      .then(function(diag) {
        var html = '' +
          '<div class="flex justify-between items-center mb-md pb-sm" style="border-bottom: 1px solid var(--color-border);">' +
            '<div>' +
              '<strong>Connected Spreadsheet: </strong><code style="color: var(--color-teal-700); font-weight: 700;">' + escapeHtml(diag.spreadsheetName || 'Connected') + '</code>' +
            '</div>' +
            '<span class="badge ' + (diag.allSheetsPresent ? 'badge-approved' : 'badge-rejected') + '">' +
              (diag.allSheetsPresent ? 'All Schemas Healthy' : 'Missing Sheets') +
            '</span>' +
          '</div>' +

          '<div class="grid grid-cols-3 gap-md mb-md text-sm">' +
            '<div style="background: var(--color-surface-hover); padding: 12px; border-radius: var(--radius-sm);">' +
              '<span class="text-xs text-muted">Roundtrip Write/Read Test:</span><br>' +
              (diag.roundtripTestPassed ? '<strong style="color: var(--color-success);">&check; Passed (Safe Write &amp; Delete)</strong>' : '<strong style="color: var(--color-danger);">&cross; Failed</strong>') +
            '</div>' +
            '<div style="background: var(--color-surface-hover); padding: 12px; border-radius: var(--radius-sm);">' +
              '<span class="text-xs text-muted">Active Staff Records:</span><br>' +
              '<strong>' + diag.employeeCount + ' Registered</strong>' +
            '</div>' +
            '<div style="background: var(--color-surface-hover); padding: 12px; border-radius: var(--radius-sm);">' +
              '<span class="text-xs text-muted">Administrators:</span><br>' +
              '<strong>' + diag.adminCount + ' Admin(s)</strong>' +
            '</div>' +
          '</div>';

        // Table of Sheet Checklist
        html += '<h4 style="font-size: 0.95rem; margin-bottom: 8px;">Database Tables Verification:</h4>' +
          '<div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">' +
          '<table class="data-table" style="font-size: 0.8rem;">' +
            '<thead><tr><th>Table / Sheet Name</th><th>Status</th><th>Headers Status</th></tr></thead><tbody>';

        var sheetsCheck = diag.sheetsCheck || {};
        var sNames = Object.keys(sheetsCheck);
        for (var i = 0; i < sNames.length; i++) {
          var sn = sNames[i];
          var sc = sheetsCheck[sn];
          html += '<tr>' +
            '<td><code>' + sn + '</code></td>' +
            '<td>' + (sc.exists ? '<span style="color: var(--color-success); font-weight: 700;">&check; Present</span>' : '<span style="color: var(--color-danger); font-weight: 700;">&cross; Missing</span>') + '</td>' +
            '<td>' + (sc.headersOk ? '<span style="color: var(--color-success);">&check; Valid</span>' : '<span style="color: var(--color-warning);">Headers Mismatch</span>') + '</td>' +
          '</tr>';
        }

        html += '</tbody></table></div>';

        if (!diag.allSheetsPresent) {
          html += '<div class="mt-md">' +
            '<button type="button" class="btn btn-primary btn-sm" id="btn-fix-init-db">Run Database Auto-Initialization</button>' +
            '</div>';
        }

        pane.innerHTML = html;

        var initBtn = document.getElementById('btn-fix-init-db');
        if (initBtn) {
          initBtn.addEventListener('click', function() {
            window.NRSLJ_API.call('initDatabase', {})
              .then(function() {
                window.NRSLJ_TOAST.success('Database initialized! Rerunning diagnostics...');
                executeDiagnostics();
              })
              .catch(function(err) {
                window.NRSLJ_TOAST.error('Init failed: ' + err.message);
              });
          });
        }
      })
      .catch(function(err) {
        pane.innerHTML = '<div class="alert alert-danger text-sm">' +
          '<strong>Diagnostics Failed:</strong> ' + escapeHtml(err.message) +
          '</div>';
      })
      .finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>Run Full Diagnostics</span>';
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
