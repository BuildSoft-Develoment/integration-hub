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
| RF-006 | - | - | - | POST /api/process-definitions | process_task_definition.configuration_json (`taskRef`) | ProcessTaskRuntimeService | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-runtime-panel | - |
| RF-007 | - | - | - | POST /api/process-definitions | configuration_json (`input`/`sourceOutput`) | TaskInputResolver | TaskInputResolverTest | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-binding-board | - |
| RF-008 | - | - | - | POST /api/process-definitions | metadata runtime (transversal) | TaskOutputSupport (mergeMetadata) | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-binding-context.service | - |
| RF-009 | - | - | - | POST /api/process-definitions | configuration_json (`executionMode`) | ProcessTaskRuntimeService | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-runtime-panel | - |
| RF-010 | - | - | - | POST /api/process-definitions | configuration_json (`batchSize`/checkpoint) | TaskOutputRegistry | TaskOutputRegistryTest | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-runtime-panel | - |
| RF-011 | - | - | - | POST /api/process-definitions | configuration_json (`inputs` fan-in) | TaskInputResolver | TaskInputResolverTest | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-flow-* | - |
| RF-012 | - | - | - | POST /api/process-definitions | configuration_json (mapping comun) | TaskInputResolver | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-binding-board | - |
| RF-013 | - | - | - | POST /api/process-definitions | outputs materializados / cursor | StreamingPipelineService | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | - | - |

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
- Motor dinamico de inputs/outputs tipados, `executionMode`, fan-in/out y batch para alto
  volumen (RF-006..RF-013, WIP); ver
  [ADR-004](../../docs/fase-3-arquitectura/adr/ADR-004-motor-input-output-tareas.md).
- Unificar la peticion HTTP de `REST_CALL` y el canal `webhook` de `NOTIFICATION` en una pieza
  compartida (front `process-http-request` + back `HttpRequestSupport`), conservando epilogos
  distintos: REST mapea respuesta a output; webhook audita y valida 2xx. Ver
  [ADR-005](../../docs/fase-3-arquitectura/adr/ADR-005-unificacion-peticion-http.md) (Propuesto).

## Hallazgos del motor (revisión spec 003) — estado

Cerrados en código (motor RF-006..013, ADR-004):
- P1.1 identidad de binding (valor compuesto `kind::key`, sin colisión entre grupos).
- P1.2 SP/FN persisten `sourceTaskRef`/`sourceOutput` para outputs agregados (summary/table/errors/out).
- P1.3 `table` lee de la conexión del **productor** (`<ref>.table.connectionRef`), no del consumidor.
- P1.4 paginación **keyset por `orderBy`** (estable, sin saltos/duplicados) + límite por dialecto
  (LIMIT vs FETCH FIRST); `orderBy` obligatorio para lectura `table` en lote.
- P2.1 lote de lectura/proceso (`input.batchSize`/`batchSize`) separado del lote JDBC (`jdbcBatchSize`).
- P2.2 el `summary` del fast path FILE_READ→DB_WRITE incluye `sourceFileName`/`...` igual que el camino normal.

Cobertura: IT con Testcontainers (Postgres) `MotorTableInputIT` valida los escenarios de BD —
paginación keyset estable (todas las filas una vez, en orden), modo per-record, `orderBy`
obligatorio y routing de conexión del productor para `table` (P1.3/P1.4). 4/4 verdes.
`CatalogAndExecutionResourceIT` (e2e create+execute) migrado al contrato/async del motor. Los `*IT`
se ejecutan vía `npm run check:it` (failsafe, requiere Docker) y en CI con `mvn verify` (job
`backend`) — ya no quedan fuera de la red de seguridad como antes (surefire excluye `*IT`).

Pendientes/notas: `orderBy` de keyset debe ser clave única/ordenable (PK) para no omitir valores
repetidos; el summary del fast path puebla source* solo para un único archivo; faltan unit
tests frontend de claves duplicadas (binding-board) y fan-in, e IT de fast path multi-archivo.
(Conocido, fuera de alcance: `FileReadTaskFastPathTest$BatchTaskProviderRegistry` declara un
segundo bean `TaskProviderRegistry` que vuelve ambigua la inyección al arrancar la app completa
con `@QuarkusTest`; debería ser `@Alternative`/`@Mock`.)

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- GREEN del IT `CatalogAndExecutionResourceIT` pendiente de corrida dedicada (ver tdd-evidence.md).
