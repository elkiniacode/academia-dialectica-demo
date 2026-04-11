# Neuron Hunt Mini-Game (Hero Section)

## Overview

Interactive mini-game layered on top of the existing NeuronCanvas animation. Users click neurons of a randomly selected target color to remove them. When all target-color neurons are eliminated, a completion modal appears with a neuroplasticity educational message and registration CTA for Academia Dialéctica. The game takes up the full viewport height (`min-h-screen` on the hero section).

## Architecture

### NeuronCanvas Game Props (`components/welcome/neuron-canvas.tsx`)

```ts
interface NeuronCanvasProps {
  gameActive?: boolean;
  targetPaletteIdx?: number | null;
  onNeuronClicked?: (correct: boolean, remaining: number) => void;
  onGameComplete?: () => void;
}
```

- **Ref bridges**: `useLayoutEffect` (not `useEffect`) syncs React props into refs for zero-frame-delay access inside the animation loop. Parent must wrap callbacks in `useCallback` to avoid unnecessary re-fires.
- **Monotonic IDs**: Each `Neuron` has a unique `id: number` field. `Spark` uses `fromId`/`toId` instead of array indices — safe across neuron removals.
- **O(1) neuron lookup**: `Map<number, Neuron>` rebuilt per frame in `draw()` for spark rendering.

### Click Detection

- Canvas `pointer-events-none` removed conditionally when `gameActive` is true
- CTA buttons at `zIndex: 2` remain clickable above canvas at `zIndex: 1`
- **Forgiving hit radius**: `(n.drawSize / 2) + 15` — extra 15px padding for accessibility
- Closest neuron center wins when hit radii overlap
- On correct hit: `removeNeuron(idx)` splices neuron + filters orphaned sparks by ID
- On wrong hit or empty space: triggers red flash animation

### Visual Game Feedback (in `draw()`)

- **Target neurons**: pulsing glow ring (`sin(Date.now()/300)` oscillation) using target palette's glow color
- **Non-target neurons**: drawn at ×0.4 opacity to make targets visually pop (tune to 0.7 if background looks too empty)
- **Wrong-click flash**: expanding red ring at click position, 300ms decay via `wrongClickFlash.time`

### Hero Section Game State (`components/welcome/hero-section.tsx`)

Converted to `"use client"` component with state management:

- `gameActive`, `targetPaletteIdx`, `score`, `remaining`, `gameComplete`, `gameSessionId`
- **`key={gameSessionId}`** on `<NeuronCanvas>` — forces React to destroy and rebuild the canvas with fresh neurons on game start/quit/replay (prevents depleted neuron pool)
- All callbacks (`handleNeuronClicked`, `handleGameComplete`, `quitGame`) wrapped in `useCallback`

### Z-Index Layer Architecture

The hero section uses `min-h-screen` to maintain full viewport height when hero content is hidden during gameplay.

1. **Layer 1** (`zIndex: 1`): NeuronCanvas — physics engine, click target during game
2. **Layer 2** (`zIndex: 2`): Hero content — `pointer-events-none` container with `pointer-events-auto` on buttons only
3. **Layer 3** (`zIndex: 20`): Game HUD — target color name, score counter, remaining countdown, quit (✕) button
4. **Layer 4** (`zIndex: 50`): Completion modal — neuroplasticity message, Academia Dialéctica branding, registration CTA, play again button

### UI Elements

- **HUD** (during gameplay): Pill-shaped bar with `backdrop-blur-md`, shows objective color name (Spanish), score, remaining count
- **Quit button**: ✕ in HUD, resets canvas via `gameSessionId` increment
- **Completion modal**: White card with "¡Felicidades!" header, points display ("{score} cerebritos"), VIP exclusivity copy ("si haces *match* con nuestra metodología"), neuroplasticity educational text. Two CTAs: "Reclama tu Premio" (→ inline form) and "Jugar de Nuevo"
- **Branding**: "Academia Dialéctica" in hero title and completion modal text

### Palette Display Names (Spanish)

```ts
const PALETTE_NAMES = ["Cian", "Púrpura", "Verde Azulado", "Azul", "Rosa"];
```

Maps to PALETTES array indices 0–4 (cyan, purple, teal, blue, rose).

## Key Files

- `components/welcome/neuron-canvas.tsx` — Canvas component with game props, click handler, visual feedback
- `components/welcome/hero-section.tsx` — Client component with game state, HUD, completion modal
