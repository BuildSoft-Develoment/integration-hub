# Spec de tareas - Catalogo de fuentes

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Las rutas
de `archivo` y `test` apuntan a codigo real ya existente (feature reconstruida por
reingenieria). El estado se mantiene `pending` porque la evidencia formal RED-GREEN aun
no se ha capturado en `tdd-evidence.md`.

## Contexto
- Feature: `001-catalogo-fuentes`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- Entidad BD: `source_definition`
- Gate: `gate-spdd-approved` (pendiente de validacion humana)

## Tabla ejecutable de tareas

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/api/resource/source/SourceDefinitionResource.java | platform-app/src/test/java/com/integrationhub/platform/service/source/SourceCatalogServiceTest.java | mvn -pl platform-app -Dtest=SourceCatalogServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=SourceCatalogServiceTest test | PASS | - | no | pending |
| T-002 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/service/source/SourceCatalogService.java | platform-app/src/test/java/com/integrationhub/platform/service/source/SourceCatalogServiceTest.java | mvn -pl platform-app -Dtest=SourceCatalogServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=SourceCatalogServiceTest test | PASS | - | si | pending |
| T-003 | RF-003 | impl | platform-app/src/main/java/com/integrationhub/platform/service/source/SourceCatalogService.java | platform-app/src/test/java/com/integrationhub/platform/service/JsonConfigurationMapperTest.java | mvn -pl platform-app -Dtest=JsonConfigurationMapperTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=JsonConfigurationMapperTest test | PASS | - | si | pending |
| T-004 | RF-004 | impl | platform-app/src/main/java/com/integrationhub/platform/service/secret/FileVaultSecretValueProvider.java | platform-app/src/test/java/com/integrationhub/platform/service/secret/FileVaultSecretValueProviderTest.java | mvn -pl platform-app -Dtest=FileVaultSecretValueProviderTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=FileVaultSecretValueProviderTest test | PASS | - | si | pending |
| T-005 | RF-005 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/source/FilesystemSourceProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/source/FilesystemSourceProviderTest.java | mvn -pl platform-app -Dtest=FilesystemSourceProviderTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=FilesystemSourceProviderTest test | PASS | - | si | pending |
| T-006 | RF-001 | impl | frontend/libs/features/sources/src/lib/components/source-type-form/source-type-form-host/source-type-form-host.component.ts | frontend/libs/features/sources/src/lib/components/source-editor/source-editor.readonly.spec.ts | npx nx test sources | FAIL sin la UI de configuracion por tipo | npx nx test sources | PASS | - | si | pending |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
