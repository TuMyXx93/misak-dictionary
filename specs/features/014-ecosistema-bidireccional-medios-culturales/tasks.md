---
id: 014-ecosistema-bidireccional-medios-culturales
version: 1.0.0
status: done
---

# Tareas: 014 — Ecosistema Bidireccional de Medios Culturales

- **Spec**: [`spec.md`](file:///home/tumidev/developments/misak-dictionary/specs/features/014-ecosistema-bidireccional-medios-culturales/spec.md)
- **Plan**: [`plan.md`](file:///home/tumidev/developments/misak-dictionary/specs/features/014-ecosistema-bidireccional-medios-culturales/plan.md)

## Fase A — Dominio, Repositorio y Casos de Uso Backend

| ID | Tarea | Requisito | Estado |
| :-- | :-- | :-- | :-- |
| T-001 | Extender entidad `MedioCultural` e interfaz `IMedioCulturalRepository` con relaciones hidratadas y soporte de actualización R-010 | R-001, R-006 | completed |
| T-002 | Actualizar `PrismaMedioCulturalRepository` (`include` completo, filtro `sentidoId`/`forma.sentidoId`, búsqueda extendida `query`, reset `ratificado`→`borrador`) | R-001, R-002, R-006 | completed |
| T-003 | Actualizar `UploadMediaUseCase` para resolver `sentidoId` padre desde `formaId` cuando corresponda | R-001 | completed |
| T-004 | Crear `UpdateMediaMetadataUseCase` con validación cruzada `formaId`/`sentidoId`, reset R-010 y auditoría `MEDIA_UPDATE` | R-005, R-006 | completed |
| T-005 | Endurecer `RatifyMediaUseCase` con bloqueo de auto-ratificación (`409 SELF_RATIFICATION_FORBIDDEN`, salvo `super_admin`) | R-006 | completed |
| T-006 | Extender `AuthController`, `mediaRoutes` y `adminMediaRoutes` (cookie `misak_at`, `?download=1`, `/stream`, `catalogo-taxonomia`, `buscar-sentidos`) | R-003, R-008 | completed |
| T-007 | Agregar nivel `'medio'` en `PapeleraUseCase` y `adminPapeleraRoutes`, `mediosCount` en `ListSentidosAdminUseCase`, y precisión fraccional en `ProgresoRatificacionUseCase` | R-002, R-005, R-010 | completed |

## Fase B — Frontend Admin DAM & Gobierno

| ID | Tarea | Requisito | Estado |
| :-- | :-- | :-- | :-- |
| T-008 | Actualizar tipos y hooks en `useAdmin.ts` (`mediosCount`, nivel `medio` en papelera, hooks de actualización, catálogo taxonomía y búsqueda de sentidos, cálculo global Dashboard) | R-001..R-010 | completed |
| T-009 | Mejorar `AdminMediaUploadModal.tsx` con preview `ObjectURL`, buscador de sentidos, selector de forma/objetivo y cascada taxonómica | R-004 | completed |
| T-010 | Crear `AdminMediaEditModal.tsx` y `AdminMediaLinkExistingModal.tsx` | R-004, R-005 | completed |
| T-011 | Actualizar `AdminMediaPage.tsx`, `SentidoEditorPage.tsx`, `SentidosPage.tsx`, `RevisionPage.tsx`, `PapeleraPage.tsx`, `DashboardPage.tsx` | R-001..R-010 | completed |

## Fase C — Diccionario Público, Pruebas y Validación

| ID | Tarea | Requisito | Estado |
| :-- | :-- | :-- | :-- |
| T-012 | Actualizar `TermRow.tsx` para audios contextuales por `proposito` y galería completa de imágenes/videos | R-009 | completed |
| T-013 | Actualizar y ampliar suite Vitest en backend y frontend para cubrir todos los requisitos | R-001..R-013 | completed |
| T-014 | Ejecutar `CI=true pnpm run ci`, Vitest backend y frontend, y builds de producción | R-001..R-013 | completed |

## Fase D — Endurecimiento Túnel, Streaming Móvil, Visor y Sidebar Admin (R-011..R-015)

| ID | Tarea | Requisito | Estado |
| :-- | :-- | :-- | :-- |
| T-015 | Restringir `mediosInclude` público a `estado: 'ratificado'` sin depender de `PUBLIC_ONLY_RATIFIED` (Opción A) | R-011 | completed |
| T-016 | Soportar rangos sufijo `bytes=-N`, HTTP `416` (`RangeNotSatisfiableError`), `HEAD` seguro y caché Workbox `statuses: [200]` + `AudioPlayerContext` móvil | R-012 | completed |
| T-017 | Implementar `rateLimitPolicy.ts` por dominio/actor y política `shouldRetryQuery` sin reintentos `4xx` | R-013 | completed |
| T-018 | Corregir layout responsivo del visor modal (`CulturalMediaLightbox`, `LazyImage` `fit="contain"`, `CulturalResourceRegistry`, `index.css` `dvh` + landscape `max-height: 500px`) y miniaturas cuadradas `TermRow` (`aspect-square`, `fit="contain"`, foco exacto) | R-014 | completed |
| T-019 | Corregir layout responsivo y accesibilidad del Sidebar administrativo (`AdminLayout.tsx`, `index.css`, `matchMedia` contra `inert`, scroll interno `dvh`, tap targets `>= 48px` y tests Vitest) | R-015 | completed |
