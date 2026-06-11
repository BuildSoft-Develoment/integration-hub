-- @trace spec 008-mensajeria-pagos RNF-04 (alto volumen)
-- MT101_BUILD_FROM_TABLE filtra staging_record por (process_execution_id,
-- task_definition_id) y pagina por id (keyset). Sin este indice, cada pagina
-- de un archivo de 1M registros hace un seq scan completo.

create index if not exists ix_staging_record_execution_task_id
    on staging_record (process_execution_id, task_definition_id, id);
