# Caso QA - Observabilidad y auditoria

## Casos funcionales

| Caso | Precondicion | Accion | Resultado esperado |
|---|---|---|---|
| QA-004-001 consultas base | Existen ejecuciones procesadas | Consultar ejecuciones y auditoria por filtros | La UI muestra lista, detalle de tarea, archivos y payload de auditoria. |
| QA-004-002 correlacion overview | Existen ejecuciones con estados mixtos | Abrir overview y luego detalle relacionado | Los conteos agregados coinciden con ejecuciones/auditoria. |
| QA-004-003 lineage registro | Existen eventos `RECORD` | Buscar por `recordId`, `traceId`, archivo/fila o `:20:` | Se muestra linea E2E ordenada por etapa. |
| QA-004-004 spool summary | Existen filas en `audit_spool` | Abrir `/audit/spool` | Se muestran conteos `PENDING`, `IN_FLIGHT`, `SENT`, `DEAD`. |
| QA-004-005 reproceso DEAD | Existe fila `DEAD` | Ejecutar reproceso desde UI/API | La fila vuelve a `PENDING`, limpia `deadAt/deadReason` y queda elegible para relay. |
| QA-004-006 cleanup SENT | Existen filas `SENT` antiguas | Ejecutar cleanup con retencion/limite | Se eliminan hasta `limit` filas anteriores al cutoff. |
| QA-004-007 MT101 por fila | Existe lote `mt101_build_fragment` | Buscar `recordNumber` y opcionalmente ejecucion/tabla | Se obtiene `fragmentSetId`, rango, `:20:`, indice/total y estado. |

## Casos tecnicos

| Caso | Comando | Resultado esperado |
|---|---|---|
| QA-004-T001 consumer batch | `mvn -q -pl audit-consumer -am test` | PASS con PROCESS, RECORD y poison en batch. |
| QA-004-T002 build backend | `mvn -q -pl platform-contract,platform-app,audit-consumer -DskipTests compile` | PASS. |
| QA-004-T003 frontend | `cmd.exe /c npx nx test web --skip-nx-cache` | PASS. |
