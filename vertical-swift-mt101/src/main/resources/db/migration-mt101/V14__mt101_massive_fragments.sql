-- @trace spec 008-mensajeria-pagos RNF-04, RF-017, RF-022
-- Soporte para MT101 masivo/reprocesable: fragmentos persistidos y codigos de regla largos.

alter table vertical_mt101.mt101_validation_issue
    alter column rule_code type varchar(80);

alter table vertical_mt101.payment_validation_rule
    alter column code type varchar(80);

create table if not exists vertical_mt101.mt101_build_fragment (
    id bigserial primary key,
    fragment_set_id varchar(80) not null,
    process_execution_id bigint references process_execution(id) on delete set null,
    task_definition_id bigint,
    source_table varchar(255),
    source_row_from bigint,
    source_row_to bigint,
    fragment_index integer not null,
    fragment_total integer not null,
    senders_reference varchar(16) not null,
    payload_hash char(64) not null,
    raw_payload text not null,
    message_json text not null,
    status varchar(20) not null default 'BUILT',
    error_message text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create unique index if not exists ux_mt101_build_fragment_set_index
    on vertical_mt101.mt101_build_fragment (fragment_set_id, fragment_index);

create unique index if not exists ux_mt101_build_fragment_set_ref
    on vertical_mt101.mt101_build_fragment (fragment_set_id, senders_reference);

create index if not exists ix_mt101_build_fragment_status
    on vertical_mt101.mt101_build_fragment (fragment_set_id, status);

create index if not exists ix_mt101_build_fragment_execution
    on vertical_mt101.mt101_build_fragment (process_execution_id, task_definition_id);
