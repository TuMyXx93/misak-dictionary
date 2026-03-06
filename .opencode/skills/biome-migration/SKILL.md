---
name: biome-migration
description: >
  Patron completo para migrar el monorepo pnpm de ESLint 9 + Prettier 3 a Biome v2.
  Incluye biome.json con overrides, mapeo de reglas, scripts, Husky/lint-staged,
  CI workflows y checklist de verificacion. Usar cuando se necesite ejecutar la migracion.
---

# Skill: Biome Migration (ESLint 9 + Prettier 3 -> Biome v2)

Patron de migracion completa para el monorepo Misak Dictionary.
Reemplaza ESLint 9, Prettier 3 y todos sus plugins por Biome v2 como unica herramienta
de linting y formateo.

## 1. Template del biome.json Final

Crear en la raiz del monorepo (`/biome.json`):

```jsonc
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",

  // ========== VCS INTEGRATION ==========
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main",
  },

  // ========== FILES ==========
  "files": {
    "includes": [
      "**",
      "!**/dist/**",
      "!**/build/**",
      "!**/coverage/**",
      "!**/.vite/**",
      "!**/.cache/**",
      "!**/src/generated/**",
    ],
    "ignoreUnknown": true,
    "maxSize": 1048576,
  },

  // ========== FORMATTER (equivalente Prettier) ==========
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf",
    "bracketSpacing": true,
  },

  // ========== JAVASCRIPT / TYPESCRIPT ==========
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSameLine": false,
      "bracketSpacing": true,
    },
    "parser": {
      "jsxEverywhere": false,
    },
  },

  // ========== JSON ==========
  "json": {
    "formatter": {
      "indentWidth": 2,
      "lineWidth": 100,
    },
  },

  // ========== CSS ==========
  "css": {
    "formatter": {
      "indentWidth": 2,
      "lineWidth": 100,
      "quoteStyle": "single",
    },
    "parser": {
      "cssModules": true,
      "tailwindDirectives": true,
    },
  },

  // ========== LINTER ==========
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,

      // --- correctness ---
      "correctness": {
        "noUnusedVariables": "warn",
        "noUnusedImports": "warn",
        "useExhaustiveDependencies": "warn",
        "useHookAtTopLevel": "error",
      },

      // --- suspicious ---
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsole": "off",
      },

      // --- style ---
      "style": {
        "useConst": "error",
        "useImportType": "error",
        "noNonNullAssertion": "warn",
      },

      // --- complexity ---
      "complexity": {
        "noForEach": "off",
      },

      // --- a11y ---
      "a11y": {
        "recommended": true,
      },
    },
  },

  // ========== ASSIST (organize imports) ==========
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on",
      },
    },
  },

  // ========== OVERRIDES POR APP ==========
  "overrides": [
    // --- web-client: habilitar JSX, React hooks, a11y ---
    {
      "includes": ["apps/web-client/**/*.{ts,tsx,js,jsx}"],
      "javascript": {
        "parser": {
          "jsxEverywhere": true,
        },
      },
      "linter": {
        "rules": {
          "correctness": {
            "useExhaustiveDependencies": "warn",
            "useHookAtTopLevel": "error",
          },
          "style": {
            "useComponentExportOnlyModules": {
              "level": "warn",
              "options": {
                "allowConstantExport": true,
              },
            },
          },
          "a11y": {
            "recommended": true,
          },
        },
      },
    },
    // --- backend-service: reglas mas estrictas, sin JSX ---
    {
      "includes": ["apps/backend-service/src/**/*.ts"],
      "javascript": {
        "parser": {
          "jsxEverywhere": false,
        },
      },
      "linter": {
        "rules": {
          "suspicious": {
            "noConsole": "off",
            "noExplicitAny": "warn",
          },
          "correctness": {
            "noUnusedVariables": "warn",
          },
        },
      },
    },
    // --- Prisma y archivos generados: solo formato ---
    {
      "includes": ["apps/backend-service/prisma/**", "**/src/generated/**"],
      "linter": {
        "enabled": false,
      },
    },
    // --- Archivos de configuracion: permitir default exports ---
    {
      "includes": [
        "**/*.config.{js,ts,mjs,cjs}",
        "**/vite.config.*",
        "**/vitest.config.*",
        "**/eslint.config.*",
      ],
      "linter": {
        "rules": {
          "style": {
            "noDefaultExport": "off",
          },
        },
      },
    },
  ],
}
```

> NOTA: No se necesitan archivos `biome.json` dentro de `apps/web-client/` ni `apps/backend-service/`.
> La configuracion raiz aplica a todo el monorepo mediante los `overrides` con globs por app.
> Si en el futuro se necesitara un `biome.json` anidado dentro de una app (ej. para reglas
> exclusivas de ese workspace), ese archivo debe declarar `"root": false` y puede usar
> `"extends": "//"` para heredar la configuracion del root.

## 2. Mapeo de Reglas ESLint a Biome

### Reglas activas en el proyecto actual -> equivalentes Biome

| ESLint Rule                                   | Biome Rule                                        | Severidad |
| --------------------------------------------- | ------------------------------------------------- | --------- |
| `@typescript-eslint/no-unused-vars`           | `correctness/noUnusedVariables`                   | warn      |
| `@typescript-eslint/no-explicit-any`          | `suspicious/noExplicitAny`                        | warn      |
| `eslint:recommended` (many rules)             | `linter.rules.recommended: true`                  | -         |
| `@typescript-eslint/recommended` (many rules) | `linter.rules.recommended: true`                  | -         |
| `react-hooks/rules-of-hooks`                  | `correctness/useHookAtTopLevel`                   | error     |
| `react-hooks/exhaustive-deps`                 | `correctness/useExhaustiveDependencies`           | warn      |
| `react-refresh/only-export-components`        | `style/useComponentExportOnlyModules`             | warn      |
| `no-console`                                  | `suspicious/noConsole`                            | off       |
| `eqeqeq`                                      | `suspicious/noDoubleEquals`                       | error     |
| Prettier formatting rules                     | `formatter.*` + `javascript.formatter.*`          | -         |
| Prettier `printWidth: 100`                    | `formatter.lineWidth: 100`                        | -         |
| Prettier `singleQuote: true`                  | `javascript.formatter.quoteStyle: "single"`       | -         |
| Prettier `trailingComma: "all"`               | `javascript.formatter.trailingCommas: "all"`      | -         |
| Prettier `semi: true`                         | `javascript.formatter.semicolons: "always"`       | -         |
| Prettier `arrowParens: "always"`              | `javascript.formatter.arrowParentheses: "always"` | -         |
| Prettier `bracketSpacing: true`               | `formatter.bracketSpacing: true`                  | -         |
| Prettier `endOfLine: "lf"`                    | `formatter.lineEnding: "lf"`                      | -         |
| Prettier `tabWidth: 2`                        | `formatter.indentWidth: 2`                        | -         |

> Biome `recommended: true` incluye la mayoria de reglas de `eslint:recommended` y
> `@typescript-eslint/recommended`. Consultar https://biomejs.dev/linter/javascript/sources/
> para la tabla completa de equivalencias.

## 3. Scripts de package.json Equivalentes

### Root package.json — reemplazar scripts

```jsonc
{
  "scripts": {
    // Mantener sin cambios:
    "preinstall": "node scripts/check-package-manager.cjs",
    "sync-pnpm": "node scripts/sync-pnpm-version.js",
    "test": "pnpm --filter web-client test",
    "test:ui": "pnpm --filter web-client test:ui",
    "test:coverage": "pnpm --filter web-client test:coverage",
    "prepare": "husky",
    "dev:web": "pnpm --filter web-client dev",
    "build:web": "pnpm --filter web-client build",
    "build:analyze": "pnpm --filter web-client build:analyze",
    "preview:web": "pnpm --filter web-client preview",
    "dev:backend": "pnpm --filter @misak/backend-service dev",
    "build:backend": "pnpm --filter @misak/backend-service build",
    "start:backend": "pnpm --filter @misak/backend-service start",
    "prisma:generate": "pnpm --filter @misak/backend-service prisma:generate",
    "prisma:studio": "pnpm --filter @misak/backend-service prisma:studio",
    "db:push": "pnpm --filter @misak/backend-service db:push",

    // NUEVOS (reemplazan ESLint + Prettier):
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "ci": "biome ci .",

    // ELIMINAR (ya no necesarios):
    // "lint:web": "pnpm --filter web-client lint"  <-- biome lint . cubre todo
  },
}
```

### apps/web-client/package.json — reemplazar scripts de lint

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:analyze": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    // REEMPLAZAR:
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
  },
}
```

### apps/backend-service/package.json — reemplazar scripts de lint/format

```jsonc
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    // REEMPLAZAR:
    "lint": "biome lint src/",
    "lint:fix": "biome lint --write src/",
    "format": "biome format --write \"src/**/*.ts\" \"prisma/**/*.ts\"",
    "format:check": "biome format \"src/**/*.ts\" \"prisma/**/*.ts\"",
  },
}
```

## 4. Configuracion de lint-staged y Husky con Biome

### lint-staged (en root package.json)

Reemplazar el bloque `"lint-staged"` actual por:

```jsonc
{
  "lint-staged": {
    "*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc,css}": [
      "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
    ],
  },
}
```

> Con Biome un solo comando reemplaza `eslint --fix` + `prettier --write`.
> `--files-ignore-unknown=true` evita errores en archivos no soportados.
> `--no-errors-on-unmatched` evita fallos si no hay archivos staged del tipo indicado.

### Husky pre-commit (`.husky/pre-commit`)

```sh
#!/bin/sh

set -e

# Run lint-staged with Biome (replaces ESLint + Prettier)
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec lint-staged
else
  npx --no-install lint-staged
fi
```

### Husky pre-push (`.husky/pre-push`)

```sh
#!/bin/sh

set -e

# 1) Biome CI — check formatting + lint (no writes, exit on error)
if command -v pnpm >/dev/null 2>&1; then
  pnpm run ci
else
  npx --no-install @biomejs/biome ci .
fi

# 2) Build the web client to catch build-time issues
if command -v pnpm >/dev/null 2>&1; then
  pnpm build:web
else
  echo "[husky][pre-push] pnpm not found. Skipping web build."
fi
```

> `biome ci` reemplaza `format:check` + `lint` en un solo paso.

## 5. Templates de CI Workflows Actualizados

### `.github/workflows/lint.yml` (Code Quality)

```yaml
name: Code Quality

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    name: Biome Lint & Format + Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Biome
        uses: biomejs/setup-biome@v2
        with:
          version: latest

      - name: Run Biome CI (lint + format check)
        run: biome ci .

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.20.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript type check (web-client)
        run: pnpm --filter web-client exec tsc --noEmit

      - name: TypeScript type check (backend-service)
        run: pnpm --filter @misak/backend-service exec tsc --noEmit
```

> NOTA: `biome ci` no necesita Node.js ni dependencias instaladas (es un binario standalone).
> Solo se instalan dependencias para el type check de TypeScript.

### `.github/workflows/test.yml` (Tests)

```yaml
name: Tests

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Run Test Suite
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.20.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm test:coverage --run

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./apps/web-client/coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true
          verbose: true
```

### `.github/workflows/build.yml` (Build)

```yaml
name: Build

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    name: Production Build
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.20.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build for production
        run: pnpm build:web

      - name: Check bundle size
        run: |
          echo "Bundle Size Report:"
          du -sh apps/web-client/dist/
          echo ""
          echo "Asset Details:"
          ls -lh apps/web-client/dist/assets/ | tail -n +2

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: apps/web-client/dist/
          retention-days: 7
```

## 6. Archivos a Eliminar y Dependencias a Desinstalar

### Archivos a eliminar

```
# ESLint configs
eslint.config.js                            # raiz
apps/web-client/eslint.config.js            # web-client
apps/backend-service/.eslintrc.json         # backend (legacy)

# Prettier configs
.prettierrc.json
.prettierignore
```

### Dependencias a desinstalar (root)

```sh
pnpm remove -w eslint @eslint/js typescript-eslint prettier
```

### Dependencias a desinstalar (web-client)

```sh
pnpm --filter web-client remove eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint
```

### Dependencias a desinstalar (backend-service)

El backend-service no tiene ESLint/Prettier en sus propias devDependencies
(usa los del root hoisting), asi que no hay que desinstalar nada alli.
Verificar que no queden paquetes `eslint*` o `prettier` en su `package.json`.

### Dependencia a instalar (root)

```sh
pnpm add -Dw @biomejs/biome
```

### Actualizar .npmrc

Eliminar las lineas de hoisting de ESLint/Prettier:

```diff
- public-hoist-pattern[]=*eslint*
- public-hoist-pattern[]=*prettier*
```

Mantener:

```ini
public-hoist-pattern[]=*typescript*
```

## 7. Migracion Automatica (opcional)

Biome ofrece comandos para migrar automaticamente las configs existentes:

```sh
# 1. Migrar ESLint -> biome.json (desde la raiz)
pnpm exec biome migrate eslint --write --include-inspired

# 2. Migrar Prettier -> biome.json
pnpm exec biome migrate prettier --write
```

> Estos comandos generan un `biome.json` basado en las configs existentes.
> Se recomienda usarlos como punto de partida y luego ajustar manualmente
> con el template de la Seccion 1 para que coincida con las convenciones del proyecto.

## 8. Checklist de Verificacion

Ejecutar despues de completar la migracion:

- [ ] `biome.json` existe en la raiz del monorepo con el schema correcto
- [ ] `biome.json` NO existe dentro de `apps/web-client/` ni `apps/backend-service/`
- [ ] `pnpm check` (o `biome check .`) ejecuta sin errores criticos
- [ ] `pnpm format` formatea todo el codebase consistentemente
- [ ] `pnpm lint` reporta solo warnings esperados (no errores inesperados)
- [ ] `pnpm ci` (o `biome ci .`) pasa limpio
- [ ] `pnpm build:web` compila sin errores
- [ ] `pnpm build:backend` compila sin errores
- [ ] `pnpm test` todos los tests pasan
- [ ] Git hooks funcionan:
  - [ ] `pre-commit`: lint-staged con Biome formatea y lintea staged files
  - [ ] `pre-push`: `biome ci` + build pasan
- [ ] CI workflows actualizados:
  - [ ] `lint.yml` usa `biomejs/setup-biome@v2` + `biome ci`
  - [ ] `test.yml` sin cambios en la logica de tests
  - [ ] `build.yml` sin cambios en la logica de build
- [ ] Archivos eliminados:
  - [ ] `eslint.config.js` (raiz)
  - [ ] `apps/web-client/eslint.config.js`
  - [ ] `apps/backend-service/.eslintrc.json`
  - [ ] `.prettierrc.json`
  - [ ] `.prettierignore`
- [ ] Dependencias eliminadas:
  - [ ] `eslint`, `@eslint/js`, `typescript-eslint`, `prettier` (raiz)
  - [ ] `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint` (web-client)
- [ ] `@biomejs/biome` instalado como devDependency en la raiz
- [ ] `.npmrc` actualizado (sin hoisting de eslint/prettier)
- [ ] IDE configurado para usar Biome (extension Biome para VS Code/Zed)
- [ ] AGENTS.md actualizado (secciones Formatting, lint scripts, CI)
