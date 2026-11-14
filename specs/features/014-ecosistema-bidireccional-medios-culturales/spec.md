---
id: 014-ecosistema-bidireccional-medios-culturales
version: 1.0.0
status: done
cultural-gate: true
created: 2026-11-13
approved: 2026-11-13
---

# 014 — Ecosistema Bidireccional de Medios Culturales (DAM ↔ Léxico ↔ Diccionario Público)

## Contexto

La auditoría forense sobre **Medios Culturales (R-014)**, la pestaña contextual en **Editar sentido (R-007)**, el **Dashboard de Gobierno Editorial (R-027)** y la proyección hacia el **Diccionario Público (`TermRow`)** identificó desconexiones críticas entre backend, frontend y papelera:

1. **Hidratación y consultas asimétricas en `PrismaMedioCulturalRepository`**: `findById`, `findByUuid`, `findBySentidoId`, `findByFormaId` y `list` omitían `include` de relaciones (`sentido.formas`, `sentido.ubicaciones`, `forma`, `campoSemantico`, `subcampoSemantico`, `microcampo`). Además, el filtro `sentidoId` ignoraba medios vinculados a nivel de `formaId`, y la búsqueda textual `query` no buscaba sobre códigos, glosas ni lemas de sentidos vinculados.
2. **Ausencia de edición, vinculación bidireccional real, descarga y restauración**: `AdminMediaUploadModal` exigía IDs numéricos manuales para la taxonomía y carecía de selector buscable de sentidos/formas, vista previa local inmediata (`ObjectURL`), edición de metadatos (`PATCH /api/admin/medios/:id`), vinculación de medios ya cargados sin duplicar binarios y soporte de medios eliminados en `/api/admin/papelera`.
3. **Streaming de borradores bloqueado en panel admin**: `/api/media/:uuid/stream` fijaba `canReadDrafts: false`, impidiendo a editores y revisores escuchar audios o ver imágenes/videos en `borrador` antes de ratificarlos.
4. **Control editorial (R-010 multimedia) y RBAC incompleto**: `AdminMediaPage` y `SentidoEditorPage` habilitaban «Ratificar» con `media:write` en lugar de `taxonomy:ratify`; `RatifyMediaUseCase` no bloqueaba la auto-ratificación; `PATCH /:id/metadatos` no revertía un medio `ratificado` a `borrador` al editarlo; y `RevisionPage` no incluía los medios pendientes para el revisor cultural.
5. **Precisión en Dashboard y proyección pública multi-nivel**: `ProgresoRatificacionUseCase` truncaba `2 / 1351` (`0.148%`) a `0%` mediante `Math.round` y derivaba totales globales desde `sentidos_ubicaciones`. En el diccionario público, `TermRow` solo renderizaba un audio/imagen/video único ignorando la proyección contextual por `proposito` (`pronunciacion_lema`, `contexto_oracion`, `pregunta_dialogo`, `respuesta_dialogo`, galería múltiple).

---

## Requisitos (EARS)

- **R-001 (Sincronización bidireccional e hidratación completa de Medios Culturales)** — CUANDO el backend retorne uno o más `MedioCultural` en `/api/admin/medios` (`list`, `GET /:id`, `POST /upload`, `PATCH /:id`, `POST /:id/ratificar`), EL SISTEMA DEBERÁ hidratar las relaciones `sentido` (incluyendo `id`, `codigo`, `espanolGlosa`, `nombreCientifico`, `formas`, `ubicaciones`), `forma`, `campoSemantico`, `subcampoSemantico` y `microcampo`; asimismo, el filtro `sentidoId` DEBERÁ incluir tanto `medio.sentidoId = sentidoId` como `medio.forma.sentidoId = sentidoId`, y `UploadMediaUseCase` DEBERÁ resolver automáticamente el `sentidoId` padre cuando se especifique `formaId`.
- **R-002 (Búsqueda textual ampliada y conteo multimedia por sentido)** — CUANDO se filtre `/api/admin/medios` mediante `query`, EL SISTEMA DEBERÁ buscar coincidencias en metadatos propios del medio Y en `sentido.codigo`, `sentido.espanolGlosa`, `sentido.nombreCientifico`, `sentido.formas.lema` y nodos taxonómicos asociados. Además, `ListSentidosAdminUseCase` DEBERÁ retornar `mediosCount` por cada sentido para su visualización en `/admin/sentidos`.
- **R-003 (Streaming autenticado de borradores y descarga directa)** — CUANDO una persona autenticada con permiso `media:read` o `dictionary:read` solicite `/api/media/:uuid/stream` (o `/api/admin/medios/:id/stream`) vía cabecera `Authorization` o cookie HttpOnly de sesión multimedia (`misak_at`), EL SISTEMA DEBERÁ permitir la reproducción parcial (`206 Partial Content`) y completa (`200`) de recursos en estado `borrador`; SI incluye `?download=1`, DEBERÁ responder con `Content-Disposition: attachment`.
- **R-004 (Carga, previsualización local y vinculación taxonómica/léxica dinámica)** — CUANDO una persona con `media:write` abra `AdminMediaUploadModal` (desde `/admin/medios` o `/admin/sentidos/:id/editar`), EL SISTEMA DEBERÁ mostrar previsualización nativa instantánea del archivo local (`<audio>`, `<img>`, `<video>` via `URL.createObjectURL`), selectores en cascada alimentados por taxonomía real (sin inputs numéricos crudos de ID), autocompletado buscable de sentidos/formas y selector granular de objetivo (`lema principal`, `forma/variante`, `oración de contexto`, `pregunta dialógica`, `respuesta dialógica`). Adicionalmente, desde `/admin/sentidos/:id/editar` DEBERÁ ofrecer «Vincular medio existente» (`AdminMediaLinkExistingModal`) sin re-subir el binario.
- **R-005 (Edición de metadatos, desvinculación segura y Papelera DAM)** — EL SISTEMA DEBERÁ proveer edición integral de metadatos y vínculos mediante `AdminMediaEditModal` (`PATCH /api/admin/medios/:id`, con evento de auditoría `MEDIA_UPDATE`). Desde `SentidoEditorPage`, al retirar un medio se DEBERÁ presentar un diálogo accesible (`AdminDialog`) con dos acciones explícitas: **«Desvincular de este sentido»** (conserva el activo en el repositorio global) y **«Enviar a Papelera»** (`DELETE /api/admin/medios/:id`). Papelera (`/api/admin/papelera` y `PapeleraPage`) DEBERÁ incluir el nivel `medio` para listar, restaurar y purgar (`super_admin`, $\ge 30$ días).
- **R-006 (Regla R-010 independiente para medios y separación estricta de funciones RBAC)** — EL SISTEMA DEBERÁ cumplir que:
  1. Vincular un medio `borrador` a un sentido `ratificado` NO altera el estado `ratificado` del sentido padre.
  2. Editar metadatos o vínculos de un medio `ratificado` revierte exclusivamente ese `MedioCultural` a estado `borrador`, limpia `ratificadoPorId` y `ratificadoAt`, y registra auditoría `MEDIA_UPDATE`.
  3. Solo personas con `taxonomy:ratify` verán y podrán ejecutar «Ratificar» medio en `AdminMediaPage`, `SentidoEditorPage` y `RevisionPage`; nunca por tener únicamente `media:write`.
  4. `RatifyMediaUseCase` rechazará con HTTP `409` (`SELF_RATIFICATION_FORBIDDEN`) la auto-ratificación cuando `subidoPorId === actorUserId` (salvo `super_admin`).
- **R-007 (Cola unificada de revisión para medios culturales)** — `RevisionPage` (`/admin/revision`) DEBERÁ ofrecer una pestaña/sección **«Medios Culturales por Ratificar»** donde `cultural_reviewer` (con `taxonomy:ratify`) pueda previsualizar audio/imagen/video en borrador y ratificarlo directamente junto a los sentidos léxicos.
- **R-008 (Catálogo de vinculación accesible para `media_admin`)** — `/api/admin/medios` DEBERÁ exponer endpoints ligeros de solo lectura (`GET /api/admin/medios/catalogo-taxonomia` y `GET /api/admin/medios/buscar-sentidos`) protegidos por `media:read` para que el rol `media_admin` pueda buscar sentidos y nodos taxonómicos sin requerir el permiso completo `dictionary:read`.
- **R-009 (Proyección pública contextual multi-medio en `TermRow`)** — CUANDO un sentido tenga múltiples medios ratificados, `TermRow` DEBERÁ renderizar:
  - Audio de `pronunciacion_lema` junto al lema principal (y por variante en `forma.medios` cuando exista).
  - Audio de `contexto_oracion` junto al ejemplo en Namtrik.
  - Audios `pregunta_dialogo` y `respuesta_dialogo` junto a cada bloque dialógico correspondiente.
  - Galería/acceso completo a todas las imágenes y videos culturales vinculados (sin truncar al primer elemento).
- **R-010 (Exactitud de progreso global y precisión decimal en Dashboard)** — `ProgresoRatificacionUseCase` y `useProgresoRatificacion` DEBERÁN calcular los totales globales sobre sentidos léxicos distintos (`deletedAt: null`) para evitar doble conteo ante múltiples ubicaciones, y conservar precisión fraccional cuando `0 < porcentaje < 1` (ej. `2 / 1351 = 0.15%`, en lugar de truncar a `0%`), preservando compatibilidad de visualización en `DashboardPage`.

---

## Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Carga desde /admin/medios aparece inmediatamente en SentidoEditorPage y viceversa
  Dado un sentido "C4.S6.E021" con id "1351" y una forma asociada id "5001"
  Cuando un content_admin sube un audio vinculado al sentido "1351" y forma "5001" desde /admin/medios
  Entonces GET /api/admin/medios?sentidoId=1351 devuelve ese medio hidratado con su sentido, forma y jerarquía taxonómica
  Y la pestaña "Medios Culturales" de /admin/sentidos/1351/editar muestra el contador actualizado y el audio listo para reproducir

Escenario: Edición de medio ratificado aplica R-010 sin alterar sentido padre
  Dado un sentido "ratificado" vinculado a un medio "ratificado"
  Cuando un editor modifica la descripción en español del medio via PATCH /api/admin/medios/:id
  Entonces el medio vuelve a estado "borrador" con ratificadoPorId = null y ratificadoAt = null
  Y el sentido padre conserva su estado "ratificado"

Escenario: Separación de funciones y auto-ratificación en medios
  Dado un usuario media_admin con "media:write" pero sin "taxonomy:ratify"
  Cuando consulta AdminMediaPage o POST /api/admin/medios/:id/ratificar
  Entonces no ve el botón "Ratificar" y el endpoint responde 403
  Y cuando un revisor con "taxonomy:ratify" intenta ratificar un medio subido por él mismo
  Entonces el backend responde 409 SELF_RATIFICATION_FORBIDDEN

Escenario: Diccionario público renderiza audios por propósito y galería completa
  Dado un sentido dialógico con audios ratificados de "pregunta_dialogo", "respuesta_dialogo" y 2 ilustraciones
  Cuando se renderiza TermRow
  Entonces se muestran los dos botones de audio en pregunta y respuesta respectivamente
  Y se renderizan las miniaturas accesibles para ambas ilustraciones
```

---

## Trazabilidad

| Requisito | Archivos Clave | Tests |
| :-- | :-- | :-- |
| **R-001 / R-002** | `MedioCultural.ts`, `IMedioCulturalRepository.ts`, `MedioCulturalRepository.ts`, `UploadMediaUseCase.ts`, `ListSentidosAdminUseCase.ts` | `MedioCulturalRepository.test.ts`, `UploadMediaUseCase.test.ts`, `ListSentidosAdminUseCase.test.ts` |
| **R-003** | `AuthController.ts`, `mediaRoutes.ts`, `GetMediaStreamUseCase.ts`, `adminMediaRoutes.ts` | `mediaRoutes.test.ts`, `GetMediaStreamUseCase.test.ts`, `AuthController.test.ts` |
| **R-004 / R-005** | `UpdateMediaMetadataUseCase.ts`, `PapeleraUseCase.ts`, `adminPapeleraRoutes.ts`, `AdminMediaUploadModal.tsx`, `AdminMediaEditModal.tsx`, `AdminMediaLinkExistingModal.tsx`, `SentidoEditorPage.tsx`, `PapeleraPage.tsx`, `SentidosPage.tsx`, `useAdmin.ts` | `PapeleraUseCase.test.ts`, `AdminMediaUploadModal.test.tsx`, `SentidoEditorPage.test.tsx`, `PapeleraPage.test.tsx` |
| **R-006 / R-007 / R-008** | `RatifyMediaUseCase.ts`, `adminMediaRoutes.ts`, `AdminMediaPage.tsx`, `SentidoEditorPage.tsx`, `RevisionPage.tsx` | `RatifyMediaUseCase.test.ts`, `adminMediaRoutes.test.ts`, `AdminMediaPage.test.tsx`, `RevisionPage.test.tsx` |
| **R-009** | `TermRow.tsx`, `dictionaryApi.ts`, `semanticField.ts` | `TermRow.test.tsx` |
| **R-010** | `ProgresoRatificacionUseCase.ts`, `adminGovernanceRoutes.ts`, `useAdmin.ts`, `DashboardPage.tsx` | `ProgresoRatificacionUseCase.test.ts`, `DashboardPage.test.tsx` |

---

## Endurecimiento Operativo en Túneles, Dispositivos Móviles y Panel Administrativo (R-011..R-015)

### R-011: Aislamiento de Borradores Culturales en API Pública (Opción A)

- **Requisito (EARS):** **Cuando** un visitante público consulte los endpoints de "/api/dictionary/*", **el sistema debe** filtrar todas las relaciones "medios" de sentidos y formas exigiendo "estado: 'ratificado'" y "deletedAt: null" con independencia del flag "PUBLIC_ONLY_RATIFIED", evitando exponer URLs de medios en borrador.

```gherkin
Escenario: Ocultamiento de medios en borrador en el diccionario público incluso con PUBLIC_ONLY_RATIFIED = false
  Dado que la bandera "PUBLIC_ONLY_RATIFIED" está configurada en "false"
  Y existen medios culturales en estado "borrador" asociados a un sentido léxico o forma
  Cuando un visitante público consulta la jerarquía semántica o busca términos en "/api/dictionary/*"
  Entonces la API pública incluye únicamente medios con estado "ratificado"
  Y los medios en "borrador" continúan accesibles exclusivamente para usuarios autenticados en "/api/admin/medios/*"
```

### R-012: Streaming Móvil RFC 9110, `HEAD`, HTTP `416` y Caché PWA Segura

- **Requisito (EARS):** **Cuando** un cliente web o móvil solicite "/api/media/:uuid/stream" o "/api/admin/medios/:id/stream" mediante "GET" o "HEAD", **el sistema debe** resolver rangos estándar y sufijo ("bytes=-N") conforme al RFC 9110, responder HTTP 416 ("Content-Range: bytes */<total>") ante rangos inválidos, atender "HEAD" sin abrir stream de lectura de disco, cachear en el Service Worker únicamente respuestas completas HTTP 200 y serializar la reproducción en "AudioPlayerContext" ignorando cancelaciones "AbortError".

```gherkin
Escenario: Peticiones sufijo, fuera de rango y preflight móvil sin bloqueo ni corrupción de caché
  Dado un archivo multimedia en el almacenamiento local
  Cuando un cliente móvil envía una cabecera "Range: bytes=-512" o "HEAD /api/media/:uuid/stream"
  Entonces el servidor responde los últimos 512 bytes con código 206 o las cabeceras sin abrir lectura del cuerpo en HEAD
  Y si el rango es inválido o excede el tamaño del archivo, responde HTTP 416 con "Content-Range: bytes */<total>"
  Y el Service Worker PWA solo almacena respuestas completas HTTP 200 en "misak-cultural-media-cache"
  Y el reproductor web ignora dobles toques en "loading" y cancelaciones "AbortError" al cambiar de pista
```

### R-013: Cuotas Diferenciadas de Rate Limiting y Política Sin Reintento `4xx`

- **Requisito (EARS):** **Mientras** múltiples clientes y editores operen concurrentemente detrás de un túnel compartido o proxy inverso, **el sistema debe** aislar las cuotas de rate limiting por dominio ("/api/admin/*" por "userId" autenticado a 600 req/min, "/api/dictionary/*" por IP a 300 req/min y streaming multimedia en bucket propio a 600 req/min con "HEAD" exento) y suprimir en TanStack Query ("shouldRetryQuery") cualquier reintento automático sobre errores HTTP 4xx (salvo 408).

```gherkin
Escenario: Aislamiento de cuotas entre panel editorial, diccionario público y streaming tras túnel compartido
  Dado múltiples usuarios concurrentes detrás de la misma IP pública o túnel de Cloudflare
  Cuando un editor trabaja en "/api/admin/*" con sesión autenticada y visitantes móviles navegan "/api/dictionary/*"
  Entonces las cuotas de "/api/admin/*" se aíslan por userId verificado (600/min), "/api/dictionary/*" por IP (300/min) y streaming por bucket propio (600/min con HEAD exento)
  Y TanStack Query en el cliente web jamás reintenta automáticamente respuestas HTTP 4xx (salvo 408)
```

---

### R-014: Visor Multimodal Responsivo Sin Recortes y Miniaturas Cuadradas `TermRow` (extiende Spec 007 R-011 y R-009)

- **Requisito (EARS):** **Mientras** el usuario visualiza una ilustración cultural o video en `CulturalMediaLightbox` (vía `LazyImage` o `CulturalResourceRegistry`) desde escritorio ancho, móvil Portrait (`360x800`) o móvil Landscape (`800x360`), **el sistema debe** estructurar el panel en columna flex con altura máxima `92dvh` (respaldo `92vh`), cabecera y pie `shrink-0`, escenario central `flex-1 min-h-0 overflow-hidden` sin barras de scroll espurias, imagen limitada simultáneamente en ancho y alto con `fit="contain"` y compactación `@media (max-height: 500px)`, preservando siempre visible el pie de `Licencia:` y las miniaturas cuadradas `aspect-square` sin recorte en `TermRow` con restauración de foco al disparador exacto.

```gherkin
Escenario: Ilustración cultural y pie de licencia completos en Desktop, Portrait y Mobile Landscape
  Dado un recurso visual cultural (ej. "Kaluyapenku", "Kaulli", "Chumpi", "Atuall") abierto desde TermRow o el visor administrativo
  Cuando el usuario consulta el lightbox en escritorio ancho, en móvil Portrait (360x800) o en móvil Landscape (800x360)
  Entonces LazyImage aplica fit="contain" directo sobre <img> dentro de .misak-lightbox-stage sin recorte por object-cover ni scrollbars internos innecesarios
  Y el título <h2> se muestra sin truncar junto al pie shrink-0 con Licencia visible, omitiendo divisores redundantes cuando no hay descripciones
  Y al cerrar cualquier miniatura o botón de video en TermRow el foco regresa exactamente al botón disparador activado
```

---

### R-015: Sidebar Administrativo Responsivo con Scroll Independiente, Sincronización `matchMedia` contra `inert` y Tap Targets `>= 48px` (extiende Spec 006 R-021 y Spec 008 R-002)

- **R-015a (Contención de Altura y Scroll Independiente en Escritorio):** **Cuando** el panel administrativo (`AdminLayout`) se visualice en viewports de escritorio (`>= 1024px`, `lg:`), **el sistema debe** acotar la altura del `<aside>` lateral izquierdo a `calc(100vh - var(--admin-header-h))` con mejora progresiva `calc(100dvh - var(--admin-header-h))` (`@supports (height: 1dvh)`), posicionarlo con `lg:sticky lg:top-[var(--admin-header-h)] lg:self-start lg:overflow-hidden` (`lg:w-60 xl:w-64`) y delegar el desplazamiento vertical exclusivamente a `<nav>` (`flex-1 min-h-0 overflow-y-auto overscroll-contain`), manteniendo fijo el bloque inferior `"Resguardo de Guambia"` (`shrink-0`) para garantizar que los 9 módulos editoriales sean 100% clicables en alturas `< 1080px` (ej. `1366x768`, `1280x720`, `1024x600`) aunque `<main>` tenga contenido corto.
- **R-015b (Sincronización de Breakpoint `matchMedia` contra Bloqueo `inert`):** **Cuando** el cajón móvil (`drawerOpen`) esté abierto en un viewport `< 1024px` y la ventana supere el umbral `min-width: 64rem` (`1024px`) por redimensionamiento o rotación de pantalla, **el sistema debe** cerrar automáticamente `drawerOpen` mediante un listener de `window.matchMedia('(min-width: 64rem)')`, eliminando de inmediato el atributo `inert` del contenedor principal que aloja el `<aside>` de escritorio y `<main>`.
- **R-015c (Restauración de Foco y Tap Targets `>= 48px`):** **Cuando** la persona usuaria cierre el cajón móvil mediante la tecla `Escape`, el botón de cierre o el backdrop, **el sistema debe** restaurar el foco al botón disparador (`Abrir menú administrativo`, vinculado con `aria-controls="admin-mobile-drawer"`). **Además**, todos los enlaces de navegación lateral (`renderNavLinks`) y los botones de apertura/cierre del cajón móvil **deben** tener una altura mínima táctil de `48px` (`min-h-[48px]`, Constitución `C3.2`).

```gherkin
Escenario: Superadministrador con 9 módulos navega en laptop de baja altura (1280x720 / 1024x600) con contenido principal corto
  Dado un usuario autenticado con rol "super_admin" y los 9 módulos editoriales visibles en el menú lateral
  Cuando accede al panel administrativo en un viewport de 1024x600 o 1280x720 con contenido corto en "#admin-main"
  Entonces el <aside> de escritorio limita su altura a "calc(100dvh - var(--admin-header-h))" bajo <header>
  Y la navegación "<nav aria-label='Navegación del panel de administración'>" habilita scroll interno independiente ("flex-1 min-h-0 overflow-y-auto overscroll-contain") sin quedar recortada bajo el pliegue
  Y el bloque inferior "Resguardo de Guambia" permanece anclado sin bloquear ni interceptar clics sobre los enlaces

Escenario: Transición de viewport < 1024px a >= 1024px con cajón móvil abierto libera atributo inert
  Dado que el cajón móvil del panel administrativo está abierto en un viewport < 1024px
  Cuando el viewport transiciona a "min-width: 64rem" (>= 1024px) por rotación o redimensionamiento
  Entonces el listener de "window.matchMedia('(min-width: 64rem)')" cierra automáticamente "drawerOpen"
  Y el contenedor principal elimina de inmediato el atributo "inert" dejando clicables los 9 módulos y el contenido

Escenario: Cierre del cajón móvil con Escape restaura el foco al botón de menú
  Dado que el usuario abrió el cajón móvil desde el botón "Abrir menú administrativo"
  Cuando presiona la tecla "Escape" o pulsa el botón de cierre / backdrop
  Entonces el cajón móvil se cierra y el foco retorna al botón "Abrir menú administrativo" con tap target >= 48px
```

---

## Trazabilidad Adicional (Endurecimiento Opción A)

| Requisito | Implementación | Pruebas |
| :--- | :--- | :--- |
| **R-011** | `CampoSemanticoRepository.ts`, `PalabraRepository.ts` | `CampoSemanticoRepository.test.ts`, `PalabraRepository.test.ts` |
| **R-012** | `AppError.ts`, `storage.service.ts`, `local-storage.service.ts`, `GetMediaStreamUseCase.ts`, `sendMediaStream.ts`, `mediaRoutes.ts`, `adminMediaRoutes.ts`, `AudioPlayerContext.tsx`, `vite.config.ts` | `AppError.test.ts`, `local-storage.service.test.ts`, `GetMediaStreamUseCase.test.ts`, `mediaRoutes.test.ts`, `adminMediaRoutes.test.ts`, `AudioPlayerContext.resilience.test.tsx` |
| **R-013** | `env.ts`, `rateLimitPolicy.ts`, `app.ts`, `dictionaryApi.ts`, `queryRetry.ts`, `main.tsx` | `rateLimitPolicy.test.ts`, `rateLimitPolicy.integration.test.ts`, `queryRetry.test.ts`, `dictionaryApi.test.ts` |
| **R-014** | `LazyImage.tsx`, `CulturalMediaLightbox.tsx`, `CulturalResourceRegistry.tsx`, `TermRow.tsx`, `index.css` | `LazyImage.test.tsx`, `CulturalMediaLightbox.test.tsx`, `TermRow.test.tsx` |
| **R-015** | `AdminLayout.tsx`, `index.css` | `AdminLayout.test.tsx`, `adminA11y.test.tsx` |
