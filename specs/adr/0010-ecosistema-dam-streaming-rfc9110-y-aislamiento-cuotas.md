# ADR-0010: Endurecimiento del Ecosistema DAM, Streaming RFC 9110 y Aislamiento de Cuotas

- **Fecha**: 2026-04-12
- **Estado**: Aceptado
- **Relacionado con**: `specs/features/014-ecosistema-bidireccional-medios-culturales/spec.md`, `specs/adr/0005-medios-culturales-storage-y-streaming.md`, `specs/adr/0009-endurecimiento-rbac-y-maquina-estados-editorial.md`

## Contexto

Durante la auditoría quirúrgica integral del ecosistema bidireccional de medios culturales (DAM — *Digital Asset Management*) y la revisión de contratos end-to-end entre PostgreSQL, Fastify 5, proxy Nginx y React 19, se identificaron brechas críticas de consistencia, seguridad y resiliencia en redes rurales de conectividad limitada:

1. **Consistencia archivo-registro y vectores SVG maliciosos**:
   - En `UploadMediaUseCase`, la escritura física del binario en disco ocurría antes de la inserción en PostgreSQL sin compensación explícita ante fallos de base de datos, generando archivos huérfanos en `uploads/media`.
   - La validación de archivos SVG debía bloquear contenido activo embebido (`<script>`, manejadores `on*=`) antes de persistir el recurso y garantizar aislamiento estricto de políticas CSP al servir `image/svg+xml`.
2. **Brechas en semántica HTTP RFC 9110 para streaming y caché**:
   - El endpoint de streaming (`GetMediaStreamUseCase` + `sendMediaStream`) carecía de validación condicional mediante `ETag` / `If-None-Match` (`304 Not Modified`) y `If-Range` (RFC 9110 §14.2), causando transferencias redundantes o lecturas parciales incoherentes tras actualizaciones.
   - El proxy inverso Nginx no desactivaba el buffering para rangos ni reenviaba explícitamente `Range` e `If-Range`, mientras CORS en Fastify omitía `ETag` y `Retry-After` en `exposedHeaders`.
3. **Aislamiento de cuotas, consultas redundantes e inconsistencias de dominio**:
   - `PrismaPg` operaba sin límites explícitos de pool y timeout; `SystemSettingsService` mantenía caché por instancia en lugar de compartir estado en memoria del proceso; `requirePasswordChanged` ejecutaba lecturas redundantes; `GetMediaStreamUseCase` evaluaba permisos de borrador incluso para recursos ya ratificados; y los conteos taxonómicos de eliminación incluían sentidos con soft-delete (`deleted_at IS NOT NULL`).
   - En papelera y auditoría faltaban límites de consulta (`take: 200`), tolerancia a autodetección sin ruido `404` y alineación completa de acciones (`MEDIA_UPLOAD`, `MEDIA_UPDATE`, `ratify_batch`, alias `userId` y `entityType`).
4. **Resiliencia UX móvil, accesibilidad WCAG 2.2 AA y contratos de UI**:
   - En `web-client`, tablas responsivas sin `tabIndex={0}` ni `role="region"`, reproductores de video sin `preload="none"` ni relación de aspecto dinámica según dimensiones intrínsecas, filtros administrativos sin `useDebounce` (`250ms`), paginación unidireccional por cursor, pérdida de retorno de foco al cerrar el cajón móvil y comportamiento redundante sobre `<dialog>` nativo degradaban la accesibilidad y la experiencia en móviles.

---

## Decisión

### 1. Deduplicación CAS, Rollback de Huérfanos y Sanitización Estricta de SVG
- `validateMediaFile` exporta y aplica `hasUnsafeSvgContent` sobre cargas `image/svg+xml` para rechazar etiquetas y atributos ejecutables antes de tocar almacenamiento.
- `UploadMediaUseCase` preserva almacenamiento direccionado por contenido (CAS por SHA-256) y envuelve `mediaRepository.create` en un bloque `try/catch` que invoca `storageService.delete(saved.relativePath)` cuando falla la persistencia en PostgreSQL.
- `sendMediaStream` añade siempre `X-Content-Type-Options: nosniff` y, para `image/svg+xml`, inyecta una cabecera estricta `Content-Security-Policy` libre de scripts e integraciones externas.

### 2. Streaming Conforme a RFC 9110 y Passthrough en Proxy/CORS
- `GetMediaStreamUseCase` expone soporte condicional de `ETag` a partir del recurso multimedia:
  - Si `If-None-Match` coincide con el `ETag`, responde `notModified: true` (`304 Not Modified`) sin abrir flujo en disco ni leer bytes.
  - Si se recibe `If-Range` y no coincide con el `ETag` del recurso (RFC 9110 §14.2), ignora `Range` y entrega el recurso completo (`200 OK`).
- La autorización de lectura de borradores en streaming se resuelve de forma perezosa (`canReadDrafts: () => Promise<boolean> | boolean`) únicamente cuando `medio.estado === 'borrador'`.
- `adminMediaRoutes` registra auditoría `MEDIA_UPLOAD` tras subidas exitosas y reutiliza `preloadedMedio` al transmitir.
- `apps/backend-service/src/app.ts` expone en CORS `Content-Length`, `Content-Range`, `Accept-Ranges`, `Content-Disposition`, `ETag`, `Retry-After` y `X-Request-Id`.
- `apps/web-client/nginx.conf` configura `proxy_buffering off` y reenvía explícitamente las cabeceras `Range` e `If-Range` en `location /api/`.

### 3. Aislamiento de Cuotas, Caché Compartida y Contratos Backend ↔ Frontend
- `PrismaPg` fija límites operativos explícitos (`max: 15`, `idleTimeoutMillis: 30_000`, `connectionTimeoutMillis: 5_000`).
- `SystemSettingsService` consolida la caché en un almacenamiento estático compartido entre instancias del proceso (`sharedCache`), manteniendo `invalidateCache()` para coherencia ante actualizaciones administrativas.
- `authorizationMiddleware` unifica la verificación de cuenta activa (`isActive`) y cambio obligatorio de contraseña (`mustChangePassword`) en una única consulta `findById`.
- `ManageTaxonomiaUseCase` excluye registros con soft-delete (`deleted_at IS NULL` / `deletedAt: null`) en el árbol de conteos y en la validación previa a eliminar nodos.
- `PapeleraUseCase` acota sus 5 consultas de listado con `take: 200` y tolera `404` durante la autodetección de nivel en restauraciones; `ListAuditUseCase` y `adminAuditRoutes` exponen `userId`, `entityType`, `settings:update` y las acciones multimedia/lote.

### 4. Reproductor Singleton Resiliente, Patrones Nativos `<dialog>` y WCAG 2.2 AA en Frontend
- `CulturalVideoPlayer` fija `preload="none"` por defecto, coordina exclusión mutua singleton mediante eventos `misak:audio-play` y `misak:video-play`, y calcula `aspectRatio` en línea desde dimensiones intrínsecas válidas (`width` / `height`).
- `AdminDialog` delega la semántica modal y la tecla `Escape` al elemento nativo `<dialog>` sin listeners globales ni `aria-modal` redundantes, acompañado en `index.css` por `dialog:modal { overscroll-behavior: contain; }` y `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }`.
- `PublicHeader` restaura explícitamente el foco al botón disparador al cerrar el cajón móvil (`closeDrawer`); los contenedores `.misak-table-region` incorporan `tabIndex={0}`, `role="region"` y `aria-label`; los buscadores administrativos aplican `useDebounce(..., 250)`; y `SentidosPage` / `AuditoriaPage` implementan historial bidireccional de cursores (`cursorHistory`).

---

## Consecuencias

### Positivas
- **Integridad operativa del DAM**: Se eliminan archivos huérfanos en fallos transaccionales y se bloquean cargas SVG con vectores XSS.
- **Menor consumo de ancho de banda rural**: `304 Not Modified`, `If-Range`, `proxy_buffering off` y `preload="none"` evitan descargas duplicadas y cortes de reproducción parcial en móviles.
- **Estabilidad de pool y contratos**: PostgreSQL opera con techo de conexiones predecible, las respuestas `409`/`429` conservan cabeceras útiles en navegador y el frontend consume contratos tipados alineados de extremo a extremo.

### Negativas / Mitigaciones
- **Sensibilidad de pruebas unitarias ante debounce y resolución perezosa**: Los filtros con `useDebounce(..., 250)` requieren aserciones asíncronas (`waitFor`) en tests de UI, y el parámetro `canReadDrafts` en `GetMediaStreamUseCase` pasa a ser una función evaluada bajo demanda.
  - *Mitigación*: Suites unitarias actualizadas para validar llamadas lazy, respuestas `304`/CSP, retorno de foco, aspecto dinámico de video y búsquedas con debounce.
