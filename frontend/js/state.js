/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Global Reactive Application State Store
 */

window.NRSLJ_STATE = (function() {
  var state = {
    currentUser: null,
    sessionToken: localStorage.getItem(window.NRSLJ_CONFIG.STORAGE_KEYS.SESSION_TOKEN) || null,
    currentRoute: 'dashboard',
    hospitalSettings: {
      HOSPITAL_NAME: window.NRSLJ_CONFIG.HOSPITAL_NAME,
      LOGO_URL: '',
      APPROVAL_WORKFLOW: 'MANAGER_THEN_HR'
    },
    notifications: [],
    unreadCount: 0,
    departments: [],
    designations: [],
    leaveTypes: []
  };

  var listeners = [];

  function subscribe(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function(l) { return l !== fn; });
    };
  }

  function notify(changedKey) {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](state, changedKey);
      } catch (e) {
        console.error('State subscriber error:', e);
      }
    }
  }

  function setUser(user, token) {
    state.currentUser = user;
    if (token) {
      state.sessionToken = token;
      localStorage.setItem(window.NRSLJ_CONFIG.STORAGE_KEYS.SESSION_TOKEN, token);
      localStorage.setItem(window.NRSLJ_CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    }
    notify('user');
  }

  function clearUser() {
    state.currentUser = null;
    state.sessionToken = null;
    state.notifications = [];
    state.unreadCount = 0;
    localStorage.removeItem(window.NRSLJ_CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(window.NRSLJ_CONFIG.STORAGE_KEYS.USER_PROFILE);
    notify('user');
  }

  function setRoute(route) {
    state.currentRoute = route;
    notify('route');
  }

  function setNotifications(notifs) {
    state.notifications = notifs || [];
    var unread = 0;
    for (var i = 0; i < state.notifications.length; i++) {
      if (!state.notifications[i].ReadAt) unread++;
    }
    state.unreadCount = unread;
    notify('notifications');
  }

  function setHospitalSettings(settings) {
    if (settings) {
      state.hospitalSettings = Object.assign({}, state.hospitalSettings, settings);
      notify('settings');
    }
  }

  return {
    get: function() { return state; },
    subscribe: subscribe,
    setUser: setUser,
    clearUser: clearUser,
    setRoute: setRoute,
    setNotifications: setNotifications,
    setHospitalSettings: setHospitalSettings
  };
})();
