# UI Test Cases - Observabilidad y auditoria

> Feature de reingenieria: los tableros de observabilidad/auditoria ya existen en
> `frontend/`. Estos casos documentan la validacion manual de las pantallas reales y
> referencian la cobertura automatizada backend existente.

## Pantallas cubiertas
- Listado de ejecuciones (`GET /api/query/process-executions`).
- Detalle de ejecucion y sus tareas (`.../{processExecutionId}/tasks`).
- Ejecuciones relacionadas / linaje (`.../{processExecutionId}/children`).
- Resumen operativo (`GET /api/query/overview-summary`).
- Eventos de auditoria (`GET /api/query/audit-events`).

## Casos manuales por estado

### Loading / Empty
- [ ] Cada tablero muestra carga; estado vacio cuando no hay datos en el rango/filtro.

### Success
- [ ] Listado de ejecuciones pagina y filtra por estado/proceso/texto (RF-001).
- [ ] Detalle muestra las tareas de una ejecucion con su estado (RF-002).
- [ ] Linaje muestra ejecuciones relacionadas (reproceso) (RF-003).
- [ ] Resumen operativo muestra los agregados correctos (RF-004).
- [ ] Auditoria lista eventos correlacionados por `processExecutionId` (RF-005).

### Error
- [ ] Backend 5xx en cualquier tablero muestra mensaje de error + reintentar.

### Permission denied
- [ ] Rol sin permiso de lectura no accede a los tableros (redirige/403).

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin / operator / auditor | consulta ejecuciones/auditoria | lectura segun permisos |

## Cobertura automatizada (existente, backend)
Trace: `RF-001`..`RF-005`
- `CatalogAndExecutionResourceIT` — consulta de ejecuciones/tareas/linaje/resumen (RF-001..RF-004);
  **GREEN pendiente de corrida dedicada** del IT (ver `tdd-evidence.md`).
- `StreamingPipelineServiceTest` — emision de eventos de auditoria durante la ejecucion (RF-005).
- GREEN unitario real registrado en `tdd-evidence.md`.

## Pendiente
- e2e de UI automatizado sobre los tableros: pendiente de Fase 6.
- Corrida dedicada del IT `CatalogAndExecutionResourceIT` para capturar su GREEN.
