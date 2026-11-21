# ADR-0007: Saneamiento Progresivo de Deuda Técnica, Alineación Docker/PWA y Política de Documentación Canónica sin Ruido Histórico

- **Estado:** Aceptada (actualizada para alcance `Spec 011 v1.2.0`)
- **Fecha:** 2026-11-11
- **Autores:** sesión arquitectónica (agente architect + dirección de proyecto)

## Contexto

Tras completar diez iteraciones de desarrollo bajo Spec-Driven Development (`001` a `010`), el monorepo del Diccionario Misak cohabitaba con artefactos heredados de etapas tempranas (prototipos SQL en `infrastructure/`, prototipos HTML estáticos en `apps/prototypes/`, paquetes vacíos en `packages/`, componentes React de la Semana 1 sin consumidores, utilidades experimentales de PostgreSQL 18 no integradas, casos de uso/controladores administrativos del antiguo `PalabraModelo1`, dependencias y variables de entorno muertas, iconos/manifiesto PWA con la paleta verde descartada `#38e07b` y múltiples reportes históricos de sprints de 2025).

Adicionalmente, la auditoría integral detectó:
1. Coexistencia de dos directorios de contextos en `apps/web-client/src/` (`src/context/` y `src/contexts/`).
2. Duplicidad y obsolescencia administrativa en `apps/backend-service/src/` (`adminDictionaryRoutes.ts` sobre `PalabraModelo1` y doble montaje de `adminGovernanceRoutes`).
3. Desajustes operativos en la capa de despliegue Docker de producción (`VITE_API_URL=/api` + `proxy_pass http://api:3000/;` con recorte de prefijo en `nginx.conf`, ausencia de `location /auth/` y `client_max_body_size`, y ausencia de volumen `media_data` compatible con `read_only: true`), junto con la falta de documentación técnica de contenedores.
4. Desalineación severa entre el código real y los 5 documentos canónicos verificados por `/docs-gate` (enlaces rotos, narrativa de `Weeks/Sprints`, tecnologías descartadas como `ElasticSearch`, `Redis`, `Cloudinary`, `Jotai`, `Storybook`, paleta cromática antigua y uso inconsistente del nombre `"Diccionario Cultural Misak"` en lugar de **"Diccionario Misak"**).

## Decisión

1. **Unificación de Contextos (`src/contexts/`) y Alineación Cromática/PWA en Frontend**:
   Consolidar todos los contextos de React en `apps/web-client/src/contexts/`, eliminar componentes sin consumidores (`ScrollIndicator`, `SocialLinks`), sincronizar el manifiesto Workbox/PWA y los iconos binarios de `public/` con el Sistema Cromático Oficial Misak (`#e52d6d`, `#0055aa`, `#ffffff`, `#000000`) y retirar reglas de caché huérfanas (`res.cloudinary.com`).
2. **Estrategia Conservadora de Saneamiento Backend (Opción B — Fase 3A + Higiene de Paquete)**:
   Retirar por completo la capa administrativa obsoleta de `PalabraModelo1`, unificar `adminGovernanceRoutes` en `/api/admin/governance` y `adminPapeleraRoutes` en `/api/admin/papelera`, y podar dependencias (`@fastify/auth`, `@fastify/jwt`, `@fastify/static`) y variables de entorno muertas (`CLOUDINARY_*`, `SMTP_*`, `TWILIO_*`, `REDIS_*`, `BCRYPT_ROUNDS`), **conservando intacto `prisma/schema.prisma` sin ejecutar `DROP TABLE`** en esta iteración (diferiendo la purga física de las 5 tablas legadas y la optimización de queries residuales en `PalabraRepository` a `Spec 012`).
3. **Eliminación Total de Prototipos y Residuos del Workspace**:
   Eliminar `apps/prototypes/`, `infrastructure/`, `packages/`, `.kilo/`, `.npmrc.bak`, artefactos compilados en `prisma/` y lockfiles ajenos a `pnpm` dentro de `.opencode/`, dejando `apps/` únicamente con `web-client` y `backend-service`.
4. **Alineación Operativa y Documental de Docker**:
   Unificar el contrato de proxy en `nginx.conf` y `compose.prod.yml` bajo mismo origen relativo (`VITE_API_URL=""`, preservación de `/api/` y `/auth/`, soporte de subidas de 100 MB y streaming `HTTP 206`), añadir el volumen `media_data` para `uploads/media` y documentar formalmente la arquitectura Docker multi-stage y su hardening.
5. **Política de Cero Archivado Innecesario y Unificación Institucional de Marca ("Diccionario Misak")**:
   Eliminar definitivamente los 16 reportes históricos de `docs/` y `apps/*/docs/`, reescribir de forma profesional y fiel al código los 5 documentos canónicos activos (`README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md`, `apps/backend-service/README.md`), sincronizar `.opencode/agents/` → `.agents/` y `specs/steering/`, y estandarizar el nombre oficial **Diccionario Misak** (`Wamtɵrmarɵpik — Diccionario Misak`) en toda la documentación activa, metadatos y UI administrativa.
6. **Desindexación de Código Generado Prisma, Poda Quirúrgica Residual y Política de Cero Warnings en Biome CI (`Fase 5 — v1.2.0`)**:
   Desindexar `apps/backend-service/src/generated/` de Git (regenerado en CI y Docker), retirar símbolos, barrels y dependencias sin consumidores (`Role.ts`, `react-hook-form`, `@hookform/resolvers`, `zod` en `web-client`; `@types/pg` en `backend-service`), depurar cabeceras históricas de `Sprint/Phase`, estandarizar el comando `pnpm run ci` (compatible con `pnpm 10`) y exigir **0 errores y 0 warnings** en `biome ci .`.

## Consecuencias

**Positivas:**
- Correspondencia 1:1 verificable entre código fuente, infraestructura Docker, PWA y documentación canónica antes de la fase de optimización pre-lanzamiento.
- Eliminación de fallos latentes en despliegue contenerizado de producción (rutas `/api` y `/auth` tras Nginx y escritura de medios bajo `read_only: true`) y en instalación PWA (iconos PNG/ICO binarios reales con identidad cromática Misak).
- Reducción drástica del ruido cognitivo e histórico para desarrolladores y agentes IA.
- Cero riesgo de pérdida de datos o ruptura de índices parciales personalizados en PostgreSQL gracias a la Opción B.

**Negativas / Mitigaciones:**
- Las tablas `palabras_modelo_1`, `palabras_modelo_2`, `palabrasm1_microcampos`, `palabrasm2_microcampos` y `password_resets` permanecen temporalmente en `prisma/schema.prisma`; su retiro mediante migración SQL controlada (`0014`) y limpieza de lecturas residuales se ejecutará de manera aislada en `Spec 012`.
