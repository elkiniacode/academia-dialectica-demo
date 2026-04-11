# Supabase + Prisma Connection: Learnings from IA Revolutions

**Date:** 2026-04-11  
**Context:** Connecting a fresh Supabase PostgreSQL database to a Prisma 7 app (Next.js 16). Multiple `db push` failures before reaching the root cause.

---

## First Approximation vs Reality

**What I assumed:** "Both `.env` URLs point to the pooler → swap `DIRECT_URL` to the direct connection → `db push` works."

**What actually happened:** A 3-layer problem, each masked by the one above it.

| Layer | Symptom | Root Cause |
|-------|---------|------------|
| Protocol | `prepared statement "s1" already exists` | Transaction pooler (PgBouncer) can't run DDL/schema operations |
| Network | `Can't reach database server at db.xxx.supabase.co:5432` | Direct connection is IPv6-only; dev machine is IPv4 |
| Tooling | TypeScript error on `directUrl` in `prisma.config.ts` | Prisma 7 supports `directUrl` at runtime but the property is missing from TypeScript type definitions |

**Resolution:** Use the **Session pooler** (port 5432, IPv4-compatible, supports prepared statements) as `DIRECT_URL` instead of the direct connection.

---

## Supabase Connection Taxonomy

| Mode | Host | Port | Prepared Statements | Schema Ops (`db push`, migrations) | IPv4 Compatible |
|------|------|------|---------------------|-------------------------------------|-----------------|
| Transaction pooler | `aws-X-region.pooler.supabase.com` | 6543 | **No** (PgBouncer limitation) | **No** | Yes |
| Session pooler | `aws-X-region.pooler.supabase.com` | 5432 | Yes | Yes | Yes |
| Direct connection | `db.PROJECT_REF.supabase.co` | 5432 | Yes | Yes | **No** (IPv6 only) |

**Key insight:** The Session pooler is the universal fallback — it works for everything and on any network. When in doubt, use it.

---

## Specification: `.env` Configuration

```env
# Transaction pooler — used by Prisma Client at runtime (queries, mutations)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session pooler — used by Prisma schema engine (db push, migrate)
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-region.pooler.supabase.com:5432/postgres"
```

## Specification: `prisma.config.ts`

```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    // @ts-expect-error — directUrl works at runtime but is missing from Prisma 7 type definitions
    directUrl: env('DIRECT_URL'),
  },
});
```

## Specification: When to Use Which URL

| Operation | URL | Reason |
|-----------|-----|--------|
| `prisma generate` | Neither | No DB connection needed |
| `prisma db push` | DIRECT_URL (session pooler) | Needs prepared statement support |
| `prisma migrate deploy` | DIRECT_URL (session pooler) | Same |
| App runtime (queries) | DATABASE_URL (transaction pooler) | Optimized for concurrent short-lived queries |

---

## Debugging Playbook: Connection Failures

When `prisma db push` or any schema operation fails:

1. **Check the error message category:**
   - `prepared statement already exists` → You're on the transaction pooler. Switch to session pooler.
   - `Can't reach database server` → Network/reachability issue. Go to step 2.
   - `Tenant or user not found` → Wrong host or credentials. Verify URL.

2. **Check network reachability:**
   - Is the host reachable? (`nslookup <host>`)
   - Is it an IPv4/IPv6 issue? **Check the Supabase dashboard** — it shows "Not IPv4 compatible" with a warning icon.
   - If direct connection is unreachable → fall back to session pooler (always IPv4-compatible).

3. **Check the Supabase dashboard before debugging code.**
   The managed service UI contains warnings that CLI errors don't surface. Prisma says "Can't reach server" — Supabase says "Not IPv4 compatible." The dashboard has the diagnosis; the terminal only has the symptom.

4. **If `directUrl` isn't honored by the schema engine:**
   Temporarily set `url: env('DIRECT_URL')` in `prisma.config.ts`, run `db push`, then revert. This is a known Prisma 7 quirk.

---

## Principles Extracted

### 1. Debug by Layer, Not by Symptom

Connection failures have a stack: **URL format → DNS → network reachability → protocol compatibility → auth**. Verify each layer independently instead of jumping from symptom to guessed cause.

### 2. The Dashboard Knows More Than the Error Message

When integrating with managed services (Supabase, Vercel, AWS), the service's own UI often contains warnings and diagnostics that the CLI error doesn't surface. Check the dashboard early.

### 3. Anchoring Bias Repeats in New Forms

Pattern observed twice in the same session:
- **Auth failure:** Assumed "we changed code → we broke auth." Actual cause: `invalid_client` (credential issue outside codebase). Fix: add `debug: true` to NextAuth.
- **DB failure:** Assumed "URL format is wrong → fix the string." Actual cause: IPv4/IPv6 network incompatibility. Fix: check Supabase dashboard.

Both times the actual problem was **environmental, not in the code.** When a tool gives a vague error, resist the urge to grep the codebase — check the environment first.

### 4. Specs Should Encode Failure Modes, Not Just Happy Paths

A connection spec that only says "put the URL in `.env`" is incomplete. A useful spec includes: which pooler mode for which operation, what breaks when you pick the wrong one, and the debugging steps when it fails. **The failures you hit are the most valuable part of any specification.**
