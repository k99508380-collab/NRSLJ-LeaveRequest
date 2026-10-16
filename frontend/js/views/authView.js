/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Authentication View: Login & Staff Signup
 */

window.NRSLJ_AUTH_VIEW = (function() {
  function render(containerId, initialTab) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var settings = state.hospitalSettings;
    var logoSrc = settings.LOGO_URL && settings.LOGO_URL.trim().length > 0 ? settings.LOGO_URL : window.NRSLJ_CONFIG.DEFAULT_LOGO_PATH;
    var hospitalName = settings.HOSPITAL_NAME || window.NRSLJ_CONFIG.HOSPITAL_NAME;

    var activeTab = initialTab || 'login';

    var html = '' +
      '<div style="max-width: 480px; margin: 40px auto; width: 100%;">' +
        // Card container
        '<div class="card" style="box-shadow: var(--shadow-xl); border-radius: var(--radius-lg);">' +
          '<div style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid var(--color-border); background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">' +
            '<img src="' + logoSrc + '" alt="' + hospitalName + ' Logo" style="height: 60px; max-width: 260px; margin-bottom: 16px; object-fit: contain;" onerror="this.src=\'assets/logo.svg\'">' +
            '<h1 style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-900); margin-bottom: 4px;">' + hospitalName + '</h1>' +
            '<p class="text-xs text-muted" style="letter-spacing: 1px; font-weight: 700; color: var(--color-teal-600); text-transform: uppercase;">Employee Leave Portal</p>' +
          '</div>' +

          '<div class="card-body" style="padding: 28px 32px;">' +
            // Tab switcher
            '<div class="tabs-nav" style="justify-content: center; margin-bottom: 24px;">' +
              '<button type="button" class="tab-btn' + (activeTab === 'login' ? ' active' : '') + '" id="auth-tab-login" style="flex: 1; text-align: center;">Sign In</button>' +
              '<button type="button" class="tab-btn' + (activeTab === 'signup' ? ' active' : '') + '" id="auth-tab-signup" style="flex: 1; text-align: center;">New Staff Registration</button>' +
            '</div>' +

            // Login Form
            '<div id="auth-form-login-pane"' + (activeTab !== 'login' ? ' class="hidden"' : '') + '>' +
              '<form id="login-form">' +
                '<div class="form-group">' +
                  '<label class="form-label" for="login-identifier">Username or Phone Number <span class="required">*</span></label>' +
                  '<input type="text" id="login-identifier" class="form-control" placeholder="e.g. jdoe or 9876543210" required autocomplete="username">' +
                '</div>' +

                '<div class="form-group">' +
                  '<label class="form-label" for="login-password">Password <span class="required">*</span></label>' +
                  '<input type="password" id="login-password" class="form-control" placeholder="Enter your password" required autocomplete="current-password">' +
                '</div>' +

                '<button type="submit" class="btn btn-navy w-full mt-md" id="login-submit-btn">' +
                  '<span>Sign In</span>' +
                '</button>' +
              '</form>' +
            '</div>' +

            // Registration Form
            '<div id="auth-form-signup-pane"' + (activeTab !== 'signup' ? ' class="hidden"' : '') + '>' +
              '<form id="signup-form">' +
                '<div class="alert alert-info text-xs mb-md">' +
                  '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                  '<span>Registrations require review and activation by Hospital Admin/HR before portal access is granted.</span>' +
                '</div>' +

                '<div class="form-group">' +
                  '<label class="form-label" for="reg-fullname">Full Name <span class="required">*</span></label>' +
                  '<input type="text" id="reg-fullname" class="form-control" placeholder="Dr. / Mr. / Ms. Full Name" required>' +
                '</div>' +

                '<div class="form-row">' +
                  '<div class="form-group">' +
                    '<label class="form-label" for="reg-empid">Employee ID <span class="required">*</span></label>' +
                    '<input type="text" id="reg-empid" class="form-control" placeholder="e.g. DOC102" required style="text-transform: uppercase;">' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label class="form-label" for="reg-username">Username <span class="required">*</span></label>' +
                    '<input type="text" id="reg-username" class="form-control" placeholder="e.g. jsmith" required>' +
                  '</div>' +
                '</div>' +

                '<div class="form-group">' +
                  '<label class="form-label" for="reg-phone">Phone Number <span class="required">*</span></label>' +
                  '<input type="tel" id="reg-phone" class="form-control" placeholder="10-digit mobile number" required>' +
                '</div>' +

                '<div class="form-row">' +
                  '<div class="form-group">' +
                    '<label class="form-label" for="reg-password">Password <span class="required">*</span></label>' +
                    '<input type="password" id="reg-password" class="form-control" placeholder="Min 6 characters" required minlength="6">' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label class="form-label" for="reg-confirmpassword">Confirm Password <span class="required">*</span></label>' +
                    '<input type="password" id="reg-confirmpassword" class="form-control" placeholder="Re-enter password" required minlength="6">' +
                  '</div>' +
                '</div>' +

                '<div class="form-group" style="margin-top: 6px;">' +
                  '<label class="flex items-center gap-sm text-xs text-muted" style="cursor: pointer;">' +
                    '<input type="checkbox" id="reg-terms" required>' +
                    '<span>I agree to NRSLJ Speciality Hospitals usage policy, leave regulations, and privacy notice.</span>' +
                  '</label>' +
                '</div>' +

                '<button type="submit" class="btn btn-primary w-full mt-md" id="signup-submit-btn">' +
                  '<span>Submit Registration</span>' +
                '</button>' +
              '</form>' +
            '</div>' +

          '</div>' +

          '<div class="card-footer justify-center text-xs text-muted">' +
            '<span>Need initial administrator setup or connection help? </span>' +
            '<a href="javascript:void(0)" id="auth-diagnostics-link" style="font-weight: 600;">System Diagnostics</a>' +
          '</div>' +

        '</div>' +
      '</div>';

    container.innerHTML = html;

    // Attach Tab Events
    var tabLogin = document.getElementById('auth-tab-login');
    var tabSignup = document.getElementById('auth-tab-signup');
    var paneLogin = document.getElementById('auth-form-login-pane');
    var paneSignup = document.getElementById('auth-form-signup-pane');

    tabLogin.addEventListener('click', function() {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      paneLogin.classList.remove('hidden');
      paneSignup.classList.add('hidden');
    });

    tabSignup.addEventListener('click', function() {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      paneSignup.classList.remove('hidden');
      paneLogin.classList.add('hidden');
    });

    document.getElementById('auth-diagnostics-link').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('diagnostics');
    });

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var id = document.getElementById('login-identifier').value.trim();
      var pass = document.getElementById('login-password').value;
      var btn = document.getElementById('login-submit-btn');

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in...';

      window.NRSLJ_AUTH.login(id, pass)
        .catch(function(err) {
          window.NRSLJ_TOAST.error(err.message);
        })
        .finally(function() {
          btn.disabled = false;
          btn.innerHTML = '<span>Sign In</span>';
        });
    });

    // Registration Form Submit
    document.getElementById('signup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var pass = document.getElementById('reg-password').value;
      var confirmPass = document.getElementById('reg-confirmpassword').value;

      if (pass !== confirmPass) {
        window.NRSLJ_TOAST.error('Passwords do not match');
        return;
      }

      var payload = {
        FullName: document.getElementById('reg-fullname').value.trim(),
        EmployeeID: document.getElementById('reg-empid').value.trim().toUpperCase(),
        Username: document.getElementById('reg-username').value.trim().toLowerCase(),
        Phone: document.getElementById('reg-phone').value.trim(),
        Password: pass
      };

      var btn = document.getElementById('signup-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Submitting...';

      window.NRSLJ_AUTH.register(payload)
        .then(function(res) {
          window.NRSLJ_MODAL.open({
            title: 'Registration Submitted',
            body: '<div class="text-center" style="padding: 20px;">' +
              '<svg width="48" height="48" fill="none" stroke="#0d9488" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto 16px;"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
              '<h4 style="color: var(--color-primary-900); margin-bottom: 8px;">Registration Under Review</h4>' +
              '<p class="text-sm text-muted">Your account request for <strong>' + escapeHtml(payload.FullName) + '</strong> (' + escapeHtml(payload.EmployeeID) + ') has been registered with status <strong>PENDING</strong>.</p>' +
              '<p class="text-sm text-muted">Hospital Admin/HR will assign your department, designation, and reporting manager before activating your login.</p>' +
              '</div>',
            footer: '<button type="button" class="btn btn-primary" onclick="window.NRSLJ_MODAL.close()">Back to Sign In</button>'
          });

          // Switch back to login tab
          tabLogin.click();
        })
        .catch(function(err) {
          window.NRSLJ_TOAST.error(err.message);
        })
        .finally(function() {
          btn.disabled = false;
          btn.innerHTML = '<span>Submit Registration</span>';
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
