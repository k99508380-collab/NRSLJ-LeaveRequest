/**
 * NRSLJ SPECIALITY HOSPITALS, MUSIRI
 * Authentication & Session Management Module
 */

var AUTH = {
  ROUNDS: 1000,
  SESSION_DURATION_HOURS: 24,

  /**
   * Generates a cryptographically strong unique salt
   */
  generateSalt: function() {
    var raw = Utilities.getUuid() + ':' + new Date().getTime() + ':' + Math.random();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
    return Utilities.base64EncodeWebSafe(digest);
  },

  /**
   * Iterative HMAC-SHA256 salted password hashing
   */
  hashPassword: function(password, salt) {
    if (!password || !salt) {
      throw new Error('Password and salt are required for hashing');
    }
    var current = password + ':' + salt;
    for (var i = 0; i < this.ROUNDS; i++) {
      var sig = Utilities.computeHmacSha256Signature(current, salt);
      current = Utilities.base64EncodeWebSafe(sig);
    }
    return current;
  },

  /**
   * Constant-time comparison to prevent timing attacks
   */
  constantTimeCompare: function(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    var lengthA = a.length;
    var lengthB = b.length;
    var diff = lengthA ^ lengthB;
    var minLen = Math.min(lengthA, lengthB);
    for (var i = 0; i < minLen; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  },

  /**
   * Creates a new authenticated session
   */
  createSession: function(employeeId, role) {
    var token = 'NRSLJ_' + Utilities.getUuid().replace(/-/g, '') + '_' + 
                Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Math.random() + ':' + new Date().getTime())).substring(0, 16);

    var now = new Date();
    var expiresAt = new Date(now.getTime() + (this.SESSION_DURATION_HOURS * 60 * 60 * 1000));
    var expiresIso = Utilities.formatDate(expiresAt, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    var createdIso = Utilities.formatDate(now, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    var sessionRecord = {
      SessionToken: token,
      EmployeeID: employeeId,
      Role: role,
      ExpiresAt: expiresIso,
      CreatedAt: createdIso
    };

    // Store in sheet
    appendRow(CONFIG.SHEET_NAMES.SESSIONS, sessionRecord);

    // Cache session token for fast retrieval (max Apps Script cache is 6 hours = 21600s)
    try {
      var cache = CacheService.getScriptCache();
      cache.put('sess_' + token, JSON.stringify(sessionRecord), 21600);
    } catch (e) {
      // Cache failure is non-fatal
    }

    return {
      sessionToken: token,
      expiresAt: expiresIso
    };
  },

  /**
   * Validates an incoming session token and retrieves the authenticated employee record
   */
  validateSession: function(token, requiredRole) {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('UNAUTHORIZED: Missing session token');
    }
    token = token.trim();

    var sessionData = null;
    var cache = CacheService.getScriptCache();
    var cached = cache.get('sess_' + token);

    if (cached) {
      try {
        sessionData = JSON.parse(cached);
      } catch (e) {
        sessionData = null;
      }
    }

    if (!sessionData) {
      var sessions = readAllRows(CONFIG.SHEET_NAMES.SESSIONS);
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].SessionToken === token) {
          sessionData = sessions[i];
          break;
        }
      }
    }

    if (!sessionData) {
      throw new Error('UNAUTHORIZED: Invalid or expired session');
    }

    // Verify expiration
    var nowIso = getIsoTimestamp();
    if (sessionData.ExpiresAt && sessionData.ExpiresAt < nowIso) {
      // Clean up expired session
      this.destroySession(token);
      throw new Error('UNAUTHORIZED: Session expired. Please log in again.');
    }

    // Retrieve Employee record
    var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
    var employee = null;
    for (var j = 0; j < employees.length; j++) {
      if (employees[j].EmployeeID === sessionData.EmployeeID) {
        employee = employees[j];
        break;
      }
    }

    if (!employee) {
      throw new Error('UNAUTHORIZED: Associated employee account not found');
    }

    if (employee.AccountStatus !== CONFIG.ACCOUNT_STATUS.ACTIVE) {
      throw new Error('FORBIDDEN: Account is not active (' + employee.AccountStatus + ')');
    }

    // Verify Role Hierarchy / Permissions
    if (requiredRole) {
      if (requiredRole === CONFIG.ROLES.ADMIN && employee.Role !== CONFIG.ROLES.ADMIN) {
        throw new Error('FORBIDDEN: Administrative privileges required');
      }
      if (requiredRole === CONFIG.ROLES.MANAGER && employee.Role !== CONFIG.ROLES.MANAGER && employee.Role !== CONFIG.ROLES.ADMIN) {
        throw new Error('FORBIDDEN: Manager or Admin privileges required');
      }
    }

    // Return sanitized employee profile (never expose hashes/salts)
    var sanitized = JSON.parse(JSON.stringify(employee));
    delete sanitized.PasswordHash;
    delete sanitized.PasswordSalt;
    delete sanitized._rowIndex;

    return sanitized;
  },

  /**
   * Destroys/logs out a session
   */
  destroySession: function(token) {
    if (!token) return;
    try {
      CacheService.getScriptCache().remove('sess_' + token);
    } catch (e) {}

    try {
      deleteRowById(CONFIG.SHEET_NAMES.SESSIONS, 'SessionToken', token);
    } catch (e) {}
  },

  /**
   * User login verification with rate-limiting check
   */
  login: function(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Username and password are required');
    }
    identifier = String(identifier).trim().toLowerCase();

    // Rate-limiting check via Cache
    var cache = CacheService.getScriptCache();
    var attemptKey = 'login_fail_' + identifier;
    var failCount = parseInt(cache.get(attemptKey) || '0', 10);
    if (failCount >= CONFIG.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Too many failed login attempts. Please wait 15 minutes before trying again.');
    }

    var employees = readAllRows(CONFIG.SHEET_NAMES.EMPLOYEES);
    var matched = null;

    for (var i = 0; i < employees.length; i++) {
      var emp = employees[i];
      var empUsername = String(emp.Username || '').trim().toLowerCase();
      var empPhone = String(emp.Phone || '').trim();

      if (empUsername === identifier || empPhone === identifier) {
        matched = emp;
        break;
      }
    }

    // Generic error to prevent username enumeration
    if (!matched) {
      cache.put(attemptKey, String(failCount + 1), 900); // 15 mins
      logAuditEvent('ANONYMOUS', 'LOGIN_FAILED', 'User', identifier, 'FAILED', { reason: 'User not found' });
      throw new Error('Invalid username or password');
    }

    // Check account status
    if (matched.RegistrationStatus === CONFIG.REGISTRATION_STATUS.PENDING) {
      throw new Error('Your registration is pending approval by Admin/HR. You will be notified once activated.');
    }
    if (matched.AccountStatus === CONFIG.ACCOUNT_STATUS.INACTIVE || matched.RegistrationStatus === CONFIG.REGISTRATION_STATUS.REJECTED) {
      throw new Error('Your account has been deactivated or rejected. Please contact Hospital Administration.');
    }
    if (matched.AccountStatus !== CONFIG.ACCOUNT_STATUS.ACTIVE) {
      throw new Error('Account is not currently active.');
    }

    // Verify password
    var computedHash = this.hashPassword(password, matched.PasswordSalt);
    var isValid = this.constantTimeCompare(computedHash, matched.PasswordHash);

    if (!isValid) {
      cache.put(attemptKey, String(failCount + 1), 900);
      logAuditEvent(matched.EmployeeID, 'LOGIN_FAILED', 'User', matched.EmployeeID, 'FAILED', { reason: 'Password mismatch' });
      throw new Error('Invalid username or password');
    }

    // Reset failed attempts
    cache.remove(attemptKey);

    // Update LastLoginAt
    var nowIso = getIsoTimestamp();
    updateRowById(CONFIG.SHEET_NAMES.EMPLOYEES, 'EmployeeID', matched.EmployeeID, {
      LastLoginAt: nowIso
    });

    // Create session
    var session = this.createSession(matched.EmployeeID, matched.Role);

    logAuditEvent(matched.EmployeeID, 'LOGIN_SUCCESS', 'User', matched.EmployeeID, 'SUCCESS', { role: matched.Role });

    var userProfile = JSON.parse(JSON.stringify(matched));
    delete userProfile.PasswordHash;
    delete userProfile.PasswordSalt;
    delete userProfile._rowIndex;

    return {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: userProfile
    };
  }
};
