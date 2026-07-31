# TRACEABILITY_MATRIX

> Matriz global de trazabilidad: rollup de todas las features del proyecto. Cada feature
> mantiene el detalle en su `specs/<feature>/` (spec-funcional, spec-tecnica, spec-tareas,
> tdd-evidence). Este archivo consolida la vista para responder rapido "que requerimiento
> esta cubierto, por que feature, con que codigo y prueba".
>
> Feature reconstruida por reingenieria sobre codigo en produccion: el codigo y las
> pruebas existen y operan; la evidencia formal RED-GREEN se mantiene `pending` en
> `tdd-evidence.md` hasta su captura y validacion humana.
>
> `node scripts/ai-framework-agent.mjs sync-memory` parsea este archivo y las
> `traceability.md` por feature para poblar `ai_trace_links` y `ai_gate_runs`.
>
> Nota de numeracion: cada feature usa numeracion local `RF-001..RF-005` en su
> `spec-funcional.md`. La columna "Req. global" referencia el requerimiento agregado del
> documento de analisis `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
> (requerimientos funcionales 1 a 7 / no funcionales 1 a 5).
>
> Nota de columnas: `Codigo`, `Test`, `BD` y `API` declaran UN artefacto atomico verificable
> por fila (clase, clase de prueba, tabla, ruta), de modo que `check:trace-drift` resuelva cada
> enlace contra el repo. Las rutas `API` se verifican contra `contracts/api/openapi.yaml`,
> generado desde los `specs/<feature>/api-contract.md` con `npm run generate:openapi`.

## Matriz global

| Feature | RF | Req. global | Backlog (HU) | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|--- | --- | --- |
| 001-catalogo-fuentes | RF-001 | funcional 1 (fuentes) | Administrar fuentes | POST /api/source-definitions | source_definition | SourceCatalogService | SourceCatalogServiceTest | Implementado | specs/001-catalogo-fuentes/tdd-evidence.md | source-editor + source-type-form/* | source-editor.readonly.spec.ts |
| 001-catalogo-fuentes | RF-002 | funcional 1 (fuentes) | Administrar fuentes | POST /api/source-definitions/{sourceDefinitionId}/activation/{active} | source_definition | SourceDefinitionResource | SourceCatalogServiceTest | Implementado | specs/001-catalogo-fuentes/tdd-evidence.md | source-toolbar, source-list | source-catalog-command.service.spec.ts |
| 001-catalogo-fuentes | RF-003 | funcional 1 (fuentes) | Administrar fuentes | POST /api/source-definitions | source_definition | JsonConfigurationMapper | JsonConfigurationMapperTest | Implementado | specs/001-catalogo-fuentes/tdd-evidence.md | source-type-form/source-{filesystem,ftp,sftp,rest}-form | - (sin spec por tipo) |
| 001-catalogo-fuentes | RF-004 | no funcional 2 (seguridad/secretos) | Administrar fuentes | POST /api/source-definitions | source_definition | FileVaultSecretValueProvider | FileVaultSecretValueProviderTest | Implementado | specs/001-catalogo-fuentes/tdd-evidence.md | source-type-form (campos ${secret:...}) | - |
| 001-catalogo-fuentes | RF-005 | funcional 3 (FILE_READ) | Administrar fuentes | POST /api/source-definitions/test | source_definition | FilesystemSourceProvider | FilesystemSourceProviderTest | Implementado | specs/001-catalogo-fuentes/tdd-evidence.md | - (insumo backend FILE_READ) | - |
| 001-catalogo-fuentes | RF-006 | fuentes cloud (object stores) | Administrar fuentes | POST /api/source-definitions | source_definition (s3/gcs/azure-blob) | S3SourceProvider | - | En progreso (WIP, ADR-006) | specs/001-catalogo-fuentes/spec-tecnica.md | source-object-store + source-{s3,gcs,azure-blob}-form (WIP) | - |
| 001-catalogo-fuentes | RF-007 | credenciales cloud (nativas/${secret}) | Administrar fuentes | POST /api/source-definitions | source_definition | FileVaultSecretValueProvider | - | En progreso (WIP, ADR-006) | specs/001-catalogo-fuentes/spec-tecnica.md | source-object-store (bloque auth) | - |
| 001-catalogo-fuentes | RF-008 | descarga por streaming | Administrar fuentes | POST /api/source-definitions/test | source_definition | SourcePayload | - | En progreso (WIP, ADR-006) | specs/001-catalogo-fuentes/spec-tecnica.md | - (insumo backend FILE_READ) | - |
| 002-catalogo-readers | RF-001 | funcional 2 (readers) | Configurar readers | POST /api/reader-definitions | reader_definition | ReaderDefinitionResource | CsvReaderProviderTest | Implementado | specs/002-catalogo-readers/tdd-evidence.md | reader-editor + reader-type-form/* | reader-catalog.store.spec.ts |
| 002-catalogo-readers | RF-002 | funcional 2 (readers) | Configurar readers | POST /api/reader-definitions | reader_definition | ReaderCatalogService | ReaderFieldSupportTest | Implementado | specs/002-catalogo-readers/tdd-evidence.md | reader-{csv,txt,excel,json,xml}-form + reader-field-definitions-editor | reader-editor-state.service.spec.ts |
| 002-catalogo-readers | RF-003 | funcional 2 (readers) | Configurar readers | POST /api/reader-definitions | reader_definition | TxtReaderProvider | TxtReaderProviderTest | Implementado | specs/002-catalogo-readers/tdd-evidence.md | reader.providers.ts (toConfigurationObject) | reader-catalog-command.service.spec.ts |
| 002-catalogo-readers | RF-004 | funcional 2 (readers) | Configurar readers | POST /api/reader-definitions/{readerDefinitionId}/activation/{active} | reader_definition | XlsxReaderProvider | ExcelReaderProviderTest | Implementado | specs/002-catalogo-readers/tdd-evidence.md | reader-toolbar, reader-list | reader-catalog-query.store.spec.ts |
| 002-catalogo-readers | RF-005 | funcional 3 (Process Designer) | Configurar readers | GET /api/reader-definitions | reader_definition | ReaderDefinitionResource | CsvReaderProviderTest | Implementado | specs/002-catalogo-readers/tdd-evidence.md | - (insumo Process Designer) | - |
| 003-diseno-y-ejecucion-procesos | RF-001 | funcional 3 (procesos) | Disenar y ejecutar procesos | POST /api/process-definitions | process_definition | ProcessDefinitionResource | CatalogAndExecutionResourceIT | Implementado | specs/003-diseno-y-ejecucion-procesos/tdd-evidence.md | process-editor + process-flow-* | process-editor.store.spec.ts |
| 003-diseno-y-ejecucion-procesos | RF-002 | funcional 3 (tipos de tarea) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | DbWriteTaskProvider | DbWriteTaskProviderTest | Implementado | specs/003-diseno-y-ejecucion-procesos/tdd-evidence.md | process-task-form/* (6 tipos) + tasks/*.provider.ts | process-flow-sync.service.spec.ts |
| 003-diseno-y-ejecucion-procesos | RF-003 | funcional 3 (activar) | Disenar y ejecutar procesos | POST /api/process-definitions/{processDefinitionId}/activation/{active} | process_definition | ProcessSchedulerService | CatalogAndExecutionResourceIT | Implementado | specs/003-diseno-y-ejecucion-procesos/tdd-evidence.md | process-toolbar, process-list | process-catalog.store.spec.ts |
| 003-diseno-y-ejecucion-procesos | RF-004 | funcional 4 (ejecutar manual/scheduler) | Disenar y ejecutar procesos | POST /api/process-definitions | process_execution | StreamingPipelineService | StreamingPipelineServiceTest | Implementado | specs/003-diseno-y-ejecucion-procesos/tdd-evidence.md | process-editor-actions (trigger) | process-flow-api.service.spec.ts |
| 003-diseno-y-ejecucion-procesos | RF-005 | funcional 6 (linaje/reproceso) | Disenar y ejecutar procesos | GET /api/query/process-executions | process_execution | ProcessExecutionService | FileReadTaskFastPathTest | Implementado | specs/003-diseno-y-ejecucion-procesos/tdd-evidence.md | - (insumo Observabilidad 004) | - |
| 003-diseno-y-ejecucion-procesos | RF-006 | motor dinamico (taskRef) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | ProcessTaskRuntimeService | - | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-task-runtime-panel | - |
| 003-diseno-y-ejecucion-procesos | RF-007 | motor dinamico (inputs tipados) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | TaskInputResolver | TaskInputResolverTest | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-task-binding-board | - |
| 003-diseno-y-ejecucion-procesos | RF-008 | motor dinamico (metadata transversal) | Disenar y ejecutar procesos | POST /api/process-definitions | - | TaskOutputSupport | - | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-task-binding-context.service | - |
| 003-diseno-y-ejecucion-procesos | RF-009 | motor dinamico (executionMode) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | ProcessTaskRuntimeService | - | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-task-runtime-panel | - |
| 003-diseno-y-ejecucion-procesos | RF-010 | motor dinamico (batch/checkpoint) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | TaskOutputRegistry | TaskOutputRegistryTest | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-task-runtime-panel | - |
| 003-diseno-y-ejecucion-procesos | RF-011 | motor dinamico (fan-in/out) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | TaskInputResolver | TaskInputResolverTest | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-flow-* | - |
| 003-diseno-y-ejecucion-procesos | RF-012 | motor dinamico (mapping comun) | Disenar y ejecutar procesos | POST /api/process-definitions | process_task_definition | TaskInputResolver | - | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | process-task-binding-board | - |
| 003-diseno-y-ejecucion-procesos | RF-013 | motor dinamico (alto volumen >1M) | Disenar y ejecutar procesos | POST /api/process-definitions | - | StreamingPipelineService | - | En progreso (WIP, ADR-004) | specs/003-diseno-y-ejecucion-procesos/spec-tecnica.md | - | - |
| 004-observabilidad-y-auditoria | RF-001 | funcional 5 (consultar ejecuciones/auditoria) | Auditar y reprocesar | GET /api/query/process-executions | process_execution | ExecutionQueryResource | CatalogAndExecutionResourceIT | Implementado | specs/004-observabilidad-y-auditoria/tdd-evidence.md | execution-list, audit-list (+toolbars) | execution-catalog.store.spec.ts |
| 004-observabilidad-y-auditoria | RF-002 | funcional 5 (detalle tarea/archivo) | Auditar y reprocesar | GET /api/query/process-executions/{processExecutionId}/tasks | process_task_execution | ExecutionQueryService | CatalogAndExecutionResourceIT | Implementado | specs/004-observabilidad-y-auditoria/tdd-evidence.md | execution-editor + execution-task-list + execution-files-panel | execution-detail.store.spec.ts |
| 004-observabilidad-y-auditoria | RF-003 | funcional 5 (overview/relacionadas) | Auditar y reprocesar | GET /api/query/process-executions/{processExecutionId}/children | process_execution | ExecutionQueryService | CatalogAndExecutionResourceIT | Implementado | specs/004-observabilidad-y-auditoria/tdd-evidence.md | execution-lineage | execution-editor.store.spec.ts |
| 004-observabilidad-y-auditoria | RF-004 | funcional 5 (resumen operativo) | Auditar y reprocesar | GET /api/query/overview-summary | process_execution | ExecutionQueryResource | CatalogAndExecutionResourceIT | Implementado | specs/004-observabilidad-y-auditoria/tdd-evidence.md | overview-metric-card + overview-table-card | overview.store.spec.ts |
| 004-observabilidad-y-auditoria | RF-005 | no funcional 1 (trazabilidad) | Auditar y reprocesar | GET /api/query/audit-events | audit_event | AuditService | StreamingPipelineServiceTest | Implementado | specs/004-observabilidad-y-auditoria/tdd-evidence.md | execution-editor-summary, audit-editor | audit.store.spec.ts |
| 005-catalogo-conexiones | RF-001 | funcional 3 (tareas DB) | Administrar conexiones | POST /api/connection-definitions | connection_definition | ConnectionCatalogService | ConnectionCatalogServiceTest | Implementado | specs/005-catalogo-conexiones/tdd-evidence.md | connection-editor + connection-jdbc-form + connection-mongodb-form | connection-catalog.store.spec.ts |
| 005-catalogo-conexiones | RF-002 | funcional 3 (tareas DB) | Administrar conexiones | POST /api/connection-definitions/test | connection_definition | ConnectionDefinitionResource | ConnectionCatalogServiceTest | Implementado | specs/005-catalogo-conexiones/tdd-evidence.md | connection-toolbar, connection-list | connection-catalog-command.service.spec.ts |
| 005-catalogo-conexiones | RF-003 | no funcional 2 (seguridad/secretos) | Administrar conexiones | POST /api/connection-definitions | connection_definition | ConnectionApiMapper | ConnectionApiMapperTest | Implementado | specs/005-catalogo-conexiones/tdd-evidence.md | connections/*.provider.ts (toConfigurationObject) | connection-editor-state.service.spec.ts |
| 005-catalogo-conexiones | RF-004 | funcional 3 (mapeo destino DB) | Administrar conexiones | GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/tables | connection_definition | ConnectionMetadataService | - | Implementado | specs/005-catalogo-conexiones/tdd-evidence.md | - (insumo DB_WRITE en Procesos 003) | - |
| 005-catalogo-conexiones | RF-005 | funcional 3 (rutinas SP/FN) | Administrar conexiones | GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/procedures | connection_definition | ConnectionMetadataService | - | Implementado | specs/005-catalogo-conexiones/tdd-evidence.md | - (insumo DB_EXECUTE_SP/FN en Procesos 003) | - |
| 006-programacion-procesos | RF-001 | funcional 4 (ejecutar programada) | Programar procesos | POST /api/process-definitions | process_definition | ProcessCatalogService | - | Implementado | specs/006-programacion-procesos/tdd-evidence.md | schedules-editor | schedules.store.spec.ts |
| 006-programacion-procesos | RF-002 | funcional 4 (scheduler) | Programar procesos | - | process_definition | ProcessSchedulerService | - | Implementado | specs/006-programacion-procesos/tdd-evidence.md | - (insumo backend scheduler) | - |
| 006-programacion-procesos | RF-003 | funcional 4 (consultar programaciones) | Programar procesos | GET /api/process-schedules | process_definition | ProcessScheduleQueryService | ProcessScheduleQueryServiceTest | Implementado | specs/006-programacion-procesos/tdd-evidence.md | schedules-list, schedules-toolbar | schedules.store.spec.ts |
| 006-programacion-procesos | RF-004 | no funcional 3 (robustez scheduler) | Programar procesos | - | process_definition | ProcessSchedulerService | - | Implementado | specs/006-programacion-procesos/tdd-evidence.md | - (backend scheduler) | - |
| 007-tema-del-sistema | RF-001 | funcional 10 (tema/consola) | Administrar tema del sistema | GET /api/system/theme | system_theme_setting | SystemThemeSettingService | SystemThemeSettingServiceTest | Implementado | specs/007-tema-del-sistema/tdd-evidence.md | app-theme-action + app-preferences.facade | - |
| 007-tema-del-sistema | RF-002 | funcional 10 (tema/consola) | Administrar tema del sistema | PUT /api/system/theme | system_theme_setting | SystemThemeSettingResource | SystemThemeSettingServiceTest | Implementado | specs/007-tema-del-sistema/tdd-evidence.md | app-preferences.facade + theme.service | - |
| 007-tema-del-sistema | RF-003 | funcional 10 (tema/consola) | Administrar tema del sistema | PUT /api/system/theme | system_theme_setting | SystemThemeSettingApiMapper | SystemThemeSettingApiMapperTest | Implementado | specs/007-tema-del-sistema/tdd-evidence.md | system-theme-config.service.ts | - |

Reglas:
- Una fila por requerimiento por feature, agrupadas por feature.
- `Codigo`, `Test` y `BD`: UN artefacto atomico verificable por celda (sin listas separadas
  por coma) para que `check:trace-drift` resuelva el enlace contra el repo.
- `Endpoint`: ruta documental para lectura humana; no se ingiere como enlace de traza.
- `Estado`: valores cortos y consistentes (`En diseno SDD`, `En desarrollo`, `Prototipo validado`, `Implementado`, `En QA`, `Cerrado`).
- Celdas sin dato: usa `-`.
- El detalle por feature vive en `specs/<feature>/`; este archivo es el resumen.

## Estado de gates por feature

> Las siete features estan declaradas con `origin: reingenieria` en su
> `spec-funcional.md` (codigo ya construido y operativo). Por la metodologia
> (CONSTITUTION.md, Principio 4 — excepcion de reingenieria), la **Fase 2 (UX/UI ·
> prototipo · SPDD) no aplica**, por lo que el `gate-spdd-approved` queda **n/a**. El
> resto de la metodologia (spec-funcional, spec-tecnica, traceability, api-contract,
> spec-tareas, tdd-evidence, BD, trazabilidad) se mantiene exigible.

| Feature | Gate | Estado | Evidencia |
|---|---|---|---|
| 001-catalogo-fuentes | gate-spdd-approved | n/a (reingenieria) | specs/001-catalogo-fuentes/spec-funcional.md (origin: reingenieria) |
| 002-catalogo-readers | gate-spdd-approved | n/a (reingenieria) | specs/002-catalogo-readers/spec-funcional.md (origin: reingenieria) |
| 003-diseno-y-ejecucion-procesos | gate-spdd-approved | n/a (reingenieria) | specs/003-diseno-y-ejecucion-procesos/spec-funcional.md (origin: reingenieria) |
| 004-observabilidad-y-auditoria | gate-spdd-approved | n/a (reingenieria) | specs/004-observabilidad-y-auditoria/spec-funcional.md (origin: reingenieria) |
| 005-catalogo-conexiones | gate-spdd-approved | n/a (reingenieria) | specs/005-catalogo-conexiones/spec-funcional.md (origin: reingenieria) |
| 006-programacion-procesos | gate-spdd-approved | n/a (reingenieria) | specs/006-programacion-procesos/spec-funcional.md (origin: reingenieria) |
| 007-tema-del-sistema | gate-spdd-approved | n/a (reingenieria) | specs/007-tema-del-sistema/spec-funcional.md (origin: reingenieria) |

## Requerimientos sin implementacion

- Ninguno: las siete features tienen codigo asociado en produccion. Pendiente: captura formal de
  evidencia RED-GREEN (estado `pending` en cada `tdd-evidence.md`) y, en 005/006, cobertura de
  pruebas dedicada (`Test = -`); ambas son tareas de validacion, no de implementacion.

## Decisiones transversales

- La correlacion operativa base entre auditoria, trazas y ejecucion es `processExecutionId`.
- Los secretos se referencian con el contrato `${secret:...}` y nunca se persisten en claro
  (ver `001-catalogo-fuentes` RF-004 y ADR-002).
- El motor usa el patron providers + registries (source/reader/task) para extensibilidad
  sin acoplar flujos (ver ADR-001 y ADR-002).

## Preguntas abiertas globales

- Confirmar con el equipo el mapeo definitivo entre la numeracion local `RF-001..RF-005`
  por feature y los requerimientos globales `funcional 1..7 / no funcional 1..5` del
  documento de analisis, para fijar la trazabilidad bidireccional.
- El contrato `contracts/api/openapi.yaml` ya publica las 16 rutas reales (`@Path` de
  `platform-app`), generado desde los `specs/<feature>/api-contract.md` con
  `npm run generate:openapi`. Pendiente de fase 4/7: enriquecer cada operacion con
  request/response schemas y parametros completos (hoy documenta ruta + 200 minimo).
