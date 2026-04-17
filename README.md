# Resume Builder

A bilingual (EN/DE) consulting resume builder built around the **CAR** (Challenge–Action–Result) and **ELITE** (Experience–Leadership–Impact–Transformation–Excellence) frameworks. Enter your data once in both languages, preview it live, and export a branded PDF per client engagement.
<img alt="image" src="https://github.com/user-attachments/assets/d26ecc1e-8bbd-4449-b07e-f28c109acf3b" />

---

## Features

- **Bilingual editing** — every user-visible field has an English and German input side by side
- **CAR framework** — structured achievement entries with Challenge, Action, and Result fields
- **ELITE tagging** — classify each achievement by consulting value dimension (Experience, Leadership, Impact, Transformation, Excellence)
- **AI-powered CAR review** — per-achievement scoring and improvement suggestions via OpenAI, Grok, or Google Gemini
- **DeepL translation** — one-click EN↔DE translation for any bilingual field
- **Live scaled preview** — A4-accurate preview that scales to fit any screen
- **PDF export** — client-side PDF generation via `@react-pdf/renderer`
- **Print** — browser print with full-page resume output
- **Theme system** — create multiple named themes with custom colours, fonts, and page margins; associate a company logo per theme for consulting branding
- **Photo & logo uploads** — profile photo and per-theme company logo upload
- **Dark mode**
- **JSON import/export** — back up or restore your resume data
- **Optional OIDC authentication** — protect the editor behind a generic OIDC provider (e.g. Entra ID, Auth0)
- **Cloudflare Pages + KV deployment** — deploy the frontend to Cloudflare Pages with KV-backed API functions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS v4 |
| PDF | @react-pdf/renderer |
| Backend | Express 5, TypeScript, Node.js |
| Storage | JSON files on disk (no database) |
| Edge deployment | Cloudflare Pages + Workers + KV |
| Translation | DeepL API |
| AI review | OpenAI / xAI Grok / Google Gemini |

---

## Project Structure

```
packages/
  backend/          Express 5 API (port 3001)
    src/
      index.ts            Entry point
      types.ts            Shared type definitions
      lib/storage.ts      JSON file helpers
      middleware/auth.ts  Optional OIDC bearer-token guard
      routes/
        resume.ts         GET/PUT /api/resume
        themes.ts         CRUD   /api/themes
        uploads.ts        POST   /api/upload/photo|logo
        settings.ts       GET/PUT /api/settings
        translate.ts      POST   /api/translate
        ai.ts             POST   /api/ai/review
    data/
      resume.json         Resume data (single source of truth)
      settings.json       Auth + API key config  ← gitignored
      settings.example.json  Template for first-time setup
      themes/             One JSON file per theme
      uploads/            Uploaded images          ← gitignored

  frontend/         React SPA (port 5173)
    src/
      App.tsx             Root — layout, toolbar, state, autosave
      lib/
        types.ts          All TypeScript interfaces
        api.ts            Typed fetch wrappers
        resolve.ts        resolveResume(data, lang) → display types
      components/
        editor/           Tabbed form editor + theme CRUD
        resume/           Read-only display components
        pdf/              PDF document + export/print buttons
        toolbar/          Language switcher, theme selector

functions/                Cloudflare Pages Functions (edge API)
  api/                    Mirrors backend routes but runs on Workers
  _shared/helpers.ts      KV read/write helpers
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
git clone https://github.com/your-username/resume-builder.git
cd resume-builder
npm install
```

### Configure

No manual configuration is required to start. The backend serves safe defaults when no `settings.json` exists. Add your API keys through the in-app **Settings** page (⚙ icon in the toolbar) — changes are saved automatically to `packages/backend/data/settings.json`, which is gitignored.

### Run locally

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/health

---

## AI Review

Each CAR achievement has a **Review with AI** button that scores the entry 1–5 on each of Challenge, Action, and Result and suggests improved text where scores are low.

Supported providers (configure in Settings):

| Provider | Default model |
|---|---|
| OpenAI | `gpt-4o-mini` |
| xAI Grok | `grok-3-mini` |
| Google Gemini | `gemini-2.0-flash` |

<img width="1368" height="1528" alt="image" src="https://github.com/user-attachments/assets/4bc8bf05-07d9-47a2-aeec-33e5e1a5e161" />

---

## Translation

Add a [DeepL API key](https://www.deepl.com/pro-api) in Settings → Translation. Each bilingual field then shows a translate button to copy the current language's text to the other.

---

## Themes

Themes control colours, fonts, and page margins. Each theme can carry a consulting company name and logo that appears in the resume header — useful for white-labelling the output per client engagement.

- The `default` theme cannot be deleted.
- Theme files are stored as JSON in `packages/backend/data/themes/`.
- The active theme is selected per session in the toolbar and is not persisted server-side.

---

## Authentication

Auth is opt-in. When `auth.enabled = true` in `settings.json`, all write API routes require a Bearer token. Configure your OIDC provider details in Settings → Authentication. The frontend handles the PKCE flow and stores the token in `sessionStorage`.

> **Note:** Full JWT signature validation (JWKS fetch) is not yet implemented — the middleware currently checks token presence only.

---

## Building

```bash
npm run build
```

Compiles the backend with `tsc` and builds the frontend with `tsc + vite build`.

---

## Cloudflare Pages Deployment

The frontend can be deployed to Cloudflare Pages with edge API functions backed by Workers KV instead of the Express backend.

### 1. Create KV namespaces

```bash
npm run kv:create
```

Paste the returned IDs into `wrangler.toml`.

### 2. Deploy

```bash
npm run cf:deploy
```

This builds the frontend and deploys to Cloudflare Pages via Wrangler.

### Local Cloudflare preview

```bash
npm run cf:dev
```

---

## CAR & ELITE Frameworks

The built-in **Frameworks Guide** (? button in the toolbar) explains both frameworks in full in English and German. Here is the complete reference.

---

### CAR Framework — Challenge · Action · Result

The CAR framework is a structured storytelling technique for describing professional achievements. It forces you to move beyond vague job-duty descriptions and present every accomplishment as a mini narrative: what was broken or difficult, what you specifically did about it, and what measurably improved as a result. Recruiters and hiring managers scan for this pattern because it proves impact rather than just presence.

#### C — Challenge

Describe the problem, constraint, gap, or opportunity that required action. Be specific: numbers, context, and stakes make the challenge feel real. Avoid generic phrases like "we had issues with performance" — quantify the pain instead.

> *"Our CI/CD pipeline averaged 45-minute build times, causing developers to wait over 2 hours per day for feedback and delaying every release by at least one sprint."*

#### A — Action

Describe what you did — not the team, not the project. Use first-person verbs: designed, implemented, negotiated, automated, led. Include the tools, methods, and decisions you made. This is where your skills become visible.

> *"I analysed bottlenecks using BuildKite traces, introduced incremental Docker layer caching, parallelised test suites across 8 agents, and migrated the artifact store from S3 to a local registry."*

#### R — Result

State the measurable outcome. Quantify wherever possible: percentages, time saved, money saved, users unblocked, error rates reduced. If exact numbers are confidential, use relative figures ("reduced by ~60%") or business impact ("enabled fortnightly releases instead of quarterly").

> *"Build time dropped from 45 min to 8 min (–82%), saving the 12-person team ~1.5 hours of idle time per day and allowing us to ship to production daily instead of weekly."*

#### Complete CAR Example

| | |
|---|---|
| **Challenge** | Our CI/CD pipeline averaged 45-minute build times, causing developers to wait over 2 hours per day for feedback and delaying every release by at least one sprint. |
| **Action** | I analysed bottlenecks using BuildKite traces, introduced incremental Docker layer caching, parallelised test suites across 8 agents, and migrated the artifact store from S3 to a local registry. |
| **Result** | Build time dropped from 45 min to 8 min (–82%), saving the 12-person team ~1.5 hours of idle time per day and allowing us to ship to production daily instead of weekly. |

---

### ELITE Framework — Experience · Leadership · Impact · Transformation · Excellence

The ELITE framework is a classification layer applied on top of each CAR achievement. It tells a reader which dimension of consulting value this achievement demonstrates. Senior consultants are expected to show a portfolio across all five categories. Tagging each achievement helps you and the reader quickly see whether your resume is balanced or overweight in one area.

#### E — Experience

Deep domain or technical expertise applied to solve a hard problem. Use this tag when the achievement required specialised knowledge that took years to acquire — architecture decisions, rare technology stacks, regulated industries, complex integrations.

> *"Designed a multi-region active-active Cosmos DB topology for a banking client, leveraging deep knowledge of conflict resolution and consistency models to meet a 99.999% SLA requirement."*

#### L — Leadership

Influencing people, teams, or organisations beyond your formal authority. Use this tag when you drove alignment, mentored others, led a team through uncertainty, built cross-functional consensus, or shaped organisational behaviour.

> *"Led a 9-person cross-functional squad across 3 time zones during a critical migration, facilitating daily stand-ups and escalation paths that kept the project on schedule despite two key engineers being replaced mid-engagement."*

#### I — Impact

Quantifiable business or customer outcomes — revenue, cost, time, risk, NPS, user growth. Use this tag when the result is primarily measured in business metrics rather than technical ones. The bigger and more concrete the number, the stronger this tag.

> *"Optimised the checkout flow for an e-commerce client, reducing cart abandonment by 23% and generating an additional €1.4 M in annual revenue within 6 months of launch."*

#### T — Transformation

Changing how a team, process, or organisation works — not just improving a metric. Use this tag when you introduced a new way of working, replaced a legacy system, shifted a culture, or enabled a capability that didn't exist before.

> *"Introduced event-driven architecture to replace a monolithic batch-processing system, enabling real-time data processing and reducing the time-to-insight for analysts from overnight to under 30 seconds."*

#### E — Excellence

Going significantly above expectations in quality, thoroughness, or craft. Use this tag for achievements that demonstrate unusually high standards: zero-defect deliverables, exceptional client satisfaction scores, awards, or solutions that became internal reference implementations.

> *"Delivered an accessibility audit and remediation for a public-sector portal that achieved a 100/100 Lighthouse score — the first project in the firm's history to meet full WCAG 2.1 AA compliance at launch."*

---

### How to Use Both Together

1. **Pick an achievement.** Think of a moment where you made a real difference — a problem solved, a project delivered, a process improved.
2. **Write the Challenge.** Set the scene with specifics. What was broken, missing, or at risk? What were the stakes?
3. **Write the Action.** Focus on your contribution. Use strong verbs. Include decisions, tools, and approaches you chose.
4. **Write the Result.** Quantify the outcome. If you don't have exact numbers, estimate conservatively or express relative improvement.
5. **Assign an ELITE tag.** Ask yourself: what is the primary consulting value this achievement demonstrates? Pick the single best-fitting category.
6. **Review your balance.** Aim for a spread across all five ELITE categories across your resume. A resume with only "Impact" tags may signal a narrow profile.

---

## Data Storage

All state lives in JSON files under `packages/backend/data/`. There is no database and no migration system. `resume.json` is the single document for the consultant's data. Multiple themes can coexist; the active theme is chosen at runtime.

---

## License

MIT
