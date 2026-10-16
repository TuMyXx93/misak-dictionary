# ADR-0003: Modelo Léxico «Sentido + Formas» y Ubicación Multinivel en el Árbol Taxonómico

- **Fecha**: 2026-10-16
- **Estado**: Aceptado
- **Relacionado con**: `specs/features/005-sentido-formas-lexico/spec.md`

## Contexto

El esquema inicial del diccionario modelaba las palabras mediante dos tablas planas: `palabras_modelo_1` (par 1:1 `namtrik_termino` `@unique` ↔ `espanol_termino` `@unique`, con `namtrik_descripcion` `NOT NULL`) y `palabras_modelo_2` (pregunta-respuesta para saludos), ambas vinculables exclusivamente a `microcampos` mediante tablas puente N:M.

Al contrastar este diseño con el corpus oficial del equipo lingüístico (`diccionario-campo-namtrik-castellano.xlsm`, 1.369 filas en 5 hojas), emergieron cuatro incompatibilidades estructurales:

1. **Agrupación de $1..N$ formas namtrik por sentido**: un mismo sentido conceptual (p. ej., *Cansado*, *Flatulencia*, *Cantar*) agrupa múltiples formas léxicas en namtrik, cada una con su categoría gramatical, número de variante (`V.1..V.n`), marca de neologismo (`neol.`), rasgos morfosintácticos (`pl.`, `sing.`, `f.`, `m.`, `plac.`, `Zool.`) o número de homónimo (`Sruutra 1`, `Sruutra 2`).
2. **Explicación contextual en namtrik opcional y nombre científico**: secciones enteras como `C1.S1.M19` (*Acciones y estados humanos*) carecen de Columna B (`namtrik_contexto`), por lo que no puede ser `NOT NULL`; a su vez, las secciones de flora y fauna requieren distinguir el `nombre_cientifico` de la glosa en castellano.
3. **Ubicación de términos en cualquier nivel del árbol taxonómico**: existen términos colgados directamente de un **Campo** (`C3 Tra tul`), directamente de un **Subcampo** sin microcampos (`C1.S5`, `C1.S6`, `C2.S1..S4`, `C3.S1`, `C4.S3`, `C4.S4`, `C4.S6`) o en la cabecera de un **Subcampo** antes de sus microcampos (`C2.S5`, `C4.S1`, `C4.S2`, `C4.S5`), además de los **Microcampos** y **Subniveles**.
4. **Identidad por código estable vs. `@unique` plano**: dos sentidos en dominios distintos pueden compartir una misma glosa breve en español o una forma homónima en namtrik sin ser la misma entrada lexicográfica.

## Decisión

1. **Entidad raíz `SentidoLexico` (`sentidos_lexicos`) + entidad hija `FormaNamtrik` (`formas_namtrik`)**:
   - Cada entrada del diccionario se persiste como un `SentidoLexico` identificado por un `codigo` estable (p. ej., `C1.S1.M19.1.E001`, `C3.E001`, `C1.S1.M21.D001`) con índice único parcial activo (`WHERE deleted_at IS NULL`).
   - `SentidoLexico` soporta `tipo IN ('estandar', 'dialogico')`, `espanol_glosa`, `espanol_explicacion` (nullable), `namtrik_contexto` (nullable), `nombre_cientifico` (nullable), campos de réplica dialógica para saludos (`respuesta_*`) y `observacion_editorial` (nullable).
   - `FormaNamtrik` se relaciona `1:N` con `SentidoLexico` (`ON DELETE CASCADE`), almacenando `orden`, `lema` (normalizado con `ɵ`), `acepcion_homonima`, `categoria_gramatical`, `variante`, `es_neologismo`, `rasgos_gramaticales` y `etiqueta_original`.
2. **Tabla de ubicación multinivel `SentidoUbicacion` (`sentidos_ubicaciones`)**:
   - Relaciona `sentido_id` con `campo_semantico_id`, `subcampo_semantico_id` o `microcampo_id` y su `posicion` de aparición.
   - Una restricción `CHECK (num_nonnulls(campo_semantico_id, subcampo_semantico_id, microcampo_id) = 1)` en PostgreSQL garantiza que cada ubicación apunte exactamente a un contenedor taxonómico, sin requerir microcampos ficticios ni distorsionar la jerarquía del PDF oficial.
3. **Coexistencia limpia y transición sin ruptura**:
   - Las tablas legadas `palabras_modelo_1` y `palabras_modelo_2` se conservan en el esquema con sus filas demo marcadas en `deleted_at` para no romper el historial de migraciones previas, mientras que los repositorios, casos de uso públicos y vistas del frontend pasan a operar sobre `sentidos_lexicos`, `formas_namtrik` y `sentidos_ubicaciones`.

## Consecuencias

- **Positivas**:
  - Representación 100 % fiel al trabajo del equipo lingüístico Misak para los campos `C1..C4` actuales y los futuros campos `C5..C7`.
  - Soporte nativo para búsqueda por cualquiera de las formas namtrik (con normalización `ɵ`), por glosa/explicación en español o por nombre científico.
  - Navegación coherente en el frontend tanto en campos con términos directos (`C3`), subcampos con términos directos (`C1.S5..S6`, `C2.S1..S5`, `C3.S1`, `C4.S1..S6`) como en microcampos y subniveles recursivos.
- **Negativas / Trade-offs**:
  - Requiere un join adicional (`sentidos_lexicos` → `formas_namtrik` + `sentidos_ubicaciones`) al hidratar la jerarquía de un campo semántico, mitigado mediante consultas por lote (`WHERE ... IN (...)`) e índices compuestos sobre las claves foráneas.
