# Client Management & Telegram Bot — Implementation Notes

## What Was Built

Two interfaces for managing clients directly in the PostgreSQL database, replacing the old n8n → Telegram → Google Sheets pipeline:

1. **Web CRUD page** (`/clients`) — full add/edit/delete with modal forms
2. **Telegram bot webhook** (`/api/telegram/webhook`) — quick client entry via structured messages, restricted by Telegram user ID

Also added: automatic Google OAuth token refresh in `lib/auth.ts` to fix 401 errors on Calendar API calls.

---

## Database Schema Changes

Extended the `Client` model in `prisma/schema.prisma` with new optional fields:

```prisma
model Client {
  id             String         @id @default(uuid()) @db.Uuid
  name           String         @unique
  hourlyRate     Float
  currency       String         @default("COP")   // Changed from "USD"
  student        String?        // Estudiante
  modalidad      String?        // "Presencial" or "Online"
  grado          String?        // Free text: "10", "Universidad Andes", etc.
  celular        String?        // Phone number as string
  direccion      String?        // Address
  correo         String?        // Email
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt @default(now())
  sessions       Session[]
  balanceEntries BalanceEntry[]

  @@map("clients")
}
```

Applied with: `npx prisma db push` (all new fields are nullable — no data loss).

**Note:** `updatedAt` needs `@default(now())` alongside `@updatedAt` because existing rows have no value for the column, and Prisma refuses to add a required column without a default to a table with data.

---

## Files Created

### Auth Fix
| File | Notes |
|------|-------|
| `lib/auth.ts` | Added `refreshAccessToken()` helper. JWT callback now checks token expiry (60s buffer) and refreshes via Google's token endpoint. On failure, sets `error: "RefreshAccessTokenError"` on session. |

### Server Actions
| File | Notes |
|------|-------|
| `lib/actions/client-actions.ts` | `getClients()`, `createClient(formData)`, `updateClient(id, formData)`, `deleteClient(id)`. All require auth. Delete is blocked if client has sessions or balance entries. |

### Web UI
| File | Notes |
|------|-------|
| `app/clients/page.tsx` | Server component. Auth-protected. Fetches all clients and renders `ClientTable`. |
| `components/client-table.tsx` | Client component. Table with blue header, alternating rows, COP formatting. Edit/Delete buttons per row. "Agregar Cliente" button. |
| `components/client-form.tsx` | Client component. Modal form for add/edit. Fields: Nombre (required), Costo por Hora (required), Estudiante, Modalidad (select), Grado, Celular, Correo, Direccion. Uses `useTransition`. |
| `components/nav-bar.tsx` | Client component. Shows when authenticated. Links to /balance and /clients. Sign-out button. |

### Telegram Bot
| File | Notes |
|------|-------|
| `lib/telegram.ts` | `parseClientMessage(text)` — regex parser for structured template. `sendTelegramMessage(chatId, text)` — Telegram Bot API wrapper. `buildTemplate()` — returns blank template. |
| `app/api/telegram/webhook/route.ts` | POST handler. Checks `TELEGRAM_ALLOWED_USER_ID`. On "Hola"/"/start": sends template. On structured message: parses → upserts to DB → confirms. On parse failure: sends error + template. |

### Modified Files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Extended Client model with new fields |
| `prisma/seed.ts` | Added `import 'dotenv/config'`; upserts now include Student, Grado, Cel, Correo, Direccion from CSV |
| `app/layout.tsx` | Added `<NavBar />` inside `<SessionProvider>` |
| `CLAUDE.md` | Documented auth token refresh pattern |

---

## Environment Variables Added

```
TELEGRAM_BOT_TOKEN=<from BotFather>
TELEGRAM_ALLOWED_USER_ID=<numeric Telegram user ID>
```

### Telegram Webhook Setup

After deploying to a public URL:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook
```

---

## Telegram Message Format

The bot expects this structured format (same as the old n8n bot):

```
Cliente: Kevin Peña
Estudiante: Kevin Peña
Modalidad: Presencial
Grado: Universidad Nacional
Celular: 3203357408
Direccion: Cra 50A #174B - 67 Int 2 Apto 1101
Correo: kevinpp0915@gmail.com
Costo: 100000
```

Required fields: `Cliente` and `Costo`. All others are optional.

---

## Key Lessons

- `@updatedAt` alone fails on `db push` when existing rows have no value — pair it with `@default(now())`
- `prisma/seed.ts` runs via `tsx` independently from the app — needs its own `import 'dotenv/config'` to load `.env`
- Currency default was `"USD"` but all clients use COP — changed default to `"COP"`
- Telegram webhook doesn't need NextAuth — uses `TELEGRAM_ALLOWED_USER_ID` for access control
- `grado` is `String?` not `Int?` because values include university names like "Universidad Andes"
- `celular` is `String?` not a number — phone numbers are identifiers, not arithmetic values
