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
- Auth: Clerk (Google, GitHub, Apple, email) — session cookies for web, JIT user provisioning on first sign-in
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, posts, follows, onboarding_sessions)
- `artifacts/api-server/src/routes/` — Route handlers (auth, onboarding, users, posts, follows, feed)
- `artifacts/api-server/src/lib/` — Shared server utilities (auth.ts, gemini.ts)
- `artifacts/wozzer/src/pages/` — Frontend pages (landing, login, register, onboarding, feed, profile, settings)
- `artifacts/wozzer/src/contexts/AuthContext.tsx` — Auth state and token management

## Architecture decisions

- Clerk auth: session cookies managed by Clerk. `clerkMiddleware` in `app.ts` validates every request. `requireAuth` middleware reads the Clerk session via `getAuth(req)` and JIT-provisions a local DB user on first sign-in (keyed by `clerkId`). No manual token management needed.
- Enable/disable social providers (Google, GitHub, Apple) from the Auth pane in the workspace toolbar.
- AI onboarding uses Gemini 2.0 Flash. Visionary path: structured JSON response signals when to give homework. Builder path: challenge generation + evaluation in two separate calls.
- Follow counts are stored as denormalized integers on the users table for fast reads. They're updated on follow/unfollow.
- Feed is chronological — shows posts from followed users + self. No algorithm.
- Smart suggested users: simple scoring by overlapping skills + same role.

## Product

- **Landing** `/` — splash with Apply Now / Log In
- **Sign Up** `/sign-up` — Clerk-powered: Google, GitHub, Apple, or email/password
- **Sign In** `/sign-in` — Clerk-powered sign-in page
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
- Clerk dev keys are used in development (shows "Development mode" banner on sign-in page — normal, disappears in production)
- Gemini JSON parsing uses regex match for robustness (AI occasionally adds markdown fences)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
