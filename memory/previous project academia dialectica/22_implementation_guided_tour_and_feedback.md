# 22 — Guided Tour (FTUE), PostHog Analytics Funnel & Public Feedback

## PostHog Analytics (Phase 1)

### Setup
- **Package:** `posthog-js` — initialized at module level in `components/posthog-provider.tsx` (outside React component, instant boot)
- **Pageview tracking:** Dedicated `components/posthog-pageview.tsx` using `usePathname()` + `useSearchParams()`, wrapped in `<Suspense>` as per official PostHog Next.js App Router docs
- **Provider:** Wraps app in `app/layout.tsx` inside `<SessionProvider>`
- **Env vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

### Funnel Events (`lib/analytics.ts`)
| Event | Location | Properties |
|-------|----------|------------|
| `game_started` | `handleDifficultyStart()` in hero-section | difficulty |
| `game_completed` | `handleGameComplete()` in hero-section | difficulty, cerebritos, time_remaining, score |
| `game_over` | Timer useEffect in hero-section | difficulty, score |
| `registration_submitted` | `handleSubmit()` in hero-section | difficulty, cerebritos, form_mode |

## Public Feedback (Phase 2)

### Database (`prisma/schema.prisma`)
```prisma
model PublicFeedback {
  id        String   @id @default(uuid()) @db.Uuid
  type      String   // GENERAL_ISSUE, GENERAL_IDEA, GAME_RATING
  rating    Int?     // 1-5 stars (only for GAME_RATING)
  message   String?  // max 2000 chars enforced server-side
  email     String?
  page      String   @default("/")
  createdAt DateTime @default(now())
  @@map("public_feedback")
}
```

### Server Action (`lib/actions/feedback-actions.ts`)
- `createPublicFeedback({ type, rating?, message?, email?, page? })` — no auth required
- Validates type enum, rating 1-5, message ≤ 2000 chars
- Logs errors with `console.error` for production debugging
- Unit tests: `__tests__/lib/feedback-actions.test.ts` (8 tests)

### Location 1: Navbar Feedback Button (`components/welcome/public-navbar.tsx`)
- Supabase-inspired dark dropdown (no floating widget — keeps landing page CTA-focused)
- Two-step flow: select "Problema" (⚠️) or "Idea" (💡) → textarea → submit
- Fixes applied: `stopPropagation` for double-toggle, Escape key close, body scroll lock on mobile, `type="button"` on all buttons, responsive width (`w-[calc(100vw-2rem)] sm:w-80`)

### Location 2: Game Completion Modal (`components/welcome/hero-section.tsx`)
- 1-5 star rating in the "¡Felicidades!" screen, between Cerebritos display and CTA buttons
- Optional comment textarea (expands after star click)
- Submits as `GAME_RATING` type; rating state resets on new game

## Guided Tour / FTUE (Phase 3)

### Architecture
- **Custom implementation** (no react-joyride) — canvas elements can't be targeted by DOM-based libraries
- **Hook:** `hooks/use-game-tour.ts` — manages step index, localStorage persistence (`neuron-hunt-tour-seen`), replay support. State updaters are pure (no side effects).
- **Component:** `components/welcome/game-tour.tsx` — dark overlay + tooltip card with step indicators

### Tour Steps (4 total, in Spanish)
1. **Neuronas** — Inline SVG neuron illustration in tooltip card (does NOT highlight canvas center — neurons spawn randomly)
2. **Paredes** — Inline SVG wall illustration in tooltip card
3. **Temporizador** — Highlights DOM element via `data-tour="timer"` attribute + `getBoundingClientRect()`
4. **Cerebritos** — Highlights DOM element via `data-tour="score"` attribute

### Pause Mechanism
- `paused` prop added to `NeuronCanvasProps` (`components/welcome/neuron-canvas.tsx`)
- When `paused=true`: physics frozen (`dt=0`), animation time frozen, but canvas keeps rendering
- Timer `setInterval` in hero-section gated with `!isTourActive` in dependency array

### Trigger & Replay
- Tour auto-starts on first game (checked via localStorage in `startTourIfFirstTime()`)
- ❓ "Ayuda" button in game HUD replays tour (visible when `gameActive && !isTourActive`)

### Tooltip Positioning
- Inline steps: centered in game container
- DOM steps: positioned below target element with arrow
- Resize-safe: recalculates on `window.resize`
- Mobile bleed prevention: `safeLeft = Math.max(160, Math.min(containerWidth - 160, rawLeft))`

## Files Created
| File | Purpose |
|------|---------|
| `components/posthog-provider.tsx` | PostHog init + React provider |
| `components/posthog-pageview.tsx` | Suspense-wrapped pageview tracker |
| `lib/analytics.ts` | Typed PostHog event helpers |
| `lib/actions/feedback-actions.ts` | Public feedback server action |
| `hooks/use-game-tour.ts` | Tour state management hook |
| `components/welcome/game-tour.tsx` | Tour overlay + tooltip UI |
| `__tests__/lib/feedback-actions.test.ts` | 8 unit tests for feedback action |

## Files Modified
| File | Changes |
|------|---------|
| `app/layout.tsx` | Added PostHog provider + Suspense pageview |
| `prisma/schema.prisma` | Added PublicFeedback model |
| `components/welcome/public-navbar.tsx` | Added Feedback button + Supabase-style dropdown |
| `components/welcome/hero-section.tsx` | Analytics events, star rating in completion modal, tour integration, Ayuda button, data-tour attributes |
| `components/welcome/neuron-canvas.tsx` | Added `paused` prop, freeze physics when paused |
