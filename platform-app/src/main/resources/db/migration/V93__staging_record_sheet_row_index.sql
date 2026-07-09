-- #4 (búsqueda inversa por hoja+fila de Excel): los readers Excel ya llenan sheet_name/sheet_row (V90), pero la
-- búsqueda inversa solo tenía índice por physical_line (CSV/TXT/FIN). Para Excel la clave operativa es (hoja, fila),
-- no la línea física. Este índice hace rápida la query GET /by-sheet-row (source_file_hash + sheet_name + sheet_row)
-- incluso a escala (1M filas), igual que ix_staging_record_physical_line para el camino de línea física.
create index if not exists ix_staging_record_sheet_row
    on staging_record (source_file_hash, sheet_name, sheet_row);
