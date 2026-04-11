# 17 — Bankist-Inspired Landing Page Redesign

## Summary

Redesigned the public landing page with a clean, minimalist design language inspired by the Bankist UI. Added a sticky glassmorphism navbar, Bankist-style alternating features section, tabbed modalities component, and converted the stories grid into a CSS-transform slider — all with a premium design system (diffused shadows, micro-interactions, tight typography).

## Premium Design System

Applied globally across all new and modified components:

| Rule | Tailwind Classes | Where |
|------|-----------------|-------|
| Glassmorphism | `bg-white/80 backdrop-blur-md border-b border-white/20` | Navbar |
| Micro-interactions | `transition-all duration-300 ease-out hover:-translate-y-1` | Cards, features, buttons |
| Diffused shadows | `shadow-xl shadow-blue-900/5 ring-1 ring-gray-900/5` | Cards, panels, slider |
| Headers | `tracking-tight text-gray-900` | All `<h2>`, `<h3>` |
| Section labels | `tracking-widest uppercase text-sm font-bold text-blue-600` | Eyebrow above every heading |

## What Changed

### New Components

#### `components/welcome/public-navbar.tsx`
- `"use client"` with `useState` for mobile hamburger toggle
- Sticky glassmorphism: `sticky top-0 z-50 bg-white/80 backdrop-blur-md`
- Logo left (`<Image src="/logo.png" />`), nav links center, "Acceso" CTA right (`bg-blue-600 rounded-full`)
- Anchor links: `#caracteristicas`, `#modalidades`, `#testimonios` — native smooth scroll
- Mobile dropdown: `absolute top-full` overlay (no layout shift), larger touch targets (`text-base p-6 gap-4`)
- Hamburger SVG toggles between 3-line and X icon

#### `components/welcome/features-section.tsx`
- Server component, `id="caracteristicas"`
- 3 features in Bankist alternating layout (`grid md:grid-cols-2`, odd/even `md:order-1/2`)
- Each row: large image placeholder on one side, icon + text on the other
- Icon circles: `bg-blue-100 text-blue-600` with `group-hover:-translate-y-1 group-hover:shadow-md`
- Image placeholders: `aspect-video md:aspect-square rounded-2xl` with diffused shadow
- Features: Tutoría Personalizada, Seguimiento Académico, Flexibilidad Total

#### `components/welcome/modalities-section.tsx`
- `"use client"` with single `useState<number>(0)` for active tab
- `id="modalidades"`, 3 tabs: Presencial, Online, Híbrido
- Tab buttons: `rounded-full`, active = `bg-gray-900 text-white`, inactive with `hover:-translate-y-0.5`
- `flex-wrap` on button container for mobile stacking
- Content panel: diffused shadow + `ring-1 ring-gray-900/5`
- `key={activeTab}` forces `animate-[fadeIn_0.5s_ease-out]` on tab switch

### Modified Components

#### `components/welcome/hero-section.tsx`
- Added `id="hero"` to root `<section>`
- Removed logo `<Image>` block (logo moved to navbar)
- Removed unused `Image` import
- All game logic, HUD, modals, lead form untouched

#### `components/welcome/testimonials-section.tsx`
- Added `id="testimonios"` for scroll targeting
- Added eyebrow label above heading
- Headers use `tracking-tight`
- Cards: `flex flex-col h-full` for uniform height, diffused shadow, `hover:-translate-y-1`
- `mt-auto` on client name pushes it to bottom edge

#### `components/welcome/stories-section.tsx`
- Converted from server to `"use client"` component
- Replaced raw `<img>` with Next.js `<Image />` (`fill`, `unoptimized` for external URLs)
- Converted from 2-column grid to CSS-transform horizontal slider
- Slider: `translateX(-${currentSlide * 100}%)` with `transition-transform duration-500`
- Navigation: prev/next SVG arrow buttons + dot indicators (`bg-blue-600` active)
- `bg-white` container, `flex flex-col h-full` articles, `flex-grow` text box
- Hidden navigation when only 1 story

#### `components/welcome/footer.tsx`
- Expanded from centered single-column to 3-column grid
- Column 1: Logo + tagline
- Column 2: Nav anchor links with `hover:translate-x-1` slide-right effect
- Column 3: Contact (Bogotá, Colombia)
- Headers: `tracking-widest uppercase` for consistency
- Removed `mixBlendMode: "screen"` from Image
- `border-t border-gray-800` separator above copyright

#### `app/layout.tsx`
- Added `className="scroll-smooth"` to `<html>` tag

#### `app/globals.css`
- Added `fadeIn` keyframe: `opacity: 0 → 1` + `translateY(5px → 0)` for tab transitions

#### `app/page.tsx`
- Imported and rendered: `PublicNavbar`, `FeaturesSection`, `ModalitiesSection`
- Render order: Navbar → Hero → Features → Modalities → Testimonials → Stories → Footer

## Architecture

```
PublicNavbar (sticky z-50, glassmorphism)
  ├─ Logo → #hero
  ├─ Links → #caracteristicas, #modalidades, #testimonios
  └─ CTA → /login

<main>
  HeroSection (#hero) — neuron game, lead capture (unchanged)
  FeaturesSection (#caracteristicas) — 3 alternating rows
  ModalitiesSection (#modalidades) — tabbed Presencial/Online/Híbrido
  TestimonialsSection (#testimonios) — floating cards grid
  StoriesSection — CSS slider with arrows + dots
  Footer — 3-column with nav links
</main>
```

Smooth scrolling enabled globally via `scroll-smooth` on `<html>`. All anchor links use native browser smooth scroll behavior.

## Files Modified

- `app/layout.tsx` — scroll-smooth
- `app/page.tsx` — new section imports and render order
- `app/globals.css` — fadeIn keyframe
- `components/welcome/public-navbar.tsx` — new
- `components/welcome/features-section.tsx` — new
- `components/welcome/modalities-section.tsx` — new
- `components/welcome/hero-section.tsx` — remove logo, add id
- `components/welcome/testimonials-section.tsx` — premium card design
- `components/welcome/stories-section.tsx` — grid → CSS slider
- `components/welcome/footer.tsx` — 3-column layout
