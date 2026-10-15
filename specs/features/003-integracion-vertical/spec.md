---
id: 003-integracion-vertical
version: 1.0.0
status: approved
cultural-gate: true
created: 2026-10-15
approved: 2026-10-15
---

# 003 — Integración vertical frontend ↔ API con datos reales (slice de validación)

## Contexto

El frontend consume datos estáticos (`src/data/semanticFields`) en el 100% de sus páginas
y el backend expone endpoints de diccionario que nadie consume: la integración nunca ha
ocurrido. Esta feature es un **slice vertical de validación**: cargar datos reales mínimos
en el esquema actual y hacer que la navegación completa (índice → campo → subcampo →
microcampo → término) y la búsqueda operen contra la API, para observar UI/UX,
responsividad y contratos con datos reales antes de invertir en el rediseño del esquema
(especificado aparte en spec 004).

**Política de datos desechables**: el contenido cargado por esta feature es material de
observación, no la base productiva. La ingesta productiva será el pipeline governado de
una spec posterior (staging → validación → revisión humana). Los datos del slice se
cargan por script idempotente versionado.

## Requisitos (EARS)

- **R-001** — CUANDO el usuario visite `/campos`, EL SISTEMA DEBERÁ mostrar los campos
  semánticos obtenidos de `GET /api/dictionary/semantic-fields` (no de datos estáticos).
- **R-002** — CUANDO el usuario visite `/campos/:slug`, EL SISTEMA DEBERÁ resolver el
  campo por su slug (derivado del término Namtrik) contra la API y mostrar su jerarquía
  (subcampos → microcampos → términos).
- **R-003** — CUANDO un slug no exista en la API, EL SISTEMA DEBERÁ mostrar el estado
  de "no encontrado" existente (no crashear ni mostrar datos stale).
- **R-004** — MIENTRAS una petición de datos esté en curso, EL SISTEMA DEBERÁ mostrar un
  estado de carga visible; si la pética falla, DEBERÁ mostrar un estado de error con
  opción de reintento.
- **R-005** — CUANDO un microcampo no tenga términos, EL SISTEMA DEBERÁ mostrar un
  estado vacío explícito (no una lista vacía silenciosa).
- **R-006** — CUANDO el usuario escriba en el buscador del índice, EL SISTEMA DEBERÁ
  consultar `GET /api/dictionary/words/search?q=` y mostrar resultados con navegación
  al término.
- **R-007** — LA API DEBERÁ devolver un campo `slug` en cada campo semántico para que
  el frontend pueda construir rutas estables sin depender de IDs numéricos.
- **R-008** — EL SCRIPT DE SEED DEBERÁ cargar los 7 campos semánticos (2 con jerarquía
  completa) de forma idempotente (upsert por término, sin duplicar en re-ejecución) y
  aceptar un factor de escala por variable de entorno para la escalera de observación
  (×1 ≈ 24 términos; ×10 ≈ 240; ×100 ≈ 2.400).
- **R-009** — LOS DATOS de posiciones, drift e iconos de la interfaz DEBERÁN permanecer
  como configuración de frontend (no son contenido de dominio), unidos al contenido por slug.
- **R-010** — LA INTEGRACIÓN DEBERÁ mantener la suite de tests existente en verde,
  mockeando en la frontera del cliente de API.

## Criterios de aceptación (Gherkin)

### R-002

```gherkin
Escenario: Navegación a campo real desde la API
  Dado el seed ejecutado con el campo "Ya" y su jerarquía
  Cuando el usuario visita /campos/ya
  Entonces ve el nombre "Ya" y "La Casa" desde la API
  Y ve los subcampos "Fogon" y "Espacios de la casa"
```

### R-004

```gherkin
Escenario: Estado de error con reintento
  Dado que la API no responde
  Cuando el usuario visita /campos
  Entonces ve un mensaje de error
  Y un botón de reintento que reintenta la petición
```

### R-006

```gherkin
Escenario: Búsqueda con datos reales
  Dado 24 términos cargados vía seed
  Cuando el usuario busca "olla" en el buscador
  Entonces ve resultados que incluyen "Sruik — Olla de barro"
```

### R-008

```gherkin
Escenario: Seed idempotente
  Dado el seed ejecutado una vez
  Cuando se ejecuta una segunda vez
  Entonces el número de campos, subcampos, microcampos y términos no cambia
```

## Fuera de alcance

- Rediseño del esquema de contenido (spec 004): i18n por traducciones, procedencia
  cultural, audio, staging.
- Pipeline de importa governado con revisión humana (spec posterior).
- Migración del contenido histórico de la base anterior.
- Búsqueda semántica (embeddings), SSR/SEO, paginación avanzada (observar primero).

## Trazabilidad

| Requisito    | Archivos                       | Tests |
| ------------ | ------------------------------ | ----- |
| R-001..R-010 | _(se completa al implementar)_ |       |
