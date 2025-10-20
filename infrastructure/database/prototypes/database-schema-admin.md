# Sistema de Autenticación y Administración - Diccionario Misak

## Descripción General

Sistema completo de autenticación, autorización y administración para el Diccionario Cultural Misak, diseñado con arquitectura moderna, seguridad robusta y escalabilidad empresarial.

**Fecha de Creación**: 2025-10-20  
**Estado**: Diseño completo - Listo para implementación  
**Complejidad**: Estimada en 3-4 semanas de desarrollo

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Modelo de Datos](#modelo-de-datos)
3. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
4. [Flujos de Autenticación](#flujos-de-autenticación)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Endpoints y API](#endpoints-y-api)
7. [Seguridad](#seguridad)
8. [Plan de Implementación](#plan-de-implementación)
9. [Deployment](#deployment)
10. [Mantenimiento](#mantenimiento)

---

## 🏗️ Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     APLICACIÓN MONOREPO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐          ┌───────────────────┐           │
│  │  Web Client      │          │   Admin Panel     │           │
│  │  (Público)       │          │   (Privado)       │           │
│  │                  │          │                   │           │
│  │  React 19        │          │   React 19        │           │
│  │  Vite 7          │          │   Vite 7          │           │
│  │  React Router    │          │   React Router    │           │
│  └────────┬─────────┘          └─────────┬─────────┘           │
│           │                              │                      │
│           │      ┌───────────────────────┘                      │
│           │      │                                              │
│           ▼      ▼                                              │
│  ┌────────────────────────────────────────────┐               │
│  │         API Gateway (Fastify 5)            │               │
│  │                                            │               │
│  │  ┌──────────────┐   ┌─────────────────┐  │               │
│  │  │  /api/public │   │  /api/admin     │  │               │
│  │  │  (Sin auth)  │   │  (JWT required) │  │               │
│  │  └──────────────┘   └─────────────────┘  │               │
│  └────────────────────────────────────────────┘               │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌────────────────┐    ┌───────────────────┐                  │
│  │  Dictionary    │    │   Auth Service    │                  │
│  │  Service       │    │   Admin Service   │                  │
│  └────────────────┘    └───────────────────┘                  │
│           │                      │                              │
│           └──────────┬───────────┘                              │
│                      ▼                                          │
│         ┌────────────────────────┐                             │
│         │   PostgreSQL 17+       │                             │
│         │                        │                             │
│         │  • public schema       │                             │
│         │  • admin schema        │                             │
│         │  • audit schema        │                             │
│         │  • meta schema         │                             │
│         └────────────────────────┘                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Separación de Contextos

#### **1. Contexto Público (web-client)**

- **Ruta**: `https://diccionario-misak.com/`
- **Propósito**: Consulta pública del diccionario
- **Características**:
  - Sin autenticación
  - Solo lectura
  - Optimizado para SEO
  - Progressive Web App
  - Cache agresivo

#### **2. Contexto Administrativo (admin-panel)**

- **Ruta**: `https://diccionario-misak.com/admin`
- **Propósito**: Gestión del diccionario y usuarios
- **Características**:
  - Autenticación requerida (JWT)
  - Permisos granulares
  - Auditoría completa
  - Sin caché de datos sensibles
  - CSRF protection

### Flujo de Datos

```mermaid
graph TD
    A[Usuario] -->|Login| B[Admin Panel]
    B -->|POST /api/admin/auth/login| C[Auth Service]
    C -->|Valida credenciales| D[PostgreSQL admin.users]
    D -->|Usuario válido| E[Genera JWT + Refresh Token]
    E -->|Crea sesión| F[PostgreSQL admin.sessions]
    F -->|Retorna tokens| B
    B -->|Almacena en httpOnly cookie| G[Browser]
    G -->|Request con cookie| H[API Gateway]
    H -->|Valida JWT| I[Middleware Auth]
    I -->|Verifica permisos| J[Middleware RBAC]
    J -->|Permite acceso| K[Admin Service]
    K -->|Log de acción| L[PostgreSQL admin.admin_logs]
```

---

## 📊 Modelo de Datos

### Diagrama Entidad-Relación

```
┌─────────────────┐
│  admin.users    │
├─────────────────┤
│ PK id           │─┐
│    username     │ │
│    email        │ │
│    phone        │ │
│    password_hash│ │
│    role         │ │
│    status       │ │
│    created_by   │─┘ (auto-referencia)
└─────────────────┘
        │ 1
        │
        │ N
┌─────────────────┐
│ admin.sessions  │
├─────────────────┤
│ PK id (UUID)    │
│ FK user_id      │
│    token_hash   │
│    expires_at   │
│    revoked_at   │
└─────────────────┘

        │ 1
        │
        │ N
┌──────────────────────────────┐
│ admin.password_recovery_     │
│        _tokens               │
├──────────────────────────────┤
│ PK id (UUID)                 │
│ FK user_id                   │
│    token_hash                │
│    recovery_method (EMAIL/SMS)│
│    expires_at                │
│    used_at                   │
└──────────────────────────────┘

┌──────────────────┐
│ admin.permissions│
├──────────────────┤
│ PK id            │
│    code          │ (ej: diccionario.create)
│    name          │
│    category      │
└──────────────────┘
        │ N
        │
        │ N
┌──────────────────┐
│ admin.role_      │
│   _permissions   │
├──────────────────┤
│ PK role          │
│ PK permission_id │
└──────────────────┘

┌──────────────────┐
│ admin.admin_logs │
├──────────────────┤
│ PK id            │
│ FK user_id       │
│    action        │
│    entity_type   │
│    entity_id     │
│    changes (JSON)│
│    ip_address    │
│    created_at    │
└──────────────────┘
```

### Tablas del Sistema Administrativo

#### **1. admin.users**

Almacena todos los usuarios administrativos (ROOT y ADMIN).

**Campos clave:**

- `username`: Identificador único (citext, case-insensitive)
- `password_hash`: Bcrypt hash (costo 12)
- `role`: ENUM ('ROOT', 'ADMIN')
- `status`: ENUM ('ACTIVE', 'DISABLED', 'SUSPENDED', 'PENDING_ACTIVATION')
- `failed_login_attempts`: Contador de intentos fallidos
- `locked_until`: Bloqueo temporal tras 5 intentos fallidos

**Características especiales:**

- Solo puede haber **1 usuario ROOT** activo (constraint EXCLUDE)
- Soft delete (columna `deleted_at`)
- Auditoría automática de cambios

#### **2. admin.sessions**

Sesiones activas con tokens JWT hasheados.

**Campos clave:**

- `token_hash`: SHA-256 del JWT access token
- `refresh_token_hash`: SHA-256 del refresh token
- `expires_at`: Expiración del access token (15 minutos)
- `device_info`: JSONB con información del dispositivo

**Política de expiración:**

- Access token: 15 minutos
- Refresh token: 7 días
- Auto-limpieza de sesiones expiradas (diaria)

#### **3. admin.password_recovery_tokens**

Tokens de recuperación de contraseña (6 dígitos).

**Campos clave:**

- `token_hash`: SHA-256 del código de 6 dígitos
- `recovery_method`: 'EMAIL' o 'SMS'
- `expires_at`: 1 hora desde creación
- `attempts`: Máximo 5 intentos

#### **4. admin.permissions**

Permisos granulares del sistema.

**Formato de código:** `categoria.accion`

Ejemplos:

- `diccionario.create`
- `users.manage`
- `system.logs_view`

#### **5. admin.role_permissions**

Relación N:N entre roles y permisos.

**Lógica:**

- ROOT: Acceso implícito a todos los permisos (validado en función)
- ADMIN: Solo permisos de categoría `diccionario`

#### **6. admin.admin_logs**

Auditoría completa de acciones.

**Acciones rastreadas:**

- LOGIN, LOGOUT, FAILED_LOGIN
- CREATE, UPDATE, DELETE, SOFT_DELETE, RESTORE
- PASSWORD_CHANGE, PASSWORD_RESET_REQUEST
- USER_CREATE, USER_UPDATE, USER_DISABLE, USER_ENABLE

**Campos de auditoría:**

- `changes`: JSONB con before/after
- `request_id`: UUID para correlación con logs de aplicación
- `ip_address`, `user_agent`

---

## 👥 Sistema de Roles y Permisos

### Jerarquía de Roles

```
ROOT (Superusuario)
  │
  ├─ Gestión completa del diccionario
  ├─ Gestión de usuarios administradores
  ├─ Visualización de logs y auditoría
  ├─ Configuración del sistema
  └─ Acceso a todas las funcionalidades

ADMIN (Administrador limitado)
  │
  ├─ Gestión del diccionario (CRUD)
  │   ├─ Crear entradas
  │   ├─ Editar entradas
  │   ├─ Eliminar entradas
  │   └─ Restaurar entradas eliminadas
  ├─ Gestión de campos semánticos
  └─ Sin acceso a usuarios ni logs
```

### Matriz de Permisos

| Funcionalidad               | ROOT | ADMIN |
| --------------------------- | ---- | ----- |
| **Diccionario**             |      |       |
| Ver entradas                | ✅   | ✅    |
| Crear entradas              | ✅   | ✅    |
| Editar entradas             | ✅   | ✅    |
| Eliminar entradas           | ✅   | ✅    |
| Restaurar entradas          | ✅   | ✅    |
| Gestionar campos semánticos | ✅   | ✅    |
| Gestionar subcampos         | ✅   | ✅    |
| Gestionar microcampos       | ✅   | ✅    |
| **Usuarios**                |      |       |
| Ver usuarios                | ✅   | ❌    |
| Crear usuarios              | ✅   | ❌    |
| Editar usuarios             | ✅   | ❌    |
| Deshabilitar usuarios       | ✅   | ❌    |
| Eliminar usuarios           | ✅   | ❌    |
| **Sistema**                 |      |       |
| Ver logs de auditoría       | ✅   | ❌    |
| Exportar logs               | ✅   | ❌    |
| Ver configuración           | ✅   | ❌    |
| Editar configuración        | ✅   | ❌    |

### Implementación de Permisos

#### En Base de Datos

```sql
-- Verificar permiso de usuario
SELECT admin.user_has_permission(42, 'diccionario.create');
-- Retorna: true/false
```

#### En Backend (Fastify)

```typescript
// Middleware de verificación de permisos
async function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;

    const hasPermission = await prisma.$queryRaw`
      SELECT admin.user_has_permission(${userId}, ${permission})
    `;

    if (!hasPermission) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permiso para realizar esta acción',
      });
    }
  };
}

// Uso en rutas
fastify.post(
  '/api/admin/palabras',
  {
    preHandler: [authenticateJWT, requirePermission('diccionario.create')],
  },
  async (request, reply) => {
    // Crear palabra
  },
);
```

---

## 🔐 Flujos de Autenticación

### 1. Flujo de Login

```
┌─────────┐                                                     ┌──────────┐
│ Usuario │                                                     │ Backend  │
└────┬────┘                                                     └─────┬────┘
     │                                                                │
     │ 1. POST /api/admin/auth/login                                │
     │    { username, password }                                     │
     ├──────────────────────────────────────────────────────────────>│
     │                                                                │
     │                         2. Validar credenciales               │
     │                            - Buscar usuario                   │
     │                            - Verificar status                 │
     │                            - Verificar locked_until           │
     │                            - Comparar bcrypt                  │
     │                                                                │
     │                         3. Si válido:                         │
     │                            - Generar JWT (15min)              │
     │                            - Generar Refresh (7d)             │
     │                            - Crear sesión en DB               │
     │                            - Log de login exitoso             │
     │                            - Reset failed_attempts            │
     │                                                                │
     │ 4. Set-Cookie: accessToken (httpOnly, secure, sameSite)      │
     │    Set-Cookie: refreshToken (httpOnly, secure, sameSite)     │
     │    { user: { id, username, role }, expiresAt }               │
     │<──────────────────────────────────────────────────────────────│
     │                                                                │
     │                         5. Si inválido:                       │
     │                            - Incrementar failed_attempts      │
     │                            - Log de login fallido             │
     │                            - Si >= 5: locked_until +15min    │
     │                                                                │
     │ 6. { error: 'Credenciales inválidas' } (401)                 │
     │<──────────────────────────────────────────────────────────────│
     │                                                                │
```

**Endpoint:** `POST /api/admin/auth/login`

**Request:**

```json
{
  "username": "admin_user",
  "password": "SecurePassword123!"
}
```

**Response (Éxito - 200):**

```json
{
  "user": {
    "id": 2,
    "username": "admin_user",
    "email": "admin@example.com",
    "fullName": "Admin Usuario",
    "role": "ADMIN"
  },
  "expiresAt": "2025-10-20T12:00:00Z"
}
```

**Response (Error - 401):**

```json
{
  "error": "Unauthorized",
  "message": "Credenciales inválidas",
  "remainingAttempts": 3
}
```

**Response (Bloqueado - 429):**

```json
{
  "error": "TooManyAttempts",
  "message": "Usuario bloqueado por múltiples intentos fallidos",
  "lockedUntil": "2025-10-20T11:45:00Z"
}
```

### 2. Flujo de Refresh Token

```
┌─────────┐                                      ┌──────────┐
│ Cliente │                                      │ Backend  │
└────┬────┘                                      └─────┬────┘
     │                                                 │
     │ 1. POST /api/admin/auth/refresh                │
     │    Cookie: refreshToken                        │
     ├─────────────────────────────────────────────────>│
     │                                                 │
     │              2. Validar refresh token          │
     │                 - Verificar firma JWT          │
     │                 - Buscar sesión en DB          │
     │                 - Verificar no revocada        │
     │                 - Verificar no expirada        │
     │                                                 │
     │              3. Generar nuevo access token     │
     │                 - JWT 15 minutos               │
     │                 - Actualizar last_activity_at  │
     │                                                 │
     │ 4. Set-Cookie: accessToken (nuevo)            │
     │    { expiresAt }                               │
     │<─────────────────────────────────────────────────│
     │                                                 │
```

**Endpoint:** `POST /api/admin/auth/refresh`

**Response (200):**

```json
{
  "expiresAt": "2025-10-20T12:15:00Z"
}
```

### 3. Flujo de Recuperación de Contraseña

```
┌─────────┐                                               ┌──────────┐
│ Usuario │                                               │ Backend  │
└────┬────┘                                               └─────┬────┘
     │                                                          │
     │ PASO 1: Solicitar recuperación                         │
     │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
     │                                                          │
     │ 1. POST /api/admin/auth/password-reset/request         │
     │    { email }                                            │
     ├──────────────────────────────────────────────────────────>│
     │                                                          │
     │                    2. Validar email                     │
     │                       - Buscar usuario                  │
     │                       - Verificar activo                │
     │                                                          │
     │                    3. Generar token 6 dígitos          │
     │                       - Token: 123456                   │
     │                       - Hash: SHA-256                   │
     │                       - Expira: +1 hora                 │
     │                       - Guardar en DB                   │
     │                                                          │
     │                    4. Enviar email/SMS                  │
     │                       - Email: Nodemailer               │
     │                       - SMS: Twilio/AWS SNS             │
     │                                                          │
     │ 5. { message: 'Código enviado', method: 'EMAIL' }      │
     │<──────────────────────────────────────────────────────────│
     │                                                          │
     │ PASO 2: Verificar token                                │
     │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
     │                                                          │
     │ 6. POST /api/admin/auth/password-reset/verify          │
     │    { email, token: "123456" }                           │
     ├──────────────────────────────────────────────────────────>│
     │                                                          │
     │                    7. Validar token                     │
     │                       - Hash del token recibido         │
     │                       - Buscar en DB                    │
     │                       - Verificar no usado              │
     │                       - Verificar no expirado           │
     │                       - Verificar attempts < 5          │
     │                                                          │
     │ 8. { valid: true, resetToken: "uuid-temporal" }        │
     │<──────────────────────────────────────────────────────────│
     │                                                          │
     │ PASO 3: Establecer nueva contraseña                    │
     │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
     │                                                          │
     │ 9. POST /api/admin/auth/password-reset/complete        │
     │    { resetToken, newPassword }                          │
     ├──────────────────────────────────────────────────────────>│
     │                                                          │
     │                    10. Validar resetToken               │
     │                                                          │
     │                    11. Actualizar contraseña            │
     │                        - Bcrypt hash (costo 12)         │
     │                        - Marcar token como usado        │
     │                        - Revocar todas las sesiones     │
     │                        - require_password_change=false  │
     │                        - Log de cambio                  │
     │                                                          │
     │ 12. { message: 'Contraseña actualizada' }              │
     │<──────────────────────────────────────────────────────────│
     │                                                          │
```

### 4. Flujo de Logout

```
┌─────────┐                                      ┌──────────┐
│ Cliente │                                      │ Backend  │
└────┬────┘                                      └─────┬────┘
     │                                                 │
     │ 1. POST /api/admin/auth/logout                 │
     │    Cookie: accessToken, refreshToken           │
     ├─────────────────────────────────────────────────>│
     │                                                 │
     │              2. Revocar sesión                 │
     │                 - Extraer session_id del JWT   │
     │                 - UPDATE revoked_at = now()    │
     │                 - Log de logout                │
     │                                                 │
     │ 3. Clear-Cookie: accessToken, refreshToken    │
     │    { message: 'Sesión cerrada' }               │
     │<─────────────────────────────────────────────────│
     │                                                 │
```

---

## 🛠️ Stack Tecnológico

### Dependencias Backend

**Gestor de paquetes**: pnpm (configurado en el proyecto)

#### **Backend (Fastify)**

```json
{
  "dependencies": {
    // Core
    "@fastify/cookie": "^10.0.1",
    "@fastify/cors": "^10.0.1",
    "@fastify/helmet": "^12.0.1",
    "@fastify/rate-limit": "^10.1.1",
    "@fastify/csrf-protection": "^7.0.0",
    "@fastify/multipart": "^8.3.0",

    // Autenticación y Seguridad
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^4.0.0",

    // Email y SMS
    "nodemailer": "^6.9.15",
    "@aws-sdk/client-sns": "^3.658.1",

    // Base de datos
    "@prisma/client": "^6.0.0",
    "prisma": "^6.0.0",

    // Utilidades
    "crypto": "built-in",
    "ua-parser-js": "^1.0.38",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/nodemailer": "^6.4.16"
  }
}
```

### Instalación con pnpm

```bash
# Backend dependencies (usando pnpm como gestor de paquetes del proyecto)
cd services/auth-service
pnpm add @fastify/cookie @fastify/cors @fastify/helmet \
  @fastify/rate-limit @fastify/csrf-protection \
  bcrypt jsonwebtoken zod nodemailer @aws-sdk/client-sns \
  ua-parser-js date-fns

pnpm add -D @types/bcrypt @types/jsonwebtoken @types/nodemailer
```

---

## 🌐 Endpoints y API

### Estructura de Rutas

```
/api
├── /public                    # Sin autenticación
│   ├── /diccionario
│   │   ├── GET    /palabras
│   │   ├── GET    /palabras/:id
│   │   └── GET    /campos-semanticos
│   └── /search
│       └── GET    /
│
└── /admin                     # JWT requerido
    ├── /auth                  # Autenticación
    │   ├── POST   /login
    │   ├── POST   /logout
    │   ├── POST   /refresh
    │   ├── GET    /me
    │   └── /password-reset
    │       ├── POST /request
    │       ├── POST /verify
    │       └── POST /complete
    │
    ├── /diccionario           # CRUD diccionario
    │   ├── /palabras
    │   │   ├── GET     /
    │   │   ├── POST    /
    │   │   ├── GET     /:id
    │   │   ├── PUT     /:id
    │   │   ├── DELETE  /:id
    │   │   └── POST    /:id/restore
    │   ├── /campos-semanticos
    │   │   ├── GET     /
    │   │   ├── POST    /
    │   │   ├── PUT     /:id
    │   │   └── DELETE  /:id
    │   ├── /subcampos
    │   └── /microcampos
    │
    ├── /users                 # Solo ROOT
    │   ├── GET     /
    │   ├── POST    /
    │   ├── GET     /:id
    │   ├── PUT     /:id
    │   ├── POST    /:id/disable
    │   ├── POST    /:id/enable
    │   └── DELETE  /:id
    │
    └── /system                # Solo ROOT
        ├── /logs
        │   ├── GET     /
        │   ├── GET     /export
        │   └── GET     /stats
        └── /settings
            ├── GET     /
            └── PUT     /
```

### Especificación Detallada de Endpoints

#### **1. Autenticación**

##### POST /api/admin/auth/login

Iniciar sesión de usuario administrativo.

**Request:**

```typescript
{
  username: string;      // 3-50 caracteres
  password: string;      // Mínimo 8 caracteres
  rememberMe?: boolean;  // Default: false (afecta duración del refresh token)
}
```

**Response (200):**

```typescript
{
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: 'ROOT' | 'ADMIN';
  }
  expiresAt: string; // ISO 8601
}
// + Set-Cookie: accessToken, refreshToken
```

**Errors:**

- `401`: Credenciales inválidas
- `403`: Usuario deshabilitado o suspendido
- `429`: Demasiados intentos (usuario bloqueado)

**Seguridad:**

- Rate limit: 5 intentos/15min por IP
- Bloqueo automático tras 5 intentos fallidos
- Logs de todos los intentos

---

##### POST /api/admin/auth/logout

Cerrar sesión y revocar tokens.

**Headers:**

```
Cookie: accessToken=...; refreshToken=...
```

**Response (200):**

```typescript
{
  message: 'Sesión cerrada exitosamente';
}
// + Clear-Cookie: accessToken, refreshToken
```

---

##### POST /api/admin/auth/refresh

Renovar access token usando refresh token.

**Headers:**

```
Cookie: refreshToken=...
```

**Response (200):**

```typescript
{
  expiresAt: string; // ISO 8601
}
// + Set-Cookie: accessToken (nuevo)
```

**Errors:**

- `401`: Refresh token inválido o expirado
- `403`: Sesión revocada

---

##### GET /api/admin/auth/me

Obtener información del usuario actual.

**Headers:**

```
Cookie: accessToken=...
```

**Response (200):**

```typescript
{
  id: number;
  username: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: 'ROOT' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED' | 'PENDING_ACTIVATION';
  lastLoginAt: string | null;
  createdAt: string;
  permissions: string[]; // ['diccionario.create', ...]
}
```

---

##### POST /api/admin/auth/password-reset/request

Solicitar recuperación de contraseña.

**Request:**

```typescript
{
  email: string;
  method?: 'EMAIL' | 'SMS'; // Default: EMAIL
}
```

**Response (200):**

```typescript
{
  message: 'Código de recuperación enviado';
  method: 'EMAIL' | 'SMS';
  sentTo: string; // email o teléfono parcialmente oculto
  expiresIn: number; // Segundos hasta expiración (3600)
}
```

**Seguridad:**

- Rate limit: 3 intentos/hora por email
- Token de 6 dígitos
- Expira en 1 hora

---

##### POST /api/admin/auth/password-reset/verify

Verificar código de recuperación.

**Request:**

```typescript
{
  email: string;
  token: string; // 6 dígitos
}
```

**Response (200):**

```typescript
{
  valid: true;
  resetToken: string; // UUID temporal para completar el reset
  expiresIn: number; // Segundos restantes
}
```

**Errors:**

- `400`: Token inválido o expirado
- `429`: Máximo 5 intentos alcanzados

---

##### POST /api/admin/auth/password-reset/complete

Establecer nueva contraseña.

**Request:**

```typescript
{
  resetToken: string; // UUID del paso anterior
  newPassword: string; // Mínimo 8 caracteres, 1 mayúscula, 1 número
}
```

**Response (200):**

```typescript
{
  message: 'Contraseña actualizada exitosamente';
  sessionRevoked: true; // Todas las sesiones previas fueron cerradas
}
```

**Política de contraseñas:**

- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial (!@#$%^&\*)
- No puede ser igual a las últimas 3 contraseñas

---

#### **2. Gestión de Diccionario**

##### GET /api/admin/diccionario/palabras

Listar palabras con paginación y filtros.

**Permisos requeridos:** `diccionario.view`

**Query Parameters:**

```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, Max: 100
  search?: string;        // Búsqueda en término/descripción
  campo?: number;         // Filtrar por campo semántico
  idioma?: 'namtrik' | 'espanol';
  sortBy?: 'created_at' | 'namtrik_termino' | 'espanol_termino';
  sortOrder?: 'asc' | 'desc'; // Default: desc
  includeDeleted?: boolean;   // Solo ROOT
}
```

**Response (200):**

```typescript
{
  data: Array<{
    id: number;
    namtrikTermino: string;
    namtrikDescripcion: string | null;
    namtrikAudio: string | null;
    espanolTermino: string;
    espanolDescripcion: string | null;
    espanolAudio: string | null;
    imagen: string | null;
    microcampos: Array<{
      id: number;
      nombre: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

##### POST /api/admin/diccionario/palabras

Crear nueva entrada en el diccionario.

**Permisos requeridos:** `diccionario.create`

**Request:**

```typescript
{
  namtrikTermino: string;        // Requerido
  namtrikDescripcion?: string;
  namtrikAudio?: string;         // URL HTTPS
  espanolTermino: string;        // Requerido
  espanolDescripcion?: string;
  espanolAudio?: string;         // URL HTTPS
  imagen?: string;               // URL HTTPS
  microcampoIds: number[];       // Array de IDs
}
```

**Response (201):**

```typescript
{
  id: number;
  namtrikTermino: string;
  // ... (todos los campos)
  createdAt: string;
}
```

**Validaciones:**

- Términos únicos (case-insensitive)
- URLs válidas (HTTPS)
- Microcampos existentes

**Auditoría:**

- Acción: CREATE
- Entity: palabra
- Cambios: JSON completo del registro

---

##### PUT /api/admin/diccionario/palabras/:id

Actualizar entrada existente.

**Permisos requeridos:** `diccionario.update`

**Request:** (igual que POST, pero todos los campos opcionales)

**Response (200):** (igual que POST)

**Auditoría:**

- Acción: UPDATE
- Changes: { before: {...}, after: {...} }

---

##### DELETE /api/admin/diccionario/palabras/:id

Soft delete de entrada.

**Permisos requeridos:** `diccionario.delete`

**Response (200):**

```typescript
{
  message: 'Entrada eliminada exitosamente';
  id: number;
  deletedAt: string;
}
```

**Auditoría:**

- Acción: SOFT_DELETE

---

##### POST /api/admin/diccionario/palabras/:id/restore

Restaurar entrada eliminada.

**Permisos requeridos:** `diccionario.restore`

**Response (200):**

```typescript
{
  message: 'Entrada restaurada exitosamente';
  id: number;
}
```

**Auditoría:**

- Acción: RESTORE

---

#### **3. Gestión de Usuarios (Solo ROOT)**

##### GET /api/admin/users

Listar usuarios administrativos.

**Permisos requeridos:** `users.view`

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  role?: 'ROOT' | 'ADMIN';
  search?: string; // username, email o fullName
}
```

**Response (200):**

```typescript
{
  data: Array<{
    id: number;
    username: string;
    email: string;
    phone: string | null;
    fullName: string;
    role: 'ROOT' | 'ADMIN';
    status: string;
    lastLoginAt: string | null;
    createdBy: {
      id: number;
      username: string;
    } | null;
    activeSessions: number;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

##### POST /api/admin/users

Crear nuevo usuario administrador.

**Permisos requeridos:** `users.create`

**Request:**

```typescript
{
  username: string;              // 3-50 caracteres, alfanumérico + _ -
  email: string;
  phone?: string;                // Formato E.164 (+57...)
  fullName: string;
  role: 'ADMIN';                 // Solo ROOT puede crear ROOT
  temporaryPassword: string;     // Generada o especificada
  requirePasswordChange: boolean; // Default: true
}
```

**Response (201):**

```typescript
{
  id: number;
  username: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: 'ADMIN';
  status: 'PENDING_ACTIVATION';
  temporaryPassword: string; // Mostrar una vez, guardar de forma segura
  createdAt: string;
}
```

**Post-creación:**

- Enviar email con credenciales temporales
- Usuario debe cambiar contraseña en primer login

---

##### PUT /api/admin/users/:id

Actualizar usuario administrador.

**Permisos requeridos:** `users.update`

**Request:**

```typescript
{
  email?: string;
  phone?: string;
  fullName?: string;
  // No se puede cambiar username ni role
}
```

**Response (200):** (Usuario actualizado)

---

##### POST /api/admin/users/:id/disable

Deshabilitar usuario.

**Permisos requeridos:** `users.disable`

**Response (200):**

```typescript
{
  message: 'Usuario deshabilitado';
  id: number;
  status: 'DISABLED';
  revokedSessions: number; // Sesiones cerradas
}
```

**Efecto:**

- Cambiar status a DISABLED
- Revocar todas las sesiones activas
- Log de acción

---

##### POST /api/admin/users/:id/enable

Habilitar usuario.

**Permisos requeridos:** `users.disable`

**Response (200):**

```typescript
{
  message: 'Usuario habilitado';
  id: number;
  status: 'ACTIVE';
}
```

---

##### DELETE /api/admin/users/:id

Eliminar usuario (soft delete).

**Permisos requeridos:** `users.delete`

**Restricciones:**

- No se puede eliminar a sí mismo
- No se puede eliminar al único ROOT

**Response (200):**

```typescript
{
  message: 'Usuario eliminado';
  id: number;
  deletedAt: string;
}
```

---

#### **4. Logs y Sistema (Solo ROOT)**

##### GET /api/admin/system/logs

Ver logs de auditoría.

**Permisos requeridos:** `system.logs_view`

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;           // Max: 1000
  userId?: number;
  action?: 'LOGIN' | 'CREATE' | 'UPDATE' | ...;
  entityType?: 'palabra' | 'user' | 'campo_semantico' | ...;
  dateFrom?: string;        // ISO 8601
  dateTo?: string;
  success?: boolean;
}
```

**Response (200):**

```typescript
{
  data: Array<{
    id: number;
    user: {
      id: number;
      username: string;
      role: string;
    } | null;
    action: string;
    entityType: string;
    entityId: number | null;
    description: string;
    changes: object | null;
    ipAddress: string;
    success: boolean;
    errorMessage: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

##### GET /api/admin/system/logs/export

Exportar logs en formato CSV/JSON.

**Permisos requeridos:** `system.logs_export`

**Query Parameters:**

```typescript
{
  format: 'csv' | 'json';
  dateFrom: string;
  dateTo: string;
  userId?: number;
}
```

**Response (200):**

```
Content-Type: text/csv o application/json
Content-Disposition: attachment; filename="logs_20251020.csv"

(archivo CSV o JSON con logs)
```

---

##### GET /api/admin/system/logs/stats

Estadísticas de actividad.

**Permisos requeridos:** `system.logs_view`

**Response (200):**

```typescript
{
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByUser: Array<{
    userId: number;
    username: string;
    count: number;
  }>;
  recentActivity: Array<{
    hour: string;
    count: number;
  }>;
  failedLogins: {
    last24h: number;
    last7days: number;
  }
}
```

---

## 🔒 Seguridad

### 1. Hashing de Contraseñas

**Algoritmo:** Bcrypt con costo 12

```typescript
import bcrypt from 'bcrypt';

// Hash de contraseña
const SALT_ROUNDS = 12;
const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verificación
const isValid = await bcrypt.compare(plainPassword, passwordHash);
```

**Política de contraseñas:**

- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial
- No contener username o email
- No ser contraseña común (lista de 10,000 contraseñas comunes)

### 2. JSON Web Tokens (JWT)

**Estructura del Access Token:**

```typescript
{
  // Header
  "alg": "HS256",
  "typ": "JWT",

  // Payload
  "sub": "2",                // user_id
  "username": "admin_user",
  "role": "ADMIN",
  "sessionId": "uuid",       // ID de la sesión en DB
  "iat": 1729425600,         // Issued at
  "exp": 1729426500          // Expires (15 min)
}
```

**Estructura del Refresh Token:**

```typescript
{
  "sub": "2",
  "sessionId": "uuid",
  "type": "refresh",
  "iat": 1729425600,
  "exp": 1730030400          // Expires (7 días)
}
```

**Secret Management:**

```bash
# Variables de entorno
JWT_ACCESS_SECRET="random-256-bit-secret"   # openssl rand -base64 64
JWT_REFRESH_SECRET="random-256-bit-secret"  # Diferente del access
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
```

**Almacenamiento:**

- httpOnly cookies (no accesibles desde JavaScript)
- Secure flag (solo HTTPS)
- SameSite=Strict (protección CSRF)

### 3. CSRF Protection

**Implementación con @fastify/csrf-protection:**

```typescript
import fastifyCsrf from '@fastify/csrf-protection';

fastify.register(fastifyCsrf, {
  cookieOpts: {
    signed: true,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
});

// Rutas que modifican datos requieren CSRF token
fastify.post(
  '/api/admin/diccionario/palabras',
  {
    preHandler: fastify.csrfProtection,
  },
  async (request, reply) => {
    // Handler
  },
);
```

**Cliente:**

```typescript
// Obtener CSRF token
const csrfToken = await fetch('/api/admin/csrf-token').then((r) => r.json());

// Incluir en requests
fetch('/api/admin/diccionario/palabras', {
  method: 'POST',
  headers: {
    'csrf-token': csrfToken.token,
  },
  body: JSON.stringify(data),
});
```

### 4. Rate Limiting

**Configuración por endpoint:**

```typescript
import rateLimit from '@fastify/rate-limit';

// Global rate limit
fastify.register(rateLimit, {
  global: true,
  max: 100, // 100 requests
  timeWindow: '15 minutes',
});

// Rate limit específico para login
fastify.post(
  '/api/admin/auth/login',
  {
    config: {
      rateLimit: {
        max: 5, // 5 intentos
        timeWindow: '15 minutes',
      },
    },
  },
  loginHandler,
);

// Rate limit para password reset
fastify.post(
  '/api/admin/auth/password-reset/request',
  {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
      },
    },
  },
  passwordResetHandler,
);
```

### 5. Validación y Sanitización

**Esquemas Zod:**

```typescript
import { z } from 'zod';

// Schema de login
const loginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/i, 'Username inválido'),
  password: z.string().min(8).max(100),
});

// Schema de creación de palabra
const palabraCreateSchema = z.object({
  namtrikTermino: z.string().min(1).max(200).trim(),
  namtrikDescripcion: z.string().max(5000).trim().optional(),
  namtrikAudio: z
    .string()
    .url()
    .regex(/^https:\/\//, 'Solo URLs HTTPS')
    .optional(),
  espanolTermino: z.string().min(1).max(200).trim(),
  espanolDescripcion: z.string().max(5000).trim().optional(),
  espanolAudio: z
    .string()
    .url()
    .regex(/^https:\/\//, 'Solo URLs HTTPS')
    .optional(),
  imagen: z
    .string()
    .url()
    .regex(/^https:\/\//, 'Solo URLs HTTPS')
    .optional(),
  microcampoIds: z.array(z.number().positive()).min(1),
});

// Middleware de validación
function validateRequest(schema: z.ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          details: error.errors,
        });
      }
      throw error;
    }
  };
}

// Uso
fastify.post(
  '/api/admin/auth/login',
  {
    preHandler: validateRequest(loginSchema),
  },
  loginHandler,
);
```

### 6. Protección contra SQL Injection

**Prisma previene SQL injection por defecto:**

```typescript
// ✅ SEGURO - Prisma parametriza automáticamente
const user = await prisma.users.findUnique({
  where: { username: req.body.username },
});

// ✅ SEGURO - Raw queries con parámetros
const result = await prisma.$queryRaw`
  SELECT * FROM admin.users WHERE username = ${username}
`;

// ❌ NUNCA HACER - Concatenación directa
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM admin.users WHERE username = '${username}'`,
);
```

### 7. Headers de Seguridad

**Configuración con @fastify/helmet:**

```typescript
import helmet from '@fastify/helmet';

fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,
  hidePoweredBy: true,
});
```

### 8. Logging de Seguridad

**Eventos a loggear:**

```typescript
// Login exitoso
logger.info({
  event: 'auth.login.success',
  userId: user.id,
  username: user.username,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

// Login fallido
logger.warn({
  event: 'auth.login.failed',
  username: request.body.username,
  reason: 'invalid_credentials',
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

// Usuario bloqueado
logger.error({
  event: 'auth.user.locked',
  username: user.username,
  attempts: user.failedLoginAttempts,
  lockedUntil: user.lockedUntil,
  ip: request.ip,
});

// Cambio de contraseña
logger.info({
  event: 'auth.password.changed',
  userId: user.id,
  method: 'self' | 'reset',
  ip: request.ip,
});

// Acceso denegado por permisos
logger.warn({
  event: 'auth.permission.denied',
  userId: user.id,
  permission: 'users.create',
  resource: '/api/admin/users',
  ip: request.ip,
});
```

### 9. Auditoría Automática

**Middleware de auditoría:**

```typescript
async function auditMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user; // Del JWT
  const startTime = Date.now();

  reply.addHook('onSend', async (req, reply, payload) => {
    const duration = Date.now() - startTime;
    const success = reply.statusCode < 400;

    // Solo auditar operaciones de escritura
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      await prisma.adminLogs.create({
        data: {
          userId: user.id,
          username: user.username,
          userRole: user.role,
          action: determineAction(request.method, request.url),
          entityType: extractEntityType(request.url),
          entityId: extractEntityId(request.params),
          description: generateDescription(request),
          changes: success ? extractChanges(request, reply) : null,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.id,
          success,
          errorMessage: success ? null : (payload as any).message,
        },
      });
    }
  });
}
```

---

## 📅 Plan de Implementación

### Fase 1: Fundación (Semana 1) - 5 días

#### **Día 1-2: Setup y Base de Datos**

- [ ] Aplicar `database-schema-admin.sql` a PostgreSQL
- [ ] Verificar todas las tablas, índices y funciones
- [ ] Crear usuario ROOT inicial manualmente:
  ```sql
  INSERT INTO admin.users (
    username, email, full_name,
    password_hash, role, status
  ) VALUES (
    'root',
    'root@example.com',
    'Root Administrator',
    '$2b$12$...', -- bcrypt hash de contraseña temporal
    'ROOT',
    'ACTIVE'
  );
  ```
- [ ] Crear estructura de servicios:
  ```
  services/
  └── auth-service/
      ├── src/
      │   ├── routes/
      │   ├── handlers/
      │   ├── middleware/
      │   ├── utils/
      │   └── types/
      ├── prisma/
      │   └── schema.prisma
      ├── package.json
      └── tsconfig.json
  ```

#### **Día 3: Auth Service Core**

- [ ] Instalar dependencias
- [ ] Configurar Prisma para schema `admin`
- [ ] Implementar utilidades de JWT
- [ ] Implementar utilidades de bcrypt
- [ ] Crear tipos TypeScript

#### **Día 4-5: Login y Sesiones**

- [ ] Endpoint: `POST /auth/login`
- [ ] Endpoint: `POST /auth/logout`
- [ ] Endpoint: `POST /auth/refresh`
- [ ] Endpoint: `GET /auth/me`
- [ ] Middleware: `authenticateJWT`
- [ ] Tests unitarios

**Entregables:**

- ✅ Base de datos configurada
- ✅ Login funcional
- ✅ JWT y refresh tokens
- ✅ Sesiones persistentes

---

### Fase 2: Seguridad y Recuperación (Semana 2) - 5 días

#### **Día 1-2: Rate Limiting y CSRF**

- [ ] Configurar `@fastify/rate-limit`
- [ ] Configurar `@fastify/csrf-protection`
- [ ] Configurar `@fastify/helmet`
- [ ] Configurar `@fastify/cors`
- [ ] Tests de seguridad

#### **Día 3-5: Recuperación de Contraseña**

- [ ] Endpoint: `POST /auth/password-reset/request`
- [ ] Endpoint: `POST /auth/password-reset/verify`
- [ ] Endpoint: `POST /auth/password-reset/complete`
- [ ] Integración Nodemailer (email)
- [ ] Integración AWS SNS (SMS) - opcional
- [ ] Tests end-to-end

**Entregables:**

- ✅ Rate limiting configurado
- ✅ CSRF protection activo
- ✅ Recuperación de contraseña funcional

---

### Fase 3: RBAC y Permisos (Semana 3) - 5 días

#### **Día 1-2: Sistema de Permisos**

- [ ] Middleware: `requirePermission(permission: string)`
- [ ] Utilidad: `getUserPermissions(userId: number)`
- [ ] Tests de permisos

#### **Día 3-4: Gestión de Usuarios (ROOT)**

- [ ] Endpoint: `GET /users`
- [ ] Endpoint: `POST /users`
- [ ] Endpoint: `PUT /users/:id`
- [ ] Endpoint: `POST /users/:id/disable`
- [ ] Endpoint: `POST /users/:id/enable`
- [ ] Endpoint: `DELETE /users/:id`

#### **Día 5: Logs y Auditoría**

- [ ] Endpoint: `GET /system/logs`
- [ ] Endpoint: `GET /system/logs/export`
- [ ] Endpoint: `GET /system/logs/stats`
- [ ] Middleware de auditoría automática

**Entregables:**

- ✅ Sistema RBAC completo
- ✅ Gestión de usuarios
- ✅ Auditoría funcional

---

### Fase 4: Integración con Diccionario (Semana 4) - 5 días

#### **Día 1-3: CRUD Diccionario**

- [ ] Endpoint: `GET /diccionario/palabras`
- [ ] Endpoint: `POST /diccionario/palabras`
- [ ] Endpoint: `PUT /diccionario/palabras/:id`
- [ ] Endpoint: `DELETE /diccionario/palabras/:id`
- [ ] Endpoint: `POST /diccionario/palabras/:id/restore`
- [ ] Validaciones Zod
- [ ] Tests

#### **Día 4: Admin Panel Frontend (Básico)**

- [ ] Setup app admin-panel en monorepo
- [ ] Componente Login
- [ ] Componente Dashboard
- [ ] Componente Lista de Palabras
- [ ] Context de autenticación

#### **Día 5: Testing y Documentación**

- [ ] Tests de integración completos
- [ ] Documentación de API (OpenAPI/Swagger)
- [ ] README con instrucciones de setup
- [ ] Guía de deployment

**Entregables:**

- ✅ API admin completa
- ✅ Admin panel básico funcional
- ✅ Documentación completa

---

## 🚀 Deployment

### Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────────┐
│                     CLOUDFLARE CDN                       │
│                (SSL/TLS, Cache, DDoS Protection)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   NGINX Reverse Proxy                    │
│                  (Load Balancer + Router)                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  diccionario-misak.com/          → web-client (static)  │
│  diccionario-misak.com/admin     → admin-panel (static) │
│  diccionario-misak.com/api       → API Gateway          │
│                                                           │
└────────────┬─────────────────────────┬──────────────────┘
             │                         │
             ▼                         ▼
    ┌────────────────┐       ┌────────────────┐
    │   Web Client   │       │  Admin Panel   │
    │   (Static SPA) │       │  (Static SPA)  │
    │   React Build  │       │   React Build  │
    └────────────────┘       └────────────────┘
                                      │
                                      ▼
                            ┌────────────────────┐
                            │   API Gateway      │
                            │   (Fastify)        │
                            │   Docker Container │
                            └──────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │  Auth Service  │  │  Dict Service  │  │ Admin Service  │
        │  (Container)   │  │  (Container)   │  │  (Container)   │
        └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     ▼
                         ┌────────────────────┐
                         │   PostgreSQL 17    │
                         │   (Managed/Docker) │
                         └────────────────────┘
```

### Configuración NGINX

```nginx
# /etc/nginx/sites-available/diccionario-misak

upstream api_gateway {
    server localhost:3000;
    keepalive 64;
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name diccionario-misak.com www.diccionario-misak.com;
    return 301 https://diccionario-misak.com$request_uri;
}

# Servidor principal HTTPS
server {
    listen 443 ssl http2;
    server_name diccionario-misak.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/diccionario-misak.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/diccionario-misak.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/diccionario-access.log;
    error_log /var/log/nginx/diccionario-error.log;

    # Cliente web público (SPA)
    location / {
        root /var/www/diccionario-misak/web-client/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Admin panel (SPA)
    location /admin {
        alias /var/www/diccionario-misak/admin-panel/dist;
        try_files $uri $uri/ /admin/index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # API Gateway
    location /api {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Assets estáticos con cache agresivo
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/diccionario-misak/web-client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker Compose

```yaml
# docker-compose.yml

version: '3.9'

services:
  # PostgreSQL
  postgres:
    image: postgres:17-alpine
    container_name: misak-postgres
    environment:
      POSTGRES_DB: misak_dictionary
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/database/prototypes:/docker-entrypoint-initdb.d
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - misak-network

  # API Gateway
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    container_name: misak-api-gateway
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/misak_dictionary
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      REDIS_URL: redis://redis:6379
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - misak-network
    restart: unless-stopped

  # Auth Service
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    container_name: misak-auth-service
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/misak_dictionary
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      AWS_SNS_REGION: ${AWS_SNS_REGION}
      AWS_SNS_ACCESS_KEY: ${AWS_SNS_ACCESS_KEY}
      AWS_SNS_SECRET_KEY: ${AWS_SNS_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - misak-network
    restart: unless-stopped

  # Redis (Cache y sesiones)
  redis:
    image: redis:8-alpine
    container_name: misak-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - misak-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  misak-network:
    driver: bridge
```

### Variables de Entorno (.env)

```bash
# .env.production

# Database
DB_PASSWORD=your_secure_database_password_here
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost:5432/misak_dictionary

# JWT
JWT_ACCESS_SECRET=your_256_bit_access_secret_here
JWT_REFRESH_SECRET=your_256_bit_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@diccionario-misak.com
SMTP_PASSWORD=your_smtp_password_here
EMAIL_FROM="Diccionario Misak <noreply@diccionario-misak.com>"

# SMS (AWS SNS)
AWS_SNS_REGION=us-east-1
AWS_SNS_ACCESS_KEY=your_aws_access_key
AWS_SNS_SECRET_KEY=your_aws_secret_key

# Application
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://diccionario-misak.com
```

### Comandos de Deployment

```bash
# 1. Build de aplicaciones frontend
pnpm build:web
pnpm build:admin

# 2. Build de servicios backend
docker-compose build

# 3. Aplicar migraciones de base de datos
docker-compose exec postgres psql -U postgres -d misak_dictionary < database-schema-admin.sql

# 4. Crear usuario ROOT inicial
docker-compose exec postgres psql -U postgres -d misak_dictionary -c "
  INSERT INTO admin.users (username, email, full_name, password_hash, role, status)
  VALUES ('root', 'admin@diccionario-misak.com', 'Root Admin',
          '\$2b\$12\$...', 'ROOT', 'ACTIVE');
"

# 5. Iniciar servicios
docker-compose up -d

# 6. Verificar logs
docker-compose logs -f api-gateway

# 7. Health check
curl https://diccionario-misak.com/api/health
```

### Monitoreo

**Prometheus + Grafana:**

```yaml
# docker-compose.monitoring.yml

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: misak-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - '9090:9090'
    networks:
      - misak-network

  grafana:
    image: grafana/grafana:latest
    container_name: misak-grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - '3001:3000'
    networks:
      - misak-network

volumes:
  prometheus_data:
  grafana_data:
```

---

## 🔧 Mantenimiento

### Tareas Programadas

#### **Diarias**

```sql
-- Limpiar sesiones expiradas
SELECT admin.cleanup_expired_sessions();

-- Limpiar tokens de recuperación expirados
SELECT admin.cleanup_expired_recovery_tokens();

-- Desbloquear usuarios cuyo locked_until haya pasado
UPDATE admin.users
SET locked_until = NULL
WHERE locked_until < now();
```

#### **Semanales**

```sql
-- Vacuum y analyze de tablas de logs
VACUUM ANALYZE admin.admin_logs;
VACUUM ANALYZE admin.sessions;

-- Reporte de usuarios inactivos
SELECT username, email, last_login_at
FROM admin.users
WHERE last_login_at < now() - interval '30 days'
  AND deleted_at IS NULL;
```

#### **Mensuales**

```sql
-- Archivar logs antiguos (>6 meses)
-- Crear tabla de archivo
CREATE TABLE IF NOT EXISTS admin.admin_logs_archive
  (LIKE admin.admin_logs INCLUDING ALL);

-- Mover logs antiguos
WITH moved AS (
  DELETE FROM admin.admin_logs
  WHERE created_at < now() - interval '6 months'
  RETURNING *
)
INSERT INTO admin.admin_logs_archive
SELECT * FROM moved;

-- Backup de base de datos
-- pg_dump -U postgres -Fc misak_dictionary > backup_$(date +%Y%m%d).dump
```

### Backup y Recuperación

**Script de backup automático:**

```bash
#!/bin/bash
# /usr/local/bin/backup-misak-db.sh

BACKUP_DIR="/backups/misak"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="misak_dictionary_${DATE}.dump"

# Crear backup
pg_dump -U postgres -Fc misak_dictionary > "${BACKUP_DIR}/${FILENAME}"

# Comprimir
gzip "${BACKUP_DIR}/${FILENAME}"

# Eliminar backups antiguos (>30 días)
find "${BACKUP_DIR}" -name "*.dump.gz" -mtime +30 -delete

# Log
echo "[$(date)] Backup completado: ${FILENAME}.gz" >> /var/log/misak-backup.log
```

**Crontab:**

```cron
# Backup diario a las 2 AM
0 2 * * * /usr/local/bin/backup-misak-db.sh
```

**Restauración:**

```bash
# Restaurar desde backup
pg_restore -U postgres -d misak_dictionary -c backup_20251020_020000.dump
```

---

## 📚 Referencias y Recursos

### Documentación Oficial

- **PostgreSQL 17**: https://www.postgresql.org/docs/17/
- **Prisma 6**: https://www.prisma.io/docs
- **Fastify 5**: https://fastify.dev/
- **JWT**: https://jwt.io/introduction
- **Bcrypt**: https://github.com/kelektiv/node.bcrypt.js

### Seguridad

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP ASVS**: https://owasp.org/www-project-application-security-verification-standard/
- **NIST Password Guidelines**: https://pages.nist.gov/800-63-3/sp800-63b.html

### Best Practices

- **Node.js Security**: https://nodejs.org/en/learn/getting-started/security-best-practices
- **12 Factor App**: https://12factor.net/
- **REST API Design**: https://restfulapi.net/

---

**Autor**: Tumi Dev Team  
**Última Actualización**: 2025-10-20  
**Proyecto**: Diccionario Cultural Misak - Sistema Administrativo  
**Versión**: 1.0.0
