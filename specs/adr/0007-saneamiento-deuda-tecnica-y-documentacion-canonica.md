# ADR-0007: Saneamiento Progresivo de Deuda Técnica, Unificación de Fronteras y Política de Documentación Canónica sin Ruido Histórico

- **Estado:** Aceptada
- **Fecha:** 2026-10-31
- **Autores:** sesión arquitectónica (agente architect + dirección de proyecto)

## Contexto

Tras completar diez iteraciones de desarrollo bajo Spec-Driven Development (`001` a `010`), el monorepo del Diccionario Cultural Misak cohabitaba con artefactos heredados de etapas tempranas (prototipos SQL manuales, paquetes vacíos en `packages/`, componentes React de la Semana 1 sin consumidores, utilidades experimentales de PostgreSQL 18 no integradas, casos de uso/controladores administrativos del antiguo `PalabraModelo1` y múltiples reportes históricos de sprints de 2025).

En particular:
1. En `apps/web-client/src/` coexistían dos carpetas de contextos (`src/context/` y `src/contexts/`).
2. En `apps/backend-service/src/`, `adminDictionaryRoutes.ts` mantenía endpoints CRUD de `PalabraModelo1` y duplicaba rutas de papelera que el panel administrativo real (`useAdmin.ts`) ya operaba contra `adminSentidoRoutes` (`/api/admin/dictionary/sentidos`), `adminPapeleraRoutes` (`/api/admin/papelera`) y `adminGovernanceRoutes` (`/api/admin/governance`), mientras `app.ts` registraba `adminGovernanceRoutes` por duplicado.
3. En `docs/`, `apps/web-client/docs/` y `apps/backend-service/docs/` permanecían 16 reportes históricos con referencias a tecnologías descartadas (`ElasticSearch`, `Redis`, `Jotai`, `Bcrypt`, `Spline Sans` sin armonización Namtrik) que introducían ruido severo para agentes y auditorías futuras.

## Decisión

1. **Unificación de Contextos en Frontend (`src/contexts/`)**:
   Consolidar todos los proveedores y hooks de contexto React en `apps/web-client/src/contexts/` (plural), eliminando `src/context/` y los componentes sin importadores en producción (`ScrollIndicator`, `SocialLinks`).
2. **Estrategia Conservadora de Saneamiento Backend (Opción B — Fase 3A)**:
   Retirar por completo la capa administrativa obsoleta de `PalabraModelo1` (`adminDictionaryRoutes`, `AdminDictionaryController`, `AdminDictionaryDto`, `CreateWordModel1UseCase`, `UpdateWordModel1UseCase`, `DeleteWordUseCase`, `ManageSemanticFieldsUseCase`) y dejar un único punto de montaje para `adminGovernanceRoutes` (`/api/admin/governance`) y `adminPapeleraRoutes` (`/api/admin/papelera`). Se conserva intacto `prisma/schema.prisma` sin ejecutar `DROP TABLE` sobre `palabras_modelo_1` ni `palabras_modelo_2` en esta fase previa al lanzamiento.
3. **Política de Cero Archivado Innecesario en Documentación (`docs/`)**:
   Eliminar de forma definitiva todos los reportes históricos de sprints, bitácoras de sesiones de 2025, análisis pre-merge y planes de migración de prototipos. Conservar como única fuente documental viva los 5 documentos canónicos verificados por `/docs-gate` (`README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md`, `apps/backend-service/README.md`) sincronizados con el estado real del sistema, junto con el árbol normativo SDD en `specs/` (trasladando las features cerradas `002..005` y `007..010` a `specs/archive/`).
4. **Higiene Estricta del Workspace**:
   Eliminar paquetes vacíos (`packages/*`), prototipos SQL manuales (`infrastructure/`), artefactos compilados en `prisma/` y lockfiles/`node_modules` ajenos a `pnpm` (`.kilo/`, `.opencode/{bun.lock,package-lock.json,package.json,node_modules}`, `.npmrc.bak`).

## Consecuencias

**Positivas:**
- Superficie de código y documentación 100% fiel a la arquitectura en producción antes de las fases finales de optimización y lanzamiento.
- Eliminación de rutas administrativas fantasma y montajes duplicados en Fastify, reduciendo superficie de ataque y mantenimiento de mocks en tests.
- Contexto limpio, ligero y sin contradicciones tecnológicas para agentes de IA y desarrolladores humanos.
- Cero riesgo de pérdida de datos o ruptura de migraciones en PostgreSQL gracias a la adopción de la Opción B.

**Negativas / Mitigaciones:**
- Las tablas `palabras_modelo_1`, `palabras_modelo_2` y `password_resets` permanecen temporalmente en `prisma/schema.prisma` (vacías en producción); su retiro físico mediante migración Prisma queda diferido de forma controlada para una iteración post-lanzamiento.
