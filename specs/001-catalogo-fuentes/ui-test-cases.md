# UI Test Cases - Catalogo de fuentes

> Feature de reingenieria: la UI admin de catalogo de fuentes ya existe en `frontend/`.
> Estos casos documentan la validacion manual de las pantallas reales y referencian la
> cobertura automatizada backend existente. Los e2e de UI quedan marcados pendientes donde
> aun no existe automatizacion.

## Pantallas cubiertas
- Listado de fuentes (`GET /api/source-definitions`).
- Alta/edicion de fuente (`POST` / `PUT /api/source-definitions/{sourceDefinitionId}`).
- Prueba de conectividad (`POST /api/source-definitions/test`).
- Activar/desactivar (`POST /api/source-definitions/{sourceDefinitionId}/activation/{active}`).

## Casos manuales por estado

### Loading
- [ ] Al abrir el listado, se muestra indicador de carga mientras resuelve el GET.

### Empty
- [ ] Sin fuentes configuradas, el listado muestra estado vacio + CTA "Crear fuente".

### Success
- [ ] Crear una fuente FILE valida persiste y aparece en el listado (RF-001).
- [ ] Editar una fuente actualiza sus datos (RF-002).
- [ ] "Probar" una fuente alcanzable devuelve resultado OK (RF-005).
- [ ] Activar/desactivar cambia el estado visible de la fuente (RF-002).

### Error / Validation
- [ ] `configurationJson` invalido muestra error de validacion y no persiste (RF-003).
- [ ] Referencia `${secret:...}` inexistente o secreto no resoluble muestra error (RF-004).
- [ ] Backend 5xx muestra mensaje de error + opcion de reintentar.

### Permission denied
- [ ] Rol sin permiso de administracion no ve los botones de crear/editar/activar.

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin | crea/edita/activa fuente | exito |
| auditor | consulta listado | solo lectura (sin acciones de escritura) |

## Cobertura automatizada (existente, backend)
Trace: `RF-001`..`RF-005`
- `SourceCatalogServiceTest` — alta/consulta de fuentes (RF-001, RF-002).
- `JsonConfigurationMapperTest` — validacion de `configurationJson` (RF-003).
- `FileVaultSecretValueProviderTest` — resolucion de secretos `${secret:...}` (RF-004).
- `FilesystemSourceProviderTest` — lectura/prueba de fuente FILE (RF-005).
- GREEN real registrado en `tdd-evidence.md` (corrida `mvn -pl platform-app test`).

## Pendiente
- e2e de UI automatizado (Playwright/Cypress) sobre las pantallas admin: pendiente de
  definicion en Fase 6 (no existe automatizacion de UI aun).
