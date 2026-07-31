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
| `processes` | catalogo y editor de procesos | disenar definiciones y ejecutar manualmente | crear, editar, activar, ejecutar | `Platform Admin`, `Integration Admin`, `Operator`, `Payments Operator` |
| `payment-rules` | reglas de validacion de pagos | gestionar perfiles bancarios SWIFT/MT101 por ambiente | crear, editar, activar, importar/exportar | `Platform Admin`, `Integration Admin` |
| `executions` | catalogo de ejecuciones | revisar corridas, tareas y archivos | abrir detalle, navegar hijos, ejecutar acciones sobre archivos | `Operator`, `Payments Operator`, `Auditor` |
| `schedules` | agenda operativa | revisar procesos programados y dispararlos | filtrar, refrescar, ejecutar | `Operator`, `Payments Operator`, `Integration Admin` |
| `audit` | auditoria de eventos | revisar trazabilidad funcional y tecnica | filtrar, inspeccionar eventos | `Auditor`, `Operator`, `Payments Operator` |
| `audit/record-lineage` | linaje por registro | reconstruir la linea de tiempo por hash/fila, `recordId` o `traceId` | buscar, navegar a lote/fragmentos | `Auditor`, `Operator`, `Payments Operator` |
| `audit/spool` | spool de auditoria | monitorear cola asincronica y eventos muertos | refrescar, listar dead letters, reintentar/limpiar solo admin | `Auditor`, `Operator`, `Payments Operator`, `Platform Admin`, `Integration Admin` |
| `swift-mt101/fragments` | lookup de fragmentos MT101 | ubicar fragmentos generados desde una fila origen | buscar por hash/fila, abrir cuarentena | `Auditor`, `Operator`, `Payments Operator` |
| `swift-mt101/quarantine` | cuarentena MT101 | corregir filas, reconstruir correctivos y supervisar PAY correctivo | listar, corregir individual y masivo con planilla, solicitar/ejecutar rebuild | `Auditor`, `Operator`, `Payments Operator`, `Platform Admin`, `Integration Admin` |
| `swift-mt101/pay-conflicts` | conflictos de pago | conciliar contradicciones terminales del money-path | listar abiertos, solicitar y aprobar acknowledge (maker-checker) | `Payments Operator`, `pay-conflict-maker`, `pay-conflict-checker` |
| `swift-mt101/pay-dispatch` | despacho de pagos | ver el estado de despacho por fragmento y su motivo | listar, filtrar, abrir lineage | `Auditor`, `Operator`, `Payments Operator` |
| `executions/async-dlq` | cola muerta asincrona | trabajo del motor que murio tras agotar reintentos | listar, redrive, requeue | `Platform Admin`, `Integration Admin` |

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
> **Las rutas `audit/mt101-*` ya NO son pantallas: son redirecciones legacy.**
> `audit.routes.ts` redirige `audit/mt101-fragments` y `audit/mt101-quarantine` a `/swift-mt101/*`.
> Se conservan porque hay enlaces antiguos, pero **pierden los query params por el camino**: abrir
> la cuarentena requiere `?fragmentSetId=`, y entrando por la ruta vieja ese parametro no llega.
> Al enlazar desde documentacion o desde la UI, usar siempre la ruta canonica `/swift-mt101/*`.

- Las rutas `audit/spool` y `swift-mt101/quarantine` son operacion gobernada:
  deben diferenciar consulta de mutacion y exponer severidad, permiso requerido
  y evidencia esperada para acciones como `retry`, `cleanup`, rebuild y PAY.
- El bloque `/audit/*` se presenta como workspace interno: eventos, linaje y
  fragmentos son superficies de consulta; spool y cuarentena son superficies de
  operacion gobernada.

## Regla documental

Si una nueva ruta se vuelve estable en el frontend, debe agregarse aqui junto con su objetivo y dependencia dentro del recorrido de usuario.
