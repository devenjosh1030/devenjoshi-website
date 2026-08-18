/**
 * 6-Tab Navigation & State Synchronization (Bulletproof)
 * Deven Joshi Board Portal (devenjoshi.com)
 */

const TabManager = (() => {
  function getTabButtons() {
    return document.querySelectorAll('.tab-nav-btn');
  }

  function getTabPanes() {
    return document.querySelectorAll('.tab-content-pane');
  }

  function switchTab(tabId, pushHash = true, shouldScroll = true) {
    if (!tabId) return;

    // Verify authentication first
    if (!AuthManager.isAuthenticated()) {
      AuthManager.showGatekeeper();
      return;
    }

    const buttons = getTabButtons();
    const panes = getTabPanes();
    const targetPane = document.getElementById(`tab-${tabId}`);

    if (!targetPane) {
      console.warn(`Tab pane #tab-${tabId} not found`);
      return;
    }

    // Update button states
    buttons.forEach(btn => {
      const match = btn.getAttribute('data-tab') === tabId;
      if (match) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Update pane visibility
    panes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    if (pushHash) {
      try {
        history.replaceState(null, null, `#${tabId}`);
      } catch (e) {
        // fallback
      }
    }

    // Scroll smoothly to the sticky navigation bar so tab content is immediately in view
    if (shouldScroll) {
      const navWrapper = document.getElementById('tabs-navigation');
      if (navWrapper) {
        const yOffset = -20;
        const y = navWrapper.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

  function init() {
    const buttons = getTabButtons();
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute('data-tab');
        switchTab(tabId, true, true);
      });
    });

    // Handle deep link on page load if hash exists
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
      if (AuthManager.isAuthenticated()) {
        switchTab(hash, false, false);
      }
    }

    // Listen for hashchange events
    window.addEventListener('hashchange', () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash && document.getElementById(`tab-${currentHash}`)) {
        if (AuthManager.isAuthenticated()) {
          switchTab(currentHash, false, true);
        }
      }
    });
  }

  return {
    init,
    switchTab
  };
})();

document.addEventListener('DOMContentLoaded', TabManager.init);
