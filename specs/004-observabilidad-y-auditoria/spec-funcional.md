---
origin: reingenieria
---

# Spec funcional - Observabilidad y auditoria

## Objetivo

Dar visibilidad operativa y trazabilidad completa sobre procesos, tareas y archivos procesados.

## Actores

- `operator`
- `auditor`
- `platform-admin`

## Flujo principal

1. Consultar ejecuciones.
2. Revisar auditoria y trazas.
3. Identificar errores y reintentos.
4. Navegar a overview y detalles relacionados.

## Requerimientos

- RF-001 consultar ejecuciones y auditoria por filtros.
- RF-002 mostrar detalle por tarea y por archivo procesado.
- RF-003 navegar a overview y a ejecuciones relacionadas (hijas/reproceso).
- RF-004 exponer un resumen operativo agregado en `GET /api/query/overview-summary`.
- RF-005 correlacionar evidencia tecnica y funcional por `processExecutionId`.
- RF-006 publicar auditoria de forma asincrona mediante broker obligatorio
  (`Kafka` por defecto, abierto a JMS/RabbitMQ/Redis).
- RF-007 consultar trazabilidad E2E por registro usando claves de archivo, fila,
  hash de negocio y referencias de pago (`:20:`, `:21:`, UETR, archive/gateway).
- RF-008 operar el spool de auditoria asincrona: ver backlog, eventos en
  `DEAD`, reprocesar eventos fallidos y limpiar eventos `SENT` por retencion.
- RF-009 ubicar el fragmento MT101 generado a partir de una fila origen de
  archivo/staging para diagnostico E2E de pagos masivos.
- RF-010 diferenciar en UI las operaciones auditables criticas de las vistas de
  consulta, mostrando severidad, permiso requerido y evidencia operacional
  esperada antes de acciones sobre spool, cuarentena, rebuild y PAY; las
  subrutas `/audit/*` deben compartir una navegacion de workspace que separe
  consulta de operacion gobernada.

## Reglas de negocio

- la correlacion base de proceso es `processExecutionId`
- la correlacion de registro usa `traceId`, `recordId` y claves operativas
  indexadas; datos sensibles deben consultarse por hash
- la evidencia debe incluir auditoria persistida, trazas y estado por tarea
- `platform-app` no persiste el read-model final de auditoria; publica eventos y
  `audit-consumer` los materializa
- el usuario `auditor` consulta pero no modifica catalogos ni procesos
- `platform-admin` e `integration-admin` pueden reprocesar eventos `DEAD` y
  limpiar `SENT`; `operator`/`auditor` solo consultan
- la consulta de fragmentos MT101 por fila origen debe usar indices por
  `source_table`, rango de filas y ejecucion cuando aplique
- las acciones de operacion gobernada (`retry`, `cleanup`, correccion de
  staging, rebuild y PAY) deben declarar su riesgo operacional en la UI; las
  acciones de consulta no deben compartir el mismo tratamiento visual
- las acciones PAY y rebuild mantienen segregacion maker-checker; la UI debe
  exponer esa expectativa sin reemplazar la validacion backend

## Criterios de aceptacion

- se pueden consultar ejecuciones y auditoria por filtros
- existen datos por archivo y por tarea
- overview consolida metricas de salud operativa
- los eventos de auditoria viajan por MQ y los poison messages quedan en DLQ
- la vista de trazabilidad permite buscar por ejecucion, registro, archivo/fila y
  referencias SWIFT/payment
- el spool muestra resumen operativo y permite reprocesar filas `DEAD` sin
  editar datos manualmente
- desde una fila origen se puede identificar `fragmentSetId`, `:20:`, rango,
  indice/total y estado del MT101 generado
- las rutas `/audit/spool` y `/audit/mt101-quarantine` muestran el contrato de
  riesgo operativo de las acciones sensibles: severidad, permiso requerido y
  evidencia como motivo, ticket, confirmacion doble, locking optimista o
  historial append-only segun corresponda
- las rutas `/audit`, `/audit/record-lineage`, `/audit/mt101-fragments`,
  `/audit/spool` y `/audit/mt101-quarantine` comparten navegacion interna y
  etiquetan cada superficie como consulta u operacion gobernada
- (UI) hay vistas de listado/filtro (`execution-list`/`audit-list` + toolbars), detalle por tarea y
  archivo (`execution-editor` + `execution-task-list`/`execution-files-panel`), linaje de reproceso
  (`execution-lineage`) y resumen operativo (`overview-metric-card`/`overview-table-card`)

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
