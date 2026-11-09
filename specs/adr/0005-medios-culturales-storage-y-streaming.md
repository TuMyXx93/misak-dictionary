# ADR-0005: Arquitectura de Almacenamiento, Streaming y Gobernanza de Medios Culturales

- **Fecha**: 2026-10-17
- **Estado**: Aceptado
- **Relacionado con**: `specs/features/007-medios-escalonados/spec.md`

## Contexto

El Diccionario Cultural Misak cuenta con un corpus de 1.351 sentidos léxicos y 1.451 formas en Namtrik. La preservación y revitalización de la lengua ancestral exige incorporar recursos multimedia auténticos: grabaciones fonéticas de hablantes nativos de Guambía (pronunciación de lemas, oraciones contextuales y réplicas dialógicas) e ilustraciones o fotografías etnográficas de alta relevancia cultural (territorio, vestimenta, tejidos, botánica y vida cotidiana).

El diseño de estos componentes técnicos presenta cuatro desafíos clave:

1. **Gobernanza cultural y privacidad comunitaria**: Las grabaciones y fotografías no deben publicarse sin la ratificación explícita de un revisor cultural (`cultural_reviewer` / `super_admin`), respetando la bandera `PUBLIC_ONLY_RATIFIED` para proteger el patrimonio inmaterial y evitar la difusión de contenidos no consentidos o fonéticamente incorrectos.
2. **Conectividad rural intermitente y streaming eficiente**: Los usuarios en resguardos indígenas acceden mediante redes móviles limitadas o conexiones escolares intermitentes. Es inviable descargar archivos de audio completos para escuchar una pronunciación breve de 2 segundos; se requiere soporte estricto de streaming con HTTP `206 Partial Content` (cabeceras `Range` y `Accept-Ranges: bytes`) para reproducción progresiva y scrubbing instantáneo.
3. **Seguridad contra ataques de *Path Traversal* y archivos maliciosos**: La subida de medios debe desacoplar el nombre original del nombre físico en disco usando identificadores opacos (UUIDv4) y verificar la integridad binaria de los archivos mediante análisis de *magic bytes* antes de persistirlos, previniendo la subida de ejecutables disfrazados.
4. **Preservación del rendimiento del portal web (R-023)**: El reproductor de audio y el visor de medios no deben inflar el bundle inicial de la PWA (`index-*.js` $\le +5\%$ sobre la línea base de 38.9 kB), debiendo utilizar APIs nativas del navegador (`HTMLAudioElement`) con un orquestador de instancia única (*single-instance*) y el componente existente `LazyImage`.

## Decisión

1. **Entidad `MedioCultural` (`medios_culturales`) y modelo relacional**:
   - Se crea la tabla `medios_culturales` vinculada de forma opcional pero coherente a `SentidoLexico` (`sentido_id`) y/o `FormaNamtrik` (`forma_id`).
   - Cada medio posee un `uuid` (UUIDv4) público opaco, tipo (`audio` / `imagen`), propósito específico (`pronunciacion_lema`, `contexto_oracion`, `pregunta_dialogo`, `respuesta_dialogo`, `ilustracion_cultural`, `fotografia_territorio`), estado editorial (`borrador` / `ratificado`), metadatos técnicos (mimetype, tamaño, duración en segundos, dimensiones en píxeles, hash SHA-256) y metadatos etnográficos (hablante/autor, variante dialectal, descripción en español y Namtrik, licencia comunitaria Misak).
   - Se implementa el ciclo de gobernanza: estado inicial obligatorio `borrador`, ratificación mediante evento auditable `MEDIA_RATIFY` que actualiza a `ratificado` e indexación de búsqueda.

2. **Abstracción `StorageService` y validación estricta por Magic Bytes**:
   - Se define una interfaz de puerto en el backend (`StorageService`) con implementación por defecto en disco local (`LocalStorageService`) para entornos de desarrollo y Docker (`uploads/media/{audios,imagenes}`).
   - La arquitectura permite enchufar en el futuro adaptadores de nube (S3, Cloudflare R2 o Cloudinary) sin modificar los casos de uso ni los controladores.
   - Todo archivo recibido se valida extrayendo y comparando sus primeros bytes binarios (*magic bytes*) contra una lista blanca segura (`audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/webm`; `image/webp`, `image/jpeg`, `image/png`, `image/svg+xml`), rechazando extensiones engañosas con HTTP `400 Bad Request`.
   - Se imponen cuotas estrictas de subida: audios $\le 5$ MB e imágenes $\le 10$ MB.

3. **Streaming HTTP Range 206 para recursos de audio**:
   - El endpoint público de streaming (`GET /api/media/:uuid/stream`) soporta rangos parciales mediante `fs.createReadStream` con opciones `{ start, end }`.
   - Cuando se recibe la cabecera `Range: bytes=X-Y`, responde con código HTTP `206 Partial Content`, `Content-Range: bytes X-Y/Total`, `Accept-Ranges: bytes` y el `Content-Type` correspondiente, permitiendo reproducción instantánea sin latencia inicial.

4. **Reproductor Single-Instance y Visor Modal Accesible en Frontend**:
   - Se implementa un contexto global liviano `AudioPlayerContext` que gestiona un único objeto `HTMLAudioElement` en memoria. Al iniciar cualquier audio, se cancela y limpia cualquier reproducción anterior (R-010).
   - El componente `AudioPlayButton` ofrece un tap target accesible $\ge 48 \times 48$ px, etiquetas `aria-label` bilingües y estados visuales (inactivo, cargando, reproduciendo, pausado, error).
   - Las ilustraciones se renderizan con `LazyImage` (Constitución C3.3) y cuentan con un visor modal accesible (`role="dialog"`, `aria-modal="true"`, foco atrapado, cierre con Escape y tap targets $\ge 48$ px).
   - Se configura Workbox en `vite.config.ts` con estrategia `CacheFirst` para audios (máx 100 archivos, TTL 30 días) e imágenes (máx 50 archivos, TTL 30 días).

## Consecuencias

- **Positivas**:
  - Experiencia auditiva rica y auténtica sin degradar el rendimiento de la aplicación en dispositivos móviles ni en conexiones rurales lentas.
  - Protección absoluta de la soberanía cultural Misak mediante revisión editorial obligatoria antes de la publicación abierta.
  - Inmunidad contra ataques de sobreescritura de archivos y ejecución remota de código gracias a UUIDs opacos y validación binaria estricta.
  - Reproducción de audio sin cacofonías (solo suena una pista a la vez en todo el cliente).
  - Consulta offline de pronunciaciones e ilustraciones visitadas en la PWA.
- **Negativas / Trade-offs**:
  - El almacenamiento local en disco en producción bajo contenedores efímeros requiere un volumen persistente compartido (`/app/uploads/media`); el diseño abstraído en `StorageService` minimiza el impacto al facilitar la transición a almacenamiento de objetos cuando la escala lo demande.
