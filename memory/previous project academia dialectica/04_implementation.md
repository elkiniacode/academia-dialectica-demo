# Public Welcome Page + Admin Area Restructuring — Implementation Notes

## What Was Built

Transformed the app from an internal-only tool into a two-part system:
1. **Public welcome page** (`/`) — hero, testimonials, stories; no auth required
2. **Admin area** (`/admin/*`) — all existing features moved here, protected by proxy middleware

---

## Database Schema Changes

Added two new models to `prisma/schema.prisma`:

```prisma
model Testimonial {
  id         String   @id @default(uuid()) @db.Uuid
  clientName String
  content    String
  rating     Int?       // optional 1–5
  visible    Boolean  @default(true)
  createdAt  DateTime @default(now())
  @@map("testimonials")
}

model Story {
  id        String   @id @default(uuid()) @db.Uuid
  title     String
  content   String
  imageUrl  String?
  visible   Boolean  @default(true)
  createdAt DateTime @default(now())
  @@map("stories")
}
```

Applied with: `npx prisma db push && npx prisma generate`

---

## Route Restructuring

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/` | `/` | Rewritten — now public welcome page |
| `/balance` | `/admin/balance` | Moved; `/balance` redirects permanently |
| `/clients` | `/admin/clients` | Moved; `/clients` redirects permanently |
| _(new)_ | `/login` | Admin sign-in page |
| _(new)_ | `/admin/testimonials` | Testimonials CRUD |
| _(new)_ | `/admin/stories` | Stories CRUD |

Redirects added in `next.config.ts` under `redirects()`.

---

## Proxy (Middleware) — Next.js 16

**Important:** Next.js 16 deprecated `middleware.ts` — use `proxy.ts` instead, and export a `proxy` function (not `middleware`).

**File:** `proxy.ts` (project root)
```ts
export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};
```

**Auth callback added** in `lib/auth.ts`:
```ts
pages: { signIn: "/login" },
callbacks: {
  async authorized({ auth, request }) {
    const isAdmin = request.nextUrl.pathname.startsWith("/admin");
    if (isAdmin && !auth) {
      return Response.redirect(new URL("/login", request.url));
    }
    return true;
  },
  // ...existing jwt and session callbacks
}
```

---

## Files Created

### Proxy & Auth
| File | Notes |
|------|-------|
| `proxy.ts` | Route protection for `/admin/*`; Next.js 16 uses `proxy.ts` not `middleware.ts` |
| `lib/auth.ts` | Added `authorized` callback and `pages.signIn: "/login"` |

### Login Page
| File | Notes |
|------|-------|
| `app/login/page.tsx` | Google sign-in form; redirects authenticated users to `/admin/balance` |

### Admin Area
| File | Notes |
|------|-------|
| `app/admin/layout.tsx` | Renders `<NavBar />` for all admin pages |
| `app/admin/balance/page.tsx` | Copied from `app/balance/page.tsx`, manual auth redirect removed |
| `app/admin/clients/page.tsx` | Copied from `app/clients/page.tsx`, manual auth redirect removed |
| `app/admin/testimonials/page.tsx` | Fetches all testimonials, renders `TestimonialTable` |
| `app/admin/stories/page.tsx` | Fetches all stories, renders `StoryTable` |

### Public Welcome Page
| File | Notes |
|------|-------|
| `app/page.tsx` | Server component; fetches visible testimonials + stories, renders 3 sections |
| `components/welcome/hero-section.tsx` | Gradient hero, headline, CTA link to `/login` |
| `components/welcome/testimonials-section.tsx` | Responsive card grid with star ratings |
| `components/welcome/stories-section.tsx` | Responsive card grid with optional images |
| `components/welcome/footer.tsx` | Simple footer with copyright |

### Server Actions
| File | Notes |
|------|-------|
| `lib/actions/testimonial-actions.ts` | getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, toggleTestimonialVisibility |
| `lib/actions/story-actions.ts` | getStories, createStory, updateStory, deleteStory, toggleStoryVisibility |

### Admin Components
| File | Notes |
|------|-------|
| `components/testimonial-table.tsx` | Table with visibility toggle, edit/delete, opens `TestimonialForm` |
| `components/testimonial-form.tsx` | Modal: clientName, content (textarea), rating (1-5 optional) |
| `components/story-table.tsx` | Table with visibility toggle, edit/delete, opens `StoryForm` |
| `components/story-form.tsx` | Modal: title, content (textarea), imageUrl (optional) |

### Modified Files
| File | Change |
|------|--------|
| `app/layout.tsx` | Removed `<NavBar />` (now in admin layout); updated metadata title |
| `components/nav-bar.tsx` | Links updated to `/admin/*`; added Testimonios and Historias links |
| `next.config.ts` | Added `redirects()` for `/balance` and `/clients` |
| `prisma/schema.prisma` | Added Testimonial and Story models |

### Deleted
- `app/balance/` directory
- `app/clients/` directory

---

## Key Lessons

- **Next.js 16 proxy**: File must be `proxy.ts` (not `middleware.ts`) and export `proxy` (not `middleware`). The build will fail with `Proxy is missing expected function export name` if the export name is wrong.
- **Layout nesting for NavBar**: Remove NavBar from root layout; add it only in `app/admin/layout.tsx` so public pages render without admin chrome.
- **`revalidatePath("/")`** in server actions ensures public welcome page reflects visibility changes immediately.
- **`visible` flag**: Testimonials and stories have a `visible` boolean. The public page filters `where: { visible: true }`; admin pages show all records with a toggle button.
- **No manual auth redirects needed** in admin pages — `proxy.ts` handles all unauthenticated access to `/admin/*`.
