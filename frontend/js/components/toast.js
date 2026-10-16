/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Toast Notification Component
 */

window.NRSLJ_TOAST = (function() {
  var container = null;

  function getContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(message, type, durationMs) {
    var c = getContainer();
    var toast = document.createElement('div');
    var toastType = type || 'info';
    toast.className = 'toast toast-' + toastType;

    var iconSvg = '';
    if (toastType === 'success') {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
    } else if (toastType === 'error') {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
    } else if (toastType === 'warning') {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"/></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" fill="none" stroke="#0d9488" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>';
    }

    toast.innerHTML = iconSvg + '<div class="toast-message">' + escapeHtml(message) + '</div>';
    c.appendChild(toast);

    var timer = setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, durationMs || 4000);

    toast.addEventListener('click', function() {
      clearTimeout(timer);
      if (toast.parentNode) toast.parentNode.removeChild(toast);
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
    success: function(msg, dur) { show(msg, 'success', dur); },
    error: function(msg, dur) { show(msg, 'error', dur); },
    warning: function(msg, dur) { show(msg, 'warning', dur); },
    info: function(msg, dur) { show(msg, 'info', dur); }
  };
})();
