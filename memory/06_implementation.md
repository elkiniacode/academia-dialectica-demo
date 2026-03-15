# Floating AI Chatbot Assistant

## Overview

A floating chat bubble on all `/admin/*` pages that lets the user ask natural-language questions about their tutoring clients. The chatbot queries all client data from PostgreSQL via Prisma, injects it as context into a system prompt, and streams the response from one of three selectable AI providers.

## Architecture

### Vercel AI SDK (v4)

Uses `ai@^4` with matching provider packages. **Important:** The SDK was intentionally pinned to v4 — v6 (`ai@6`) has a completely redesigned API (`DefaultChatTransport`, `UIMessageStream`, etc.) that is incompatible with the simple `useChat({ api, body })` pattern used here.

- `streamText()` + `result.toDataStreamResponse()` on the server
- `useChat` from `ai/react` on the client (v4 subpath export)
- Provider packages: `@ai-sdk/anthropic@^1`, `@ai-sdk/openai@^1`, `@ai-sdk/google@^1`

Note: `@ai-sdk/react@^3` remains in package.json from a prior install attempt but is **not used** — v4's `useChat` comes from `ai/react`.

### Provider Switching

Users can switch between three AI providers via a dropdown in the chat header. Chat history is preserved when switching.

| Provider | Model | Env Var |
|----------|-------|---------|
| Claude | `claude-sonnet-4-20250514` | `ANTHROPIC_API_KEY` |
| OpenAI | `gpt-4o-mini` | `OPENAI_API_KEY` |
| Gemini | `gemini-2.5-flash` | `GEMINI_API_KEY` |

The Gemini provider uses `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! })` to reuse the existing env var (the default `@ai-sdk/google` reads `GOOGLE_GENERATIVE_AI_API_KEY` instead).

### Anti-Hallucination Guardrail

The system prompt includes a strict instruction:

> "Responde ÚNICAMENTE basándote en el JSON proporcionado. Si la respuesta no está en los datos, di exactamente: 'No tengo esa información en la base de datos'. No inventes nombres, precios ni fechas."

## Files

### `app/api/chat/route.ts` — Chat API Route

- **Auth**: Checks session via `auth()`, returns 401 if unauthenticated
- **Data**: `prisma.client.findMany()` with last 10 sessions and counts per client
- **System prompt**: Spanish-language prompt with serialized client JSON and anti-hallucination guardrail
- **Streaming**: `streamText()` → `result.toDataStreamResponse()`
- **Input**: Receives `{ messages, provider }` — `provider` sent via `body` option in `useChat`

### `components/chat-bubble.tsx` — Floating Chat UI

- `'use client'` component using `useChat` from `ai/react`
- **Collapsed**: Blue circular button (56×56px) fixed at `bottom-6 right-6 z-50`
- **Expanded**: `w-[calc(100vw-2rem)] sm:w-96 h-[500px]` panel with:
  - Blue header: "Asistente IA" title, provider `<select>` dropdown, close button
  - Scrollable message area with auto-scroll (user messages blue/right, assistant gray/left)
  - Error banner (red) with context-aware messages: session expired, invalid API key, or generic retry
  - Input form with send button and loading spinner
- `error` from `useChat` is displayed inline in the message area, not as a toast or alert

### `app/admin/layout.tsx` — Layout Integration

`<ChatBubble />` rendered after `{children}` — appears on all admin pages.

## Dependencies

```
ai@^4.3.19
@ai-sdk/anthropic@^1.2.12
@ai-sdk/openai@^1.3.24
@ai-sdk/google@^1.2.22
```

## Environment Variables Required

- `ANTHROPIC_API_KEY` — for Claude
- `OPENAI_API_KEY` — for OpenAI
- `GEMINI_API_KEY` — already existed, reused via custom `createGoogleGenerativeAI` config
