# Spec tecnica - Programacion de procesos

## Componentes relacionados

### Backend (`platform-app`)
- API: `ProcessScheduleResource` (`/api/process-schedules`, lectura de programaciones).
- Servicios: `ProcessSchedulerService` (motor de disparo), `ProcessScheduleQueryService` (consulta).
- Configuracion de la programacion: se establece al crear/editar el proceso via
  `ProcessDefinitionResource` (`/api/process-definitions`) — la programacion es atributo del proceso.
- Persistencia (Panache): `ProcessDefinitionRepository`, `ProcessExecutionRepository`.

### Frontend (`frontend/libs/features/schedules`, Angular/Nx)
- API: `schedules-api.service.ts`.
- Estado: `schedules.store.ts`.
- Componentes: `schedules-list` (tablero de procesos programados y su proximo/ultimo disparo).

## Modelo de datos

La programacion NO es una entidad separada: vive como columnas de `process_definition`
(tabla base documentada en `specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md`), agregadas
por Flyway `V2__process_schedule.sql`.

Tabla `process_definition` (columnas de programacion, `V2`):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK (definida en `V1`) |
| `scheduled` | boolean | default false; indica si el proceso esta programado |
| `schedule_every` | varchar(40) | frecuencia/cadencia de disparo |
| `next_run_at` | timestamp | proximo disparo calculado (nullable) |
| `last_run_at` | timestamp | ultimo disparo efectuado (nullable) |

Indices: PK en `id` (las columnas de programacion no agregan indices propios).

El disparo programado genera un `process_execution` con `trigger_source = scheduler`
(ver `V7__process_execution_retry_lineage.sql`), con la misma evidencia que la ejecucion manual.

## Consideraciones tecnicas

- solo procesos `active` y `scheduled` son candidatos al disparo
- el scheduler debe ser idempotente ante reinicio/failover (no duplicar ejecuciones)
- `next_run_at`/`last_run_at` deben mantenerse consistentes con cada ciclo
- el origen del disparo se distingue por `trigger_source` (manual vs scheduler)

## Endpoints (resumen; detalle en `api-contract.md`)

- `GET /api/process-schedules` (lista de programaciones vigentes).
- Configuracion de `scheduled`/`schedule_every`: via `POST`/`PUT /api/process-definitions` (feature 003).

## Pruebas tecnicas sugeridas

- disparo programado al vencer la frecuencia
- no duplicacion ante reinicio del servicio
- consistencia de `next_run_at`/`last_run_at`
- consulta de programaciones vigentes
