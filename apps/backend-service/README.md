# Backend Service - Diccionario Cultural Misak

Backend API service para el Diccionario Cultural Misak, construido con **Fastify**, **Prisma** y **TypeScript**.

## 🚀 Week 3-4: Backend Core Complete (100%)

### Stack Tecnológico

- **Node.js** 24.15.0+
- **Fastify** 5.6.2 - HTTP framework de alto rendimiento
- **Prisma** 7.0.1 - ORM type-safe con Driver Adapters para PostgreSQL
- **TypeScript** 5.9.2 - Lenguaje tipado
- **Zod** 4.1.11 - Validación de schemas
- **Argon2id** - Hashing criptográfico de contraseñas (Spec 002)
- **JWT** - Autenticación basada en tokens
- **Vitest** 4.0.14 - Testing framework

### Plugins Fastify

- **@fastify/cors** 11.1.0 - Cross-Origin Resource Sharing
- **@fastify/helmet** 13.0.2 - Headers de seguridad HTTP
- **@fastify/jwt** 10.0.0 - JWT authentication
- **@fastify/rate-limit** 10.3.0 - Rate limiting

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
- ✅ Password hashing seguro con Argon2id
- ✅ RBAC (Role-Based Access Control) con 6 roles administrativos
- ✅ Middleware de autenticación y autorización
- ✅ Session management
- ✅ Database seed con usuario admin
- ✅ **246 tests implementados** (Use Cases, DTOs, Controllers, Middleware, Repositories y Utils)

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

### 3. Ejecutar Migraciones de Base de Datos y Semilla

```bash
# Generar cliente de Prisma
pnpm --filter @misak/backend-service prisma:generate

# Aplicar migraciones numeradas
pnpm --filter @misak/backend-service prisma migrate deploy

# O sincronizar schema en entorno local de desarrollo
pnpm --filter @misak/backend-service db:push
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
pnpm --filter @misak/backend-service format            # Format con Biome
pnpm --filter @misak/backend-service format:check      # Check formatting con Biome
```

### Iniciar Servidor de Desarrollo

```bash
pnpm --filter @misak/backend-service dev
```

El servidor iniciará en `http://localhost:3000`:

```
╔═══════════════════════════════════════════════════╗
║  🎭 Diccionario Cultural Misak - Backend API      ║
║  📌 Version: 0.4.0-alpha.0                        ║
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
│   │   │   └── AdminSentidoDto.ts
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

### Jerarquía Semántica

La estructura del diccionario sigue una jerarquía de 3 niveles:

```
Campo Semántico (Nivel 1)
└── Subcampo Semántico (Nivel 2)
    └── Microcampo (Nivel 3)
        └── Palabras (Modelo 1 y Modelo 2)
```

**Ejemplo**:

```
Campo: "Naturaleza"
└── Subcampo: "Flora"
    └── Microcampo: "Plantas medicinales"
        ├── Palabra1: "yerbatero" → "Persona que conoce plantas"
        └── Palabra2: "¿Qué es un remedio natural?" → "Medicina de plantas"
```

### Comandos Útiles de Prisma

```bash
# Generar cliente Prisma después de cambios en schema
pnpm --filter @misak/backend-service prisma:generate

# Ver/editar datos en Prisma Studio (GUI)
pnpm --filter @misak/backend-service prisma:studio

# Sincronizar schema con DB (sin migraciones)
pnpm --filter @misak/backend-service db:push

# Seed inicial de datos (usuario admin + roles)
pnpm --filter @misak/backend-service db:seed
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
- ✅ Argon2id para passwords (Spec 002)
- ✅ Input validation con Zod en todos los endpoints
- ✅ Rate limiting configurado
- ✅ Session management
- ✅ Authorization middleware por roles

---

## 🏗️ Arquitectura y Patrones

### Clean Architecture

El proyecto sigue los principios de **Clean Architecture** con capas bien definidas:

```
src/
├── domain/              # Capa de dominio (Business Logic)
│   ├── entities/       # Entidades de dominio
│   └── interfaces/     # Contratos (interfaces de repositorios)
│
├── application/         # Capa de aplicación (Use Cases)
│   ├── dtos/           # Data Transfer Objects con validación Zod
│   └── use-cases/      # Casos de uso de negocio
│       ├── auth/       # Login, Refresh, Logout
│       ├── admin/      # CRUD de administración
│       └── dictionary/ # Consultas públicas del diccionario
│
├── infrastructure/      # Capa de infraestructura (implementaciones)
│   ├── auth/           # TokenService, PasswordService
│   └── repositories/   # Implementación de repositorios con Prisma
│
├── presentation/        # Capa de presentación (API HTTP)
│   ├── controllers/    # Controllers HTTP
│   ├── routes/         # Definición de rutas
│   └── middleware/     # Middleware de autenticación y autorización
│
└── shared/              # Código compartido
    ├── config/         # Configuración (env, prisma, logger)
    ├── errors/         # Manejo de errores centralizado
    └── types/          # Tipos TypeScript compartidos
```

**Principios aplicados**:

- **Dependency Inversion**: Las capas internas no dependen de las externas
- **Single Responsibility**: Cada clase/módulo tiene una responsabilidad única
- **Separation of Concerns**: Lógica de negocio separada de infraestructura
- **Dependency Injection**: Inyección de dependencias manual

### Patrones de Diseño Implementados

#### Repository Pattern

Abstracción del acceso a datos:

```typescript
// Domain Interface
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
}

// Infrastructure Implementation
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

#### Use Case Pattern

Cada caso de uso encapsula una operación de negocio:

```typescript
export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private tokenService: ITokenService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponse> {
    // 1. Validar usuario
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError();

    // 2. Verificar contraseña
    const isValid = await this.passwordService.verify(
      dto.password,
      user.password,
    );
    if (!isValid) throw new UnauthorizedError();

    // 3. Generar tokens
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return { accessToken, refreshToken, user };
  }
}
```

#### Singleton Pattern

Prisma Client como singleton para evitar múltiples conexiones:

```typescript
class PrismaService {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
    return PrismaService.instance;
  }
}
```

### RBAC (Role-Based Access Control)

**5 Roles definidos**:

1. **super_admin** - Control total del sistema
2. **content_admin** - Administración de contenido del diccionario
3. **editor** - Creación y edición de palabras
4. **translator** - Traducción de contenido
5. **viewer** - Solo lectura (admin panel)

**Middleware de Autorización**:

```typescript
export const requireRole = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRoles = request.user.roles;
    const hasRole = userRoles.some((role) => roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenError("Insufficient permissions");
    }
  };
};

// Uso en rutas
server.post(
  "/api/admin/words",
  {
    preHandler: [authenticate, requireRole(["editor", "content_admin"])],
  },
  createWordHandler,
);
```

### Validación de Datos con Zod

Todos los DTOs utilizan Zod para validación:

```typescript
export const LoginDtoSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Contraseña debe tener mínimo 8 caracteres"),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

// En el controller
const loginHandler = async (request: FastifyRequest) => {
  const dto = LoginDtoSchema.parse(request.body); // Valida o lanza error
  return await loginUseCase.execute(dto);
};
```

## ✅ Week 3-4 Completado (100%)

Todos los sprints del Week 3-4 han sido completados exitosamente:

- ✅ Sprint 1: Backend Foundation
- ✅ Sprint 2: Auth System (base autenticacion completada)
- ✅ Sprint 3: Dictionary API público (12 endpoints)
- ✅ Sprint 4: Admin API protegido (12 endpoints CRUD)

**Testing**: 246 tests implementados cubriendo:

- PasswordService, TokenService y servicios de auth
- Login, Refresh, Logout y casos de uso admin/dictionary
- DTOs, controllers HTTP y middlewares de autenticacion/autorizacion
- Repositories Prisma y utilidades PostgreSQL 18

### Cobertura de Tests

**Capas testeadas**:

- ✅ **Services**: Servicios de infraestructura (Password, Token)
- ✅ **Use Cases**: Lógica de negocio (Login, Refresh, Logout)
- ✅ **Controllers**: Endpoints HTTP con mocks
- ✅ **Repositories**: Integración con Prisma cubierta por tests unitarios
- 🔜 **E2E**: Tests end-to-end con Supertest (planificado)

**Best Practices aplicadas**:

- **AAA Pattern**: Arrange-Act-Assert en todos los tests
- **Mocking**: Mock de dependencias externas (Prisma, bcrypt)
- **Test Isolation**: Cada test es independiente
- **Descriptive Names**: Nombres descriptivos que documentan el comportamiento

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
sudo service postgresql star
sudo service postgresql status
sudo service postgresql stop

# Probar conexión
psql -h localhost -U postgres

# O probar conexión directamente a la base de datos
psql -h localhost -U postgres -d misak_dictionary
```

### Error: "Prisma Client not generated"

Ejecuta:

```bash
pnpm --filter @misak/backend-service prisma:generate
```

---

## 🗄️ PostgreSQL 18 Features

El proyecto aprovecha características avanzadas de PostgreSQL 18.1:

- **Extensiones**: citext, pg_trgm, pgvector, unaccent, btree_gin, btree_gist
- **Full-Text Search**: Funciones optimizadas con `immutable_unaccent`
- **Fuzzy Search**: Búsqueda difusa con trigrams (similarity threshold 0.3)
- **Índices GIN**: Búsqueda optimizada sobre sentidos léxicos y formas Namtrik

---

## 📚 Recursos

- [Fastify Documentation](https://www.fastify.io/)
- [Prisma 7 Documentation](https://www.prisma.io/docs/)
- [PostgreSQL 18 Docs](https://www.postgresql.org/docs/18/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod 4 Documentation](https://zod.dev/)

---

**Version**: 0.5.0-alpha.0  
**Last Updated**: 2026-10-31  
**PostgreSQL**: 18.1 | **Prisma**: 7.0.1 | **Zod**: 4.1.11  
**Author**: Tumi-dev
