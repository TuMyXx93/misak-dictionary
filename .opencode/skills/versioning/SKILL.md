---
name: versioning
description: >
  Patron completo de versionamiento del proyecto: Semantic Versioning, Conventional Commits,
  commitlint, commit-and-tag-version, CHANGELOG automation y pre-task security gate.
  Usar cuando se necesite configurar, validar o ejecutar releases del monorepo.
---

# Skill: Versioning

Patron completo de versionamiento para el monorepo Misak Dictionary.
Define la estrategia de versiones, formato de commits, automatizacion de changelogs,
y el security gate que valida el estado del repositorio antes de cualquier tarea.

## 1. Estrategia de Versioning

### Single-Version Policy

El monorepo usa una **version unificada**: todas las `package.json` (root, `apps/web-client`,
`apps/backend-service`) comparten la misma version. Esto simplifica la coordinacion de releases
y garantiza coherencia entre paquetes.

### Semantic Versioning (semver)

Formato: `MAJOR.MINOR.PATCH` con sufijos pre-release opcionales.

| Componente  | Cuando se incrementa                       | Ejemplo           |
| ----------- | ------------------------------------------ | ----------------- |
| MAJOR       | Cambios incompatibles (breaking changes)   | `1.0.0` → `2.0.0` |
| MINOR       | Nueva funcionalidad compatible hacia atras | `1.0.0` → `1.1.0` |
| PATCH       | Correccion de bugs compatible hacia atras  | `1.0.0` → `1.0.1` |
| Pre-release | Version en desarrollo (alpha, beta, rc)    | `1.1.0-alpha.0`   |

### Tags Git

- Formato: `vX.Y.Z` (ej: `v0.4.0-alpha`)
- Se crean automaticamente con `commit-and-tag-version`
- Nunca crear tags manualmente — usar los scripts de release

### Branch Strategy

| Branch      | Proposito                           |
| ----------- | ----------------------------------- |
| `main`      | Releases estables, protegida        |
| `dev`       | Desarrollo activo, integra features |
| `feature/*` | Nueva funcionalidad                 |
| `chore/*`   | Tareas de mantenimiento             |
| `fix/*`     | Correcciones de bugs                |

---

## 2. Conventional Commits Specification

### Formato Obligatorio

Todos los commits del proyecto DEBEN seguir este formato:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types Permitidos

| Type       | Proposito                              | Bump  |
| ---------- | -------------------------------------- | ----- |
| `feat`     | Nueva funcionalidad                    | MINOR |
| `fix`      | Correccion de bug                      | PATCH |
| `docs`     | Solo documentacion                     | —     |
| `style`    | Cambios de formato (no afectan logica) | —     |
| `refactor` | Refactorizacion (no feat ni fix)       | —     |
| `perf`     | Mejora de performance                  | PATCH |
| `test`     | Tests                                  | —     |
| `build`    | Sistema de build o dependencias        | —     |
| `ci`       | Cambios en CI/CD                       | —     |
| `chore`    | Tareas de mantenimiento                | —     |
| `revert`   | Revertir commit anterior               | —     |

### Scopes del Proyecto

| Scope        | Ambito               |
| ------------ | -------------------- |
| `web-client` | Frontend React       |
| `backend`    | Backend Fastify      |
| `shared`     | Paquetes compartidos |
| `deps`       | Dependencias         |
| `release`    | Releases y versiones |

### BREAKING CHANGES

Para indicar cambios incompatibles:

- Agregar `!` despues del type/scope: `feat(backend)!: change auth API response format`
- O agregar `BREAKING CHANGE:` en el footer del commit

Los breaking changes siempre hacen bump de MAJOR.

### Ejemplos

```sh
# Feature con scope
feat(web-client): add dark mode toggle to settings

# Fix con scope
fix(backend): handle null token in refresh endpoint

# Breaking change con !
feat(backend)!: change auth response to include refresh token

# Con body y footer
fix(web-client): prevent infinite re-render in dictionary page

The useEffect dependency array was missing the searchTerm variable,
causing a re-render loop when the user typed in the search box.

Closes #42

# Chore
chore(deps): update vitest to v4.1.0
```

---

## 3. Template commitlint.config.js

Archivo a crear en la raiz del monorepo:

```js
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-enum': [1, 'always', ['web-client', 'backend', 'shared', 'deps', 'release']],
    'scope-empty': [1, 'never'],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
  },
};
```

---

## 4. Template Husky commit-msg Hook

Archivo a crear en `.husky/commit-msg`:

```sh
#!/bin/sh
set -e

# Validate commit message follows Conventional Commits
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec commitlint --edit "$1"
else
  npx --no-install commitlint --edit "$1"
fi
```

---

## 5. Template .versionrc.json

Archivo de configuracion para `commit-and-tag-version`, crear en la raiz del monorepo:

```json
{
  "header": "# Historial de Cambios (Changelog)\n\nTodos los cambios notables del proyecto estan documentados en este archivo.\n\nEl formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\ny el proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n",
  "types": [
    { "type": "feat", "section": "Funcionalidades" },
    { "type": "fix", "section": "Correcciones" },
    { "type": "perf", "section": "Performance" },
    { "type": "refactor", "section": "Refactorizaciones" },
    { "type": "docs", "section": "Documentacion", "hidden": false },
    { "type": "test", "section": "Testing", "hidden": false },
    { "type": "build", "section": "Build", "hidden": true },
    { "type": "ci", "section": "CI/CD", "hidden": true },
    { "type": "chore", "section": "Mantenimiento", "hidden": true },
    { "type": "style", "hidden": true }
  ],
  "packageFiles": [
    "package.json",
    "apps/web-client/package.json",
    "apps/backend-service/package.json"
  ],
  "bumpFiles": [
    "package.json",
    "apps/web-client/package.json",
    "apps/backend-service/package.json"
  ],
  "tagPrefix": "v",
  "commitUrlFormat": "https://github.com/Tumi-dev/misak-dictionary/commit/{{hash}}",
  "compareUrlFormat": "https://github.com/Tumi-dev/misak-dictionary/compare/{{previousTag}}...{{currentTag}}"
}
```

---

## 6. Scripts de package.json para Versioning

Agregar al `package.json` de la raiz del monorepo:

```jsonc
{
  "scripts": {
    // Scripts existentes se mantienen...
    "release": "commit-and-tag-version",
    "release:alpha": "commit-and-tag-version --prerelease alpha",
    "release:beta": "commit-and-tag-version --prerelease beta",
    "release:dry": "commit-and-tag-version --dry-run",
    "release:first": "commit-and-tag-version --first-release",
  },
}
```

---

## 7. Pre-Task Security Gate — Checklist de Validacion

Este es el checklist que el command `/version-gate` debe verificar antes de cualquier tarea
que modifique codigo del proyecto.

### Items de Validacion

| #   | Check                          | Comando                                        | Severidad   |
| --- | ------------------------------ | ---------------------------------------------- | ----------- |
| 1   | Git Clean State                | `git status --porcelain`                       | **BLOCKER** |
| 2   | Branch Correcta                | `git branch --show-current`                    | WARNING     |
| 3   | Versiones Consistentes         | Comparar version en todas las `package.json`   | **BLOCKER** |
| 4   | Tag Actualizado                | `git tag -l` vs version en `package.json`      | WARNING     |
| 5   | Commits Convencionales         | `git log --oneline` formato validation         | WARNING     |
| 6   | No Archivos Untracked Criticos | `git status --porcelain` buscar `.ts`, `.json` | WARNING     |
| 7   | CHANGELOG Sincronizado         | Comparar version en `CHANGELOG.md` vs tag      | WARNING     |

### Severidades

- **BLOCKER**: Deben pasar obligatoriamente. Si fallan, la tarea se detiene.
  - Item 1 (Git Clean State): Working tree limpio (`git status --porcelain` vacio o solo archivos esperados)
  - Item 3 (Versiones Consistentes): Todas las `package.json` tienen la misma version

- **WARNING**: Se reportan pero permiten continuar con confirmacion del usuario.
  - Item 2 (Branch Correcta): Estamos en la rama apropiada para la tarea (no en `main` para features)
  - Item 4 (Tag Actualizado): El ultimo tag git corresponde a la version en `package.json`, o los commits desde el ultimo tag estan documentados
  - Item 5 (Commits Convencionales): Los ultimos N commits siguen Conventional Commits
  - Item 6 (No Archivos Untracked Criticos): No hay archivos de configuracion o codigo fuente sin trackear que deberian estar bajo control de versiones
  - Item 7 (CHANGELOG Sincronizado): La version en `CHANGELOG.md` coincide con el ultimo tag o con la version en desarrollo

---

## 8. Dependencias a Instalar

```sh
pnpm add -Dw commitlint @commitlint/config-conventional commit-and-tag-version
```

Estas dependencias se instalan en la raiz del monorepo (`-w` flag) como devDependencies (`-D` flag):

| Paquete                           | Proposito                                                            |
| --------------------------------- | -------------------------------------------------------------------- |
| `commitlint`                      | CLI para validar mensajes de commit                                  |
| `@commitlint/config-conventional` | Preset de reglas para Conventional Commits                           |
| `commit-and-tag-version`          | Genera changelog, bumps version, crea tag (fork de standard-version) |

---

## 9. Checklist de Setup Completo

- [ ] commitlint instalado y configurado (`commitlint.config.js` en raiz)
- [ ] Husky `commit-msg` hook creado (`.husky/commit-msg`)
- [ ] `.versionrc.json` creado en raiz
- [ ] Scripts de release agregados al root `package.json`
- [ ] Versiones de `package.json` alineadas en todos los workspaces
- [ ] `CHANGELOG.md` actualizado con historial existente
- [ ] Tag git creado para la version baseline actual
- [ ] `AGENTS.md` actualizado con convenciones de commit y versionamiento
