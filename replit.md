# Wozzer

A social network MVP for young builders aged 13-18. Users get vetted through an AI-powered onboarding interview before landing in a feed with people who match their profile.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wozzer run dev` — run the frontend (port 24692)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (Replit managed)
- Required env: `GEMINI_API_KEY` — Gemini API key for AI interview and challenge logic

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui (artifacts/wozzer)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (Replit managed)
- AI: Google Gemini 2.0 Flash via @google/generative-ai
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Auth: JWT-style bearer tokens stored in localStorage as "wozzer_token"
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, posts, follows, onboarding_sessions)
- `artifacts/api-server/src/routes/` — Route handlers (auth, onboarding, users, posts, follows, feed)
- `artifacts/api-server/src/lib/` — Shared server utilities (auth.ts, gemini.ts)
- `artifacts/wozzer/src/pages/` — Frontend pages (landing, login, register, onboarding, feed, profile, settings)
- `artifacts/wozzer/src/contexts/AuthContext.tsx` — Auth state and token management

## Architecture decisions

- Bearer token auth: tokens stored in localStorage, passed as Authorization header. In-memory token store on server (resets on restart — suitable for MVP, replace with DB sessions for production).
- AI onboarding uses Gemini 2.0 Flash. Visionary path: structured JSON response signals when to give homework. Builder path: challenge generation + evaluation in two separate calls.
- Follow counts are stored as denormalized integers on the users table for fast reads. They're updated on follow/unfollow.
- Feed is chronological — shows posts from followed users + self. No algorithm.
- Smart suggested users: simple scoring by overlapping skills + same role.

## Product

- **Landing** `/` — splash with Apply Now / Log In
- **Register** `/register` — sign up with username, email, password, displayName
- **Login** `/login` — email + password
- **Onboarding** `/onboarding` — two paths: Visionary (AI chat interview → homework) or Builder (skill select → AI challenge)
- **Feed** `/feed` — chronological post feed with composer + suggested users sidebar
- **Profile** `/profile/:username` — public profile with role badge, skills, project links, posts
- **Settings** `/settings` — edit bio, displayName, project links

## User preferences

- Dark mode always on — no toggle
- Mobile-first layout
- No emojis in the UI
- No unnecessary animations

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml
- Always run `pnpm --filter @workspace/db run push` after changing schema files
- In-memory session store resets on server restart (users must log in again) — replace with DB sessions before production
- Gemini JSON parsing uses regex match for robustness (AI occasionally adds markdown fences)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
