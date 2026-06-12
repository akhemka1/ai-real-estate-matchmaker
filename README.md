# NestMatch AI — Next-Gen Real Estate Matchmaker (UI)

AI-powered real estate platform UI built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.

## Features

- **Buyer/Renter**: Property search, AI recommendations, saved & compare, natural language search
- **Seller Portal**: Dashboard, listings, leads
- **Agent Portal**: Clients, AI matches, calendar
- **AI Components**: Match scores, explainability panels, price prediction, appreciation forecasts
- **Auth**: Login, signup with role selection, onboarding wizard

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18+ (20 LTS recommended) | https://nodejs.org |
| **npm** | Comes with Node | — |

**Recommended editor:** [Cursor](https://cursor.com) or [VS Code](https://code.visualstudio.com) — both work identically for this project.

---

## Quick Start (VS Code or Cursor)

### 1. Open the project

**VS Code:**
```
File → Open Folder → C:\Users\Lenovo\Projects\ai-real-estate-matchmaker
```

**Cursor:** Same steps, or run from terminal:
```powershell
cursor C:\Users\Lenovo\Projects\ai-real-estate-matchmaker
```

### 2. Install dependencies

Open the integrated terminal (`Ctrl + `` ` ``) and run:

```powershell
cd C:\Users\Lenovo\Projects\ai-real-estate-matchmaker
npm install
```

If you see SSL/certificate errors on corporate networks:
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npm install
```
(Remove that env var after install for security.)

### 3. Start the dev server

```powershell
npm run dev
```

Open **http://localhost:3000** in your browser.

### 4. Explore the app

| Route | Description |
|-------|-------------|
| `/` | Home + AI search |
| `/properties` | Browse & filter listings |
| `/properties/p1` | Property detail (use p1, p2, p3) |
| `/recommendations` | AI match feed |
| `/auth/login` | Login (any email/password works — mock auth) |
| `/seller/dashboard` | Seller portal |
| `/agent/dashboard` | Agent portal |

---

## VS Code Extensions (Recommended)

Install from Extensions panel (`Ctrl+Shift+X`):

1. **ESLint** — linting
2. **Tailwind CSS IntelliSense** — class autocomplete
3. **Prettier** — formatting (optional)

---

## Cursor vs VS Code

| | **Cursor** | **VS Code** |
|---|-----------|-------------|
| Run the app | ✅ Same `npm run dev` | ✅ Same |
| AI assistance | Built-in Agent + Composer | Copilot extension |
| SDK scripts | Native — use `scripts/sdk-extend-ui.ts` | Works if Cursor CLI/SDK installed |
| **Best for this project** | ✅ Recommended (AI + SDK) | ✅ Fine for UI-only dev |

---

## Cursor SDK — Extend UI with an Agent

Use the SDK to programmatically add pages/features via a Cursor agent.

### Setup

1. Get API key: [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations)
2. Copy `.env.example` → `.env` and set `CURSOR_API_KEY`
3. Install SDK (optional, for extend script):

```powershell
npm install @cursor/sdk
```

### TypeScript (recommended)

```powershell
npm run sdk:extend-ui
# Or custom prompt:
npx tsx scripts/sdk-extend-ui.ts "Add admin panel at /admin"
```

### Python

```powershell
pip install cursor-sdk
python scripts/sdk-extend-ui.py "Add mortgage calculator page"
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public + discovery
│   ├── (auth)/             # Login, signup, onboarding
│   ├── (seller)/           # Seller portal
│   ├── (agent)/            # Agent portal
│   └── (account)/          # Profile, messages
├── components/
│   ├── ui/                 # Design system primitives
│   ├── ai/                 # AI-specific components
│   ├── property/           # Listing components
│   ├── layout/             # Header, footer, sidebar
│   ├── forms/              # Auth & inquiry forms
│   └── dashboard/          # Stat cards, activity feed
├── stores/                 # Zustand (auth, saved, compare, filters)
├── lib/                    # Utils + mock data
└── types/                  # TypeScript interfaces
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |
| `npm run sdk:extend-ui` | Cursor SDK agent extends UI |

---

## Production Build

```powershell
npm run build
npm run start
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm install` SSL error | `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"` then retry |
| Port 3000 in use | `npm run dev -- -p 3001` |
| Images not loading | Check `next.config.js` remotePatterns for unsplash.com |
| Blank page after login | Clear localStorage keys `nestmatch-auth` |

---

## Next Steps (Backend)

This repo is **UI only** with mock data. Phase 10 will wire it to FastAPI:

- Replace `src/lib/mock-data.ts` with API calls
- Set `NEXT_PUBLIC_API_URL` in `.env.local`

---

Built for the **Next-Gen AI Real Estate Matchmaker** project.
