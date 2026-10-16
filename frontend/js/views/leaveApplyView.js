/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Leave Application Form View with Live Duration & Working Day Calculation
 */

window.NRSLJ_LEAVE_APPLY_VIEW = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    if (!user) {
      window.NRSLJ_STATE.setRoute('auth');
      return;
    }

    container.innerHTML = '<div class="text-center" style="padding: 60px;"><span class="spinner" style="width: 32px; height: 32px;"></span><p class="text-muted mt-md">Loading leave policies and balances...</p></div>';

    // Parallel fetch balances, leave types, and holidays
    Promise.all([
      window.NRSLJ_API.call('getEmployeeBalances', { leaveYear: new Date().getFullYear() }),
      window.NRSLJ_API.call('getHolidays', {})
    ])
    .then(function(results) {
      var balances = results[0] || [];
      var holidays = results[1] || [];
      renderForm(container, user, balances, holidays);
    })
    .catch(function(err) {
      container.innerHTML = '<div class="alert alert-danger" style="margin: 20px;">' +
        '<strong>Error initializing leave form:</strong> ' + escapeHtml(err.message) +
        '<button class="btn btn-sm btn-outline mt-sm" onclick="window.NRSLJ_LEAVE_APPLY_VIEW.render(\'' + containerId + '\')">Retry</button>' +
        '</div>';
    });
  }

  function renderForm(container, user, balances, holidays) {
    var todayStr = new Date().toISOString().substring(0, 10);

    var html = '' +
      '<div style="max-width: 780px; margin: 0 auto;">' +
        '<div class="flex justify-between items-center mb-md flex-wrap gap-sm">' +
          '<div>' +
            '<h1 style="color: var(--color-primary-900); font-size: 1.4rem;">Submit Leave Request</h1>' +
            '<p class="text-sm text-muted">NRSLJ Speciality Hospitals, Musiri &bull; Employee Leave Application</p>' +
          '</div>' +
          '<button type="button" class="btn btn-outline btn-sm" id="apply-back-btn">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>' +
            '<span>Back to Dashboard</span>' +
          '</button>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-body">' +
            '<form id="leave-application-form">' +

              // Employee Info Summary Banner
              '<div style="background-color: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px;" class="flex justify-between items-center flex-wrap gap-sm text-xs">' +
                '<div>' +
                  '<strong>Applicant: </strong><span>' + escapeHtml(user.FullName) + ' (' + escapeHtml(user.EmployeeID) + ')</span>' +
                '</div>' +
                '<div>' +
                  '<strong>Reporting Manager: </strong><span>' + (user.ReportingManagerID ? escapeHtml(user.ReportingManagerID) : '<span class="text-muted">Direct Hospital Admin Queue</span>') + '</span>' +
                '</div>' +
              '</div>' +

              // Leave Type selection
              '<div class="form-group">' +
                '<label class="form-label" for="apply-leave-type">Leave Type <span class="required">*</span></label>' +
                '<select id="apply-leave-type" class="form-select" required>' +
                  '<option value="">-- Select Leave Category --</option>';

    for (var i = 0; i < balances.length; i++) {
      var b = balances[i];
      var availText = b.RequiresBalance ? ' (' + b.AvailableBalance + ' days available)' : ' (Balance not required)';
      html += '<option value="' + b.LeaveTypeID + '" data-avail="' + b.AvailableBalance + '" data-reqbal="' + b.RequiresBalance + '" data-max="' + b.MaximumDuration + '" data-notice="' + b.NoticePeriod + '" data-neg="' + b.NegativeBalanceAllowed + '" data-weekends="' + b.WeekendsPolicy + '" data-holidays="' + b.HolidaysPolicy + '">' +
        escapeHtml(b.LeaveTypeName) + availText +
        '</option>';
    }

    html += '</select>' +
              '</div>' +

              // Day Part selection
              '<div class="form-group">' +
                '<label class="form-label">Day Duration <span class="required">*</span></label>' +
                '<div class="radio-group">' +
                  '<label class="custom-radio-card">' +
                    '<input type="radio" name="day-part" value="FULL" checked> <span>Full Day(s)</span>' +
                  '</label>' +
                  '<label class="custom-radio-card">' +
                    '<input type="radio" name="day-part" value="FIRST_HALF"> <span>Half Day (Morning Session)</span>' +
                  '</label>' +
                  '<label class="custom-radio-card">' +
                    '<input type="radio" name="day-part" value="SECOND_HALF"> <span>Half Day (Afternoon Session)</span>' +
                  '</label>' +
                '</div>' +
              '</div>' +

              // Date pickers
              '<div class="form-row">' +
                '<div class="form-group">' +
                  '<label class="form-label" for="apply-start-date">Start Date <span class="required">*</span></label>' +
                  '<input type="date" id="apply-start-date" class="form-control" value="' + todayStr + '" required>' +
                '</div>' +
                '<div class="form-group" id="end-date-group">' +
                  '<label class="form-label" for="apply-end-date">End Date <span class="required">*</span></label>' +
                  '<input type="date" id="apply-end-date" class="form-control" value="' + todayStr + '" required>' +
                '</div>' +
              '</div>' +

              // Live Summary Card
              '<div id="duration-summary-box" style="background: var(--color-teal-50); border: 1px solid var(--color-teal-100); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 20px;">' +
                '<div class="flex justify-between items-center">' +
                  '<div>' +
                    '<span class="text-xs font-semibold text-muted" style="text-transform: uppercase;">Estimated Requested Working Days</span>' +
                    '<div id="summary-days-value" style="font-size: 1.5rem; font-weight: 800; color: var(--color-teal-700);">1.0 Day(s)</div>' +
                  '</div>' +
                  '<div id="summary-balance-status" class="text-right text-xs text-muted">' +
                    '<div>Sundays / Holidays excluded per policy</div>' +
                    '<div id="summary-avail-note"></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              // Reason
              '<div class="form-group">' +
                '<label class="form-label" for="apply-reason">Reason for Leave <span class="required">*</span></label>' +
                '<textarea id="apply-reason" class="form-textarea" placeholder="State the reason for your absence (minimum 5 characters)..." required minlength="5"></textarea>' +
                '<span class="form-hint">Please provide sufficient detail for administrative and medical coverage planning.</span>' +
              '</div>' +

              // Optional contact and attachment
              '<div class="form-row">' +
                '<div class="form-group">' +
                  '<label class="form-label" for="apply-contact">Emergency Contact Phone (Optional)</label>' +
                  '<input type="tel" id="apply-contact" class="form-control" placeholder="Alternate phone during absence">' +
                '</div>' +
                '<div class="form-group">' +
                  '<label class="form-label" for="apply-attachment">Supporting Document Ref / Link (Optional)</label>' +
                  '<input type="text" id="apply-attachment" class="form-control" placeholder="e.g. Medical certificate reference or document URL">' +
                '</div>' +
              '</div>' +

              '<div class="card-footer mt-md" style="padding-left: 0; padding-right: 0; background: transparent; border-top: 1px solid var(--color-border);">' +
                '<button type="button" class="btn btn-secondary" id="apply-cancel-btn">Cancel</button>' +
                '<button type="submit" class="btn btn-primary" id="apply-submit-btn">' +
                  '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' +
                  '<span>Submit Application</span>' +
                '</button>' +
              '</div>' +

            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // Attach Interactive Calculation Events
    var typeSelect = document.getElementById('apply-leave-type');
    var startDateInput = document.getElementById('apply-start-date');
    var endDateInput = document.getElementById('apply-end-date');
    var endDateGroup = document.getElementById('end-date-group');
    var dayPartRadios = document.querySelectorAll('input[name="day-part"]');
    var summaryDaysVal = document.getElementById('summary-days-value');
    var summaryAvailNote = document.getElementById('summary-avail-note');
    var submitBtn = document.getElementById('apply-submit-btn');

    function getSelectedDayPart() {
      for (var r = 0; r < dayPartRadios.length; r++) {
        if (dayPartRadios[r].checked) return dayPartRadios[r].value;
      }
      return 'FULL';
    }

    function recalculateDuration() {
      var dayPart = getSelectedDayPart();
      var start = startDateInput.value;
      var end = endDateInput.value;

      if (dayPart !== 'FULL') {
        endDateGroup.style.display = 'none';
        endDateInput.value = start;
        end = start;
      } else {
        endDateGroup.style.display = 'block';
      }

      if (!start || !end) {
        summaryDaysVal.innerText = '0 Day(s)';
        return 0;
      }

      var sDate = new Date(start + 'T00:00:00');
      var eDate = new Date(end + 'T00:00:00');

      if (sDate > eDate) {
        summaryDaysVal.innerText = 'Invalid Date Range (Start > End)';
        summaryDaysVal.style.color = 'var(--color-danger)';
        submitBtn.disabled = true;
        return 0;
      }

      if (dayPart !== 'FULL') {
        summaryDaysVal.innerText = '0.5 Day (Half Day)';
        summaryDaysVal.style.color = 'var(--color-teal-700)';
        submitBtn.disabled = false;
        checkBalance(0.5);
        return 0.5;
      }

      // Calculate working days (excluding Sundays and holidays)
      var opt = typeSelect.selectedOptions[0];
      var weekendsPolicy = opt ? opt.getAttribute('data-weekends') : 'EXCLUDE_SUNDAYS';
      var holidaysPolicy = opt ? opt.getAttribute('data-holidays') : 'EXCLUDE_HOLIDAYS';

      var cur = new Date(sDate.getTime());
      var count = 0;
      var holidayDates = holidays.map(function(h) { return String(h.HolidayDate).substring(0, 10); });

      while (cur <= eDate) {
        var day = cur.getDay(); // 0 is Sunday
        var iso = cur.toISOString().substring(0, 10);
        var isWeekend = (weekendsPolicy === 'EXCLUDE_SUNDAYS' && day === 0) || (weekendsPolicy === 'EXCLUDE_WEEKENDS' && (day === 0 || day === 6));
        var isHol = (holidaysPolicy !== 'INCLUDE_ALL') && (holidayDates.indexOf(iso) !== -1);

        if (!isWeekend && !isHol) {
          count++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      summaryDaysVal.innerText = count + ' Working Day(s)';
      summaryDaysVal.style.color = count > 0 ? 'var(--color-teal-700)' : 'var(--color-warning)';
      submitBtn.disabled = count <= 0;

      checkBalance(count);
      return count;
    }

    function checkBalance(reqDays) {
      var opt = typeSelect.selectedOptions[0];
      if (!opt || !opt.value) {
        summaryAvailNote.innerHTML = '';
        return;
      }

      var reqBal = opt.getAttribute('data-reqbal') === 'true';
      var avail = parseFloat(opt.getAttribute('data-avail') || '0');
      var neg = opt.getAttribute('data-neg') === 'true';

      if (reqBal) {
        if (reqDays > avail && !neg) {
          summaryAvailNote.innerHTML = '<span style="color: var(--color-danger); font-weight: 700;">&bull; Exceeds available balance (' + avail + ' days available)</span>';
          submitBtn.disabled = true;
        } else {
          summaryAvailNote.innerHTML = '<span style="color: var(--color-success);">&bull; Sufficient balance available (' + avail + ' days)</span>';
          submitBtn.disabled = false;
        }
      } else {
        summaryAvailNote.innerHTML = '<span class="text-muted">&bull; Balance deduction not required for this type</span>';
        submitBtn.disabled = false;
      }
    }

    // Attach change handlers
    typeSelect.addEventListener('change', recalculateDuration);
    startDateInput.addEventListener('change', function() {
      if (getSelectedDayPart() !== 'FULL' || !endDateInput.value || endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
      }
      recalculateDuration();
    });
    endDateInput.addEventListener('change', recalculateDuration);
    for (var r = 0; r < dayPartRadios.length; r++) {
      dayPartRadios[r].addEventListener('change', recalculateDuration);
    }

    // Initial calculation
    recalculateDuration();

    // Form Submission
    document.getElementById('leave-application-form').addEventListener('submit', function(e) {
      e.preventDefault();

      var typeId = typeSelect.value;
      if (!typeId) {
        window.NRSLJ_TOAST.error('Please select a leave category');
        return;
      }

      var start = startDateInput.value;
      var end = endDateInput.value;
      var dayPart = getSelectedDayPart();
      var reason = document.getElementById('apply-reason').value.trim();
      var contact = document.getElementById('apply-contact').value.trim();
      var attachment = document.getElementById('apply-attachment').value.trim();

      var payload = {
        LeaveTypeID: typeId,
        StartDate: start,
        EndDate: end,
        DayPart: dayPart,
        Reason: reason,
        EmergencyContact: contact,
        AttachmentReference: attachment
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

      window.NRSLJ_API.call('submitLeaveRequest', payload)
        .then(function(res) {
          window.NRSLJ_TOAST.success('Leave request submitted successfully (' + res.requestId + ')');
          window.NRSLJ_STATE.setRoute('leave-history');
        })
        .catch(function(err) {
          window.NRSLJ_TOAST.error(err.message);
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Submit Application</span>';
        });
    });

    document.getElementById('apply-back-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('dashboard');
    });

    document.getElementById('apply-cancel-btn').addEventListener('click', function() {
      window.NRSLJ_STATE.setRoute('dashboard');
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
