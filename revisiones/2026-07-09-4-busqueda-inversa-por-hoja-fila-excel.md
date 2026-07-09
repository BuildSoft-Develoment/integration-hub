# #4 — búsqueda inversa por hoja + fila de Excel (espejo de la línea física para readers XLS/XLSX)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis app_htoh(63) #4 ("la búsqueda inversa enriquecida (G-A) solo resuelve por línea física; los
archivos Excel se posicionan por hoja+fila, no por línea física"), validado contra el código real.

## Qué reveló la validación contra el código

- G-A resolvía `archivo + línea física` → registro(s) + cuarentena (`findLineageByPhysicalLine`, índice V90 sobre
  `(source_file_hash, physical_line)`), pero los readers Excel (`XLS`/`XLSX`) **no** llenan `physical_line`: siembran
  `sheet_name` + `sheet_row` en `staging_record`. Para un archivo Excel, soporte **no** tenía forma de partir de la
  posición que ve el usuario ("Hoja 'Pagos', fila 1532").

## Cambio (espejo simétrico de la línea física, sin duplicar la lógica de enriquecimiento)

- **Migración V93** `ix_staging_record_sheet_row` sobre `(source_file_hash, sheet_name, sheet_row)` → la búsqueda por
  hoja+fila es indexada (igual que V90 para la línea física).
- **Repo** `Mt101StagingRecordRepository.findLineageBySheetRow(...)`: **mismo** `LEFT JOIN LATERAL` a
  `mt101_failed_record` (cuarentena) que `findLineageByPhysicalLine`, con `where sr.source_file_hash = ? and
  sr.sheet_name = ? and sr.sheet_row = ?`. Devuelve `List<PhysicalLineLineage>` (reprocesos visibles, uno por
  ejecución). Lanza si `sheetName` viene en blanco.
- **Servicio** `Mt101FragmentLookupService.findLineageBySheetRow(...)`: valida `sheetRow >= 1`.
- **Endpoint** `GET /api/query/mt101-fragments/by-sheet-row` (`sourceFileHash`, `sheetName`, `sheetRow`,
  `processExecutionId?`): 400 si falta `sheetName` o `sheetRow`; lista vacía (200) si no hay registro.
- **Frontend** (`mt101-fragment-lookup`): tercer bloque de búsqueda "hoja + fila Excel" que reusa **la misma tabla de
  matches** (`physicalLineMatches`) y el mismo deep-link a lineage. i18n en/es (`fieldSheetName`, `fieldSheetRow`,
  `resolveSheetRow`, ...).

Sin camino paralelo: la vista, el enriquecimiento de cuarentena y el deep-link son los mismos; solo cambia la clave de
entrada (hoja+fila en vez de línea física), acorde al reader que produjo el archivo.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PhysicalLineLookupIT` (@QuarkusTest+Postgres) | **(ver corrida)** | `resolvesExcelSheetRowWithQuarantineAndReprocesses`: hoja+fila → lista de reprocesos enriquecida con cuarentena; acotar por ejecución → 1; hoja/fila inexistente → 0; `sheetName` ausente → 400 |
