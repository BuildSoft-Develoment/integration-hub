-- @trace spec 008-mensajeria-pagos RF-002, RF-009 (trazabilidad E2E por registro a escala 1M)
-- Cierra la identidad estable de fila: hash de archivo + numero de fila (1-based)
-- separados del id tecnico de staging, para ubicar "que fila del archivo fallo".

-- 1) staging_record: hash estable del archivo origen (csv/txt/excel/fin/...).
--    record_index (0-based) ya existe desde V1; el hash identifica el archivo exacto.
alter table staging_record
    add column if not exists source_file_hash varchar(64);

create index if not exists ix_staging_record_source_file
    on staging_record (source_file_hash, record_index);

-- 2) mt101_build_fragment: separar id tecnico de staging (joins) del numero de
--    fila del archivo (soporte/UI). Hasta ahora source_row_from/to guardaban el
--    id de staging, no la fila -> el lookup "fila -> fragmento" fallaba.
alter table mt101_build_fragment
    add column if not exists staging_id_from    bigint,
    add column if not exists staging_id_to      bigint,
    add column if not exists source_record_from bigint,  -- 1-based, fila visible al operador
    add column if not exists source_record_to   bigint,  -- 1-based
    add column if not exists source_file_hash   varchar(64);

-- Backfill historico: lo que se guardaba en source_row_from/to era el id de
-- staging, asi que se migra a staging_id_*. source_record_* queda nulo en filas
-- viejas (su lookup ya estaba roto); se repuebla al reconstruir el set.
update mt101_build_fragment
set staging_id_from = source_row_from,
    staging_id_to   = source_row_to
where staging_id_from is null;

create index if not exists ix_mt101_fragment_source_record
    on mt101_build_fragment (source_file_hash, source_record_from, source_record_to);

create index if not exists ix_mt101_fragment_execution_source_record
    on mt101_build_fragment (process_execution_id, source_table, source_record_from, source_record_to);

-- 3) mt101_validation_issue: :21: como columna consultable, no embebido en el
--    texto del mensaje. La fila exacta del archivo se resuelve por join via
--    senders_reference (:20:) -> mt101_build_fragment.source_record_from/to.
alter table mt101_validation_issue
    add column if not exists transaction_reference varchar(35);

create index if not exists ix_mt101_validation_transaction
    on mt101_validation_issue (fragment_set_id, transaction_reference);
