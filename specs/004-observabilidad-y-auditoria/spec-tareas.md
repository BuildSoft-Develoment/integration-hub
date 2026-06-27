# Spec de tareas - Observabilidad y auditoria

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Las rutas
de `archivo` y `test` apuntan a codigo real ya existente (feature reconstruida por
reingenieria). El estado se mantiene `pending` porque la evidencia formal RED-GREEN aun
no se ha capturado en `tdd-evidence.md`.

## Contexto
- Feature: `004-observabilidad-y-auditoria`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- Entidades BD: `audit_event`, `processed_source_file`
- Gate: `gate-spdd-approved` (pendiente de validacion humana)

## Tabla ejecutable de tareas

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/ExecutionQueryResource.java | platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | PASS | - | no | pending |
| T-002 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/service/execution/ExecutionQueryService.java | platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | PASS | - | si | pending |
| T-003 | RF-003 | impl | platform-app/src/main/java/com/integrationhub/platform/service/execution/ExecutionQueryService.java | platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | PASS | - | si | pending |
| T-004 | RF-004 | impl | platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/ExecutionQueryResource.java | platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test | PASS | - | si | pending |
| T-005 | RF-005 | impl | platform-app/src/main/java/com/integrationhub/platform/service/execution/AuditService.java | platform-app/src/test/java/com/integrationhub/platform/service/execution/StreamingPipelineServiceTest.java | mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test | PASS | - | si | pending |
| T-006 | RF-001 | impl | frontend/libs/features/executions/src/lib/components/execution-list/execution-list.component.ts | frontend/libs/features/executions/src/lib/catalog/execution-catalog.store.spec.ts | npx nx test executions | FAIL sin la UI de consulta de ejecuciones | npx nx test executions | PASS | - | si | pending |
| T-007 | RF-006 | impl backend/consumer | platform-contract/src/main/java/com/integrationhub/platform/audit/AuditEnvelope.java + audit-consumer/src/main/java/com/integrationhub/auditconsumer/AuditEventHandler.java | audit-consumer/src/test/java/com/integrationhub/auditconsumer/AuditEventConsumerTest.java | mvn -pl audit-consumer -Dtest=AuditEventConsumerTest test | FAIL sin handler/DLQ | mvn -pl audit-consumer -Dtest=AuditEventConsumerTest test | PASS | T-005 | si | done |
| T-008 | RF-007 | impl backend/frontend | platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/RecordLineageResource.java + frontend/libs/features/audit/src/lib/components/record-lineage/record-lineage.component.ts | audit-consumer/src/test/java/com/integrationhub/auditconsumer/coldstore/PostgresColdStoreTest.java | mvn -pl audit-consumer -Dtest=PostgresColdStoreTest test | FAIL sin columnas/consulta por claves | mvn -pl audit-consumer -Dtest=PostgresColdStoreTest test | PASS | T-007, spec 008 | si | done |
| T-009 | RF-006 | impl backend/consumer | platform-app/src/main/java/com/integrationhub/platform/service/execution/AuditSpoolWriter.java + platform-app/src/main/java/com/integrationhub/platform/service/messaging/OutboxRelay.java + audit-consumer/src/main/java/com/integrationhub/auditconsumer/AuditEventHandler.java | audit-consumer/src/test/java/com/integrationhub/auditconsumer/AuditEventConsumerTest.java | mvn -pl platform-app,audit-consumer -DskipTests compile | FAIL sin lifecycle `IN_FLIGHT`/`DEAD` y batch handler | mvn -pl platform-contract,platform-app,audit-consumer -DskipTests compile | PASS | T-007 | si | done |
| T-010 | RF-008 | impl backend/frontend | platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/AuditSpoolResource.java + frontend/libs/features/audit/src/lib/components/audit-spool/audit-spool.component.ts | frontend/apps/web/project.json | cmd.exe /c npx nx build web --configuration=development --skip-nx-cache | FAIL sin rutas/modelos/API frontend | cmd.exe /c npx nx build web --configuration=development --skip-nx-cache | PASS | T-009 | si | done |
| T-011 | RF-009 | impl backend/frontend | platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/Mt101FragmentLookupResource.java + frontend/libs/features/audit/src/lib/components/mt101-fragment-lookup/mt101-fragment-lookup.component.ts | frontend/apps/web/project.json | cmd.exe /c npx nx build web --configuration=development --skip-nx-cache | FAIL sin endpoint/modelos/route | cmd.exe /c npx nx build web --configuration=development --skip-nx-cache | PASS | T-008, spec 008 | si | done |
| T-012 | RF-010 | impl frontend/ux | frontend/libs/features/audit/src/lib/utils/audit-operation-risk.ts + frontend/libs/features/audit/src/lib/components/audit-workspace-nav/audit-workspace-nav.component.ts + audit-spool + mt101-quarantine | frontend/libs/features/audit/src/lib/utils/audit-operation-risk.spec.ts + audit-workspace-nav.component.spec.ts + audit-spool.component.spec.ts + mt101-quarantine.component.spec.ts | cmd.exe /c npx nx test web --skip-nx-cache | FAIL sin contrato de riesgo operacional visible/testeable ni workspace audit comun | cmd.exe /c npx nx test web --skip-nx-cache | PASS | T-010, T-011, spec 008 | si | done |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
