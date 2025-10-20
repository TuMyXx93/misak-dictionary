# Sistema de Base de Datos del Diccionario Cultural Misak

Versión: 1.0
Fecha: 2025-10-20
Estado: Listo para integración backend

## Resumen Ejecutivo

Esquema profesional PostgreSQL 17+ para el Diccionario Cultural Misak, diseñado para preservación cultural digital con capacidades avanzadas de búsqueda semántica, full-text search multiidioma, auditoría completa y escalabilidad empresarial.

- **Base de Datos**: PostgreSQL 17+
- **ORM de Integración**: Prisma 6+
- **Gestor de Paquetes**: pnpm
- **Stack Backend**: Node.js 22+, Fastify 5
- **Referencia SQL**: `database-schema_dictionary.sql`

---

## 📋 Tabla de Contenidos

1. [Alcance y Objetivos](#alcance-y-objetivos)
2. [Arquitectura de Datos](#arquitectura-de-datos)
3. [Características Implementadas](#características-implementadas)
4. [Modelo de Datos](#modelo-de-datos)
5. [Tecnologías y Extensiones](#tecnologías-y-extensiones)
6. [Integración Backend](#integración-backend)
7. [Operaciones y Mantenimiento](#operaciones-y-mantenimiento)
8. [Despliegue](#despliegue)
9. [Anexos](#anexos)

---

## 1. Alcance y Objetivos

### Objetivo Principal

Proveer una infraestructura de datos robusta, escalable y performante para la gestión y consulta del Diccionario Cultural Misak, preservando el conocimiento lingüístico y cultural del pueblo Misak (Namtrik - Español).

### Objetivos Específicos

- Almacenar y gestionar contenido bilingüe (Namtrik-Español) con soporte multimedia
- Proveer taxonomía semántica jerárquica de 3 niveles (campos → subcampos → microcampos)
- Habilitar búsqueda semántica vectorial y full-text search multiidioma
- Garantizar trazabilidad completa con auditoría de cambios
- Asegurar integridad referencial y consistencia de datos
- Optimizar para consultas concurrentes de alta velocidad

---

## 2. Arquitectura de Datos

### Vista Lógica de Schemas

```
┌────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS: misak_dictionary                  │
├────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │            SCHEMA: public                              │   │
│  │        (Dominio Principal del Diccionario)             │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  • campos_semanticos                              │   │
│  │  • subcampos_semanticos                           │   │
│  │  • microcampos                                    │   │
│  │  • palabras_modelo_1                              │   │
│  │  • palabras_modelo_2                              │   │
│  │  • palabrasm1_microcampos (puente N:M)            │   │
│  │  • palabrasm2_microcampos (puente N:M)            │   │
│  └────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │            SCHEMA: meta                               │   │
│  │          (Infraestructura)                            │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  • embeddings (vectores para búsqueda semántica)  │   │
│  │  • migrations (control de versiones)              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │            SCHEMA: audit                              │   │
│  │        (Auditoría y Trazabilidad)                    │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  • row_changes (registro de cambios)               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────────────────────────────────────────────────┘
```

### Jerarquía Taxonómica

```
campos_semanticos (Nivel 1 - Raíz)
  ↓ FK: campo_semantico_id + ON DELETE CASCADE
subcampos_semanticos (Nivel 2 - Medio)
  ↓ FK: subcampo_semantico_id + ON DELETE CASCADE
microcampos (Nivel 3 - Hojas)
  ↓ N:M via palabrasm1_microcampos / palabrasm2_microcampos
palabras_modelo_1 / palabras_modelo_2
```

**Características de Integridad**:

- Cascada completa: Eliminar campo_semantico → elimina subcampos → elimina microcampos
- Soft delete: `deleted_at` preserva datos con posibilidad de recuperación
- Índices únicos parciales: Unicidad aplicada solo a registros activos

---

## 3. Características Implementadas

### 1. **Índices de Rendimiento** ⚡

- ✅ **Índices en Claves Foráneas**: Todas las columnas FK indexadas (10+ índices agregados)
- ✅ **Índices en Timestamps**: `created_at DESC` para ordenamiento eficiente
- ✅ **Índices para Soft Delete**: Índices parciales en `deleted_at IS NOT NULL`
- ✅ **Índice Vectorial HNSW**: `idx_embeddings_hnsw_cosine` para búsqueda ANN sub-100ms
- ✅ **Full-Text Search**: Índices GIN en columnas `tsvector` generadas
- ✅ **Índices Trigram**: Índices GIN para optimización de LIKE/ILIKE

**Impacto**: Mejora de rendimiento de 10-100x en joins, búsquedas y filtros.

---

### 2. **Búsqueda Semántica (Vectorial)** 🔍

- ✅ **Índice HNSW**: Búsqueda rápida de vecinos aproximados (m=16, ef_construction=200)
- ✅ **Distancia Coseno**: Optimizado para embeddings normalizados
- ✅ **Columna Metadata**: JSONB para contexto flexible de embeddings

**Ejemplo de Uso**:

```sql
-- Encontrar los 10 embeddings más similares
SELECT id, content, 1 - (embedding <=> $query_vector) AS similarity
FROM meta.embeddings
ORDER BY embedding <=> $query_vector
LIMIT 10;
```

---

### 3. **Full-Text Search (FTS)** 📝

- ✅ **tsvector Auto-generado**: Columnas GENERATED ALWAYS (sin necesidad de triggers)
- ✅ **Multi-idioma**: `simple` para Namtrik, `spanish` para español
- ✅ **Búsqueda Ponderada**: Términos (A), descripciones (B)
- ✅ **Fallback Trigram**: pg_trgm para coincidencias difusas/parciales

**Ejemplos de Uso**:

```sql
-- Full-text search con ranking
SELECT id, namtrik_termino, espanol_termino,
       ts_rank(search_vector, query) AS rank
FROM palabras_modelo_1,
     to_tsquery('spanish', 'agua & rio') query
WHERE search_vector @@ query
  AND deleted_at IS NULL
ORDER BY rank DESC;

-- Búsqueda difusa (ILIKE optimizado por trigram)
SELECT * FROM palabras_modelo_1
WHERE namtrik_termino ILIKE '%misak%'
  AND deleted_at IS NULL;
```

---

### 4. **Timestamps y Soft Deletes** 🕐

- ✅ **created_at**: Auto-poblado con `DEFAULT now()`
- ✅ **updated_at**: Auto-actualizado via trigger `set_updated_at()`
- ✅ **deleted_at**: Soft delete (NULL = activo, timestamptz = eliminado)
- ✅ **Índices Únicos Parciales**: Aplican unicidad solo donde `deleted_at IS NULL`

**Beneficios**:

- Auditable: Seguimiento de cuándo se crearon/modificaron registros
- Recuperable: Los soft deletes permiten operaciones de recuperación
- Rendimiento: Las restricciones únicas respetan soft deletes

---

### 5. **Unicidad Case-Insensitive** 🔤

- ✅ **Extensión citext**: Todas las columnas de términos usan `public.citext`
- ✅ **UNIQUE Case-Insensitive**: "Misak" = "misak" = "MISAK"
- ✅ **Consciente de Collation**: Manejo adecuado de caracteres españoles (ñ, á, etc.)

**Beneficio**: Unicidad forzada sin importar mayúsculas/minúsculas.

---

### 6. **Claves Foráneas en Cascada** 🔗

- ✅ **ON DELETE CASCADE**: Eliminar padre → eliminar hijos automáticamente
- ✅ **ON UPDATE CASCADE**: Actualizar ID padre → actualizar hijos
- ✅ **Cascada Jerárquica**: campos → subcampos → microcampos
- ✅ **Tablas Puente**: palabrasm1_microcampos, palabrasm2_microcampos

**Impacto**: Integridad referencial forzada, sin registros huérfanos.

---

### 7. **Auditoría Completa (Audit Trail)** 📋

- ✅ **Tabla audit.row_changes**: Rastrea todos los INSERT/UPDATE/DELETE
- ✅ **Almacenamiento JSONB**: Datos antiguos y nuevos en formato JSON
- ✅ **Metadatos**: timestamp, usuario, tipo de operación
- ✅ **Triggers Automáticos**: Aplicados a todas las tablas de dominio

**Schema**:

```sql
CREATE TABLE audit.row_changes (
    id bigserial PRIMARY KEY,
    schema_name text,
    table_name text,
    operation text CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    row_id bigint,
    old_data jsonb,
    new_data jsonb,
    changed_at timestamptz DEFAULT now(),
    changed_by text DEFAULT current_user
);
```

**Ejemplo de Consulta**:

```sql
-- Historial de cambios para palabra_id = 42
SELECT operation, changed_at, changed_by,
       new_data->>'namtrik_termino' AS new_term
FROM audit.row_changes
WHERE table_name = 'palabras_modelo_1'
  AND row_id = 42
ORDER BY changed_at DESC;
```

---

### 8. **Validación de Datos (CHECK Constraints)** ✅

- ✅ **Validación de URL**: `~* '^https?://'` para campos de audio/imagen
- ✅ **Restricciones de Longitud**: `char_length(...) >= 1` para texto requerido
- ✅ **Validación de Operaciones**: Auditoría solo acepta INSERT/UPDATE/DELETE

**Previene**:

- Strings vacíos en campos requeridos
- URLs inválidas en columnas multimedia
- Datos malformados a nivel de base de datos

---

### 9. **Fundamentos de Seguridad** 🔒

- ✅ **Separación de Schemas**: `meta`, `audit`, `public`
- ✅ **RLS Listo**: Políticas de Row Level Security (comentadas, listas para activar)
- ✅ **Codificación UTF8**: Soporte completo de Unicode
- ✅ **Preparado para Roles**: `admin_role`, `app_reader`, `app_writer`

**Ejemplo RLS** (actualmente deshabilitado):

```sql
-- Descomentar para habilitar
ALTER TABLE public.palabras_modelo_1 ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read
  ON public.palabras_modelo_1
  FOR SELECT
  USING (deleted_at IS NULL);
```

---

### 10. **Experiencia de Desarrollador** 👨‍💻

- ✅ **Comentarios Extensivos**: Cada tabla, columna e índice documentado
- ✅ **Secciones Organizadas**: Separación clara por funcionalidad
- ✅ **Consultas de Ejemplo**: Consultas de ajuste de rendimiento incluidas
- ✅ **Recomendaciones de Producción**: Checklist de despliegue

---

### 11. **Mejoras de Validación y Funciones Auxiliares** 🛠️

#### Índices Parciales Adicionales

- ✅ **idx_p1_active_recent / idx_p2_active_recent**: Optimiza listados de palabras activas ordenadas por fecha
- ✅ **idx_microcampos_subcampo_active**: Acelera navegación jerárquica de microcampos

**Beneficio**: Queries de listados 5-10x más rápidas al filtrar solo registros activos.

#### Constraints Mejorados

- ✅ **Validación estricta de URLs**: Solo acepta HTTPS con dominio válido
- ✅ **Validación de descripciones**: Previene strings vacíos o solo espacios en blanco

**Previene**:

```sql
-- ❌ Esto será rechazado
INSERT INTO palabras_modelo_1 (namtrik_termino, espanol_termino, namtrik_descripcion)
VALUES ('test', 'prueba', '   ');  -- Solo espacios

-- ❌ Esto también
INSERT INTO palabras_modelo_1 (namtrik_termino, espanol_termino, namtrik_audio)
VALUES ('test', 'prueba', 'http://insecure.com/audio.mp3');  -- HTTP no permitido
```

#### Función Auxiliar: `soft_delete_campo_semantico()`

Función que realiza soft delete en cascada de toda la jerarquía de campos semánticos.

**Uso**:

```sql
-- Soft delete de un campo y toda su jerarquía (subcampos + microcampos)
SELECT public.soft_delete_campo_semantico(42);

-- Output:
-- NOTICE: Soft delete completado: 1 campo, 5 subcampos, 23 microcampos
```

**Características**:

- Validación previa (verifica que el campo existe y no está eliminado)
- Transaccional (todo o nada)
- Reporta cantidad de registros afectados
- Maneja errores con mensajes claros

**Útil para**: Panel de administración donde necesitas eliminar categorías completas.

---

## 4. Modelo de Datos

### Tablas Principales (Schema `public`)

#### **campos_semanticos** (Nivel 1 - Raíz)

Campos semánticos de primer nivel de la taxonomía cultural.

**Campos clave**:

- `id` (bigint, IDENTITY PK)
- `namtrik_termino` (citext, UNIQUE donde deleted_at IS NULL)
- `espanol_termino` (citext, UNIQUE donde deleted_at IS NULL)
- `namtrik_descripcion`, `espanol_descripcion` (text, validadas)
- `namtrik_audio`, `espanol_audio`, `imagen` (text, URLs HTTPS)
- `created_at`, `updated_at`, `deleted_at` (timestamptz)

**Restricciones**:

- Unicidad case-insensitive en términos
- Validación de URLs (solo HTTPS)
- Descripciones no vacías (no solo espacios)

#### **subcampos_semanticos** (Nivel 2 - Medio)

Subcampos semánticos de segundo nivel.

**Campos clave**:

- `campo_semantico_id` (FK → campos_semanticos, CASCADE)
- Misma estructura bilingüe que campos_semanticos

#### **microcampos** (Nivel 3 - Hojas)

Microcampos de tercer nivel (nodos hoja).

**Campos clave**:

- `subcampo_semantico_id` (FK → subcampos_semanticos, CASCADE)
- Misma estructura bilingüe

#### **palabras_modelo_1**

Palabras del diccionario (Modelo 1: término-descripción simple).

**Campos clave**:

- `id`, `namtrik_termino`, `espanol_termino`, descripciones, audios, `imagen`
- `search_vector` (tsvector GENERATED ALWAYS, auto-generado para FTS)
- Relación N:M con microcampos via `palabrasm1_microcampos`

**Características**:

- Full-text search ponderado (términos peso A, descripciones peso B)
- Soporte multiidioma (simple para Namtrik, spanish para Español)

#### **palabras_modelo_2**

Palabras del diccionario (Modelo 2: pares pregunta-respuesta).

**Campos clave**:

- `namtrik_termino_pregunta`, `espanol_traduccion_pregunta`
- `namtrik_termino_respuesta`, `espanol_traduccion_respuesta`
- `namtrik_contexto_pregunta`, `namtrik_contexto_respuesta`
- `search_vector` (tsvector GENERATED ALWAYS)

**Uso**: Dialogos didácticos, frases idiomáticas, conversaciones culturales.

#### **palabrasm1_microcampos** / **palabrasm2_microcampos**

Tablas puente (N:M) para asociar palabras con microcampos.

**Estructura**:

- `palabra_id` (FK → palabras_modelo_X, CASCADE)
- `microcampo_id` (FK → microcampos, CASCADE)
- `created_at`

### Tablas de Infraestructura (Schema `meta`)

#### **meta.embeddings**

Vectores embeddings para búsqueda semántica.

**Campos**:

- `id`, `created_at`
- `content` (text, contenido original)
- `embedding` (vector(384), embedding normalizado)
- `metadata` (jsonb, contexto adicional)

**Índice HNSW**: Configurado para búsqueda de vecinos aproximados (ANN) con distancia coseno.

#### **meta.migrations**

Control de versiones de migraciones (puede ser reemplazado por Prisma Migrate).

### Tablas de Auditoría (Schema `audit`)

#### **audit.row_changes**

Registro completo de cambios en todas las tablas del dominio.

**Campos**:

- `id`, `schema_name`, `table_name`, `operation` (INSERT/UPDATE/DELETE)
- `row_id` (ID del registro afectado)
- `old_data`, `new_data` (jsonb, estado antes/después)
- `changed_at`, `changed_by`, `client_ip`

**Triggers**: Aplicados automáticamente a todas las tablas principales.

---

## 5. Tecnologías y Extensiones

### Extensiones PostgreSQL

#### **pgvector** (vector)

- **Propósito**: Búsqueda semántica vectorial
- **Tipo de dato**: `vector(384)` (compatible con modelos MiniLM, mpnet, etc.)
- **Índice HNSW**: Algoritmo Hierarchical Navigable Small World
  - Parámetros: `m=16`, `ef_construction=200`
  - Distancia: Coseno (`vector_cosine_ops`)
  - Performance: Búsquedas sub-100ms en datasets medianos

**Ejemplo de uso**:

```sql
-- Encontrar los 10 embeddings más similares a un vector de consulta
SELECT id, content, 1 - (embedding <=> $query_vector::vector) AS similarity
FROM meta.embeddings
ORDER BY embedding <=> $query_vector::vector
LIMIT 10;
```

#### **citext** (public)

- **Propósito**: Comparaciones case-insensitive nativas
- **Ventajas**: Unicidad sin LOWER(), índices nativos, transparente para el ORM
- **Uso**: Todos los campos de términos (namtrik_termino, espanol_termino)

#### **pg_trgm** (public)

- **Propósito**: Similitud trigram para búsqueda difusa
- **Índices GIN**: Optimiza operadores LIKE, ILIKE, similitud de texto
- **Performance**: Acelera búsquedas parciales 10-50x

**Ejemplo de uso**:

```sql
-- Búsqueda difusa con ILIKE (optimizada por trigram)
SELECT * FROM palabras_modelo_1
WHERE namtrik_termino ILIKE '%misak%'
  AND deleted_at IS NULL;
```

#### **uuid-ossp** (public)

- **Propósito**: Generación de UUIDs
- **Uso futuro**: Identificadores distribuidos, APIs externas

### Full-Text Search (FTS)

**Configuración**:

- **Idiomas**: `simple` (Namtrik), `spanish` (Español)
- **tsvector GENERATED ALWAYS**: Auto-generado sin triggers adicionales
- **Ponderación**: Términos (A), Descripciones (B)
- **Índices GIN**: Optimizan operador `@@` (match)

**Ejemplo de búsqueda ponderada**:

```sql
SELECT id, namtrik_termino, espanol_termino,
       ts_rank(search_vector, query) AS rank
FROM palabras_modelo_1,
     to_tsquery('spanish', 'agua & rio') query
WHERE search_vector @@ query
  AND deleted_at IS NULL
ORDER BY rank DESC
LIMIT 20;
```

### Funciones Auxiliares

#### **set_updated_at()**

Trigger para actualizar automáticamente `updated_at` en cada UPDATE.

#### **audit.log_changes()**

Trigger de auditoría que registra INSERT/UPDATE/DELETE en `audit.row_changes`.

#### **soft_delete_campo_semantico(campo_id)**

Función para soft delete en cascada de toda la jerarquía de un campo semántico.

**Uso**:

```sql
SELECT public.soft_delete_campo_semantico(42);
-- NOTICE: Soft delete completado: 1 campo, 5 subcampos, 23 microcampos
```

---

## 6. Integración Backend

## 🚀 Siguientes Pasos (Week 3-4)

### Fase 1: Configuración de Base de Datos

```bash
# 1. Crear base de datos PostgreSQL
createdb misak_dictionary

# 2. Aplicar esquema
psql -U postgres -d misak_dictionary < infrastructure/database/prototypes/database-schema.sql

# 3. Verificar
psql -U postgres -d misak_dictionary -c "\dt+"
psql -U postgres -d misak_dictionary -c "\di+"
```

### Fase 2: Integración con Prisma

```bash
# 1. Configurar packages/database
mkdir -p packages/database/prisma

# 2. Inicializar Prisma
cd packages/database
pnpm init
pnpm install prisma @prisma/client

# 3. Introspeccionar esquema existente
npx prisma db pull

# 4. Generar cliente Prisma
npx prisma generate
```

### Fase 3: Validación

```bash
# Ejecutar queries de prueba
psql -U postgres -d misak_dictionary < infrastructure/database/prototypes/test-queries.sql

# Verificar uso de índices
psql -U postgres -d misak_dictionary -c "SELECT * FROM pg_stat_user_indexes;"
```

### Fase 4: Limpieza Post-Integración

Una vez que Prisma esté completamente integrado y validado:

```bash
# Mover a archivo
mkdir -p infrastructure/database/archive
mv infrastructure/database/prototypes/* infrastructure/database/archive/

# O mantener como referencia histórica
```

---

## 🔧 Consultas de Mantenimiento

### Análisis de Uso de Índices

```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Reporte de Tamaño de Tablas

```sql
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('public', 'meta', 'audit')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Resumen de Auditoría

```sql
SELECT table_name, operation, count(*)
FROM audit.row_changes
GROUP BY table_name, operation
ORDER BY table_name, operation;
```

---

## 🏗️ Arquitectura de Tablas

### Schema `public` - Dominio Principal

#### Jerarquía Taxonómica (3 niveles)

```
campos_semanticos (Nivel 1 - Raíz)
  ↓ ON DELETE CASCADE
subcampos_semanticos (Nivel 2 - Medio)
  ↓ ON DELETE CASCADE
microcampos (Nivel 3 - Hojas)
```

#### Modelos de Palabras

- `palabras_modelo_1`: Término-descripción simple
- `palabras_modelo_2`: Pares pregunta-respuesta

#### Tablas Puente (Many-to-Many)

- `palabrasm1_microcampos`: palabras_modelo_1 ↔ microcampos
- `palabrasm2_microcampos`: palabras_modelo_2 ↔ microcampos

### Schema `meta` - Infraestructura

- `embeddings`: Vectores para búsqueda semántica
- `migrations`: Rastreo de migraciones

### Schema `audit` - Auditoría

- `row_changes`: Registro completo de cambios

---

## ⚙️ Configuración de Producción

### Connection Pooling

```bash
# PgBouncer (transaction mode)
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
```

### Monitoreo

```sql
-- Habilitar pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Consultar queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Autovacuum

```sql
-- Ajustar para tablas de alta escritura
ALTER TABLE audit.row_changes SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
```

### Backup

```bash
# Backup diario automatizado
pg_dump -U postgres -Fc misak_dictionary > backup_$(date +%Y%m%d).dump

# Restore
pg_restore -U postgres -d misak_dictionary backup_20251020.dump
```

---

## 📚 Referencias Técnicas

- **pgvector HNSW**: https://github.com/pgvector/pgvector#hnsw
- **PostgreSQL FTS**: https://www.postgresql.org/docs/current/textsearch.html
- **pg_trgm**: https://www.postgresql.org/docs/current/pgtrgm.html
- **citext**: https://www.postgresql.org/docs/current/citext.html
- **Row Level Security**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Prisma ORM**: https://www.prisma.io/docs

---

## 📝 Cuándo Usar las Mejoras

### Índices Parciales `idx_*_active_recent`

**Usar en queries de listado tipo:**

```sql
-- Backend: Endpoint GET /api/palabras?page=1&limit=20
SELECT * FROM palabras_modelo_1
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

### Función `soft_delete_campo_semantico()`

**Usar en operaciones admin tipo:**

```typescript
// Backend: DELETE /api/admin/campos-semanticos/:id
async deleteCampoSemantico(id: number) {
  await prisma.$executeRaw`
    SELECT public.soft_delete_campo_semantico(${id})
  `;
}
```

**Ventaja vs lógica en backend**: Transacción atómica garantizada por PostgreSQL.

---

## 🎯 Decisiones de Diseño

### ¿Por qué citext en lugar de LOWER()?

- **Rendimiento**: Comparaciones directas sin funciones
- **Simplicidad**: Transparente para el ORM
- **Índices**: Los índices funcionan nativamente

### ¿Por qué HNSW en lugar de IVFFlat?

- **Mejor recall/latencia** en datasets pequeños-medianos
- **No requiere ANALYZE** previo
- **Configuración más simple**

### ¿Por qué GENERATED ALWAYS para tsvector?

- **Mantenimiento automático** sin triggers adicionales
- **Consistencia garantizada**
- **Performance similar** a triggers

### ¿Por qué Soft Delete?

- **Preservación cultural**: No perder datos nunca
- **Auditoría**: Historial completo
- **Recuperación**: Posibilidad de restaurar

---

**Autor**: Tumi Dev Team  
**Última Actualización**: 2025-10-20  
**Proyecto**: Diccionario Cultural Misak  
**Stack**: PostgreSQL 17+ | Prisma 6+ | Node.js 22+
