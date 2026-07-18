# ADR-016 Salida generica: escritura de archivos y entrega por transporte

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-015 Backend task async broker execution](ADR-015-backend-task-async-broker-execution.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Propuesto.

## Contexto

El sistema tiene la **mitad de ENTRADA completa** y la de **SALIDA incompleta y acoplada al dominio de pagos**.

Verificado en codigo:

| Capa | ENTRADA (existe) | SALIDA (hoy) |
|---|---|---|
| Transporte | 9 sources: `SFTP, FTP, S3, AzureBlob, GCS, OCI, REST, Filesystem, Remote` (SPI `SourceProvider`, solo lectura: `selectFiles`/`openFile`) | Solo `RestPaymentTransport` y `SftpPaymentTransport`, y **acoplados a `MT101_PAY`** (SPI `PaymentMessageTransport.send`, config **inline**) |
| Formato | 9 readers: `CSV, TXT(ancho fijo), XLSX, XLS, JSON, SWIFT_MT, Pain001, Remote`, con `XlsStreamingReaderSupport` | **Ningun writer generico**. Solo `MT101_BUILD_FROM_TABLE` (formato FIN, dominio pago) |
| Motor (BUILTIN) | `FILE_READ, DB_WRITE, DB_EXECUTE_SP, DB_EXECUTE_FN, REST_CALL, NOTIFICATION` (ADR-004) | No hay `FILE_WRITE` ni `FILE_DELIVER` genericos |

Consecuencias del hueco:

- La **conexion** (host/credenciales/known_hosts) se define en `/sources` para leer y **se duplica inline** en la tarea `MT101_PAY` para escribir. Los campos de conexion SFTP source vs transport son **identicos**; solo difiere el operacional (`remotePath` para leer vs `dropPathTemplate`+`tmpExtension` para dejar).
- No se puede exportar un archivo (CSV/TXT/Excel) desde un proceso generico ni entregarlo por SFTP/S3/FTP fuera del money-path.
- El pipeline objetivo `FILE_READ -> DB_WRITE -> SP -> FN -> <escribir archivo> -> <entregar>` esta trunco: la ultima mitad solo existe en la forma `MT101_BUILD_FROM_TABLE -> MT101_PAY`.

Prior art relevante: `MT101_INBOUND_DELIVER` (DB) ya usa `connectionRef` para resolver un destino del catalogo `/connections`. Y `FILE_READ` referencia `/sources` por `sourceDefinitionId`. El patron "tarea de salida referencia un catalogo" ya existe.

Requisito no-funcional heredado de ADR-004: procesar > 1.000.000 de registros / archivos pesados **sin cargar el archivo completo en memoria**.

## Decision

Completar la **mitad de salida** de forma **generica y agnostica de dominio**, como espejo de la entrada.

### 1) Dos tareas BUILTIN nuevas

- **`FILE_WRITE`** (serializador de formato): consume `records` (de cualquier tarea previa, contrato ADR-004) y produce un **archivo** materializado (temp/staging). Config: formato (`CSV`/`TXT`ancho-fijo/`XLSX`), **layout de cabecera + detalle (+ trailer)**, encoding, delimitador/posiciones, y mapeo de columnas **reutilizando el drag-and-drop que ya tiene `DB_WRITE`**. Publica `summary` (ruta/tamano/conteo), `errors`. **Streaming obligatorio.**
- **`FILE_DELIVER`** (transporte de salida generico, **fuera del dominio pay**): consume la ruta del archivo de `FILE_WRITE` y lo **entrega** a un sink. Config: `sinkRef` (referencia a un source Entrada/Salida) + ruta destino (`dropPathTemplate`). Publica `summary` (destino/estado), `errors`.

### 2) Dos familias de providers nuevas (SPIs, espejo de la entrada)

- **`FileFormatWriter`** (espejo de los readers): `CsvWriter`, `TxtWriter`(ancho fijo), `XlsxWriter`(SXSSF streaming). Serializa `records` -> bytes por pagina.
- **`Sink`** (salida por transporte) resuelto por **referencia a `/sources`** (Opcion B): `FILE_DELIVER` referencia una definicion de source con `direction` de salida y le agrega la operacion de escritura (`put`/upload-with-rename). No se cambia el SPI `SourceProvider` (sigue read-only); la operacion de escritura vive en el resolver del sink.

### 3) `/sources` como Entrada/Salida

Agregar `direction` a `source_definition`: `INPUT` (default) | `OUTPUT` | `BOTH`. La conexion se define una vez y se reutiliza para leer (`FILE_READ`) y escribir (`FILE_DELIVER`). El picker de `FILE_DELIVER` filtra sources con `direction in (OUTPUT, BOTH)`.

### 4) Gobernanza de credenciales (reusa la existente)

El `Mt101DispatchPlanCompiler` ya exige que `password`/`knownhosts` sean referencia COMPLETA `${secret:...}`/`${config:...}`. Los sinks reutilizan esa regla. **Prerrequisito**: el form de `/sources` debe guardar el password como referencia vault (hallazgo QA CSRC/006), no texto plano.

### 5) MT101 como especializacion (no forzar merge)

`MT101_BUILD_FROM_TABLE` ~= `FILE_WRITE` con writer de formato FIN/SWIFT. `MT101_PAY` ~= `FILE_DELIVER` con sink SFTP **+ semantica money-safety** (idempotencia, upload-with-rename, dedup por hash, correlacion, anti-doble-pago). **No se fusionan en fase 1**: MT101 conserva sus garantias criticas; se comparte codigo despues, con cuidado.

## Contrato base

`FILE_WRITE`:

```json
{
  "taskRef": "write-file",
  "taskType": "FILE_WRITE",
  "executionMode": "batch",
  "input": { "source": "task-output", "sourceTaskRef": "sp1", "sourceOutput": "table", "batchSize": 5000 },
  "format": "CSV",
  "encoding": "UTF-8",
  "layout": {
    "header": [ { "value": "H" }, { "metadata": "_processExecutionId" }, { "aggregate": "count" } ],
    "detail": { "delimiter": ",", "columns": [ { "field": "dni" }, { "field": "monto", "type": "NUMBER" } ] },
    "trailer": [ { "value": "T" }, { "aggregate": "sum", "field": "monto" } ]
  },
  "outputs": [ { "name": "summary", "type": "summary" }, { "name": "errors", "type": "errors" } ]
}
```

`FILE_DELIVER`:

```json
{
  "taskRef": "deliver-file",
  "taskType": "FILE_DELIVER",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "write-file", "sourceOutput": "summary" },
  "sinkRef": 7,
  "dropPathTemplate": "/outbox/export-${_processExecutionId}.csv",
  "tmpExtension": ".part",
  "outputs": [ { "name": "summary", "type": "summary" }, { "name": "errors", "type": "errors" } ]
}
```

## Reglas

- **Streaming obligatorio**: `FILE_WRITE` pagina sobre `records` y serializa incremental a un temp file (CSV/TXT linea a linea; XLSX con SXSSF y ventana de flush acotada). `FILE_DELIVER` hace `put` **streaming desde el temp file**, nunca cargando el archivo en memoria.
  - Gotcha verificado: `SftpPaymentTransport` hoy usa `new ByteArrayInputStream(bytes)` (archivo entero en memoria). Sirve para fragmentos MT101 (~8KB) pero **haria OOM con un CSV/Excel pesado**. El sink generico DEBE streamear desde archivo.
- **Layout** cabecera/detalle/trailer: cabecera y trailer con constantes, metadata transversal o agregados (`count`/`sum`); detalle por mapeo de columnas (mismo contrato de mapping de ADR-004).
- **Credenciales**: `password`/`knownHosts` del sink como referencia `${secret:...}`/`${config:...}` (nunca literal).
- **`direction`** en sources: `FILE_READ` exige `INPUT|BOTH`; `FILE_DELIVER` exige `OUTPUT|BOTH`.
- Ningun flujo > 1.000.000 registros puede materializar el archivo completo en memoria (heredado de ADR-004).

## Consecuencias

Positivas:

- Completa la simetria del sistema: sabe leer/parsear de cualquier lado y ahora escribir/entregar a cualquier lado.
- DRY la conexion (una definicion `/sources`, reutilizada entrada/salida).
- Habilita ETL/export de archivos agnostico de dominio, no solo pagos.
- Reutiliza el drag-and-drop de `DB_WRITE`, el patron paginado, y la gobernanza vault.
- **Absorbe hallazgos QA 013** (config SFTP de PAY por UI) **y 006** (password por vault).

Costos:

- **Writers 100% net-new** (CSV/TXT/XLSX) + motor de layout cabecera/detalle.
- **Sinks net-new por tipo**: hoy solo existen salidas REST/SFTP; FTP/S3/Azure/GCS/OCI/Filesystem como salida son ~6 implementaciones nuevas.
- Rework de streaming en la entrega (evitar el byte-array en memoria).
- Migracion: nueva columna `direction` en `source_definition`.
- POI SXSSF pesado usa temp files + ventana de flush: acotar como se hizo con el batch de bytes del 1M.

## Migracion

- `source_definition.direction` con default `INPUT` para filas existentes (no rompe sources actuales).
- `MT101_PAY` mantiene su config inline (backward-compat); opcionalmente puede migrar a referenciar un sink. No se fuerza.
- Las tareas `FILE_WRITE`/`FILE_DELIVER` son opt-in; no afectan procesos existentes.

## Plan por fases

1. **MVP (alto valor, bajo riesgo)**: `FILE_WRITE` CSV/TXT (streaming, cabecera/detalle) + `FILE_DELIVER` SFTP (reusa el transporte SFTP existente + `/sources` Entrada/Salida). Cierra 013+006. Se prueba de punta a punta con el **bank-sim** (ver `ops/.../int/bank-sim/README.md`).
2. `XLSX` writer (SXSSF).
3. Mas sinks: S3, FTP, Filesystem.
4. Evaluar compartir codigo con MT101 (`BUILD_FROM_TABLE`/`PAY`) sin regresionar money-safety.

## Referencias

- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-006 Fuentes de almacenamiento cloud](ADR-006-fuentes-almacenamiento-cloud.md)
- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md)
- bank-sim (simulador de canal SFTP para pruebas): `ops/fase-7-deploy/dist/onprem/int/bank-sim/README.md`
- Hallazgos QA relacionados: 013 (PAY SFTP por UI), 006 (password vault), 004 (UX form fuentes), 015 (test de source).
