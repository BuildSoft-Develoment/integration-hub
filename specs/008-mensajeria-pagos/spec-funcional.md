---
origin: nuevo
---

# Spec funcional - Mensajeria de pagos

## Objetivo

Permitir que los procesos del motor (spec 003) construyan, validen, persistan,
despachen, confirmen y reconcilien mensajes de pagos en los estandares SWIFT FIN,
ISO 20022 y Open Banking, mediante task types de dominio registrables via SPI.

## Alcance

Vertical de mensajeria de pagos con sub-catalogos por estandar:

- `swift/`: MT101 (sprint 1), MT103, MT202, MT900/MT910, MT940/MT942 (evolutivo).
- `iso20022/`: `pain.001`/`pain.002`, `pacs.008`, `camt.053`/`camt.054` (evolutivo).
- `openbanking/`: PSD2/Open Banking APIs (PISP, AISP) (evolutivo).

El sprint 1 entrega el sub-catalogo `swift/` MT101 outbound completo.

## Actores

- `integration-admin`: configura connection del gateway/sftp del banco, reader
  `swift-mt`, definicion de proceso con task types de pagos.
- `payments-operator` (rol nuevo, ver ADR-003 RBAC): ejecuta y supervisa pipelines
  de pagos; no edita catalogos del motor.
- `compliance-officer` (lectura): consulta `mt101_archive`, reportes NVR, conciliacion.
- `auditor` (lectura): igual que `compliance-officer` con alcance extendido a logs.

## Flujo principal (outbound MT101, sprint 1)

1. Disenar proceso con la cadena `FILE_READ -> MT101_BUILD -> MT101_VALIDATE ->
   MT101_ARCHIVE -> MT101_PAY -> MT101_STATUS -> NOTIFICATION` para archivos
   pequenos/medianos, o `FILE_READ -> DB_WRITE(staging) -> MT101_BUILD_FROM_TABLE
   -> MT101_VALIDATE -> MT101_ARCHIVE -> MT101_PAY -> NOTIFICATION` para cargas
   masivas.
2. Configurar header MT101 (envelope, sequence A) y mappings de transacciones
   (sequence B) sobre los campos del reader.
3. Ejecutar manual o programado.
4. Revisar resultado: archivo en `mt101_archive`, estado en `mt101_confirmation`,
   excepciones en `mt101_reconciliation_exception`.
5. Reprocesar rechazos con `MT101_REPAIR` (fase 3).

## Flujo principal (inbound, fase 2)

1. Disenar proceso `FILE_READ(reader=swift-mt) -> MT101_PARSE -> MT101_VALIDATE ->
   MT101_ROUTE -> DB_WRITE -> NOTIFICATION`.
2. Reader `swift-mt` (vive en catalogo 002) descompone blocks y tags; no interpreta
   semantica SWIFT.
3. `MT101_PARSE` interpreta Sequence A/B y normaliza al modelo de dominio.

## Requerimientos

### Catalogo de task types (sprint 1, sub-catalogo `swift/`)

- RF-001 task type `MT101_BUILD` compone uno o varios mensajes MT101 a partir de
  un header logico y N transacciones (records o table), en formato `JSON`, `XML` o
  `FIN` configurable.
- RF-002 task type `MT101_VALIDATE` aplica reglas de validacion del estandar
  (NVR SWIFT) como **catalogo parametrizable**, sin enumerar codigos especificos
  en este spec; clasifica issues por severidad (`ERROR`, `WARNING`, `INFO`).
- RF-003 task type `MT101_ARCHIVE` persiste el `raw_payload` inmutable con hash
  SHA-256, timestamp y politica de retencion configurable.
- RF-004 task type `MT101_PAY` despacha el mensaje al banco por el transporte
  configurado (`REST`, `SFTP`) con idempotencia por `sendersReference` y politica
  de retry. `MQ` queda como extension futura hasta que exista provider backend.
- RF-022 task type `MT101_BUILD_FROM_TABLE` construye MT101 desde una tabla de
  staging paginada, persiste fragmentos por `fragmentSetId` y permite procesar
  archivos de mas de 1,000,000 registros sin cargar todos los records ni todos
  los mensajes en memoria.

### Catalogo de task types (fase 2-3)

- RF-005 task type `MT101_STATUS` recibe (mode `callback`) o pollea (mode `poll`)
  confirmaciones MT900/MT910 del banco; soporta tareas long-running del motor.
- RF-006 task type `MT101_RECONCILE` cruza N:N mensajes enviados contra
  confirmaciones recibidas en una ventana temporal y publica excepciones.
- RF-007 task type `MT101_ROUTE` clasifica transacciones por reglas de negocio
  (book-transfer interna vs MT103 saliente vs clearing domestico).
- RF-008 task type `MT101_PARSE` interpreta MT101 entrante (de archivo via reader
  `swift-mt` o embebido en otro payload) y normaliza al modelo de dominio.
- RF-009 task type `MT101_SPLIT` particiona un MT101 logico en N fragmentos
  hermanos cuando excede limites de tamano o cuota del banco; ajusta `:28D:`.
- RF-010 task type `MT101_REPAIR` reprocesa rechazos aplicando correcciones
  configurables sin volver a leer el archivo origen.

### Catalogo de reglas

- RF-011 catalogo de reglas SWIFT/NVR cargable desde fuente licenciada
  (FIN UG, guia bancaria o configuracion del cliente); cada regla declara
  `code`, `severity`, `appliesTo` y predicado.
- RF-012 catalogo de schemas ISO 20022 cargable desde XSD oficiales (evolutivo,
  fase 2+).
- RF-023 el catalogo de reglas de pago expone API y pantalla admin para listar,
  crear, editar, activar/desactivar, importar y exportar perfiles por banco,
  manteniendo las reglas reales como datos del ambiente.

### Modelo de dominio

- RF-013 tablas `mt101_archive`, `mt101_confirmation`,
  `mt101_validation_issue`, `mt101_reconciliation_exception`,
  `mt101_build_fragment` con sus indices y constraints (UNIQUE por
  `sender_lt + senders_reference + year` para idempotencia de archivo, UNIQUE por
  `fragmentSetId + fragmentIndex` para reproceso de fragmentos).
- RF-014 columna `raw_payload` cifrable a nivel de columna via `${secret:...}`.
- RF-015 lineage por UETR (campo `{121:}` del block 3) cuando el mensaje lo trae,
  ademas del `processExecutionId` del motor.

### Transportes

- RF-016 transporte `REST`: reusa el bloque comun `HttpRequestSupport` (ADR-005),
  soporta `authType: login-request` para OAuth/STS, `Idempotency-Key` por mensaje.
- RF-017 transporte `SFTP`: usa una conexion del catalogo 005, upload con
  extension temporal y rename atomico, `fileMode` configurable.
- RF-018 transporte `MQ`: extension futura; no forma parte del contrato ejecutable
  actual.

### Seguridad y compliance

- RF-019 rol nuevo `payments-operator` con permisos de ejecucion sobre procesos
  del catalogo 008; sin permisos de edicion del catalogo del motor.
- RF-020 enmascarado en logs de campos sensibles del payload (cuentas, nombres);
  no aplica al `raw_payload` archivado.
- RF-021 retencion configurable de `mt101_archive` (por defecto 3650 dias para
  cumplimiento bancario tipico); cifrado de columna obligatorio para entornos `prod`.

## Reglas de negocio

- Una transaccion del archivo de entrada genera exactamente una entrada en
  Sequence B del MT101 resultante.
- Para cargas masivas, una transaccion del archivo de entrada se conserva primero
  como fila de staging y luego se agrupa en fragmentos MT101 configurados por
  `maxTransactionsPerMessage` y `maxBytesPerMessage`.
- El campo `:50a:` Ordering Customer va en Sequence A xor en cada Sequence B,
  nunca en ambas (regla del estandar; implementada como una de las reglas del
  catalogo NVR).
- `MT101_BUILD` declara `debitAccountMode`: `singleDebit` coloca `:50a:` en
  Sequence A; `multipleDebit` y `subsidiary` obligan a mapear `:50a:` por cada
  transaccion en Sequence B.
- Las referencias `:20:` y `:21:` no se truncan silenciosamente; si exceden 16
  caracteres, la tarea falla o se corrige explicitamente con `MT101_REPAIR`.
- Un mensaje rechazado por `MT101_VALIDATE` con `severity=ERROR` no se persiste
  en `mt101_archive` ni se despacha; queda en `mt101_validation_issue`.
- `MT101_VALIDATE` no debe publicar todos los issues de cargas masivas en el
  output; publica contadores completos y una muestra configurable, y persiste
  todos los issues cuando `publishIssuesTo` esta configurado.
- La idempotencia se basa en `(sender_lt, senders_reference, year_of_execution)`;
  un mensaje con la misma clave se rechaza al insertarse en `mt101_archive`.
- `MT101_PAY` con transporte `REST` debe enviar header `Idempotency-Key` igual
  al `senders_reference`.
- `MT101_VALIDATE`, `MT101_ARCHIVE` y `MT101_PAY` pueden consumir `records` en
  memoria o una referencia persistida `{fragmentSetId, table}` producida por
  `MT101_BUILD_FROM_TABLE`; al avanzar, actualizan el estado del fragmento
  (`BUILT`, `ARCHIVED`, `SENT`, `REJECTED`) para habilitar reproceso operativo.
- El reader `swift-mt` (catalogo 002) **no interpreta** Sequence A/B ni aplica NVR;
  esa responsabilidad es de `MT101_PARSE` (catalogo 008).
- Solo perfiles `payments-operator` y superiores ejecutan procesos del catalogo 008
  en entornos `prod`.

## Criterios de aceptacion

- Existen task providers registrables `MT101_VALIDATE`, `MT101_BUILD`,
  `MT101_ARCHIVE`, `MT101_PAY` (sprint 1) y los restantes en sus sprints.
- El motor (spec 003) consume estos task types via SPI sin conocer su semantica.
- Un proceso `FILE_READ -> MT101_BUILD -> MT101_VALIDATE -> MT101_ARCHIVE ->
  MT101_PAY -> NOTIFICATION` ejecuta end-to-end con un archivo de prueba.
- Un proceso `FILE_READ -> DB_WRITE -> MT101_BUILD_FROM_TABLE -> MT101_VALIDATE
  -> MT101_ARCHIVE -> MT101_PAY -> NOTIFICATION` procesa una carga masiva por
  paginas y deja fragmentos persistidos reprocesables por `fragmentSetId`.
- El catalogo de reglas SWIFT/NVR carga desde una fuente parametrizable; el spec
  no enumera codigos.
- El catalogo de perfiles bancarios permite promocionar reglas por import/export
  entre dev, homologacion y produccion, sin deploy de codigo.
- (UI) cada task type tiene formulario dedicado registrado en el mecanismo de
  discovery de tareas del motor, sin que spec 003 conozca semantica SWIFT.
- (Seguridad) los `${secret:...}` cubren credenciales del gateway, SFTP y la
  clave de cifrado de `raw_payload`.
- (Compliance) `mt101_archive` cumple retencion configurable y emite el hash
  SHA-256 del payload original.

## Dependencias

- [003-diseno-y-ejecucion-procesos](../003-diseno-y-ejecucion-procesos/spec-funcional.md):
  SPI `TaskProvider`, motor de inputs/outputs (ADR-004), gaps M-1a/M-1b/M-2/M-3.
- [002-catalogo-readers](../002-catalogo-readers/spec-funcional.md): reader
  `swift-mt` se registra aqui como otro formato del catalogo.
- [005-catalogo-conexiones](../005-catalogo-conexiones/spec-funcional.md):
  conexiones para gateway REST, SFTP del banco y MQ.
- [004-observabilidad-y-auditoria](../004-observabilidad-y-auditoria/spec-funcional.md):
  atributos OTel de dominio (`swift.message.type`, `swift.uetr`, etc.).
- [ADR-009 Vertical de mensajeria de pagos](../../docs/fase-3-arquitectura/adr/ADR-009-vertical-mensajeria-pagos.md).

## Gates

Spec nuevo (`origin: nuevo`); los gates de proceso se registran como `pending`
hasta validacion humana formal.

- `gate-sdd-approved`: pending
- `gate-prototype-ready`: pending
- `gate-qa-passed`: pending
