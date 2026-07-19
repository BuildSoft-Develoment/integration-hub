# ADR-016 Salida generica: escritura de archivos y entrega por transporte

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-015 Backend task async broker execution](ADR-015-backend-task-async-broker-execution.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Propuesto (analisis profundo verificado contra codigo, 2026-07-18).

## Contexto

El sistema tiene la **mitad de ENTRADA completa** y la de **SALIDA incompleta y acoplada al dominio de pagos**. Verificado en codigo (no solo de memoria):

| Capa | ENTRADA (existe) | SALIDA (hoy) |
|---|---|---|
| Transporte | 9 `SourceProvider`: `SFTP, FTP, S3, AZURE_BLOB, GCS, OCI_OBJECT_STORAGE, REST, FILESYSTEM, Remote`. SPI **read-only** (`selectFiles`/`openFile`). | Solo `SftpPaymentTransport` y `RestPaymentTransport`, **soldados a `MT101_PAY`** (SPI `PaymentMessageTransport.send(Mt101Message, config)`). |
| Formato | 8 readers con **streaming real**: CSV/TXT linea a linea; XLSX via `XSSFReader` SAX (`XlsxStreamingReaderSupport`); XLS via HSSF event. | **Ningun writer generico.** Solo `MT101_BUILD_FROM_TABLE` (formato FIN, dominio pago). |
| Motor (BUILTIN) | `FILE_READ` (fast-path del engine, sin `TaskProvider`), `DB_WRITE`, **`DB_EXECUTE_SP`**, **`DB_EXECUTE_FN`**, `REST_CALL`, `NOTIFICATION`. | No hay `FILE_WRITE` ni `FILE_DELIVER`. |

**Correccion de alcance (clave):** `DB_EXECUTE_SP` (`StoredProcedureTaskProvider`) y `DB_EXECUTE_FN` (`DatabaseFunctionTaskProvider`) **YA EXISTEN**. Por lo tanto la cadena pedida `READ -> WRITE -> SP -> FN` **ya es construible hoy**; lo unico que falta para cerrar el pipeline es **escribir el archivo** y **entregarlo**. El net-new real se reduce a: 2 task types (`FILE_WRITE`/`FILE_DELIVER`), 2 familias de providers (writers + sinks), la columna `direction` en `source_definition`, y guardar el password como referencia vault (QA-006).

Consecuencias del hueco:

- La **conexion** (host/credenciales/known_hosts) se define en `/sources` para leer y **se duplica inline** en `MT101_PAY` para escribir. Los campos SFTP source vs transport son **identicos**; solo difiere lo operacional (`remotePath` para leer vs `dropPathTemplate`+`tmpExtension` para dejar).
- No se puede exportar un archivo (CSV/TXT/Excel) desde un proceso generico ni entregarlo por SFTP/S3/FTP fuera del money-path.

Requisito no-funcional heredado de ADR-004: procesar > 1.000.000 de registros / archivos pesados **sin cargar el archivo completo en memoria**. La entrada ya lo cumple (paginado keyset + page-chain `AsyncPageChainService`, memoria acotada a una pagina; y `TempFileSourcePayload` para streaming a disco). La salida debe cumplirlo simetricamente.

## Los 3 problemas de diseno (lo dificil)

### A. Un solo archivo ordenado vs el modelo scatter/paralelo del engine

El engine procesa slices **en paralelo e independientes** (scatter N->1 suma outputs numericos). Pero `FILE_WRITE` debe producir **UN archivo ordenado** (`header + N detalle + trailer`). **No se puede scatterear**: workers paralelos escribiendo al mismo archivo = corrupcion + orden roto.

- **Decision (A1, default):** `FILE_WRITE` corre en **batch SINCRONO secuencial** (como el fast-path de `FILE_READ` en modo secuencial). Pagina la fuente por keyset, **append a un unico temp file, un solo writer**. Memoria = una pagina -> cumple >1M. Un hilo (aceptable: el cuello es la **red de salida**, no la serializacion CPU). Es el entregable estandar de banca/partners (un archivo con cabecera+detalle+trailer).
- **Alternativa (A2, futuro):** salida **shardeada** (un archivo por particion en paralelo) + manifiesto. Solo si un consumidor concreto lo exige; rompe la semantica de "un archivo ordenado" y los agregados cabecera/trailer.

### B. Fuente de datos y agregados de cabecera

- **Fuente:** para >1M, `FILE_WRITE` **lee de una TABLA** (`input.sourceOutput:"table"`), no de `records` en memoria (que no escala). Cadena canonica: `FILE_READ -> DB_WRITE(staging_record) -> [SP/FN] -> FILE_WRITE(lee tabla) -> FILE_DELIVER`, identica a como `MT101_BUILD_FROM_TABLE` lee la tabla. Se soporta `records` solo para volumenes chicos.
- **Agregados:** un `header` con `count`/`sum` de TODAS las filas se conoce recien al final. Con fuente-tabla se resuelve con **pre-query** barato (`SELECT count(*), sum(x)`) antes de escribir la cabecera; el `trailer` se **acumula durante** el streaming. (El contrato del ADR mostraba `aggregate:count` en el header sin resolver este orden; esta es la regla.)

### C. Handoff del artefacto entre `FILE_WRITE` y `FILE_DELIVER`

El temp file producido por `FILE_WRITE` debe sobrevivir entre dos ejecuciones de tarea:

- **Fase 1 (sync, mismo JVM):** temp file local + su ruta en el output `summary`. Simple y correcto. Implica declarar ambas tareas `asyncOffloadSupport = UNSUPPORTED` (no async en fase 1).
- **Async/distribuido (fase futura):** hace falta persistir el artefacto en un store compartido; ya existe `ArtifactStagingProducer` (S3) usado por los plugins remotos. Se adopta cuando se quiera `FILE_WRITE`/`FILE_DELIVER` async o multi-nodo.

## Decision

Completar la **mitad de salida** de forma **generica y agnostica de dominio**, como espejo de la entrada.

### 1) Tres tareas BUILTIN nuevas

- **`FILE_WRITE`** (`BatchTaskProvider`): consume `records`/`table` de una tarea previa (contrato ADR-004) y produce un **archivo** materializado en temp file. Config: formato (`CSV`/`TXT` ancho-fijo/`XLSX`), **layout cabecera + detalle (+ trailer)**, encoding, delimitador/posiciones, y **mapeo de columnas reutilizando el board drag-and-drop de `DB_WRITE`**. Publica `summary` (ruta/tamano/conteo **+ `files:[...]` lista de rutas producidas**) y `errors`. **Streaming secuencial obligatorio (A1).**
- **`FILE_COMPRESS`** (compresor generico, task **dinamico y schema-driven**): consume `summary.files` (una o varias rutas) de una tarea previa y produce **un archivo comprimido** (temp). **Todo su comportamiento sale del `configuration`** — expone `configSchema()` como el resto de providers, y el frontend renderiza el auto-form (`ih-schema-form`); el usuario lo configura **segun su necesidad**. Config: `algorithm` (`ZIP`/`GZIP`/`TAR_GZ`), `compressionLevel` (`STORE`..`BEST`), `archiveNameTemplate`, `entryNameTemplate`, `encryption` (`NONE`/`AES256`), `password` (`${secret:...}`, requerido si cifra), `deleteSourcesAfter`, `splitSizeMb` (opcional, multi-volumen). Publica `summary` (`archivePath`/`archiveSize`/`entryCount`) y `errors`. **Streaming obligatorio.** Es una tarea aparte (no un flag) para responsabilidad unica y composicion: comprimir **varios** `FILE_WRITE` en un archivo, o entregar sin comprimir. Cadena tipica: `FILE_WRITE -> FILE_COMPRESS -> FILE_DELIVER`.
- **`FILE_DELIVER`** (transporte de salida generico, **fuera del dominio pay**): consume la ruta del archivo (de `FILE_WRITE` o `FILE_COMPRESS`) y lo **entrega** a un sink. Config: `sinkRef` (referencia a un source Entrada/Salida) + `dropPathTemplate`. Publica `summary` (destino/estado) y `errors`. **Streamea desde el temp file (nunca `ByteArrayInputStream`).**

### 2) Tres familias de providers nuevas (SPIs, espejo de la entrada)

- **`FileFormatWriter`** (espejo de `ReaderProvider`): `CsvWriter`, `TxtWriter` (ancho fijo), `XlsxWriter` (SXSSF streaming). Serializa `List<ReadRecord>` -> stream, pagina a pagina (write-side de `ReadBatchConsumer`).
- **`FileCompressor`** (familia resuelta por `algorithm`): `ZipCompressor` via **`zip4j`** (ZIP plano **y** AES-256 en una sola lib, cifrado config-driven por el campo `encryption`; soporta multiples entradas), `GzipCompressor` (`java.util.zip.GZIPOutputStream`, JDK, un solo archivo, sin cifrado), `TarGzCompressor` (`commons-compress`, fase 2). Streamea por entrada (sin heap). Password de cifrado como `${secret:...}`. `zip4j` es Java puro; requiere **smoke test native** (bajo riesgo).
- **`OutputSink`** (espejo de `SourceProvider`, **sin tocar** el SPI read-only): `openSink(target, config) -> OutputStream` streaming. Impls SFTP/Filesystem (MVP), luego S3/FTP. Reutiliza `SourceConfigurationSupport` para parsear config.
- Las tres con su **registry CDI** (`Instance<T>` + `resolve(type)` + fallback remoto), copiando `SourceProviderRegistry`/`ReaderProviderRegistry`.
- Se generalizan (no se fusionan) los transportes pay: la logica upload-with-temp-then-rename + duplicate-policy (`SKIP_IF_SAME_HASH`/`FAIL`/`OVERWRITE`/`RENAME_WITH_SUFFIX`) de `SftpPaymentTransport` es la referencia del `SftpSink`, **pero streameando desde archivo** (el `new ByteArrayInputStream(bytes)` de `SftpPaymentTransport` haria OOM con un CSV/Excel pesado).

### 3) `/sources` como Entrada/Salida

Agregar `direction` a `source_definition`: `INPUT` (default) | `OUTPUT` | `BOTH`. La conexion se define una vez y se reutiliza para leer (`FILE_READ`) y escribir (`FILE_DELIVER`). El picker de `FILE_DELIVER` filtra `direction in (OUTPUT, BOTH)`. `sinkRef` es un id de `/sources` (Opcion B, espejo de `FILE_READ -> sourceDefinitionId`; **no** `/connections`, porque los campos de conexion SFTP/S3 viven en sources).

### 4) Gobernanza de credenciales y egreso (superficie nueva)

Una salida OUTPUT **saca datos** a sistemas externos: es una superficie de **exfiltracion** que la entrada no tenia. Controles:

- **Credenciales como referencia COMPLETA:** el sink reutiliza la regla `COMPLETE_REF` de `Mt101DispatchPlanCompiler` (`password`/`passphrase`/`knownhosts` deben ser `${secret:...}`/`${config:...}` completos, nunca literal ni template mixto). Destino (host/ruta) **estatico** (sin `${...}` dinamico en routing).
- **Prerrequisito QA-006 (en PARALELO):** hoy el form de `/sources` guarda el password **en texto plano** en `configurationJson` (verificado en `sftp-source.provider.ts`). Se corrige a referencia vault **en paralelo** con los sinks (no como gate bloqueante), cerrando la ventana de credenciales en claro antes del release.
- **RBAC:** crear source OUTPUT / `FILE_DELIVER` queda habilitado tambien para `OPERATOR` (decision de producto), con la gobernanza `COMPLETE_REF` + destino estatico como control tecnico del egreso. (Nota de seguridad: si mas adelante se endurece, el gate natural seria `INTEGRATION_ADMIN`.)

### 5) MT101 como especializacion (no forzar merge)

`MT101_BUILD_FROM_TABLE` ~= `FILE_WRITE` con writer FIN/SWIFT. `MT101_PAY` ~= `FILE_DELIVER` con sink SFTP **+ semantica money-safety** (idempotencia con intent durable, upload-with-rename, dedup por hash, correlacion, anti-doble-pago, clasificacion accepted/uncertain/retriable/rejected). **No se fusionan en fase 1**: MT101 conserva sus garantias criticas; se comparte codigo despues, con cuidado.

## Contrato base

`FILE_WRITE`:

```json
{
  "taskRef": "write-file",
  "taskType": "FILE_WRITE",
  "executionMode": "batch",
  "input": { "source": "task-output", "sourceTaskRef": "sp1", "sourceOutput": "table", "batchSize": 5000, "cursor": { "orderBy": "id" } },
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

`FILE_COMPRESS`:

```json
{
  "taskRef": "zip-export",
  "taskType": "FILE_COMPRESS",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "write-file", "sourceOutput": "summary" },
  "algorithm": "ZIP",
  "compressionLevel": "NORMAL",
  "archiveNameTemplate": "export-${_processExecutionId}.zip",
  "entryNameTemplate": "${originalName}",
  "encryption": "AES256",
  "password": "${secret:sinks/export/zip-password}",
  "deleteSourcesAfter": false,
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

- **Streaming secuencial (A1) obligatorio**: `FILE_WRITE` es un unico writer que pagina keyset sobre la tabla (requiere `cursor.orderBy`) y serializa incremental a un temp file (CSV/TXT linea a linea; XLSX con SXSSF y ventana de flush acotada). `FILE_DELIVER` hace `put` **streaming desde el temp file**.
- **Agregados**: `header.aggregate` (count/sum) via **pre-query** a la tabla; `trailer.aggregate` **acumulado** durante el streaming.
- **Layout** cabecera/detalle/trailer: constantes, metadata transversal (`_processExecutionId`, ...) o agregados; detalle por mapeo de columnas (mismo contrato `ColumnAssignment` de `DB_WRITE`).
- **Compresion (`FILE_COMPRESS`)**: streaming por entrada (`putNextEntry` + `Files.copy(origen, zipOut)`), nunca cargando el archivo en heap. Multi-archivo via `summary.files` de la tarea previa (no cambia el contrato de input, que es de un solo `sourceTaskRef`). ZIP soporta N entradas; GZIP solo 1. Password de cifrado como `${secret:...}`.
- **Credenciales**: `password`/`knownHosts` del sink como `${secret:...}`/`${config:...}` (regla `COMPLETE_REF`), nunca literal.
- **`direction`** en sources: `FILE_READ` exige `INPUT|BOTH`; `FILE_DELIVER` exige `OUTPUT|BOTH`.
- **No-async en fase 1**: `FILE_WRITE`/`FILE_DELIVER` declaran `asyncOffloadSupport = UNSUPPORTED` (handoff por temp file local). El async/distribuido llega con `ArtifactStaging`.
- Ningun flujo > 1.000.000 registros materializa el archivo completo en memoria (ADR-004).

## Consecuencias

Positivas:

- Completa la simetria del sistema: sabe leer/parsear de cualquier lado y ahora escribir/entregar a cualquier lado.
- DRY la conexion (una definicion `/sources`, reutilizada entrada/salida).
- Habilita ETL/export de archivos agnostico de dominio, no solo pagos.
- Reutiliza el board drag-and-drop de `DB_WRITE`, el paginado keyset, `TempFileSourcePayload`, y la gobernanza vault del compiler.
- **Absorbe QA 013** (config SFTP de PAY por UI) y **006** (password por vault).

Costos:

- **Writers 100% net-new** (CSV/TXT/XLSX) + motor de layout cabecera/detalle/trailer con pre-query de agregados.
- **Sinks net-new por tipo**: hoy solo salidas REST/SFTP (pay); Filesystem/S3/FTP como salida generica son ~4 implementaciones nuevas en las primeras fases.
- Rework de streaming en la entrega (evitar el `ByteArrayInputStream`).
- Migracion: nueva columna `direction` en `source_definition` (V100).
- **`FILE_COMPRESS`**: medio-bajo. ZIP via `zip4j` (**+1 dependencia**, Java puro, plano + AES config-driven) + GZIP via `java.util.zip` (JDK); el bundling multi-archivo se resuelve con `summary.files` sin tocar el contrato. TAR_GZ (`commons-compress`) suma dependencia (fase 2).
- **Native**: SXSSF (escritura) **no esta ejercitado** por los paths de lectura (quarkiverse-poi cubre lectura/event) -> **smoke test native obligatorio** para el writer XLSX (fase 2). CSV/TXT + `java.util.zip` (GZIP) = I/O puro (sin reflexion, sin riesgo). **`zip4j` (Java puro) requiere smoke test native** (bajo riesgo). SFTP sink reusa JSch (ya configurado), S3 sink reusa el SDK de `S3SourceProvider` (ya OK).
- SP/FN **ya existen** (no son costo): la cadena READ->WRITE->SP->FN es construible hoy.

## Migracion

- `source_definition.direction` (`varchar(10) not null default 'INPUT'`) en **`V100__source_definition_direction.sql`** (la ultima migracion es V99). Las filas existentes quedan `INPUT` (no rompe sources actuales).
- `MT101_PAY` mantiene su config inline (backward-compat); opcionalmente puede migrar a referenciar un sink. No se fuerza.
- `FILE_WRITE`/`FILE_DELIVER` son opt-in; no afectan procesos existentes.

## Plan por fases

1. **MVP (alto valor, riesgo medio)**: `FILE_WRITE` CSV/TXT (fuente-tabla, secuencial, cabecera/detalle/trailer con pre-query de agregados) + **`FILE_COMPRESS` ZIP (zip4j, plano + AES-256 config-driven) + GZIP (`java.util.zip`)** + `FILE_DELIVER` **SFTP + Filesystem** + `direction` V100 + **QA-006 password->vault en paralelo**. Smoke test native de `zip4j`. E2E de punta a punta con el **bank-sim** (`ops/.../int/bank-sim/README.md`).
2. `XlsxWriter` (SXSSF) + **smoke test native** + sinks **S3, FTP** + `FILE_COMPRESS` **`TAR_GZ`** (`commons-compress`).
3. Sources bidireccionales (UI), **`FILE_DECOMPRESS` de entrada** (leer un source `.zip`/`.gz`, espejo simetrico), handoff async via `ArtifactStaging`, evaluar salida shardeada (A2) y compartir codigo con MT101 (`BUILD_FROM_TABLE`/`PAY`) sin regresionar money-safety.

## Puntos de anclaje en codigo (para implementar)

- SPI tarea: `platform-app/.../spi/task/TaskProvider.java` + `BatchTaskProvider.java`; registro por bean CDI (mirror `Mt101InboundDeliverTaskProvider.type()`); `domain/TaskType.java` (constantes + `BUILTIN`).
- Contrato I/O: `service/execution/TaskInputResolver.java` (input `task-output`, table paging keyset `executeTableBatches`), `service/execution/TaskOutputRegistry.java` (publicar `summary`).
- Mapeo columnas: `provider/task/dbwrite/DbTaskSupport.ColumnAssignment`; UI `process-db-write-mapping-board`.
- Streaming/temp: `provider/source/TempFileSourcePayload.java` (patron a espejar por writers, compresor y sinks).
- Compresion: net-new; `FileCompressor` (registry CDI como los otros) + `ZipCompressor` con **`zip4j`** (`ZipFile`/`ZipParameters`, plano + AES streaming por entrada) + `GzipCompressor` con `java.util.zip.GZIPOutputStream`; multi-archivo via `summary.files` (publicado por `FILE_WRITE`, leido por `FILE_COMPRESS`). `configSchema()` para el auto-form. Sin compresion previa en el repo (grep vacio); `zip4j` = dependencia nueva + smoke test native.
- Sink SFTP referencia: `provider/task/payments/swift/transport/SftpPaymentTransport.java` (upload-with-rename + dup-policy; **corregir el byte-array**).
- Gobernanza: `service/JsonConfigurationMapper.java` (`${secret:...}`), `provider/task/payments/swift/Mt101DispatchPlanCompiler.java` (`COMPLETE_REF`).
- Frontend: registries `PROCESS_TASK_PROVIDERS` + `PROCESS_TASK_FORM_REGISTRY`; union `PlatformProcessTaskType`.
- Datos: `entity/SourceDefinition.java`; migraciones `db/migration/`.

## Referencias

- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-006 Fuentes de almacenamiento cloud](ADR-006-fuentes-almacenamiento-cloud.md)
- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md)
- [ADR-015 Backend task async broker execution](ADR-015-backend-task-async-broker-execution.md)
- bank-sim (simulador de canal SFTP para pruebas): `ops/fase-7-deploy/dist/onprem/int/bank-sim/README.md`
- Hallazgos QA relacionados: 013 (PAY SFTP por UI), 006 (password vault), 004 (UX form fuentes), 015 (test de source).
