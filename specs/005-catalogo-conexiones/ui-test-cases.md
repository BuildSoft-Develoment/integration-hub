# UI Test Cases - Catalogo de conexiones

> Feature de reingenieria: la UI admin de conexiones ya existe en `frontend/libs/features/connections`.
> Estos casos documentan la validacion manual de las pantallas reales. No hay clase de prueba
> backend dedicada (cobertura automatizada pendiente de Fase 6).

## Pantallas cubiertas
- Listado de conexiones (`GET /api/connection-definitions`).
- Alta/edicion (`POST` / `PUT /api/connection-definitions/{connectionDefinitionId}`).
- Prueba de conectividad (`POST /test`).
- Activar/desactivar (`POST /{connectionDefinitionId}/activation/{active}`).
- Selector de tabla/rutina por metadata (consumido por los forms de tarea DB de procesos).

## Casos manuales por estado

### Loading / Empty
- [ ] Listado muestra carga; estado vacio con CTA "Crear conexion".

### Success
- [ ] Crear una conexion por motor (`ORACLE`, `POSTGRESQL`, `SQLSERVER`, `MYSQL`, `MONGODB`) (RF-001).
- [ ] `Probar` una conexion alcanzable devuelve OK (RF-002).
- [ ] Activar/desactivar cambia el estado visible (RF-002).
- [ ] Introspeccion: listar esquemas/tablas/columnas de una conexion relacional (RF-004).
- [ ] Introspeccion: listar procedimientos/funciones y parametros (RF-005).

### Error / Validation
- [ ] Configuracion invalida o `/test` fallido muestra error y no permite activar.
- [ ] Para `MONGODB`, las acciones de rutinas (procedures/functions) no se ofrecen (RF-005).
- [ ] Secreto `${secret:...}` no resoluble muestra error sin exponer credenciales (RF-003).

### Permission denied
- [ ] Rol sin permiso de administracion no ve crear/editar/activar; `auditor` solo lectura/metadata.

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin | crea/edita/activa/prueba conexion | exito |
| auditor | consulta catalogo y metadata | solo lectura |

## Cobertura automatizada
Trace: `RF-001`..`RF-005`
- Backend: sin clase de prueba dedicada a la fecha (cobertura pendiente de Fase 6).
- e2e de UI: pendiente de Fase 6.
