# 🚀 PostgreSQL 18 - Guía Rápida de Implementación

## Diccionario Cultural Misak

Esta guía te ayudará a implementar todas las features de PostgreSQL 18 en tu proyecto en menos de 10 minutos.

---

## 📦 Paso 1: Actualizar Schema de Prisma

El archivo `schema.prisma` ya ha sido actualizado con:

- ✅ Extensiones de PostgreSQL 18
- ✅ Índices GIN optimizados
- ✅ Preview features habilitadas

No necesitas hacer nada aquí, solo verifica que el archivo esté actualizado.

---

## 🗄️ Paso 2: Aplicar Migraciones

### Opción A: Usando Prisma (Recomendado)

```bash
cd apps/backend-service

# Generar cliente de Prisma con nuevas features
pnpm prisma generate

# Sincronizar schema con la base de datos
pnpm prisma db push
```

### Opción B: Aplicar SQL Directamente

```bash
# Ejecutar migraciones avanzadas
psql -h localhost -U postgres -d misak_dictionary -f prisma/migrations/postgresql18-advanced-features.sql
```

**Nota:** Asegúrate de que PostgreSQL 18 esté instalado y corriendo.

---

## 🔌 Paso 3: Verificar Extensiones

Conecta a tu base de datos y verifica las extensiones:

```bash
psql -h localhost -U postgres -d misak_dictionary
```

```sql
-- Listar extensiones instaladas
\dx

-- Deberías ver:
-- citext, pgvector, pg_trgm, uuid-ossp, btree_gin, btree_gist, pg_stat_statements, unaccent
```

Si alguna extensión falta, instálala manualmente:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Función Wrapper Importante

Para poder usar `unaccent` en índices GIN, se requiere una función wrapper IMMUTABLE:

```sql
-- Esta función ya está incluida en postgresql18-advanced-features.sql
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;
```

> **Nota:** La función `unaccent` nativa no es IMMUTABLE, lo que impide usarla directamente en índices. El wrapper `immutable_unaccent` resuelve este problema.

---

## 💻 Paso 4: Usar las Utilidades en tu Código

### Importar el Helper

```typescript
// En cualquier servicio o controlador
// Prisma 7: Usar el singleton configurado con adapter-pg
import { prisma } from '@/shared/config/prisma.js';
import { createPG18Helper } from '@/utils/postgres18-helpers';

const pg18 = createPG18Helper(prisma);
```

> **Nota Prisma 7:** El cliente se importa desde `./generated/prisma/client.js` y usa `@prisma/adapter-pg` para conexión nativa.

### Ejemplo 1: Búsqueda Full-Text

```typescript
// src/routes/search.route.ts
import { FastifyInstance } from 'fastify';

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.get('/search', async (request, reply) => {
    const { q } = request.query as { q: string };

    // Búsqueda full-text
    const results = await pg18.fullTextSearch(q, {
      idioma: 'spanish',
      limit: 50,
    });

    return { results };
  });
}
```

### Ejemplo 2: Autocompletado con Fuzzy Search

```typescript
fastify.get('/autocomplete', async (request, reply) => {
  const { q } = request.query as { q: string };

  const suggestions = await pg18.fuzzySearch(q, {
    similarityThreshold: 0.3,
    limit: 10,
  });

  return { suggestions };
});
```

### Ejemplo 3: Dashboard con Estadísticas

```typescript
fastify.get('/dashboard/stats', async (request, reply) => {
  const stats = await pg18.getCamposSemanticosStats();

  return {
    camposSemanticos: stats,
    totalCampos: stats.length,
  };
});
```

---

## 🧹 Paso 5: Configurar Tareas de Mantenimiento

### Crear un cron job para limpieza automática

```typescript
// src/jobs/maintenance.job.ts
import { PrismaClient } from '@prisma/client';
import { createPG18Helper } from '@/utils/postgres18-helpers';

const prisma = new PrismaClient();
const pg18 = createPG18Helper(prisma);

export async function runDailyMaintenance() {
  console.log('🔧 Ejecutando mantenimiento diario...');

  // Limpiar sesiones expiradas
  const deletedSessions = await pg18.cleanupExpiredSessions();
  console.log(`✅ ${deletedSessions} sesiones eliminadas`);

  // Limpiar password resets
  const deletedResets = await pg18.cleanupOldPasswordResets();
  console.log(`✅ ${deletedResets} password resets eliminados`);

  // Refrescar vista materializada
  await pg18.refreshMaterializedView(true);
  console.log('✅ Vista materializada actualizada');

  console.log('✨ Mantenimiento completado');
}

// Ejecutar cada 24 horas
setInterval(runDailyMaintenance, 24 * 60 * 60 * 1000);
```

---

## 📊 Paso 6: Monitorear Performance

### Endpoint para ver queries lentas

```typescript
fastify.get('/admin/slow-queries', async (request, reply) => {
  const slowQueries = await pg18.getQueryPerformanceStats(20);

  return {
    queries: slowQueries.map((q) => ({
      query: q.query.substring(0, 100), // Primeros 100 chars
      calls: q.calls,
      avgTime: `${q.meanExecTime.toFixed(2)}ms`,
      maxTime: `${q.maxExecTime.toFixed(2)}ms`,
    })),
  };
});
```

### Endpoint para ver tamaño de tablas

```typescript
fastify.get('/admin/database-size', async (request, reply) => {
  const sizes = await pg18.getTableSizes();

  return { tables: sizes };
});
```

---

## 🧪 Paso 7: Probar las Features

### Test de Full-Text Search

```bash
curl "http://localhost:3000/search?q=naturaleza"
```

### Test de Fuzzy Search

```bash
curl "http://localhost:3000/autocomplete?q=nauraleza"
# Debería encontrar "naturaleza" aunque esté mal escrito
```

### Test de Estadísticas

```bash
curl "http://localhost:3000/dashboard/stats"
```

---

## ⚙️ Configuración Opcional

### Ajustar variables de entorno

Agrega a tu `.env`:

```bash
# PostgreSQL 18 Performance Tuning
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=30000
PG_STATEMENT_TIMEOUT=30000
```

### Configurar logging de queries lentas

En `postgresql.conf`:

```conf
# Log queries más lentas de 100ms
log_min_duration_statement = 100

# Habilitar pg_stat_statements
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

---

## 🎯 Siguientes Pasos

### 1. Implementar en producción

```bash
# Build
pnpm build:backend

# Ejecutar migraciones en producción
DATABASE_URL="tu_url_de_produccion" pnpm prisma db push

# Aplicar SQL avanzado
psql $DATABASE_URL -f prisma/migrations/postgresql18-advanced-features.sql
```

### 2. Monitorear en producción

- Revisa queries lentas semanalmente
- Ejecuta VACUUM ANALYZE mensualmente
- Refrescar vistas materializadas según necesidad

### 3. Optimizar según uso

- Ajustar `similarity_threshold` según feedback de usuarios
- Configurar pesos de ranking según relevancia
- Agregar más índices si detectas queries lentas

---

## 📋 Checklist de Implementación

- [ ] Schema de Prisma actualizado
- [ ] Migraciones aplicadas
- [ ] Extensiones verificadas
- [ ] Helper importado en código
- [ ] Rutas de búsqueda creadas
- [ ] Tareas de mantenimiento configuradas
- [ ] Endpoints de monitoreo creados
- [ ] Tests ejecutados exitosamente
- [ ] Variables de entorno configuradas
- [ ] Documentación leída

---

## 🐛 Problemas Comunes

### Error: "extension does not exist"

```bash
# Instalar extensión manualmente
sudo apt-get install postgresql-18-pgvector
psql -U postgres -d misak_dictionary -c "CREATE EXTENSION pgvector;"
```

### Error: "function search_palabras_fulltext does not exist"

```bash
# Ejecutar archivo SQL
psql -U postgres -d misak_dictionary -f prisma/migrations/postgresql18-advanced-features.sql
```

### Error: "functions in index expression must be marked IMMUTABLE"

Este error ocurre al intentar crear índices GIN con `unaccent()` directamente:

```bash
# Solución: Crear la función wrapper immutable_unaccent primero
psql -U postgres -d misak_dictionary -c "
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS \$\$
SELECT public.unaccent('public.unaccent', \$1)
\$\$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;
"

# Luego crear los índices usando immutable_unaccent en lugar de unaccent
```

### Error: "Returned type citext does not match expected type text"

Las funciones de búsqueda deben usar cast `::TEXT` para campos `citext`:

```sql
-- Incorrecto
SELECT pm1.espanol_termino FROM palabras_modelo_1 pm1;

-- Correcto
SELECT pm1.espanol_termino::TEXT FROM palabras_modelo_1 pm1;
```

### Performance lenta

```typescript
// Ejecutar ANALYZE
await pg18.vacuumAnalyze();

// Verificar índices
const indexStats = await pg18.getIndexUsageStats();
console.log(indexStats);
```

---

## ✔️ Validación Oficial

Esta implementación ha sido validada contra la [documentación oficial de PostgreSQL 18.1](https://www.postgresql.org/docs/18/index.html):

- ✅ `unaccent` requiere wrapper IMMUTABLE para índices ([doc](https://www.postgresql.org/docs/18/unaccent.html))
- ✅ `pg_trgm` con threshold 0.3 por defecto ([doc](https://www.postgresql.org/docs/18/pgtrgm.html))
- ✅ Índices GIN recomendados para FTS ([doc](https://www.postgresql.org/docs/18/textsearch-indexes.html))
- ✅ Creación paralela de índices GIN disponible ([release notes](https://www.postgresql.org/docs/18/release-18.html))

---

## 📚 Recursos

- [Documentación Completa](./POSTGRESQL18-FEATURES.md)
- [PostgreSQL 18 Docs](https://www.postgresql.org/docs/18/)
- [pg_trgm Documentation](https://www.postgresql.org/docs/18/pgtrgm.html)
- [Full-Text Search Guide](https://www.postgresql.org/docs/18/textsearch.html)
- [Prisma Full-Text Search](https://www.prisma.io/docs/concepts/components/prisma-client/full-text-search)

---

**¿Preguntas?** Revisa la documentación completa en `POSTGRESQL18-FEATURES.md`

**Versión:** PostgreSQL 18.1 + Prisma 7.0.1  
**Última actualización:** 2025-11-30
