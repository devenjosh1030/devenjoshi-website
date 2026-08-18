# Deven Joshi — Executive Boardroom Website (`devenjoshi.com`)

An ultra-modern, high-performance executive single-page web application built specifically for **Board Nominating & Governance Committees, Corporate Search Chairs, and Advisory Boards**.

---

## 🏛️ Key Features

1. **Slick Executive Hero & Credentials Presentation**:
   - Executive portrait frame with gold/sapphire ambient lighting
   - Verified Active **DoD Top Secret** clearance badge
   - Key highlights: 25+ years enterprise scaling, Chief AI Officer at C5MI, Deloitte Audit & Advisory alum, strategic advisor to Google, AWS, and SAP.
2. **Gated Boardroom Access (Gatekeeper Modal)**:
   - Protected entry for authorized search committees and directors.
   - UID / Recruiter ID + Boardroom Passcode authentication.
   - 1-Click **VIP Instant Access** bypass button for seamless evaluation.
   - Session persistence and 1-click **Lock Portal** button.
3. **6 Specialized Boardroom Tabs**:
   - **Tab 1: Executive Bio & Strategic Leadership** (Interactive 150-word / 300-word / Full Bio with 1-click clipboard copy, career timeline, education, and credentials).
   - **Tab 2: Governance & Board Value Proposition** (3-Pillar Competency Matrix: Audit & Risk, Cyber & Tech, Nominating & Strategy; Fiduciary commitments).
   - **Tab 3: AI & Operating Roadmap** (3-Tier Adopt/Push/Build model, Project Sentinel 5.0 zero-defect architecture, $50M ARR capture pipeline).
   - **Tab 4: Defense & Supply Chain Strategy** (DLA J6 AIACOE & GAILFORCE deployment, SCAR framework, Surface Force Summit deliberations).
   - **Tab 5: Document & Intelligence Hub** (Interactive in-browser PDF modal previewer and downloads for all 6 curated documents).
   - **Tab 6: Confidential Inquiries & Advisory** (Direct confidential inquiry form, click-to-call, email, vCard 3.0 download, and board travel readiness specs).

---

## 📁 Repository Structure

```
Deven Joshi Board/
├── index.html                 # Complete single-page application
├── _headers                   # Cloudflare Pages security & caching headers
├── _redirects                 # Canonical HTTPS & SPA fallback routing
├── wrangler.toml              # Cloudflare configuration
├── assets/
│   ├── css/
│   │   ├── variables.css      # Design tokens, obsidian & gold color palette
│   │   ├── main.css           # Global typography, layout, hero, responsive grid
│   │   └── components.css     # Gatekeeper, tabs, cards, modals, toasts
│   ├── js/
│   │   ├── auth.js            # Boardroom gatekeeper & session manager
│   │   ├── tabs.js            # 6-tab navigation & hash synchronization
│   │   ├── doc-viewer.js      # PDF preview modal & download handler
│   │   └── app.js             # Bio copy, vCard generator, live clock, toasts
│   ├── images/
│   │   └── portrait.jpg       # Executive portrait
│   └── documents/
│       ├── 1_Deven_Joshi_Board_Bio.pdf
│       ├── 2_Unified_Board_Profile.pdf
│       ├── 3_Executive_Education_Booth.pdf
│       ├── 4_Surface_Force_Summit_Points.pdf
│       ├── 5_AI_Implementation_Roadmap.pdf
│       └── 6_DLA_Agentic_AI_Response.pdf
└── README.md
```

---

## 🚀 How to Deploy to Cloudflare Pages

### Option A: Cloudflare Dashboard (Recommended & Easiest)

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** ➔ **Create application** ➔ **Pages**.
3. Choose **Direct Upload** (or connect your GitHub/GitLab repository):
   - **Project name**: `devenjoshi` (or `devenjoshi-board`)
   - **Upload folder**: Select this directory (`/Users/devenjoshi/Deven Joshi Board`)
4. Click **Deploy Site**.
5. Once deployed, go to **Custom domains** tab in Cloudflare Pages:
   - Click **Set up a custom domain**.
   - Enter `www.devenjoshi.com` and `devenjoshi.com`.
   - Cloudflare will automatically configure the DNS records and issue free SSL certificates.

### Option B: Cloudflare Wrangler CLI

If you have `wrangler` installed:
```bash
# In the project directory:
npx wrangler pages deploy . --project-name=devenjoshi
```

---

## 🔒 Default Access Credentials

- **User ID**: `board` or `director` or `deven.joshi`
- **Passcode**: `Boardroom2026!` or `Director2026!`
- **Instant Demo**: Click **⚡ Instant VIP Access (1-Click)** on the gatekeeper screen.
