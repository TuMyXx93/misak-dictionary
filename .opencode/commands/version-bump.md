---
description: Ejecuta un version bump con changelog automatico y tag git
agent: devops
---

Ejecuta un version bump para el monorepo Misak Dictionary con changelog automatico y tag git.

Tipo de bump solicitado: **$1**

Argumentos adicionales: $ARGUMENTS

## Instrucciones

### 1. Pre-validacion (Security Gate)

Ejecuta `/version-gate` internamente. Si el veredicto es **FAIL**, DETENER inmediatamente
y reportar los blockers al usuario. No proceder con el bump.

### 2. Validar Argumento

`$1` debe ser uno de: `patch`, `minor`, `major`, `alpha`, `beta`, `first`.

Si el argumento no es valido o no se proporciono, informar al usuario los valores permitidos
y pedir que re-ejecute el comando con el argumento correcto.

### 3. Dry Run

Ejecutar primero un dry-run para previsualizar los cambios:

```sh
pnpm run release:dry
```

### 4. Mostrar Preview

Mostrar al usuario:

- Version actual → Nueva version
- Commits que se incluiran en el changelog
- Preview del changelog generado

### 5. Ejecutar Documentation Sync Gate

Antes del bump real, ejecutar internamente:

```sh
/docs-gate latest
```

Si el veredicto es **FAIL**, DETENER el release y reportar exactamente:

- Que cambios del changelog requieren reflejo en la documentacion principal
- Que archivos canonicos deben actualizarse

Si el veredicto es **WARNING**, mostrarlo junto con el preview antes de pedir confirmacion.

### 6. Pedir Confirmacion

Preguntar al usuario si desea proceder con el bump real. NO ejecutar automaticamente.

### 7. Ejecutar Release

Segun el tipo de bump:

| Argumento | Comando                  |
| --------- | ------------------------ |
| `patch`   | `pnpm run release`       |
| `minor`   | `pnpm run release`       |
| `major`   | `pnpm run release`       |
| `alpha`   | `pnpm run release:alpha` |
| `beta`    | `pnpm run release:beta`  |
| `first`   | `pnpm run release:first` |

Nota: Para `patch`, `minor`, y `major`, `commit-and-tag-version` determina automaticamente
el tipo de bump basado en los commits convencionales. Si se necesita forzar un tipo especifico,
usar `pnpm run release -- --release-as <tipo>`.

### 8. Verificar Release

Despues de ejecutar:

- Confirmar que se creo el tag con `git tag -l --sort=-v:refname | head -1`
- Confirmar que se creo el commit de release con `git log --oneline -1`
- Confirmar que `CHANGELOG.md` fue actualizado
- Confirmar que no quedaron blockers documentales abiertos si `/docs-gate` reporto warnings

### 9. Recordatorio Final

Informar al usuario:

```
Release completado. Cuando estes listo, ejecuta:
  git push --follow-tags
```
