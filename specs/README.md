# Specs — Especificaciones del Proyecto

Fuente de verdad de requisitos, diseño y tareas. Versionada con el código.
Leer primero [`constitution.md`](./constitution.md).

## Estructura

```
specs/
├── constitution.md      # L0 — Invariantes no negociables
├── steering/            # L0 — Contexto técnico estable
│   ├── tech-stack.md    #     Stack, versiones, límites por app
│   ├── conventions.md   #     Convenciones de código y proceso
│   └── glossary.md      #     Vocabulario de dominio (Misak ↔ español)
├── adr/                 # L1 — Decisiones arquitectónicas (Nygard)
├── features/            # L2 — Especificaciones activas (una carpeta por feature)
│   └── NNN-slug/
│       ├── spec.md      #     Requisitos EARS + aceptación Gherkin
│       ├── plan.md      #     Diseño técnico y contratos
│       └── tasks.md     #     Tareas atómicas trazables
└── archive/             # Specs completadas (histórico auditable)
```

## Ciclo de vida

```
/specify → spec.md (EARS + Gherkin)
    ↓ revisión humana (+ gate cultural si hay nombres Misak)
/plan   → plan.md + ADRs
    ↓ revisión reviewer (read-only)
/tasks  → tasks.md atómicas (T-001…)
    ↓ /implement por tarea con contexto mínimo
gates:  version-gate → docs-gate → lint-staged → tests → merge-gate → PR a dev
    ↓
cierre: spec → archive/ + resumen Engram
```

## Estados de una feature

`draft` → `review` → `approved` → `in-progress` → `done` → `archived`

## Reglas

1. Nunca editar specs en `archive/` salvo para correcciones editoriales (nunca de requisitos).
2. Toda spec lleva front-matter: `id`, `version`, `status`.
3. Los requisitos se numeran (`R-001`) y los criterios de aceptación por escenario;
   el commit de cierre de una spec referencia los IDs implementados.
