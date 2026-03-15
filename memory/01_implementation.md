# Next.js Monthly Balance App — Implementation Notes

## What Was Built

A full Next.js 16 App Router web application on top of the existing `lib/` + `prisma/` library. The app replaces a Google Sheets workflow: at the end of each month, the user generates a balance from Google Calendar events, which is stored permanently and can be reviewed anytime.

---

## New Dependencies Installed

```bash
npm install next react react-dom next-auth@beta tailwindcss @tailwindcss/postcss postcss
npm install -D typescript @types/react @types/node
```

> `next-auth@5` does not exist as a stable release — use `next-auth@beta` (installs v5.0.0-beta.x)

---

## Database Schema Changes

Added two models to `prisma/schema.prisma` (existing `Client` and `Session` models kept intact):

```prisma
model MonthlyBalance {
  id        String         @id @default(uuid()) @db.Uuid
  year      Int
  month     Int            // 1–12
  status    String         @default("generated")
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  entries   BalanceEntry[]

  @@unique([year, month])
  @@map("monthly_balances")
}

model BalanceEntry {
  id             String         @id @default(uuid()) @db.Uuid
  balanceId      String         @db.Uuid
  balance        MonthlyBalance @relation(fields: [balanceId], references: [id], onDelete: Cascade)
  clientId       String         @db.Uuid
  client         Client         @relation(fields: [clientId], references: [id])
  clientName     String         // Denormalized snapshot (stable across client renames)
  individualCost Float          // Rate snapshot at generation time
  classCount     Int
  totalCost      Float          // individualCost × classCount

  @@unique([balanceId, clientId])
  @@map("balance_entries")
}
```

Also added `balanceEntries BalanceEntry[]` relation to the `Client` model.

Applied with: `npx prisma db push && npx prisma generate`

---

## Files Created

### Config
| File | Notes |
|------|-------|
| `tsconfig.json` | `@/*` alias → project root; Next.js auto-updates `jsx` and `include` on first build |
| `next.config.ts` | `serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"]` — required for Prisma 7 WASM in Next.js |
| `postcss.config.mjs` | Tailwind v4 uses `@tailwindcss/postcss` plugin, not the old `tailwindcss` plugin |

### Prisma & Auth
| File | Notes |
|------|-------|
| `lib/prisma.ts` | Shared Prisma 7 client. Uses `PrismaPg` adapter. Cached on `globalThis` for HMR safety. This resolves the pre-existing `@/lib/prisma` import in `sync-sessions.ts`. |
| `lib/auth.ts` | NextAuth v5 with Google provider. Requests `calendar.readonly` scope. Persists `accessToken` in JWT → session via callbacks. |
| `types/next-auth.d.ts` | Augments `Session` with `accessToken: string` and `JWT` with token fields. |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth v5 route handler. |

### Server Actions
| File | Notes |
|------|-------|
| `lib/actions/generate-balance.ts` | Core logic: auth check → `getClassSessions()` → aggregate by client name → DB lookup → delete old balance → create `MonthlyBalance` + `BalanceEntry[]`. Regeneration is safe (deletes + recreates). |
| `lib/actions/fetch-balance.ts` | `fetchMonthlyBalance(year, month)` and `getAvailableBalances()`. Returns serializable plain objects (dates as ISO strings). |

### App Shell
| File | Notes |
|------|-------|
| `app/globals.css` | `@import "tailwindcss"` — Tailwind v4 syntax |
| `app/layout.tsx` | Root layout wrapping children in `<SessionProvider>` |
| `app/page.tsx` | Shows sign-in button when unauthenticated; redirects to `/balance?year=&month=` when signed in |
| `app/balance/page.tsx` | Server component. Reads `?year` and `?month` search params. Fetches balance + available months in parallel. Renders tabs + table or empty state. |

### Components
| File | Notes |
|------|-------|
| `components/month-tabs.tsx` | Client component. 12 month tabs + year `←/→` navigation. Active month = blue, months with balances = green. |
| `components/balance-table.tsx` | Renders the spreadsheet-style table: No., Nombre, Costo Individual, No. de Clases, Dinero Total. Footer with grand total. COP formatting via `Intl.NumberFormat("es-CO")`. |
| `components/generate-button.tsx` | Client component. Calls `generateMonthlyBalance` server action. Shows loading state, error, and skipped clients warning. Calls `router.refresh()` on success to re-fetch server data. |

---

## Environment Variables Required

```
DATABASE_URL="...supabase.com:5432/postgres"   # Must be port 5432 (session mode)
DIRECT_URL="...supabase.com:5432/postgres"
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
AUTH_SECRET="<random base64 string>"            # NextAuth v5 uses AUTH_SECRET (not NEXTAUTH_SECRET)
NEXTAUTH_URL="http://localhost:3000"
```

> **Critical:** NextAuth v5 reads `AUTH_SECRET`, not `NEXTAUTH_SECRET`. The app will throw `MissingSecret` if only `NEXTAUTH_SECRET` is set.

---

## Architecture Decision

Balance generation reuses `getClassSessions()` from `lib/google-calendar.ts` but does NOT use `syncSessionsToDatabase()`. Calendar events are aggregated in memory by client name (class count), then written directly to `MonthlyBalance` + `BalanceEntry`. The `Session` table remains a separate concern for detailed event logs.

---

## Key Lessons

- `next-auth@beta` is the correct install tag for NextAuth v5
- NextAuth v5 env var is `AUTH_SECRET` (not `NEXTAUTH_SECRET`)
- Prisma 7 + Next.js requires `serverExternalPackages` in `next.config.ts`
- Tailwind v4 uses `@import "tailwindcss"` in CSS and `@tailwindcss/postcss` in postcss config
- `seed.ts` needs a type cast (`as Record<string, string>[]`) on `parse()` output under strict TypeScript
- `searchParams` in Next.js 15+ App Router is a `Promise` — must be `await`ed
