# AI Photo → Auto-fill Client Form

## What Was Built

Upload a photo of a client form → Claude vision analyzes it → fields pre-fill automatically in the Add/Edit Client modal.

## Files Created / Modified

| File | Notes |
|------|-------|
| `app/api/analyze-client/route.ts` | POST endpoint. Auth-protected. Accepts multipart image file, sends as base64 to Claude vision API, returns extracted JSON. |
| `components/client-form.tsx` | Added "Autocompletar con IA" section at top of modal. File input (hidden, triggered by label). Fields converted from uncontrolled (`defaultValue`) to controlled (`value` + `useState`). AI response merges into existing values (preserves manual edits). Client-side catch logs actual error message for debugging. |

## Technical Details

- **Model**: `claude-sonnet-4-20250514` (was Gemini, switched to Claude in March 2026)
- **SDK**: `@anthropic-ai/sdk`
- **Supported formats**: JPG, PNG, GIF, WEBP (images only — Claude does not support video)
- **Image flow**: read file → convert to base64 → send in messages API with `type: "image"` source → parse JSON response
- Error handling: Claude API call wrapped in try-catch returning proper JSON error (502) instead of crashing the route

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Packages Used

```
@anthropic-ai/sdk
```

## Key Lessons

- Claude vision accepts base64 images directly in the messages API — no file upload/polling needed
- Claude does not support video input — only images (JPEG, PNG, GIF, WebP)
- Converting uncontrolled inputs to controlled requires replacing `defaultValue` with `value` + onChange handler
