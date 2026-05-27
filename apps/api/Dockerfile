FROM oven/bun:1.1.4-alpine AS base

WORKDIR /app

# Copy ALL workspace package.json files so bun can resolve the lockfile
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

RUN bun install --frozen-lockfile

# Copy API source and migrations
COPY apps/api/src/ ./apps/api/src/
COPY apps/api/drizzle/ ./apps/api/drizzle/
COPY apps/api/drizzle.config.ts ./apps/api/

# Work from api directory so relative paths resolve correctly
WORKDIR /app/apps/api

EXPOSE 3001
CMD ["sh", "-c", "bun run src/db/migrate.ts && bun run src/index.ts"]
