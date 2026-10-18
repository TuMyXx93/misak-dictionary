---
id: 007-medios-escalonados
version: 0.1.0
status: pending
---

# Tareas: 007 — Medios Escalonados

- **Feature**: `007-medios-escalonados`
- **Spec**: [`specs/features/007-medios-escalonados/spec.md`](file:///home/tumidev/developments/misak-dictionary/specs/features/007-medios-escalonados/spec.md)
- **Plan**: [`specs/features/007-medios-escalonados/plan.md`](file:///home/tumidev/developments/misak-dictionary/specs/features/007-medios-escalonados/plan.md)
- **Total tareas**: 40

---

## Subfase A (PR A) — Backend: Dominio, Storage, Streaming HTTP 206 y RBAC

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| T-001 | Crear entidad de dominio `MedioCultural` con tipos, propósitos y validaciones de invariantes | R-001, R-002 | done |
| T-002 | Actualizar catálogo de permisos y roles en `permissions.ts` con `media:read`, `media:write`, `media:delete` asignados a `media_admin` y `super_admin` | R-007 | done |
| T-003 | Crear interfaz de puerto `MedioCulturalRepository` en capa de dominio | R-001, R-002 | done |
| T-004 | Crear interfaz de puerto `StorageService` en `apps/backend-service/src/shared/storage/storage.service.ts` | R-004 | done |
| T-005 | Crear validador binario `MagicByteValidator` para formatos permitidos de audio e imagen | R-005 | done |
| T-006 | Crear tests unitarios para `MagicByteValidator` con fixtures binarios reales y casos maliciosos | R-005 | done |
| T-007 | Implementar `LocalStorageService` con nombres UUIDv4 opacos, subdirectorios y streaming parcial | R-004, R-006 | done |
| T-008 | Crear tests unitarios para `LocalStorageService` cubriendo escritura, lectura con rango y borrado | R-004, R-006 | done |
| T-009 | Actualizar modelo en `apps/backend-service/prisma/schema.prisma` agregando tabla `medios_culturales` y relaciones | R-001 | done |
| T-010 | Generar y aplicar migración Prisma `0010_medios_culturales` con índices y restricciones | R-001, R-002 | done |
| T-011 | Implementar `PrismaMedioCulturalRepository` en capa de infraestructura | R-001, R-002, R-003 | done |
| T-012 | Crear tests de integración para `PrismaMedioCulturalRepository` contra PostgreSQL | R-001, R-002 | done |
| T-013 | Implementar caso de uso `UploadMediaUseCase` con validación de cuotas, magic bytes y estado inicial `borrador` | R-001, R-004, R-005, R-008 | done |
| T-014 | Crear tests unitarios para `UploadMediaUseCase` con simulación de errores y happy path | R-001, R-005, R-008 | done |
| T-015 | Implementar caso de uso `GetMediaStreamUseCase` con resolución de rangos HTTP 206 y filtro `PUBLIC_ONLY_RATIFIED` | R-002, R-004, R-006 | done |
| T-016 | Crear tests unitarios para `GetMediaStreamUseCase` verificando códigos 200, 206 y rechazos de privacidad | R-002, R-006 | done |
| T-017 | Implementar caso de uso `RatifyMediaUseCase` con actualización a `ratificado` y registro de auditoría `MEDIA_RATIFY` | R-003 | done |
| T-018 | Crear tests unitarios para `RatifyMediaUseCase` | R-003 | done |
| T-019 | Implementar casos de uso `DeleteMediaUseCase` y `ListMediaUseCase` | R-007, R-014 | done |
| T-020 | Crear tests unitarios para `DeleteMediaUseCase` y `ListMediaUseCase` | R-007, R-014 | done |
| T-021 | Registrar plugin Fastify `@fastify/multipart` en `apps/backend-service/src/app.ts` con límites seguros | R-005 | done |
| T-022 | Implementar controlador y rutas públicas de streaming `GET /api/media/:uuid/stream` y metadatos `GET /api/media/:uuid/meta` | R-002, R-006 | done |
| T-023 | Implementar controlador y rutas administrativas `/api/admin/medios` protegidas con RBAC | R-007, R-008, R-014 | done |
| T-024 | Crear tests de integración Fastify (e2e) para endpoints públicos y administrativos de medios | R-005, R-006, R-007, R-008 | done |

---

## Subfase B (PR B) — Frontend: Reproductor Accesible, Visor de Medios y Caché Offline

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| T-025 | Implementar contexto `AudioPlayerContext` (`useAudioPlayer`) con singleton nativo de audio y single-instance | R-009, R-010, R-013 | done |
| T-026 | Crear tests unitarios para `AudioPlayerContext` verificando parada automática de audios previos | R-010 | done |
| T-027 | Implementar componente `AudioPlayButton` accesible con tap target $\ge 48 \times 48$ px, estados visuales y aria-labels | R-009 | done |
| T-028 | Crear tests unitarios con React Testing Library para `AudioPlayButton` | R-009 | done |
| T-029 | Implementar componente `CulturalMediaLightbox` accesible (`role="dialog"`, focus trap, escape key y créditos culturales) | R-011 | done |
| T-030 | Crear tests unitarios para `CulturalMediaLightbox` cubriendo apertura, cierre con escape y foco | R-011 | done |
| T-031 | Integrar `AudioPlayButton` y miniatura con `LazyImage` + lightbox en `TermRow` | R-009, R-011 | done |
| T-032 | Actualizar tests de `TermRow` para verificar presencia y accesibilidad de medios culturales | R-009, R-011 | done |
| T-033 | Configurar estrategia Workbox `CacheFirst` para audios e imágenes en `apps/web-client/vite.config.ts` | R-012 | done |
| T-034 | Ejecutar build de producción y validar que el chunk principal `index-*.js` cumpla R-023 ($\le +5\%$ vs baseline de 38.9 kB) | R-013 | done |

---

## Subfase C (PR C) — Frontend: Gestión de Medios en Panel Admin y Certificación

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| T-035 | Crear componente `AdminMediaUploadModal` para carga de medios con asignación de sentidos/formas y metadatos culturales | R-014 | pending |
| T-036 | Implementar página `/admin/medios` con tabla paginada, filtros, previsualización y acciones de ratificación/borrado | R-014 | pending |
| T-037 | Integrar pestaña de medios culturales en el formulario de edición de sentidos `/admin/sentidos/:id/editar` | R-014 | pending |
| T-038 | Registrar ruta `/admin/medios` en el router del panel administrativo y agregar enlace en sidebar según permiso `media:read` | R-007, R-014 | pending |
| T-039 | Crear tests de integración para componentes administrativos de medios con mocks de API | R-014 | pending |
| T-040 | Ejecutar suite completa de tests (`pnpm test`), validación CI (`pnpm ci`) y actualizar `docs/CURRENT-STATE.md` | R-001..R-014 | pending |
