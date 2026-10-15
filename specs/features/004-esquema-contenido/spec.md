---
id: 004-esquema-contenido
version: 0.1.0
status: draft
created: 2026-10-15
---

# 004 — Esquema de contenido para carga masiva governada (diseño en paralelo)

> **Track B (solo diseño).** Esta spec se redacta en paralelo a la implementación de la
> spec 003 (integración vertical) y **no se implementa** hasta que 003 aterrice y sus
> hallazgos observados con datos reales se incorpornen como criterios de aceptación.

## Contexto

La spec 003 validará la navegación y búsqueda contra el esquema actual
(`namtrik_*`/`espanol_*` como columnas, IDs numéricos, sin procedencia ni audio). El
esquema actual tiene limitaciones conocidas para el objetivo de "carga de datos
eficiente, segura y correcta" del diccionario:

1. **Sin i18n estructural**: agregar un tercer idioma exige migración de columnas.
2. **Sin procedencia cultural**: no hay campo para fuente, ratificador ni fecha de
   aprobación comunitaria (requerido por la Constitución C1.1).
3. **Sin soporte de audio**: columnas `*_audio` existen pero no hay modelo de almacenamiento.
4. **Sin trazabilidad de cambios**: `updated_at` no registra quién ni qué cambió.
5. **Sin slug**: las rutas dependen de IDs numéricos.

## Requisitos (EARS) — borrador para refinar con hallazgos de 003

- **R-001** — CUANDO se registre o modifique un término, EL SISTEMA DEBERÁ almacenar la
  traducción en tablas normalizadas (`term_translations`) que permitan N idiomas sin
  cambio de esquema.
- **R-002** — CUANDO un contenido entre al sistema, EL SISTEMA DEBERÁ registrar su
  procedencia (fuente, ratificador comunitario, fecha de ratificación) como dato de
  primera clase.
- **R-003** — CUANDO un rol autorizado modifique contenido, EL SISTEMA DEBERÁ dejar
  rastro en `audit_log` (ya existe de spec 002) con old/new data.
- **R-004** — EL SISTEMA DEBERÁ exponer `slug` estable por término para rutas públicas.
- **R-005** — CUANDO se cargue audio de pronunciación, EL SISTEMA DEBERÁ referenciarlo
  vía almacenamiento S3-compatible (MinIO) con metadatos (duración, hablante, licencia).
- **R-006** — CUANDO se importe un lote, EL SISTEMA DEBERÁ pasarlo por un área de
  staging con validación Zod, dedup por similitud (citext/trigram) y cola de revisión
  humana antes de aplicar (transacción por lote).
- **R-007** — MIENTRAS el contenido no esté ratificado, EL SISTEMA NO DEBERÁ exponerlo
  en la API pública.

## Criterios de aceptación (Gherkin) — bosquejo

```gherkin
Escenario: Término con procedencia
  Dado un término "Sruik" cargado por el equipo lingüístico
  Cuando se consulta su ficha
  Entonces muestra fuente, ratificador y fecha de ratificación

Escenario: Lote en staging
  Dado un CSV con 100 filas, 3 inválidas
  Cuando se importa
  Entonces 97 filas pasan a revisión humana y 3 quedan en error con motivo
```

## Fuera de alcance

- Implementación antes del merge de spec 003.
- Búsqueda semántica con embeddings (spec posterior).
- Migración del contenido histórico.

## Trazabilidad

| Requisito                     | Hallazgos de 003 que lo informan |
| ----------------------------- | -------------------------------- |
| _(completar al archivar 003)_ |                                  |
