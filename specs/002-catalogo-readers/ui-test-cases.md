# UI Test Cases - Catalogo de readers

> Feature de reingenieria: la UI admin de catalogo de readers ya existe en `frontend/`.
> Estos casos documentan la validacion manual de las pantallas reales y referencian la
> cobertura automatizada backend existente.

## Pantallas cubiertas
- Listado de readers (`GET /api/reader-definitions`).
- Alta/edicion de reader (`POST` / `PUT /api/reader-definitions/{readerDefinitionId}`).
- Activar/desactivar (`POST /api/reader-definitions/{readerDefinitionId}/activation/{active}`).

## Casos manuales por estado

### Loading / Empty
- [ ] Listado muestra carga mientras resuelve el GET.
- [ ] Sin readers, estado vacio + CTA "Crear reader".

### Success
- [ ] Crear un reader CSV con layout valido persiste y aparece en el listado (RF-001).
- [ ] Crear readers TXT y XLSX con su layout respectivo (RF-002, RF-003).
- [ ] Editar un reader actualiza su configuracion (RF-002).
- [ ] Activar/desactivar cambia el estado visible (RF-004).
- [ ] El listado queda disponible para el disenador de procesos (RF-005).

### Error / Validation
- [ ] Layout invalido para el formato declarado muestra error y no persiste.
- [ ] Backend 5xx muestra mensaje de error + reintentar.

### Permission denied
- [ ] Rol sin permiso no ve acciones de escritura.

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin | crea/edita/activa reader | exito |
| auditor | consulta listado | solo lectura |

## Cobertura automatizada (existente, backend)
Trace: `RF-001`..`RF-005`
- `CsvReaderProviderTest`, `TxtReaderProviderTest`, `ExcelReaderProviderTest` — lectura por formato.
- `ReaderFieldSupportTest` — soporte de campos/layout.
- GREEN real registrado en `tdd-evidence.md`.

## Pendiente
- e2e de UI automatizado sobre las pantallas admin: pendiente de Fase 6.
