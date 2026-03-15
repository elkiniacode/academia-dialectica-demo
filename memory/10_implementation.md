# Lead Numbering & CSV Download

## Overview

Extends the Lead system with auto-incrementing sequential numbers and a CSV download feature. Each lead gets a permanent `number` assigned on creation. Admins can download leads by number range or download the full table as CSV.

## Database

### Lead Model Update (`prisma/schema.prisma`)

Added `number` field:

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

- `@default(autoincrement())` — PostgreSQL assigns sequential integers automatically
- `@unique` — ensures no duplicate numbers
- Numbers are permanent and never reassigned

## Server Action — Range Query (`lib/actions/lead-actions.ts`)

- `getLeadsByRange(from, to)` — auth-protected, fetches leads where `number >= min AND number <= max`, ordered by `number: "asc"`. Auto-swaps from/to with `Math.min/Math.max` if the user inputs them backwards.
- `getLeads` ordering changed from `createdAt: "desc"` to `number: "desc"` (newest first by number)

## CSV Download API Route (`app/api/leads/download/route.ts`)

GET endpoint with query params `?from=N&to=N`:

- Auth-protected via `getLeadsByRange` (which calls `auth()`)
- UTF-8 BOM (`\uFEFF`) prepended for correct accent display in Microsoft Excel
- Robust CSV escaping: fields containing commas, quotes, or newlines are double-quoted with `""` escape
- Returns empty CSV (header only) when no leads in range — avoids 404/popup errors
- Filename: `leads_{min}_a_{max}.csv`
- `Content-Disposition: attachment` triggers browser download without opening a new tab

## Download UI Component (`components/leads-download.tsx`)

Client component with:

- Two number inputs ("Desde" / "Hasta") with `htmlFor`/`id` accessibility labels
- Input clamping: `onChange` constrains typed values to `[1, maxNumber]` range
- "Descargar CSV" button — downloads the specified range via `window.location.href`
- "Descargar Todo" button — downloads all leads (`from=1&to=maxNumber`)
- Disabled state on range button when inputs are empty

## Admin Page Updates (`app/admin/leads/page.tsx`)

- New `#` column (right-aligned, `font-mono`) showing the lead number
- `LeadsDownload` component above the table
- `maxNumber` derived from `leads[0].number` (first element, since ordered desc) — avoids spread operator stack overflow on large arrays

## Files Created/Modified

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Added `number` field to Lead model |
| `lib/actions/lead-actions.ts` | Added `getLeadsByRange`, changed `getLeads` ordering |
| `app/api/leads/download/route.ts` | New — CSV download endpoint |
| `components/leads-download.tsx` | New — range input + download buttons |
| `app/admin/leads/page.tsx` | Modified — `#` column, download UI |
