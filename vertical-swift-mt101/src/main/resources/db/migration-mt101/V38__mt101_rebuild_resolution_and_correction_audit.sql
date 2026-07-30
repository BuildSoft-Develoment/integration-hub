-- Estados gobernados del rebuild correctivo y evidencia durable de mutaciones manuales.
-- El rebuild queda BUILT cuando solo genero el set correctivo; RESOLVED se reserva
-- para cuando el correctivo llego al cierre financiero esperado.

alter table vertical_mt101.mt101_rebuild_run
    add column if not exists request_reason text,
    add column if not exists approval_reason text,
    add column if not exists last_lifecycle_sync_at timestamp;

alter table vertical_mt101.mt101_failed_record
    alter column status type varchar(40);

create table if not exists vertical_mt101.mt101_staging_correction (
    id bigserial primary key,
    fragment_set_id varchar(80) not null,
    process_execution_id bigint not null,
    source_file_hash varchar(64) not null,
    source_record_number bigint not null,
    record_index bigint not null,
    staging_id bigint,
    old_payload_hash varchar(64) not null,
    new_payload_hash varchar(64) not null,
    changed_fields text,
    corrected_by varchar(120) not null,
    correction_reason text,
    ticket_ref varchar(120),
    old_version bigint not null,
    new_version bigint not null,
    created_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_staging_correction_row
    on vertical_mt101.mt101_staging_correction (fragment_set_id, source_file_hash, source_record_number, created_at);

create table if not exists vertical_mt101.mt101_reprocess_audit (
    id bigserial primary key,
    action varchar(40) not null,
    fragment_set_id varchar(80) not null,
    source_file_hash varchar(64),
    record_from bigint,
    record_to bigint,
    from_status varchar(30),
    to_status varchar(30) not null,
    affected integer not null,
    actor varchar(120) not null,
    reason text,
    ticket_ref varchar(120),
    created_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_reprocess_audit_set
    on vertical_mt101.mt101_reprocess_audit (fragment_set_id, created_at);
