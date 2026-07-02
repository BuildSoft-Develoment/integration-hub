-- @trace specs/008-mensajeria-pagos RF-022, RF-024
-- Resolucion gobernada de PAY incierto y correctivos hijos para pagos parciales.

alter table mt101_rebuild_run
    add column if not exists parent_rebuild_run_id varchar(80),
    add column if not exists parent_corrective_set_id varchar(80),
    add column if not exists corrective_generation integer not null default 1;

create index if not exists ix_mt101_rebuild_run_parent
    on mt101_rebuild_run (parent_rebuild_run_id, corrective_generation);

create index if not exists ix_mt101_rebuild_run_parent_set
    on mt101_rebuild_run (parent_corrective_set_id);

alter table mt101_corrective_pay_fragment
    add column if not exists resolved_at timestamp,
    add column if not exists resolution_source varchar(40);
