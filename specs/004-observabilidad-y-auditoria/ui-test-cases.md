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
- Trazabilidad de registro (`/audit/record-lineage`).
- Spool de auditoria (`/audit/spool`).
- Fragmentos MT101 por fila (`/audit/mt101-fragments`).
- Cuarentena MT101 (`/audit/mt101-quarantine`).

## Casos manuales por estado

### Loading / Empty
- [ ] Cada tablero muestra carga; estado vacio cuando no hay datos en el rango/filtro.

### Success
- [ ] Listado de ejecuciones pagina y filtra por estado/proceso/texto (RF-001).
- [ ] Detalle muestra las tareas de una ejecucion con su estado (RF-002).
- [ ] Linaje muestra ejecuciones relacionadas (reproceso) (RF-003).
- [ ] Resumen operativo muestra los agregados correctos (RF-004).
- [ ] Auditoria lista eventos correlacionados por `processExecutionId` (RF-005).
- [ ] Spool diferencia acciones de consulta (`refrescar`, `ver DEAD`) de acciones
  gobernadas (`retry`, `cleanup`) y muestra permiso/evidencia (RF-008/RF-010).
- [ ] Cuarentena MT101 muestra riesgo operacional para construir cuarentena,
  solicitar/aprobar/ejecutar rebuild, corregir staging y PAY correctivo
  (RF-010).
- [ ] Las subrutas `/audit/*` cargan sin errores de consola, mantienen landmark,
  idioma y botones con nombre accesible.
- [ ] Las subrutas `/audit/*` comparten navegacion interna y distinguen
  superficies de consulta vs operacion gobernada (RF-010).

### Error
- [ ] Backend 5xx en cualquier tablero muestra mensaje de error + reintentar.

### Permission denied
- [ ] Rol sin permiso de lectura no accede a los tableros (redirige/403).

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin / operator / auditor | consulta ejecuciones/auditoria | lectura segun permisos |
| platform-admin / integration-admin | opera spool/cuarentena critica | ve acciones gobernadas segun capacidad y evidencia requerida |
| auditor | consulta spool/linaje/fragmentos | no ejecuta acciones de mutacion |

## Cobertura automatizada (existente, backend)
Trace: `RF-001`..`RF-005`
- `CatalogAndExecutionResourceIT` — consulta de ejecuciones/tareas/linaje/resumen (RF-001..RF-004);
  **GREEN pendiente de corrida dedicada** del IT (ver `tdd-evidence.md`).
- `StreamingPipelineServiceTest` — emision de eventos de auditoria durante la ejecucion (RF-005).
- GREEN unitario real registrado en `tdd-evidence.md`.
- `audit-operation-risk.spec.ts` - contrato UI de riesgo operacional para
  acciones auditables (RF-010).
- `audit-workspace-nav.component.spec.ts` - navegacion comun del workspace
  audit y clasificacion consulta/operacion (RF-010).
- `audit-spool.component.spec.ts` y `mt101-quarantine.component.spec.ts` -
  exposicion del contrato en pantallas criticas (RF-010).

## Pendiente
- e2e de UI automatizado sobre los tableros: pendiente de Fase 6.
- Corrida dedicada del IT `CatalogAndExecutionResourceIT` para capturar su GREEN.
- Evidencia visual/a11y autenticada de `/audit/*` debe actualizarse cuando el
  stack local este levantado.
