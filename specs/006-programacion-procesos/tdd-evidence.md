# Evidencia TDD - Programacion de procesos

Feature reconstruida por reingenieria sobre codigo en produccion. El **GREEN de la capa de
consulta esta capturado y es real** (corrida `mvn` del 2026-06-03). El **RED no es
recapturable** (codigo preexistente; capturar un fallo previo romperia codigo funcional,
fuera del alcance acordado). Por eso el ciclo formal RED-GREEN se mantiene `pending` a
nivel de tarea en `spec-tareas.md`.

> Corrida de referencia: `mvn -pl platform-app -Dtest=ProcessScheduleQueryServiceTest,...`
> (JDK 25, 2026-06-03) -> **Tests run: 13, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS**
> para las clases de prueba de las features 005/006/007.
>
> Nota sobre el scheduler (RF-001 / RF-002 / RF-004): la programacion es un atributo de
> `process_definition` (columnas `scheduled`/`schedule_every`/`next_run_at`/`last_run_at`, V2)
> y el disparo lo ejecuta `ProcessSchedulerService` (timer Quarkus con `trigger_source =
> scheduler`). `ProcessCatalogService` (persistencia de la programacion) y `ProcessSchedulerService`
> (motor de disparo) NO tienen clase de prueba unitaria dedicada; su comportamiento temporal y
> de idempotencia ante failover queda pendiente de una corrida QA dedicada.

## RF-001 / T-001
- Comando RED: `mvn -pl platform-app test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app test`
- Resultado GREEN: Pendiente — `ProcessCatalogService` (persistencia de la programacion) no tiene prueba unitaria dedicada. GREEN dedicado pendiente de corrida QA.
- Verificado por: pending (requiere corrida QA dedicada).

## RF-002 / T-002
- Comando RED: `mvn -pl platform-app test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app test`
- Resultado GREEN: Pendiente — `ProcessSchedulerService` (motor de disparo programado) no tiene prueba unitaria dedicada del comportamiento temporal. GREEN dedicado pendiente de corrida QA.
- Verificado por: pending (requiere corrida QA dedicada).

## RF-003 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=ProcessScheduleQueryServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=ProcessScheduleQueryServiceTest test`
- Resultado GREEN: GREEN real — ProcessScheduleQueryServiceTest: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).

## RF-004 / T-004
- Comando RED: `mvn -pl platform-app test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app test`
- Resultado GREEN: Pendiente — la idempotencia del scheduler ante failover (RF-004) la cubre `ProcessSchedulerService`, sin prueba unitaria dedicada. GREEN dedicado pendiente de corrida QA.
- Verificado por: pending (requiere corrida QA dedicada).

## RF-003 / T-005

Frontend (Angular): UI de programacion de procesos. `schedules-list` + `schedules-toolbar`
muestran las programaciones (GET /api/process-schedules) y `schedules-editor` edita la
configuracion de la programacion (atributo de `process_definition`).

- Comando RED: `npx nx test schedules`
- Resultado RED: No recapturable por reingenieria (UI preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `npx nx test schedules`
- Resultado GREEN: GREEN preexistente — specs Angular de la feature pasan (`schedules.store.spec.ts`).
- Verificado por: corrida nx (pendiente validacion humana).
- Hueco conocido: `schedules-editor`/`schedules-list`/`schedules-toolbar` se ejercitan via el store
  (`schedules.store.spec.ts`); cobertura por componente es candidata a ampliacion (plan de tests frontend).
