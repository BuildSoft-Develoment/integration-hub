# Item 2 (app_htoh 60) — trazabilidad de LÍNEA FÍSICA del archivo origen

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** precisión de auditoría "¿qué LÍNEA del archivo falló?" — capturar la posición física (no solo el ordinal
lógico), persistirla y exponerla al operador. Autorizado tocar los readers (WIP ajeno) tras confirmar el conflicto.

## Problema

`record_index`/`source_record_number` es el **ordinal lógico** del registro de datos: no cuenta cabeceras ni las
líneas físicas que un registro pueda ocupar, y en Excel no hay "línea" global. Con cabecera, el registro 1 es la
**línea física 2**. Para abrir el archivo y ubicar la fila exacta hacía falta la posición física, que **solo el reader
conoce** (parsea el archivo). `ReadRecord` cargaba solo `values` — sin posición.

## Cambio (SOLID)

- **SPI (OCP, retrocompatible):** nuevo objeto de valor `SourcePosition(physicalLine, sheetName, sheetRow)` (SRP: solo
  describe la posición; nullable). `ReadRecord` gana un 2º constructor con `SourcePosition` y **conserva el de 1 arg**
  → los ~10 sitios que ya construyen `ReadRecord` no rompen; solo los readers que aportan posición usan el nuevo.
- **Readers line-based (CSV, TXT):** pasan `SourcePosition.line(rowIndex + 1)` — `rowIndex` es 0-based por línea física
  (cuenta cabeceras/blancos) → línea física 1-based correcta. (Excel/SwiftMt/Remote/XML quedan con `null` hasta que se
  añada su modelo de posición; misma `SourcePosition.sheet(...)` — follow-up trivial, no camino a medias: `null` = no
  capturada por ese reader, no un valor inventado.)
- **Persistencia:** migración `V90` añade `physical_line`/`sheet_name`/`sheet_row` a `staging_record` (nullables +
  índice). `DbWriteRepository.StagingRow` + INSERT las incluyen; `DbWriteTaskProvider` mapea `record.position()` y la
  **preserva al enriquecer con runtime** (antes recreaba `ReadRecord` perdiéndola). La posición viaja en memoria desde
  el reader (`executeRecords(List<ReadRecord>)`) hasta el INSERT — sin conversión a `Map`.
- **Lookup + UI:** `Mt101StagingRecordRepository.StagingPayload` + `Mt101StagingCorrectionService.StagingRowView` ganan
  la posición; el endpoint `/staging-row` la serializa. La vista de corrección de `mt101-quarantine` muestra "Línea
  física en el archivo: N" (o "Hoja X, fila Y" en Excel). i18n en/es.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `CsvReaderProviderTest` | 6/0/0 | `capturesPhysicalLineAccountingForHeader`: con cabecera (rowData=2), el 1er registro es la **línea física 2**, el 2º la 3 (offset de cabecera) |
| `Mt101StagingCorrectionServiceTest` | 7/0/0 | `readRowExposesPhysicalLineForItem2`: `readRow` devuelve la línea física (round-trip persist→read, BD real) + los 6 previos sin regresión (schema del test actualizado con las 3 columnas) |
| `DbWriteTaskProviderTest` | 9/0/0 | `stagingInsertPersistsPhysicalLineForItem2`: **E2E del eslabón medio** — DB_WRITE en modo staging preserva la posición del reader hasta `staging_record.physical_line` (registro lógico 0 → línea física 2) + 8 previos sin regresión por la aridad de `StagingRow` |
| Barrida SPI (readers CSV/TXT/Excel/SwiftMt/Remote/Pain001/XML, DbWrite, FileRead/Streaming/fastpath, BuildFromTable) | **BUILD SUCCESS** (todas verdes) | el 2º constructor retrocompatible de `ReadRecord` **no rompe** ninguno de los ~10 sitios consumidores |
| Frontend `web` (vitest) | 520/0/0 | paridad i18n (claves `physicalLine`/`sheetCell`) + componente sin regresión; build prod limpio (sin budget) |

**Cadena end-to-end probada:** reader (captura línea con offset de cabecera) → DB_WRITE staging (E2E, persiste
`physical_line`) → `readRow` (expone la línea) → UI. Cada eslabón con su test.

## Nota de proceso (transparencia)

Los archivos `CsvReaderProvider.java` y `TxtReaderProvider.java` tenían **WIP sin commitear ajeno** (un
`supportsStreamingPipeline() → true` del work-stream de readers). Al autorizarse tocar los readers, ese hunk WIP quedó
incluido en el commit de item 2 (no es separable sin `git add -p`, bloqueado). No es cambio mío; se deja anotado.

## Alcance y follow-up (honesto)

- **Cubierto end-to-end:** formatos **line-based** (CSV, TXT) → línea física real, persistida y visible al operador.
- **Follow-up (misma infra):** Excel (sheet+fila vía `SourcePosition.sheet`, requiere plumbing de `sheetName` en el SAX
  streaming), SwiftMt (línea de inicio del bloque), Remote (delega en el formato subyacente). No son camino a medias:
  devuelven `null` hasta implementarse, sin inventar posición.
