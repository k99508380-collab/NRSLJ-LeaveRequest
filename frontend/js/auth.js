/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Authentication Controller & Session Guard
 */

window.NRSLJ_AUTH = (function() {
  function checkSession() {
    var token = localStorage.getItem(window.NRSLJ_CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    if (!token) {
      return Promise.resolve(null);
    }

    return window.NRSLJ_API.call('getProfile', {})
      .then(function(user) {
        window.NRSLJ_STATE.setUser(user, token);
        // Load initial notifications & hospital info
        loadInitialData();
        return user;
      })
      .catch(function(err) {
        console.warn('Session expired or invalid:', err.message);
        window.NRSLJ_STATE.clearUser();
        return null;
      });
  }

  function login(identifier, password) {
    return window.NRSLJ_API.call('login', {
      identifier: identifier,
      password: password
    })
    .then(function(res) {
      window.NRSLJ_STATE.setUser(res.user, res.sessionToken);
      window.NRSLJ_TOAST.success('Welcome, ' + (res.user.FullName || res.user.Username));
      
      // Load initial notifications & hospital info
      loadInitialData();

      // Route based on role
      if (res.user.Role === 'ADMIN') {
        window.NRSLJ_STATE.setRoute('admin-dashboard');
      } else if (res.user.Role === 'MANAGER') {
        window.NRSLJ_STATE.setRoute('manager-dashboard');
      } else {
        window.NRSLJ_STATE.setRoute('dashboard');
      }

      return res.user;
    });
  }

  function register(data) {
    return window.NRSLJ_API.call('register', data);
  }

  function logout() {
    var token = window.NRSLJ_STATE.get().sessionToken;
    if (token) {
      window.NRSLJ_API.call('logout', {})
        .catch(function(e) { /* non-fatal */ });
    }
    window.NRSLJ_STATE.clearUser();
    window.NRSLJ_STATE.setRoute('auth');
    window.NRSLJ_TOAST.info('Logged out successfully');
  }

  function loadInitialData() {
    // 1. Fetch public/hospital settings
    window.NRSLJ_API.call('getPublicHospitalInfo', {})
      .then(function(info) {
        if (info) {
          window.NRSLJ_STATE.setHospitalSettings({
            HOSPITAL_NAME: info.hospitalName,
            LOGO_URL: info.logoUrl
          });
        }
      })
      .catch(function() {});

    // 2. Fetch notifications
    window.NRSLJ_API.call('getNotifications', { onlyUnread: false })
      .then(function(notifs) {
        window.NRSLJ_STATE.setNotifications(notifs);
      })
      .catch(function() {});
  }

  return {
    checkSession: checkSession,
    login: login,
    register: register,
    logout: logout,
    loadInitialData: loadInitialData
  };
})();
