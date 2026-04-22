# Mapa de pantallas y rutas

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Journey de diseno, ejecucion y seguimiento](../journeys/journey-diseno-ejecucion-y-seguimiento.md)
- Siguiente: [Pantalla de catalogos y configuracion](pantalla-catalogos-y-configuracion.md)
<!-- nav-guided:end -->

## Objetivo

Mapear las rutas reales del frontend y su responsabilidad UX dentro del producto.

## Rutas principales

| Ruta | Pantalla | Proposito principal | Acciones clave | Roles principales |
| --- | --- | --- | --- | --- |
| `overview` | resumen operativo | ver salud general, ejecuciones recientes y fallos | navegar a pantallas de detalle | `Operator`, `Auditor`, `Integration Admin` |
| `sources` | catalogo de fuentes | administrar origenes de entrada | crear, editar, probar, activar | `Platform Admin`, `Integration Admin` |
| `connections` | catalogo de conexiones | administrar destinos o conectores auxiliares | crear, editar, probar, activar | `Platform Admin`, `Integration Admin` |
| `readers` | catalogo de readers | configurar parsing por formato | crear, editar, activar | `Platform Admin`, `Integration Admin` |
| `processes` | catalogo y editor de procesos | disenar definiciones y ejecutar manualmente | crear, editar, activar, ejecutar | `Integration Admin`, `Operator` |
| `executions` | catalogo de ejecuciones | revisar corridas, tareas y archivos | abrir detalle, navegar hijos, ejecutar acciones sobre archivos | `Operator`, `Auditor` |
| `schedules` | agenda operativa | revisar procesos programados y dispararlos | filtrar, refrescar, ejecutar | `Operator`, `Integration Admin` |
| `audit` | auditoria de eventos | revisar trazabilidad funcional y tecnica | filtrar, inspeccionar eventos | `Auditor`, `Operator` |

## Patron de navegacion

- El menu lateral organiza el ingreso por dominio.
- La mayoria de rutas de gestion usan `toolbar + list/table + drawer`.
- Las acciones de detalle se concentran en el panel lateral para no romper el contexto del listado.
- La navegacion entre operacion y auditoria debe permitir saltar rapido desde problema detectado a evidencia.

## Relacion entre pantallas

- `overview` deriva a `executions` y `audit` cuando hay alertas o fallos.
- `processes` depende de la existencia previa de `sources`, `connections` y `readers`.
- `schedules` se entiende como vista operativa de procesos ya definidos.
- `executions` y `audit` cierran el recorrido de trazabilidad y soporte.

## Regla documental

Si una nueva ruta se vuelve estable en el frontend, debe agregarse aqui junto con su objetivo y dependencia dentro del recorrido de usuario.
