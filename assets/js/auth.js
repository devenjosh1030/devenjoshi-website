/**
 * Executive Boardroom Gatekeeper, RBAC & Multi-Layer Anti-Brute-Force Security
 * Deven Joshi Board Portal (devenjoshi.com)
 *
 * Security Architecture:
 * 1. Zero Plaintext Passwords in Source Code (Irreversible Salted SHA-256 Hashes)
 * 2. Adaptive Rate Limiting & Exponential Penalty Lockout
 * 3. Artificial Cryptographic Delay (Defeats high-speed dictionary attacks)
 * 4. Invisible Honeypot Trap (Instantly blocks AI agents / automated bots)
 * 5. Strict Admin-Only Role-Based Access Control (RBAC)
 */

const AuthManager = (() => {
  const SESSION_KEY = 'devenjoshi_board_auth_session';
  const USERS_DB_KEY = 'devenjoshi_board_users_db_v2';
  const RATE_LIMIT_KEY = 'devenjoshi_board_rl_state';
  const HASH_SALT = 'deven_boardroom_2026_salt_';

  // In-memory fallback if browser storage is restricted
  const memoryStore = {};

  function safeStorageGet(type, key) {
    try {
      const storage = type === 'session' ? window.sessionStorage : window.localStorage;
      return storage.getItem(key);
    } catch (e) {
      return memoryStore[`${type}_${key}`] || null;
    }
  }

  function safeStorageSet(type, key, value) {
    try {
      const storage = type === 'session' ? window.sessionStorage : window.localStorage;
      storage.setItem(key, value);
    } catch (e) {
      memoryStore[`${type}_${key}`] = value;
    }
  }

  function safeStorageRemove(type, key) {
    try {
      const storage = type === 'session' ? window.sessionStorage : window.localStorage;
      storage.removeItem(key);
    } catch (e) {
      delete memoryStore[`${type}_${key}`];
    }
  }

  /**
   * Cryptographic Salted SHA-256 Hashing (Web Crypto API)
   */
  async function computeHash(plaintext) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(HASH_SALT + plaintext.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback simple hash for older environments if crypto.subtle is unavailable
      let hash = 0;
      const str = HASH_SALT + plaintext.trim();
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return 'fb_' + Math.abs(hash).toString(16);
    }
  }

  // Pre-computed Salted SHA-256 Hashes for Default Accounts (No Plaintext)
  const DEFAULT_USERS = [
    {
      uid: 'deven.joshi',
      aliases: ['deven.joshi', 'deven', 'devenjoshi', 'admin', 'idevenjoshi@gmail.com'],
      pwdHash: 'abdd9c9e8c5a0f83c9f5aa6eaca9ce1f220e75a226d4eeb33e003906c87c3e8e',
      name: 'Deven Joshi',
      org: 'Board Candidate / Owner',
      role: 'admin',
      created: '2026-08-14',
      status: 'active'
    },
    {
      uid: 'board',
      aliases: ['board', 'boardroom', 'boardroom2026', 'governance', 'committee', 'nominating'],
      pwdHash: '71a9d8ac9b683a4dc0b48e9fbdb60b78b6b89556fbea79b445f79d81784b3099',
      name: 'Nominating & Governance Committee',
      org: 'Corporate Board Review',
      role: 'member',
      created: '2026-08-14',
      status: 'active'
    },
    {
      uid: 'director',
      aliases: ['director', 'search', 'recruiter', 'search chair'],
      pwdHash: '04a433db3e2ac0b27a65f2e2bccc9dc0dc617feec26d15c3144efd5c760ad3fc',
      name: 'Executive Search Chair',
      org: 'Search Partner Review',
      role: 'member',
      created: '2026-08-14',
      status: 'active'
    }
  ];

  // DOM Elements
  const gatekeeperOverlay = document.getElementById('gatekeeper-overlay');
  const gatekeeperForm = document.getElementById('gatekeeper-form');
  const uidInput = document.getElementById('gatekeeper-uid');
  const pwdInput = document.getElementById('gatekeeper-pwd');
  const errorMsg = document.getElementById('gatekeeper-error');
  const lockBtn = document.getElementById('portal-lock-btn');
  const statusBadge = document.getElementById('portal-access-status');
  const portalHeroUnlockBtn = document.getElementById('hero-enter-portal-btn');
  const adminPanelBtn = document.getElementById('admin-panel-btn');
  const adminModal = document.getElementById('admin-panel-modal');
  const adminModalCloseBtn = document.getElementById('admin-modal-close-btn');
  const addUserForm = document.getElementById('add-user-form');
  const usersTableBody = document.getElementById('users-table-body');
  const togglePwdVisibilityBtn = document.getElementById('toggle-pwd-visibility-btn');
  const honeypotTrap = document.getElementById('gatekeeper-hp-trap');

  let lockoutInterval = null;

  // =========================================================================
  // RATE LIMITING & LOCKOUT CONTROLS
  // =========================================================================

  function getRateLimitState() {
    try {
      const stored = safeStorageGet('local', RATE_LIMIT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return { attempts: 0, lockoutUntil: 0 };
  }

  function setRateLimitState(attempts, lockoutUntil) {
    const state = { attempts, lockoutUntil };
    safeStorageSet('local', RATE_LIMIT_KEY, JSON.stringify(state));
  }

  function checkLockout() {
    const state = getRateLimitState();
    const now = Date.now();

    if (state.lockoutUntil && state.lockoutUntil > now) {
      const remainingSecs = Math.ceil((state.lockoutUntil - now) / 1000);
      renderLockoutUI(remainingSecs);
      return true;
    }
    clearLockoutUI();
    return false;
  }

  function recordFailedAttempt(customPenaltySeconds = null) {
    const state = getRateLimitState();
    const newAttempts = (state.attempts || 0) + 1;
    let lockoutDuration = 0;

    if (customPenaltySeconds) {
      lockoutDuration = customPenaltySeconds * 1000;
    } else if (newAttempts >= 8) {
      lockoutDuration = 30 * 60 * 1000; // 30 minutes
    } else if (newAttempts >= 5) {
      lockoutDuration = 5 * 60 * 1000;  // 5 minutes
    } else if (newAttempts >= 3) {
      lockoutDuration = 30 * 1000;       // 30 seconds
    }

    const lockoutUntil = lockoutDuration > 0 ? Date.now() + lockoutDuration : 0;
    setRateLimitState(newAttempts, lockoutUntil);

    if (lockoutDuration > 0) {
      renderLockoutUI(Math.ceil(lockoutDuration / 1000));
    }
  }

  function resetRateLimit() {
    setRateLimitState(0, 0);
    clearLockoutUI();
  }

  function renderLockoutUI(secondsRemaining) {
    if (lockoutInterval) clearInterval(lockoutInterval);

    function updateText(secs) {
      if (errorMsg) {
        errorMsg.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
            <span>🔒</span>
            <strong>Security Lockout: Too many failed attempts.</strong>
          </div>
          <span style="display:block; margin-top:0.3rem; font-size:0.75rem;">
            Cooling down for security protection. Try again in <strong>${secs}s</strong>.
          </span>
        `;
        errorMsg.classList.add('show');
      }
      if (uidInput) uidInput.disabled = true;
      if (pwdInput) pwdInput.disabled = true;
      const submitBtn = gatekeeperForm ? gatekeeperForm.querySelector('button[type="submit"]') : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
      }
    }

    let remaining = secondsRemaining;
    updateText(remaining);

    lockoutInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(lockoutInterval);
        resetRateLimit();
      } else {
        updateText(remaining);
      }
    }, 1000);
  }

  function clearLockoutUI() {
    if (lockoutInterval) {
      clearInterval(lockoutInterval);
      lockoutInterval = null;
    }
    if (uidInput) uidInput.disabled = false;
    if (pwdInput) pwdInput.disabled = false;
    const submitBtn = gatekeeperForm ? gatekeeperForm.querySelector('button[type="submit"]') : null;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
    if (errorMsg && errorMsg.textContent.includes('Security Lockout')) {
      errorMsg.classList.remove('show');
    }
  }

  // =========================================================================
  // USER DATABASE & SESSION MANAGEMENT
  // =========================================================================

  function getUsersDB() {
    try {
      const stored = safeStorageGet('local', USERS_DB_KEY);
      let users = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            users = parsed;
          }
        } catch (e) {
          users = [];
        }
      }

      // Reconcile and ensure DEFAULT_USERS are present with secure password hashes
      DEFAULT_USERS.forEach(seedUser => {
        const existingIdx = users.findIndex(u => u && u.uid && u.uid.toLowerCase() === seedUser.uid.toLowerCase());
        if (existingIdx === -1) {
          users.unshift({ ...seedUser });
        } else {
          users[existingIdx].aliases = seedUser.aliases;
          users[existingIdx].status = 'active';
          if (!users[existingIdx].pwdHash) {
            users[existingIdx].pwdHash = seedUser.pwdHash;
          }
        }
      });

      safeStorageSet('local', USERS_DB_KEY, JSON.stringify(users));
      return users;
    } catch (e) {
      return [...DEFAULT_USERS];
    }
  }

  function saveUsersDB(users) {
    safeStorageSet('local', USERS_DB_KEY, JSON.stringify(users));
  }

  function getSession() {
    const session = safeStorageGet('session', SESSION_KEY) || safeStorageGet('local', SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    const session = getSession();
    return Boolean(session && session.authenticated === true);
  }

  function isAdmin() {
    const session = getSession();
    return Boolean(session && session.authenticated === true && session.role === 'admin');
  }

  function setAuthenticated(user, remember = true) {
    const sessionData = JSON.stringify({
      authenticated: true,
      uid: user.uid,
      name: user.name,
      role: user.role || 'member',
      timestamp: Date.now()
    });

    safeStorageSet('session', SESSION_KEY, sessionData);
    if (remember) {
      safeStorageSet('local', SESSION_KEY, sessionData);
    }
    resetRateLimit();
    updateUIState(true, user.role);
  }

  function logout() {
    safeStorageRemove('session', SESSION_KEY);
    safeStorageRemove('local', SESSION_KEY);
    updateUIState(false);
    showGatekeeper();
    App.showToast('Board Portal Locked. Authentication required.');
  }

  function updateUIState(authed, role = 'member') {
    const session = getSession();
    const currentRole = authed ? (role || (session ? session.role : 'member')) : null;

    if (authed) {
      if (gatekeeperOverlay) {
        gatekeeperOverlay.classList.add('hidden');
      }
      if (statusBadge) {
        if (currentRole === 'admin') {
          statusBadge.innerHTML = '<span class="status-dot gold"></span> 👑 Admin: Deven Joshi';
          statusBadge.classList.add('clearance');
        } else {
          statusBadge.innerHTML = '<span class="status-dot"></span> Verified Board Access';
          statusBadge.classList.add('clearance');
        }
      }
      if (lockBtn) {
        lockBtn.style.display = 'inline-flex';
      }
      // Strictly show Admin Panel button ONLY to authenticated Admins
      if (adminPanelBtn) {
        if (currentRole === 'admin') {
          adminPanelBtn.style.display = 'inline-flex';
          adminPanelBtn.innerHTML = '⚙️ Admin Panel';
          adminPanelBtn.className = 'btn btn-gold';
          adminPanelBtn.style.padding = '0.4rem 0.9rem';
          adminPanelBtn.style.fontSize = '0.78rem';
          adminPanelBtn.title = 'Manage Authorized Users & Credentials';
        } else {
          adminPanelBtn.style.display = 'none';
        }
      }
    } else {
      if (statusBadge) {
        statusBadge.innerHTML = '<span class="status-dot gold"></span> Board Portal Gated';
        statusBadge.classList.remove('clearance');
      }
      if (lockBtn) {
        lockBtn.style.display = 'none';
      }
      if (adminPanelBtn) {
        adminPanelBtn.style.display = 'none';
      }
    }
  }

  function showGatekeeper() {
    if (gatekeeperOverlay) {
      gatekeeperOverlay.classList.remove('hidden');
      if (uidInput) {
        uidInput.value = '';
        uidInput.focus();
      }
      if (pwdInput) pwdInput.value = '';
      if (errorMsg) errorMsg.classList.remove('show');
    }
    checkLockout();
  }

  /**
   * Matches input credentials against stored accounts using cryptographic hash verification.
   */
  async function matchUser(users, inputUid, inputPwd) {
    const cleanUid = inputUid.trim().toLowerCase();
    const computedInputHash = await computeHash(inputPwd);

    return users.find(u => {
      if (!u || u.status !== 'active') return false;
      const uidMatch = (u.uid && u.uid.toLowerCase() === cleanUid) ||
                       (Array.isArray(u.aliases) && u.aliases.some(a => a.toLowerCase() === cleanUid));
      const hashMatch = u.pwdHash === computedInputHash;
      return uidMatch && hashMatch;
    });
  }

  /**
   * Main Login Handler with Rate Limiting, Honeypot Inspection & Artificial Cryptographic Delay
   */
  async function handleLogin(e) {
    if (e) e.preventDefault();

    // Check if system is currently locked out
    if (checkLockout()) {
      return;
    }

    // Anti-Bot & AI Scraper Honeypot Check
    if (honeypotTrap && honeypotTrap.value.trim().length > 0) {
      // An automated bot or agent filled out the invisible honeypot field!
      console.warn('Security Alert: Automated Bot Trapped.');
      recordFailedAttempt(900); // 15-minute penalty
      return;
    }

    const inputUid = (uidInput ? uidInput.value : '').trim();
    const inputPwd = (pwdInput ? pwdInput.value : '').trim();

    if (!inputUid || !inputPwd) {
      if (errorMsg) {
        errorMsg.innerHTML = 'Please enter both User ID and Passcode.';
        errorMsg.classList.add('show');
      }
      return;
    }

    const submitBtn = gatekeeperForm ? gatekeeperForm.querySelector('button[type="submit"]') : null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verifying Credentials...';
    }

    // Introduce artificial cryptographic delay (600ms) to prevent high-speed dictionary/brute-force attacks
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getUsersDB();
    const matchedUser = await matchUser(users, inputUid, inputPwd);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Authenticate & Enter Portal</span><span>➔</span>';
    }

    if (matchedUser) {
      if (errorMsg) errorMsg.classList.remove('show');
      setAuthenticated(matchedUser, true);
      App.showToast(`Authenticated as ${matchedUser.name} (${matchedUser.role === 'admin' ? '👑 Site Administrator' : '👤 Board Member'})`);

      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(`tab-${hash}`)) {
        TabManager.switchTab(hash, false, true);
      } else {
        TabManager.switchTab('portfolio', true, true);
      }
    } else {
      recordFailedAttempt();
      if (!checkLockout()) {
        const state = getRateLimitState();
        const remaining = 3 - state.attempts;
        const warning = remaining > 0 ? ` (${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout)` : '';
        if (errorMsg) {
          errorMsg.innerHTML = `<strong>Access Denied:</strong> Invalid User ID or Passcode.${warning}`;
          errorMsg.classList.add('show');
        }
      }
    }
  }

  // =========================================================================
  // STRICT ADMIN USER MANAGEMENT (Admin Only)
  // =========================================================================

  function renderUsersTable() {
    if (!usersTableBody) return;
    if (!isAdmin()) {
      usersTableBody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--text-muted);">Access Restricted to Administrators.</td></tr>';
      return;
    }

    const users = getUsersDB();
    usersTableBody.innerHTML = '';

    users.forEach((user) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-subtle)';
      const isAdminUser = user.role === 'admin';
      const isDeven = user.uid === 'deven.joshi';

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; font-family: var(--font-mono); font-weight: 600; color: ${isAdminUser ? 'var(--accent-gold-light)' : 'var(--text-primary)'};">
          ${user.uid}
        </td>
        <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">
          ${user.name} <span style="font-size: 0.75rem; color: var(--text-muted);">(${user.org || 'N/A'})</span>
        </td>
        <td style="padding: 0.75rem 1rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
          <span title="Cryptographic SHA-256 Hash Protected">🔒 Hash Protected</span>
        </td>
        <td style="padding: 0.75rem 1rem;">
          <span class="status-pill ${isAdminUser ? 'clearance' : ''}" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">
            ${isAdminUser ? '👑 Admin' : '👤 Member'}
          </span>
        </td>
        <td style="padding: 0.75rem 1rem; text-align: right; white-space: nowrap;">
          <button class="edit-uid-btn btn btn-secondary" data-uid="${user.uid}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Change User ID">
            🆔 Edit ID
          </button>
          <button class="edit-pwd-btn btn btn-secondary" data-uid="${user.uid}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Change Password">
            🔑 Edit Pass
          </button>
          ${isDeven ? '' : `
            <button class="delete-user-btn btn btn-secondary" data-uid="${user.uid}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; color: #FDA4AF; border-color: rgba(244,63,94,0.3);" title="Delete User">
              🗑️ Delete
            </button>
          `}
        </td>
      `;
      usersTableBody.appendChild(tr);
    });

    // Attach Edit User ID listeners (Admin Only)
    document.querySelectorAll('.edit-uid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isAdmin()) {
          App.showToast('Unauthorized: Only Administrator can change User IDs.');
          return;
        }
        const oldUid = btn.getAttribute('data-uid');
        const newUid = prompt(`Enter new User ID / Login for user '${oldUid}':`, oldUid);
        if (newUid && newUid.trim().length > 0 && newUid.trim() !== oldUid) {
          updateUserId(oldUid, newUid.trim());
        }
      });
    });

    // Attach Edit Password listeners (Admin Only)
    document.querySelectorAll('.edit-pwd-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!isAdmin()) {
          App.showToast('Unauthorized: Only Administrator can update passwords.');
          return;
        }
        const uid = btn.getAttribute('data-uid');
        const newPwd = prompt(`Enter new Passcode for user '${uid}':`);
        if (newPwd && newPwd.trim().length > 0) {
          await updateUserPassword(uid, newPwd.trim());
        }
      });
    });

    // Attach Delete listeners (Admin Only)
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isAdmin()) {
          App.showToast('Unauthorized: Only Administrator can delete users.');
          return;
        }
        const uid = btn.getAttribute('data-uid');
        if (confirm(`Are you sure you want to permanently delete user '${uid}'?`)) {
          deleteUser(uid);
        }
      });
    });
  }

  /**
   * Creates a new user - ADMIN ONLY.
   */
  async function addNewUser(uid, pwd, name, org, role = 'member') {
    if (!isAdmin()) {
      App.showToast('Unauthorized: Administrator clearance required.');
      return false;
    }

    const cleanUid = uid.trim();
    const cleanPwd = pwd.trim();

    if (!cleanUid || !cleanPwd) {
      App.showToast('Error: User ID and Password are required.');
      return false;
    }

    const users = getUsersDB();
    if (users.some(u => u.uid.toLowerCase() === cleanUid.toLowerCase())) {
      App.showToast(`Error: User '${cleanUid}' already exists.`);
      return false;
    }

    const pwdHash = await computeHash(cleanPwd);

    users.push({
      uid: cleanUid,
      aliases: [cleanUid.toLowerCase()],
      pwdHash: pwdHash,
      name: name.trim() || cleanUid,
      org: org.trim() || 'Board Reviewer',
      role: role === 'admin' ? 'admin' : 'member',
      created: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    saveUsersDB(users);
    renderUsersTable();
    App.showToast(`User '${cleanUid}' created successfully with encrypted credentials.`);
    return true;
  }

  /**
   * Updates an existing user's ID - ADMIN ONLY.
   */
  function updateUserId(oldUid, newUid) {
    if (!isAdmin()) {
      App.showToast('Unauthorized: Administrator clearance required.');
      return false;
    }

    const users = getUsersDB();
    const cleanNew = newUid.trim();

    if (users.some(u => u.uid.toLowerCase() === cleanNew.toLowerCase() && u.uid.toLowerCase() !== oldUid.toLowerCase())) {
      App.showToast(`Error: User ID '${cleanNew}' is already taken.`);
      return false;
    }

    const user = users.find(u => u.uid.toLowerCase() === oldUid.toLowerCase());
    if (user) {
      user.uid = cleanNew;
      if (!user.aliases) user.aliases = [];
      if (!user.aliases.includes(cleanNew.toLowerCase())) {
        user.aliases.push(cleanNew.toLowerCase());
      }
      saveUsersDB(users);
      renderUsersTable();
      App.showToast(`User ID updated from '${oldUid}' to '${cleanNew}'.`);
      return true;
    }
    return false;
  }

  /**
   * Updates an existing user's password with SHA-256 hashing - ADMIN ONLY.
   */
  async function updateUserPassword(uid, newPwd) {
    if (!isAdmin()) {
      App.showToast('Unauthorized: Administrator clearance required.');
      return false;
    }

    const cleanPwd = newPwd.trim();
    if (!cleanPwd) {
      App.showToast('Error: Passcode cannot be empty.');
      return false;
    }

    const users = getUsersDB();
    const user = users.find(u => u.uid.toLowerCase() === uid.toLowerCase());
    if (user) {
      user.pwdHash = await computeHash(cleanPwd);
      saveUsersDB(users);
      renderUsersTable();
      App.showToast(`Encrypted passcode updated for user '${uid}'.`);
      return true;
    }
    return false;
  }

  /**
   * Deletes a user - ADMIN ONLY.
   */
  function deleteUser(uid) {
    if (!isAdmin()) {
      App.showToast('Unauthorized: Administrator clearance required.');
      return false;
    }

    if (uid.toLowerCase() === 'deven.joshi') {
      App.showToast('Root administrator account cannot be deleted.');
      return false;
    }

    let users = getUsersDB();
    users = users.filter(u => u.uid.toLowerCase() !== uid.toLowerCase());
    saveUsersDB(users);
    renderUsersTable();
    App.showToast(`User '${uid}' deleted.`);
    return true;
  }

  function openAdminModal() {
    if (!isAdmin()) {
      App.showToast('Access Denied: Administrator clearance required.');
      return;
    }
    renderUsersTable();
    if (adminModal) {
      adminModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeAdminModal() {
    if (adminModal) {
      adminModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  function handleHeroEnterPortal(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAuthenticated()) {
      showGatekeeper();
    } else {
      App.showToast('Accessing Unified Board Dossier (Tab 1)...');
      TabManager.switchTab('portfolio', true, true);
    }
  }

  function setupPasswordToggle() {
    if (togglePwdVisibilityBtn && pwdInput) {
      togglePwdVisibilityBtn.addEventListener('click', () => {
        const isPassword = pwdInput.getAttribute('type') === 'password';
        pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
        togglePwdVisibilityBtn.textContent = isPassword ? '🙈' : '👁️';
      });
    }
  }

  function init() {
    getUsersDB(); // initialize and seed secure hashes
    checkLockout();

    if (gatekeeperForm) {
      gatekeeperForm.addEventListener('submit', handleLogin);
    }
    if (lockBtn) {
      lockBtn.addEventListener('click', logout);
    }
    if (portalHeroUnlockBtn) {
      portalHeroUnlockBtn.addEventListener('click', handleHeroEnterPortal);
    }

    setupPasswordToggle();

    if (adminPanelBtn) {
      adminPanelBtn.addEventListener('click', () => {
        if (isAdmin()) {
          openAdminModal();
        } else {
          App.showToast('Access Denied: Administrator clearance required.');
        }
      });
    }

    if (adminModalCloseBtn) {
      adminModalCloseBtn.addEventListener('click', closeAdminModal);
    }

    if (addUserForm) {
      addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUid = document.getElementById('new-user-uid').value;
        const newPwd = document.getElementById('new-user-pwd').value;
        const newName = document.getElementById('new-user-name').value;
        const newOrg = document.getElementById('new-user-org').value;
        const newRole = document.getElementById('new-user-role').value;

        if (await addNewUser(newUid, newPwd, newName, newOrg, newRole)) {
          addUserForm.reset();
        }
      });
    }

    // Check existing authentication
    const session = getSession();
    if (session && session.authenticated) {
      updateUIState(true, session.role);
    } else {
      updateUIState(false);
      if (uidInput) uidInput.value = '';
      if (pwdInput) pwdInput.value = '';
    }
  }

  return {
    init,
    isAuthenticated,
    isAdmin,
    showGatekeeper,
    handleHeroEnterPortal,
    logout,
    openAdminModal,
    closeAdminModal
  };
})();

document.addEventListener('DOMContentLoaded', AuthManager.init);
