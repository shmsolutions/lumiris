# syntax=docker/dockerfile:1

# ---- Base ----------------------------------------------------------------
FROM node:24-alpine AS base
# Next.js standalone output on Alpine needs the glibc compatibility shim.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies --------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder -------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public client keys are inlined into the bundle at build time, so they must
# be real values. Server secrets are read at runtime, so validation is skipped.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DISABLED=true
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SENTRY_DISABLED=$NEXT_PUBLIC_SENTRY_DISABLED
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build:next

# ---- Migrator (one-shot) -------------------------------------------------
# Small image that only applies migrations, then exits.
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY migrations ./migrations
COPY scripts/migrate.mjs ./scripts/migrate.mjs
CMD ["node", "scripts/migrate.mjs"]

# ---- Runner --------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone bundle, static assets, and public files.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
