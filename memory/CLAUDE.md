# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A time tracking and billing system that syncs Google Calendar events to a PostgreSQL database. It reads "class with [ClientName]" events from Google Calendar, matches them against known clients, and calculates session costs based on hourly rates.

This is a partial library — the repository contains only `lib/` utilities and a Prisma schema. It is designed to be part of a larger Next.js application (note the `"use server"` directive and `@/` path aliases).

## Database

Uses PostgreSQL via Prisma ORM. Two models:
- **Client**: name, hourlyRate, currency (default COP), student, modalidad, grado, celular, direccion, correo, createdAt, updatedAt
- **Session**: tied to a Google Calendar `eventId` (unique), linked to a Client, stores date/durationHours/calculatedCost

Environment variables required: `DATABASE_URL`, `DIRECT_URL`

Run Prisma commands:
```bash
npx prisma generate       # Regenerate Prisma client after schema changes
npx prisma migrate dev    # Apply schema migrations in development
npx prisma db push        # Push schema without migration history
npx prisma studio         # Open visual DB editor
```

## Architecture

### Data Flow
1. `getClassSessions(accessToken, startDate, endDate)` — fetches Google Calendar events, filters by regex `/^class with (.+)$/i`, returns `ClassSession[]`
2. `syncSessionsToDatabase(sessions)` — matches sessions to DB clients, upserts by `eventId`, calculates cost as `durationHours × hourlyRate`

### Key Files
- `lib/google-calendar.ts` — Google Calendar API v3 integration (OAuth2 access token auth, no-store cache)
- `lib/actions/sync-sessions.ts` — Next.js Server Action; uses a Prisma transaction for atomic upserts
- `prisma/schema.prisma` — database schema

### Google Calendar Event Format
Events must match `"class with [ClientName]"` (case-insensitive). Client names are normalized to title case via `capitalize()`. All-day events are skipped.

### Cost Calculation
`calculatedCost = Math.round(durationHours × hourlyRate × 100) / 100`

Unknown clients are skipped (returned in `skippedUnknownClients`) rather than causing failures.

## Implementation Notes

- [Prisma 7 setup, migrations, and seeding](./prisma-setup.md) — covers Prisma 7 breaking changes, adapter-pg setup, Supabase pooler issue, and `.env` configuration
- [Next.js monthly balance app](./01_implementation.md) — full Next.js 16 App Router scaffold, NextAuth v5 Google OAuth, MonthlyBalance schema, server actions, and UI components
- [Client management & Telegram bot](./02_implementation.md) — Client model extension, web CRUD page, Telegram webhook, auth token refresh fix, nav bar
- [Public welcome page & admin restructuring](./04_implementation.md) — Public landing page (hero/testimonials/stories), `/admin/*` area with proxy middleware, Testimonial and Story models, Next.js 16 `proxy.ts` convention
- [Guided tour, PostHog analytics & public feedback](./22_implementation_guided_tour_and_feedback.md) — FTUE tour with canvas pause, PostHog funnel (game_started → registration_submitted), Supabase-style navbar feedback, star rating in completion modal, PublicFeedback model
- [Parent hook: video modal, bubble & source tracking](./23_parents_button_urgency.md) — Targeting mothers with pain-point CTAs, YouTube video modal, floating bubble with IntersectionObserver, Lead source field, PostHog parent funnel
- [Lessons learned: parent hook](./23_learning_parent_urgency.md) — useEffect cleanup discipline, viewport-level thinking, hydration timing, hover stops animation, scroll lock, observer efficiency
- [WH & Y/N structured question engine](./learning%20docs%20of%20ia%20revolutions/09_wh_and_yn_question.md) — Scaffolded grammar mode for English Academy: 5-part sentence builder, AI mystery scenario, clue tracking, deduction phase
- [Lessons learned: WH & Y/N questions](./learning%20docs%20of%20ia%20revolutions/09_learning_wh_and_yn_question.md) — Schema-as-contract, ref guard ordering, literal unions, evidence-first AI evaluation, learning UX patterns, Tailwind static analysis
