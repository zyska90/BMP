FROM oven/bun:1.1.4-alpine AS base

# --- Install stage: run from monorepo root so workspace lockfile resolves ---
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/

RUN bun install --frozen-lockfile

# --- Source stage: copy only what the API needs ---
COPY apps/api/src/ ./apps/api/src/
COPY apps/api/drizzle/ ./apps/api/drizzle/
COPY apps/api/drizzle.config.ts ./apps/api/

# Work from api directory so relative paths (./drizzle, ./src) resolve correctly
WORKDIR /app/apps/api

EXPOSE 3001
# Run migrations then start server
CMD ["sh", "-c", "bun run src/db/migrate.ts && bun run src/index.ts"]
