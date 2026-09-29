# ── ABCARINO production image ───────────────────────────────────────────
# Multi-stage: install → build (standalone output) → slim runtime.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage \
    TZ=Africa/Cairo

RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app

# Next.js standalone server + static assets
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Migrations + admin/seed scripts (run with: docker compose run --rm web npm run db:setup)
COPY --from=build --chown=app:app /app/drizzle ./drizzle
COPY --from=build --chown=app:app /app/scripts ./scripts
COPY --from=build --chown=app:app /app/src/lib ./src/lib
COPY --from=build --chown=app:app /app/src/components/brand ./src/components/brand
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json tsconfig.json ./

RUN mkdir -p /app/storage /app/.next/cache && chown -R app:app /app/storage /app/.next/cache
USER app
EXPOSE 3000
VOLUME ["/app/storage"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply pending migrations, then start the server.
CMD ["sh", "-c", "node node_modules/tsx/dist/cli.mjs scripts/migrate.ts && node server.js"]
