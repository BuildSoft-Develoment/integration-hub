# UI Test Cases - Diseno y ejecucion de procesos

> Feature de reingenieria: el disenador de procesos y el disparo de ejecuciones ya existen
> en `frontend/`. Estos casos documentan la validacion manual de las pantallas reales y
> referencian la cobertura automatizada backend existente.

## Pantallas cubiertas
- Listado de procesos (`GET /api/process-definitions`).
- Diseno/edicion de proceso con tareas ordenadas (`POST` / `PUT /api/process-definitions/{processDefinitionId}`).
- Activar/desactivar (`POST /api/process-definitions/{processDefinitionId}/activation/{active}`).
- Consulta de ejecuciones disparadas (`GET /api/query/process-executions`).

## Casos manuales por estado

### Loading / Empty
- [ ] Listado de procesos muestra carga; estado vacio con CTA "Crear proceso".

### Success
- [ ] Crear un proceso con tareas ordenadas persiste el flujo (RF-001).
- [ ] Anadir una tarea DbWrite valida al proceso (RF-002).
- [ ] Activar un proceso lo habilita para ejecucion (RF-003).
- [ ] Disparar ejecucion manual genera un `process_execution` consultable (RF-004).
- [ ] El listado de ejecuciones refleja el linaje/estado (RF-005).

### Error / Validation
- [ ] Proceso sin tareas o con tarea invalida muestra error y no persiste.
- [ ] Intentar ejecutar un proceso inactivo es rechazado.

### Permission denied
- [ ] Rol sin permiso no ve acciones de diseno/activacion/ejecucion.

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin | disena/activa/ejecuta proceso | exito |
| operator | dispara ejecucion de proceso activo | exito |
| auditor | consulta ejecuciones | solo lectura |

## Cobertura automatizada (existente, backend)
Trace: `RF-001`..`RF-005`
- `DbWriteTaskProviderTest`, `StoredProcedureTaskProviderTest` — tipos de tarea (RF-002).
- `StreamingPipelineServiceTest` — ejecucion del pipeline (RF-004).
- `FileReadTaskFastPathTest` — fast-path de lectura (RF-005).
- `CatalogAndExecutionResourceIT` — flujo catalogo+ejecucion extremo a extremo (RF-001, RF-003);
  **GREEN pendiente de corrida dedicada** del IT (ver `tdd-evidence.md`).
- GREEN unitario real registrado en `tdd-evidence.md`.

## Pendiente
- e2e de UI automatizado sobre el disenador de procesos: pendiente de Fase 6.
- Corrida dedicada del IT `CatalogAndExecutionResourceIT` para capturar su GREEN.
