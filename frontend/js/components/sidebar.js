/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Responsive Sidebar Navigation Component
 */

window.NRSLJ_SIDEBAR = (function() {
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var state = window.NRSLJ_STATE.get();
    var user = state.currentUser;
    var currentRoute = state.currentRoute;

    if (!user) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';

    var role = user.Role;
    var html = '<nav class="sidebar-nav">';

    // 1. Employee Section (Accessible to all authenticated staff)
    html += '<div class="sidebar-category-header">Staff Portal</div>';
    html += createNavLink('dashboard', 'Dashboard', '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>', currentRoute === 'dashboard');
    html += createNavLink('apply-leave', 'Apply for Leave', '<path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>', currentRoute === 'apply-leave');
    html += createNavLink('leave-history', 'Leave History', '<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>', currentRoute === 'leave-history');

    // 2. Manager Section (Managers & Admins)
    if (role === 'MANAGER' || role === 'ADMIN') {
      html += '<div class="sidebar-category-header">Manager Approvals</div>';
      html += createNavLink('manager-dashboard', 'Team Approvals', '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>', currentRoute === 'manager-dashboard');
    }

    // 3. Admin / HR Section
    if (role === 'ADMIN') {
      html += '<div class="sidebar-category-header">Hospital Administration</div>';
      html += createNavLink('admin-dashboard', 'Admin Overview', '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>', currentRoute === 'admin-dashboard');
      html += createNavLink('admin-registrations', 'Registrations Queue', '<path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>', currentRoute === 'admin-registrations');
      html += createNavLink('admin-employees', 'Employees List', '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>', currentRoute === 'admin-employees');
      html += createNavLink('admin-leave-config', 'Leave & Policy Setup', '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>', currentRoute === 'admin-leave-config');
      html += createNavLink('admin-reports', 'Reports & Analytics', '<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>', currentRoute === 'admin-reports');
      html += createNavLink('hospital-settings', 'Hospital Settings', '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>', currentRoute === 'hospital-settings');
      html += createNavLink('audit-logs', 'Audit Logs', '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>', currentRoute === 'audit-logs');
    }

    // Diagnostics link for all users (helpful for connection testing)
    html += '<div class="sidebar-category-header">System</div>';
    html += createNavLink('diagnostics', 'Diagnostics & Setup', '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', currentRoute === 'diagnostics');

    html += '</nav>';

    // Sidebar footer
    html += '<div class="sidebar-footer text-xs text-muted">' +
      '<div>' + (state.hospitalSettings.HOSPITAL_NAME || 'NRSLJ Hospitals') + '</div>' +
      '<div class="mt-xs">Version 1.0.0 &bull; Musiri</div>' +
      '</div>';

    container.innerHTML = html;

    // Attach click listeners to nav buttons
    var links = container.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(e) {
        var route = this.getAttribute('data-route');
        if (route) {
          window.NRSLJ_STATE.setRoute(route);
          // Close mobile sidebar if open
          var sidebar = document.getElementById('app-sidebar');
          var backdrop = document.getElementById('sidebar-backdrop');
          if (sidebar) sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('active');
        }
      });
    }
  }

  function createNavLink(route, label, svgPath, isActive) {
    return '<button type="button" class="nav-link' + (isActive ? ' active' : '') + '" data-route="' + route + '">' +
      '<svg fill="none" viewBox="0 0 24 24">' + svgPath + '</svg>' +
      '<span>' + label + '</span>' +
      '</button>';
  }

  return {
    render: render
  };
})();
