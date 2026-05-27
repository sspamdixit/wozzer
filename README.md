# Wozzer

A social network for serious young builders aged 13–18. You don't just sign up — you earn your spot through an AI interview or a technical challenge.

## What it is

Wozzer is a vetting-first social network. New users choose a path:

- **Visionary** — defend your idea against an AI inquisitor. Come with something real or get homework assigned.
- **Wozniak** — pick your skills, solve a technical challenge, get assigned a level (Beginner / Intermediate / Advanced).

After onboarding, users hit the **Discover** deck — swipe right to connect with people and projects, left to pass. The **Feed** is chronological and seeded by your swipe history.

The UI is a scrapbook aesthetic: cream paper, ink borders, Caveat handwriting, rotated cards, washi tape strips, and an orange-red accent.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Express 5 (Node 24) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Supabase Auth (Google, GitHub, Phone OTP, Email+Password) |
| AI | Google Gemini (cascading fallback: 2.5-pro → 2.0-flash → 1.5-pro → 1.5-flash → 1.0-pro) |
| API spec | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces |

---

## Project structure

```
artifacts/
  wozzer/          # React + Vite frontend
  api-server/      # Express 5 backend
  mockup-sandbox/  # UI component previews (dev only)
lib/
  db/              # Drizzle ORM schema + migrations
  api-spec/        # OpenAPI spec (source of truth)
  api-client-react/# Generated React Query hooks
  api-zod/         # Generated Zod schemas
```

---

## Running locally

### Prerequisites

- Node 24+
- pnpm
- A Postgres database (or use Replit's managed one)
- Supabase project (for auth)
- Google Gemini API key

### Environment variables

```env
DATABASE_URL=           # Postgres connection string
GEMINI_API_KEY=         # Google Gemini API key
SUPABASE_URL=           # Supabase project URL
SUPABASE_ANON_KEY=      # Supabase public anon key
SUPABASE_SERVICE_ROLE_KEY= # Supabase service role key (server-side only)
VITE_SUPABASE_URL=      # Same as SUPABASE_URL (exposed to browser)
VITE_SUPABASE_ANON_KEY= # Same as SUPABASE_ANON_KEY (exposed to browser)
SESSION_SECRET=         # Random string for session signing
```

### Commands

```bash
# Install dependencies
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Regenerate API client (after changing openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# Run the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Run the frontend (port 24692)
pnpm --filter @workspace/wozzer run dev

# Typecheck everything
pnpm run typecheck
```

---

## Supabase Auth setup

In your Supabase project:

1. Enable **Google**, **GitHub**, and **Phone** providers under Authentication → Providers
2. Add your site URL to Authentication → URL Configuration → Site URL
3. Add `http://localhost:24692` (and your production URL) to Redirect URLs

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/sign-up` | Sign up (Google, GitHub, phone OTP, email) |
| `/sign-in` | Sign in |
| `/onboarding` | AI-powered path selection + interview or challenge |
| `/discover` | Swipe deck — 3 person cards : 1 project card |
| `/feed` | Chronological post feed seeded by swipe history |
| `/profile/:username` | Public profile with role badge, skills, posts |
| `/settings` | Edit display name, bio, project links |

---

## AI onboarding

The Gemini integration uses a cascading model fallback so the interview never fails due to quota or availability:

```
gemini-2.5-pro → gemini-2.0-flash → gemini-1.5-pro → gemini-1.5-flash → gemini-1.0-pro
```

**Visionary path**: Conversational interview. The AI decides to approve or assign homework. Short, direct messages — like a blunt senior founder texting.

**Wozniak path**: Pick skills → receive a practical challenge → submit an answer → get assigned Beginner / Intermediate / Advanced.

---

## Design

- Background: `#F5F0E8` (cream paper)
- Ink: `#1A1A1A`
- Accent: `#E8450A` (orange-red)
- Headings: Fraunces (variable optical serif)
- Accent text: Caveat (handwritten)
- Body: Inter
- Cards: 1.5px ink border, 3px hard shadow, slight rotation variance
- Washi tape strips on cards
- Grain overlay on body
- Mobile-first, 390px base

---

## License

MIT
