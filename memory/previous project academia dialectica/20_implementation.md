# 20 — Performance Optimization, Gemini→Claude Migration, Testing, CI & Docker

## Summary

Comprehensive update covering web performance optimizations, AI provider migration from Gemini to Claude, unit testing framework, CI pipeline, and Docker multi-stage deployment setup.

---

## 1. AI Provider Migration: Gemini → Claude

### Image Analysis Routes
- `/api/analyze-client` and `/api/analyze-clients-bulk` rewritten from `@google/genai` (Gemini) to `@anthropic-ai/sdk` (Claude Vision)
- Model: `claude-sonnet-4-20250514` — sends images as base64 directly (no file upload/polling)
- Video support removed — Claude Vision only supports images (JPEG, PNG, GIF, WebP)
- File size limit on bulk route reduced from 200MB to 20MB (base64 constraint)

### Chat Provider
- Removed Gemini from chat provider dropdown — now Claude + OpenAI only
- Removed `@ai-sdk/google` import and `createGoogleGenerativeAI` from `/api/chat`
- `components/chat-bubble.tsx` updated: 2-provider type, 2-entry label map

### Packages Removed
- `@ai-sdk/google` — Vercel AI SDK Google provider
- `@google/genai` — Google Generative AI SDK (73 packages total)

### UI Updates
- `components/client-form.tsx` — accept images only, label "Subir foto"
- `components/client-table.tsx` — accept images only, button "Importación Masiva (Foto)"
- `app/admin/clients/page.tsx` — description text updated to reflect image-only

### Env Var
- `GEMINI_API_KEY` no longer required anywhere

---

## 2. Web Performance Optimizations

### Bundle Splitting (Lazy Loading)
- `components/chat-bubble-lazy.tsx` — "use client" wrapper with `dynamic(() => import(...), { ssr: false })` for ChatBubble (~150KB AI SDK deferred)
- `components/dashboard/charts-lazy.tsx` — "use client" wrapper for TrendCharts, ClientGrowthChart, YearComparison (~200-300KB Recharts deferred)
- `app/admin/layout.tsx` — uses `ChatBubbleLazy` instead of direct import
- `app/admin/dashboard/page.tsx` — uses lazy chart wrappers instead of `next/dynamic` (Next.js 16 disallows `ssr: false` in Server Components)

### ISR (Incremental Static Regeneration)
- `app/page.tsx` — added `export const revalidate = 3600` (landing page cached for 1 hour)

### Image Optimization
- `components/character-avatar.tsx` — replaced raw `<img>` with Next.js `<Image>` component
- `components/welcome/stories-section.tsx` — removed `unoptimized` prop, added `sizes` attribute
- `components/welcome/features-section.tsx` — added `priority` to first feature image (LCP)

### Server-Side Computation
- `components/dashboard/kpi-cards.tsx` — removed unnecessary `useEffect` (useState initializer already computes correct default month)

### Query Caching
- `lib/actions/dashboard-actions.ts` — wrapped 4 query functions with `unstable_cache` from `next/cache`:
  - `getDashboardKPIs` (tag: `dashboard-kpis`, 1h TTL)
  - `getClientRevenueMatrix` (tag: `dashboard-revenue-matrix`, 1h TTL)
  - `getClientGrowthData` (tag: `dashboard-client-growth`, 1h TTL)
  - `getYearComparisonData` (tag: `dashboard-year-comparison`, 1h TTL)
- Pattern: auth guard stays in exported function, data logic in inner `_function` wrapped with `unstable_cache`

### Narrowed Revalidation
- `lib/actions/exam-actions.ts` — `revalidatePath` with specific client path instead of broad layout
- `lib/actions/progress-note-actions.ts` — same pattern
- `lib/actions/suggestion-actions.ts` — targeted paths using `session.userId` and `suggestion.clientId`
- `lib/actions/story-actions.ts` — `revalidatePath("/", "page")` + `/admin/stories`
- `lib/actions/testimonial-actions.ts` — `revalidatePath("/", "page")` + `/admin/testimonials`

### Prisma Query Optimization
- `lib/actions/generate-balance.ts` — added `select: { id: true, name: true, hourlyRate: true }` to client query

### Streaming Skeletons
- `app/admin/clients/loading.tsx` — skeleton table (header + 8 rows)
- `app/admin/clients/[id]/loading.tsx` — skeleton client header + 3 panels
- `app/client/dashboard/loading.tsx` — skeleton character card + exams + notes + suggestion box

---

## 3. Unit Testing Framework

### Setup
- `vitest.config.ts` — Vitest with `vite-tsconfig-paths`, happy-dom environment
- `vitest.setup.ts` — imports `@testing-library/jest-dom/vitest`

### Tests (19 total)
- `__tests__/lib/password.test.ts` — 13 tests: validatePassword (weak list, same-char, Spanish chars, trimming) + hashPassword/verifyPassword round-trip
- `__tests__/components/client-login-form.test.tsx` — 6 tests: renders fields, ADMIN/CLIENT redirect, error message, router.refresh

### Dependencies Added
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `happy-dom`, `vite-tsconfig-paths`, `vitest-mock-extended`

---

## 4. Security Scanning & CI

### npm Audit
- `package.json` overrides for transitive dependency vulnerabilities: `hono`, `@hono/node-server`, `jsondiffpatch`, `lodash`
- 10 of 11 vulnerabilities fixed; 1 remaining (ai@4.x filetype bypass — low risk, no fix without breaking upgrade)

### Makefile
- `make test`, `make test-watch` — unit tests
- `make audit`, `make audit-fix` — npm security scanning
- `make security` — audit + tests combined

### GitHub Actions CI
- `.github/workflows/ci.yml` — two jobs on push to main and PRs:
  - `security-audit` — `npm audit` (continue-on-error)
  - `test` — `npm test`
- Both use Node 20 LTS

### Other
- `.env.example` — all required env var placeholders (no secrets)

---

## 5. Docker Multi-Stage Build

### Dockerfile (rewritten)
4 stages, 2 targets:
- **base** — `node:20-alpine`, `libc6-compat`, `NEXT_TELEMETRY_DISABLED=1`
- **deps-dev** — `npm ci` (all dependencies)
- **builder** — `prisma generate` (with dummy `DATABASE_URL`) + `npm run build`
- **dev** target — copies deps-dev + source, runs `npm run dev`
- **prod** target — minimal image: standalone output + Prisma runtime files + schema, non-root `nextjs` user

### docker-compose.yml (new)
- `app-dev` (profile: dev) — bind-mount for hot reload, anonymous node_modules volume
- `app-prod` (profile: prod) — production image
- No local DB — uses Supabase

### .dockerignore (expanded)
- Excludes: `.env*`, `node_modules`, `.next`, `.git`, `README.md`, `memory/`, `__tests__/`, `.github/`, `.vscode/`, `.idea/`

### Makefile Docker targets
- `make docker-dev` / `make docker-prod` — compose with profiles
- `make docker-down` — stop all
- `make docker-build-prod` / `make docker-run-prod` — standalone build + run

### Cloud Deployment
- Recommended: Railway (auto-detects Dockerfile, GitHub auto-deploy, $5/mo hobby plan)
- Cloudflare Workers rejected: incompatible with Prisma 7, bcryptjs, file uploads, streaming AI

---

## Files Created

| File | Purpose |
|------|---------|
| `components/chat-bubble-lazy.tsx` | Client wrapper for lazy-loading ChatBubble |
| `components/dashboard/charts-lazy.tsx` | Client wrapper for lazy-loading Recharts components |
| `app/admin/clients/loading.tsx` | Streaming skeleton for clients list |
| `app/admin/clients/[id]/loading.tsx` | Streaming skeleton for client detail |
| `app/client/dashboard/loading.tsx` | Streaming skeleton for student dashboard |
| `vitest.config.ts` | Vitest configuration |
| `vitest.setup.ts` | Test setup (jest-dom matchers) |
| `__tests__/lib/password.test.ts` | Password validation tests |
| `__tests__/components/client-login-form.test.tsx` | Login form tests |
| `.env.example` | Environment variable template |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |
| `Makefile` | Dev/prod/test/security/Docker targets |
| `docker-compose.yml` | Docker Compose dev + prod services |

## Files Modified

| File | Changes |
|------|---------|
| `Dockerfile` | Rewritten: multi-stage with dev + prod targets |
| `.dockerignore` | Expanded exclusions |
| `app/api/analyze-client/route.ts` | Gemini → Claude Vision |
| `app/api/analyze-clients-bulk/route.ts` | Gemini → Claude Vision |
| `app/api/chat/route.ts` | Removed Gemini provider |
| `components/chat-bubble.tsx` | 2-provider dropdown |
| `components/client-form.tsx` | Image-only accept, updated labels |
| `components/client-table.tsx` | Image-only accept, updated button text |
| `app/admin/clients/page.tsx` | Updated description text |
| `app/admin/layout.tsx` | Uses ChatBubbleLazy wrapper |
| `app/admin/dashboard/page.tsx` | Uses lazy chart wrappers |
| `app/page.tsx` | ISR revalidate = 3600 |
| `components/character-avatar.tsx` | img → Next.js Image |
| `components/welcome/stories-section.tsx` | Removed unoptimized, added sizes |
| `components/welcome/features-section.tsx` | Added priority to first image |
| `components/dashboard/kpi-cards.tsx` | Removed useEffect |
| `lib/actions/dashboard-actions.ts` | unstable_cache on 4 queries |
| `lib/actions/exam-actions.ts` | Narrowed revalidatePath |
| `lib/actions/progress-note-actions.ts` | Narrowed revalidatePath |
| `lib/actions/suggestion-actions.ts` | Narrowed revalidatePath |
| `lib/actions/story-actions.ts` | Narrowed revalidatePath |
| `lib/actions/testimonial-actions.ts` | Narrowed revalidatePath |
| `lib/actions/generate-balance.ts` | Prisma select optimization |
| `package.json` | Added test deps, overrides, removed Gemini packages |
