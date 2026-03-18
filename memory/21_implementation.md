# 21 — Mobile Performance & Layout Optimization

## Problem
The deployed site worked perfectly on desktop but had severe mobile issues:
- Hero section canvas animation caused 5–10 second freezes
- Admin navbar overflowed horizontally (no hamburger menu)
- Tables were hard to read on small screens
- General sluggishness across all mobile interactions

## Neuron Canvas Performance (Critical)

### Root Causes
- `closestNeighbors()` called **twice per neuron per frame** (spark spawning + connection drawing) — each call did N distance computations + full sort
- 30 neurons on mobile = ~60 sorts/frame at 60fps = 3,600 sorts/sec
- N² spring-force computation with `Math.sqrt()` per pair
- Per-frame object allocation (`new Map()`, `new Set()`, template string keys) triggered frequent GC pauses
- Uncapped DPR on 3× mobile screens (3× canvas pixel ops)
- No frame skip on 120Hz phones (double physics load)
- Animation ran at 60fps even when scrolled off-screen

### Fixes Applied

**Algorithmic (all platforms):**
- Extracted `closestNeighbors` to `lib/closest-neighbors.ts` — pure function, zero-allocation
- Uses `distSq` for early rejection (avoids `Math.sqrt` for far-away pairs)
- Fixed-size insertion buffer instead of sort+slice (max 2 swaps per candidate)
- Only applies `Math.sqrt` to the final top-K results at the very end
- Caller provides pre-allocated `out` buffer — function returns count, never truncates array
- Neighbor cache computed **once per frame**, reused in both update() and draw()

**Zero-allocation draw loop (all platforms):**
- Pre-allocated `neuronMap` (Map), `drawnEdges` (Set<number>), `connectionPairs` (object pool)
- Numeric edge keys (`min*1000+max`) instead of template string allocation
- True object pool: `activeConnections` counter tracks usage without touching `connectionPairs.length`
- Pool grows to max needed size in first few seconds, then zero allocations forever

**Mobile-only (gated by `isMobile` flag):**
- Neuron count: 30 → 15 (mobile), 70 → 40 (tablet) — desktop stays at 120
- DPR capped to 2 on mobile — saves ~44% canvas pixel operations on 3× devices
- Fixed-step physics at 60fps (accumulator pattern) — desktop uses variable timestep
- Sin/cos lookup table (360-entry `Float64Array`) — desktop uses native `Math.sin`/`Math.cos`

**Lifecycle (all platforms):**
- `IntersectionObserver` pauses animation when hero scrolls off-screen (CPU → 0%, saves battery)
- `{ passive: true }` on mousemove/mouseleave listeners (browser can scroll immediately)
- `React.memo` wrapper prevents parent re-renders from triggering canvas re-renders
- Canvas context `{ desynchronized: true }` — bypasses DOM compositing cycle

**Key files:**
- `lib/closest-neighbors.ts` — optimized neighbor lookup (pure, testable)
- `__tests__/lib/closest-neighbors.test.ts` — unit test: 100 random points, asserts same results as naive sort+slice
- `components/welcome/neuron-canvas.tsx` — all canvas optimizations integrated

## Admin Navbar Hamburger Menu

- `components/nav-bar.tsx` — added hamburger menu for mobile (`md:hidden`)
- Desktop links: `hidden md:flex items-center gap-6`
- Mobile: absolute dropdown overlay with all 6 links + logout
- Mirrors pattern from `components/welcome/public-navbar.tsx`

## Table Mobile Readability

- `components/balance-table.tsx` — `text-xs md:text-sm`, `whitespace-nowrap`, responsive padding `px-2 py-1.5 md:px-3 md:py-2`
- `components/dashboard/revenue-matrix.tsx` — same text/padding treatment, reduced `min-w-[110px]` → `min-w-[80px] md:min-w-[110px]`, client column `min-w-[140px]` → `min-w-[100px] md:min-w-[140px]`
- `whitespace-nowrap` forces horizontal scroll via `overflow-x-auto` instead of ugly text wrapping

## Admin Page Padding

- All 7 admin pages: `p-6` → `p-3 md:p-6` for more mobile breathing room
- Files: dashboard, balance, clients, clients/[id], testimonials, stories, leads

## Tab Animation GPU Hint

- `app/globals.css`: `fadeIn` keyframe uses `translate3d(0, 5px, 0)` for GPU compositing
- `components/welcome/modalities-section.tsx`: `will-change-[opacity,transform]` on animated element

## Tests

- 21 tests passing (19 existing + 2 new closestNeighbors tests)
- Zero TypeScript errors
