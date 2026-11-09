# Runbook Operativo: Cuenta Super Admin Inicial y Gobernanza (R-028)

**Feature**: Spec 006 — Panel Administrativo y Gobierno Editorial del Léxico  
**Entidad Responsable**: Equipo Namtrik / Cabildo Guambiano  
**Nivel de Clasificación**: Confidencial / Operaciones Críticas  

---

## 1. Propósito y Modelo de Gobernanza

Este runbook describe el procedimiento operativo estándar para la inicialización, primer acceso, cambio de contraseña obligatorio y creación del segundo administrador con rol `super_admin` en el Diccionario Cultural Misak.

### Principios Fundamentales
1. **Cuenta Institucional del Equipo Namtrik**: La cuenta superadministradora principal pertenece colectivamente al *Equipo Namtrik* y al Cabildo, no a un individuo.
2. **Segundo Administrador Nominal**: Por resiliencia operativa y para evitar puntos únicos de fallo, se debe crear un segundo `super_admin` nominal asignado a un responsable técnico o lingüístico formalmente designado.
3. **Bloqueo Incondicional de Primer Acceso (`must_change_password = true`)**: El servicio de inicialización (`RootBootstrapService`) marca la cuenta root con `must_change_password: true`. La API bloquea con `403 Forbidden` cualquier consulta o modificación en `/api/admin/*` hasta que la contraseña sea cambiada exitosamente.

---

## 2. Inicialización Automática (`RootBootstrapService`)

Al levantar el servicio de backend por primera vez, `RootBootstrapService` ejecuta de forma idempotente:
- Verifica si ya existe un usuario con rol `super_admin`.
- Si no existe:
  - Crea el usuario institucional con el identificador asignado al Equipo Namtrik.
  - Asigna el rol `super_admin`.
  - Establece `must_change_password = true`.
  - Genera un hash Argon2id a partir del secreto `INITIAL_ROOT_PASSWORD` suministrado en variables de entorno seguras de despliegue.
  - Registra el evento en la bitácora transaccional de auditoría (`audit_log`).

> [!WARNING]
> Nunca utilice contraseñas predecibles o hardcodeadas en código fuente. `INITIAL_ROOT_PASSWORD` debe inyectarse a través del gestor de secretos de la infraestructura (Vault / GitHub Secrets / Docker Secrets).

---

## 3. Procedimiento de Primer Acceso y Cambio de Contraseña

### Paso 1: Autenticación inicial
El administrador designado del Equipo Namtrik inicia sesión desde la interfaz web o mediante petición HTTP con cabecera de cliente administrativo:

```http
POST /auth/login HTTP/1.1
Host: api.diccionario.misak.edu.co
Content-Type: application/json
X-Client: web-admin

{
  "username": "namtrik_admin",
  "password": "<CONTRASEÑA_TEMPORAL_DE_DESPLIEGUE>"
}
```

La respuesta devuelve el token de acceso JWT y establece la cookie segura `misak_rt` (`HttpOnly`, `SameSite=Lax`, `Path=/auth`, `Secure`).

### Paso 2: Verificación de estado de cuenta
Al consultar el perfil:

```http
GET /auth/me HTTP/1.1
Authorization: Bearer <ACCESS_TOKEN>
```

Se confirma la identidad y la restricción activa:
```json
{
  "userId": "1",
  "username": "namtrik_admin",
  "roles": ["super_admin"],
  "permissions": ["dictionary:read", "dictionary:write", "taxonomy:ratify", "audit:read"],
  "mustChangePassword": true
}
```

Cualquier intento de acceder a `/api/admin/dictionary/*` o `/api/admin/settings/*` antes de cambiar la contraseña retornará:
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Debe cambiar su contraseña antes de continuar"
}
```

### Paso 3: Cambio de contraseña definitivo
El administrador debe ejecutar el cambio de credencial:

```http
POST /auth/change-password HTTP/1.1
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "actual": "<CONTRASEÑA_TEMPORAL_DE_DESPLIEGUE>",
  "nueva": "<NUEVA_CONTRASEÑA_ROBUSTA_EQUIPO_NAMTRIK>"
}
```

**Requisitos de la nueva contraseña:**
- Mínimo 12 caracteres.
- Al menos una letra mayúscula, una minúscula, un número y un carácter especial.
- Distinta de la contraseña actual.
- Almacenada en la bóveda de contraseñas institucional del Equipo Namtrik.

Tras el cambio exitoso (`200 OK`), `must_change_password` se actualiza a `false` en la base de datos y se registra en `audit_log`.

---

## 4. Creación del Segundo Super Admin Nominal

Para garantizar la continuidad operativa, el Equipo Namtrik debe dar de alta una segunda cuenta:

1. Crear el usuario nominal con su correo institucional:
   - Ejemplo: `POST /auth/register` o siembra administrativa con nombre del custodio tecnológico.
2. Asignar el rol `super_admin`:
   ```http
   POST /api/admin/users/<USER_ID>/roles HTTP/1.1
   Authorization: Bearer <ACCESS_TOKEN_EQUIPO_NAMTRIK>
   Content-Type: application/json

   {
     "role": "super_admin"
   }
   ```
3. Verificar que la cuenta secundaria pueda autenticarse e iniciar sesión de forma independiente.

---

## 5. Salvaguardas y Prevención de Bloqueos

- **Protección del último super_admin (R-007 / Spec 002)**: La API rechaza con `409 Conflict` cualquier intento de revocar el rol `super_admin` o desactivar a un usuario si es el único superadministrador activo en el sistema.
- **Auto-ratificación**: Los super administradores tienen la facultad de ratificar cambios editoriales propios si fuera estrictamente indispensable por emergencia institucional; no obstante, la buena práctica editorial del Cabildo exige que toda ratificación léxica sea revisada por al menos dos miembros del comité lingüístico.
- **Purga de papelera**: La purga física permanente (`DELETE /api/admin/dictionary/papelera/:nivel/:id`) requiere confirmación exacta del código del elemento y solo puede ser autorizada por un `super_admin`.
