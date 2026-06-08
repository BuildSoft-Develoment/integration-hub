# Spec de tareas - Diseno y ejecucion de procesos

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Las rutas
de `archivo` y `test` apuntan a codigo real ya existente (feature reconstruida por
reingenieria). El estado se mantiene `pending` porque la evidencia formal RED-GREEN aun
no se ha capturado en `tdd-evidence.md`.

## Contexto
- Feature: `003-diseno-y-ejecucion-procesos`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- Entidades BD: `process_definition`, `process_task_definition`, `process_execution`, `process_task_execution`, `staging_record`
- Gate: `gate-spdd-approved` (pendiente de validacion humana)

## Tabla ejecutable de tareas

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/api/resource/process/ProcessDefinitionResource.java | platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | PASS | - | no | pending |
| T-002 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/dbwrite/DbWriteTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/dbwrite/DbWriteTaskProviderTest.java | mvn -pl platform-app -Dtest=DbWriteTaskProviderTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=DbWriteTaskProviderTest test | PASS | - | si | pending |
| T-003 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/storedprocedure/StoredProcedureTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/storedprocedure/StoredProcedureTaskProviderTest.java | mvn -pl platform-app -Dtest=StoredProcedureTaskProviderTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=StoredProcedureTaskProviderTest test | PASS | - | si | pending |
| T-004 | RF-003 | impl | platform-app/src/main/java/com/integrationhub/platform/service/process/ProcessSchedulerService.java | platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | PASS | - | si | pending |
| T-005 | RF-004 | impl | platform-app/src/main/java/com/integrationhub/platform/service/execution/StreamingPipelineService.java | platform-app/src/test/java/com/integrationhub/platform/service/execution/StreamingPipelineServiceTest.java | mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test | PASS | - | si | pending |
| T-006 | RF-005 | impl | platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessExecutionService.java | platform-app/src/test/java/com/integrationhub/platform/service/execution/fastpath/FileReadTaskFastPathTest.java | mvn -pl platform-app -Dtest=FileReadTaskFastPathTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=FileReadTaskFastPathTest test | PASS | - | si | pending |
| T-007 | RF-002 | impl | frontend/libs/features/processes/src/lib/components/process-task-form/process-task-form-host/process-task-form-host.component.ts | frontend/libs/features/processes/src/lib/editor/process-editor.store.spec.ts | npx nx test processes | FAIL sin la UI de configuracion por tipo de tarea | npx nx test processes | PASS | - | si | pending |

## Motor dinamico de inputs/outputs (ADR-004) - tareas WIP

> Evolucion del motor (RF-006..RF-013). Backend `TaskInputResolver`/`TaskOutputRegistry` y
> frontend `process-task-runtime-panel` en curso; el resto pendiente.

| id | rf | tipo | entregable | depende_de | estado |
| --- | --- | --- | --- | --- | --- |
| T-008 | RF-006 | diseno | Definir `taskRef`, `dependsOn`, `input`, `inputs`, `outputs` y `executionMode` | ADR-004 | pending |
| T-009 | RF-007/RF-008 | backend | Implementar metadata transversal y resolucion de inputs tipados | T-008 | en curso |
| T-010 | RF-009/RF-010 | backend | Implementar ejecucion `once`, `per-record`, `batch` con checkpoint por lote | T-008 | en curso |
| T-011 | RF-007/RF-013 | backend | Materializar o paginar outputs masivos sin listas completas en memoria | T-009 | pending |
| T-012 | RF-011/RF-012 | frontend | Permitir seleccionar output anterior, modo de ejecucion y mappings comunes | T-008 | en curso |
| T-013 | RF-011 | backend/frontend | Validar grafo, fan-out, fan-in, ciclos y tareas futuras | T-008 | pending |
| T-014 | RF-013 | qa | Pruebas de volumen, retry, idempotencia y reproceso por lote | T-010/T-011 | pending |

## Motor para verticales (ADR-009)

> Cierre de deuda del motor expuesta por la separacion del spec
> [008-mensajeria-pagos](../008-mensajeria-pagos/spec-funcional.md) (ADR-009).
> Estas tareas son **del motor**, no de un dominio: benefician a cualquier
> vertical futura (pagos, salud HL7, ACH, AML, tax filing).

| id | rf | tipo | entregable | depende_de | estado |
| --- | --- | --- | --- | --- | --- |
| T-015 | RF-002 | backend | **M-1a** `TaskTypeRegistry`: convertir el enum `TaskType` en registro abierto via SPI (`@TaskTypeProvider` o discovery por CDI). Las verticales registran sus tipos sin tocar `domain/TaskType.java`. | ADR-009 | pending |
| T-016 | RF-011/RF-012 | frontend | **M-1b** Descubrimiento de formularios en Nx: `process-form-factory.service.ts` delega a sub-factories registradas por cada feature vertical (`features/payments-swift/`, etc.). Sin editar el factory central al agregar verticales. | ADR-009 | pending |
| T-017 | RF-009/RF-010 | backend | **M-2** Tareas long-running con suspend/resume cross-restart: el motor persiste estado de tarea (`process_task_execution.suspended_state`), libera el worker y reanuda en otro proceso/restart. Necesario para `MT101_STATUS` mode `poll`, callbacks Open Banking, integraciones batch externas. | ADR-009 | pending |
| T-018 | RF-007 | backend | **M-3** Outputs multi-nominados: extender `TaskOutputRegistry.registerTypedOutput` para que una tarea publique varios outputs distintos del mismo tipo (`<ref>.header`, `<ref>.envelope`, `<ref>.transactions`). Hoy el dotted-path es implicito; pasa a contrato explicito. | ADR-009 | pending |
| T-019 | RF-007 | frontend | Selector visual de output nominado en el disenador (lista los `outputs[]` declarados por la tarea productora). Depende de T-018. | T-018 | pending |
| T-020 | - | doc | Plantilla "vertical catalog" en `docs/fase-3-arquitectura/`: como una nueva vertical (008/009/...) declara sus task types, formularios, dependencias y migraciones sin tocar el motor. | T-015, T-016 | pending |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
