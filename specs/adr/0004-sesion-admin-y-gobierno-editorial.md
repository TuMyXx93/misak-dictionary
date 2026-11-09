# ADR-0004: Sesión Administrativa, Seguridad de Tokens y Gobierno Editorial

- **Fecha**: 2026-10-16
- **Estado**: Aceptado
- **Relacionado con**: `specs/features/006-panel-admin-gobierno/spec.md`, `specs/features/006-panel-admin-gobierno/plan.md`

## Contexto

Con la integración de la Spec 005, el diccionario cuenta con un corpus v1 persistido (`1.351` sentidos, `1.451` formas, 65 nodos) y autenticación base vía JWT y Argon2id (Spec 002). Sin embargo, al diseñar el panel administrativo y gobierno editorial (Spec 006), se evidenciaron cuatro requerimientos críticos que demandan decisiones arquitectónicas formales:

1. **Almacenamiento seguro del Refresh Token en clientes Web (R-002, RK-1)**:
   - Almacenar tokens de refresco de larga duración en `localStorage` o `sessionStorage` deja a la aplicación vulnerable a exfiltración mediante Cross-Site Scripting (XSS).
   - El backend emitía los tokens exclusivamente en el cuerpo de la respuesta JSON (`body.refreshToken`), obligando al cliente a guardarlos en almacenamiento accesible por JavaScript.
   - En arquitecturas desacopladas (desarrollo con Vite en `:5173` y Fastify en `:3000`, o producción con frontend y API en subdominios o el mismo dominio), la configuración de cookies `SameSite=Strict` puede impedir el envío automático de credenciales en flujos cross-site legítimos.
2. **Gobernanza y Separación Estricta de Funciones (R-010, R-011, R-012)**:
   - El principio institucional del proyecto estipula que quien crea o modifica contenido estructural/lexical (`content_admin`, `admin` con permiso `dictionary:write`) **no debe ratificar** contenido cultural, labor reservada a las autoridades lingüísticas (`cultural_reviewer` con permiso `taxonomy:ratify`).
   - El esquema de base de datos carecía de seguimiento de `ultimo_editor_id`, lo que imposibilitaba bloquear por software la auto-ratificación (un usuario aprobando sus propias ediciones).
   - Los subcampos y microcampos no contaban con campo `estado` en la base de datos, y los sentidos léxicos carecían de columnas para registrar quién y cuándo ratificó.
3. **Integridad Transaccional en Ratificación Masiva por Microcampo (R-025)**:
   - La revisión cultural se ejecuta eficientemente agrupando sentidos por microcampo. Si la ratificación de un conjunto de sentidos se realiza de forma individual sin control de concurrencia, una edición concurrente podría quedar ratificada inadvertidamente sin haber sido revisada.
4. **Política de Protección Cultural y Purga de Papelera (R-017)**:
   - Para salvaguardar el patrimonio lingüístico de pérdidas irreversibles, la eliminación física definitiva de datos debe contar con salvaguardas extremas de tiempo, dependencias y confirmación explícita.

---

## Decisión

### 1. Modelo de Sesión Híbrido con Cookie `HttpOnly` y Access Token en Memoria
- **Cookie `misak_rt`**:
  - Para clientes web (panel administrativo), el refresh token se emite en una cookie con atributos `HttpOnly`, `Path=/auth`, `SameSite=Lax` (configurable vía variable de entorno `COOKIE_SAME_SITE`) y `Secure=true` en entornos productivos (`NODE_ENV === 'production'`).
  - `SameSite=Lax` mitiga el riesgo **RK-1** al permitir el flujo fluido de refresco tanto en despliegues con reverse proxy en un único dominio como en arquitecturas con subdominios (`app.misak.org` y `api.misak.org`), preservando la protección contra ataques CSRF cross-origin no intencionados.
  - Para blindar contra CSRF, se establece el mecanismo opt-in mediante la cabecera obligatoria `X-Client: web-admin`. Esta cabecera personalizada fuerza al navegador a emitir un preflight CORS (`OPTIONS`) antes de mutaciones, validando en Fastify el `Origin` contra la lista permitida (`corsOrigins`).
- **Coexistencia y Compatibilidad hacia Atrás**:
  - Si una petición no envía `X-Client: web-admin` (por ejemplo, scripts de automatización, tests de integración o futuras apps móviles), el backend mantiene el comportamiento heredado retornando y recibiendo el `refreshToken` en el cuerpo JSON, garantizando cero rupturas de contratos previos.
- **Access Token**:
  - El token de acceso (JWT de corta duración) se mantiene **exclusivamente en la memoria volátil** del cliente SPA (`authStore`), eliminando todo almacenamiento en disco del navegador. Ante expiración (`401`), el cliente ejecuta un refresco transparente en vuelo único (*single-flight refresh*).

### 2. Esquema de Gobierno, Auditoría y Separación de Funciones
- **Migración `0009_gobierno_editorial`**:
  - Se incorporan a `campos_semanticos`, `subcampos_semanticos`, `microcampos` y `sentidos_lexicos`:
    - `ultimo_editor_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL`
    - `ultimo_editor_at TIMESTAMPTZ NULL`
    - `ratificado_por_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL`
    - `ratificado_at TIMESTAMPTZ NULL`
    - `estado TEXT NOT NULL DEFAULT 'borrador'`
  - **Invariante a nivel de Motor Relacional**:
    - Se añade la restricción `CHECK ((estado = 'ratificado') = (ratificado_at IS NOT NULL))` para impedir que una fila quede marcada como ratificada sin fecha de auditoría o viceversa.
- **Transición de Estado por Edición Cultural**:
  - Toda modificación sobre campos culturales (`lema`, `espanol_glosa`, `espanol_explicacion`, `namtrik_contexto`, `nombre_cientifico`, o réplicas dialógicas) en un registro `ratificado` lo degrada automáticamente a `borrador`, limpiando los campos `ratificado_*` e incrementando su `version`.
- **Bloqueo de Auto-Ratificación**:
  - El caso de uso rechaza con error `409 Conflict` cualquier intento de ratificación si `ultimo_editor_id === actor.userId`, a menos que el actor ostente el rol `super_admin`.

### 3. Ratificación Atómica por Lote con Snapshot de Concurrencia
- El endpoint `POST /api/admin/dictionary/nodos/:nivel/:id/ratificar-lote` exige:
  1. Confirmación de lista de verificación (*checklist*) con 4 dimensiones de calidad (ortografía `ɵ`, categorías gramaticales, glosas castellanas y nombres científicos).
  2. Un arreglo `snapshot: [{ id, version }]` que refleja exactamente los estados y versiones auditados por el revisor.
- Si cualquier sentido en la base de datos difiere de la versión enviada en el snapshot, o fue editado por la persona revisora, o existen sentidos activos no contemplados en el snapshot, la transacción completa se revierte con código `409`, informando los códigos específicos en conflicto.

### 4. Política de Purga Irreversible en Papelera
- La eliminación física definitiva (`DELETE` sobre registros en papelera) queda **restringida exclusivamente a `super_admin`**.
- Requiere cumplir concomitantemente:
  - Antigüedad mínima en papelera: `deleted_at <= NOW() - INTERVAL '30 days'`.
  - Ausencia absoluta de dependencias activas (un nodo contenedor no puede purgarse si posee elementos hijos).
  - Confirmación explícita mediante el envío en el cuerpo de la petición del `codigo` exacto del elemento (`confirmCodigo`).
  - Registro atómico en `audit_log` del snapshot completo previo a la eliminación física.

### 5. Parámetros de Publicación y Bandera `PUBLIC_ONLY_RATIFIED`
- Se crea la tabla `system_settings` (`key TEXT PRIMARY KEY, value JSONB, updated_by_id BIGINT, updated_at TIMESTAMPTZ`) para almacenar configuraciones globales editables sin necesidad de redespliegue.
- La bandera `PUBLIC_ONLY_RATIFIED` determina si la API pública expone todos los sentidos (mostrando insignia «En revisión» para borradores) o únicamente los sentidos formalmente ratificados. Su modificación es potestad exclusiva de `super_admin` y queda auditada.

---

## Consecuencias

### Positivas
- **Seguridad Robusta**: El refresh token queda completamente inaccesible a scripts maliciosos de terceros en el navegador, cerrando el vector de ataque XSS.
- **Rigor y Trazabilidad Cultural**: Se garantiza por base de datos la separación de funciones entre quien redacta y quien ratifica el patrimonio léxico Misak.
- **Idempotencia y Protección Concurrente**: El uso de versiones y snapshots previene la sobreescritura accidental o la ratificación de modificaciones no revisadas.
- **Respeto a Despliegues Existentes**: No se alteran los contratos vigentes de endpoints de ingesta o consultas públicas, permitiendo una transición suave y modular en 3 entregas (PRs A, B y C).

### Negativas / Mitigaciones
- **Dependencia Adicional**: Requiere incorporar el plugin `@fastify/cookie` al backend.
  - *Mitigación*: Se fija la versión exacta mediante `pnpm`, verificando licencias y auditoría de vulnerabilidades con `pnpm audit` antes de integrarlo.
- **Manejo de CORS y Preflight**: La cabecera `X-Client: web-admin` induce peticiones preflight `OPTIONS` adicionales en el navegador.
  - *Mitigación*: Fastify maneja de manera ultra-eficiente las respuestas `OPTIONS` y las cabeceras `Access-Control-Max-Age` permiten almacenar en caché la respuesta del preflight en el cliente.
