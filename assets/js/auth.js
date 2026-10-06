/**
 * Executive Boardroom Gatekeeper, RBAC & User Management System
 * Deven Joshi Board Portal (devenjoshi.com)
 *
 * Strict Role-Based Access Control (RBAC):
 * - Gated Entry: Manual authentication required with valid User ID and Passcode.
 * - Admin Exclusivity: Only authenticated Admins can view/open the Admin Control Panel,
 *   create new users, update user IDs, edit passwords, or delete accounts.
 */

const AuthManager = (() => {
  const SESSION_KEY = 'devenjoshi_board_auth_session';
  const USERS_DB_KEY = 'devenjoshi_board_users_db';

  // In-memory fallback if browser storage is blocked
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

  // Default Authorized Seed Accounts
  const DEFAULT_USERS = [
    {
      uid: 'deven.joshi',
      aliases: ['deven.joshi', 'deven', 'devenjoshi', 'admin', 'idevenjoshi@gmail.com'],
      pwd: 'DevenBoard2026!',
      name: 'Deven Joshi',
      org: 'Board Candidate / Owner',
      role: 'admin',
      created: '2026-08-14',
      status: 'active'
    },
    {
      uid: 'board',
      aliases: ['board', 'boardroom', 'boardroom2026', 'governance', 'committee', 'nominating'],
      pwd: 'Boardroom2026!',
      name: 'Nominating & Governance Committee',
      org: 'Corporate Board Review',
      role: 'member',
      created: '2026-08-14',
      status: 'active'
    },
    {
      uid: 'director',
      aliases: ['director', 'search', 'recruiter', 'search chair'],
      pwd: 'Director2026!',
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

  /**
   * Retrieves and reconciles user database, ensuring root accounts are active.
   */
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

      // Reconcile and ensure DEFAULT_USERS are present
      DEFAULT_USERS.forEach(seedUser => {
        const existingIdx = users.findIndex(u => u && u.uid && u.uid.toLowerCase() === seedUser.uid.toLowerCase());
        if (existingIdx === -1) {
          users.unshift({ ...seedUser });
        } else {
          users[existingIdx].aliases = seedUser.aliases;
          users[existingIdx].status = 'active';
          if (!users[existingIdx].pwd) {
            users[existingIdx].pwd = seedUser.pwd;
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
      // ONLY show Admin Panel button if the user is an active Administrator
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
  }

  /**
   * Matches input UID against user uid or recognized aliases.
   */
  function matchUser(users, inputUid, inputPwd) {
    const cleanUid = inputUid.trim().toLowerCase();
    const cleanPwd = inputPwd.trim();

    return users.find(u => {
      if (!u || u.status !== 'active') return false;
      const uidMatch = (u.uid && u.uid.toLowerCase() === cleanUid) ||
                       (Array.isArray(u.aliases) && u.aliases.some(a => a.toLowerCase() === cleanUid));
      const pwdMatch = u.pwd === cleanPwd;
      return uidMatch && pwdMatch;
    });
  }

  function handleLogin(e) {
    if (e) e.preventDefault();
    const inputUid = (uidInput ? uidInput.value : '').trim();
    const inputPwd = (pwdInput ? pwdInput.value : '').trim();

    if (!inputUid || !inputPwd) {
      if (errorMsg) {
        errorMsg.innerHTML = 'Please enter both User ID and Passcode.';
        errorMsg.classList.add('show');
      }
      return;
    }

    const users = getUsersDB();
    const matchedUser = matchUser(users, inputUid, inputPwd);

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
      if (errorMsg) {
        errorMsg.innerHTML = '<strong>Access Denied:</strong> Invalid User ID or Passcode. Please verify your credentials or contact the administrator.';
        errorMsg.classList.add('show');
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
        <td style="padding: 0.75rem 1rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
          •••••••• <button class="show-pwd-btn" data-pwd="${user.pwd}" style="background: none; border: none; color: var(--accent-blue-light); cursor: pointer; font-size: 0.75rem; margin-left: 0.3rem;">👁️ View</button>
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

    // Attach View Password listeners (Admin Only)
    document.querySelectorAll('.show-pwd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isAdmin()) {
          App.showToast('Unauthorized.');
          return;
        }
        const pwd = btn.getAttribute('data-pwd');
        alert(`Passcode for this account:\n${pwd}`);
      });
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
      btn.addEventListener('click', () => {
        if (!isAdmin()) {
          App.showToast('Unauthorized: Only Administrator can update passwords.');
          return;
        }
        const uid = btn.getAttribute('data-uid');
        const newPwd = prompt(`Enter new Passcode for user '${uid}':`);
        if (newPwd && newPwd.trim().length > 0) {
          updateUserPassword(uid, newPwd.trim());
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
  function addNewUser(uid, pwd, name, org, role = 'member') {
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

    users.push({
      uid: cleanUid,
      aliases: [cleanUid.toLowerCase()],
      pwd: cleanPwd,
      name: name.trim() || cleanUid,
      org: org.trim() || 'Board Reviewer',
      role: role === 'admin' ? 'admin' : 'member',
      created: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    saveUsersDB(users);
    renderUsersTable();
    App.showToast(`User '${cleanUid}' created successfully.`);
    return true;
  }

  /**
   * Updates an existing user's ID / Login handle - ADMIN ONLY.
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
   * Updates an existing user's password - ADMIN ONLY.
   */
  function updateUserPassword(uid, newPwd) {
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
      user.pwd = cleanPwd;
      saveUsersDB(users);
      renderUsersTable();
      App.showToast(`Passcode updated for user '${uid}'.`);
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
    getUsersDB(); // ensure DB initialized and seed users reconciled

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
      addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUid = document.getElementById('new-user-uid').value;
        const newPwd = document.getElementById('new-user-pwd').value;
        const newName = document.getElementById('new-user-name').value;
        const newOrg = document.getElementById('new-user-org').value;
        const newRole = document.getElementById('new-user-role').value;

        if (addNewUser(newUid, newPwd, newName, newOrg, newRole)) {
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
