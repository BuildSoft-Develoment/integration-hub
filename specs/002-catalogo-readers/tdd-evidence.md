# Evidencia TDD - Catalogo de readers

Feature reconstruida por reingenieria sobre codigo en produccion. El **GREEN esta
capturado y es real** (corrida `mvn` del 2026-05-30). El **RED no es recapturable**: el
codigo ya existe y opera, y producir un fallo previo exigiria romper codigo funcional
(fuera del alcance acordado). Por eso el ciclo formal RED-GREEN se mantiene `pending` a
nivel de tarea en `spec-tareas.md`, mientras la evidencia GREEN queda documentada.

> Corrida de referencia: `mvn -pl platform-app test` (JDK 25, 2026-05-30) ->
> **Tests run: 64, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS.** Log: `tmp-mvntest.log`.

## RF-001 / T-001
- Comando RED: `mvn -pl platform-app -Dtest=CsvReaderProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=CsvReaderProviderTest test`
- Resultado GREEN: GREEN real — CsvReaderProviderTest: Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-002 / T-002
- Comando RED: `mvn -pl platform-app -Dtest=ReaderFieldSupportTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=ReaderFieldSupportTest test`
- Resultado GREEN: GREEN real — ReaderFieldSupportTest: Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-003 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=TxtReaderProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=TxtReaderProviderTest test`
- Resultado GREEN: GREEN real — TxtReaderProviderTest: Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-004 / T-004
- Comando RED: `mvn -pl platform-app -Dtest=ExcelReaderProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=ExcelReaderProviderTest test`
- Resultado GREEN: GREEN real — ExcelReaderProviderTest: Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-005 / T-005
- Comando RED: `mvn -pl platform-app -Dtest=CsvReaderProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=CsvReaderProviderTest test`
- Resultado GREEN: GREEN real — CsvReaderProviderTest: Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-001 / T-006

Frontend (Angular): UI de configuracion por formato de reader. Componentes anotados
`@trace RF-001, RF-002` (recogidos por `sync-memory` desde `frontend/`):
`reader-type-form/reader-{txt,csv,excel,json,xml}-form` (+ `reader-type-form-host`,
`reader-field-definitions-editor`); el contrato `configuration_json` lo arma
`reader.providers.ts` (`@trace RF-003`). Orquestan `reader-editor`, `reader-toolbar`, `reader-list`.

- Comando RED: `npx nx test readers`
- Resultado RED: No recapturable por reingenieria (UI preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `npx nx test readers`
- Resultado GREEN: GREEN preexistente — specs Angular de la feature pasan (`reader-catalog.store.spec.ts`, `reader-catalog-query.store.spec.ts`, `reader-catalog-command.service.spec.ts`, `reader-editor-state.service.spec.ts`).
- Verificado por: corrida nx (pendiente validacion humana).
- Hueco conocido: los forms por formato NO tienen `.spec.ts` dedicado (se ejercitan indirecto
  via `reader-editor`/stores). Candidato a anadir specs por formato (plan de tests frontend).
