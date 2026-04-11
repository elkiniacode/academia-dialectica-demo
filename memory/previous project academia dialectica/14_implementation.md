# Spritesheet Character Animation & Companion (March 2026)

## SpriteAnimator Component

Core CSS spritesheet animation component at `components/sprite-animator.tsx`:
- Uses CSS `steps()` timing function + `background-position` for frame-by-frame animation
- Horizontal spritesheets: `[frame0][frame1]...[frameN]` laid out left-to-right
- Scoped `@keyframes` via `useId()` — multiple instances with different sizes don't conflict
- `imageRendering: "pixelated"` keeps pixel art crisp when scaled up
- Image preloading via `new Image()` in `useEffect` with `isMounted` guard to prevent memory leaks
- `onError` callback excluded from `useEffect` dependency array to prevent infinite re-render loops
- Props: `src`, `frameWidth`, `frameHeight`, `frameCount`, `duration`, `displayWidth`, `displayHeight`, `className`, `alt`, `onError`

## CharacterAvatar Extension

`components/character-avatar.tsx` extended with backward-compatible props:
- `variant`: `"default" | "idle" | "companion"` — controls which image source is used
- `size`: `"sm"` (48px) | `"md"` (128px) | `"lg"` (192px, 256px on md+)
- `animated`: when `true`, renders `<SpriteAnimator>` instead of `<img>`

Three-stage waterfall fallback: Animated Sprite → Static PNG (`level-N.png`) → Colored letter-avatar

Spritesheet config (adjustable): `frameWidth: 256, frameHeight: 256, frameCount: 4, duration: 0.8`

## Image Asset Structure

```
public/characters/
  guerrero/idle.png     # Horizontal spritesheet (e.g., 4×256px = 1024×256)
  guerrero/level-1.png  # Static fallback (256×256, optional)
  mago/idle.png
  mago/level-1.png
  explorador/idle.png
  explorador/level-1.png
```

All images: transparent background PNG. Spritesheets are horizontal strips with equal-sized frames.

## CSS Animations (`app/globals.css`)

- `companion-bob` (3s): gentle vertical float (-4px) for the companion container
- `character-glow` (2s): pulsing indigo drop-shadow for the dashboard idle character
- These layer on top of the spritesheet `steps()` animation — sprite handles frame changes, CSS handles positional float/glow

## Floating Companion

`components/character-companion.tsx` — small animated character on all `/client/*` pages:
- Fixed position `bottom-4 right-4` (z-10)
- Renders `<CharacterAvatar variant="companion" size="sm" animated />`
- Wrapped in `.animate-companion-bob` for gentle floating
- Hide/show toggle persisted in `localStorage("companion-visible")`
- Props-based (no `useSession`) — receives `characterClass` and `level` from server-side layout

Mounted in `app/client/layout.tsx` via server-side `auth()` call passing props.

## Session Extension

- `types/next-auth.d.ts`: added `characterClass?: string` and `level?: number` to `Session` and `JWT`
- `lib/auth.ts`: credentials `authorize` returns `characterClass` and `level` from client record
- `lib/auth.config.ts`: JWT callback stores them on login; session callback passes them through
- Caveat: JWT data is stale until re-login (24h max age), but companion image only changes at level 1/2/3 boundaries

## Dashboard Idle Animation

`app/client/dashboard/page.tsx`: `<CharacterAvatar variant="idle" size="lg" animated />` wrapped in `.animate-character-glow` container

## Welcome Page Showcase

`components/welcome/hero-section.tsx`: all 3 character classes displayed with `<SpriteAnimator>` at 80×80px below the hero text, above CTA buttons. Each wrapped in `.animate-character-glow` with `group-hover:scale-110`. Hidden during game mode. Graceful degradation: `SpriteAnimator` returns `null` if image fails to load.
