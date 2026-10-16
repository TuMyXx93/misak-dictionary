---
id: 006-panel-admin-gobierno
version: 1.0.1
status: approved
created: 2026-10-16
approved: 2026-10-16
cultural-gate: true
---

# 006 — Panel administrativo y gobierno editorial del léxico

## Contexto

Tras la Spec 005 el corpus v1 (`1.351` sentidos, `1.451` formas, 65 nodos taxonómicos) vive en
PostgreSQL con `estado` (`borrador` | `ratificado`), `version`, `observacion_editorial` y
`deleted_at`. La autenticación (Spec 002) y parte de la API administrativa ya existen, pero
**no hay ninguna interfaz** para que el equipo lingüístico trabaje con ellas, y faltan piezas
de backend para el flujo editorial completo.

### Línea base verificada en el código (`dev` @ `bd80a68`)

| Capacidad | Estado | Ubicación |
| :-- | :-- | :-- |
| Login / refresh / logout con rate limit | ✅ existe | `presentation/routes/authRoutes.ts` (`/auth/*`) |
| Asignar / revocar roles (solo `super_admin`, auditado, protege al último root) | ✅ existe | `api/admin/routes/adminUserRoutes.ts` |
| Papelera: listar y restaurar (campo, subcampo, microcampo, sentido) con auditoría | ✅ existe | `PapeleraUseCase`, `GET /api/admin/dictionary/papelera` |
| CRUD de campos / subcampos / microcampos | ✅ existe | `adminDictionaryRoutes.ts` |
| CRUD de sentidos y formas (modelo Spec 005) | ❌ solo existe CRUD del modelo 1 legado (`/words/modelo1`) | — |
| Endpoint de ratificación (`taxonomy:ratify`) | ❌ el permiso existe, **no hay ruta que lo use** | `shared/auth/permissions.ts` |
| Consulta de `audit_log` y listado de usuarios | ❌ no existe | — |
| Identidad de la sesión actual (`/auth/me`) | ❌ no existe | — |
| UI de login, panel y rutas protegidas | ❌ no existe | `apps/web-client/src/pages` |

### Roles y permisos reales (`shared/auth/permissions.ts`)

| Rol | Permisos | Alcance previsto en esta spec |
| :-- | :-- | :-- |
| `super_admin` | `dictionary:write`, `taxonomy:ratify` | Todo, incluida gestión de usuarios y purga |
| `admin` | `dictionary:write` | Supervisa contenido estructural |
| `content_admin` | `dictionary:write` | Edita sentidos/formas; **no ratifica** |
| `cultural_reviewer` | `taxonomy:ratify` | Ratifica; **no edita** estructura |
| `media_admin` | — | Reservado Fase 5 (medios) |
| `analytics_viewer` | — | Solo lectura de métricas/auditoría |

> Separación de funciones (ya vigente): quien edita no ratifica. Esta spec la **preserva**.

## Modelo de dominio

```
Sesión admin (JWT access + refresh rotado)
  └── Usuario ── roles ── permisos (resueltos en servidor por petición)

Sentido léxico ── estado: borrador ──(ratificar: taxonomy:ratify)──▶ ratificado
                      ▲                                                │
                      └────(editar contenido cultural: dictionary:write)┘
                      
Nodo / Sentido ── deleted_at ──(restaurar)──▶ activo
Todo cambio ──▶ audit_log (actor, entidad, antes/después, ip, user-agent)
```

## Requisitos (EARS)

### Acceso

- **R-001 (Login administrativo)** — CUANDO una persona visite `/admin` sin sesión válida, EL SISTEMA DEBERÁ redirigirla a `/admin/login`; el formulario DEBERÁ autenticar contra `POST /auth/login` y NO DEBERÁ distinguir entre «usuario inexistente» y «contraseña incorrecta» (Spec 002 R-011).
- **R-002 (Sesión y renovación)** — MIENTRAS exista una sesión, EL CLIENTE DEBERÁ renovar el access token vía `POST /auth/refresh` ante un `401` y reintentar la petición una sola vez; si el refresh falla, DEBERÁ cerrar la sesión local y volver al login. EL CLIENTE NO DEBERÁ persistir el refresh token en `localStorage` (preferir cookie `HttpOnly` o memoria — decisión en plan).
- **R-003 (Identidad actual)** — EL SISTEMA DEBERÁ exponer `GET /auth/me` con `{ userId, username, roles[], permissions[] }` para que la UI derive qué acciones mostrar. La UI usa los permisos solo para **ocultar** controles; la autoridad sigue siendo el servidor.
- **R-004 (Rutas protegidas por permiso)** — CUANDO una persona autenticada acceda a una sección sin el permiso requerido, EL SISTEMA DEBERÁ mostrar «Sin permiso» (`403`) sin revelar datos de la sección.
- **R-005 (Logout)** — CUANDO la persona cierre sesión, EL CLIENTE DEBERÁ invocar `POST /auth/logout`, descartar el estado de sesión y volver a la parte pública.

### Gestión de contenido (`dictionary:write`)

- **R-006 (Listado y filtros de sentidos)** — EL SISTEMA DEBERÁ ofrecer `GET /api/admin/dictionary/sentidos` paginado con filtros por nodo (`codigo` de campo/subcampo/microcampo, incluyendo descendientes), `estado`, texto (lema o glosa, insensible a diacríticos) y `tipo` (`estandar`|`dialogico`), incluyendo borradores.
- **R-007 (Edición de sentido y formas)** — EL SISTEMA DEBERÁ permitir editar un sentido (glosa, explicación, contexto namtrik, nombre científico, `observacion_editorial`, par dialógico) y sus formas (orden, lema, homónimo, categoría, variante, neologismo, rasgos) mediante `PATCH /api/admin/dictionary/sentidos/:id`, validando con Zod, aplicando la normalización `ɵ` aprobada y **control de concurrencia optimista** por `version` (`409` si la versión enviada está obsoleta).
- **R-008 (Creación de sentido)** — CUANDO se cree un sentido, EL SISTEMA DEBERÁ asignarle un `codigo` estable único (`<nodo>.E<NNN>` siguiendo la convención de la Spec 005), ubicarlo en exactamente un nivel (CHECK `num_nonnulls = 1`) y crearlo en estado `borrador`.
- **R-009 (Borrado lógico)** — CUANDO se elimine un sentido o nodo, EL SISTEMA DEBERÁ aplicar `deleted_at` (nunca borrado físico) y registrar el evento en `audit_log`.
- **R-010 (Edición reinicia ratificación)** — CUANDO se modifique un campo cultural (lema de forma, glosa, explicación, contexto, nombre científico) de un sentido `ratificado`, EL SISTEMA DEBERÁ devolverlo a `borrador`, limpiar `ratificado_por`/`ratificado_at`, incrementar `version` y auditar la transición. *(Decisión D-3 confirmada.)*

### Ratificación (`taxonomy:ratify`) — cultural-gate

- **R-011 (Ratificar)** — CUANDO una persona con `taxonomy:ratify` ratifique un sentido en `borrador`, EL SISTEMA DEBERÁ cambiar `estado` a `ratificado`, registrar `ratificado_por` y `ratificado_at`, incrementar `version` y auditar (`POST /api/admin/dictionary/sentidos/:id/ratificar`).
- **R-012 (Separación de funciones)** — EL SISTEMA NO DEBERÁ permitir que `content_admin` o `admin` (solo `dictionary:write`) ratifiquen, ni que `cultural_reviewer` (solo `taxonomy:ratify`) edite contenido; ambos casos responden `403`. EL SISTEMA DEBERÁ rechazar (`409`) que un usuario ratifique un sentido cuya última edición fue realizada por él mismo, **salvo** que posea `super_admin`. *(Decisión D-4 confirmada.)*
- **R-013 (Revertir ratificación)** — CUANDO una persona con `taxonomy:ratify` revierta un sentido `ratificado`, EL SISTEMA DEBERÁ devolverlo a `borrador` con motivo obligatorio (≥ 10 caracteres) registrado en `audit_log`.
- **R-014 (Cola de revisión)** — EL SISTEMA DEBERÁ ofrecer una vista «Pendientes de ratificación» (filtro `estado = borrador`) con contadores por campo semántico, accesible a `cultural_reviewer`, `super_admin` y lectura a `admin`.
- **R-015 (Ratificación de nodos)** — EL SISTEMA DEBERÁ permitir ratificar nombres y descripciones de Campos, Subcampos y Microcampos con las mismas reglas R-011..R-013. *(Nota v1.0.1: solo `campos_semanticos` tenía `estado`/`ratificado_*`; subcampos, microcampos y la ratificación de sentidos requieren la migración `0009` del plan.)*

### Papelera

- **R-016 (Papelera en UI)** — EL SISTEMA DEBERÁ mostrar la papelera existente (`GET /papelera`) y permitir restaurar con confirmación; un `409` por colisión de código/slug DEBERÁ mostrarse con su mensaje, sin modificar datos.
- **R-017 (Purga restringida)** — EL SISTEMA DEBERÁ ofrecer purga física **solo** a `super_admin`, solo para elementos con `deleted_at` ≥ 30 días, con confirmación escribiendo el `codigo` del elemento, **solo si no tiene dependencias activas**, y auditando el contenido previo completo. *(Decisión D-5 confirmada.)*

### Usuarios y auditoría

- **R-018 (Gestión de usuarios)** — EL SISTEMA DEBERÁ ofrecer a `super_admin` un listado de usuarios con sus roles (`GET /api/admin/users`) y reutilizar `POST/DELETE /api/admin/users/:id/roles` ya existentes para asignar/revocar; el último `super_admin` NO DEBERÁ poder perder su rol (invariante existente, ahora visible en UI).
- **R-019 (Consulta de auditoría)** — EL SISTEMA DEBERÁ exponer `GET /api/admin/audit` paginado y filtrable (actor, entidad, acción, rango de fechas) a `super_admin` y `analytics_viewer`, **sin** incluir contraseñas ni tokens (Spec 002 R-012).
- **R-020 (Auditoría de mutaciones)** — TODA mutación de esta spec (crear, editar, ratificar, revertir, borrar, restaurar, purgar, asignar rol) DEBERÁ registrar actor, entidad, `oldData`, `newData`, IP y user-agent.

### No funcionales

- **R-021 (Accesibilidad y UX)** — La UI administrativa DEBERÁ cumplir la Constitución C3.1–C3.4: `prefers-reduced-motion`, tap targets ≥ 48 px, teclado primero con foco visible y `aria-label` en controles icónicos.
- **R-022 (Fidelidad Namtrik)** — Los campos de texto Namtrik DEBERÁN preservar `ɵ` y diacríticos (NFC), mostrarse en fuente que los renderice y NO DEBERÁN ser alterados por la UI (sin trim interno, sin transliteración). Constitución C1.1/C1.3.
- **R-023 (Carga diferida)** — El panel DEBERÁ cargarse con `React.lazy` para no incrementar el bundle público (hoy ≈ 242 kB el chunk principal); el chunk público no DEBERÁ crecer más de 5 %.
- **R-024 (Seguridad)** — El panel NO DEBERÁ indexarse (`noindex`), DEBERÁ usar cabeceras `no-store` en respuestas autenticadas y el Service Worker PWA NO DEBERÁ cachear `/api/admin/*` ni `/auth/*`.

### Ratificación por microcampo y exposición pública (D-6, D-7)

- **R-025 (Ratificación por microcampo)** — EL SISTEMA DEBERÁ permitir ratificar **por lote** todos los sentidos en `borrador` de un microcampo (o subnivel) mediante `POST /api/admin/dictionary/nodos/:nivel/:id/ratificar-lote`, en **una única transacción** (todo o nada), con **lista de verificación obligatoria** confirmada por la persona revisora (ortografía `ɵ`, categorías gramaticales, glosas, nombres científicos), un único registro de auditoría de lote y uno por sentido. EL SISTEMA DEBERÁ rechazar el lote (`409`) si contiene sentidos cuya última edición fue de la misma persona revisora (R-012), listando los códigos afectados, sin ratificar ninguno. Los sentidos eliminados lógicamente NO DEBERÁN incluirse.
- **R-026 (Estado visible en la parte pública)** — MIENTRAS el corpus v1 no esté ratificado, la API pública DEBERÁ exponer `estado` por sentido y el cliente DEBERÁ mostrar una insignia accesible «En revisión» (texto, no solo color; contraste AA) en sentidos `borrador`. CUANDO el equipo active la bandera de configuración `PUBLIC_ONLY_RATIFIED`, la API pública DEBERÁ devolver únicamente sentidos `ratificado` sin cambios de código. La bandera es de servidor, auditada al cambiarse y solo modificable por `super_admin`.
- **R-027 (Progreso de ratificación)** — EL SISTEMA DEBERÁ mostrar en el panel el avance de ratificación por campo, subcampo y microcampo (`ratificados / total`) y permitir filtrar el árbol por «con pendientes».
- **R-028 (Custodia del root)** — EL SISTEMA DEBERÁ crear el `super_admin` inicial exclusivamente vía `ROOT_BOOTSTRAP_EMAIL`/`ROOT_BOOTSTRAP_PASSWORD` (Spec 002 R-008) usando una cuenta institucional del **Equipo Namtrik**; las credenciales NO DEBERÁN versionarse, registrarse en logs ni aparecer en la documentación, y la guía operativa DEBERÁ exigir cambio de contraseña en el primer acceso y al menos un segundo `super_admin` nominal para evitar punto único de falla.

## Criterios de aceptación (Gherkin)

### R-001 / R-004 — Acceso

```gherkin
Escenario: Visitante sin sesión es llevado al login
  Dado que no existe sesión
  Cuando visito "/admin/sentidos"
  Entonces soy redirigido a "/admin/login"

Escenario: Credenciales inválidas no revelan la causa
  Cuando envío un usuario inexistente o una contraseña incorrecta
  Entonces veo el mismo mensaje genérico en ambos casos

Escenario: Rol sin permiso no ve la sección
  Dado un usuario con rol "analytics_viewer"
  Cuando visito "/admin/sentidos/nuevo"
  Entonces veo "Sin permiso" y no se carga ningún dato de sentidos
```

### R-007 — Edición con concurrencia optimista

```gherkin
Escenario: Edición exitosa incrementa la versión
  Dado el sentido "C1.S1.M5.E003" en versión 1 y un usuario "content_admin"
  Cuando guarda un cambio enviando "version: 1"
  Entonces la respuesta es 200 con "version: 2"
  Y existe un registro en audit_log con oldData y newData

Escenario: Edición sobre versión obsoleta
  Dado que otro usuario ya llevó el sentido a la versión 2
  Cuando se envía un PATCH con "version: 1"
  Entonces la respuesta es 409 y no se modifica el sentido

Escenario: La normalización ɵ se aplica al guardar
  Cuando guardo un lema con el carácter alterno aprobado para ɵ
  Entonces se persiste con "ɵ" y no se alteran otros caracteres
```

### R-010 / R-011 / R-012 — Ratificación y separación de funciones

```gherkin
Escenario: Ratificación exitosa
  Dado un sentido en "borrador" y un usuario "cultural_reviewer" distinto del último editor
  Cuando ratifica el sentido
  Entonces "estado" = "ratificado", "ratificado_por" = su usuario y "ratificado_at" no es nulo
  Y se audita la transición

Escenario: Quien edita no ratifica
  Dado un usuario "content_admin"
  Cuando intenta ratificar un sentido
  Entonces la respuesta es 403

Escenario: Quien ratifica no edita
  Dado un usuario "cultural_reviewer"
  Cuando intenta editar la glosa de un sentido
  Entonces la respuesta es 403

Escenario: Auto-ratificación bloqueada
  Dado un usuario "admin" con "taxonomy:ratify" otorgado que fue el último editor
  Cuando intenta ratificar su propia edición
  Entonces la respuesta es 409

Escenario: Editar un ratificado lo devuelve a borrador
  Dado un sentido "ratificado"
  Cuando un "content_admin" modifica su glosa
  Entonces "estado" = "borrador" y se limpian "ratificado_por" y "ratificado_at"
```

### R-013 — Revertir

```gherkin
Escenario: Revertir exige motivo
  Dado un sentido "ratificado"
  Cuando un revisor lo revierte con motivo de menos de 10 caracteres
  Entonces la respuesta es 400 y el estado no cambia
```

### R-016 / R-017 — Papelera y purga

```gherkin
Escenario: Restaurar con colisión de código
  Dado un sentido eliminado cuyo "codigo" ya lo usa un sentido activo
  Cuando intento restaurarlo
  Entonces veo el error 409 y el elemento permanece en la papelera

Escenario: Solo super_admin purga
  Dado un elemento con "deleted_at" de hace 45 días
  Cuando un "admin" intenta purgarlo
  Entonces la respuesta es 403

Escenario: Purga bloqueada por antigüedad
  Dado un elemento eliminado hace 5 días
  Cuando un "super_admin" intenta purgarlo
  Entonces la respuesta es 409 con el motivo "retención mínima de 30 días"

Escenario: Purga exige confirmar el código
  Cuando un "super_admin" confirma con un código distinto al del elemento
  Entonces la purga no se ejecuta
```

### R-018 / R-019 — Usuarios y auditoría

```gherkin
Escenario: El último super_admin no puede perder su rol
  Dado un único usuario con rol "super_admin"
  Cuando se intenta revocarle ese rol desde el panel
  Entonces el panel muestra el error 409 y el rol se conserva

Escenario: La auditoría no expone secretos
  Cuando un "super_admin" consulta GET /api/admin/audit
  Entonces ningún registro contiene contraseñas, hashes ni tokens
```

### R-023 / R-024 — Rendimiento y seguridad

```gherkin
Escenario: El bundle público no crece por el panel
  Cuando se ejecuta el build de producción
  Entonces el chunk principal crece menos de 5 % respecto a v0.4.0-alpha.0
  Y el código del panel está en chunks cargados bajo demanda

Escenario: El Service Worker no cachea rutas sensibles
  Dado el SW generado por el build
  Entonces ninguna regla de precache o runtime cache coincide con "/api/admin" ni "/auth"
```

### R-025 / R-026 / R-028 — Lote por microcampo, insignia pública y root

```gherkin
Escenario: Ratificación por lote atómica
  Dado el microcampo "C1.S1.M5" con 22 sentidos en "borrador" y la lista de verificación confirmada
  Cuando un "cultural_reviewer" ratifica el lote
  Entonces los 22 sentidos quedan "ratificado" en una sola transacción
  Y existe 1 registro de auditoría de lote y 22 de sentido

Escenario: Lote rechazado por auto-ratificación
  Dado que 2 de los 22 sentidos fueron editados por la misma persona revisora
  Cuando intenta ratificar el lote
  Entonces la respuesta es 409 con los 2 códigos afectados
  Y ningún sentido cambia de estado

Escenario: Lote sin lista de verificación
  Cuando se envía el lote sin confirmar la lista de verificación
  Entonces la respuesta es 400 y no se modifica nada

Escenario: Insignia «En revisión» en la parte pública
  Dado un sentido en "borrador"
  Cuando una persona lo consulta en la página pública
  Entonces ve la insignia con el texto "En revisión"

Escenario: Modo solo ratificados
  Dado "PUBLIC_ONLY_RATIFIED" activo
  Cuando la API pública lista sentidos de un microcampo
  Entonces solo devuelve los de estado "ratificado"

Escenario: Solo super_admin cambia la bandera pública
  Cuando un "admin" intenta activar "PUBLIC_ONLY_RATIFIED"
  Entonces la respuesta es 403

Escenario: Credenciales del root fuera del repositorio
  Cuando se ejecuta la búsqueda de secretos sobre el repositorio
  Entonces no aparece ninguna contraseña ni correo de root versionados
```

## Decisiones (resueltas el 2026-10-16 por el equipo)

| ID | Decisión | Resolución | Reflejo en la spec |
| :-- | :-- | :-- | :-- |
| **D-1** | Identidad del `super_admin` inicial | **Equipo Namtrik** (cuenta institucional), con segundo `super_admin` nominal | R-028 |
| **D-2** | Roles actuales suficientes | **Sí**: se mantienen los 6; `analytics_viewer` lee auditoría; `media_admin` reservado a Fase 5 | Tabla de roles, R-019 |
| **D-3** | Editar un ratificado lo devuelve a `borrador` | **Sí** | R-010 |
| **D-4** | Sin auto-ratificación (salvo `super_admin`) | **Sí** | R-012, R-025 |
| **D-5** | Purga: solo `super_admin`, ≥ 30 días, sin dependencias | **Aprobado** | R-017 |
| **D-6** | Visibilidad pública durante la revisión | Mostrar todo con insignia «En revisión»; bandera `PUBLIC_ONLY_RATIFIED` para pasar a solo ratificados | R-026 |
| **D-7** | Granularidad de ratificación | **Por microcampo**, en lote atómico con lista de verificación | R-025, R-027 |
| **D-8** | Idioma de la UI administrativa | Español | R-021 |

> D-6 y D-8 se asumieron con el valor propuesto al no haber objeción; cualquier ajuste
> posterior requiere nueva versión de esta spec.

## Fuera de alcance

- Subida y reproducción de audio e ilustraciones (Fase 5).
- Campos 5, 6 y 7 (pendientes de material lingüístico) — el panel los soportará sin cambios al operar sobre `home_slots`/taxonomía.
- Recuperación de contraseña por correo y 2FA (evaluar en spec posterior).
- Métricas analíticas del uso público.

## Trazabilidad

- Spec 002 (`002-auth-rbac`): R-001..R-012 reutilizados; se agrega `GET /auth/me`.
- Spec 004 (`004-esquema-contenido`): papelera, ratificación de nodos, `audit_log`.
- Spec 005 (`005-sentido-formas-lexico`): modelo `SentidoLexico`/`FormaNamtrik` y estados.
- Constitución: C1.1, C1.3, C2.3, C3.1–C3.4, C4.1, C4.2.
