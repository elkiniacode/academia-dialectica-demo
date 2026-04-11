# 23 — Parent Hook: Video Modal, Floating Bubble & Source Tracking

## Context

PostHog funnel showed 84.85% drop-off after first page view. Target demographic: mothers (25-45) seeking urgent academic solutions for unmotivated kids. The existing landing page spoke to students (game, characters) but not to the decision-maker (the parent paying).

## PostHog Enhancements (Phase 1)

### Section Scroll Tracking (`components/welcome/section-tracker.tsx`)
- `IntersectionObserver` (threshold 0.3) watches all landing page section IDs: hero, caracteristicas, modalidades, testimonios, historias, footer
- Fires `section_viewed` event with `section_id` and `section_name` once per section per session (deduped via `Set`)
- `observer.unobserve(target)` after firing to stop wasting CPU cycles
- `setTimeout(fn, 100)` wrapper for Next.js hydration safety

### Pageview Tagging (`components/posthog-pageview.tsx`)
- Every `$pageview` now includes `page_name` property (Landing, Login, Gracias, Admin:*, Portal:*)
- Allows filtering funnels by meaningful page names instead of generic "First/Second page view"

## Parent Hook Feature (Phase 2)

### Hero Button (`components/welcome/hero-section.tsx`)
- New CTA: "¿Se aburre estudiando?" — orange gradient (`from-orange-500 to-amber-500`)
- `animate-parent-pulse` keyframe: warm glow breathing effect (`box-shadow` 0.3→0.5 opacity at 2s)
- Hover pauses animation (`animation: none`) + locks shadow for solid click target
- Rendered conditionally when `onParentHookClick` prop is provided

### Floating Bubble (`components/welcome/parent-bubble.tsx`)
- Fixed bottom-right pill with play icon SVG + "¿Cansada de pelear por las tareas?"
- Hidden when hero is visible (IntersectionObserver on `#hero`, fades in with `opacity/translate-y` transition)
- Unmounted when modal is open (prevents blurry pill behind `backdrop-blur`)
- Reuses `animate-companion-bob` from globals.css

### Video Modal (`components/welcome/parent-modal.tsx`)
- YouTube Short embed: `https://www.youtube.com/embed/VBW_-zDuLG0?rel=0` (rel=0 prevents distracting related videos)
- Aspect ratio: `aspect-[9/16] max-h-[65vh]` — tall enough to see Matías clearly on mobile
- Persuasive text: "Matías odiaba las matemáticas, pero amaba los videojuegos..."
- CTA: "Sé parte de la familia" — orange button matching hero style
- `document.body.style.overflow = "hidden"` on open, restored on close (prevents background scroll)
- Video engagement: 15s `setTimeout` fires `parent_video_engaged` with proper `clearTimeout` cleanup
- Click-outside-to-close on overlay

### State Coordination (`components/welcome/parent-hook-provider.tsx`)
- Wraps `HeroSection` + `ParentModal` + `ParentBubble`
- Two states: `modalOpen` (boolean) + `parentSource` (boolean signal to hero)
- Flow: click → `trackParentHookClicked(trigger)` → modal opens → CTA → `trackParentRegistrationStarted()` → modal closes → hero form opens with `formMode: "parent"`

### Database (`prisma/schema.prisma`)
- Added `source String?` to Lead model — nullable, stores `"parent"` for parent hook leads, `null` for game/standalone

### Server Action (`lib/actions/lead-actions.ts`)
- `createLead` now accepts optional `source` parameter
- Passed through to `prisma.lead.create()`

### Hero Form Mode Extension (`components/welcome/hero-section.tsx`)
- `formMode` type extended: `"game" | "standalone" | "parent"`
- `useEffect` on `parentSource` prop opens form in parent mode
- `handleSubmit` passes `source: "parent"` in leadData when `formMode === "parent"`
- Form title: "Sé parte de la familia" in parent mode
- Back button resets parent mode to game mode

### Admin Leads Table (`app/admin/leads/page.tsx`)
- Added "Fuente" column showing `lead.source` or "—"

## PostHog Event Flow
```
parent_hook_clicked { trigger: "hero_button" | "floating_bubble" }
  → parent_modal_viewed
  → parent_video_engaged (15s timer)
  → parent_registration_started
  → registration_submitted { form_mode: "parent" }
  → Lead saved with source: "parent"
```

## Landing Page Component Tree (updated)
```
app/page.tsx (server)
  └─ <main>
       ├─ SectionTracker (scroll tracking)
       ├─ ParentHookProvider (client wrapper)
       │    ├─ HeroSection (game + parent button)
       │    ├─ ParentModal (video + CTA)
       │    └─ ParentBubble (floating, hidden at top)
       ├─ FeaturesSection
       ├─ ModalitiesSection
       ├─ TestimonialsSection
       ├─ StoriesSection
       └─ Footer
```
