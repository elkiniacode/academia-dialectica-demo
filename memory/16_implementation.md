# 16 — AI Chatbot Tool Calling Upgrade

## Summary

Upgraded the AI chatbot from static data injection (dumping all client JSON into the system prompt) to **true tool calling** using Vercel AI SDK v4's `tools` parameter. Data is now fetched on demand only when the AI needs it to answer a question.

## What Changed

### `app/api/chat/route.ts` — Full rewrite

**Removed:**
- Upfront `prisma.client.findMany` that loaded all clients + sessions on every request
- PII redaction of the bulk client dump
- System prompt with embedded `JSON.stringify(redactedClients)`

**Added:**
- Imports: `tool` from `ai`, `z` from `zod`, all dashboard/balance server actions
- 7 tool definitions using `tool()` + Zod schemas:
  - `obtener_clientes` — fetches clients list with PII redaction (uses Prisma directly)
  - `obtener_kpis_mensuales(year)` — calls `getDashboardKPIs()` for monthly revenue, hours, classes, averages
  - `obtener_matriz_ingresos_clientes(year)` — calls `getClientRevenueMatrix()` for per-client revenue ranking
  - `obtener_crecimiento_clientes(year)` — calls `getClientGrowthData()` for new/active clients per month
  - `obtener_comparacion_anual()` — calls `getYearComparisonData()` for multi-year comparison
  - `obtener_balance_mensual(year, month)` — calls `fetchMonthlyBalance()` for detailed monthly breakdown
  - `obtener_periodos_disponibles()` — calls `getAvailableBalances()` for available year/month pairs
- `maxSteps: 5` in `streamText()` for multi-round tool chaining
- Lightweight system prompt with today's date (for relative time resolution), tool usage instructions, and COP formatting rules

**Preserved:**
- ADMIN role check at top of `POST` handler (security hardening v2)
- Three-provider switching (Claude, OpenAI, Gemini)
- `toDataStreamResponse()` streaming

### `components/chat-bubble.tsx` — 3 small changes

- `maxSteps: 5` on `useChat` — enables client-side multi-step tool calling round-trips
- Message filter: `messages.filter((m) => m.content.trim() !== "")` — hides empty tool-call intermediate messages
- Placeholder text updated: "Pregúntame sobre tus clientes o finanzas..."

### Dependencies

- `zod` added as direct dependency (was transitive via `ai` SDK)

## Architecture

```
User asks "¿Cuánto gané en febrero?"
  → useChat sends to /api/chat
    → streamText with tools
      → AI decides to call obtener_balance_mensual({ year: 2026, month: 2 })
        → execute calls fetchMonthlyBalance(2026, 2) — existing server action
      → AI receives tool result, formats answer in Spanish
    → Streams response back
  → Chat bubble renders answer (tool-call messages filtered out)
```

Tools reuse the exact same server actions the admin dashboard uses. No new data layer was created. Server actions have internal `auth()` ADMIN checks (defense in depth — redundant since the route already checks).

## System Prompt

```
Eres el asistente administrativo de Academia Dialéctica...
Hoy es YYYY-MM-DD.
DEBES usar tus herramientas para obtener los datos reales antes de responder.
Nunca adivines cifras financieras.
```

Key design decisions:
- Today's date included so AI resolves "este mes" / "el mes pasado" correctly
- COP formatting with thousand separators
- "Cada clase dura 2 horas" hint for hours→classes conversion
- Anti-hallucination: must use tools, never guess numbers

## Security

- ADMIN role guard preserved at route entry
- PII redaction on `obtener_clientes` (celular, direccion, correo, password, username stripped before sending to AI providers)
- All called server actions have internal RBAC checks (defense in depth)

## Files Modified

- `app/api/chat/route.ts` — rewritten with tool calling
- `components/chat-bubble.tsx` — maxSteps + message filtering
- `package.json` — zod added as direct dependency
