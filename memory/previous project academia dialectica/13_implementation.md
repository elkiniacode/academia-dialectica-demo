# Security Hardening (March 2026)

## .gitignore

Created `.gitignore` to prevent committing secrets and build artifacts: `.env`, `node_modules/`, `.next/`, `*.tsbuildinfo`, etc.

## Telegram Webhook Secret Verification

- Added `TELEGRAM_WEBHOOK_SECRET` env var support in `app/api/telegram/webhook/route.ts`
- Checks `X-Telegram-Bot-Api-Secret-Token` header against the secret; returns 403 on mismatch
- To activate, register webhook with: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>&secret_token=<SECRET>`
- Env var required: `TELEGRAM_WEBHOOK_SECRET`

## Security Headers

Added in `next.config.ts` via `headers()` on all routes:
- `X-Frame-Options: DENY` (clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Password Validation Strengthened

Updated `lib/password.ts`:
- Expanded weak password blocklist from 5 to 20 common entries
- Rejects all-same-character passwords (e.g., `aaaaaaaa`)
- Requires at least one letter and one number (supports Spanish accented chars)

## Server-Side Email Validation

Added regex validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) in `lib/actions/lead-actions.ts` for the `createLead` action, preventing malformed emails that pass HTML5 client-side validation.

## Date Validation

Added `isNaN(dateObj.getTime())` checks in:
- `lib/actions/exam-actions.ts` — `createExam` and `updateExam`
- `lib/actions/progress-note-actions.ts` — `createProgressNote` and `updateProgressNote`

Prevents `Invalid Date` objects from reaching the database.

## PII Redaction in Chat API

Updated `app/api/chat/route.ts` to strip sensitive fields (`celular`, `direccion`, `correo`, `password`, `username`) from client data before sending to third-party AI providers (Claude, OpenAI).

## CSV Download Auth Check

Added direct ADMIN role check in `app/api/leads/download/route.ts` as defense-in-depth (in addition to `getLeadsByRange` internal auth check). Returns 401 for unauthenticated/non-admin requests.
