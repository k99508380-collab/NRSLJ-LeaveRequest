/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Unified API Client Adapter
 * Seamlessly supports both Google Apps Script HTML Service and Standalone Web App
 */

window.NRSLJ_API = (function() {
  var isGasEnvironment = typeof google !== 'undefined' && google.script && google.script.run;

  /**
   * Main dispatch method
   */
  function call(action, data) {
    var sessionToken = localStorage.getItem(window.NRSLJ_CONFIG.STORAGE_KEYS.SESSION_TOKEN) || '';

    if (isGasEnvironment) {
      return callGas(action, sessionToken, data);
    } else {
      return callHttp(action, sessionToken, data);
    }
  }

  /**
   * Google Apps Script HTML Service Runner
   */
  function callGas(action, sessionToken, data) {
    return new Promise(function(resolve, reject) {
      try {
        google.script.run
          .withSuccessHandler(function(response) {
            if (response && response.success) {
              resolve(response.data);
            } else {
              var errMsg = response && response.message ? response.message : 'Operation failed';
              reject(new Error(errMsg));
            }
          })
          .withFailureHandler(function(err) {
            reject(new Error(err && err.message ? err.message : 'Apps Script backend execution error'));
          })
          .apiDispatcher(action, sessionToken, data || {});
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Standalone HTTP Fetch to Google Apps Script Web App URL
   * Uses text/plain to avoid CORS preflight issues
   */
  function callHttp(action, sessionToken, data) {
    var webAppUrl = window.NRSLJ_CONFIG.getWebAppUrl();

    if (!webAppUrl) {
      return Promise.reject(new Error(
        'Backend URL not configured. Click "Connection Diagnostics" in the header to configure your Google Apps Script Web App URL.'
      ));
    }

    var payload = {
      action: action,
      sessionToken: sessionToken,
      data: data || {}
    };

    return fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
    .then(function(res) {
      if (!res.ok) {
        throw new Error('Server returned HTTP ' + res.status + ' ' + res.statusText);
      }
      return res.json();
    })
    .then(function(json) {
      if (json && json.success) {
        return json.data;
      } else {
        var msg = json && json.message ? json.message : 'Backend operation failed';
        var err = new Error(msg);
        err.code = json ? json.errorCode : 'UNKNOWN';
        throw err;
      }
    })
    .catch(function(err) {
      if (err.name === 'TypeError' && err.message.toLowerCase().indexOf('fetch') !== -1) {
        throw new Error('Network error or CORS issue contacting Apps Script backend. Ensure the web app is deployed with "Who has access: Anyone".');
      }
      throw err;
    });
  }

  /**
   * Health check utility
   */
  function ping(customUrl) {
    var targetUrl = customUrl || window.NRSLJ_CONFIG.getWebAppUrl();
    if (isGasEnvironment) {
      return callGas('healthCheck', '', {});
    }

    if (!targetUrl) {
      return Promise.reject(new Error('No Web App URL provided'));
    }

    var payload = { action: 'healthCheck', sessionToken: '', data: {} };
    return fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (j && j.success) return j.data;
      throw new Error(j ? j.message : 'Health check failed');
    });
  }

  return {
    call: call,
    ping: ping,
    isGasEnvironment: function() { return isGasEnvironment; }
  };
})();
