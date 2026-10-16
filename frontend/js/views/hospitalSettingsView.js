/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Hospital Branding, Logo Customization & Global Workflow Settings View
 */

window.NRSLJ_HOSPITAL_SETTINGS_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user || user.Role !== 'ADMIN') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading hospital branding & settings...</p></div>';

    window.NRSLJ_API.call('getAllSettings', {})
      .then(function(settings) {
        renderForm(container, settings || {});
      })
      .catch(function(err) {
        container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
          '<strong>Error loading settings:</strong> ' + escapeHtml(err.message) +
          '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_HOSPITAL_SETTINGS_VIEW.render(\'' + containerId + '\')">Retry</button>' +
          '</div>';
      });
  }

  function renderForm(container, settings) {
    var hospitalName = settings.HOSPITAL_NAME || window.NRSLJ_CONFIG.HOSPITAL_NAME;
    var logoUrl = settings.LOGO_URL || '';
    var workflow = settings.APPROVAL_WORKFLOW || 'MANAGER_THEN_HR';
    var previewSrc = logoUrl && logoUrl.trim().length > 0 ? logoUrl : 'assets/logo.svg';

    var html = '' +
      '<div style="max-width: 800px; margin: 0 auto;">' +
        '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
          '<div>' +
            '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">Hospital Branding & System Settings</h1>' +
            '<p class="text-sm text-muted">Customize hospital logo, approval workflows, leave policies & contact information</p>' +
          '</div>' +
        '</div>' +

        '<form id="hospital-settings-form">' +

          // 1. Hospital Branding & Logo Card
          '<div class="card mb-lg">' +
            '<div class="card-header">' +
              '<div class="card-title">Hospital Identity & Logo Customization</div>' +
            '</div>' +
            '<div class="card-body">' +

              // Current Logo Preview
              '<div class="flex items-center gap-lg mb-lg flex-wrap">' +
                '<div style="padding: 16px; background: #ffffff; border: 2px dashed var(--color-border); border-radius: var(--radius-md); text-align: center; min-width: 220px;">' +
                  '<img id="settings-logo-preview" src="' + previewSrc + '" alt="Logo Preview" style="max-height: 60px; max-width: 200px; object-fit: contain;" onerror="this.src=\'assets/logo.svg\'">' +
                  '<div class="text-xs text-muted mt-xs">Current Active Logo</div>' +
                '</div>' +
                '<div style="flex: 1; min-width: 240px;">' +
                  '<label class="form-label" for="logo-file-input">Upload New Logo Image</label>' +
                  '<input type="file" id="logo-file-input" class="form-control" accept="image/png, image/jpeg, image/svg+xml">' +
                  '<span class="form-hint">Supports PNG, JPG, or SVG format (recommended height: 60px - 80px).</span>' +
                  '<div class="flex gap-sm mt-sm">' +
                    '<button type="button" class="btn btn-outline btn-sm" id="btn-reset-logo">Reset to Default Logo</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="form-group">' +
                '<label class="form-label" for="setting-logo-url">Or Image URL</label>' +
                '<input type="url" id="setting-logo-url" class="form-control" placeholder="https://example.com/hospital-logo.png" value="' + escapeHtml(logoUrl) + '">' +
              '</div>' +

              '<div class="form-group">' +
                '<label class="form-label" for="setting-hospital-name">Hospital Name <span class="required">*</span></label>' +
                '<input type="text" id="setting-hospital-name" class="form-control" value="' + escapeHtml(hospitalName) + '" required>' +
              '</div>' +

              '<div class="form-row">' +
                '<div class="form-group">' +
                  '<label class="form-label" for="setting-phone">Hospital Phone</label>' +
                  '<input type="tel" id="setting-phone" class="form-control" value="' + escapeHtml(settings.HOSPITAL_PHONE || '') + '">' +
                '</div>' +
                '<div class="form-group">' +
                  '<label class="form-label" for="setting-email">HR Contact Email</label>' +
                  '<input type="email" id="setting-email" class="form-control" value="' + escapeHtml(settings.HOSPITAL_EMAIL || '') + '">' +
                '</div>' +
              '</div>' +

              '<div class="form-group">' +
                '<label class="form-label" for="setting-address">Hospital Address</label>' +
                '<input type="text" id="setting-address" class="form-control" value="' + escapeHtml(settings.HOSPITAL_ADDRESS || '') + '">' +
              '</div>' +

            '</div>' +
          '</div>' +

          // 2. Approval Workflow Configuration Card
          '<div class="card mb-lg">' +
            '<div class="card-header">' +
              '<div>' +
                '<div class="card-title">Leave Approval Workflow Hierarchy</div>' +
                '<div class="card-subtitle">Define the approval steps required before leave requests are finalized</div>' +
              '</div>' +
            '</div>' +
            '<div class="card-body">' +

              '<div class="form-group">' +
                '<div class="flex flex-col gap-sm">' +

                  '<label class="custom-radio-card" style="padding: 14px 18px;">' +
                    '<input type="radio" name="workflow-mode" value="MANAGER_THEN_HR"' + (workflow === 'MANAGER_THEN_HR' ? ' checked' : '') + '>' +
                    '<div>' +
                      '<strong>Two-Tier Approval (Manager then HR) — Recommended</strong>' +
                      '<p class="text-xs text-muted" style="margin: 2px 0 0;">Employee request routes to Reporting Manager first. Upon Manager approval, routes to Admin/HR for final approval & balance deduction.</p>' +
                    '</div>' +
                  '</label>' +

                  '<label class="custom-radio-card" style="padding: 14px 18px;">' +
                    '<input type="radio" name="workflow-mode" value="MANAGER_ONLY"' + (workflow === 'MANAGER_ONLY' ? ' checked' : '') + '>' +
                    '<div>' +
                      '<strong>Single-Tier: Manager Approval Only</strong>' +
                      '<p class="text-xs text-muted" style="margin: 2px 0 0;">Reporting Manager approval immediately finalizes the request as APPROVED and deducts balance without requiring HR sign-off.</p>' +
                    '</div>' +
                  '</label>' +

                  '<label class="custom-radio-card" style="padding: 14px 18px;">' +
                    '<input type="radio" name="workflow-mode" value="HR_ONLY"' + (workflow === 'HR_ONLY' ? ' checked' : '') + '>' +
                    '<div>' +
                      '<strong>Single-Tier: Central Admin/HR Only</strong>' +
                      '<p class="text-xs text-muted" style="margin: 2px 0 0;">All hospital requests route directly to the central Admin/HR approval queue, bypassing intermediate reporting managers.</p>' +
                    '</div>' +
                  '</label>' +

                '</div>' +
              '</div>' +

              '<div class="form-group mt-md">' +
                '<label class="form-label" for="setting-backdated">Maximum Allowed Backdated Submission (Days)</label>' +
                '<input type="number" id="setting-backdated" class="form-control" style="max-width: 220px;" value="' + (settings.ALLOW_PAST_LEAVE_DAYS || 3) + '" min="0" max="30">' +
                '<span class="form-hint">Allows staff to submit retrospective leave (e.g. for emergency medical illness) up to this limit.</span>' +
              '</div>' +

            '</div>' +

            '<div class="card-footer">' +
              '<button type="submit" class="btn btn-primary" id="save-settings-btn">' +
                '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
                '<span>Save Hospital Settings</span>' +
              '</button>' +
            '</div>' +

          '</div>' +

        '</form>' +
      '</div>';

    container.innerHTML = html;

    // Logo File Upload Handling
    var fileInput = document.getElementById('logo-file-input');
    var logoPreview = document.getElementById('settings-logo-preview');
    var logoUrlInput = document.getElementById('setting-logo-url');

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 500) {
          window.NRSLJ_TOAST.warning('Image is larger than 500KB. For best spreadsheet performance, use a compressed logo.');
        }
        var reader = new FileReader();
        reader.onload = function(evt) {
          var base64Data = evt.target.result;
          logoPreview.src = base64Data;
          logoUrlInput.value = base64Data;
        };
        reader.readAsDataURL(file);
      }
    });

    logoUrlInput.addEventListener('input', function() {
      var val = logoUrlInput.value.trim();
      logoPreview.src = val.length > 0 ? val : 'assets/logo.svg';
    });

    document.getElementById('btn-reset-logo').addEventListener('click', function() {
      logoUrlInput.value = '';
      logoPreview.src = 'assets/logo.svg';
      fileInput.value = '';
      window.NRSLJ_TOAST.info('Logo reset to default emblem');
    });

    // Form Save
    document.getElementById('hospital-settings-form').addEventListener('submit', function(e) {
      e.preventDefault();

      var selectedWf = 'MANAGER_THEN_HR';
      var radios = document.querySelectorAll('input[name="workflow-mode"]');
      for (var r = 0; r < radios.length; r++) {
        if (radios[r].checked) selectedWf = radios[r].value;
      }

      var payload = {
        HOSPITAL_NAME: document.getElementById('setting-hospital-name').value.trim(),
        LOGO_URL: logoUrlInput.value.trim(),
        HOSPITAL_PHONE: document.getElementById('setting-phone').value.trim(),
        HOSPITAL_EMAIL: document.getElementById('setting-email').value.trim(),
        HOSPITAL_ADDRESS: document.getElementById('setting-address').value.trim(),
        APPROVAL_WORKFLOW: selectedWf,
        ALLOW_PAST_LEAVE_DAYS: document.getElementById('setting-backdated').value
      };

      var btn = document.getElementById('save-settings-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Saving...';

      window.NRSLJ_API.call('updateSettings', payload)
        .then(function(saved) {
          window.NRSLJ_TOAST.success('Hospital settings updated successfully');
          window.NRSLJ_STATE.setHospitalSettings(saved);

          // Update header brand
          var headerLogo = document.getElementById('header-brand-logo');
          if (headerLogo) {
            headerLogo.src = saved.LOGO_URL && saved.LOGO_URL.length > 0 ? saved.LOGO_URL : 'assets/logo.svg';
          }
        })
        .catch(function(err) {
          window.NRSLJ_TOAST.error(err.message);
        })
        .finally(function() {
          btn.disabled = false;
          btn.innerHTML = '<span>Save Hospital Settings</span>';
        });
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
