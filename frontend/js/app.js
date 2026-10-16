/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Employee Leave Management System - Main Application Orchestrator & Router
 */

(function() {
  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    // 1. Initial Header & Sidebar rendering
    window.NRSLJ_HEADER.render('app-header');
    window.NRSLJ_SIDEBAR.render('app-sidebar');

    // 2. Subscribe to state changes to update navigation & views
    window.NRSLJ_STATE.subscribe(function(state, key) {
      if (key === 'user' || key === 'settings' || key === 'notifications') {
        window.NRSLJ_HEADER.render('app-header');
        window.NRSLJ_SIDEBAR.render('app-sidebar');
      }

      if (key === 'route' || key === 'user') {
        renderCurrentRoute();
      }
    });

    // 3. Hash change listener for browser navigation
    window.addEventListener('hashchange', function() {
      var hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== window.NRSLJ_STATE.get().currentRoute) {
        window.NRSLJ_STATE.setRoute(hash);
      }
    });

    // 4. Check session
    window.NRSLJ_AUTH.checkSession()
      .then(function(user) {
        if (!user) {
          // If hash is diagnostics, allow viewing without login
          var initialHash = window.location.hash.replace('#', '').trim();
          if (initialHash === 'diagnostics') {
            window.NRSLJ_STATE.setRoute('diagnostics');
          } else {
            window.NRSLJ_STATE.setRoute('auth');
          }
        } else {
          var initialHash = window.location.hash.replace('#', '').trim();
          if (initialHash) {
            window.NRSLJ_STATE.setRoute(initialHash);
          } else {
            // Default route by role
            if (user.Role === 'ADMIN') {
              window.NRSLJ_STATE.setRoute('admin-dashboard');
            } else if (user.Role === 'MANAGER') {
              window.NRSLJ_STATE.setRoute('manager-dashboard');
            } else {
              window.NRSLJ_STATE.setRoute('dashboard');
            }
          }
        }
      });
  }

  function renderCurrentRoute() {
    var state = window.NRSLJ_STATE.get();
    var route = state.currentRoute;
    var user = state.currentUser;

    // Update URL hash without reload
    if (window.location.hash !== '#' + route) {
      history.replaceState(null, null, '#' + route);
    }

    // Role Guard: if not authenticated and not in diagnostics, redirect to auth
    if (!user && route !== 'auth' && route !== 'diagnostics') {
      window.NRSLJ_STATE.setRoute('auth');
      return;
    }

    // If authenticated and on auth route, redirect to dashboard
    if (user && route === 'auth') {
      window.NRSLJ_STATE.setRoute('dashboard');
      return;
    }

    // Re-render sidebar active state
    window.NRSLJ_SIDEBAR.render('app-sidebar');

    // Route dispatch
    switch (route) {
      case 'auth':
        window.NRSLJ_AUTH_VIEW.render('main-content');
        break;

      case 'dashboard':
        window.NRSLJ_EMPLOYEE_DASHBOARD.render('main-content');
        break;

      case 'apply-leave':
        window.NRSLJ_LEAVE_APPLY_VIEW.render('main-content');
        break;

      case 'leave-history':
        window.NRSLJ_LEAVE_HISTORY_VIEW.render('main-content');
        break;

      case 'manager-dashboard':
        window.NRSLJ_MANAGER_DASHBOARD.render('main-content');
        break;

      case 'admin-dashboard':
        window.NRSLJ_ADMIN_DASHBOARD.render('main-content');
        break;

      case 'admin-registrations':
        window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render('main-content', 'pending');
        break;

      case 'admin-employees':
        window.NRSLJ_ADMIN_EMPLOYEES_VIEW.render('main-content', 'all');
        break;

      case 'admin-leave-config':
        window.NRSLJ_ADMIN_LEAVE_CONFIG_VIEW.render('main-content');
        break;

      case 'admin-reports':
        window.NRSLJ_ADMIN_REPORTS_VIEW.render('main-content');
        break;

      case 'hospital-settings':
        window.NRSLJ_HOSPITAL_SETTINGS_VIEW.render('main-content');
        break;

      case 'audit-logs':
        window.NRSLJ_AUDIT_LOGS_VIEW.render('main-content');
        break;

      case 'diagnostics':
        window.NRSLJ_DIAGNOSTICS_VIEW.render('main-content');
        break;

      default:
        window.NRSLJ_EMPLOYEE_DASHBOARD.render('main-content');
        break;
    }
  }
})();
