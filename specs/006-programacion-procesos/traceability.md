# Traceability - Programacion de procesos

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y operan.
> La Fase 2 (UX/UI · prototipo · SPDD) NO aplica. `UX/SPDD` y `Prototipo` van en `-`. La columna
> `Test` va en `-` donde no existe clase de prueba dedicada (pendiente QA). `API` en `-` cuando
> el RF describe comportamiento del motor (scheduler) sin endpoint propio.

## Proposito
Matriz viva RF -> API -> BD -> Codigo -> Test, detalle del rollup global en
`TRACEABILITY_MATRIX.md`. La parsea `sync-memory` para poblar `ai_trace_links`/`ai_gate_runs`.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/process-definitions | process_definition | ProcessCatalogService | - | Implementado | tdd-evidence.md |
| RF-002 | - | - | - | - | process_definition | ProcessSchedulerService | - | Implementado | tdd-evidence.md |
| RF-003 | - | - | - | GET /api/process-schedules | process_definition | ProcessScheduleQueryService | - | Implementado | tdd-evidence.md |
| RF-004 | - | - | - | - | process_definition | ProcessSchedulerService | - | Implementado | tdd-evidence.md |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |

## Decisiones
- La programacion es atributo de `process_definition` (columnas `scheduled`/`schedule_every`/
  `next_run_at`/`last_run_at`, `V2`), no una entidad separada.
- El disparo programado usa `trigger_source = scheduler` en `process_execution` (ADR-002).

## Preguntas abiertas
- Confirmar mapeo RF local `RF-001..RF-004` ↔ requerimientos globales de Fase 1.
- Estrategia de idempotencia del scheduler ante failover (RF-004) y su cobertura de prueba.
