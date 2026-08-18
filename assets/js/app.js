/**
 * Main Application Orchestrator & Interactive Utilities
 * Deven Joshi Board Portal (devenjoshi.com)
 */

const App = (() => {
  // Updated Official Bio Packets Text
  const BIO_DATA = {
    '150': `Deven Joshi is an accomplished enterprise AI and technology executive with over 25 years of experience providing strategic direction, risk oversight, and fiduciary stewardship across Fortune 100 corporations, federal defense agencies, and highly regulated industries. Currently serving as Chief AI Officer at C5MI, he leads enterprise AI strategies, agentic operating models, and governance frameworks that translate intelligent technologies into durable enterprise value. Grounded in senior leadership tenures at Google Public Sector, Google Cloud, Deloitte, and the U.S. Army, and supported by an active DoD Top Secret clearance and former SAP Platinum Consultant recognition, Deven advises corporate boardrooms on Responsible AI adoption, cyber resilience, and technology modernization.`,
    
    '300': `Deven Joshi is an accomplished enterprise AI executive and independent board advisor with over 25 years of experience at the confluence of emerging technology, large-scale systems modernization, and fiduciary governance. As Chief AI Officer at C5MI, he directs enterprise AI initiatives, agentic operating models, and data governance frameworks across defense, federal logistics, healthcare, and commercial sectors.

Throughout his career, Deven has served as a strategic advisor to C-suite and technology leaders at Google Public Sector, Google Cloud, AWS, and SAP—evaluating complex capital investments and co-leading strategic pursuits, including a two-year pursuit for a $50 million Defense Logistics Agency modernization effort. His deep governance foundation was established during his tenure as Senior Engagement & Product Manager at Deloitte & Touche LLP, where he directed multi-million-dollar digital transformations and developed rigorous methodologies for financial, operational, and technology risk oversight.

Deven specializes in boardroom advisory across Audit & Risk, Nominating & Governance, and Cyber/AI Technology committees. He brings a disciplined, independent perspective to the boardroom, balancing robust oversight of strategic risks with a collaborative approach to challenging executive management constructively. He holds a B.S. in Mechanical Engineering from New Jersey Institute of Technology, is a former SAP Platinum Consultant and SUSE Gold-Certified professional, and maintains an active U.S. Department of Defense Top Secret clearance.`,

    'full': `Deven Joshi is an accomplished enterprise AI and digital transformation executive with over 25 years of experience providing strategic direction, risk oversight, and fiduciary stewardship to Fortune 100 corporations, federal defense agencies, and highly regulated industries. Operating at the intersection of emerging technology and fiduciary responsibility, he brings precise independent judgment, enterprise scaling acumen, and data-driven stewardship to safeguard shareholder value and accelerate sustainable corporate growth.

Currently serving as Chief AI Officer at C5MI, Deven architects enterprise-wide AI operating models, data platforms, and agentic workflows, moving organizations safely from experimental pilots to robust, production-scale adoption. His prior career milestones include serving as Customer Engineer for AI, SAP & ERP at Google Public Sector (where he co-led a two-year pursuit for a $50M Defense Logistics Agency opportunity), Customer Engineer at Google Cloud advising Fortune 100 leaders, VP and Chief SAP Solution Lead at Kochasoft (scaling practice revenue from $1.5M to $5M+ in one year), Senior Engagement & Product Manager at Deloitte & Touche LLP (managing multi-million dollar transformation programs), and Senior Architect for the United States Army (leading logistics and supply chain modernization).

A core qualification for Deven’s boardroom service is his rigorous foundation in financial, operational, and technology risk management built during his tenure within Deloitte’s Audit & Advisory practice. He specializes in establishing governance frameworks for mission-critical and regulated environments, focusing on:
- Responsible AI Governance: Algorithmic transparency, ethical guardrails, bias mitigation, and auditability.
- Cybersecurity & Data Sovereignty: Zero Trust architectures, federal compliance standards (SPRS, 32 CFR, DoD IL4/5), and cloud resilience.
- Technology Capital Allocation: Evaluating technology investment roadmaps, cloud ROI, vendor SLA accountability, and M&A technical due diligence.

Deven brings a collaborative boardroom presence combined with the ability to challenge executive management constructively. Based in Orlando, Florida, he holds a B.S. in Mechanical Engineering from New Jersey Institute of Technology and an active U.S. Department of Defense Top Secret clearance.`
  };

  // Toast Notification System
  function showToast(message, duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color: var(--accent-gold); font-size: 1.1rem;">◈</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // Copy Bio to Clipboard
  function setupBioControls() {
    const bioButtons = document.querySelectorAll('.bio-length-btn');
    const bioDisplay = document.getElementById('bio-display-text');
    const copyBioBtn = document.getElementById('copy-bio-btn');
    let currentBioLength = '300';

    function renderBio(lengthKey) {
      if (bioDisplay) {
        bioDisplay.textContent = BIO_DATA[lengthKey] || BIO_DATA['300'];
      }
      bioButtons.forEach(btn => {
        if (btn.getAttribute('data-bio-length') === lengthKey) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      currentBioLength = lengthKey;
    }

    bioButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lengthKey = btn.getAttribute('data-bio-length');
        renderBio(lengthKey);
      });
    });

    if (copyBioBtn) {
      copyBioBtn.addEventListener('click', () => {
        const textToCopy = BIO_DATA[currentBioLength];
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Executive Bio (${currentBioLength} words) copied to clipboard.`);
        }).catch(() => {
          showToast('Bio ready to copy.');
        });
      });
    }

    renderBio('300');
  }

  // Generate and Download vCard (.vcf)
  function downloadVCard() {
    const vcardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Deven Joshi',
      'TITLE:Independent Non-Executive Director | Chief AI Officer',
      'ORG:C5MI / Boardroom Advisory',
      'EMAIL;TYPE=INTERNET,PREF:idevenjoshi@gmail.com',
      'TEL;TYPE=CELL,VOICE:+1-407-474-6124',
      'ADR;TYPE=WORK:;;Orlando;FL;;USA',
      'URL:https://www.devenjoshi.com',
      'NOTE:Active DoD Top Secret Clearance | Strategic AI Governance & Technology Board Advisor',
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Deven_Joshi_Board_Profile.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Executive vCard downloaded.');
  }

  // Contact Form Handling
  function setupContactForm() {
    const form = document.getElementById('advisory-contact-form');
    const vcardBtn = document.getElementById('download-vcard-btn');

    if (vcardBtn) {
      vcardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        downloadVCard();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.innerHTML : 'Transmit Inquiry';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Transmitting to Deven Joshi...';
        }

        // Simulate secure transmission
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
          }
          showToast('Inquiry received. Deven Joshi will respond confidentially within 24 hours.');
          form.reset();
        }, 1200);
      });
    }
  }

  // Live Clock & Timezone
  function setupLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;

    function update() {
      const now = new Date();
      const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
      clockEl.textContent = now.toLocaleTimeString('en-US', options);
    }
    update();
    setInterval(update, 1000);
  }

  function init() {
    setupBioControls();
    setupContactForm();
    setupLiveClock();
  }

  return {
    init,
    showToast,
    downloadVCard
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
