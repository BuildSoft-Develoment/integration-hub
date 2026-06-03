# Evidencia TDD - Tema del sistema

Feature reconstruida por reingenieria sobre codigo en produccion. El **GREEN esta capturado
y es real** (corrida `mvn` del 2026-06-03, ver abajo). El **RED no es recapturable** (codigo
preexistente; capturar un fallo previo romperia codigo funcional, fuera del alcance
acordado). Por eso el ciclo formal RED-GREEN se mantiene `pending` a nivel de tarea en
`spec-tareas.md` (no se reclama un ciclo TDD que no se ejecuto), mientras la evidencia GREEN
queda documentada y trazable.

> Corrida de referencia: `mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest,SystemThemeSettingApiMapperTest,...`
> (JDK 25, 2026-06-03) -> **Tests run: 13, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS**
> para las clases de prueba de las features 005/006/007.
>
> Nota sobre el frontend: el tema del sistema vive en la UI compartida (`shared/ui/app-layout`
> + `core/services/ui`, `app-preferences.facade`/`theme.service`) y NO tiene un proyecto nx
> propio ni `.spec.ts` dedicado; su cobertura frontend queda pendiente de un plan de tests UI.

## RF-001 / T-001
- Comando RED: `mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test`
- Resultado GREEN: GREEN real — SystemThemeSettingServiceTest: Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).

## RF-002 / T-002
- Comando RED: `mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=SystemThemeSettingServiceTest test`
- Resultado GREEN: GREEN real — SystemThemeSettingServiceTest: Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).

## RF-003 / T-003
- Comando RED: `mvn -pl platform-app -Dtest=SystemThemeSettingApiMapperTest test`
- Resultado RED: No recapturable por reingenieria (codigo preexistente; capturar RED romperia codigo funcional).
- Comando GREEN: `mvn -pl platform-app -Dtest=SystemThemeSettingApiMapperTest test`
- Resultado GREEN: GREEN real — SystemThemeSettingApiMapperTest: Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 (2026-06-03).
- Verificado por: corrida automatizada mvn 2026-06-03 (pendiente validacion humana).
