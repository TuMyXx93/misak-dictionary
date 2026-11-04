---
id: 004-esquema-contenido
version: 1.0.0
status: approved
created: 2026-10-15
approved: 2026-10-15
cultural-gate: true
---

# 004 — Taxonomía v1 y gobernanza de la carga

> Reencuadre (v0.2.0). La versión 0.1.0 describía un diseño de contenido general
> (i18n, audio, staging de términos). Ese alcance se separa: lo que se implementa aquí
> es la taxonomía de campos semánticos y las reglas para cargarla de forma segura.
> Términos, i18n y audio pasan a una spec posterior (ver "Fuera de alcance").

## Contexto

El diccionario debe mostrar la estructura que define el documento
`docs/estructura-diccionario-campos-1-2-3-4.pdf` (campos, subcampos, microcampos) y los
botones del home. Hasta ahora esa estructura existía solo como datos de demostración,
no alineados con el documento, y el esquema permitía duplicados entre filas borradas.
Además, los nombres Misak requieren ratificación comunitaria (Constitución C1.1).

Lo que motiva esta spec:

1. La taxonomía debe venir de un archivo versionado y revisado, no de datos ad hoc.
2. Una carga errónea no debe dejar la base a medias ni duplicar nombres activos.
3. Los borrados deben ser recuperables por la administración.
4. La ortografía namtrik debe ser uniforme (decisión del equipo lingüístico: la vocal
   "o" no existe en namtrik; se escribe "ɵ").

## Modelo de dominio

```
Campo semántico  (1) ──< Subcampo semántico (N) ──< Microcampo (N) >──< Término (N)
                                                        │
                            Medios (imagen / audio) pueden asociarse en cada nivel
```

- Un campo contiene varios subcampos; un subcampo contiene varios microcampos.
- Algunos microcampos contienen **subniveles** (p. ej., microcampo 19 "Acciones y estados
  humanos" con 9 subniveles). Un subnivel es un contenedor de términos igual que un
  microcampo: se modela como microcampo con `padre_id`, y sus términos se asocian a él.
- Un microcampo o subnivel contiene N términos. Cada término tiene forma en namtrik y en español.
  Un término puede aparecer en más de un microcampo (relación N:M).
- Imágenes y audios pueden asociarse a un campo, subcampo, microcampo o término, de forma
  global o escalonada (p. ej., un audio de un campo y uno por cada término).

## Requisitos (EARS)

- **R-001** — CUANDO se ejecute la importación, EL SISTEMA DEBERÁ validar el archivo de
  taxonomía con un esquema Zod antes de comparar o escribir, y RECHAZAR el archivo si no
  cumple la forma (códigos, niveles, versión).
- **R-002** — MIENTRAS la importación no reciba `--apply`, EL SISTEMA NO DEBERÁ escribir
  en la base de datos; DEBERÁ mostrar el plan (crear, actualizar, sin cambios, conflicto).
- **R-003** — CUANDO se ejecute `--apply`, EL SISTEMA DEBERÁ exigir el nombre del
  aprobador (`--approved-by`) y NO DEBERÁ escribir si no se proporciona.
- **R-004** — CUANDO el plan contenga conflictos (un nombre o slug ya usado por otro
  código bajo el mismo padre) o errores de validación, EL SISTEMA NO DEBERÁ aplicar
  ningún cambio del lote.
- **R-005** — CUANDO se aplique un lote, EL SISTEMA DEBERÁ ejecutar todos los cambios en
  una sola transacción, en orden padre→hijo, de modo que un fallo deshaga el lote completo.
- **R-006** — CUANDO se importe la misma versión dos veces, EL SISTEMA DEBERÁ dejar la
  base sin cambios en la segunda ejecución (identidad por código, idempotencia).
- **R-007** — CUANDO se aplique un lote, EL SISTEMA DEBERÁ registrar en `audit_log` una
  entrada con el identificador del lote, el aprobador, la huella SHA-256 del archivo y el
  resumen de cambios.
- **R-008** — MIENTRAS exista una fila activa con el mismo código, slug o nombre bajo el
  mismo padre, EL SISTEMA NO DEBERÁ permitir otra fila activa con ese valor (unicidad
  parcial sobre filas con `deleted_at IS NULL`).
- **R-009** — CUANDO se importe la taxonomía v1, EL SISTEMA DEBERÁ retirar (borrado
  lógico) las filas de demostración con código `LEG-*`, incluidas las palabras que
  dependan solo de ellas, sin borrado físico.
- **R-010** — CUANDO un administrador consulte la papelera, EL SISTEMA DEBERÁ listar los
  campos, subcampos y microcampos borrados lógicamente, y CUANDO restaure uno, DEBERÁ
  reactivarlo solo si su código, slug y nombre no están ocupados por una fila activa
  (409 en caso contrario), registrando la restauración en `audit_log`.
- **R-011** — CUANDO se acceda a una ruta administrativa del diccionario, EL SISTEMA
  DEBERÁ verificar el permiso `dictionary:write` consultando la base en cada petición;
  el nombre del rol en el token NO DEBERÁ conceder acceso.
- **R-012** — CUANDO se normalice un término namtrik, EL SISTEMA DEBERÁ escribir "o",
  "ə" y "ɔ" como "ɵ" (y sus equivalentes en mayúscula), sin alterar el texto en español.
- **R-013** — CUANDO se importe la taxonomía, EL SISTEMA DEBERÁ actualizar los siete
  botones del home (`home_slots`), con clave estable, etiqueta y campo de referencia
  por código; un botón sin campo se muestra como pendiente.
- **R-014** — CUANDO se asocie un medio (imagen o audio) a un campo, subcampo, microcampo
  o término, EL SISTEMA DEBERÁ registrar el nivel de pertenencia y el idioma (para audio),
  y permitir asociaciones globales y por nivel sin duplicar el archivo.
  _Estado: definido; implementación en una spec posterior (los campos `imagen` y
  `*_audio` actuales son marcadores, no almacenamiento)._

## Hallazgo: forma del término en el archivo del equipo lingüístico

Las hojas `1.diccionario-campo-namtrik-castellano.xlsm` (una por campo) muestran que la
unidad de trabajo no es una fila "namtrik = español". Ejemplos verificados en la hoja
"1 NAKCHAK", microcampo 19, subnivel 1:

| Formas namtrik (categoría, variante)                         | Glosa en español                          |
| ------------------------------------------------------------ | ----------------------------------------- |
| Murarap (adj., V.1) · Kirap (adj., V.2)                      | Cansado                                   |
| Poiorop (v., V.1) · Poiutsap (v., V.2) · Poiisik (v., V.3)   | Flatulencia                               |
| Miirap (v., neol., V.1) · Kasrak kɵtrɵisrik (v., neol., V.2) | Cantar + nota de neologismo (texto largo) |

Consecuencias:

- Un **sentido** (glosa en español, con nota opcional) tiene **N formas** namtrik; cada
  forma lleva categoría gramatical, variante y, cuando aplica, la marca de neologismo.
- El modelo actual (`palabras_modelo_1`, una fila = un namtrik + un español) no puede
  representar esto sin duplicar glosas. Se requiere un modelo de sentido + formas.
- Las notas culturales largas (p. ej., "Cantar") son texto con ratificación, no un
  campo corto.

Esto **no** se implementa en esta PR: es la base de la spec de términos, que debe cerrarse
antes de cargar el `.xlsm`.

## Criterios de aceptación (Gherkin)

### R-002 / R-003

```gherkin
Escenario: Dry-run no escribe
  Dado la taxonomía v1 y una base con los datos demo
  Cuando se ejecuta la importación sin --apply
  Entonces el informe lista 65 nodos a crear y 17 filas legadas a retirar
  Y ninguna fila cambia

Escenario: Aplicar sin aprobador
  Cuando se ejecuta la importación con --apply y sin --approved-by
  Entonces la ejecución termina con error y no se escribe nada
```

### R-004 / R-005

```gherkin
Escenario: Conflicto bloquea el lote
  Dado una fila activa "Mɵ tsilɵmera" bajo el mismo subcampo con otro código
  Cuando se aplica la importación
  Entonces el informe marca el conflicto con el código ocupante
  Y ningún nodo del lote se crea ni se actualiza
```

### R-006

```gherkin
Escenario: Segunda importación idempotente
  Dado que la taxonomía v1 ya fue aplicada
  Cuando se vuelve a ejecutar la importación
  Entonces el informe muestra 0 creaciones, 0 actualizaciones y 65 sin cambios
```

### R-010

```gherkin
Escenario: Restaurar un campo borrado por error
  Dado un campo "C2" borrado lógicamente y ningún campo activo con su código
  Cuando un administrador lo restaura desde la papelera
  Entonces el campo vuelve a estar activo
  Y la restauración queda registrada en audit_log

Escenario: Restauración bloqueada por colisión
  Dado un campo borrado "C2" y otro campo activo con el mismo código
  Cuando se intenta restaurar el borrado
  Entonces la respuesta es 409 y ninguna fila cambia
```

### R-011

```gherkin
Escenario: El nombre del rol en el token no basta
  Dado un usuario cuyo token declara el rol "super_admin"
  Y cuya base de datos no tiene el permiso dictionary:write
  Cuando llama a una ruta admin del diccionario
  Entonces la respuesta es 403
```

## Fuera de alcance

- Términos (palabras) de cada microcampo o subnivel: llegan desde el archivo `.xlsm` del
  equipo lingüístico en una spec posterior, con el modelo sentido + formas descrito en
  "Hallazgo". La UI muestra "términos en preparación".

- Almacenamiento real de medios (R-014): se implementa en una spec posterior.
- Internacionalización (tercer idioma) y procedencia por término.
- Ratificación cultural: el permiso `taxonomy:ratify` existe en la matriz de roles, pero
  el endpoint de ratificación y el flujo de estados (`borrador → revisión → ratificado`)
  se especifican aparte.
- Interfaz del panel administrativo y el home conectado a la base (PR siguiente).
- Resolución de homónimos (caso `Tʊka`): requiere ADR de identidad de términos.
- Decisión pendiente: si los ítems 1–9 del microcampo 19 son subniveles permanentes o
  etiquetas. Se implementaron como subniveles (`padre_id`, un nivel adicional).

## Trazabilidad

| Requisito | Archivos                                                                                                                                  | Verificación                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| R-001     | `application/taxonomy/taxonomySchema.ts`, `application/taxonomy/taxonomyImport.ts`                                                        | Dry-run sobre YAML real (manual)                                                     |
| R-002     | `scripts/taxonomy-import.ts`                                                                                                              | Dry-run y apply sin aprobador (manual, código 2)                                     |
| R-003     | `application/taxonomy/taxonomyImport.ts`                                                                                                  | Apply sin aprobador (manual)                                                         |
| R-004     | `application/taxonomy/taxonomyPlan.ts`                                                                                                    | `taxonomyPlan.test.ts` (conflicto)                                                   |
| R-005     | `infrastructure/repositories/TaxonomyRepository.ts`                                                                                       | Test de integración con PostgreSQL real: rollback completo (`pnpm test:integration`) |
| R-006     | `application/taxonomy/taxonomyPlan.ts`                                                                                                    | Segunda ejecución: 65 sin cambios (manual)                                           |
| R-007     | `infrastructure/repositories/TaxonomyRepository.ts`                                                                                       | Entrada `taxonomy.import` en `audit_log` (manual)                                    |
| R-008     | `prisma/migrations/0006_taxonomy_governance/migration.sql`, `prisma/schema.prisma`                                                        | Verificado en base de desarrollo; Prisma no expresa el índice parcial                |
| R-009     | `infrastructure/repositories/TaxonomyRepository.ts`                                                                                       | Conteo tras aplicar: 0 `LEG-*` activos, 0 palabras activas (manual)                  |
| R-010     | `application/use-cases/admin/PapeleraUseCase.ts`, `api/admin/routes/adminDictionaryRoutes.ts`                                             | `PapeleraUseCase.test.ts`                                                            |
| R-011     | `presentation/middleware/authorizationMiddleware.ts`, `infrastructure/repositories/PermissionRepository.ts`, `shared/auth/permissions.ts` | `requirePermission.test.ts`, matriz de roles en `permissions.ts`                     |
| R-012     | `shared/utils/namtrik.ts`                                                                                                                 | `taxonomyPlan.test.ts`                                                               |
| R-013     | `data/taxonomy/v1/home-slots.yaml`, `TaxonomyRepository.ts`                                                                               | Estado de `home_slots` tras aplicar (manual)                                         |

Verificación de la fuente: `data/taxonomy/v1/taxonomia.yaml` se comparó nodo por nodo con
`docs/estructura-diccionario-campos-1-2-3-4.pdf` (páginas 1 a 3): 4 campos, 18 subcampos,
34 microcampos, 9 subniveles y sus glosas. Cero diferencias.

Nota: la spec 003 (R-008) referenciaba `prisma/seed-dictionary.ts`, que se retira en
esta spec. Ese requisito queda sustituido por R-009 y R-006.
