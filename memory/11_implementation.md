# 11 — RBAC, Client Portal & Student Progress Models

## Overview

Added role-based access control (RBAC), client authentication via username/password, a student portal at `/client/dashboard`, and three new Prisma models for tracking student progress.

## Prisma Schema Changes

### Role enum
```prisma
enum Role {
  ADMIN
  CLIENT
}
```

### Client model additions
- `username String? @unique` — unique login identifier set by admin (e.g., `adriana.sophy`)
- `password String?` — bcrypt-hashed, optional (existing clients unaffected)
- `role Role @default(CLIENT)` — defaults to CLIENT; admin uses Google OAuth
- Relations: `exams Exam[]`, `progressNotes ProgressNote[]`, `suggestions Suggestion[]`

### New models

**Exam** (`exams` table) — relates to Client via `clientId` (onDelete: Cascade)
- `title String`, `score Float`, `date DateTime @db.Date`, `commentary String`

**ProgressNote** (`progress_notes` table) — relates to Client via `clientId` (onDelete: Cascade)
- `content String`, `date DateTime @db.Date`, `color String` (Tailwind color for frontend rendering)

**Suggestion** (`suggestions` table) — "Buzón de Sugerencias", relates to Client via `clientId` (onDelete: Cascade)
- `message String`, `status String @default("unread")`
- Directionality: CLIENT creates suggestions → ADMIN reads and marks as "read"

## Authentication

### Dual provider setup in `lib/auth.ts`
- **Google OAuth** — for admin only. S5: verifies `token.email === process.env.ADMIN_EMAIL` in JWT callback; any other Google account is denied.
- **Credentials** — for clients. Looks up by `username` (unique field), verifies bcrypt-hashed password via `lib/password.ts`.

### JWT & Session
- JWT carries `role` and `userId` fields (augmented in `types/next-auth.d.ts`)
- S4: `session.maxAge` set to 24 hours — revoked clients kicked within 1 day
- Google sign-in sets `role: "ADMIN"`, no userId
- Credentials sign-in sets `role: user.role`, `userId: client.id`
- Token refresh only runs for ADMIN role (Google tokens)

### Password utility (`lib/password.ts`)
- `hashPassword(plain)` — trims whitespace, bcrypt hash with cost 12
- `verifyPassword(plain, hash)` — trims whitespace before compare
- `validatePassword(plain)` — enforces min 8 chars, rejects weak passwords ("12345678", "password", "contraseña", etc.)

## Route Protection (RBAC)

### `proxy.ts`
Matcher expanded to `["/admin/:path*", "/client/:path*"]`

### `authorized` callback in `lib/auth.ts`
- Unauthenticated users on `/admin/*` or `/client/*` → redirect to `/login`
- CLIENT on `/admin/*` → redirect to `/client/dashboard`
- `/client/*` allows both CLIENT and ADMIN (admin can inspect student portal)

## Security Hardening (S1–S5)

- **S1 (Server Action guards):** Every Server Action verifies `session.role` internally — not just auth presence. All existing admin actions (`dashboard-actions.ts`, `fetch-balance.ts`, `generate-balance.ts`, `client-actions.ts`, `story-actions.ts`, `testimonial-actions.ts`, `lead-actions.ts`) updated.
- **S2 (IDOR prevention):** Client-facing actions use `session.userId` from JWT, never trust `clientId` from frontend for CLIENT role.
- **S3 (Password validation):** Min 8 chars, weak password blocklist, `.trim()` before hash/verify to prevent accidental whitespace.
- **S4 (Ghost session mitigation):** JWT `maxAge` = 24 hours. Combined with S1/S2, even lingering tokens can't modify data.
- **S5 (Admin email whitelist):** Google OAuth only grants ADMIN to `process.env.ADMIN_EMAIL`. All other Google accounts are denied at JWT callback.

## Login Page (`app/login/page.tsx`)

- Dual login: username/password form for students + Google button for admin
- Role-based redirect: ADMIN → `/admin/balance?year=...&month=...`, CLIENT → `/client/dashboard`
- Consistent `adminTargetUrl` variable used for both session redirect and Google `redirectTo`
- `components/client-login-form.tsx` — client component using `signIn("credentials", ...)` with `useRouter` for SPA navigation

## Client Portal

### Layout (`app/client/layout.tsx`)
- `min-h-screen bg-gray-50` wrapper with centered `max-w-7xl` main content
- Uses `ClientNavBar` component

### Navbar (`components/client-nav-bar.tsx`)
- Shows client name, "Mi Dashboard" link, sign-out button
- "← Volver a Admin" link visible only when `session.role === "ADMIN"` (for admin inspection)

### Dashboard (`app/client/dashboard/page.tsx`)
- Server component fetching client data via `session.userId`
- Sections: Mis Exámenes (card grid with score), Notas de Progreso (color-coded border-left cards), Mi Buzón de Sugerencias (with status badges)
- Includes `BuzonForm` component for submitting new suggestions

### Buzón Form (`components/buzon-form.tsx`)
- Client component with textarea + submit button
- Calls `createSuggestion(message)` server action
- Error handling with try/catch/finally, inline error banner
- `router.refresh()` after successful submission

## Admin Client Form Updates

### `components/client-form.tsx`
- Added "Acceso al Portal" section with `username` and `password` fields
- Password field shows "Nueva Contraseña (dejar vacío para no cambiar)" when editing
- `ClientData` interface extended with `username: string | null`

### `lib/actions/client-actions.ts`
- `createClient` / `updateClient`: accept username + password from FormData, validate password (S3), hash before storing
- Username uniqueness check before create/update
- All functions now check `session.role !== "ADMIN"` (S1)

## New Server Actions

### `lib/actions/exam-actions.ts`
- `getExams(clientId?)` — ADMIN passes clientId, CLIENT uses session.userId (S2)
- `createExam`, `updateExam`, `deleteExam` — ADMIN only (S1)
- All mutations call `revalidatePath` for both `/client/dashboard` and `/admin/clients`

### `lib/actions/progress-note-actions.ts`
- Same pattern as exams: ADMIN has full CRUD, CLIENT can only read their own
- `revalidatePath` on all mutations

### `lib/actions/suggestion-actions.ts`
- `createSuggestion(message)` — CLIENT only, uses `session.userId` as author (S2)
- `getSuggestions(clientId?)` — ADMIN sees all (with client name), CLIENT sees own
- `markSuggestionRead(suggestionId)` — ADMIN only

## Environment Variables

- `ADMIN_EMAIL` — whitelisted Google email for admin access (S5)
- `bcryptjs` added as dependency (`@types/bcryptjs` as devDependency)

## Files Created/Modified

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Modified — Role enum, Client fields, 3 new models |
| `lib/password.ts` | **Created** — bcrypt hash/verify/validate with trim |
| `types/next-auth.d.ts` | Modified — role, userId on Session/JWT |
| `lib/auth.ts` | Modified — Credentials provider, S4/S5, RBAC authorized |
| `proxy.ts` | Modified — matcher includes `/client/:path*` |
| `app/login/page.tsx` | Modified — dual login, role-based redirect |
| `components/client-login-form.tsx` | **Created** — username/password form |
| `components/client-nav-bar.tsx` | **Created** — client portal navbar |
| `components/buzon-form.tsx` | **Created** — suggestion submission form |
| `app/client/layout.tsx` | **Created** — client portal layout |
| `app/client/dashboard/page.tsx` | **Created** — student dashboard |
| `lib/actions/client-actions.ts` | Modified — password/username support, ADMIN guards |
| `components/client-form.tsx` | Modified — username + password fields |
| `lib/actions/exam-actions.ts` | **Created** — CRUD with S1/S2 |
| `lib/actions/progress-note-actions.ts` | **Created** — CRUD with S1/S2 |
| `lib/actions/suggestion-actions.ts` | **Created** — buzón with S1/S2 |
| `lib/actions/dashboard-actions.ts` | Modified — ADMIN role guard |
| `lib/actions/fetch-balance.ts` | Modified — ADMIN role guard |
| `lib/actions/generate-balance.ts` | Modified — ADMIN role guard |
| `lib/actions/lead-actions.ts` | Modified — ADMIN role guard (except createLead which is public) |
| `lib/actions/story-actions.ts` | Modified — ADMIN role guard |
| `lib/actions/testimonial-actions.ts` | Modified — ADMIN role guard |
