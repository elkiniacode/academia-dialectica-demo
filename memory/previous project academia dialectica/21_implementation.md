# 21 — Mobile Responsive, Character Select & Auto-Email Pipeline

## Mobile Fixes

### Neuron Scaling (`components/welcome/neuron-canvas.tsx`)
- `scaleFactor = Math.min(1, minDim / 600)` applied to `drawSize` in `initNeurons()` — neurons shrink proportionally on small screens (e.g. 0.6× at 360px)

### Responsive HUD (`components/welcome/hero-section.tsx`)
- HUD container: `top-4 sm:top-8`, `px-2 py-2 sm:px-4 sm:py-3`, `gap-1 sm:gap-2`, `text-xs sm:text-sm`
- Color name badge: `text-base sm:text-xl`
- Score/timer badges: `px-2 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-sm`

### Landscape Detection (`components/welcome/hero-section.tsx`)
- `isLandscape` state via `matchMedia('(orientation: landscape) and (max-height: 500px)')` — targets phones only, excludes tablets/desktops
- Game container: `aspect-auto h-[70vh]` when landscape (instead of `aspect-square`)
- Game-expanded mode: adds `h-[75vh]` in landscape
- HUD: `top-2 py-1` when landscape

## UX Fixes

### "Conoce Más" Button (`components/welcome/hero-section.tsx`)
- Changed from `<a href="#testimonios">` to a `<button>` that opens the existing lead form modal
- DRY approach: `formMode` state (`"game" | "standalone"`) controls title and data sent
  - `"standalone"`: title "Regístrate para más información", no game stats
  - `"game"`: title "Reclama tu Premio", sends gameScore/difficulty/characterClass
- Modal condition: `(gameComplete || (formMode === "standalone" && (showForm || formSubmitted)))`
- Success screen: shows "Cerrar" button in standalone mode, "Jugar de Nuevo" in game mode

### Canvas Refresh After Game End
- `setGameSessionId((prev) => prev + 1)` called inside `handleSubmit` on success — forces `<NeuronCanvas key={gameSessionId}>` remount to ambient state immediately

## Character Selection → Lead → Auto-Email

### Character Selection Step (`components/welcome/hero-section.tsx`)
- New states: `gameCharacterClass` (string|null), `showCharacterStep` (bool)
- Modal flow: score display → character step → lead form → success
- "Reclama tu Premio" now goes to `showCharacterStep` first
- Character step shows 3 animated SpriteAnimator buttons (guerrero/mago/explorador)
- Reset in `startGame()`: `setShowCharacterStep(false)`, `setGameCharacterClass(null)`, `setFormMode("game")`

### Lead Model Update (`prisma/schema.prisma`)
- `Lead.characterClass String?` — saves chosen character
- `Lead.processedAt DateTime?` — null until email sent + client created
- `Client.requirePasswordChange Boolean @default(false)` — set true by cron
- Applied via `npx prisma db push` (DB already had tables, no migration history)

### createLead Update (`lib/actions/lead-actions.ts`)
- Accepts `characterClass?: string`, validated against `["guerrero", "mago", "explorador"]`
- Passes to `prisma.lead.create()`

### Email Infrastructure
**`lib/email.ts`**
- Gmail API via `googleapis` (NOT Nodemailer — Railway blocks SMTP ports 465/587)
- `getOAuth2Client()` — uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- `makeRawMessage(to, subject, html)` — RFC 2822 MIME with RFC 2047 `=?UTF-8?B?...?=` encoding for Subject/From headers, base64 body for UTF-8 content
- `sendEmail(to, subject, html)` — sends via `gmail.users.messages.send()` over HTTPS, throws on failure (cron uses this to skip and retry)
- Env vars: `GMAIL_USER`, `GMAIL_REFRESH_TOKEN` (uses shared `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`)

**`lib/email-templates.ts`**
- `welcomeStudentEmail({ name, username, password, characterClass, siteUrl })` → HTML table-based email
- Gradient header with logo, credentials card (monospace username/password), login CTA button

### Cron Endpoint (`app/api/cron/process-leads/route.ts`)
- `POST /api/cron/process-leads` protected by `Authorization: Bearer $CRON_SECRET`
- Finds leads: `processedAt IS NULL`, `characterClass IS NOT NULL`, `createdAt <= 4 days ago`
- **Email-first order**: sends email → only on success runs `$transaction` (create Client + mark lead processed)
- Username generated from name: `slugifyName(name) + 3 random digits`, collision check
- Password: two Spanish words + 2 digits (meets `validatePassword` requirements)
- Created client has `requirePasswordChange: true`
- Failed leads stay unprocessed for retry next run
- Cron schedule: `0 9 * * *` via cron-job.org hitting `POST https://domain/api/cron/process-leads`
- Env vars: `CRON_SECRET`, `GMAIL_USER`, `GMAIL_REFRESH_TOKEN`

## Forced Password Change

**`lib/actions/client-actions.ts`**
- `changePassword(newPassword)`: CLIENT role, IDOR-protected, validates via `validatePassword()`, sets `requirePasswordChange = false`, returns `{ success, username }` for re-authentication
- `updateUsername(newUsername)`: CLIENT role, IDOR-protected, validates length + no spaces, handles P2002

**`app/client/change-password/page.tsx`**
- Client-side validation: 8+ chars, letter + number, passwords match — before hitting server
- On success: calls `signIn("credentials", { username, password, redirect: false })` to get fresh JWT with `requirePasswordChange: false`, then redirects to `/client/dashboard` via `window.location.href`

**`lib/auth.config.ts` + `lib/auth.ts`**
- `requirePasswordChange` passed through `authorize()` → JWT token → session
- `authorized` callback redirects CLIENT with `requirePasswordChange === true` to `/client/change-password` (unless already there)
- JWT callback handles `trigger === "update"` to clear `requirePasswordChange`

**`types/next-auth.d.ts`**
- `requirePasswordChange?: boolean` added to both `Session` and `JWT` interfaces

## Username & Password Edit on Dashboard

**`components/username-edit-form.tsx`**
- Inline editor: shows `saved` username + "Editar" button
- Input with `onKeyDown Enter` support + `autoFocus`
- Client-side validation: 3+ chars, no spaces
- Calls `updateUsername` server action

**`components/password-change-form.tsx`**
- Inline editor: shows "••••••••" + "Cambiar" button
- Expands to two inputs (new password + confirm) with save/cancel
- Client-side validation: 8+ chars, letter + number, passwords match
- Calls `changePassword` then `signIn("credentials", ...)` to refresh JWT
- Shows success message for 2s then collapses

**`app/client/dashboard/page.tsx`**
- Imports and renders both `<UsernameEditForm>` and `<PasswordChangeForm>` inside character panel when `client.username` is set

## Unit Tests

**`__tests__/lib/email-templates.test.ts`** — 8 tests
- HTML structure, student name, credentials, character class mapping/fallback, login CTA, logo URL, footer domain

**`__tests__/api/cron-process-leads.test.ts`** — 5 tests
- Auth rejection, empty leads, full processing flow (email-first order), name collision skip, email failure (no DB write), username collision

**`__tests__/lib/client-actions.test.ts`** — 14 tests
- `changePassword`: auth, role, weak passwords, IDOR protection, returns username, sets `requirePasswordChange: false`
- `updateUsername`: auth, length, trim/lowercase, P2002 duplicate, generic errors

## Dependencies
- `googleapis` (Gmail API + OAuth2)
- `nodemailer` removed (Railway blocks SMTP ports; using Gmail API over HTTPS instead)
