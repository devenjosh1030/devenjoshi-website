/**
 * Executive Boardroom Gatekeeper, RBAC & User Management System
 * Deven Joshi Board Portal (devenjoshi.com)
 */

const AuthManager = (() => {
  const SESSION_KEY = 'devenjoshi_board_auth_session';
  const USERS_DB_KEY = 'devenjoshi_board_users_db';

  // Default Seed Users
  const DEFAULT_USERS = [
    {
      uid: 'deven.joshi',
      pwd: 'DevenBoard2026!',
      name: 'Deven Joshi',
      org: 'Board Candidate / Owner',
      role: 'admin',
      created: '2026-08-14',
      status: 'active'
    },
    {
      uid: 'board',
      pwd: 'Boardroom2026!',
      name: 'Nominating & Governance Committee',
      org: 'Corporate Board Review',
      role: 'member',
      created: '2026-08-14',
      status: 'active'
    },
    {
      uid: 'director',
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
  const vipBypassBtn = document.getElementById('vip-bypass-btn');
  const lockBtn = document.getElementById('portal-lock-btn');
  const statusBadge = document.getElementById('portal-access-status');
  const portalHeroUnlockBtn = document.getElementById('hero-enter-portal-btn');
  const adminPanelBtn = document.getElementById('admin-panel-btn');
  const adminModal = document.getElementById('admin-panel-modal');
  const adminModalCloseBtn = document.getElementById('admin-modal-close-btn');
  const addUserForm = document.getElementById('add-user-form');
  const usersTableBody = document.getElementById('users-table-body');

  function getUsersDB() {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      if (!stored) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_USERS;
    }
  }

  function saveUsersDB(users) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  }

  function getSession() {
    const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    const session = getSession();
    return session && session.authenticated === true;
  }

  function isAdmin() {
    const session = getSession();
    return session && session.authenticated === true && session.role === 'admin';
  }

  function setAuthenticated(user, remember = false) {
    const sessionData = JSON.stringify({
      authenticated: true,
      uid: user.uid,
      name: user.name,
      role: user.role || 'member',
      timestamp: Date.now()
    });
    sessionStorage.setItem(SESSION_KEY, sessionData);
    if (remember) {
      localStorage.setItem(SESSION_KEY, sessionData);
    }
    updateUIState(true, user.role);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    updateUIState(false);
    showGatekeeper();
    App.showToast('Board Portal Locked. Enter credentials to re-access.');
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
      if (adminPanelBtn) {
        adminPanelBtn.style.display = 'inline-flex';
        if (currentRole === 'admin') {
          adminPanelBtn.innerHTML = '⚙️ Admin Panel';
          adminPanelBtn.className = 'btn btn-gold';
          adminPanelBtn.style.padding = '0.4rem 0.9rem';
          adminPanelBtn.style.fontSize = '0.78rem';
          adminPanelBtn.title = 'Manage Authorized Users';
        } else {
          adminPanelBtn.innerHTML = '⚙️ Switch to Admin';
          adminPanelBtn.className = 'btn btn-outline-gold';
          adminPanelBtn.style.padding = '0.4rem 0.85rem';
          adminPanelBtn.style.fontSize = '0.78rem';
          adminPanelBtn.title = 'Login with Admin Credentials';
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
        adminPanelBtn.style.display = 'inline-flex';
        adminPanelBtn.innerHTML = '⚙️ Admin Login';
        adminPanelBtn.className = 'btn btn-outline-gold';
        adminPanelBtn.style.padding = '0.4rem 0.85rem';
        adminPanelBtn.style.fontSize = '0.78rem';
      }
    }
  }

  function showGatekeeper(presetUid = '', presetPwd = '') {
    if (gatekeeperOverlay) {
      gatekeeperOverlay.classList.remove('hidden');
      if (presetUid && uidInput) uidInput.value = presetUid;
      if (presetPwd && pwdInput) pwdInput.value = presetPwd;
      if (uidInput) uidInput.focus();
    }
  }

  function handleLogin(e) {
    if (e) e.preventDefault();
    const inputUid = (uidInput ? uidInput.value : '').trim().toLowerCase();
    const inputPwd = (pwdInput ? pwdInput.value : '').trim();

    const users = getUsersDB();
    const matchedUser = users.find(u => 
      u.uid.toLowerCase() === inputUid && 
      u.pwd === inputPwd && 
      u.status === 'active'
    );

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
        errorMsg.innerHTML = '<strong>Invalid credentials.</strong><br>Admin: <code>deven.joshi</code> / <code>DevenBoard2026!</code><br>Board: <code>board</code> / <code>Boardroom2026!</code>';
        errorMsg.classList.add('show');
      }
    }
  }

  function handleAdminBypass() {
    const users = getUsersDB();
    const adminUser = users.find(u => u.uid === 'deven.joshi') || DEFAULT_USERS[0];
    if (uidInput) uidInput.value = adminUser.uid;
    if (pwdInput) pwdInput.value = adminUser.pwd;
    if (errorMsg) errorMsg.classList.remove('show');
    setAuthenticated(adminUser, true);
    App.showToast('👑 Site Administrator Access Granted (Deven Joshi)');
    TabManager.switchTab('portfolio', true, true);
  }

  function handleVipBypass() {
    const users = getUsersDB();
    const boardUser = users.find(u => u.uid === 'board') || DEFAULT_USERS[1];
    if (uidInput) uidInput.value = boardUser.uid;
    if (pwdInput) pwdInput.value = boardUser.pwd;
    if (errorMsg) errorMsg.classList.remove('show');
    setAuthenticated(boardUser, true);
    App.showToast('👤 Verified Boardroom Access Granted');
    
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
      TabManager.switchTab(hash, false, true);
    } else {
      TabManager.switchTab('portfolio', true, true);
    }
  }

  // Admin User Management
  function renderUsersTable() {
    if (!usersTableBody) return;
    const users = getUsersDB();
    usersTableBody.innerHTML = '';

    users.forEach((user, index) => {
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
        <td style="padding: 0.75rem 1rem; text-align: right;">
          <button class="edit-pwd-btn btn btn-secondary" data-uid="${user.uid}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-right: 0.35rem;">
            ✏️ Edit
          </button>
          ${isDeven ? '' : `
            <button class="delete-user-btn btn btn-secondary" data-uid="${user.uid}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; color: #FDA4AF; border-color: rgba(244,63,94,0.3);">
              🗑️ Delete
            </button>
          `}
        </td>
      `;
      usersTableBody.appendChild(tr);
    });

    // Attach View Password listeners
    document.querySelectorAll('.show-pwd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pwd = btn.getAttribute('data-pwd');
        alert(`Password for this user: ${pwd}`);
      });
    });

    // Attach Edit Password listeners
    document.querySelectorAll('.edit-pwd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-uid');
        const newPwd = prompt(`Enter new password for user '${uid}':`);
        if (newPwd && newPwd.trim().length > 0) {
          updateUserPassword(uid, newPwd.trim());
        }
      });
    });

    // Attach Delete listeners
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-uid');
        if (confirm(`Are you sure you want to permanently delete user '${uid}'?`)) {
          deleteUser(uid);
        }
      });
    });
  }

  function addNewUser(uid, pwd, name, org, role = 'member') {
    const users = getUsersDB();
    if (users.some(u => u.uid.toLowerCase() === uid.toLowerCase())) {
      App.showToast(`Error: User '${uid}' already exists.`);
      return false;
    }

    users.push({
      uid: uid.trim(),
      pwd: pwd.trim(),
      name: name.trim() || uid.trim(),
      org: org.trim() || 'Board Reviewer',
      role: role,
      created: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    saveUsersDB(users);
    renderUsersTable();
    App.showToast(`User '${uid}' created successfully.`);
    return true;
  }

  function updateUserPassword(uid, newPwd) {
    const users = getUsersDB();
    const user = users.find(u => u.uid.toLowerCase() === uid.toLowerCase());
    if (user) {
      user.pwd = newPwd;
      saveUsersDB(users);
      renderUsersTable();
      App.showToast(`Password updated for user '${uid}'.`);
    }
  }

  function deleteUser(uid) {
    let users = getUsersDB();
    users = users.filter(u => u.uid.toLowerCase() !== uid.toLowerCase());
    saveUsersDB(users);
    renderUsersTable();
    App.showToast(`User '${uid}' deleted.`);
  }

  function openAdminModal() {
    if (!isAdmin()) {
      App.showToast('Administrator privileges required.');
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

  function init() {
    getUsersDB(); // ensure DB initialized

    if (gatekeeperForm) {
      gatekeeperForm.addEventListener('submit', handleLogin);
    }
    const adminBypassBtn = document.getElementById('admin-bypass-btn');
    if (adminBypassBtn) {
      adminBypassBtn.addEventListener('click', handleAdminBypass);
    }
    if (vipBypassBtn) {
      vipBypassBtn.addEventListener('click', handleVipBypass);
    }
    if (lockBtn) {
      lockBtn.addEventListener('click', logout);
    }
    if (portalHeroUnlockBtn) {
      portalHeroUnlockBtn.addEventListener('click', handleHeroEnterPortal);
    }

    if (adminPanelBtn) {
      adminPanelBtn.addEventListener('click', () => {
        if (isAdmin()) {
          openAdminModal();
        } else {
          showGatekeeper('deven.joshi', 'DevenBoard2026!');
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
