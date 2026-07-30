-- :20: correctivo unico por secuencia de BD (no por CRC32, que puede colisionar a 32 bits).
-- Cada rebuild run toma un valor de la secuencia y lo codifica (base36) como prefijo del
-- senders reference correctivo (R + reference_code + indice de mensaje). La secuencia
-- garantiza unicidad entre runs; el indice de mensaje desambigua dentro del run.
create sequence if not exists vertical_mt101.mt101_rebuild_reference_seq;

alter table vertical_mt101.mt101_rebuild_run
    add column if not exists reference_code varchar(12);
