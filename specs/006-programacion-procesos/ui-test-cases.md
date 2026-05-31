# UI Test Cases - Programacion de procesos

> Feature de reingenieria: la UI de programaciones ya existe en `frontend/libs/features/schedules`
> (y la configuracion de la programacion vive en el editor de procesos). Cobertura automatizada
> backend dedicada pendiente de Fase 6.

## Pantallas cubiertas
- Configuracion de programacion en el editor de proceso (`scheduled`/`schedule_every`).
- Tablero de programaciones vigentes (`GET /api/process-schedules`): proximo/ultimo disparo.

## Casos manuales por estado

### Loading / Empty
- [ ] El tablero de schedules muestra carga; estado vacio si no hay procesos programados.

### Success
- [ ] Marcar un proceso como `scheduled` con una frecuencia lo deja programado (RF-001).
- [ ] El tablero lista el proceso con su `next_run_at` (RF-003).
- [ ] Al vencer la frecuencia, el scheduler dispara la ejecucion y actualiza `last_run_at` (RF-002).
- [ ] La ejecucion programada queda trazable con `trigger_source = scheduler`.

### Error / Reglas
- [ ] Un proceso inactivo o no `scheduled` NO es disparado por el scheduler.
- [ ] Reinicio del servicio no genera disparos duplicados (RF-004).

### Permission denied
- [ ] Rol sin permiso no configura programacion; `auditor` solo consulta el tablero.

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin | programa un proceso | exito |
| operator | consulta/observa programaciones | lectura |
| auditor | consulta programaciones | solo lectura |

## Cobertura automatizada
Trace: `RF-001`..`RF-004`
- Backend: sin clase de prueba dedicada a la fecha (cobertura pendiente de Fase 6).
- e2e de UI: pendiente de Fase 6.
