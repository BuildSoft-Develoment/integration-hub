# Spec tecnica - Diseno y ejecucion de procesos

## Componentes relacionados

- backend: `ProcessDefinitionResource`, `ProcessExecutionResource`
- servicios: `ProcessCatalogService`, `ProcessExecutionService`, `ProcessSchedulerService`
- engine: registries de source, reader y task providers
- persistencia: `ProcessDefinitionRepository`, `ProcessExecutionRepository`, `ProcessTaskExecutionRepository`

## Consideraciones tecnicas

- las tareas `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` y `NOTIFICATION` deben publicar salidas consistentes
- el runtime debe mantener `executionVariables` y variables tecnicas
- el scheduler no debe generar duplicados por reinicio o failover no controlado

## Pruebas tecnicas sugeridas

- ejecucion manual end-to-end
- ejecucion programada
- reproceso y linaje de ejecuciones
- cobertura de salidas dinamicas entre tareas
