# Análisis — unificar el disparo de ejecución de proceso en un data-access de core (#5)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Naturaleza: deuda de diseño frontend (DRY/DIP); **no** money-path, **no** correctitud. Continúa el
[análisis consolidado 3-4-5](2026-07-05-analisis-pendientes-3-4-5.md#5--unificar-el-disparo-de-ejecución-de-proceso).

## Estado real (verificado)

**Un** endpoint backend, **tres** representaciones frontend de la misma operación:

- Backend: `POST /api/process-executions/{id}` (`ProcessExecutionResource`), body **opcional** `ProcessExecutionRequest`
  (`executionVariables`, `selectedFiles`, `sourceExecutionId`), respuesta `ProcessExecutionStartResponse`
  (`id, status, startedAt, finishedAt, sourceExecutionId, triggerSource, details`).
- Frontend:
  1. `features/processes` `ProcessApiService.execute(id)` → post `{}` → tipo `ProcessExecutionStartResponse` (**wide**).
     Consumidor único: `process-catalog-command` (lee `.id`, `.status`).
  2. `features/executions` `ExecutionApiService.execute(id, request)` → post `request` → tipo
     `ExecuteProcessResponse = { id }` (**subset**). Consumidor único: `execution-catalog-command` (lee `result.id`).
  3. `features/schedules` `SchedulesApiService.execute(id)` → `http.post('/api/process-executions/'+id, {})` **inline**
     (raw, tras eliminar el grandfather) → `unknown` (no lee nada).

**Blast radius verificado (mínimo):**
- Los **3 DTOs no tienen importadores externos**: `grep` de `ProcessExecutionStartResponse`, `ExecuteProcessRequest`,
  `ExecuteProcessResponse` fuera de sus propios archivos → **vacío**. Son locales a cada api service.
- Solo **2 consumidores** de los métodos `execute` (los dos `*-catalog-command`) + `schedules`.

Es decir: una única operación de data-access, con **el string del endpoint en 3 lugares** y **2 tipos de respuesta**
(wide + subset) del mismo payload. Duplicación real, aunque modesta.

## Diseño propuesto (bounded, SOLID)

**Un** data-access compartido en la capa baja (core), del que dependen las 3 features (DIP; ninguna feature depende de
otra):

1. **`ProcessExecutionApiService` en `libs/core/services/src/lib/execution/`** (`@Injectable providedIn:'root'`):
   `execute(processDefinitionId: number, request?: ExecuteProcessRequest): Observable<ProcessExecutionStartResponse>`
   → `http.post('/api/process-executions/'+id, request ?? {})`. El `request` **opcional** modela fielmente el body
   opcional del único endpoint (cubre el caso `{}` de processes/schedules y el `{selectedFiles, sourceExecutionId}` de
   executions). Exportar desde el barrel `@integration-hub/core/services`.
2. **Mover a core los DTOs** `ExecuteProcessRequest` y `ProcessExecutionStartResponse` (ambos **primitivos**, sin
   arrastrar modelos de dominio — verificado). Eliminar `ExecuteProcessResponse = {id}` (subset): se reemplaza por el
   wide (superset seguro; `execution-catalog-command` solo lee `.id`, presente en el wide).
3. **Reapuntar los 3 consumidores** al servicio de core (sin shells de delegación → sin indirección muerta, SRP):
   - `process-catalog-command` inyecta el core service; se **elimina** `execute` de `ProcessApiService` (su único
     consumidor migra; los demás métodos de `ProcessApiService` se quedan).
   - `execution-catalog-command` inyecta el core service; se **elimina** `execute` de `ExecutionApiService`.
   - `schedules-api` inyecta el core service en vez del `http.post` inline.

### SOLID
- **DIP**: "disparar ejecución de proceso" pasa a ser una operación de la capa estable (core), consumida por las
  features; se elimina que cada feature conozca el endpoint por su cuenta.
- **SRP**: los api services de feature dejan de ser dueños accidentales de una operación transversal.
- **DRY**: 1 endpoint, 1 request type, 1 response type (hoy: endpoint ×3, response ×2).
- **No legacy**: sin shells de delegación; los consumidores usan directamente el core (no rutas indirectas).

### Lo que NO cambia
- Backend: **nada** (ya está unificado). Es puramente frontend.
- `ProcessApiService`/`ExecutionApiService` conservan sus **demás** métodos (list*, etc.); solo pierden `execute`.

## Validación / pruebas (plan)

- **`lint:boundaries`** verde: las features importan el core service (feature→core permitido); sin nuevas aristas
  feature→feature.
- **Unit (vitest + HttpTestingController)**: nuevo `ProcessExecutionApiService.spec` — `execute(id)` → `POST .../{id}`
  body `{}`; `execute(id, {selectedFiles:['a'], sourceExecutionId:7})` → body con esos campos. Reusa el patrón del
  repo. Actualizar/mantener los specs de los dos `*-catalog-command` (que mockean el api).
- **`nx build web`** + **`nx test web`** (cubre libs): confirmar que los 3 consumidores compilan y pasan con el wide
  type y el nuevo servicio.
- Nota: cambio 100% frontend, sin runtime backend → la validación es lint:boundaries + unit + build, no el stack.

## Veredicto

**Viable, bounded y de bajo riesgo** — el blast radius es mínimo (3 api services + 2 consumidores + schedules; DTOs sin
importadores externos), y el backend ya está unificado. **Valor modesto** (DRY/DIP: un único contrato de "ejecutar
proceso"), **no urgente** (el guard de fronteras ya está limpio; no es correctitud ni money-path). Recomiendo
**proceder** si se quiere cerrar la duplicación con una consolidación limpia; es de las mejoras más baratas que quedan.
