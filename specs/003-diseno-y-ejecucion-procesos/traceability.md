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
| RF-006 | - | - | - | POST /api/process-definitions | process_task_definition | ProcessTaskRuntimeService | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-runtime-panel | - |
| RF-007 | - | - | - | POST /api/process-definitions | process_task_definition | TaskInputResolver | TaskInputResolverTest | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-binding-board | - |
| RF-008 | - | - | - | POST /api/process-definitions | - | TaskOutputSupport | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-binding-context.service | - |
| RF-009 | - | - | - | POST /api/process-definitions | process_task_definition | ProcessTaskRuntimeService | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-runtime-panel | - |
| RF-010 | - | - | - | POST /api/process-definitions | process_task_definition | TaskOutputRegistry | TaskOutputRegistryTest | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-runtime-panel | - |
| RF-011 | - | - | - | POST /api/process-definitions | process_task_definition | TaskInputResolver | TaskInputResolverTest | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-flow-* | - |
| RF-012 | - | - | - | POST /api/process-definitions | process_task_definition | TaskInputResolver | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | process-task-binding-board | - |
| RF-013 | - | - | - | POST /api/process-definitions | - | StreamingPipelineService | - | En progreso (WIP, ADR-004) | spec-tecnica.md (motor) | - | - |

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
- P1.2 SP/FN califican a `task.<output>.<campo>` **solo** los outputs AGREGADOS (`summary`/`out`),
  que existen como clave calificada y evitan colisión en fan-in; los flujos **por registro**
  (`records`/`table`/`errors`) resuelven por **clave plana** desde el registro actual. (Corrige una
  sobre-calificación previa que también marcaba `table`/`errors`: esas claves no existen calificadas
  y la resolución es por registro.)
- P1.3 `table` lee de la conexión del **productor** (`<ref>.table.connectionRef`), no del consumidor.
- P1.4 paginación **keyset por `orderBy`** (estable, sin saltos/duplicados) + límite por **dialecto**:
  `LIMIT` (postgresql/mysql/mariadb/h2), `FETCH FIRST … ROWS ONLY` (Oracle 12c+) y
  `OFFSET 0 ROWS FETCH NEXT … ROWS ONLY` (SQL Server — `FETCH FIRST` suelto es inválido en T-SQL).
  `orderBy` obligatorio para lectura `table` en lote.
- P2.1 lote de lectura/proceso (`input.batchSize`/`batchSize`) separado del lote JDBC (`jdbcBatchSize`).
- P2.2 el `summary` del fast path FILE_READ→DB_WRITE incluye `sourceFileName`/`...` igual que el camino normal.
- P1.b DB_WRITE soporta columnas desde outputs **agregados/transversales** (no solo campos del
  registro): el front persiste la **clave de resolución** en `columnMappings` —calificada
  `taskRef.output.campo` para summary/out/table, plana para metadata/variable/registro— y el
  **origen** en `columnSources` (kind/key/taskRef/output) para el round-trip de la UI. El backend
  ya las resuelve sin cambios: `enrichRecordsWithRuntime` fusiona metadata (`_processExecutionId`,
  `_sourceFileName`, …) + `taskOutputs` (calificados + planos) en cada registro antes de mapear.
- P1.c REST_CALL y NOTIFICATION insertan tokens **calificados** `{taskRef.output.campo}` para
  outputs agregados (summary/table/out) — vía `ProcessTaskBindingContextService.tokenForOption` —
  desambiguando fan-in; records/variable/metadata siguen planos (resuelven del registro/metadata).
  El backend (`RestTaskSupport.template`) ya resolvía claves calificadas presentes en las variables.
- P2.a las claves PLANAS del registry (`processedCount`, …) se documentan como conveniencia
  "last-writer-wins" (se pisan entre tareas); la forma canónica y sin colisión es la clave
  CALIFICADA `taskRef.<output>.<campo>`, que ya emiten todas las UIs (P1.a/P1.b/P1.c). No se cambia
  la semántica de publicación para no regresar el caso "valor de la tarea más reciente".

Cobertura: IT con Testcontainers (Postgres) `MotorTableInputIT` valida los escenarios de BD —
paginación keyset estable (todas las filas una vez, en orden), modo per-record, `orderBy`
obligatorio y routing de conexión del productor para `table` (P1.3/P1.4). 4/4 verdes.
Unit tests del contrato calificado: `StoredProcedureConfigurationSupportTest` (agregado→calificado,
por-registro→plano), `StoredProcedureRuntimeSupportTest` (la clave calificada gana sobre la global
colisionable; el campo plano resuelve del registro) y `TaskInputResolverTest` (cláusula de límite
por dialecto, incl. SQL Server `OFFSET … FETCH NEXT`). `DbWriteTaskProviderTest`
(`insertsRecordsUsingQualifiedTaskOutputKey`) valida que una columna enlazada a una clave
calificada `task-1.summary.estado` se persiste con el valor del productor y no con la clave plana
colisionada.
`CatalogAndExecutionResourceIT` (e2e create+execute) migrado al contrato/async del motor. Los `*IT`
se ejecutan vía `npm run check:it` (failsafe, requiere Docker) y en CI con `mvn verify` (job
`backend`) — ya no quedan fuera de la red de seguridad como antes (surefire excluye `*IT`).
Tests del frontend (Angular): el target `nx test web` estaba mal configurado y solo descubría
1 spec (de 34); corregido (sourceRoot + `index.html` explícito + `buildTarget`/`tsConfig` en el
target `test`) → ahora corre 33 archivos / 76 tests, y se ejecuta en CI (job `frontend`:
lint + test + build). Se corrigió un spec podrido (`process-catalog.store.spec.ts`: la ejecución
asíncrona notifica `processes.queued`, no `processes.executed`).

Unit tests frontend del contrato de binding: `db-task-binding.spec.ts` (SP/FN califican solo
agregados; DB_WRITE round-trip de columnMappings/columnSources — P1.a/P1.b),
`process-task-binding-context.token.spec.ts` (`tokenForOption` califica summary/table/out, deja
records/variable/metadata planos — P1.c) y `process-task-binding-board.component.spec.ts`
(desambiguación de claves duplicadas vía valor compuesto `kind::key` — P1.1).
IT de fast path multi-archivo: `CatalogAndExecutionResourceIT#shouldExecuteFastPathAcrossMultipleSourceFiles`
(FILESYSTEM `selectionMode:"all"` con 2 archivos → los registros de ambos aterrizan en destino).

Pendientes/notas: `orderBy` de keyset debe ser clave única/ordenable (PK) para no omitir valores
repetidos; el summary del fast path puebla source* solo para un único archivo (limitación conocida,
no defecto: la metadata transversal `_*` sí está disponible por registro en multi-archivo).
(Conocido, fuera de alcance: `FileReadTaskFastPathTest$BatchTaskProviderRegistry` declara un
segundo bean `TaskProviderRegistry` que vuelve ambigua la inyección al arrancar la app completa
con `@QuarkusTest`; debería ser `@Alternative`/`@Mock`.)

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- GREEN del IT `CatalogAndExecutionResourceIT` pendiente de corrida dedicada (ver tdd-evidence.md).
