# Evidencia TDD - Observabilidad y auditoria

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
- Comando RED: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado GREEN: Pendiente — IT no auto-ejecutado por la config del modulo (ver nota superior). GREEN no capturado en esta corrida.
- Verificado por: pending (requiere corrida dedicada del IT).

## RF-003 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado GREEN: Pendiente — IT no auto-ejecutado por la config del modulo (ver nota superior). GREEN no capturado en esta corrida.
- Verificado por: pending (requiere corrida dedicada del IT).

## RF-004 / T-004
- Comando RED: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente).
- Comando GREEN: `mvn -pl platform-app -Dtest=CatalogAndExecutionResourceIT test`
- Resultado GREEN: Pendiente — IT no auto-ejecutado por la config del modulo (ver nota superior). GREEN no capturado en esta corrida.
- Verificado por: pending (requiere corrida dedicada del IT).

## RF-005 / T-005
- Comando RED: `mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=StreamingPipelineServiceTest test`
- Resultado GREEN: GREEN real — StreamingPipelineServiceTest: Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 (2026-05-30).
- Verificado por: corrida automatizada mvn 2026-05-30 (pendiente validacion humana).

## RF-001 / T-006

Frontend (Angular): UI de observabilidad. Componentes anotados `@trace` (recogidos por
`harvest-trace` desde `frontend/`): `execution-list`/`audit-list` (`@trace RF-001`),
`execution-editor` (`@trace RF-002`), `execution-lineage` (`@trace RF-003`),
`overview-table-card` (`@trace RF-004`), `execution-editor-summary` (`@trace RF-005`).

- Comando RED: `npx nx test executions`
- Resultado RED: No recapturable por reingenieria (UI preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `npx nx test executions`
- Resultado GREEN: GREEN preexistente — specs Angular de la feature pasan (`execution-catalog.store.spec.ts`, `execution-catalog-query.store.spec.ts`, `execution-detail.store.spec.ts`, `execution-editor.store.spec.ts`, `execution-files-panel.store.spec.ts`).
- Verificado por: corrida nx (pendiente validacion humana).
- Hueco conocido: las vistas de `audit`/`overview` se ejercitan via sus propios stores
  (`audit.store.spec.ts`, `overview.store.spec.ts`); cobertura por componente es candidata a
  ampliacion (plan de tests frontend).
