# Prisma 7 Setup — Implementation Notes

## What Was Done

### 1. Installed dependencies
```bash
npm install prisma @prisma/client @prisma/adapter-pg dotenv
```

### 2. Fixed `schema.prisma` for Prisma 7
Prisma 7 no longer supports `url` / `directUrl` inside `schema.prisma`. Removed them:
```prisma
datasource db {
  provider = "postgresql"
}
```

### 3. Configured `prisma.config.ts`
Connection URLs now live in `prisma.config.ts`. Used `import 'dotenv/config'` to load `.env` and `env()` from `prisma/config` to read vars:
```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

> **Note:** `directUrl` is NOT a valid key in Prisma 7's `datasource` config (only `url` and `shadowDatabaseUrl` are accepted).

### 4. `.env` — use session-mode URL (port 5432) for DATABASE_URL
The transaction pooler (port 6543) causes `db push` to hang. Port 5432 (session mode) works for both CLI operations and runtime:
```
DATABASE_URL="postgresql://...@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

### 5. Fixed `prisma/seed.ts` for Prisma 7
Prisma 7 requires a driver adapter — `new PrismaClient()` with no args throws. Used `@prisma/adapter-pg`:
```ts
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

## Key Lessons

- Prisma 7 is a major breaking change: no binary engine, WASM-based, adapter-required
- `db push` / `db seed` both use `DATABASE_URL` from `prisma.config.ts` — there is no separate `directUrl` for CLI
- Supabase transaction pooler (6543) silently hangs on schema operations; always use session mode (5432) as `DATABASE_URL`
- `env()` from `prisma/config` reads from process.env; `import 'dotenv/config'` must appear before `defineConfig`
