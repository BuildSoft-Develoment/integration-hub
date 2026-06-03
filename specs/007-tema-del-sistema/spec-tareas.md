# Spec de tareas - Tema del sistema

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Las rutas
de `archivo` y `test` apuntan a codigo real ya existente (feature reconstruida por
reingenieria). El estado se mantiene `pending` porque la evidencia formal RED-GREEN aun
no se ha capturado en `tdd-evidence.md`.

## Contexto
- Feature: `007-tema-del-sistema`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- Entidad BD: `system_theme_setting`
- Gate: `gate-spdd-approved` (pendiente de validacion humana)

## Tabla ejecutable de tareas

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/service/system/SystemThemeSettingService.java | platform-app/src/test/java/com/integrationhub/platform/service/system/SystemThemeSettingServiceTest.java | mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test | PASS | - | no | pending |
| T-002 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/api/resource/system/SystemThemeSettingResource.java | platform-app/src/test/java/com/integrationhub/platform/service/system/SystemThemeSettingServiceTest.java | mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test | PASS | - | si | pending |
| T-003 | RF-003 | impl | platform-app/src/main/java/com/integrationhub/platform/api/mapper/system/SystemThemeSettingApiMapper.java | platform-app/src/test/java/com/integrationhub/platform/api/mapper/system/SystemThemeSettingApiMapperTest.java | mvn -pl platform-app -Dtest=SystemThemeSettingApiMapperTest test | FAIL sin la implementacion | mvn -pl platform-app -Dtest=SystemThemeSettingApiMapperTest test | PASS | - | si | pending |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
