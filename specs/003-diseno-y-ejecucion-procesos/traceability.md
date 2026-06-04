# Traceability - Diseno y ejecucion de procesos

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y
> operan en produccion. La Fase 2 (UX/UI · prototipo · SPDD) NO aplica (ver
> `CONSTITUTION.md`, Principio 4 — excepcion). Las columnas `UX/SPDD` y `Prototipo` van en
> `-` por esa razon. El resto de la trazabilidad RF→API→BD→Codigo→Test es real.

## Proposito
Matriz viva que conecta cada requerimiento con su API, datos, codigo, prueba, estado y
evidencia. Es la fuente que `node scripts/ai-framework-agent.mjs sync-memory` parsea para
poblar `ai_trace_links`, `ai_gate_runs` y `ai_evidence_items`. Es el detalle por feature
del rollup global en `TRACEABILITY_MATRIX.md`.

## Flujo (reingenieria)
```text
Codigo existente -> SDD (spec-tecnica) -> Trazabilidad -> QA (evidencia GREEN real)
```

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/process-definitions | process_definition | ProcessDefinitionResource | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md | process-editor + process-flow-* + process-task-list/modal | process-editor.store.spec.ts |
| RF-002 | - | - | - | POST /api/process-definitions | process_task_definition | DbWriteTaskProvider | DbWriteTaskProviderTest | Implementado | tdd-evidence.md | process-task-form/* (6 tipos) + tasks/*.provider.ts | process-flow-sync.service.spec.ts |
| RF-003 | - | - | - | POST /api/process-definitions/{processDefinitionId}/activation/{active} | process_definition | ProcessSchedulerService | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md | process-toolbar, process-list | process-catalog.store.spec.ts |
| RF-004 | - | - | - | POST /api/process-definitions | process_execution | StreamingPipelineService | StreamingPipelineServiceTest | Implementado | tdd-evidence.md | process-editor-actions (trigger) | process-flow-api.service.spec.ts |
| RF-005 | - | - | - | GET /api/query/process-executions | process_execution | ProcessExecutionService | FileReadTaskFastPathTest | Implementado | tdd-evidence.md | - (insumo Observabilidad 004) | - |

## Trazabilidad UI por tipo de tarea (RF-002)

Cada tarea de un proceso tiene `configuration_json` dinamico segun `task_type`; el contrato lo
definen los providers `frontend/libs/core/providers/.../tasks/*.provider.ts` (`toTaskPatch(draft)`
arma el JSON; `hydrateDraft` el inverso). La UI por tipo vive en `process-task-form/`:

| Tipo de tarea | Form (frontend) | Provider (contrato) |
|---|---|---|
| FILE_READ | `process-file-read-task-form` | `FileReadTaskProvider` |
| DB_WRITE | `process-db-write-task-form` (+ mapping-board) | `DbWriteTaskProvider` |
| DB_EXECUTE_SP | `process-db-execute-sp-task-form` | `DbExecuteStoredProcedureTaskProvider` |
| DB_EXECUTE_FN | `process-db-execute-fn-task-form` | `DbExecuteFunctionTaskProvider` |
| REST_CALL | `process-rest-call-task-form` (+ path-builder) | `RestCallTaskProvider` |
| NOTIFICATION | `process-notification-task-form` | `NotificationTaskProvider` |

> Los forms por tipo NO tienen `.spec.ts` dedicado (hueco conocido): se ejercitan via el editor
> y los stores. El contrato detallado esta en `spec-tecnica.md`.

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/003-diseno-y-ejecucion-procesos-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/003-diseno-y-ejecucion-procesos-runbook.md |

## Decisiones
- Motor providers + registries para tipos de tarea (DbWrite, StoredProcedure, etc.) (ADR-001).
- Correlacion operativa por `processExecutionId` (ADR-002).
- Unificar la peticion HTTP de `REST_CALL` y el canal `webhook` de `NOTIFICATION` en una pieza
  compartida (front `process-http-request` + back `HttpRequestSupport`), conservando epilogos
  distintos: REST mapea respuesta a output; webhook audita y valida 2xx. Ver
  [ADR-005](../../docs/fase-3-arquitectura/adr/ADR-005-unificacion-peticion-http.md) (Propuesto).

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- GREEN del IT `CatalogAndExecutionResourceIT` pendiente de corrida dedicada (ver tdd-evidence.md).
