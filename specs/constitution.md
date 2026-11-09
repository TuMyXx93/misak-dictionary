---
id: constitution
version: 1.0.0
status: active
authority: supreme
description: >
  Invariantes no negociables del proyecto. Si el codigo contradice este documento,
  el codigo esta mal. Cambios requieren PR dedicado con revision humana.
---

# Constitución del Proyecto — Misak Dictionary

> **Autoridad:** este documento está por encima de steering, specs, código y prompts.
> Cualquier artefacto que lo contradiga es inválido por definición.

## 1. Invariantes de Dominio Cultural

1. **C1.1 — Ratificación cultural obligatoria.** Los nombres Misak (`name`) y sus
   equivalentes en español (`nameSpanish`) solo pueden modificarse con evidencia de
   aprobación comunitaria documentada en la spec correspondiente. Ninguna sesión LLM
   puede alterarlos por decisión propia.
2. **C1.2 — Glosario como contrato.** Los términos del glosario (`specs/steering/glossary.md`)
   son la fuente de verdad de vocabulario de dominio. El código los usa; no los redefine.
3. **C1.3 — Sin degradación del idioma.** Las interfaces muestran siempre el par
   Misak → español. Nunca se sustituye el término Misak por el español en posición primaria.

## 2. Invariantes de Calidad Técnica

4. **C2.1 — Convenciones por tooling.** Formato y lint se gobiernan exclusivamente por
   `biome.json`. No se discuten en review lo que Biome puede decidir.
5. **C2.2 — Named exports.** Exportaciones nombradas por defecto en componentes y módulos
   (salvo ficheros de config, permitidos por override de Biome).
6. **C2.3 — TDD desde criterios de aceptación.** Todo requisito nuevo en formato Gherkin
   debe tener al menos un test vinculado antes de considerarse implementado.
7. **C2.4 — Gates obligatorios.** `version-gate` antes de modificar código;
   `docs-gate` y `merge-gate` antes de integrar a `dev`. Ningún push directo a `main`.

## 3. Invariantes de Accesibilidad y UX

8. **C3.1 — Movimiento respetuoso.** Toda animación nueva respeta
   `prefers-reduced-motion`; sin excepciones.
9. **C3.2 — Tap targets ≥ 48px.** Ningún control interactivo visible baja de 48×48px
   en el breakpoint más pequeño (WCAG 2.2 AAA + Material 48dp + iOS HIG 44pt).
10. **C3.3 — Imágenes vía `LazyImage`.** Ninguna etiqueta `<img>` fuera del componente
    `LazyImage`, que garantiza lazy loading; imágenes remotas reciben `srcSet` responsivo.
11. **C3.4 — Teclado primero.** Todo control interactivo es operable por teclado con
    foco visible y `aria-label` descriptivo cuando el texto visible es icónico.

## 4. Invariantes de Proceso

12. **C4.1 — Spec antes que código.** Features nuevas requieren spec activa en
    `specs/features/` antes de la primera línea de código de implementación.
13. **C4.2 — Trazabilidad.** Los commits `feat`/`fix` referencian la spec:
    `Refs: specs/features/NNN-slug`.
14. **C4.3 — Specs vivas.** Si el código cambia un requisito, la spec cambia en el
    mismo commit. Una spec desactualizada es un bug de documentación.
15. **C4.4 — Cierre auditable.** Toda spec implementada se archiva en `specs/archive/`
    con sus criterios Gherkin como suite de regresión perpetua.

---

_Cambios a esta constitución: PR dedicado, revisión humana explícita, bump de `version`
según SemVer, y nota en CHANGELOG._
