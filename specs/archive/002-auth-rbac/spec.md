---
id: 002-auth-rbac
version: 0.1.0
status: archived
cultural-gate: false
created: 2026-10-15
approved: 2026-10-15
---

# 002 — Autenticación y autorización RBAC (equipo lingüístico)

## Contexto

El diccionario evoluciona a un sistema de mantenimiento donde solo el personal del equipo
lingüístico autorizado puede crear, revisar y ratificar contenido. El backend ya cuenta con
autenticación básica (JWT + bcryptjs, tabla `sessions`, modelo `User`) heredada de la
implementación anterior. Esta feature redefine el módulo de seguridad sobre la nueva base
de datos: acceso restringido por login, rol administrador (root) con gestión de permisos,
Argon2id para credenciales, y auditoría de eventos de acceso. Se implementa después de la
infraestructura contenerizada (spec de containerización) y sobre el nuevo esquema (auditoría,
procedencia, i18n) — ver `specs/archive/001-campos-responsivos` para el patrón de ciclo.

## Requisitos (EARS)

- **R-001** — CUANDO un usuario no autenticado solicite un endpoint protegido, EL SISTEMA
  DEBERÁ responder `401` sin revelar si el recurso existe.
- **R-002** — CUANDO un usuario autenticado sin el rol requerido solicite un endpoint
  protegido, EL SISTEMA DEBERÁ responder `403` con cuerpo de error estandarizado.
- **R-003** — MIENTRAS el endpoint sea de autenticación (`/auth/login`, `/auth/refresh`),
  EL SISTEMA DEBERÁ aplicar rate limiting específico más estricto que el límite global
  (mínimo: 5 intentos / 15 min / IP+username).
- **R-004** — CUANDO se almacene o actualice una credencial, EL SISTEMA DEBERÁ usar
  Argon2id con parámetros configurables por entorno (valores por defecto alineados a
  OWASP: m≥19MiB, t≥2, p≥1; objetivo operativo m=64MiB, t=3, p=4).
- **R-005** — CUANDO un usuario con hash legacy bcrypt se autentique exitosamente, EL
  SISTEMA DEBERÁ rehashear la contraseña con Argon2id y actualizar el registro en la
  misma operación, sin requerir reset de contraseña.
- **R-006** — CUANDO se emita un refresh token, EL SISTEMA DEBERÁ rotarlo (el token
  anterior queda invalidado) y detectar reuso: si se presenta un refresh token ya
  rotado, EL SISTEMA DEBERÁ invalidar toda la familia de sesiones del usuario.
- **R-007** — CUANDO un rol `root` cree, modifique o revoque permisos de usuario, EL
  SISTEMA DEBERÁ registrar el evento en `audit_log` (actor, objetivo, cambio, timestamp).
- **R-008** — CUANDO el sistema arranque con la variable `ROOT_BOOTSTRAP_EMAIL` definida
  y no exista ningún usuario con rol `root`, EL SISTEMA DEBERÁ crear el usuario root
  inicial con la contraseña de `ROOT_BOOTSTRAP_PASSWORD` hasheada en Argon2id.
- **R-009** — MIENTRAS no exista ningún usuario `root`, EL SISTEMA NO DEBERÁ exponer
  endpoints de gestión de permisos (deben responder `503` o equivalente) — salvo el
  endpoint de bootstrap del propio root.
- **R-010** — CUANDO un usuario cierre sesión, EL SISTEMA DEBERÁ invalidar su refresh
  token activo y registrar el evento de logout en `audit_log`.
- **R-011** — El SISTEMA NO DEBERÁ almacenar contraseñas en texto plano, logs ni
  telemetría; los mensajes de error de autenticación NO DEBERÁN distinguir entre
  "usuario inexistente" y "contraseña incorrecta".
- **R-012** — CUANDO se listen intentos de acceso (exitosos y fallidos), EL SISTEMA
  DEBERÁ registrarlos en `audit_log` sin incluir la contraseña ni el token.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Endpoint protegido sin token
  Dado un request sin header Authorization ni cookie de sesión
  Cuando se solicita GET /api/admin/dictionary/términos
  Entonces la respuesta es 401
  Y el cuerpo no revela si el recurso existe
```

### R-003

```gherkin
Escenario: Bloqueo por fuerza bruta en login
  Dado 5 intentos fallidos de login desde la misma IP para el mismo username en 15 minutos
  Cuando se intenta un sexto login
  Entonces la respuesta es 429
  Y el intento queda registrado en audit_log
```

### R-004 / R-011

```gherkin
Escenario: Verificación de hash con parámetros OWASP
  Dado un usuario registrado con contraseña "correct horse battery staple"
  Cuando se inspecciona el hash almacenado
  Entonces el hash tiene formato Argon2id ($argon2id$)
  Y los parámetros m, t, p cumplen los mínimos configurados (m>=19456, t>=2, p>=1)
  Y ningún log ni respuesta contiene la contraseña en claro
```

### R-005

```gherkin
Escenario: Migración transparente de credencial legacy
  Dado un usuario con hash bcrypt legacy ($2a$/$2b$)
  Cuando el usuario hace login con la contraseña correcta
  Entonces el login es exitoso
  Y el hash almacenado pasa a ser Argon2id
  Y el usuario no recibe solicitud de cambio de contraseña
```

### R-006

```gherkin
Escenario: Rotación de refresh y detección de reuso
  Dado una familia de sesiones activa para el usuario
  Cuando se usa un refresh token ya rotado
  Entonces todas las sesiones de esa familia se invalidan
  Y se registra el evento de seguridad en audit_log
```

### R-008 / R-009

```gherkin
Escenario: Bootstrap del root inicial
  Dado una base de datos sin usuarios y ROOT_BOOTSTRAP_EMAIL/PASSWORD definidos
  Cuando el sistema arranca
  Entonces existe exactamente un usuario con rol root
  Y su contraseña está hasheada con Argon2id
  Y los endpoints de gestión de permisos pasan a estar disponibles
```

### R-007

```gherkin
Escenario: Auditoría de cambio de permisos
  Dado una sesión autenticada como root
  Cuando root asigna el rol "linguist" al usuario "ana"
  Entonces audit_log contiene actor=root, objetivo=ana, cambio=rol asignado, timestamp
```

## Fuera de alcance

- Pipeline de importación masiva de datos (spec posterior; consume RBAC, no lo define).
- Rediseño del esquema de contenido (i18n, audio, procedencia): especificado aparte;
  esta feature asume su existencia pero no la implementa.
- Migración de contenido de la base anterior (explícitamente fuera de alcance).
- Autenticación de usuarios finales del diccionario (solo personal autorizado).
- SSO/OAuth externo (evaluar solo si una institución asociada lo requiere).

## Trazabilidad

| Requisito    | Archivos                                         | Tests |
| ------------ | ------------------------------------------------ | ----- |
| R-001..R-012 | _(se completa en Fase C: aplicación del módulo)_ |       |
