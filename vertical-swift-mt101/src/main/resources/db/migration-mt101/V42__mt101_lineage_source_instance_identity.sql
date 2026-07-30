-- B3': identidad de origen en el linaje. Dos archivos byte-identicos (mismo SHA) de
-- ubicaciones distintas en una ejecucion producen (hash, record_index) solapados (el
-- contador de DB_WRITE arranca en 0 por hash+location). Hasta ahora el indice unico de
-- mt101_fragment_record era (fragment_set_id, hash, source_record_number) y el insert
-- 'on conflict do nothing' DESCARTABA en silencio las filas del 2do archivo, perdiendo su
-- trazabilidad. staging_record si conserva ambas (distinguidas por id + source_name).

-- 1) Desambiguador de origen visible (de staging_record). source_task_definition_id es la
--    tarea DB_WRITE que escribio la fila (no el build), util cuando dos DB_WRITE coinciden.
alter table vertical_mt101.mt101_fragment_record
    add column if not exists source_task_definition_id bigint,
    add column if not exists source_name varchar(255);

alter table vertical_mt101.mt101_rebuild_selection
    add column if not exists source_task_definition_id bigint,
    add column if not exists source_name varchar(255);

-- 2) La identidad incluye staging_id (ya almacenado y unico por fila de origen): asi el 2do
--    archivo identico ya NO se descarta. Los duplicados reales (mismo staging_id) si dedupean.
drop index if exists vertical_mt101.ux_mt101_fragment_record_current;
create unique index if not exists ux_mt101_fragment_record_current
    on vertical_mt101.mt101_fragment_record (
        fragment_set_id,
        coalesce(source_file_hash, ''),
        source_record_number,
        coalesce(staging_id, 0)
    );

drop index if exists vertical_mt101.ux_mt101_rebuild_selection_row;
create unique index if not exists ux_mt101_rebuild_selection_row
    on vertical_mt101.mt101_rebuild_selection (
        rebuild_run_id,
        coalesce(source_file_hash, ''),
        source_record_number,
        coalesce(staging_id, 0)
    );

create index if not exists ix_mt101_fragment_record_source_task
    on vertical_mt101.mt101_fragment_record (source_task_definition_id);
