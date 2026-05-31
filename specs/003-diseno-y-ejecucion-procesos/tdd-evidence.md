# Evidencia TDD - Diseno y ejecucion de procesos

Feature reconstruida por reingenieria sobre codigo en produccion. El **GREEN de la capa
unitaria esta capturado y es real** (corrida `mvn` del 2026-05-30). El **RED no es
recapturable** (codigo preexistente; capturar un fallo previo romperia codigo funcional,
fuera del alcance). Por eso el ciclo formal RED-GREEN se mantiene `pending` a nivel de
tarea en `spec-tareas.md`.

> Corrida de referencia: `mvn -pl platform-app test` (JDK 25, 2026-05-30) ->
> **Tests run: 64, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS.** Log: `tmp-mvntest.log`.
>
> Nota sobre `CatalogAndExecutionResourceIT`: es `@QuarkusTest` nombrado `*IT`. El patron
> por defecto de surefire excluye `*IT` y el modulo no declara `maven-failsafe-plugin`, asi
> que NO se ejecuta en `mvn test`/`mvn verify`. Ejecutarlo aislado (`-Dtest=...`) colisiona
> con un bean alternativo de `FileReadTaskFastPathTest` (AmbiguousResolution en ArC).
> Capturar su GREEN exige ajustar la configuracion de pruebas/pom, fuera del alcance
> acordado (no tocar codigo/pom existente). Su evidencia GREEN queda pendiente de una
> corrida dedicada.

## RF-001 / T-001
- Comando RED: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado GREEN: Pendiente — IT no auto-ejecutado por la config del modulo (ver nota superior). GREEN no capturado en esta corrida.
- Verificado por: pending (requiere corrida dedicada del IT).

## RF-002 / T-002
- Comando RED: `mvn -pl platform-app -Dtest=DbWriteTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=DbWriteTaskProviderTest test`
- Resultado GREEN: GREEN real — DbWriteTaskProviderTest: Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-002 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=StoredProcedureTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=StoredProcedureTaskProviderTest test`
- Resultado GREEN: GREEN real — StoredProcedureTaskProviderTest: Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-003 / T-004
- Comando RED: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado GREEN: Pendiente — IT no auto-ejecutado por la config del modulo (ver nota superior). GREEN no capturado en esta corrida.
- Verificado por: pending (requiere corrida dedicada del IT).

## RF-004 / T-005
- Comando RED: `mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test`
- Resultado GREEN: GREEN real — StreamingPipelineServiceTest: Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-005 / T-006
- Comando RED: `mvn -pl platform-app -Dtest=FileReadTaskFastPathTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=FileReadTaskFastPathTest test`
- Resultado GREEN: GREEN real — FileReadTaskFastPathTest: Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).
