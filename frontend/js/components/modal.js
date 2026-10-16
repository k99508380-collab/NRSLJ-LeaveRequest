/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Accessible Modal Dialog Component
 */

window.NRSLJ_MODAL = (function() {
  var activeModal = null;

  function open(options) {
    close(); // Close any currently open modal

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'active-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    var dialog = document.createElement('div');
    dialog.className = 'modal-dialog' + (options.size === 'lg' ? ' modal-dialog-lg' : '');

    var header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = '<h3 class="modal-title">' + (options.title || 'Notification') + '</h3>' +
      '<button type="button" class="btn-icon" aria-label="Close modal" id="modal-close-btn">' +
      '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      '</button>';

    var body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof options.body === 'string') {
      body.innerHTML = options.body;
    } else if (options.body instanceof HTMLElement) {
      body.appendChild(options.body);
    }

    dialog.appendChild(header);
    dialog.appendChild(body);

    if (options.footer) {
      var footer = document.createElement('div');
      footer.className = 'modal-footer';
      if (typeof options.footer === 'string') {
        footer.innerHTML = options.footer;
      } else if (options.footer instanceof HTMLElement) {
        footer.appendChild(options.footer);
      }
      dialog.appendChild(footer);
    }

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    activeModal = backdrop;

    // Events
    header.querySelector('#modal-close-btn').addEventListener('click', close);

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) close();
    });

    document.addEventListener('keydown', handleEscKey);

    if (options.onOpen) {
      options.onOpen(dialog);
    }

    return dialog;
  }

  function handleEscKey(e) {
    if (e.key === 'Escape') close();
  }

  function close() {
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
    }
    document.removeEventListener('keydown', handleEscKey);
    activeModal = null;
  }

  return {
    open: open,
    close: close
  };
})();
