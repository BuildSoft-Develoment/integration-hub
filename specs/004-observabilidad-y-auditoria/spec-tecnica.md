# Spec tecnica - Observabilidad y auditoria

## Componentes relacionados

- frontend: `Operations Console`, vista `overview`
- backend: `ExecutionQueryResource`
- servicios: `ExecutionQueryService`, `AuditService`, `ProcessedSourceFileService`
- persistencia: `AuditEventRepository`, `ProcessedSourceFileRepository`

## Consideraciones tecnicas

- spans por proceso y por tarea
- linaje de reproceso en `process_execution`
- endpoints para detalle y ejecuciones hijas
- resumen operativo en `GET /api/query/overview-summary`

## Pruebas tecnicas sugeridas

- consulta por filtros
- navegacion a detalle de ejecucion
- consistencia entre auditoria, overview y trazas
