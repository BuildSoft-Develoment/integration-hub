# Evidencia TDD - Catalogo de conexiones

Feature reconstruida por reingenieria sobre codigo en produccion. El **GREEN de la capa
unitaria esta capturado y es real** (corrida `mvn` del 2026-06-03). El **RED no es
recapturable** (codigo preexistente; capturar un fallo previo romperia codigo funcional,
fuera del alcance acordado). Por eso el ciclo formal RED-GREEN se mantiene `pending` a
nivel de tarea en `spec-tareas.md` (no se reclama un ciclo TDD que no se ejecuto), mientras
la evidencia GREEN queda documentada y trazable.

> Corrida de referencia: `mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest,ConnectionApiMapperTest,...`
> (JDK 25, 2026-06-03) -> **Tests run: 13, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS**
> para las clases de prueba de las features 005/006/007.
>
> Nota sobre la metadata JDBC (RF-004 / RF-005): `ConnectionMetadataService` introspecciona
> tablas y procedimientos en vivo contra la base de datos destino y NO tiene clase de prueba
> unitaria dedicada (su salida es insumo de DB_WRITE / DB_EXECUTE_SP en Procesos 003). Su
> evidencia GREEN queda pendiente de una corrida QA dedicada (con BD de prueba).

## RF-001 / T-001
- Comando RED: `mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test`
- Resultado GREEN: GREEN real — ConnectionCatalogServiceTest: Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).

## RF-002 / T-002
- Comando RED: `mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=ConnectionCatalogServiceTest test`
- Resultado GREEN: GREEN real — ConnectionCatalogServiceTest: Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).

## RF-003 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=ConnectionApiMapperTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=ConnectionApiMapperTest test`
- Resultado GREEN: GREEN real — ConnectionApiMapperTest: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).

## RF-004 / T-004
- Comando RED: `mvn -pl platform-app test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app test`
- Resultado GREEN: Pendiente — `ConnectionMetadataService` (metadata JDBC de tablas) no tiene prueba unitaria dedicada; introspecciona en vivo contra la BD destino. GREEN dedicado pendiente de corrida QA con BD de prueba.
- Verificado por: pending (requiere corrida QA dedicada con BD).

## RF-005 / T-005
- Comando RED: `mvn -pl platform-app test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app test`
- Resultado GREEN: Pendiente — `ConnectionMetadataService` (metadata JDBC de procedimientos) no tiene prueba unitaria dedicada; introspecciona en vivo contra la BD destino. GREEN dedicado pendiente de corrida QA con BD de prueba.
- Verificado por: pending (requiere corrida QA dedicada con BD).

## RF-001 / T-006

Frontend (Angular): UI de configuracion de conexiones por motor. `connection-editor` orquesta
`connection-type-form/` (`connection-jdbc-form` para ORACLE/POSTGRESQL/SQLSERVER/MYSQL,
`connection-mongodb-form` para MONGODB); el contrato `configuration_json` por motor lo definen
los providers `core/providers/.../connections/*-connection.provider.ts`.

- Comando RED: `npx nx test connections`
- Resultado RED: No recapturable por reingenieria (UI preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `npx nx test connections`
- Resultado GREEN: GREEN preexistente — specs Angular de la feature pasan (`connection-catalog.store.spec.ts`, `connection-catalog-command.service.spec.ts`, `connection-editor-state.service.spec.ts`).
- Verificado por: corrida nx (pendiente validacion humana).
- Hueco conocido: los forms por motor (`connection-jdbc-form`, `connection-mongodb-form`) NO tienen
  `.spec.ts` dedicado (se ejercitan indirecto via `connection-editor`/stores). Candidato a anadir
  specs por motor (plan de tests frontend).
