# Evidencia TDD - Catalogo de fuentes

Feature reconstruida por reingenieria sobre codigo en produccion. El **GREEN esta
capturado y es real** (corrida `mvn` del 2026-05-30, ver abajo). El **RED no es
recapturable**: el codigo ya existe y opera en produccion, y producir un fallo previo
exigiria romper codigo funcional, lo cual queda fuera del alcance acordado (no tocar
codigo existente). Por eso el ciclo formal RED-GREEN se mantiene `pending` a nivel de
tarea en `spec-tareas.md` (no se reclama un ciclo TDD que no se ejecuto), mientras la
evidencia GREEN queda documentada y trazable.

> Corrida de referencia: `mvn -pl platform-app test` (JDK 25, 2026-05-30) ->
> **Tests run: 64, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS.**
> Log: `tmp-mvntest.log`.

## RF-001 / T-001
- Comando RED: `mvn -pl platform-app -Dtest=SourceCatalogServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=SourceCatalogServiceTest test`
- Resultado GREEN: GREEN real — SourceCatalogServiceTest: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-002 / T-002
- Comando RED: `mvn -pl platform-app -Dtest=SourceCatalogServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=SourceCatalogServiceTest test`
- Resultado GREEN: GREEN real — SourceCatalogServiceTest: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-003 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=JsonConfigurationMapperTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=JsonConfigurationMapperTest test`
- Resultado GREEN: GREEN real — JsonConfigurationMapperTest: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-004 / T-004
- Comando RED: `mvn -pl platform-app -Dtest=FileVaultSecretValueProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=FileVaultSecretValueProviderTest test`
- Resultado GREEN: GREEN real — FileVaultSecretValueProviderTest: Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-005 / T-005
- Comando RED: `mvn -pl platform-app -Dtest=FilesystemSourceProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=FilesystemSourceProviderTest test`
- Resultado GREEN: GREEN real — FilesystemSourceProviderTest: Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).
