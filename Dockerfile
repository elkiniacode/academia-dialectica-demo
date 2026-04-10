# ──────────────────────────────────────────────────────────
# Stage: base
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ──────────────────────────────────────────────────────────
# Stage: deps-dev — install ALL dependencies (inc. devDeps)
# ──────────────────────────────────────────────────────────
FROM base AS deps-dev
COPY package.json package-lock.json ./
RUN npm ci

# ──────────────────────────────────────────────────────────
# Stage: builder — build the Next.js standalone output
# ──────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL="postgresql://dummy"
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
ARG NEXT_PUBLIC_GA_ID=""
ARG NEXT_PUBLIC_GA_CONVERSION_LABEL=""
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_POSTHOG_HOST=""
RUN TELEGRAM_ALLOWED_USER_ID="0" \
    TELEGRAM_WEBHOOK_SECRET="dummy" \
    TELEGRAM_BOT_TOKEN="dummy" \
    NEXT_PUBLIC_GA_ID="${NEXT_PUBLIC_GA_ID}" \
    NEXT_PUBLIC_GA_CONVERSION_LABEL="${NEXT_PUBLIC_GA_CONVERSION_LABEL}" \
    NEXT_PUBLIC_POSTHOG_KEY="${NEXT_PUBLIC_POSTHOG_KEY}" \
    NEXT_PUBLIC_POSTHOG_HOST="${NEXT_PUBLIC_POSTHOG_HOST}" \
    npm run build

# ──────────────────────────────────────────────────────────
# Target: dev — hot-reload development server
# ──────────────────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="postgresql://dummy" npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ──────────────────────────────────────────────────────────
# Target: prod — minimal production image
# ──────────────────────────────────────────────────────────
FROM base AS prod
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Public assets
COPY --from=builder /app/public ./public

# Next.js standalone output + static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma runtime files (required by @prisma/adapter-pg at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Prisma schema (referenced at runtime by some operations)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
