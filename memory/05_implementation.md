# Bulk Video/Photo Import for Multiple Clients

## Overview

Upload a video or photo containing multiple client forms → Gemini extracts all clients as a JSON array → preview in an editable table → batch-insert into the database.

## Files Created/Modified

| File | Action |
|------|--------|
| `app/api/analyze-clients-bulk/route.ts` | Created |
| `lib/actions/client-actions.ts` | Modified (added `bulkCreateClients`) |
| `components/bulk-import-preview.tsx` | Created |
| `components/client-table.tsx` | Modified (added bulk import button + preview modal) |

## Bulk API Route — `/api/analyze-clients-bulk`

- Separate route from the single-client `/api/analyze-client`
- Prompt asks Gemini for a JSON **array** of all clients found: `[{...}, {...}]`
- Regex parsing uses `/\[[\s\S]*\]/` for arrays, with fallback to single-object wrapped in `[data]`
- Strips markdown fences before parsing (Gemini sometimes wraps in ``` blocks)
- **File size limit**: 20 MB — returns HTTP 413 with descriptive message
- **Video processing timeout**: 60s (30 polls × 2s) — returns HTTP 422 with descriptive message
- Upload, video polling, and cleanup logic identical to the single-client route

## Server Action — `bulkCreateClients`

- Added to `lib/actions/client-actions.ts`
- Accepts `Array<{ name, hourlyRate, student?, modalidad?, grado?, celular?, correo?, direccion? }>`
- Returns `BulkCreateResult { success, created, skipped: [{ name, reason }], error? }`
- Validation: skips entries without name or with invalid hourlyRate
- Deduplication: within batch (keeps first occurrence) and against existing DB names
- Uses `prisma.$transaction()` with individual `create()` calls for atomicity

## Frontend — BulkImportPreview Component

- `components/bulk-import-preview.tsx` — modal with editable preview table
- All client fields as inline `<input>`s (or `<select>` for Modalidad)
- Red highlights on rows with empty name or invalid hourlyRate
- Row deletion via "✕" button
- "Importar Todos (N)" button disabled when any row is invalid or table is empty
- Success screen shows created count + skipped list with reasons

## Frontend — ClientTable Integration

- Green "Importación Masiva (Video/Foto)" button added next to existing blue "+ Agregar Cliente"
- Hidden `<input type="file">` triggered by the button
- Spinner animation while Gemini analyzes the file
- Dismissable red error banner for API errors (file too large, timeout, etc.)
- `<BulkImportPreview>` renders when `bulkData` state is populated
