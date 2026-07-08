-- @trace item 2 (app_htoh 60): precisión de auditoría "¿qué LÍNEA del archivo falló?".
-- record_index (0-based) es el ordinal LÓGICO del registro de datos: no cuenta cabeceras ni las líneas físicas que un
-- registro multilínea pueda ocupar, y en Excel no hay "línea" global. Se añade la posición FÍSICA capturada por el
-- reader (único que la conoce): línea física para CSV/TXT/FIN, hoja+fila para Excel. Nullable: readers que no la
-- aportan la dejan en NULL (no se inventa una línea).
alter table staging_record
    add column if not exists physical_line bigint,      -- 1-based; línea física del archivo (CSV/TXT/FIN)
    add column if not exists sheet_name    varchar(255), -- Excel: nombre de la hoja
    add column if not exists sheet_row     bigint;       -- Excel: fila 1-based dentro de la hoja

-- Índice de soporte para el lookup "línea física -> registro" por archivo.
create index if not exists ix_staging_record_physical_line
    on staging_record (source_file_hash, physical_line);
