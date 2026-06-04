# Traceability - Motor dinamico de inputs/outputs de tareas

[README principal](../../README.md) | [Specs](../README.md)

## Proposito

Trazar la evolucion del motor de procesos para inputs/outputs tipados, modos de
ejecucion y alto volumen.

## Matriz inicial

| RF | API | BD | Backend | Frontend | QA | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-001 | POST/PUT `/api/process-definitions` | `process_task_definition.configuration_json` | ProcessCatalogService / validadores | Process editor | contrato | Pendiente |
| RF-002 | POST/PUT `/api/process-definitions` | outputs por definir | TaskInputResolver | selector de output | fan-out/fan-in | Pendiente |
| RF-003 | POST/PUT `/api/process-definitions` | metadata runtime | TaskContext / metadata resolver | binding palette | metadata | Pendiente |
| RF-004 | POST/PUT `/api/process-definitions` | task execution | ProcessExecutionService | selector executionMode | modos | Pendiente |
| RF-005 | POST/PUT `/api/process-definitions` | checkpoints por lote | TaskBatchCheckpointService | batch/retry form | retry/idempotencia | Pendiente |
| RF-006 | POST/PUT `/api/process-definitions` | flow layout | graph validator | flow designer | grafo | Pendiente |
| RF-007 | POST/PUT `/api/process-definitions` | configuration_json | mapping services | mapping board comun | mapping | Pendiente |
| RF-008 | ejecucion | staging/output tables | batch cursor | - | 1M+ registros | Pendiente |

## Gates

| Gate | Estado | Aprobador | Fecha | Evidencia |
| --- | --- | --- | --- | --- |
| gate-adr-approved | pending | - | - | ADR-004 |
| gate-contract-frozen | pending | - | - | spec-tecnica.md |
| gate-build-ready | pending | - | - | spec-tareas.md |
| gate-qa-passed | pending | - | - | QA pendiente |

