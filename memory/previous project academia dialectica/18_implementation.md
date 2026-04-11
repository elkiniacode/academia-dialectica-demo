# 18 — Hero Section Split-Screen Redesign

## Summary

Refactored the hero section (`components/welcome/hero-section.tsx`) from a full-screen blue gradient overlay into a modern 50/50 split-screen layout. Left column contains typography, character sprites, and CTAs; right column contains the NeuronCanvas game in a rounded dark container. All game logic, state, refs, modals, HUD, and NeuronCanvas props remain 100% untouched.

## Layout Changes

### Root Section
- **Before:** `relative overflow-hidden min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white`
- **After:** `relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gray-50 overflow-hidden`
- Removed `min-h-screen` — grid determines height naturally
- `pt-32`/`lg:pt-40` clears the sticky navbar
- Removed decorative blur circles (no longer fit light theme)

### Grid Container
```html
<div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
```

### Left Column (Text & CTAs)
- Bankist-style eyebrow: `tracking-widest uppercase text-sm font-bold text-blue-600`
- Headline with gradient span on "Personalizada": `text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600`
- Character sprites moved from absolute positioning to `flex gap-6 mb-10` row
- Sprite labels changed from `text-blue-300` to `text-blue-600` (readable on light bg)
- CTA buttons in `flex flex-col sm:flex-row gap-4`:
  - "Empieza el Juego" (primary): `bg-blue-600 rounded-full shadow-lg shadow-blue-600/30`
  - "Conoce Más" (secondary): `bg-white border border-gray-200 rounded-full`, links to `#caracteristicas`
- "Acceso Administrador" button replaced with "Conoce Más" anchor
- Conditionally hidden when `gameActive || gameComplete || gameOver || showRules`

### Right Column (Game Container)
```html
<div className="relative w-full aspect-square lg:aspect-auto lg:h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 ring-1 ring-gray-900/5 bg-gray-900 transition-all duration-500 ease-in-out">
```
- No `hover:-translate-y-2` — container stays static so click targets aren't shifted during gameplay
- `transition-all duration-500 ease-in-out` — smooth cinematic expansion when game starts
- During game mode: `lg:col-span-2 lg:h-[80vh] lg:max-h-[700px]` (expands to full width)
- NeuronCanvas fills via `absolute inset-0` (unchanged)
- HUD moved inside container — `absolute top-8` (was `top-10`), stays trapped in `relative overflow-hidden`
- Added `shadow-xl` to HUD and `animate-pulse` on timer when `≤30s`

### Modals (Outside Grid)
- Rules, Game Over, and Completion modals moved outside the grid container
- Changed from `absolute inset-0` to `fixed inset-0` — overlay full viewport, not just section
- `z-index: 60` (was 50) — above everything including navbar
- Backdrop: `bg-gray-900/80 backdrop-blur-sm` (was `bg-black/60`)
- All modal cards upgraded: `rounded-2xl`/`rounded-3xl`, `ring-1 ring-gray-900/5`
- Difficulty buttons: added `hover:-translate-y-1 shadow-lg`, `rounded-xl`
- Game Over: score displayed in a `bg-gray-50 rounded-xl` card with large `text-5xl` number
- Completion modal: score in `bg-blue-50 border border-blue-100 rounded-2xl` card
- Lead form: labeled inputs with `tracking-widest uppercase` labels, `bg-gray-50` fields
- Success state: green circle checkmark icon replacing bouncing text
- All modal transitions use `animate-[fadeIn_0.5s_ease-out]`

## What Was NOT Changed
- All 16 state variables and 3 refs
- Timer logic (`useEffect` + `setInterval` + `timeLeftRef`)
- `handleSubmit`, `startGame`, `quitGame`, `handleNeuronClicked`, `handleGameComplete`, `handleDifficultyStart`
- `<NeuronCanvas />` component and all its props
- `key={gameSessionId}` remounting strategy
- `createLead` server action integration

## File Modified
- `components/welcome/hero-section.tsx` — layout-only refactor (JSX structure + Tailwind classes)

## Unused Import Cleanup
- Removed `import Link from "next/link"` — replaced with native `<a href="#caracteristicas">` anchor
