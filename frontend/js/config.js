/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Frontend Configuration & Storage Keys
 */

window.NRSLJ_CONFIG = {
  HOSPITAL_NAME: 'NRSLJ SPECIALITY HOSPITALS, MUSIRI',
  DEFAULT_LOGO_PATH: 'assets/logo.svg',
  
  // Storage Keys (Only non-secret session identifiers and UI preferences)
  STORAGE_KEYS: {
    SESSION_TOKEN: 'nrslj_session_token',
    USER_PROFILE: 'nrslj_user_profile',
    WEB_APP_URL: 'nrslj_web_app_url',
    HOSPITAL_LOGO: 'nrslj_custom_logo'
  },

  // Default Web App URL
  DEFAULT_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbw2oV0ujrIqHwPOEn_7ZQ9loq9IlDugYdGrJoKtB6Epru5-q46cozBaLIuYxHVVDPU2tQ/exec',

  // Default Web App URL (Can be updated via UI Diagnostics screen or environment)
  getWebAppUrl: function() {
    var stored = localStorage.getItem(this.STORAGE_KEYS.WEB_APP_URL);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
    return this.DEFAULT_WEB_APP_URL;
  },

  setWebAppUrl: function(url) {
    if (url) {
      localStorage.setItem(this.STORAGE_KEYS.WEB_APP_URL, url.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.WEB_APP_URL);
    }
  },

  formatDate: function(dateStr) {
    if (!dateStr) return '';
    var str = String(dateStr).trim();
    if (str.indexOf('T') !== -1) {
      str = str.split('T')[0];
    }
    if (str.indexOf(' ') !== -1) {
      str = str.split(' ')[0];
    }
    return str;
  }
};
