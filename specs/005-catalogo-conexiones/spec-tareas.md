# Spec de tareas - Catalogo de conexiones

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Las rutas
de `archivo` y `test` apuntan a codigo real ya existente (feature reconstruida por
reingenieria). El estado se mantiene `pending` porque la evidencia formal RED-GREEN aun
no se ha capturado en `tdd-evidence.md`.

## Contexto
- Feature: `005-catalogo-conexiones`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- Entidad BD: `connection_definition`
- Gate: `gate-spdd-approved` (pendiente de validacion humana)

## Tabla ejecutable de tareas

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/service/connection/ConnectionCatalogService.java | platform-app/src/test/java/com/integrationhub/platform/service/connection/ConnectionCatalogServiceTest.java | mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test | PASS | - | no | pending |
| T-002 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/api/resource/connection/ConnectionDefinitionResource.java | platform-app/src/test/java/com/integrationhub/platform/service/connection/ConnectionCatalogServiceTest.java | mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test | PASS | - | si | pending |
| T-003 | RF-003 | impl | platform-app/src/main/java/com/integrationhub/platform/api/mapper/connection/ConnectionApiMapper.java | platform-app/src/test/java/com/integrationhub/platform/api/mapper/connection/ConnectionApiMapperTest.java | mvn -pl platform-app -Dtest=ConnectionApiMapperTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=ConnectionApiMapperTest test | PASS | - | si | pending |
| T-004 | RF-004 | impl | platform-app/src/main/java/com/integrationhub/platform/service/connection/ConnectionMetadataService.java | - | mvn -pl platform-app test | FAIL sin la implementacion | mvn -pl platform-app test | PASS | - | si | pending |
| T-005 | RF-005 | impl | platform-app/src/main/java/com/integrationhub/platform/service/connection/ConnectionMetadataService.java | - | mvn -pl platform-app test | FAIL sin la implementacion | mvn -pl platform-app test | PASS | - | si | pending |
| T-006 | RF-001 | impl | frontend/libs/features/connections/src/lib/components/connection-editor/connection-editor.component.ts | frontend/libs/features/connections/src/lib/catalog/connection-catalog.store.spec.ts | npx nx test connections | FAIL sin la UI de configuracion de conexiones | npx nx test connections | PASS | - | si | pending |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
