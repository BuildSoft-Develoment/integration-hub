# app_htoh(61) — búsqueda por línea física (A) + posición Excel (B) + evidencia 1M (C)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** cierra los gaps reales de v61 validados contra código, sin caminos a medias.

## A — Búsqueda inversa por línea física (cierra el índice V90 que estaba sin usar)

**Hallazgo (doble-check):** el índice `ix_staging_record_physical_line (source_file_hash, physical_line)` que se creó
en V90 (item 2) **no lo usaba ninguna query** — era un "camino a medias". Se le da su query real.

**Cambio (SOLID):**
- **Repo** `Mt101StagingRecordRepository.findByPhysicalLine(dataSource, sourceFileHash, physicalLine, processExecutionId?)`
  → `PhysicalLineMatch(stagingId, recordIndex, physicalLine, sourceFileHash, processExecutionId)`; usa el índice V90;
  `processExecutionId` opcional desambigua re-procesos.
- **Servicio** `Mt101FragmentLookupService.findByPhysicalLine(...)` (inyecta el staging repo).
- **Endpoint** `GET /api/query/mt101-fragments/by-physical-line` (auth-gated 5 roles); 204 si la línea no tiene registro.
- **Frontend**: en la vista de lookup, campo "Línea física del archivo" + acción "Resolver línea → registro" que
  auto-llena el número de fila lógico (para seguir al lookup de fragmentos). i18n en/es.

## B — Posición física en Excel (hoja + fila)

Los 3 readers Excel ahora aportan `SourcePosition.sheet(sheetName, filaFísica)`:
- `ExcelReaderSupport` (no-streaming): `sheet.getSheetName()` + `rowIndex+1`.
- `XlsxStreamingReaderSupport` (SAX): `sheetName` threadeado del `SheetIterator.getSheetName()` al handler.
- `XlsStreamingReaderSupport` (HSSF): `sheetName` de los `BoundSheetRecord` (globals) por índice de hoja.

Completa "cualquier archivo": línea física para CSV/TXT/FIN, hoja+fila para Excel. (Remote reader: no aplica — el
parseo lo hace el plugin remoto sobre un contrato de Maps; documentado.)

## C — Evidencia 1M sobre v61 (post item 2)

Re-corrida de `Mt101MillionFileProcessE2EIT#runsFileToSwiftProcessForMillionRows` con `-De2e.rows=1000000
-DargLine=-Xmx768m` sobre el código actual (incluye las 3 columnas nullable + el write path de posición): confirma
cero regresión a escala tras item 2.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PhysicalLineLookupIT` | **1 / 0 / 0** | E2E REST: `GET /by-physical-line` resuelve línea física → staging_id/record_index; 204 si no hay registro |
| `ExcelReaderProviderTest` | **7 / 0 / 0** | +2: xlsx (hoja "Hoja 2", fila física 2 con cabecera) y xls (hoja "clientes") aportan `SourcePosition.sheet` |
| `Mt101MillionFileProcessE2EIT` (1M, `-Xmx768m`) | **1 / 0 / 0 · 852,4 s (~14,2 min) · sin OOM** | cero regresión a escala en v61 (post item 2: 3 columnas + write path de posición) |
| readers CSV 6 / TXT 5 + DbWrite 9 + staging correction 7 | **sin regresión** | los cambios A/B no rompen readers/staging |
| Frontend `web` (vitest) | **520 / 0 (104 archivos)** | paridad i18n (claves `physicalLine*`) + build prod limpio |

**Doble-check del auto-llenado (A/frontend):** verificado que `recordNumber` (source_record, 1-based) = `record_index`
(staging, 0-based) + 1 — confirmado por el mapeo del test de corrección (record_index 24 ↔ recordNumber 25). Por eso el
frontend hace `recordNumber = match.recordIndex + 1` (correcto).

## Notas de alcance

- **F (CSV multilínea)**: `CsvReaderProvider` usa `readLine()` (no RFC con comillas multilínea). La línea física es
  correcta para CSV lineal; un campo multilínea se mis-parsearía. Documentado como restricción (prohibir multilínea en
  pagos); no abordado (borde).
- **resolveNormalPay obligatorio (B del análisis v60)**: descartado con doble-check (no cierra correctitud; quita el
  gobierno manual).
