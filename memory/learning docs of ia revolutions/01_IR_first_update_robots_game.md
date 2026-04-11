# IA Revolutions — First Update: Robots Game Implementation Summary

**Date:** 2026-04-11  
**Project:** Transforming "Academia Dialectica" (tutoring platform) into "IA Revolutions" (AI consulting landing page)  
**Target:** iarevolutions.com — B2B AI consulting for small businesses in Colombia

---

## Overview

This session covered Phases 1–4 of the transformation plan: rebranding, building the factory robot game, updating landing page content, setting up the lead pipeline, and connecting a fresh Supabase database.

---

## Phase 1: Branding & Dark Theme Rebrand

### Files Modified

| File | Change |
|------|--------|
| `app/page.tsx` | Replaced all "Academia Dialectica" metadata, SEO, JSON-LD with IA Revolutions + AI services catalog |
| `app/layout.tsx` | Title, meta description, dark body background (`bg-slate-950`) |
| `components/welcome/public-navbar.tsx` | Logo, nav links ("Servicios", "Planes", "Testimonios", "Contactanos"), dark theme with glassmorphism |
| `components/welcome/footer.tsx` | Brand name, tagline, contact info (+57 3054500616), social links (Instagram, TikTok, YouTube) |
| `app/api/og/route.tsx` | OG image with circuit dot pattern, blue + orange fire orbs, metallic `// IA REVOLUTIONS` text |

### Design System
- **Background:** `bg-slate-950` (dark charcoal)
- **Cards:** `bg-slate-800/50` with `ring-1 ring-slate-700/50`
- **Text:** Silver (`text-slate-300`) body, white headings
- **Accents:** Blue-600 primary, orange fire gradients matching dragon logo
- **Brand:** `// IA REVOLUTIONS` prefix, uppercase tracking

---

## Phase 2: Factory Robot Game — "Automatiza tu Empresa"

### New File: `components/welcome/factory-canvas.tsx` (~800 lines)

A two-zone HTML5 Canvas factory simulation replacing the neuron-hunt mini-game.

**Game Concept:** Player clicks broken robots in a chaotic factory to convert them into productive ones, racing against a draining bank account. Converted robots pass through a glowing door into a clean construction zone.

#### Architecture Decisions

- **Bank account as closure variable** — NOT `useState`. At 60fps, React state would cause 60 re-renders/sec and massive lag. The `bankAccount` value lives inside the canvas `useEffect` closure.
- **HUD drawn on canvas** via `ctx.fillText()` — bank amount, timer, remaining count, company name. Only the quit button is a DOM element.
- **Natural reset via `resetFnRef`** — Instead of `key={gameSessionId}` forcing full remount, the canvas exposes a reset function through a ref. A `useEffect` watches `gameActive` and calls reset when transitioning to playing.
- **Performance optimizations:**
  - `currentLayout` cached in closure, updated only in `resize()`
  - `neighborCache` uses pre-allocated per-robot arrays, mutated via `fillClosestNeighbors()` (zero GC pressure per frame)
  - All pure helpers (`bezierControl`, `bezierPoint`, `loadImage`, `drawFallbackRobot`, `computeZoneLayout`, `buildDividerWalls`) moved outside the component function

#### Two Canvas Zones

| Zone | Area | Background | Content |
|------|------|------------|---------|
| Chaos (left/top) | 70% desktop, 60% mobile | Ruined factory image | Broken robots with full physics (spring forces, repulsion, wobble, wall bounces) |
| Construction (right/bottom) | 30% desktop, 40% mobile | Clean factory image | Converted robots docked in ordered line, progress bar, data pulse connections |

#### Dividing Wall + Door
- Vertical wall (desktop) or horizontal wall (mobile portrait)
- Glowing animated door where converted robots pass through
- Physics robots bounce off the wall; only transition animations cross it

#### Draining Bank Account Mechanic
- **Fácil:** ~$15/sec (~11 min to drain)
- **Medio:** ~$35/sec (~4.7 min)
- **Difícil:** ~$60/sec (~2.7 min)
- **Correct click:** +$300 bonus
- **Win:** All robots converted → drain stops → remaining balance = `finalSaved`
- **Lose:** Bank hits $0 OR 2-minute timer expires

#### Robot Conversion Flow
1. Player clicks broken robot in chaos zone
2. `+$300` floating text animation
3. Robot removed from physics array
4. Transition animation: lerp from chaos → through door → construction slot (0.7s)
5. Once docked: productive sprite + connection line to previous robot
6. Progress bar increments

#### Screenshot Capture
- `canvas.toDataURL('image/png')` fires when `TransitionRobot[]` is empty (all transitions complete)
- `crossOrigin = "anonymous"` on ALL `new Image()` calls (prevents tainted canvas)
- Screenshot shown in win/loss modal with download button

#### Physics Engine (Preserved from Neuron Canvas)
- Spring-force equilibrium model (organic floating motion)
- Multiplicative velocity damping (`0.97^timeScale`)
- Fixed-step accumulator (frame-rate independence at 60fps)
- Mouse repulsion (activates after 2 conversions, scales with difficulty)
- Hard short-range repulsion (60px) prevents overlap
- Wall collision with 0.8 restitution

### Modified File: `components/welcome/hero-section.tsx`

#### State Management Refactor
**Before (state sprawl):** `gameActive`, `gameComplete`, `gameOver`, `showRules`, `showForm`, `formSubmitted` — 6 independent booleans with impossible-to-track combinations.

**After (state machine):**
```typescript
const [gamePhase, setGamePhase] = useState<'idle' | 'rules' | 'playing' | 'won' | 'lost'>('idle');
const [formStep, setFormStep] = useState<'hidden' | 'form' | 'submitted'>('hidden');
```

#### Removed (Academia Dialectica code)
- `selectedClass`, `showClassModal`, `showCharacterStep`, `gameCharacterClass`
- `SpriteAnimator` imports, character sprites
- `score` state, `targetPaletteIdx`, `timeLeft`, `finalCerebritos`
- `gameSessionId` (replaced by natural reset)

#### Added (IA Revolutions)
- `companyName` state + input in rules modal
- `screenshotUrl` state for captured canvas image
- `convertedCount` for tracking progress
- Lead form with business fields: company name, industry dropdown, service interest dropdown
- Win/Loss modals with Spanish business messages + screenshot preview + download button
- "Agenda tu Consulta Gratis" CTA

#### Game Messages
- **Win:** "¡Exactamente eso pasa cuando usas la IA! En la carrera contra el tiempo ganarás más dinero entre más rápido la uses..."
- **Loss:** "Pierdes dinero en tu empresa por cada minuto que no usas IA, no solo porque tus competidores que usan IA te ganan clientes..."

---

## Phase 3: Landing Page Content

### Files Modified

| File | Change |
|------|--------|
| `components/welcome/features-section.tsx` | 6 AI service cards: Embudos de Venta, Auditorías IA, Agentes 24/7, Automatizaciones, Motor de Contenido, CRM con IA. Section `id="servicios"` |
| `components/welcome/modalities-section.tsx` | 3 engagement tiers: Consulta Gratuita, Proyecto Puntual, Plan Mensual. Section `id="planes"` |
| `components/welcome/testimonials-section.tsx` | Dark theme, heading references "clientes" and AI |
| `components/welcome/stories-section.tsx` | Dark theme, heading "Casos de Éxito", section `id="historias"` |

---

## Phase 4: Lead Pipeline & Database

### Schema Changes (`prisma/schema.prisma`)

**Lead model — final state:**
```prisma
model Lead {
  id              String    @id @default(cuid())
  name            String
  email           String    @unique
  phone           String?
  companyName     String?
  industry        String?
  serviceInterest String?
  gameScore       Int?
  difficulty      String?
  status          String    @default("NUEVO")
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
  @@map("leads")
}
```

**Removed:** `number` (auto-increment), `characterClass`, `savedAmount`  
**Added:** `companyName`, `industry`, `serviceInterest`, `status`  
**Changed:** `id` from `uuid` to `cuid()`

### Database Connection (Supabase)

**Problem encountered:** Both `DATABASE_URL` and `DIRECT_URL` pointed to Supabase's transaction pooler. Schema operations (`db push`) failed with "prepared statement already exists" (PgBouncer limitation). Direct connection was IPv6-only (unreachable from IPv4 network).

**Solution:** Use Session pooler (port 5432) as `DIRECT_URL` — IPv4 compatible and supports prepared statements.

**Final `.env` setup:**
- `DATABASE_URL` → Transaction pooler (port 6543) for runtime queries
- `DIRECT_URL` → Session pooler (port 5432) for migrations/schema ops

**See:** [01_IR_Prisma_learning.md](01_IR_Prisma_learning.md) for full debugging breakdown.

### Files Modified

| File | Change |
|------|--------|
| `prisma.config.ts` | `url: env('DATABASE_URL')` + `directUrl: env('DIRECT_URL')` with `@ts-expect-error` |
| `lib/actions/lead-actions.ts` | `createLead` accepts business fields, `getLeads` orders by `createdAt: "desc"`, added `getLeadsByDateRange` |
| `app/admin/leads/page.tsx` | Columns: Name, Email, Phone, Empresa, Industria, Servicio, $ Salvado, Estado, Fecha. Status badges (NUEVO/CONTACTADO/CERRADO) |
| `app/api/leads/download/route.ts` | CSV with business headers, UTF-8 BOM, no range params |
| `components/leads-download.tsx` | Simple "Descargar CSV" link (removed range inputs) |
| `lib/email-templates.ts` | Rewritten: `leadThankYouEmail` with dark theme, IA Revolutions branding, +57 international phone |
| `app/api/cron/process-leads/route.ts` | Simplified: sends thank-you email + marks `processedAt` (no more student account creation) |

### Tests Updated

| File | Change |
|------|--------|
| `__tests__/lib/email-templates.test.ts` | Tests `leadThankYouEmail`: HTML structure, branding, saved amount display, international phone |
| `__tests__/api/cron-process-leads.test.ts` | Tests simplified cron: auth, email sending, processedAt marking, email failure handling |

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | 0 errors |
| `npm test` | 45/45 passing (5 test files) |
| `npm run build` | Compiles successfully (Next.js 16 + Turbopack) |
| `prisma db push` | All tables created in Supabase |

---

## Pending Work

- **Robot sprite assets:** `public/robots/broken.png` and `public/robots/productive.png` (currently using procedural fallback drawing)
- **Factory backgrounds:** `public/factory/ruined.png` and `public/factory/clean.png`
- **Phase 5:** Remove education-specific code (client portal, RPG gamification, exams, progress notes, character assets)
- **Visual testing:** Run `npm run dev` and test the game flow end-to-end in browser
- **Mobile testing:** Verify portrait/landscape layouts, touch interaction

---

## Key Technical Constraints

1. **Vercel AI SDK v4** — Do NOT upgrade to v6, the API is incompatible
2. **Bank account NOT in React state** — Must be a closure variable to avoid 60fps re-renders
3. **HUD on canvas** — `ctx.fillText()`, not DOM overlay
4. **`crossOrigin = "anonymous"`** on all `new Image()` — Required for `canvas.toDataURL()` screenshot
5. **Screenshot timing** tied to `TransitionRobot[]` being empty, not a fixed delay
6. **Session pooler** for Supabase migrations (not direct connection which is IPv6-only)

---

## Reference

For full architectural details, module-by-module documentation, and historical implementation notes, see:  
[`CLAUDE.md`](../../AI%20Revolution/CLAUDE.md) — Project notes and implementation history for all modules.
