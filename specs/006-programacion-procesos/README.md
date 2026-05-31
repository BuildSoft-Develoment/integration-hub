# Programacion de procesos

Feature 006-programacion-procesos. Reconstruida por reingenieria (`origin: reingenieria`):
documenta codigo ya construido y operativo. La Fase 2 (prototipo/SPDD) NO aplica.

## Documentos canonicos
- [spec-funcional.md](spec-funcional.md) — origen, objetivo, requerimientos
- [spec-tecnica.md](spec-tecnica.md) — modelo de datos y dependencias (back + front)
- [traceability.md](traceability.md) — matriz RF → API → BD → codigo → test
- [api-contract.md](api-contract.md) — endpoints y contratos
- [spec-tareas.md](spec-tareas.md) — tareas ejecutables
- [tdd-evidence.md](tdd-evidence.md) — evidencia TDD
- [ui-test-cases.md](ui-test-cases.md) — casos de prueba UI

## Estado
Reingenieria documentada sobre `platform-app` (`ProcessSchedulerService`, `ProcessScheduleResource`,
`ProcessScheduleQueryService`; columnas de schedule en `process_definition`, `V2`) y
`frontend/libs/features/schedules`. Pendiente: captura formal RED-GREEN y cobertura de pruebas.
