# Blackboard Customer Modeler

**Menu Model v4 — Strategic Capability Matrix**  
Internal sales tool for configuring and presenting Blackboard services packages.

---

## Overview

A React application for sales engineers and senior stakeholders to:

- Profile existing customer accounts via a structured 7-question diagnostic
- Configure capability modules across Core, Advanced, and Enterprise tiers
- Generate a multi-year Capability Matrix roadmap
- Present commercial projections via the Executive View

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/YOUR_ORG/blackboard-customer-modeler.git
cd blackboard-customer-modeler
npm install
npm start
```

App runs at `http://localhost:3000`

### Build for production

```bash
npm run build
```

Output goes to `/build` — ready for deployment.

---

## Deployment — Amazon Amplify

This repository is configured for Amplify continuous deployment via `amplify.yml`.

### First-time setup

1. Push this repository to GitHub
2. Log in to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. Click **New app > Host web app**
4. Connect your GitHub account and select this repository
5. Select the branch to deploy (e.g. `main`)
6. Amplify auto-detects `amplify.yml` — confirm the build settings
7. Click **Save and deploy**

Amplify will build and deploy on every push to the connected branch.

### Environment variables

No environment variables are required for the current build.  
The app uses the Anthropic API proxy built into the Claude.ai artifact environment.  
If migrating to a standalone API call, add:

```
REACT_APP_ANTHROPIC_KEY=your_key_here
```

Set this in Amplify Console under **App settings > Environment variables** — never commit it to the repository.

---

## Project Structure

```
blackboard-customer-modeler/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          # Full application — single file
│   └── index.js         # React entry point
├── amplify.yml          # Amplify build spec
├── package.json
└── .gitignore
```

---

## Version History

| Version | Notes |
|---------|-------|
| v29 | New Model only — Legacy mode separated into Blackboard Services Selector |
| v28 | Combined app — New Model + Legacy, 20hr module benchmark, commercial model corrected |
| v27 | AI Efficiency Engine removed from Executive View |
| v26 | Prices stripped from configuration stage, USD throughout |
| v25 | Account Profiler added — 7-question diagnostic driving tier recommendation |

---

## Internal use only

Not for distribution outside Anthology/Blackboard.
