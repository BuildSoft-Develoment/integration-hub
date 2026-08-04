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

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | GET /api/query/process-executions | process_execution | ExecutionQueryResource | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md | execution-list, execution-toolbar, audit-list, audit-toolbar | execution-catalog.store.spec.ts |
| RF-002 | - | - | - | GET /api/query/process-executions/{processExecutionId}/tasks | process_task_execution | ExecutionQueryService | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md | execution-editor + execution-task-list + execution-files-panel | execution-detail.store.spec.ts |
| RF-003 | - | - | - | GET /api/query/process-executions/{processExecutionId}/children | process_execution | ExecutionQueryService | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md | execution-lineage | execution-editor.store.spec.ts |
| RF-004 | - | - | - | GET /api/query/overview-summary | process_execution | ExecutionQueryResource | CatalogAndExecutionResourceIT | Implementado | tdd-evidence.md | overview-metric-card + overview-table-card | overview.store.spec.ts |
| RF-005 | - | - | - | GET /api/query/audit-events | audit_event | AuditService | StreamingPipelineServiceTest | Implementado | tdd-evidence.md | execution-editor-summary, audit-editor | audit.store.spec.ts |
| RF-006 | - | - | - | MQ audit-events | audit_spool | OutboxRelay | KafkaPublishIT | Implementado | tdd-evidence.md | audit-list | audit.store.spec.ts |
| RF-007 | - | - | - | GET /api/query/record-lineage | audit_record_event | RecordLineageResource | PostgresColdStoreTest | Implementado | tdd-evidence.md | record-lineage | audit-api.service.ts |
| RF-008 | - | - | - | GET/POST/DELETE /api/query/audit-spool/* | audit_spool | AuditSpoolResource | - | Implementado | tdd-evidence.md | audit-spool | web build |
| RF-009 | - | - | - | GET /api/query/mt101-fragments/source-row | mt101_build_fragment | Mt101FragmentLookupResource | - | Implementado | tdd-evidence.md | mt101-fragment-lookup | web build |
| RF-010 | - | - | - | - | - | audit-operation-risk | audit-operation-risk.spec.ts | Implementado | qa/fase-6-qa/evidencias/frontend-visual-a11y-git-2026-06-26.md | audit, record-lineage, mt101-fragments, audit-spool, mt101-quarantine | nx test web |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | approved | Natan Angel Davila Lopez (product owner) | 2026-08-04 | spec-tecnica.md |
| gate-build-ready | approved | Natan Angel Davila Lopez (tech lead) | 2026-08-04 | traceability.md |
| gate-qa-passed | approved | Natan Angel Davila Lopez (qa lead) | 2026-08-04 | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/004-observabilidad-y-auditoria-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/004-observabilidad-y-auditoria-runbook.md |

## Decisiones
- Correlacion de auditoria, trazas y ejecucion por `processExecutionId` (ADR-002).
- Auditoria asincrona multi-broker y lineage por registro (ADR-010).

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- GREEN del IT `CatalogAndExecutionResourceIT` pendiente de corrida dedicada (ver tdd-evidence.md).
