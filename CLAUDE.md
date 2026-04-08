# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Academia Dialectica ("Running")** — Full-stack educational management platform (Bogota, Colombia). Public landing page with gamification, admin portal for managing clients/finances, and student portal with RPG progression. All UI text is in Spanish.

## Commands

```bash
make install          # First-time setup (npm ci + prisma generate)
make dev              # Start dev server (localhost:3000)
make build            # Production build (prisma generate + next build)
make test             # Run all tests (vitest run)
make test-watch       # Watch mode
make security         # npm audit + tests
make db-push          # Push schema changes to DB
make db-deploy        # Run migrations
make db-seed          # Seed database (tsx prisma/seed.ts)
make docker-dev       # Dev with hot-reload via Docker
make docker-prod      # Production Docker container
```

Run a single test file: `npx vitest run __tests__/path/to/file.test.ts`

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **Styling:** Tailwind CSS 4 + PostCSS
- **Database:** PostgreSQL (Supabase) via Prisma 7 (`@prisma/adapter-pg`)
- **Auth:** NextAuth v5 beta — Google OAuth (admin) + Credentials (students)
- **AI:** Vercel AI SDK **v4** (`ai@^4`) — do NOT upgrade to v6, API is incompatible
  - Claude (`claude-sonnet-4-20250514`) for vision analysis + chat
  - OpenAI (`gpt-4o-mini`) as alternate chat provider
- **Analytics:** PostHog (`posthog-js`) for funnel tracking + Google Analytics (gtag.js) for conversions
- **Testing:** Vitest 4.1 + happy-dom + Testing Library
- **CI:** GitHub Actions (Node 20) — security audit + unit tests on push/PR to main

## Architecture

### Directory Structure

- `app/` — Next.js App Router: `api/`, `admin/`, `client/`, `login/`
- `components/` — React components (`welcome/` = public page, `dashboard/` = admin charts)
- `lib/` — Business logic: `auth.ts`, `prisma.ts`, `password.ts`, `email.ts`
- `lib/actions/` — Server Actions (client, exam, gamification, balance, dashboard, leads, feedback)
- `prisma/` — Schema + migrations
- `types/` — TypeScript type definitions
- `__tests__/` — Vitest unit tests
- `memory/` — Numbered implementation docs (historical reference)

### Authentication & Authorization

Dual auth system in `lib/auth.ts` + `proxy.ts`:
- **Admin:** Google OAuth, whitelisted via `ADMIN_EMAIL` env var. JWT stores access/refresh tokens for Google Calendar API with auto-refresh.
- **Student:** Credentials provider (username + bcrypt password). `requirePasswordChange` flag forces new students to `/client/change-password`.
- **RBAC:** `Role` enum (ADMIN, CLIENT) on Client model. Middleware enforces route access. All Server Actions verify role. CLIENT actions use `session.userId` for IDOR prevention.

### Data Flow Patterns

- **Server Actions** (`lib/actions/`) are the primary data mutation layer — called directly from client components.
- **API Routes** (`app/api/`) only for: streaming chat (`/api/chat`), image analysis (`/api/analyze-client`, `/api/analyze-clients-bulk`), cron jobs (`/api/cron/process-leads`), Telegram webhook, OG images.
- **AI chat** uses Vercel AI SDK tool calling (7 tools with Zod schemas) to query DB via existing server actions. PII fields (`celular`, `direccion`, `correo`, `password`, `username`) are redacted before sending to AI.
- **Google Calendar** sync for sessions, **Gmail API** for automated lead emails (NOT Nodemailer — Railway blocks SMTP).

### Key Constraints

- Vercel AI SDK must stay at **v4** — v6 has incompatible API
- Gmail uses `googleapis` over HTTPS, not SMTP (Railway port restriction)
- Telegram webhook requires both `TELEGRAM_WEBHOOK_SECRET` and `TELEGRAM_ALLOWED_USER_ID` — server crashes without them
- `next.config.ts` has `output: "standalone"` for Docker deployment
- Prisma uses `@prisma/adapter-pg` (not default connector) — needs `DATABASE_URL` and `DIRECT_URL`
- Cloudflare Workers is NOT compatible (Prisma 7, bcryptjs, streaming AI)

### Testing Conventions

- Tests live in `__tests__/` mirroring source structure
- Environment: happy-dom (configured in `vitest.config.ts`)
- Path aliases (`@/`) resolved via `vite-tsconfig-paths`
- Current coverage: password validation, client login/IDOR, client actions, email templates, cron endpoint, feedback actions
