# 23 — Lessons Learned: Parent Hook Implementation

## 1. Cleanup-First Effects

Every `useEffect` that creates a side effect must return a cleanup that undoes it. Write the cleanup *before* writing the logic.

- `setTimeout` → always `clearTimeout` in cleanup (modal 15s timer would fire false PostHog events after close)
- `IntersectionObserver` → always `disconnect` in cleanup
- DOM style overrides (`body.overflow = "hidden"`) → always restore in cleanup
- Use a `ref` to guard one-time events from duplicate fires

**Rule:** If you `set` something, you `unset` it. If you `observe` something, you `unobserve` it. No exceptions.

## 2. Viewport-Level Thinking

Don't design components in isolation. Think about what the user sees at each scroll position.

- The floating bubble was redundant when the hero's identical orange button was already visible → solution: IntersectionObserver hides bubble until hero scrolls away
- The bubble was visible behind `backdrop-blur` when the modal opened → solution: unmount bubble when modal is open

**Rule:** Before adding a persistent UI element, scroll through the entire page mentally and ask "is this redundant or conflicting with anything visible right now?"

## 3. Next.js Hydration Timing

`document.getElementById()` in `useEffect` can return `null` if the DOM isn't fully painted yet. This happened in both `SectionTracker` and `ParentBubble`.

**Rule:** Always wrap DOM queries in `setTimeout(fn, 100)` in Next.js App Router, and clean up that timeout too.

## 4. Hover Stops Animation

A pulsing button feels "slippery" when the user tries to click it. The animation should pause on hover so the button feels solid and intentional.

**Rule:** Any animated interactive element should have `hover:animate-none` (or CSS equivalent) plus a static hover state.

## 5. YouTube Embed Hygiene

- Use `?rel=0` to prevent YouTube from showing random related videos after playback
- Use `aspect-[9/16]` for Shorts with `max-h-[65vh]` — 50vh was too small on mobile to see the content clearly

## 6. Background Scroll Lock

When a modal opens, the page behind it can still scroll, creating a disorienting experience.

**Rule:** Set `document.body.style.overflow = "hidden"` when a full-screen modal opens, restore to `"unset"` on close. Always in the same `useEffect` with proper cleanup.

## 7. Custom Events Over Generic Pageviews

PostHog's default "First/Second page view" funnel was uninterpretable. Custom events with semantic names (`game_started`, `parent_hook_clicked`, `section_viewed`) make funnels actionable.

**Rule:** Always add a `page_name` or meaningful property to pageview events. Build funnels on intentional user actions, not navigation events.

## 8. Observer Efficiency

After an IntersectionObserver fires for a section, `unobserve` that element immediately. The browser wastes CPU recalculating intersections for elements you no longer care about.

**Rule:** One-time observers should self-clean: `observer.unobserve(entry.target)` inside the callback.
