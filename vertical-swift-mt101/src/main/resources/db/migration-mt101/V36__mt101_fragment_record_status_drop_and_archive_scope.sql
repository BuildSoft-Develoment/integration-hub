-- P1.1: mt101_fragment_record.status era estado duplicado del fragmento padre, nunca
-- leido. Se elimina para no mantener un estado desincronizado.
alter table vertical_mt101.mt101_fragment_record
    drop column if exists status;

-- P1.2: scope del timeline financiero por ejecucion. Un :20: original (p.ej. P3) puede
-- repetirse entre ejecuciones; buscar el archive solo por senders_reference podia traer
-- el de otra ejecucion. Se agrega process_execution_id (que el pipeline de archivo ya
-- conoce) para acotar la consulta.
alter table vertical_mt101.mt101_archive
    add column if not exists process_execution_id bigint;

create index if not exists ix_mt101_archive_senders_execution
    on vertical_mt101.mt101_archive (senders_reference, process_execution_id);
