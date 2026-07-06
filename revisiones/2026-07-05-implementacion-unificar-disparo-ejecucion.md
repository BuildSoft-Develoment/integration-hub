# Implementación — disparo de ejecución unificado en core (#5 variante A, SOLID)

Fecha: 2026-07-05
Alcance: implementa la **variante (A) directa** del
[análisis (con doble-check)](2026-07-05-analisis-unificar-disparo-ejecucion.md). Consolida las **tres** representaciones
frontend del disparo de ejecución (`POST /api/process-executions/{id}`) en **un** data-access de `core/services`.
Frontend/deuda de diseño; cero runtime backend, cero money-path.

## Cambios (SOLID)

- **`ProcessExecutionApiService` en `libs/core/services/src/lib/execution/`** (NUEVO, `@Injectable providedIn:'root'`):
  `execute(id, request?: ExecuteProcessRequest): Observable<ProcessExecutionStartResponse>` → el `POST` con `request ?? {}`.
  El `request` **opcional** modela el body opcional del único endpoint (cubre disparo simple y retry con parámetros).
  Los DTOs `ExecuteProcessRequest` y `ProcessExecutionStartResponse` (primitivos) se **mueven** aquí. Exportado en el
  barrel de core.
- **`ProcessApiService`** (processes): se **elimina** `execute` + la interfaz `ProcessExecutionStartResponse` (conserva
  sus demás métodos: list/create/update/setActive/listSources...).
- **`ExecutionApiService`** (executions): se **elimina** `execute` + `ExecuteProcessRequest`/`ExecuteProcessResponse`
  (conserva list/get/listTasks/progress/listChildren).
- **Consumidores** reapuntados al core service (sin shells de delegación → sin indirección muerta):
  - `process-catalog-command`: **añade** `ProcessExecutionApiService` (mantiene `ProcessApiService` para el CRUD de
    definiciones).
  - `execution-catalog-command`: **reemplaza** `ExecutionApiService` por `ProcessExecutionApiService` (solo lo usaba
    para execute).
  - `schedules-api`: usa el core service en vez del `POST` inline (que había quedado del ciclo del grandfather).

### SOLID
- **DIP**: "disparar ejecución de proceso" es ahora una operación de la capa estable (core) de la que dependen las 3
  features; ninguna feature depende de otra ni conoce el endpoint por su cuenta.
- **SRP**: los api services de feature dejan de ser dueños accidentales de una operación transversal; cada uno conserva
  solo su superficie propia.
- **DRY**: 1 endpoint (antes ×3), 1 request type, 1 response type (antes 2 tipos del mismo payload).
- **No legacy**: consumidores usan el core directamente; sin fachadas de delegación.

## Pruebas (evidenciadas)

- **`lint:boundaries`** → verde (exit 0): las features importan `@integration-hub/core/services` (feature→core
  permitido); **sin nuevas aristas feature→feature**.
- **`nx build web`** → **Successfully** (bundle ~10 s): los 3 consumidores compilan con el tipo wide y el core service.
- **`nx test web`** (cubre libs) → **100 archivos, 491 tests, 0 fallos** (antes 99/489: +1 archivo, +2 tests):
  - **NUEVO `process-execution-api.service.spec`** (HttpTestingController): `execute(id)` → `POST .../{id}` body `{}`;
    `execute(id, {selectedFiles, sourceExecutionId})` → body con esos campos.
  - **3 specs reestructurados** (el mock de `execute` se movió a un provider de `ProcessExecutionApiService`):
    `process-catalog.store.spec`, `execution-catalog-command.service.spec`, `execution-catalog.store.spec` — verdes.
- **Sin referencias colgantes**: grep confirma que `ExecuteProcess*`/`ProcessExecutionStartResponse` solo viven en el
  core service, y que **ninguna** llamada `.execute()` queda sobre los api services de feature (los matches `db-execute`
  son task-forms que usan `listConnection*`, no execution).

### Nota de arranque
Cambio 100% frontend (mover un método + DTOs a core, reapuntar 3 consumidores); cero runtime backend. La validación real
es lint:boundaries + build + unit suite, no el stack.

## Conclusión

El disparo de ejecución queda **unificado**: un único data-access en core del que dependen processes, executions y
schedules (DIP), sin duplicar el endpoint ni el tipo de respuesta, y sin fachadas de indirección. Cierra la deuda DRY que
el análisis identificó. Validado con guard verde + build + 491 tests (incluido el nuevo spec y los 3 reestructurados).
