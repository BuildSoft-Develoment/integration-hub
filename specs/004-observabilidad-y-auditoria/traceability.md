# Traceability - Observabilidad y auditoria

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

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | GET /api/query/process-executions | process_execution | ExecutionQueryResource | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md |
| RF-002 | - | - | - | GET /api/query/process-executions/{processExecutionId}/tasks | process_task_execution | ExecutionQueryService | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md |
| RF-003 | - | - | - | GET /api/query/process-executions/{processExecutionId}/children | process_execution | ExecutionQueryService | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md |
| RF-004 | - | - | - | GET /api/query/overview-summary | process_execution | ExecutionQueryResource | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md |
| RF-005 | - | - | - | GET /api/query/audit-events | audit_event | AuditService | StreamingPipelineServiceTest | Implementado | tdd-evidence.md |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |

## Decisiones
- Correlacion de auditoria, trazas y ejecucion por `processExecutionId` (ADR-002).

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- GREEN del IT `CatalogAndExecutionResourceIT` pendiente de corrida dedicada (ver tdd-evidence.md).
