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

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/process-definitions | process_definition | ProcessCatalogService | - | Implementado | tdd-evidence.md | schedules-editor | schedules.store.spec.ts |
| RF-002 | - | - | - | - | process_definition | ProcessSchedulerService | - | Implementado | tdd-evidence.md | - (insumo backend scheduler) | - |
| RF-003 | - | - | - | GET /api/process-schedules | process_definition | ProcessScheduleQueryService | ProcessScheduleQueryServiceTest | Implementado | tdd-evidence.md | schedules-list, schedules-toolbar | schedules.store.spec.ts |
| RF-004 | - | - | - | - | process_definition | ProcessSchedulerService | - | Implementado | tdd-evidence.md | - (backend scheduler) | - |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | approved | Natan Angel Davila Lopez (product owner) | 2026-08-04 | spec-tecnica.md |
| gate-build-ready | approved | Natan Angel Davila Lopez (tech lead) | 2026-08-04 | traceability.md |
| gate-qa-passed | approved | Natan Angel Davila Lopez (qa lead) | 2026-08-04 | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/006-programacion-procesos-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/006-programacion-procesos-runbook.md |

## Decisiones
- La programacion es atributo de `process_definition` (columnas `scheduled`/`schedule_every`/
  `next_run_at`/`last_run_at`, `V2`), no una entidad separada.
- El disparo programado usa `trigger_source = scheduler` en `process_execution` (ADR-002).

## Preguntas abiertas
- Confirmar mapeo RF local `RF-001..RF-004` ↔ requerimientos globales de Fase 1.
- Estrategia de idempotencia del scheduler ante failover (RF-004) y su cobertura de prueba.
