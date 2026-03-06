---
description: Migra el monorepo de ESLint 9 + Prettier 3 a Biome v2, paso a paso
---

Ejecuta la migracion completa del monorepo Misak Dictionary de ESLint 9 + Prettier 3 a Biome v2.

Antes de comenzar, carga el skill `biome-migration` para tener el patron completo de referencia.

## Flujo de Migracion (ejecutar en orden)

### Fase 1: Preparacion

1. Crear una rama nueva para la migracion:
   ```
   git checkout -b chore/migrate-to-biome
   ```
2. Instalar Biome como devDependency en la raiz:
   ```
   pnpm add -Dw @biomejs/biome
   ```

### Fase 2: Configuracion de Biome

3. Ejecutar migracion automatica como punto de partida (opcional):
   ```
   pnpm exec biome migrate eslint --write --include-inspired
   pnpm exec biome migrate prettier --write
   ```
4. Crear/ajustar `biome.json` en la raiz siguiendo el template del skill `biome-migration` (Seccion 1).
   IMPORTANTE: Usar el template del skill como fuente de verdad, no el resultado automatico.

### Fase 3: Scripts y package.json

5. Actualizar scripts en root `package.json` segun Seccion 3 del skill.
6. Actualizar scripts en `apps/web-client/package.json` segun Seccion 3 del skill.
7. Actualizar scripts en `apps/backend-service/package.json` segun Seccion 3 del skill.
8. Actualizar bloque `lint-staged` en root `package.json` segun Seccion 4 del skill.

### Fase 4: Git Hooks (delegar a @devops)

9. Delegar a `@devops` la actualizacion de:
   - `.husky/pre-commit` — usar template de Seccion 4 del skill
   - `.husky/pre-push` — usar template de Seccion 4 del skill

   > **IMPORTANTE:** En los hooks, usar `pnpm run ci` (ejecuta el script `ci` del package.json), NO `pnpm ci` (que es un alias built-in de pnpm para `pnpm install --frozen-lockfile`).

### Fase 5: CI Workflows (delegar a @devops)

10. Delegar a `@devops` la actualizacion de los 3 workflows:
    - `.github/workflows/lint.yml` — reemplazar ESLint+Prettier por `biomejs/setup-biome@v2` + `biome ci`
    - `.github/workflows/test.yml` — actualizar action versions (codecov@v4)
    - `.github/workflows/build.yml` — actualizar action versions (upload-artifact@v4)
      Usar los templates de la Seccion 5 del skill como referencia.

### Fase 6: Limpieza

11. Eliminar archivos de configuracion obsoletos:
    ```
    rm eslint.config.js
    rm apps/web-client/eslint.config.js
    rm apps/backend-service/.eslintrc.json
    rm .prettierrc.json
    rm .prettierignore
    ```
12. Desinstalar dependencias de ESLint y Prettier:
    ```
    pnpm remove -w eslint @eslint/js typescript-eslint prettier
    pnpm --filter web-client remove eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint
    ```
13. Actualizar `.npmrc` — eliminar lineas de hoisting de eslint/prettier:
    ```
    public-hoist-pattern[]=*eslint*
    public-hoist-pattern[]=*prettier*
    ```

### Fase 7: Formateo inicial

14. Ejecutar Biome en todo el codebase para aplicar el formato nuevo:
    ```
    pnpm exec biome check --write .
    ```
15. Crear un commit dedicado al reformateo masivo:
    ```
    git add -A && git commit -m "style: reformat codebase with Biome v2"
    ```

### Fase 8: Verificacion (delegar a @reviewer)

16. Delegar a `@reviewer` la validacion final:
    - Ejecutar `pnpm run ci` y verificar que pasa limpio
    - Ejecutar `pnpm build:web` y `pnpm build:backend`
    - Ejecutar `pnpm test`
    - Verificar que los git hooks funcionan (pre-commit y pre-push)
    - Recorrer la checklist completa de la Seccion 8 del skill

### Fase 9: Documentacion

17. Actualizar `AGENTS.md`:
    - Seccion "Formatting (Prettier)" -> "Formatting (Biome)"
    - Seccion "Build / Lint / Test Commands" -> actualizar tabla de scripts
    - Seccion "Git Hooks" -> referenciar Biome en vez de ESLint + Prettier
    - Seccion "CI Pipelines" -> referenciar Biome
    - Actualizar referencia a `eslint-disable` por `biome-ignore` en Seccion TypeScript

Contexto adicional del usuario: $ARGUMENTS
