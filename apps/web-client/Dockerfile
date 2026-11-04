# syntax=docker/dockerfile:1.10
# ============================================================
# Diccionario Misak — Web (React 19 + Vite 7 + PWA), multi-stage
# Dev: vite dev server · Prod: Nginx Alpine sirviendo estáticos
# ============================================================

FROM node:24.15.0-slim AS base
# corepack fue removido de las imágenes node:24 recientes → pnpm directo,
# pineado a la versión de package.json (packageManager: pnpm@10.20.0)
RUN npm install -g pnpm@10.20.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY apps/web-client/package.json apps/web-client/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["pnpm", "--filter", "web-client", "dev", "--", "--host"]

FROM deps AS build
COPY . .
# Mismo origen en producción (rutas relativas /api/* y /auth/* vía proxy Nginx)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter web-client build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/apps/web-client/dist /usr/share/nginx/html
COPY apps/web-client/nginx.conf /etc/nginx/conf.d/misak.conf
RUN rm -f /etc/nginx/conf.d/default.conf
USER nginx
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
