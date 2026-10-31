---
id: glossary
version: 1.0.0
status: active
cultural-gate: true
description: >
  Vocabulario de dominio verificado contra src/constants/semanticFields.ts.
  Los nombres Misak son contrato cultural: cambiarlos requiere gate de
  ratificación comunitaria (Constitución C1.1).
---

# Steering — Glosario de Dominio

## Jerarquía de contenidos

| Término (código)                   | Definición                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `semantic field` / campo semántico | Unidad temática de primer nivel del diccionario (7 en total). Es la navegación primaria del sitio junto a la búsqueda. |
| `subfield` / subcampo              | Subdivisión de un campo semántico.                                                                                     |
| `microfield` / microcampo          | Subdivisión de un subcampo; contiene los términos.                                                                     |
| `term` / término                   | Unidad léxica con par Misak → español, ejemplo de uso y parte del discurso.                                            |

## Los 7 campos semánticos (fuente: `src/constants/semanticFields.ts`)

| `id`              | Nombre Misak    | Español              |
| ----------------- | --------------- | -------------------- |
| `ya`              | Ya              | La Casa              |
| `ya-tul`          | Ya Tul          | La Huerta            |
| `tra-tul`         | Tra Tul         | La Huerta Lejana     |
| `kau-ushamera`    | Kau Ushamera    | Animales Originarios |
| `namui-nu-piro`   | Namui Nu Pirɵ   | Nuestro Territorio   |
| `namui-nu-isuik`  | Namui Nu Isuik  | Cosmovisión          |
| `sro-wammera`     | Srɵ Wammera     | Neologismos          |

> Cualquier cambio a esta tabla requiere evidencia de ratificación comunitaria
> registrada en la spec y un `/gate-cultural` pasado.

## Términos técnicos del proyecto

| Término                | Definición                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| SDD                    | Spec-Driven Development: las specs versionadas son la fuente de verdad; el código las implementa. |
| EARS                   | Easy Approach to Requirements Syntax — notación de requisitos usada en `spec.md`.                 |
| Criterio de aceptación | Escenario Gherkin verifica un requisito; debe tener test vinculado.                               |
| Gate                   | Puerta de validación obligatoria (`version-gate`, `docs-gate`, `merge-gate`, `gate-cultural`).    |
| WIP                    | Trabajo en el working tree aún no commiteado; se reporta en gates pero no bloquea docs nuevas.    |
| Steering               | Contexto técnico estable (stack, convenciones, glosario) aplicable a toda spec.                   |
| `LazyImage`            | Componente único obligatorio para imágenes (Constitución C3.3).                                   |

## Convenciones de escritura

- En UI, el nombre Misak aparece en posición primaria; el español como apoyo.
- Los textos usan español neutro; los nombres propios Misak conservan su forma
  ratificada (p. ej. «Srɵ Wammera», con ɵ).
