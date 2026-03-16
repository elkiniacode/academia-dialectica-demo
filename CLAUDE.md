# Project Notes

## Auth — Google OAuth Token Refresh

`lib/auth.ts` implements automatic access token refresh for Google Calendar API calls.

- On initial sign-in, the JWT callback stores `accessToken`, `refreshToken`, and `expiresAt`
- On subsequent requests, if the token is expired (checked with a 60s buffer), `refreshAccessToken()` calls `https://oauth2.googleapis.com/token` with the stored refresh token
- If refresh fails, `error: "RefreshAccessTokenError"` is set on the session — handle this by prompting re-login
- `session.accessToken` is always the current (possibly refreshed) token passed to Google Calendar API calls

## Client Management & Telegram Bot

See [02_implementation.md](memory/02_implementation.md) for full details.

- `/clients` page with full CRUD (add/edit/delete via modal forms)
- Telegram bot webhook at `/api/telegram/webhook` for quick mobile entry
- Client model extended with: student, modalidad, grado, celular, direccion, correo, createdAt, updatedAt
- Env vars required: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USER_ID`
- Telegram webhook must be registered with a public URL: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook`

## AI Client Analysis (Gemini)

See [03_implementation.md](memory/03_implementation.md) for full details.

- Upload photo/video of client form → Gemini extracts data → auto-fills the Add Client modal
- API route: `/api/analyze-client` (POST, auth-protected)
- Model: `gemini-2.5-flash` (older models `gemini-2.0-flash-lite` and `gemini-2.0-flash` are discontinued)
- Env var required: `GEMINI_API_KEY` (must be from Google Cloud Console with billing enabled, not AI Studio free tier)

## Bulk Client Import (Video/Photo)

See [05_implementation.md](memory/05_implementation.md) for full details.

- Upload video/photo with multiple client forms → Gemini extracts all as JSON array → editable preview table → batch insert
- Bulk API route: `/api/analyze-clients-bulk` (POST, auth-protected, 200 MB file limit)
- Server action: `bulkCreateClients` in `lib/actions/client-actions.ts` — validates, dedupes, atomic transaction
- Preview component: `components/bulk-import-preview.tsx` — inline-editable table with row deletion
- Green "Importación Masiva (Video/Foto)" button on `/admin/clients` page

## AI Chatbot Assistant

See [06_implementation.md](memory/06_implementation.md) for full details.

- Floating chat bubble on all `/admin/*` pages for querying client data in natural language
- Uses Vercel AI SDK **v4** (`ai@^4`) — do NOT upgrade to v6, the API is incompatible
- `streamText()` + `toDataStreamResponse()` server-side; `useChat` from `ai/react` client-side
- Three switchable providers: Claude (`claude-sonnet-4-20250514`), OpenAI (`gpt-4o-mini`), Gemini (`gemini-2.5-flash`)
- API route: `/api/chat` (POST, auth-protected, streaming); provider sent via `body` in `useChat`
- Anti-hallucination guardrail: AI responds only from DB data, refuses to invent information
- Error handling: inline red banner with context-aware messages (401, invalid API key, generic)
- Env vars required: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`
- Gemini uses `createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })` — not the default env var name
- Component: `components/chat-bubble.tsx` — fixed-position bubble at bottom-right with provider dropdown

## Neuron Canvas Animation (Hero Section)

See [07_implementation.md](memory/07_implementation.md) for full details.

- Biological neuron animation on HTML5 `<canvas>` overlaying the Hero Section
- 12 procedurally generated sprite variants with 5 color palettes (cyan, purple, teal, blue, rose)
- Neurons at 25–100px sizes with depth/parallax (30% background layer at reduced alpha/speed)
- Organic motion: base drift + sinusoidal wobble (0.15 amplitude) + velocity-aligned rotation + edge wrapping fallback
- Spring-force equilibrium model: each neuron pair attracts/repels toward a dynamic ideal distance (`sqrt(area/count) * 0.85`), producing a stable cellular matrix instead of clumping
- Hard short-range repulsion (60px) prevents overlap; soft boundary repulsion (80px margin) keeps neurons on screen
- Multiplicative velocity damping (`0.97^timeScale`) for frame-rate independent friction; connection cap of 3 nearest neighbors per neuron
- Double-stroke connections: thick palette-colored margin (3.5px) + thin white core (1.0px); mouse ghost uses cyan margin (4.0px) + white core (1.5px)
- Warm (orange) + cool (cyan) electric sparks along Bezier curves
- Mouse ghost neuron: cursor forms brighter double-stroke connections to nearby neurons
- Responsive ambient mode: 15 neurons on mobile, 35 tablet, 60 desktop; game mode: 5–10 target + 2 decoy neurons
- Visual clarity: `shadowBlur` glow in palette color, white stroke ring, subtle inner pulse on each neuron
- Mouse repulsion (game only): activates after 2 captures, base=0.03 + score×0.015, velocity cap 1.8, quadratic falloff within 150px
- Strategic L-walls (game only): outward-facing L-shapes (vertical 20×45%h + foot 100px), responsive on mobile (35%h/60px); hard screen boundary bounces (0.8 restitution) replace wrapping
- Delta-time animation (consistent speed on 60–240Hz), DPR-aware sizing, `pointer-events-none`
- Performance: neurons depth-sorted once at init, accumulated `animTime` for pulse (not `Date.now`), damping after all forces + velocity cap
- Component: `components/welcome/neuron-canvas.tsx` — integrated in `components/welcome/hero-section.tsx`

## Neuron Hunt Mini-Game (Hero Section)

See [08_implementation.md](memory/08_implementation.md) for full details.

- Interactive mini-game on top of NeuronCanvas: click neurons of a target color to remove them
- Monotonic `id` on each Neuron; Sparks use `fromId`/`toId` (not array indices) for safe removal
- `useLayoutEffect` ref bridges sync React props into animation loop with zero-frame delay
- Forgiving hit radius: `(drawSize/2) + 15px`; closest center wins on overlap
- Game spawns 5–10 target neurons (random) + 2 decoy neurons; win condition: all targets removed (`remaining === 0`)
- `score` prop passed from HeroSection → NeuronCanvas via `scoreRef` ref bridge
- Visual feedback: pulsing glow on targets, ×0.4 opacity dimming on non-targets, expanding red flash on wrong clicks
- `key={gameSessionId}` on `<NeuronCanvas>` forces fresh mount on game start/quit/replay
- Hero section uses `min-h-screen` to maintain full viewport height during gameplay
- Pre-game rules modal with difficulty selection: "Fácil" (×1.0), "Medio" (×1.5), "Difícil" (×2.0) — sets `difficulty` prop on NeuronCanvas for repulsion scaling
- 2-minute countdown timer: displayed in HUD (red at ≤30s); timeout triggers "Perdiste" game-over modal
- Dynamic final score: `(neurons×50 + secondsLeft×10) × difficultyMultiplier` → displayed as `finalCerebritos`
- Timer uses `timeLeftRef` + side-effects outside state updater (React Strict Mode safe); refs synced via `useLayoutEffect`
- 5-layer z-index: Canvas (z1) → Hero content (z2) → Rules modal (z50) → HUD (z20) → Game-over/Completion modal (z50)
- HUD: responsive `flex-wrap` layout for mobile; timer badge turns red at ≤30s; target color, score, timer, remaining, quit
- Completion modal: `finalCerebritos` score + neuroplasticity copy + "Reclama tu Premio" → lead form
- Components: `components/welcome/neuron-canvas.tsx`, `components/welcome/hero-section.tsx`

## Lead Capture Form

See [09_implementation.md](memory/09_implementation.md) for full details.

- "Reclama tu Premio" button on completion modal → inline registration form (Name, Email, Phone)
- Server action `createLead` called directly from client component (no API route)
- `Lead` model with auto-increment `number`, unique email constraint, optional phone, optional `gameScore` (Int) and `difficulty` (String) saved from game
- Server-side validation + P2002 duplicate handling + `revalidatePath`
- Admin page at `/admin/leads` with auth-protected `getLeads(limit=100)`
- "Leads" link added to NavBar

## Lead Numbering & CSV Download

See [10_implementation.md](memory/10_implementation.md) for full details.

- Auto-increment `number` field on Lead model (`@default(autoincrement())`)
- `getLeadsByRange(from, to)` server action with auto-swap logic
- CSV download API at `/api/leads/download?from=N&to=N` with UTF-8 BOM and robust escaping
- Download UI: range inputs with clamping + "Descargar CSV" / "Descargar Todo" buttons
- Admin page shows `#` column (right-aligned, monospace), newest first

## RBAC & Client Portal

See [11_implementation.md](memory/11_implementation.md) for full details.

- Dual auth: Google OAuth (admin only, whitelisted via `ADMIN_EMAIL`) + Credentials provider (username/password for clients)
- `Role` enum (`ADMIN`, `CLIENT`) on Client model; `username` (unique) and `password` (bcrypt) fields
- `proxy.ts` matcher covers `/admin/:path*` and `/client/:path*`; RBAC in `authorized` callback
- CLIENT on `/admin/*` → redirected to `/client/dashboard`; ADMIN can access `/client/*` to inspect
- JWT `maxAge` = 24 hours (ghost session mitigation)
- Three new models: `Exam` (title, score, date, commentary), `ProgressNote` (content, date, color), `Suggestion` (message, status)
- Buzón de Sugerencias: CLIENT creates suggestions → ADMIN marks as read
- Client portal at `/client/dashboard` with exams, progress notes, buzón form
- Security: S1 (all Server Actions check role), S2 (IDOR prevention — CLIENT uses session.userId), S3 (password min 8 chars + weak list), S4 (24h JWT), S5 (admin email whitelist)
- Env var required: `ADMIN_EMAIL`
- Password utility: `lib/password.ts` — trims whitespace before hash/verify to prevent copy-paste bugs
- Admin client form: "Acceso al Portal" section with username + password fields

## Admin Client Detail Page & Academic Data UI

See [12_implementation.md](memory/12_implementation.md) for full details.

- Admin client detail page at `/admin/clients/[id]` — client info header + Exams, Progress Notes, Suggestion panels
- Green "Ver" link per row in `/admin/clients` table navigates to the detail page
- `components/admin-exam-panel.tsx` — inline add form + color-coded scored list (green ≥7, yellow ≥5, red <5)
- `components/admin-progress-note-panel.tsx` — inline add form with 6 color swatches + left-bordered list
- `components/admin-suggestion-view.tsx` — read-only suggestion list + "Marcar leído" button
- Unread suggestion count banner on `/admin/dashboard` (yellow, links to clients list)
- `.env` gotcha: keys must have no leading spaces and no spaces around `=`; `ADMIN_EMAIL` formatting bug caused Google OAuth redirect loop — fix by clearing `authjs.session-token` cookie

## Security Hardening

See [13_implementation.md](memory/13_implementation.md) for full details.

- `.gitignore` created to prevent committing `.env`, `node_modules/`, `.next/`
- Telegram webhook: secret token verification via `X-Telegram-Bot-Api-Secret-Token` header
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on all routes
- Password validation: 20-entry weak list + rejects all-same-char + requires letter + number
- Server-side email regex validation in `createLead`
- Date validation (`isNaN` guard) in exam and progress note create/update actions
- PII redaction: `celular`, `direccion`, `correo`, `password`, `username` stripped before sending to AI providers in `/api/chat`
- CSV download: direct ADMIN auth check in `/api/leads/download` (defense-in-depth)
- Env var required: `TELEGRAM_WEBHOOK_SECRET` (register with `setWebhook?secret_token=...`)

## Student Gamification & RPG Progression

See [project_gamification.md](memory/project_gamification.md) for full details.

- RPG-style progression: students choose a character class (Guerrero, Mago, Explorador) and name their hero (one-time setup)
- Client model extended with: `hp` (0–100), `xp`, `level` (auto: `Math.floor(xp/100)+1`), `characterName`, `characterClass`
- Server actions in `lib/actions/gamification-actions.ts`: `updateClientStats` (ADMIN), `initializeCharacter` (CLIENT, IDOR-protected)
- Client dashboard (`/client/dashboard`): character creation form (no character) or RPG dashboard with avatar, HP/XP bars
- Character avatar: loads `/characters/{class}/level-{min(level,3)}.png`, falls back to colored letter-avatar on missing image
- Admin panel: `components/admin-gamification-panel.tsx` — full-width at top of `/admin/clients/[id]`, HP/XP adjustment form
- Character info badge shown in admin client header when set

## Spritesheet Character Animation & Companion

See [14_implementation.md](memory/14_implementation.md) for full details.

- `SpriteAnimator` component: CSS `steps()` + `background-position` for frame-by-frame horizontal spritesheet animation
- Scoped `@keyframes` via `useId()`, `imageRendering: pixelated` for crisp pixel art, `isMounted` guard in preload `useEffect`
- `CharacterAvatar` extended with `variant` (default/idle/companion), `size` (sm/md/lg), `animated` props
- Three-stage waterfall fallback: Animated Sprite → Static PNG (`level-N.png`) → Colored letter-avatar
- Spritesheet config: `frameWidth: 256, frameHeight: 256, frameCount: 4, duration: 0.8` (adjustable in `character-avatar.tsx`)
- Image assets: `public/characters/{class}/idle.png` (horizontal spritesheet), `level-N.png` (static fallback)
- Floating companion on all `/client/*` pages: `components/character-companion.tsx`, fixed bottom-right, localStorage toggle
- Companion mounted in `app/client/layout.tsx` via server-side `auth()` props (no `useSession` needed)
- CSS animations in `globals.css`: `companion-bob` (3s float), `character-glow` (2s glow pulse)
- Session extended with `characterClass`/`level` in JWT + session callbacks (`auth.config.ts`, `next-auth.d.ts`)
- Welcome page: 3 character class sprites with glow wrappers in `hero-section.tsx`, hidden during game mode
- Components: `components/sprite-animator.tsx`, `components/character-avatar.tsx`, `components/character-companion.tsx`

## AI Chatbot Tool Calling

See [16_implementation.md](memory/16_implementation.md) for full details.

- Upgraded from static data injection to **true tool calling** via Vercel AI SDK v4 `tools` parameter
- 7 tools defined with Zod schemas: `obtener_clientes`, `obtener_kpis_mensuales`, `obtener_matriz_ingresos_clientes`, `obtener_crecimiento_clientes`, `obtener_comparacion_anual`, `obtener_balance_mensual`, `obtener_periodos_disponibles`
- Tools call existing server actions from `dashboard-actions.ts` and `fetch-balance.ts` — no new data layer
- `maxSteps: 5` on both `streamText` (server) and `useChat` (client) for multi-round tool chaining
- System prompt includes today's date for relative time resolution ("el mes pasado" → correct year/month)
- PII still redacted on `obtener_clientes` before sending to third-party AI providers
- Empty tool-call intermediate messages filtered from chat UI rendering
- ADMIN role guard preserved at top of `/api/chat` POST handler

## Security Hardening v2

See [15_implementation.md](memory/15_implementation.md) for full details.

- API route authorization: `/api/chat`, `/api/analyze-client`, `/api/analyze-clients-bulk` now enforce `session.role === "ADMIN"` (previously only checked session existence)
- Telegram webhook fail-fast: `TELEGRAM_ALLOWED_USER_ID` and `TELEGRAM_WEBHOOK_SECRET` env vars are now mandatory — server crashes on startup if missing or malformed
- Telegram guards unconditional: secret header and user ID checks always run (no more conditional `if (WEBHOOK_SECRET)` wrappers)

## Bankist-Inspired Landing Page Redesign

See [17_implementation.md](memory/17_implementation.md) for full details.

- Public landing page redesigned with clean, minimalist Bankist UI design language
- Glassmorphism sticky navbar: `components/welcome/public-navbar.tsx` — logo, anchor links (#caracteristicas, #modalidades, #testimonios), "Acceso" CTA, mobile hamburger with absolute overlay dropdown
- Features section: `components/welcome/features-section.tsx` — 3 Bankist-style alternating rows (image placeholder + icon/text), `id="caracteristicas"`
- Tabbed modalities: `components/welcome/modalities-section.tsx` — Presencial/Online/Híbrido tabs with `key={activeTab}` fade animation, `id="modalidades"`
- Stories slider: `components/welcome/stories-section.tsx` — CSS-transform horizontal slider replacing grid, `<Image />` replacing raw `<img>`, prev/next arrows + dot navigation
- Premium design system: diffused shadows (`shadow-xl shadow-blue-900/5 ring-1 ring-gray-900/5`), micro-interactions (`hover:-translate-y-1`), tight header tracking, uppercase eyebrow labels
- Smooth scrolling: `scroll-smooth` on `<html>` in `app/layout.tsx`
- `fadeIn` keyframe in `globals.css` for tab content transitions
- Hero section: logo removed (moved to navbar), `id="hero"` added, all game logic preserved

## Docker & Deployment

- `Dockerfile` and `.dockerignore` are configured for Next.js standalone output
- `next.config.ts` has `output: "standalone"` enabled
- Run: `docker build -t running-app . && docker run -p 3000:3000 --env-file .env running-app`
