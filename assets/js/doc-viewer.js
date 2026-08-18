/**
 * Document Hub & Protected PDF Modal Viewer (Strict No-Download Policy)
 * Deven Joshi Board Portal (devenjoshi.com)
 */

const DocViewer = (() => {
  const modalOverlay = document.getElementById('doc-modal-overlay');
  const modalTitle = document.getElementById('doc-modal-title');
  const modalIframe = document.getElementById('doc-modal-iframe');
  const modalCloseBtn = document.getElementById('doc-modal-close-btn');
  const modalFullscreenBtn = document.getElementById('doc-modal-fullscreen-btn');

  function openPreview(docUrl, docTitle) {
    if (!AuthManager.isAuthenticated()) {
      AuthManager.showGatekeeper();
      return;
    }

    if (modalTitle) modalTitle.textContent = docTitle || 'Executive Document Preview';
    
    // Suppress PDF toolbar, download, and print buttons via PDF parameter flags
    const secureUrl = `${docUrl}#toolbar=0&navpanes=0&scrollbar=1`;
    if (modalIframe) modalIframe.src = secureUrl;

    if (modalOverlay) {
      modalOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closePreview() {
    if (modalOverlay) {
      modalOverlay.classList.remove('show');
      document.body.style.overflow = '';
    }
    if (modalIframe) {
      setTimeout(() => {
        modalIframe.src = 'about:blank';
      }, 200);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (modalOverlay && modalOverlay.requestFullscreen) {
        modalOverlay.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function init() {
    // Attach preview button listeners
    document.querySelectorAll('.btn-doc-preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const docUrl = btn.getAttribute('data-doc-url');
        const docTitle = btn.getAttribute('data-doc-title');
        openPreview(docUrl, docTitle);
      });
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closePreview);
    }

    if (modalFullscreenBtn) {
      modalFullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('show')) {
        closePreview();
      }
    });

    // Close if clicked on backdrop
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closePreview();
        }
      });
    }

    // Prevent right-click inside document modal to protect confidential board assets
    if (modalOverlay) {
      modalOverlay.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        App.showToast('Protected Document: Download and copying are restricted by the Board.');
      });
    }
  }

  return {
    init,
    openPreview,
    closePreview
  };
})();

document.addEventListener('DOMContentLoaded', DocViewer.init);
