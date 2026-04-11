# Neuron Canvas Animation (Hero Section)

## Overview

A high-end, biological neuron animation rendered on an HTML5 `<canvas>` overlaying the Hero Section of the public welcome page. Neurons drift organically, form Bezier-curve connections when near each other, and sparks of electricity travel along those connections. A mouse-following ghost neuron adds interactivity.

## Architecture

### Neuron Sprites

12 procedurally generated sprite variants, each rendered once onto an OffscreenCanvas (160×160px) via `renderNeuronSprite()`. Each sprite has:
- 5–10 main dendrite branches drawn as quadratic Bezier curves
- 0–2 sub-branches per dendrite with synaptic knobs at tips
- Wispy tip extensions for organic feel
- Soma (cell body) with radial gradient glow and bright nucleus

**5 color palettes** cycle across the 12 variants: cyan, purple/violet, warm teal, cool blue, and warm rose. Each neuron picks a random sprite, so the field has natural color variety.

Neurons are drawn at sizes from **25–100px** with random rotations.

### Organic Motion

Each neuron has:
- A base drift velocity (`vx`, `vy`) for slow linear movement
- Layered sinusoidal wobble on both axes (0.15 amplitude) with per-neuron frequencies
- **Velocity-aligned rotation**: neurons smoothly lerp their rotation toward their movement direction
- **Wrapping** as a safety fallback for neurons that escape boundary forces

### Depth / Parallax

~30% of neurons spawn as background layer (`depth: 0.5–0.8`), which reduces their speed, size, alpha, and connection line thickness. Neurons are sorted back-to-front before drawing, creating a subtle 3D layered feel.

### Spring-Force Equilibrium (Stable Cellular Matrix)

Neurons self-organize into a **stable, evenly-spaced lattice** via a spring-force model:
- **Dynamic ideal distance**: `sqrt(canvasArea / neuronCount) * 0.85` — auto-adapts to screen size and neuron count
- **Spring force per pair**: each neuron pair within `idealDist * 2.2` interaction radius experiences a force that repels below ideal distance and attracts above it, with zero net force at equilibrium. Force tapers to zero at the interaction boundary.
- **Hard short-range repulsion**: neurons within 60px get a quadratic push apart (`REPULSION_STRENGTH = 0.15`) to prevent overlap
- **Soft boundary repulsion**: neurons within 80px of canvas edges are gently pushed inward (`BOUNDARY_FORCE = 0.05`)
- **Multiplicative damping**: velocity decays by `0.97^timeScale` per frame for frame-rate independent friction and fast settling
- **Speed cap**: group forces capped at `MAX_GROUP_SPEED = 1.5` to prevent physics explosions
- **Epsilon guard**: `dist || 0.001` prevents NaN from zero-distance division

### Biological Connections

Each neuron connects to its **3 closest neighbors** within 200px (capped for clean, biological branching). Connections are **quadratic Bezier curves** with control points offset perpendicular to the segment. Edges are deduplicated via a `Set` to avoid double-drawing. Opacity fades linearly with distance.

### Electrical Sparks

For each connected pair, there is a ~2.0 chance per second of spawning a spark. Two spark types:
- **Cool sparks (60%)**: white-hot center → cyan → blue radial gradient
- **Warm sparks (40%)**: white-hot center → yellow → orange radial gradient (matching biological reference imagery)

Sparks travel along the Bezier path at 1.5–4.0 units/second.

### Mouse Ghost Neuron

A "ghost" neuron follows the cursor position. It connects to its 3 nearest neurons with brighter lines (2.5× alpha) and renders as a soft radial glow (30px). Mouse events are captured on the parent `<section>` element since the canvas has `pointer-events-none`.

### Performance & Responsiveness

- **OffscreenCanvas sprite cache** — procedural sprites rendered once, blitted as bitmaps
- **Delta-time animation** — all motion and spark spawning scales by `dt` for consistent speed on 60–240Hz monitors. Frame dt capped at 50ms to avoid jumps after tab switches.
- **DPR-aware sizing** — `devicePixelRatio` applied on every `ResizeObserver` callback for crisp Retina/HiDPI rendering
- **Responsive neuron count** — 15 on mobile (<768px), 35 on tablet (<1024px), 60 on desktop
- **`globalAlpha`** used for connection drawing instead of parsing rgba strings per stroke

## Files

### `components/welcome/neuron-canvas.tsx` — Canvas Component

- `'use client'` component using `useRef` and `useEffect`
- Procedural sprite generation with 5 color palettes across 12 variants
- `requestAnimationFrame` loop with delta-time
- `ResizeObserver` for responsive canvas sizing
- Mouse tracking via parent element event listeners
- Canvas positioned `absolute inset-0` with `z-index: 1`, `pointer-events-none`

### `components/welcome/hero-section.tsx` — Layout Integration

- Imports and renders `<NeuronCanvas />` between the background blur divs and the text content
- Text content div set to `z-index: 2` so it remains above the canvas
- CTA button and all text remain fully clickable

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `SPRITE_VARIANTS` | 12 | Number of unique procedural sprites |
| `CONNECTION_DIST` | 200px | Max distance for connections |
| `MAX_CONNECTIONS_PER_NEURON` | 3 | Connection cap per neuron |
| `SPARK_CHANCE_PER_SEC` | 2.0 | Spark probability per connected pair per second |
| `EQUILIBRIUM_FACTOR` | 0.85 | Multiplier on `sqrt(area/count)` for ideal spacing |
| `INTERACTION_RADIUS_MULT` | 2.2 | Interact up to 2.2× the ideal distance |
| `SPRING_STRENGTH` | 0.004 | Spring force multiplier for attraction/repulsion |
| `REPULSION_DIST` | 60px | Hard minimum repulsion radius |
| `REPULSION_STRENGTH` | 0.15 | Hard repulsion force multiplier |
| `DAMPING` | 0.97 | Per-frame multiplicative velocity damping |
| `BOUNDARY_MARGIN` | 80px | Soft repulsion distance from canvas edges |
| `BOUNDARY_FORCE` | 0.05 | Strength of edge repulsion |
| `MAX_GROUP_SPEED` | 1.5 | Cap on force-driven velocity |
| `TARGET_DT` | 1/60s | Reference frame duration for time scaling |
