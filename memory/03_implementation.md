# AI Photo/Video → Auto-fill Client Form

## What Was Built

Upload a photo or video of a client form → Gemini analyzes it → fields pre-fill automatically in the Add/Edit Client modal.

## Files Created / Modified

| File | Notes |
|------|-------|
| `app/api/analyze-client/route.ts` | POST endpoint. Auth-protected. Accepts multipart file, uploads to Gemini Files API, polls for video processing, returns extracted JSON, deletes uploaded file. Has try-catch around both upload and generateContent calls, returning 502 JSON errors instead of crashing. |
| `components/client-form.tsx` | Added "Autocompletar con IA" section at top of modal. File input (hidden, triggered by label). Fields converted from uncontrolled (`defaultValue`) to controlled (`value` + `useState`). AI response merges into existing values (preserves manual edits). Client-side catch logs actual error message for debugging. |

## Technical Details

- **Model**: `gemini-2.5-flash` (was `gemini-2.0-flash-lite`, discontinued for new projects as of March 2026; `gemini-2.0-flash` also discontinued)
- **SDK**: `@google/genai` (new Google AI SDK)
- **Supported formats**: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM
- **Video flow**: upload → poll state until `ACTIVE` (max 30 attempts × 2s) → generate → delete file
- **Image flow**: upload → generate → delete file (no polling needed)
- Files are always deleted from Gemini Files API after use (in `finally` block)
- Error handling: Gemini upload and generateContent calls are wrapped in try-catch blocks returning proper JSON errors (502) instead of crashing the route

## Environment Variables

```
GEMINI_API_KEY=AIza...
```

**Important:** The API key must be created through Google Cloud Console (APIs & Services → Credentials → API Key) with the Gemini API enabled on the project, and the project must have billing linked. Keys from AI Studio free tier have very low quotas (can hit `limit: 0`).

## Packages Added

```
@google/genai
@anthropic-ai/sdk  (installed but not used for this feature)
```

## Key Lessons

- `@google/genai` Files API accepts `Blob` directly — no need to write to disk
- Videos need polling: check `file.state` until `"ACTIVE"` before generating
- Converting uncontrolled inputs to controlled requires replacing `defaultValue` with `value` + onChange handler
- Gemini Files API requires cleanup — always delete after use to avoid hitting storage limits
- `gemini-2.0-flash-lite` and `gemini-2.0-flash` are discontinued for new Google Cloud projects — use `gemini-2.5-flash` or newer
- AI Studio free tier API keys share quota across all keys in the same project — creating a new key doesn't reset quota
- Google Cloud billing account ≠ AI Studio billing — must enable Gemini API in Cloud Console and create key there to use Cloud credits
