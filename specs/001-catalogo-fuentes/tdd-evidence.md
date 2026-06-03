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

## RF-001 / T-006

Frontend (Angular): UI de configuracion por tipo de fuente. Componentes anotados
`@trace RF-001, RF-003` (recogidos por `sync-memory` desde `frontend/`):
`source-type-form/source-{filesystem,ftp,sftp,rest}-form` (+ `source-type-form-host`,
`source-type-form.abstract`); orquestan `source-editor`, `source-toolbar`, `source-list`.

- Comando RED: `npx nx test sources`
- Resultado RED: No recapturable por reingenieria (UI preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `npx nx test sources`
- Resultado GREEN: GREEN preexistente — specs Angular de la feature pasan (`source-editor.readonly.spec.ts`, `source-catalog{,-query}.store.spec.ts`, `source-catalog-command.service.spec.ts`, `source-editor-state.service.spec.ts`).
- Verificado por: corrida nx (pendiente validacion humana).
- Hueco conocido: los 4 forms por tipo NO tienen `.spec.ts` dedicado (se ejercitan indirecto
  via `source-editor`/stores). Candidato a anadir specs por tipo (plan de tests frontend).
