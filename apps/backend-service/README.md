# Backend Service - Diccionario Cultural Misak

Backend API service para el Diccionario Cultural Misak, construido con **Fastify**, **Prisma** y **TypeScript**.

## 🚀 Week 3-4: Backend Core Complete (100%)

### Stack Tecnológico

- **Node.js** 22.20.0+
- **Fastify** 5.1.0 - HTTP framework de alto rendimiento
- **Prisma** 6.6.0 - ORM type-safe para PostgreSQL
- **TypeScript** 5.9.2 - Lenguaje tipado
- **Zod** 3.24.1 - Validación de schemas
- **Bcrypt** - Hashing de contraseñas
- **JWT** - Autenticación basada en tokens

### ✅ Características Implementadas (4 Sprints Completados)

#### Sprint 1: Backend Foundation (100%)

- ✅ Fastify configurado con plugins de seguridad (Helmet, CORS, Rate Limiting)
- ✅ Prisma ORM con schema completo (admin + diccionario)
- ✅ Variables de entorno validadas con Zod
- ✅ TypeScript con configuración estricta
- ✅ Clean Architecture implementada
- ✅ Singleton pattern para Prisma Client
- ✅ Graceful shutdown
- ✅ Health check endpoint

#### Sprint 2: Auth System (100%)

- ✅ JWT Authentication (access + refresh tokens)
- ✅ Login/Logout/Refresh endpoints
- ✅ Password hashing con Bcrypt
- ✅ RBAC (Role-Based Access Control) con 5 roles
- ✅ Middleware de autenticación y autorización
- ✅ Session management
- ✅ Database seed con usuario admin
- ✅ **56 tests implementados** (Services + Use Cases + Controller)

#### Sprint 3: Dictionary API Público (100%)

- ✅ 12 endpoints públicos de lectura
- ✅ Búsqueda full-text por término
- ✅ Filtros por idioma (Namtrik/Español)
- ✅ Endpoints de jerarquía semántica (Campo → Subcampo → Microcampo)
- ✅ Paginación y sorting
- ✅ Cache de consultas frecuentes

#### Sprint 4: Admin API (100%)

- ✅ 12 endpoints CRUD protegidos con autenticación
- ✅ CRUD de palabras (Modelo 1 y Modelo 2)
- ✅ CRUD de estructura semántica completa
- ✅ Soft delete con campo deletedAt
- ✅ Validación de duplicados
- ✅ Middleware de autorización por roles

---

## 📦 Instalación

### 1. Instalar Dependencias

Desde la raíz del proyecto:

```bash
pnpm install
```

### 2. Configurar Variables de Entorno

```bash
cd apps/backend-service
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/misak_dictionary?schema=public
JWT_SECRET=tu-secreto-jwt-de-al-menos-32-caracteres-aqui
JWT_REFRESH_SECRET=tu-secreto-refresh-token-de-al-menos-32-caracteres
```

### 3. Ejecutar Migraciones de Base de Datos

```bash
# Opción A: Ejecutar schemas SQL directamente en PostgreSQL
psql -U postgres -d misak_dictionary -f infrastructure/database/prototypes/database-schema-admin.sql
psql -U postgres -d misak_dictionary -f infrastructure/database/prototypes/database-schema_dictionary.sql

# Opción B: Usar Prisma (después de ejecutar los SQL)
pnpm --filter @misak/backend-service prisma:generate
```

---

## 🛠️ Desarrollo

### Comandos Disponibles

```bash
# Iniciar servidor en modo desarrollo (hot reload)
pnpm --filter @misak/backend-service dev

# Build para producción
pnpm --filter @misak/backend-service build

# Iniciar en producción
pnpm --filter @misak/backend-service start

# Prisma commands
pnpm --filter @misak/backend-service prisma:generate   # Generar cliente Prisma
pnpm --filter @misak/backend-service prisma:migrate    # Crear migración
pnpm --filter @misak/backend-service prisma:studio     # Abrir Prisma Studio
pnpm --filter @misak/backend-service db:push           # Sincronizar schema con DB
pnpm --filter @misak/backend-service db:seed           # Seed inicial de datos

# Testing
pnpm --filter @misak/backend-service test              # Run tests
pnpm --filter @misak/backend-service test:watch        # Watch mode
pnpm --filter @misak/backend-service test:coverage     # Coverage report

# Linting y Formatting
pnpm --filter @misak/backend-service lint              # Lint código
pnpm --filter @misak/backend-service lint:fix          # Fix lint issues
pnpm --filter @misak/backend-service format            # Format con Prettier
pnpm --filter @misak/backend-service format:check      # Check formatting
```

### Iniciar Servidor de Desarrollo

```bash
pnpm --filter @misak/backend-service dev
```

El servidor iniciará en `http://localhost:3000`:

```
╔═══════════════════════════════════════════════════╗
║  🎭 Diccionario Cultural Misak - Backend API      ║
║  📌 Version: 0.3.0                                ║
║  🌐 Environment: development                      ║
║  🚀 Server: http://0.0.0.0:3000                   ║
║  💚 Health: http://0.0.0.0:3000/health            ║
║  📊 Status: Running                               ║
╚═══════════════════════════════════════════════════╝
```

---

## 📂 Estructura del Proyecto

```
apps/backend-service/
├── prisma/
│   ├── schema.prisma               # Schema de Prisma (admin + diccionario)
│   └── seed.ts                     # Seed con usuario admin y roles
├── src/
│   ├── domain/
│   │   └── interfaces/             # Interfaces de repositorios y servicios
│   ├── application/
│   │   ├── dtos/                   # DTOs con validación Zod
│   │   │   ├── AuthDTO.ts
│   │   │   ├── DictionaryDto.ts
│   │   │   └── AdminDictionaryDto.ts
│   │   └── use-cases/              # Casos de uso de negocio
│   │       ├── auth/               # Login, Refresh, Logout
│   │       ├── admin/              # CRUD admin
│   │       └── dictionary/         # Consultas públicas
│   ├── infrastructure/
│   │   ├── auth/                   # TokenService, PasswordService
│   │   └── repositories/           # Implementación de repositorios Prisma
│   ├── presentation/
│   │   ├── controllers/            # Controllers HTTP
│   │   ├── routes/                 # Definición de rutas
│   │   └── middleware/             # Auth y autorización middleware
│   ├── api/
│   │   ├── dictionary/             # API público del diccionario
│   │   └── admin/                  # API admin protegida
│   ├── shared/
│   │   ├── config/                 # Configuración (env, prisma, logger)
│   │   ├── errors/                 # AppError y manejo de errores
│   │   └── types/                  # Tipos TypeScript compartidos
│   ├── test/                       # Setup de tests
│   ├── app.ts                      # Configuración de Fastify
│   └── server.ts                   # Entry point del servidor
├── vitest.config.ts                # Configuración de tests
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Endpoints Disponibles

### Health & Status

- `GET /` - Información de la API
- `GET /health` - Health check

### 🔐 Auth Endpoints (Sprint 2)

- `POST /auth/login` - Autenticación de usuario
- `POST /auth/refresh` - Renovar access token
- `POST /auth/logout` - Cerrar sesión

### 📖 Dictionary API - Público (Sprint 3)

**Palabras**:

- `GET /api/dictionary/words` - Listar todas las palabras
- `GET /api/dictionary/words/:id` - Obtener palabra por ID
- `GET /api/dictionary/words/search` - Búsqueda full-text

**Jerarquía Semántica**:

- `GET /api/dictionary/semantic-fields` - Listar campos semánticos
- `GET /api/dictionary/semantic-fields/:id` - Campo con subcampos
- `GET /api/dictionary/semantic-fields/:id/subcampos` - Subcampos de un campo
- `GET /api/dictionary/subcampos/:id` - Subcampo con microcampos
- `GET /api/dictionary/subcampos/:id/microcampos` - Microcampos de un subcampo
- `GET /api/dictionary/microcampos/:id` - Microcampo con palabras
- `GET /api/dictionary/microcampos/:id/words` - Palabras de un microcampo

### 🔒 Admin API - Protegido (Sprint 4)

**Gestión de Palabras** (requiere auth + rol editor):

- `POST /api/admin/dictionary/words/modelo1` - Crear palabra
- `PUT /api/admin/dictionary/words/modelo1/:id` - Actualizar palabra
- `DELETE /api/admin/dictionary/words/modelo1/:id` - Eliminar palabra (soft delete)

**Gestión de Campos Semánticos**:

- `POST /api/admin/dictionary/semantic-fields` - Crear campo
- `PUT /api/admin/dictionary/semantic-fields/:id` - Actualizar campo
- `DELETE /api/admin/dictionary/semantic-fields/:id` - Eliminar campo

**Gestión de Subcampos**:

- `POST /api/admin/dictionary/semantic-fields/:id/subcampos` - Crear subcampo
- `PUT /api/admin/dictionary/subcampos/:id` - Actualizar subcampo
- `DELETE /api/admin/dictionary/subcampos/:id` - Eliminar subcampo

**Gestión de Microcampos**:

- `POST /api/admin/dictionary/subcampos/:id/microcampos` - Crear microcampo
- `PUT /api/admin/dictionary/microcampos/:id` - Actualizar microcampo
- `DELETE /api/admin/dictionary/microcampos/:id` - Eliminar microcampo

---

## 🗄️ Base de Datos

### Schema Prisma

El schema incluye:

**Sistema Administrativo**:

- `User` - Usuarios del sistema
- `Role` - Roles (super_admin, content_admin, etc.)
- `Permission` - Permisos granulares
- `UserRole` - Relación User ↔ Role
- `RolePermission` - Relación Role ↔ Permission
- `Session` - Sesiones activas
- `PasswordReset` - Tokens de recuperación de contraseña

**Diccionario Cultural**:

- `CampoSemantico` - Campos semánticos (nivel 1)
- `SubcampoSemantico` - Subcampos (nivel 2)
- `Microcampo` - Microcampos (nivel 3)
- `PalabraModelo1` - Palabras (término-descripción)
- `PalabraModelo2` - Palabras (pregunta-respuesta)
- `PalabraM1Microcampo` - Relación Palabra1 ↔ Microcampo
- `PalabraM2Microcampo` - Relación Palabra2 ↔ Microcampo

### Comandos Útiles de Prisma

```bash
# Generar cliente Prisma después de cambios en schema
pnpm --filter @misak/backend-service prisma:generate

# Ver/editar datos en Prisma Studio (GUI)
pnpm --filter @misak/backend-service prisma:studio

# Sincronizar schema con DB (sin migraciones)
pnpm --filter @misak/backend-service db:push
```

---

## 🔐 Seguridad

### Features Implementadas

- ✅ **Helmet**: Headers HTTP seguros (CSP, HSTS, etc.)
- ✅ **CORS**: Control de orígenes permitidos
- ✅ **Rate Limiting**: Protección contra fuerza bruta
- ✅ **Validación de Entorno**: Zod valida todas las env vars al inicio
- ✅ **Graceful Shutdown**: Cierre ordenado de conexiones

### Seguridad Implementada

- ✅ JWT Authentication (access + refresh tokens)
- ✅ RBAC (Role-Based Access Control)
- ✅ Bcrypt para passwords (10 rounds)
- ✅ Input validation con Zod en todos los endpoints
- ✅ Rate limiting configurado
- ✅ Session management
- ✅ Authorization middleware por roles

---

## ✅ Week 3-4 Completado (100%)

Todos los sprints del Week 3-4 han sido completados exitosamente:

- ✅ Sprint 1: Backend Foundation
- ✅ Sprint 2: Auth System (con 56 tests)
- ✅ Sprint 3: Dictionary API público (12 endpoints)
- ✅ Sprint 4: Admin API protegido (12 endpoints CRUD)

**Testing**: 56 tests implementados cubriendo:

- PasswordService (7 tests)
- TokenService (15 tests)
- LoginUseCase (7 tests)
- RefreshTokenUseCase (8 tests)
- LogoutUseCase (5 tests)
- AuthController (14 tests)

## 📝 Próximos Pasos (Week 5+)

- [ ] ElasticSearch para búsqueda semántica avanzada
- [ ] Upload de multimedia (Cloudinary/S3)
- [ ] Bulk import de palabras
- [ ] WebSockets para notificaciones en tiempo real
- [ ] API rate limiting por usuario
- [ ] Logging avanzado (Winston/Pino)
- [ ] Metrics y monitoring (Prometheus)

---

## 🐛 Troubleshooting

### Error: "Invalid environment variables"

Asegúrate de que `.env` existe y contiene todas las variables requeridas (especialmente `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).

### Error: "Database connection failed"

Verifica que PostgreSQL esté corriendo y las credenciales en `DATABASE_URL` sean correctas:

```bash
# Linux/Mac
sudo systemctl status postgresql

# Probar conexión
psql -U postgres -d misak_dictionary
```

### Error: "Prisma Client not generated"

Ejecuta:

```bash
pnpm --filter @misak/backend-service prisma:generate
```

---

## 📚 Recursos

- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

---

**Version**: 0.3.0  
**Last Updated**: 2025-10-20  
**Author**: Tumi-dev
