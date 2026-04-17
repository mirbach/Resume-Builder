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

Copy the settings template and fill in your API keys:

```bash
cp packages/backend/data/settings.example.json packages/backend/data/settings.json
```

Edit `packages/backend/data/settings.json`:

```json
{
  "auth": {
    "enabled": false,
    "provider": "generic-oidc",
    "clientId": "",
    "authority": "",
    "redirectUri": "http://localhost:5173/callback",
    "scopes": ["openid", "profile", "email"]
  },
  "translation": {
    "deeplApiKey": "<your DeepL API key>"
  },
  "ai": {
    "provider": "openai",
    "apiKey": "<your API key>",
    "model": "gpt-4o-mini"
  }
}
```

`settings.json` is gitignored — never commit API keys.

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

The built-in **Frameworks Guide** (? button in the toolbar) explains both frameworks in full with worked examples. A brief summary:

### CAR — Challenge · Action · Result

Every achievement is a three-part story:

- **Challenge** — the specific problem, constraint, or opportunity with quantified context
- **Action** — what *you* did, using first-person active verbs and concrete steps
- **Result** — the measurable outcome (%, €/$, time saved, risk reduced)

### ELITE — Experience · Leadership · Impact · Transformation · Excellence

A classification layer applied to each CAR achievement that signals which consulting value dimension it demonstrates:

| Tag | When to use |
|---|---|
| **Experience** | Deep domain or technical expertise applied to solve a hard problem |
| **Leadership** | Influencing people or teams beyond formal authority |
| **Impact** | Quantifiable business outcomes — revenue, cost, time, risk |
| **Transformation** | Changing how a team, process, or organisation works |
| **Excellence** | Unusually high standards — zero-defect, awards, reference implementations |

Aim for a spread across all five categories in your resume.

---

## Data Storage

All state lives in JSON files under `packages/backend/data/`. There is no database and no migration system. `resume.json` is the single document for the consultant's data. Multiple themes can coexist; the active theme is chosen at runtime.

---

## License

MIT
