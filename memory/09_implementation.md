# Lead Capture Form (Neuron Hunt → Registration)

## Overview

Converts the Neuron Hunt game completion modal into a lead capture funnel. After winning the game, users see the neuroplasticity educational text with a "Regístrate ahora" button that reveals an inline registration form (Name, Email, Phone). Submissions are saved to a `leads` table and displayed on a new admin page at `/admin/leads`.

## Database

### Lead Model (`prisma/schema.prisma`)

```prisma
model Lead {
  id        String   @id @default(uuid()) @db.Uuid
  number    Int      @unique @default(autoincrement())
  name      String
  email     String   @unique
  phone     String?
  createdAt DateTime @default(now())

  @@map("leads")
}
```

- `number` auto-increments — each lead gets a sequential ID on creation
- `email` has `@unique` constraint to prevent duplicate registrations
- `phone` is optional — the form does not require it

## Server Actions (`lib/actions/lead-actions.ts`)

- `createLead(data: { name, email, phone? })` — **public** (no auth). Server-side validation ensures `name` and `email` are non-empty. Catches Prisma `P2002` unique violation and returns `"Este correo ya está registrado."`. Calls `revalidatePath("/admin/leads")` on success to bust the admin page cache.
- `getLeads(limit = 100)` — **auth-protected**. Returns leads ordered by `number: 'desc'` (newest first) with a default limit of 100 to prevent loading thousands of rows.

## Frontend — Completion Modal (`components/welcome/hero-section.tsx`)

Three-state modal UI inside the existing Layer 4 (z-index 50):

1. **Completion text** (default) — "¡Felicidades!" header, "{score} cerebritos" earned, VIP exclusivity copy (profile evaluation, WhatsApp/email delivery), neuroplasticity message + "Reclama tu Premio" button + "Jugar de Nuevo"
2. **Registration form** — Name (required), Email (required, `type="email"`), Phone (optional, `type="tel"`, no `required` attribute). Error message display for duplicate email. Submit button with `disabled`/`cursor-not-allowed` loading state. "← Volver" link to return to educational text.
3. **Success view** — Green animated checkmark, "¡Gracias por registrarte!", "Jugar de Nuevo" button

### Key Implementation Details

- **No API route** — `createLead` server action is imported and called directly from the client component (no `fetch` needed)
- **600ms minimum submit delay** — `Promise.all` with `setTimeout` prevents flickering on fast DB responses
- **Error cleared on re-submit** — `setErrorMsg("")` at start of `handleSubmit`
- **State reset on replay** — `startGame` resets `showForm`, `formSubmitted`, and `errorMsg` so replaying shows the score, not the success message

## Admin Page (`app/admin/leads/page.tsx`)

- Server component following existing admin page pattern
- Calls `getLeads()`, renders a Tailwind-styled `<table>` with columns: #, Nombre, Email, Teléfono, Fecha
- `break-all` on email column for long addresses on mobile
- Empty state: "No hay leads registrados aún."
- Page metadata: `title: "Leads | Admin Dashboard"`

## NavBar (`components/nav-bar.tsx`)

Added `{ href: "/admin/leads", label: "Leads" }` to the navigation links array.

## Files Modified/Created

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Added `Lead` model |
| `lib/actions/lead-actions.ts` | New — `createLead`, `getLeads` |
| `components/welcome/hero-section.tsx` | Modified — inline form, server action submit, three-state modal |
| `app/admin/leads/page.tsx` | New — admin leads table |
| `components/nav-bar.tsx` | Modified — added "Leads" nav link |
