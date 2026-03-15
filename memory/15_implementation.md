# Security Hardening v2 — API Route Authorization & Telegram Fail-Fast (March 2026)

## Vulnerability 1: Missing ADMIN Role Check on API Routes

Three API routes only checked `if (!session)` but did not verify `session.role === "ADMIN"`, allowing any authenticated CLIENT user to call them directly.

### Routes Fixed

| Route | Risk Before Fix |
|-------|----------------|
| `/api/chat` | CLIENT could query ALL client business data (names, rates, sessions, balances) via AI chatbot |
| `/api/analyze-client` | CLIENT could invoke Gemini API calls at admin's expense |
| `/api/analyze-clients-bulk` | CLIENT could invoke bulk Gemini analysis at admin's expense |

### Changes

All three routes now use the same pattern as the 12+ server actions and `/api/leads/download`:

```typescript
if (!session || session.role !== "ADMIN") {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

- `app/api/chat/route.ts` — added `NextResponse` import + role check + clean JSON error (was returning raw `Response` string)
- `app/api/analyze-client/route.ts` — added `|| session.role !== "ADMIN"` to existing check
- `app/api/analyze-clients-bulk/route.ts` — added `|| session.role !== "ADMIN"` to existing check

---

## Vulnerability 2: Telegram Webhook Optional Authentication

The Telegram webhook at `/api/telegram/webhook` had conditional security guards — if `TELEGRAM_WEBHOOK_SECRET` or `TELEGRAM_ALLOWED_USER_ID` env vars were missing, the checks were silently skipped ("fail open"), allowing anyone to POST crafted messages and upsert arbitrary client records.

### Changes — Fail-Fast Approach

**File:** `app/api/telegram/webhook/route.ts`

Module-level guards (outside the handler) now crash the server on startup if env vars are missing or malformed:

```typescript
if (!process.env.TELEGRAM_ALLOWED_USER_ID) {
  throw new Error("TELEGRAM_ALLOWED_USER_ID is missing from .env!");
}
if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
  throw new Error("TELEGRAM_WEBHOOK_SECRET is missing from .env!");
}

const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_ALLOWED_USER_ID);
if (isNaN(ALLOWED_USER_ID)) {
  throw new Error("TELEGRAM_ALLOWED_USER_ID must be a valid number!");
}
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
```

Inside the handler, both guards are now unconditional (no more `if (WEBHOOK_SECRET)` / `if (ALLOWED_USER_ID)` wrappers):

- Secret header check always runs — returns 403 on mismatch
- User ID check always runs — rejects messages from non-allowed users

---

## Files Modified

- `app/api/chat/route.ts` — ADMIN role check + NextResponse.json
- `app/api/analyze-client/route.ts` — ADMIN role check
- `app/api/analyze-clients-bulk/route.ts` — ADMIN role check
- `app/api/telegram/webhook/route.ts` — fail-fast env validation + unconditional guards
