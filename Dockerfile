# =============================================================================
# Stage 1: deps — install production + dev dependencies
# Isolated so the cache is reused as long as package-lock.json is unchanged.
# 12-factor II: Dependencies — declared explicitly, installed reproducibly.
# =============================================================================
FROM node:22.22.1-alpine AS deps

WORKDIR /app

# Apply all available Alpine security patches, then install runtime deps.
RUN apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
# --frozen-lockfile ensures the build is reproducible and fails fast
# if package-lock.json is out of sync with package.json.
RUN npm ci --frozen-lockfile


# =============================================================================
# Stage 2: builder — compile the Next.js application
# 12-factor V: Build, Release, Run — build stage is strictly separate.
# 12-factor III: Config — build-time PUBLIC_ vars come from build args;
#                runtime secrets are NOT present here.
# =============================================================================
FROM node:22.22.1-alpine AS builder

WORKDIR /app

# Re-use installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy source last so Docker cache invalidates only when source changes.
COPY . .

# Ensure a public/ directory exists — Next.js standalone requires it even when empty.
RUN mkdir -p public

# NEXT_PUBLIC_* vars are inlined at build time by the Next.js compiler.
# Pass them as ARGs so they are never hard-coded in the image layer.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Disable telemetry during build (12-factor XI: no side-channel noise in logs).
ENV NEXT_TELEMETRY_DISABLED=1

# next build respects output: 'standalone' in next.config.ts and produces
# a self-contained server at .next/standalone/server.js.
RUN npm run build


# =============================================================================
# Stage 3: runner — minimal production image
# 12-factor VI:  Processes — stateless, share-nothing process.
# 12-factor VII: Port binding — service exposed via PORT env var.
# 12-factor XI:  Logs — Next.js writes to stdout/stderr; no log routing here.
# =============================================================================
FROM node:22.22.1-alpine AS runner

WORKDIR /app

# Apply security patches and create a non-root user.
RUN apk upgrade --no-cache && \
    addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only the artifacts needed to run the standalone server.
# The standalone output already includes the minimal node_modules subset.
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone  ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static      ./.next/static

USER nextjs

# 12-factor III: Config — all runtime configuration via environment variables.
# Defaults here are safe, non-secret values only.
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080

# Healthcheck mirrors the one in docker-compose.yml so the image is
# self-describing when run without Compose.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# server.js is the Next.js standalone entry point.
# It honours PORT and HOSTNAME environment variables automatically.
CMD ["node", "server.js"]
