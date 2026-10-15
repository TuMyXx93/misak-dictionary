# syntax=docker/dockerfile:1.10
# ============================================================
# Misak Dictionary — API (Fastify 5 + Prisma 7), multi-stage
# Base: node:24.15.0-slim (pin exacto = .node-version)
# Stages: base → deps → dev | build → deploy-deps → migrate | runner
# ============================================================

FROM node:24.15.0-slim AS base
# corepack fue removido de las imágenes node:24 recientes → pnpm directo,
# pineado a la versión de package.json (packageManager: pnpm@10.20.0)
RUN npm install -g pnpm@10.20.0
WORKDIR /app

# ─── deps: manifiestos primero (caché de capas) + Prisma Client ───
# --ignore-scripts: evita el script "prepare" (husky) del root, que
# requiere .git (excluido por .dockerignore) y rompería el build.
# Prisma Client se genera explícitamente después.
# NOTA Fase C: al añadir argon2id (módulo nativo) eliminar el flag para
# sus dependencias o añadir `pnpm rebuild argon2` (ver spec 002).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY apps/backend-service/package.json apps/backend-service/
COPY apps/backend-service/prisma ./apps/backend-service/prisma
COPY apps/backend-service/prisma.config.ts ./apps/backend-service/prisma.config.ts
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
# prisma.config.ts (Prisma 7) resuelve DATABASE_URL al cargar la config,
# incluso para generate: se provee un valor dummy de build
ARG DATABASE_URL='postgresql://build:build@localhost:5432/build'
RUN pnpm --filter @misak/backend-service prisma:generate

# ─── dev: watch mode con recarga en caliente ───
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@misak/backend-service", "dev"]

# ─── build: compila TypeScript ───
FROM deps AS build
COPY . .
RUN pnpm --filter @misak/backend-service exec tsc -p tsconfig.build.json

# ─── deploy-deps: solo dependencias de producción ───
FROM deps AS deploy-deps
COPY apps/backend-service/package.json apps/backend-service/
RUN pnpm --filter @misak/backend-service deploy --legacy --prod /deploy

# ─── migrate: one-shot de migraciones ───
FROM deps AS migrate
COPY apps/backend-service/prisma apps/backend-service/prisma
CMD ["pnpm", "--filter", "@misak/backend-service", "exec", "prisma", "migrate", "deploy"]

# ─── runner: imagen final mínima y no-root ───
FROM node:24.15.0-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nodejs
COPY --from=deploy-deps --chown=nodejs:nodejs /deploy ./
COPY --from=build --chown=nodejs:nodejs /app/apps/backend-service/dist ./dist
# prisma-client generator emite a src/generated: se copia explícitamente
# porque pnpm deploy no lo incluye (lección del Dockerfile de tumi-suite)
COPY --from=build --chown=nodejs:nodejs /app/apps/backend-service/src/generated ./src/generated
COPY --from=build --chown=nodejs:nodejs /app/apps/backend-service/prisma ./prisma
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
