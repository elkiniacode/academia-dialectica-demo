# 12 — Admin Client Detail Page & Academic Data UI

## Overview

Built the admin-side UI for managing per-student academic data (exams, progress notes) and reading student feedback (suggestions). Also fixed a critical login bug caused by a malformed `.env` file.

---

## Bug Fix: `.env` Formatting (Login Loop)

`ADMIN_EMAIL` had a leading space on the key name (` ADMIN_EMAIL`), making `process.env.ADMIN_EMAIL` return `undefined`. This caused the `jwt` callback in `auth.config.ts` to always throw `"Access denied"` for Google OAuth, creating an infinite redirect loop between `/login` and the protected routes.

**Also fixed:** `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` had `= "..."` spacing (space before the value) which passed the quote character as part of the value.

**Rule:** `.env` keys must have no leading/trailing spaces and values must use `KEY="value"` format (no spaces around `=`).

**If login loop recurs:** Clear the `authjs.session-token` cookie in the browser (DevTools → Application → Cookies → localhost:3000) — stale JWT cookies without `role` set will cause a 307 loop.

---

## New Route: `/admin/clients/[id]`

**File:** `app/admin/clients/[id]/page.tsx`

- Server component; requires `session.role === "ADMIN"` (defense in depth beyond middleware)
- Fetches client via `prisma.client.findUnique` with `include: { exams, progressNotes, suggestions }`
- Calls `notFound()` if client doesn't exist
- Layout: "← Volver a Clientes" back link → client info header → 2-column grid on desktop (Exams | Notes) → full-width Suggestions row

**Client info header** shows: name, student name, modalidad/grado badges, hourlyRate in COP, contact row (celular, correo, direccion).

---

## New Components

### `components/admin-exam-panel.tsx`
- `"use client"` — Props: `clientId: string`, `initialExams: Exam[]`
- Inline add form (no modal): title, score (0–10), date, commentary
- Client-side score validation: `numScore < 0 || numScore > 10` → error before startTransition
- Date sent as `new Date(date + "T00:00:00").toISOString()` to avoid timezone off-by-one
- Score color-coded in list: green ≥ 7, yellow ≥ 5, red < 5; displayed as `score.toFixed(1)`
- Actions: `createExam(clientId, data)` / `deleteExam(examId)` + `router.refresh()`

### `components/admin-progress-note-panel.tsx`
- `"use client"` — Props: `clientId: string`, `initialNotes: ProgressNote[]`
- Inline add form: content textarea, date, 6 predefined color swatches
- Color swatches: `w-7 h-7 rounded-full border-2`; selected = `border-gray-800 scale-110`
- Colors: Azul `#3b82f6`, Verde `#22c55e`, Amarillo `#eab308`, Morado `#a855f7`, Naranja `#f97316`, Rosa `#ec4899`
- Notes list: `border-l-4` with `style={{ borderLeftColor: note.color }}`
- Actions: `createProgressNote(clientId, data)` / `deleteProgressNote(noteId)` + `router.refresh()`

### `components/admin-suggestion-view.tsx`
- `"use client"` — Props: `clientId: string`, `initialSuggestions: Suggestion[]`
- Read-only list; status badge: yellow = "Sin leer", green = "Leído"
- "Marcar leído" button on unread items → `markSuggestionRead(suggestionId)` + `router.refresh()`

---

## Modified Files

### `components/client-table.tsx`
- Added `import Link from "next/link"`
- Added green "Ver" link per row → `/admin/clients/${client.id}` (before "Editar")

### `app/admin/dashboard/page.tsx`
- Added `getSuggestions()` to the `Promise.all` data fetch
- `unreadCount` computed with `.filter(s => s.status === "unread").length`
- Yellow banner rendered when `unreadCount > 0`: shows count + "Ver clientes →" link

### `lib/actions/exam-actions.ts`, `progress-note-actions.ts`, `suggestion-actions.ts`
- Changed `revalidatePath("/admin/clients")` → `revalidatePath("/admin/clients", "layout")`
- Layout-level invalidation covers `/admin/clients/[id]` pages after any mutation

---

## Key Patterns

- All three panel components use `useTransition()` + `router.refresh()` (no local state for list data — server is source of truth)
- Error display: red dismissible banner `bg-red-50 border border-red-200`
- Empty states: centered gray text in white card with shadow
- Default date in forms: `new Date().toISOString().slice(0, 10)` as `const todayISO` (module-level constant)
