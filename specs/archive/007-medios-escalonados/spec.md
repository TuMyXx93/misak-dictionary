---
id: 007-medios-escalonados
version: 0.1.0
status: approved
cultural-gate: true
---

# 007 — Medios Escalonados: Pronunciación en Audio e Ilustraciones Culturales

## Contexto

El Diccionario Cultural Misak cuenta con una taxonomía de 65 nodos y un corpus léxico unificado de 1.351 sentidos y 1.451 formas léxicas gobernadas (Specs 004, 005 y 006). Para cumplir la misión de revitalización y preservación lingüística de la comunidad indígena Misak, es imprescindible incorporar medios auténticos: grabaciones de audio de hablantes nativos en Namtrik que capturen la fonología, tono y prosodia ancestral, junto a ilustraciones y fotografías etnográficas del territorio (*Nu Pirɵ*), indumentaria y cosmovisión (*Nu Isuik*). Esta especificación define el modelo de datos de medios, el almacenamiento y streaming eficiente con soporte HTTP Range para conexiones rurales, la gestión con el rol `media_admin`, y los componentes accesibles de reproducción e inspección en el portal público y en el panel administrativo.

---

## Requisitos (EARS)

### 1. Modelo de Datos y Gobernanza

- **R-001** (Entidad de Medios Culturales): EL SISTEMA DEBERÁ almacenar los archivos multimedia en una entidad `MedioCultural` vinculable a `SentidoLexico` y/o `FormaNamtrik`, con clasificación por tipo (`audio` / `imagen`), propósito (`pronunciacion_lema`, `contexto_oracion`, `pregunta_dialogo`, `respuesta_dialogo`, `ilustracion_cultural`, `fotografia_territorio`), estado editorial (`borrador` / `ratificado`), metadatos técnicos (mimetype, tamaño en bytes, duración en segundos, dimensiones, hash SHA-256) y metadatos culturales (hablante/autor, variante dialectal, descripción accesible en español y Namtrik, licencia comunitaria).
- **R-002** (Gobernanza Cultural de Medios): CUANDO un medio sea cargado al sistema, su estado inicial DEBERÁ ser `borrador`, y MIENTRAS la bandera `PUBLIC_ONLY_RATIFIED` esté activa, EL SISTEMA NO DEBERÁ exponer medios en estado `borrador` en la API pública del diccionario.
- **R-003** (Ratificación de Medios): CUANDO un usuario con permiso `taxonomy:ratify` (`cultural_reviewer` o `super_admin`) apruebe un medio, EL SISTEMA DEBERÁ actualizar su estado a `ratificado`, registrar la auditoría inmutable y hacerlo visible públicamente.

### 2. Almacenamiento, Streaming y Validación Técnica

- **R-004** (Abstracción de Almacenamiento y Seguridad de Rutas): EL SISTEMA DEBERÁ gestionar el almacenamiento de archivos a través de una interfaz de puerto `StorageService`, implementando almacenamiento en disco local seguro para desarrollo/Docker (`uploads/media/{audios,imagenes}`) y soporte parametrizado para proveedores compatibles S3/Cloudinary, asignando nombres de archivo UUIDv4 opacos que inmunicen el sistema contra ataques de *path traversal*.
- **R-005** (Validación Estricta de Carga): CUANDO se envíe un archivo a los endpoints de carga, EL SISTEMA DEBERÁ verificar su cabecera binaria (Magic bytes) contra la lista blanca de tipos permitidos (Audio: `audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/webm`; Imagen: `image/webp`, `image/jpeg`, `image/png`, `image/svg+xml`) y rechazar peticiones que superen los tamaños máximos (Audio $\le 5$ MB; Imagen $\le 10$ MB) con HTTP `400 Bad Request`.
- **R-006** (Streaming de Audio con HTTP Range 206): CUANDO un cliente solicite un recurso de audio con la cabecera `Range: bytes=...`, EL SISTEMA DEBERÁ responder con HTTP `206 Partial Content`, cabecera `Content-Range` y `Accept-Ranges: bytes`, habilitando el posicionamiento instantáneo (*scrubbing*) y reduciendo el consumo de datos en redes móviles rurales.

### 3. Seguridad y Control de Acceso (RBAC)

- **R-007** (Permisos Granulares de Medios): EL SISTEMA DEBERÁ incorporar al catálogo de permisos `media:read`, `media:write` y `media:delete`, habilitando al rol `media_admin` (anticipado en Spec 006) y a `super_admin` para subir, editar metadatos y despublicar archivos multimedia.
- **R-008** (Protección de Endpoints Multimedia): MIENTRAS un usuario autenticado no cuente con el permiso `media:write`, EL SISTEMA DEBERÁ denegar cualquier intento de carga o modificación multimedia con HTTP `403 Forbidden`.

### 4. Experiencia de Usuario y Reproducción Pública

- **R-009** (Reproductor de Audio Accesible en Portal Público): EN las fichas de términos (`TermRow`, `TermList`) y vistas de sentidos, CUANDO existan audios asociados, EL SISTEMA DEBERÁ renderizar un botón de reproducción accesible (tap target $\ge 48 \times 48$ px, `aria-label` descriptivo en Namtrik/español, estados visuales de reproducción, pausa, carga y error).
- **R-010** (Instancia Única de Audio): MIENTRAS se active la reproducción de un audio en cualquier parte de la aplicación, EL SISTEMA DEBERÁ pausar y reiniciar automáticamente cualquier otro audio que se encuentre reproduciéndose previamente en el cliente.
- **R-011** (Visor de Ilustraciones Culturales con `LazyImage`): EN `TermRow` y fichas de campo/microcampo, CUANDO exista una ilustración asociada, EL SISTEMA DEBERÁ renderizarla obligatoriamente mediante el componente `LazyImage` (Constitución C3.3), proveyendo un visor modal o lightbox accesible (`role="dialog"`, foco atrapado, cierre con tecla Escape y tap target $\ge 48$ px) que muestre la imagen en alta resolución con sus créditos y pie de foto cultural.
- **R-012** (Caché Offline en PWA): EL SISTEMA DEBERÁ configurar en el Service Worker de la PWA (`vite.config.ts`) una política de runtime caching `CacheFirst` para audios e imágenes, con un cupo máximo de 100 archivos de audio y 50 imágenes y expiración a 30 días, permitiendo reproducción y consulta sin conexión de los términos visitados.
- **R-013** (Preservación del Rendimiento R-023): MIENTRAS se incorporen las capacidades de audio y visualización de medios, EL SISTEMA NO DEBERÁ incrementar el tamaño del chunk principal (`index-*.js`) en más de un 5% respecto a la línea base certificada en `v0.5.0-alpha.0` (38.9 kB), utilizando las APIs nativas del navegador (`HTMLAudioElement`) y evitando dependencias de terceros innecesarias.

### 5. Panel Administrativo

- **R-014** (Gestión de Medios en el Panel Admin): EL SISTEMA DEBERÁ proveer en `/admin/medios` y dentro del formulario de edición de sentidos (`/admin/sentidos/:id/editar`) una vista para previsualizar/escuchar, asociar, subir y eliminar medios vinculados a sentidos y formas léxicas, con registro en la bitácora transaccional de auditoría (`audit_log`).

---

## Criterios de Aceptación (Gherkin)

### R-001 y R-002: Modelo de Medios y Gobernanza Inicial

```gherkin
Escenario: Creación de un medio cultural en estado borrador
  Dado que un usuario con rol "media_admin" sube un audio de pronunciación para la forma "mɵrɵk"
  Cuando el archivo es procesado exitosamente
  Entonces el sistema registra el registro en "medios_culturales" con estado "borrador"
  Y el medio no aparece en la respuesta de la API pública cuando PUBLIC_ONLY_RATIFIED está activo
```

### R-003: Ratificación de Medios

```gherkin
Escenario: Ratificación de un audio por el revisor cultural
  Dado que existe un audio de pronunciación en estado "borrador"
  Cuando un usuario con rol "cultural_reviewer" aprueba el medio
  Entonces el estado del medio cambia a "ratificado"
  Y se registra el evento "MEDIA_RATIFY" en la bitácora de auditoría
  Y el audio queda inmediatamente disponible para reproducción en el portal público
```

### R-005: Validación de Archivos Subidos

```gherkin
Escenario: Rechazo de archivo que supera el tamaño máximo permitido
  Dado que un usuario intenta subir un archivo de audio de 8 MB
  Cuando la petición multipart llega al backend
  Entonces el sistema responde con código HTTP 400
  Y el mensaje de error indica que el límite para archivos de audio es 5 MB
```

```gherkin
Escenario: Rechazo de archivo con extensión engañosa pero Magic Bytes inválidos
  Dado que un usuario sube un ejecutable renombrado a "pronunciacion.mp3"
  Cuando el backend inspecciona los bytes de la cabecera
  Entonces el sistema rechaza el archivo con HTTP 400 por tipo MIME no permitido
  Y no se persiste ningún archivo en disco
```

### R-006: Streaming de Audio con HTTP Range

```gherkin
Escenario: Petición parcial de audio para reproducción progresiva
  Dado que un cliente solicita un audio con la cabecera "Range: bytes=0-1024"
  Cuando el servidor procesa la petición
  Entonces el código de respuesta es 206 Partial Content
  Y la cabecera "Content-Range" especifica el rango de bytes y el total del archivo
  Y la cabecera "Accept-Ranges" tiene el valor "bytes"
```

### R-007 y R-008: Control de Acceso RBAC

```gherkin
Escenario: Denegación de subida de medios a roles no autorizados
  Dado un usuario autenticado con rol "analytics_viewer"
  Cuando intenta realizar una petición POST a "/api/admin/medios"
  Entonces el servidor responde con código HTTP 403 Forbidden
  Y la petición es rechazada sin almacenar ningún archivo
```

### R-009 y R-010: Reproductor Accesible y Single-Instance

```gherkin
Escenario: Reproducción exclusiva de audio en el cliente
  Dado que el usuario está escuchando la pronunciación de la palabra "kan"
  Cuando el usuario hace clic en el botón de audio de la palabra "paap"
  Entonces el audio de "kan" se detiene de inmediato
  Y comienza la reproducción del audio de "paap"
  Y el botón activo refleja el estado visual de reproducción accesible
```

### R-011: Visor de Ilustraciones con `LazyImage` y Modal Accesible

```gherkin
Escenario: Apertura de lightbox para una ilustración cultural
  Dado que un sentido léxico cuenta con una ilustración cultural
  Cuando el usuario hace clic o presiona Enter sobre la miniatura renderizada por LazyImage
  Entonces se abre un diálogo modal con role="dialog"
  Y el foco se desplaza al interior del diálogo
  Y al presionar la tecla Escape, el modal se cierra devolviendo el foco al disparador
```

### R-012: Cacheo Offline en PWA

```gherkin
Escenario: Reproducción de audio previamente visitado en modo sin conexión
  Dado que el usuario reprodujo el audio de "kɵtɵ" estando en línea
  Cuando el dispositivo pasa a modo avión o pierde conexión a internet
  Y el usuario vuelve a presionar el botón de reproducción de "kɵtɵ"
  Entonces el Service Worker sirve el audio desde la caché local sin errores
```

### R-013: Control de Crecimiento del Bundle

```gherkin
Escenario: Verificación de límite de bundle size en producción
  Dado el build de producción del cliente web
  Cuando se ejecuta el script "scripts/check-bundle-size.mjs"
  Entonces el tamaño del chunk principal no excede en más del 5% la línea base de 38.9 kB
```

---

## Fuera de Alcance

1. Reconocimiento de voz o transcripción automatizada (STT/TTS) por inteligencia artificial.
2. Edición o recorte de audio avanzado dentro del navegador.
3. Transcodificación masiva de video (los videos continúan embebidos vía enlaces externos/plataformas de video según la Fase 1).
4. Almacenamiento descentralizado (IPFS/Blockchain).

---

## Trazabilidad

| Requisito | Archivos | Tests |
| :--- | :--- | :--- |
| R-001 | `medio-cultural.entity.ts`, `schema.prisma`, `prisma-medio-cultural.repository.ts`, `upload-media.use-case.ts` | `prisma-medio-cultural.repository.spec.ts`, `upload-media.use-case.spec.ts` |
| R-002 | `medio-cultural.entity.ts`, `get-media-stream.use-case.ts`, `media.routes.ts` | `get-media-stream.use-case.spec.ts`, `media.routes.spec.ts` |
| R-003 | `ratify-media.use-case.ts`, `admin-media.routes.ts` | `ratify-media.use-case.spec.ts` |
| R-004 | `storage.service.ts`, `local-storage.service.ts` | `local-storage.service.spec.ts` |
| R-005 | `magic-byte-validator.ts`, `upload-media.use-case.ts`, `app.ts` | `magic-byte-validator.spec.ts`, `upload-media.use-case.spec.ts` |
| R-006 | `local-storage.service.ts`, `get-media-stream.use-case.ts`, `media.routes.ts` | `local-storage.service.spec.ts`, `get-media-stream.use-case.spec.ts`, `media.routes.spec.ts` |
| R-007 | `permissions.ts`, `admin-media.routes.ts` | `admin-media.routes.spec.ts` |
| R-008 | `admin-media.routes.ts`, `upload-media.use-case.ts` | `admin-media.routes.spec.ts` |
| R-009 | `AudioPlayButton.tsx`, `TermRow.tsx` | `AudioPlayButton.spec.tsx`, `TermRow.spec.tsx` |
| R-010 | `AudioPlayerContext.tsx` | `AudioPlayerContext.spec.tsx` |
| R-011 | `CulturalMediaLightbox.tsx`, `TermRow.tsx` | `CulturalMediaLightbox.spec.tsx`, `TermRow.spec.tsx` |
| R-012 | `vite.config.ts` | `vite.config.spec.ts` / e2e PWA audit |
| R-013 | `scripts/check-bundle-size.mjs`, `AudioPlayerContext.tsx` | `pnpm build:web` bundle check |
| R-014 | `AdminMediaPage.tsx`, `AdminMediaUploadModal.tsx`, `AdminSentidoEditPage.tsx` | `AdminMediaPage.spec.tsx` |
