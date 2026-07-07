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

## Doble-check — correcciones (self-review)

Reté el análisis contra el código. **No hay bug de correctitud**, pero encontré que **subestimé el churn** (lo que
mueve la recomendación de "casi gratis" a "barato-pero-no-trivial"):

### Confirmado
- DTOs **100% primitivos** (`ExecuteProcessRequest`, `ExecuteProcessResponse={id}`, `ProcessExecutionStartResponse`
  wide) → movibles a core sin arrastrar dominio. **Sin importadores externos** (grep vacío).
- Solo **2 consumidores** llaman `.execute()` (los dos `*-catalog-command`); `process-catalog-command` lee `.id/.status`
  y `execution-catalog-command` lee `.id` → ambos presentes en el tipo wide.
- No existe servicio en core que ya toque `/api/process-executions` → un nuevo servicio es el hogar correcto.

### Correcciones (churn subestimado)
1. **Los api services siguen muy usados por OTROS métodos** — `ExecutionApiService` lo inyectan 4 consumidores (query
   store, detail loader, detail store, command) y `ProcessApiService` 5 (query store, 3 task-forms, reference store).
   Solo pierden `execute`; **no** desaparecen. La cirugía debe ser quirúrgica (quitar 1 método), no mover el servicio.
2. **`process-catalog-command` usa `ProcessApiService` para create/update/setActive Y execute** — al migrar `execute` a
   core, ese consumidor necesita **una segunda inyección** (`ProcessExecutionApiService` para execute + `ProcessApiService`
   para el CRUD). Es defendible (separación de concerns: CRUD de definición = feature; disparar ejecución =
   transversal), pero es más cambio que "swap de un import".
3. **3 specs mockean `execute`** dentro del mock del api service (`process-catalog.store.spec`,
   `execution-catalog-command.service.spec`, `execution-catalog.store.spec`) → hay que **separar** ese mock a un provider
   del nuevo core service. Más churn de test del que decía el plan.

### Trade-off que emerge (decisión real)
Dado que el valor es **modesto** y el churn es **moderado**, hay dos formas de implementarlo:
- **(A) Extracción directa** (mi propuesta original): consumidores usan el core service; se elimina `execute` de los api
  services. Layering más limpio, pero +1 inyección en 2 consumidores y reestructurar 3 specs.
- **(B) Delegación fina**: los api services conservan `execute` pero **delegan** en el core service (un solo `POST` en
  core). Consumidores y specs **no cambian**; se elimina la duplicación del endpoint. Costo: una fachada de indirección
  en cada api service (lo que el objetivo "no shells" quería evitar).

## Veredicto (revisado)

**Viable y bounded, sin riesgo de correctitud**, pero **no es el casi-gratis** que sugerí: el `execute` está entrelazado
con CRUD hermano en los mismos consumidores y mocks, así que la extracción directa (A) toca 2 api services + 2
consumidores (con doble inyección) + **3 specs**. El **valor es modesto** (DRY: endpoint 3→1, response 2→1; DIP) y **no
urgente** (guard limpio, no money-path).

Recomendación afinada: **hacerlo solo si se quiere cerrar la deuda DRY explícitamente**, y en ese caso preferir la
variante **(A) directa** por layering limpio (asumiendo el churn de specs) — la delegación (B) minimiza churn pero
introduce la indirección que justamente queremos evitar. Si el foco es valor/esfuerzo, es **legítimo diferirlo**: es la
mejora de menor impacto de las que quedan.
