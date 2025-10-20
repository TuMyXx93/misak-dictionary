# Backend Service - Diccionario Cultural Misak

Backend API service para el Diccionario Cultural Misak, construido con **Fastify**, **Prisma** y **TypeScript**.

## 🚀 Week 3 - Sprint 1: Backend Foundation

### Stack Tecnológico

- **Node.js** 22.20.0+
- **Fastify** 5.1.0 - HTTP framework de alto rendimiento
- **Prisma** 6.6.0 - ORM type-safe para PostgreSQL
- **TypeScript** 5.9.2 - Lenguaje tipado
- **Zod** 3.24.1 - Validación de schemas
- **Bcrypt** - Hashing de contraseñas
- **JWT** - Autenticación basada en tokens

### Características Implementadas

✅ **Infraestructura Base**:

- Fastify configurado con plugins de seguridad
- Prisma ORM con schema completo (admin + diccionario)
- Variables de entorno validadas con Zod
- TypeScript con configuración estricta

✅ **Seguridad**:

- Helmet para headers HTTP seguros
- CORS configurado
- Rate limiting
- Validación de entorno

✅ **Arquitectura**:

- Clean Architecture preparada (domain, application, infrastructure, presentation)
- Singleton pattern para Prisma Client
- Graceful shutdown
- Health check endpoint

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
│   ├── schema.prisma          # Schema de Prisma (admin + diccionario)
│   └── seed.ts                # Seed de datos iniciales (próximo)
├── src/
│   ├── domain/                # Entidades de dominio (próximo)
│   ├── application/           # Casos de uso (próximo)
│   ├── infrastructure/        # Implementaciones concretas (próximo)
│   ├── presentation/          # Controllers y routes (próximo)
│   ├── shared/
│   │   ├── config/
│   │   │   ├── env.ts         # Configuración de entorno
│   │   │   └── prisma.ts      # Cliente Prisma singleton
│   │   └── types/             # Tipos TypeScript compartidos (próximo)
│   ├── app.ts                 # Configuración de Fastify
│   └── server.ts              # Entry point del servidor
├── tests/                     # Tests unitarios y de integración (próximo)
├── .env.example               # Template de variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Endpoints Disponibles

### Health & Status

#### `GET /`

Información general de la API.

**Response**:

```json
{
  "name": "Diccionario Cultural Misak - Backend API",
  "version": "0.3.0",
  "documentation": "/docs",
  "health": "/health"
}
```

#### `GET /health`

Health check del servicio.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-10-20T12:30:00.000Z",
  "uptime": 1234.56,
  "environment": "development"
}
```

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

### Próximos (Sprint 2)

- [ ] JWT Authentication
- [ ] RBAC (Role-Based Access Control)
- [ ] Bcrypt para passwords
- [ ] CSRF Protection
- [ ] Input validation con Zod

---

## 📝 Próximos Pasos

### Sprint 2: Auth System (Días 4-5)

- [ ] Implementar JWT service
- [ ] Endpoints de login/logout/refresh
- [ ] Middleware de autenticación
- [ ] Sistema de roles y permisos (RBAC)
- [ ] Tests de autenticación

### Sprint 3: Dictionary API (Días 6-8)

- [ ] Endpoints públicos de lectura
- [ ] Búsqueda full-text
- [ ] Filtros por campos semánticos
- [ ] Paginación y sorting

### Sprint 4: Admin API (Días 9-10)

- [ ] CRUD de palabras (requiere auth)
- [ ] CRUD de estructura semántica
- [ ] Upload de multimedia
- [ ] Bulk import

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
