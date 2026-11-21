---
id: 008-gobierno-usuarios-sesion
version: 0.1.0
status: archived
cultural-gate: true
---

# Gobierno de Usuarios, Persistencia de Sesión y Humanización de Interfaz

> **Nota de Errata / Evolución Arquitectónica (Spec 013 · ADR-0009, 2026-11-11):**
> El enrutamiento inteligente post-login (`R-007`), el saneamiento de `location.state.from` tras cierre de sesión voluntario, la fuente única de verdad de rutas administrativas (`ADMIN_ROUTE_POLICIES`) y la revocación efectiva de acceso ante cuentas suspendidas (`isActive: false` en `requirePasswordChanged`) fueron endurecidos en [`specs/features/013-endurecimiento-rbac-flujo-editorial/spec.md`](../../features/013-endurecimiento-rbac-flujo-editorial/spec.md) y [`specs/adr/0009-endurecimiento-rbac-y-maquina-estados-editorial.md`](../../adr/0009-endurecimiento-rbac-y-maquina-estados-editorial.md).

## Contexto

El Panel Editorial Misak (Equipo Namtrik) es utilizado por diversos roles comunitarios, muchos de ellos no técnicos (coordinadores, editores, revisores y gestores culturales). La auditoría integral del módulo de usuarios y del flujo de autenticación detectó 4 fallos funcionales críticos (desactivación inmediata sin confirmación ni revocación de tokens, desalineación del vocabulario de permisos entre frontend y backend que impedía el acceso a roles nuevos, pérdida de sesión al refrescar con consumo de cuota por refresh desconfigurado, y mensajes opacos/genéricos ante bloqueos y fallos de base de datos), sumado a una interfaz con tecnicismos en inglés y desajustes ergonómicos (doble scroll, visualización de códigos internos con guiones bajos). Esta especificación define los requisitos y criterios de aceptación para una experiencia moderna, segura, culturalmente coherente y técnicamente robusta.

## Requisitos (EARS)

- **R-001 (Persistencia de Sesión)** — CUANDO se recargue cualquier vista del panel administrativo (`/admin/*`) existiendo una cookie `misak_rt` válida, EL SISTEMA DEBERÁ restaurar la sesión en memoria (`user` y `accessToken`) de forma transparente sin expulsar al usuario ni consumir cuotas de reintento.
- **R-002 (Catálogo Unificado de Permisos)** — EL SISTEMA DEBERÁ resolver los permisos del usuario a partir de una matriz canónica y tipada compartida entre backend y frontend, eliminando divergencias de nomenclatura (`taxonomy:read` vs `dictionary:read`) y garantizando que cada rol acceda exactamente a sus módulos autorizados.
- **R-003 (Manejo Preciso de Errores en Login)** — CUANDO el inicio de sesión falle o enfrente restricciones, EL SISTEMA DEBERÁ clasificar el incidente mediante códigos tipados (`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_ACCOUNT_SUSPENDED`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `NETWORK_ERROR`) y renderizar una comunicación comprensible y empática (incluyendo cuenta regresiva en bloqueos temporales).
- **R-004 (Suspensión Segura de Cuentas con Confirmación)** — CUANDO un administrador decida suspender el acceso a una cuenta, EL SISTEMA DEBERÁ requerir confirmación modal obligatoria con captura de motivo opcional, revocar en el backend todas las sesiones activas del usuario afectado e impedir la auto-suspensión del usuario autenticado en la sesión actual.
- **R-005 (Asignación de Clave Temporal y Restablecimiento)** — CUANDO un administrador restablezca la contraseña de un usuario desde su expediente, EL SISTEMA DEBERÁ generar una contraseña temporal, exhibirla una única vez con controles de visibilidad y copiado al portapapeles, revocar sesiones previas y forzar `mustChangePassword: true`.
- **R-006 (Humanización y Erradicación de Tecnicismos)** — EL SISTEMA DEBERÁ presentar los 6 roles del sistema exclusivamente con denominaciones en español y niveles de acceso comprensibles, suprimir códigos con guiones bajos (`super_admin`, `content_admin`, etc.), eliminar barras de desplazamiento internas secundarias (doble scroll), normalizar la grilla de datos a 2 columnas y homogenizar los placeholders de ejemplo con el prefijo `Ej.`.
- **R-007 (Enrutamiento Inteligente Post-Login)** — CUANDO un usuario complete su autenticación, EL SISTEMA DEBERÁ redirigirlo dinámicamente a la primera sección permitida por su perfil, en lugar de forzar un destino estático inaccesible.

## Criterios de Aceptación (Gherkin)

### R-001: Persistencia transparente de sesión al recargar la página

```gherkin
Escenario: Recarga de página con cookie de refresh activa
  Dado que el usuario "editor.namtrik" ha iniciado sesión en el panel administrativo
  Y posee una cookie HttpOnly "misak_rt" válida en el navegador
  Cuando presiona recargar (F5) en la ruta "/admin/usuarios"
  Entonces el cliente HTTP envía la petición con "X-Client: web-admin"
  Y el backend renueva el access token y retorna el perfil resuelto
  Y la vista "/admin/usuarios" permanece visible sin redirigir al login ni mostrar errores
```

### R-002: Acceso efectivo para roles editoriales y analistas

```gherkin
Escenario: Usuario con rol Editor de Contenido accede a léxico y sentidos
  Dado un usuario recién registrado con rol "content_admin" ("Editor de Contenido")
  Cuando inicia sesión exitosamente en el panel administrativo
  Entonces su matriz de permisos incluye "dictionary:read" y "dictionary:write"
  Y el menú lateral exhibe "Léxico y Sentidos"
  Y la vista carga el corpus léxico sin mensajes de "Sin permiso para acceder a esta sección"
```

### R-003: Comunicación de error ante bloqueo temporal por fuerza bruta

```gherkin
Escenario: Usuario bloqueado por 5 intentos fallidos
  Dado un usuario que falló su contraseña en 5 oportunidades consecutivas
  Cuando intenta autenticarse nuevamente con sus credenciales
  Entonces el sistema responde con código HTTP 423 o payload tipado "AUTH_ACCOUNT_LOCKED"
  Y la interfaz del login muestra el aviso "Cuenta bloqueada temporalmente por seguridad"
  Y visualiza un contador regresivo de minutos y segundos restantes
  Y el botón de ingreso se deshabilita temporalmente
```

### R-004: Suspensión de cuenta con revocación inmediata y confirmación

```gherkin
Escenario: Administrador suspende acceso a un usuario
  Dado un administrador autenticado en la vista de expediente del usuario "test.cuatro"
  Cuando pulsa "Suspender acceso"
  Entonces se despliega un diálogo modal de confirmación solicitando confirmación y motivo
  Y al confirmar, el backend actualiza "is_active" a falso
  Y revoca todas las sesiones abiertas de "test.cuatro" en la base de datos
  Y si "test.cuatro" realiza una petición posterior, es expulsado inmediatamente con sesión inválida
```

### R-005: Asignación de clave temporal en expediente

```gherkin
Escenario: Administrador asigna clave temporal
  Dado un administrador editando un usuario en el modal de expediente
  Cuando pulsa "Asignar clave temporal"
  Entonces se genera una contraseña robusta de al menos 10 caracteres
  Y se muestra en pantalla con botón de copiar al portapapeles y botón para revelar caracteres
  Y el usuario pasa a estado "Cambio de clave pendiente"
  Y al ingresar dicho usuario con esa clave, el sistema le exige cambiar su contraseña
```

### R-006: Lenguaje profesional sin tecnicismos en formulario y tabla

```gherkin
Escenario: Visualización de roles y etiquetas en modal de creación y tabla
  Dado el modal de "Crear nuevo usuario"
  Cuando el usuario visualiza las opciones de roles
  Entonces los roles se despliegan en una lista visible completa sin barra de scroll interna
  Y se leen como: "Superadministrador", "Administrador", "Revisor Cultural", "Editor de Contenido", "Gestor de Medios" y "Analista"
  Y en ningún lugar se exhiben cadenas como "super_admin", "cultural_reviewer" ni "en crudo"
  Y todos los campos de texto muestran ejemplos con formato "Ej. ..."
```

### R-007: Enrutamiento inteligente a la primera sección permitida

```gherkin
Escenario: Analista inicia sesión
  Dado un usuario con rol exclusivo "Analista" (permiso "audit:read")
  Cuando ingresa exitosamente sus credenciales
  Entonces es redirigido directamente a "/admin/auditoria"
  Y no a "/admin/sentidos" donde no tiene facultades de lectura
```

## Fuera de Alcance

- Envío de correos SMTP salientes para recuperación de contraseña (las cuentas `.local` e institucionales operan vía restablecimiento asistido en el panel).
- Múltiples factores de autenticación biométrica (MFA WebAuthn/FIDO2), reservado para fases ulteriores de gobernanza institucional.

## Trazabilidad

| Requisito | Componentes Afectados | Suites de Prueba |
| :--- | :--- | :--- |
| **R-001** | `adminHttp.ts`, `RequireAuth.tsx`, `AuthController.ts` | `adminHttp.refresh.test.ts`, `RequireAuth.test.tsx` |
| **R-002** | `permissions.ts`, `router/index.tsx`, `AdminLayout.tsx` | `permissions.contract.test.ts`, `AdminLayout.test.tsx` |
| **R-003** | `LoginPage.tsx`, `AuthController.ts`, `LoginUseCase.ts` | `LoginPage.test.tsx`, `LoginUseCase.test.ts` |
| **R-004** | `UsuariosPage.tsx`, `SuspendUserDialog.tsx`, `adminUserRoutes.ts` | `UsuariosPage.test.tsx`, `adminUserRoutes.test.ts` |
| **R-005** | `ResetPasswordPanel.tsx`, `UsuariosPage.tsx`, `adminUserRoutes.ts` | `UsuariosPage.test.tsx`, `ResetPasswordUseCase.test.ts` |
| **R-006** | `userCopy.ts`, `roleCatalog.ts`, `UserFormFields.tsx` | `UsuariosPage.test.tsx`, `UserFormFields.test.tsx` |
| **R-007** | `authStore.ts`, `LoginPage.tsx`, `router/index.tsx` | `authStore.test.ts`, `LoginPage.test.tsx` |

> *(Nota de trazabilidad Spec 014 R-015: El contenedor del menú lateral en `AdminLayout.tsx` evolucionó para acotar altura a `calc(100dvh - var(--admin-header-h))` con scroll interno independiente en `<nav>`, restauración de foco del cajón móvil y limpieza reactiva de `inert` vía `matchMedia('(min-width: 64rem)')` cuando los 9 módulos están visibles.)*
