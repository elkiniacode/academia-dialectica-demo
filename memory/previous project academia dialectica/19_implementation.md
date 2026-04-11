# 19 — Landing Page Polish (Colors, Navbar, Footer, Sprites)

## Summary

A series of incremental polish commits to the landing page: hero color tweaks, doubled ambient neuron count, social media footer, navbar/footer anchor links, footer legibility improvements, and a character label.

## Hero Section (`components/welcome/hero-section.tsx`)

- Background: `bg-gray-50` → `bg-blue-50/50` → `bg-blue-50` (settled on solid soft blue)
- Game container: `bg-gray-900` → `bg-slate-950` → `bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800` (restored original blue gradient so neurons glow against the blue)
- "Conoce Más" CTA anchor changed from `#caracteristicas` → `#testimonios`
- Added "ESCOGE TU PERSONAJE FAVORITO" eyebrow label above the 3 character sprites
- Character sprite labels changed from `text-blue-300` to `text-blue-600` (readable on light bg)

## Neuron Canvas (`components/welcome/neuron-canvas.tsx`)

- Ambient neuron counts doubled for denser visual: desktop 60→120, tablet 35→70, mobile 15→30

## Public Navbar (`components/welcome/public-navbar.tsx`)

- Added "Historias de Éxito" → `#historias` (between Modalidades and Testimonios)
- Added "Contáctanos" → `#footer` (at the end)
- Both appear in desktop nav and mobile dropdown

## Stories Section (`components/welcome/stories-section.tsx`)

- Added `id="historias"` to root `<section>` for anchor navigation

## Footer (`components/welcome/footer.tsx`)

### Social media & contact (added)
- Contact column: phone (`tel:` link), email (`mailto:` link), location with map-pin icon
- Bottom bar: Instagram, TikTok, YouTube SVG icon links
- All social links open in `target="_blank"` with `rel="noopener noreferrer"`

### Navbar links (added)
- "Historias de Éxito" → `#historias` added to Navegación column

### Legibility improvements
- Base text color: `text-gray-400` → `text-gray-300`
- Nav links and contact text: `text-sm` → `text-base`
- Logo wrapped in `bg-white/10 rounded-xl` box (removes jarring white square on dark bg)
- Contact icons colored `text-blue-400` for contrast
- Location row uses map-pin icon for visual consistency
- Social icons: `w-5 h-5` → `w-6 h-6` with `hover:bg-white/10 rounded-full p-1.5` hover circles
- Bottom border: `border-gray-800` → `border-gray-700`; padding: `pt-6` → `pt-8`
- Copyright text: `text-sm` → `text-base text-gray-400`

## `id` anchors summary
| Section | id |
|---------|-----|
| Hero | `#hero` |
| Features | `#caracteristicas` |
| Modalities | `#modalidades` |
| Stories | `#historias` |
| Testimonials | `#testimonios` |
| Footer | `#footer` |
