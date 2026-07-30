-- @trace spec 008-mensajeria-pagos RF-009, RF-022
-- Linaje relacional fila <-> fragmento y rebuild correctivo auditable/paginable.

create table if not exists vertical_mt101.mt101_rebuild_run (
    rebuild_run_id varchar(80) primary key,
    original_fragment_set_id varchar(80) not null,
    corrective_set_id varchar(80) not null,
    status varchar(30) not null default 'REQUESTED',
    requested_by varchar(120),
    approved_by varchar(120),
    selected_rows bigint not null default 0,
    affected_fragments integer not null default 0,
    error_message text,
    created_at timestamp not null default current_timestamp,
    approved_at timestamp,
    built_at timestamp,
    completed_at timestamp,
    updated_at timestamp not null default current_timestamp
);

create unique index if not exists ux_mt101_rebuild_run_corrective
    on vertical_mt101.mt101_rebuild_run (corrective_set_id);

create index if not exists ix_mt101_rebuild_run_original_status
    on vertical_mt101.mt101_rebuild_run (original_fragment_set_id, status);

create table if not exists vertical_mt101.mt101_rebuild_selection (
    id bigserial primary key,
    rebuild_run_id varchar(80) not null references vertical_mt101.mt101_rebuild_run(rebuild_run_id) on delete cascade,
    fragment_set_id varchar(80) not null,
    source_file_hash varchar(64),
    source_record_number bigint not null,
    record_index bigint not null,
    staging_id bigint,
    original_senders_reference varchar(16),
    original_transaction_reference varchar(35),
    status varchar(30) not null default 'SELECTED',
    created_at timestamp not null default current_timestamp
);

create unique index if not exists ux_mt101_rebuild_selection_row
    on vertical_mt101.mt101_rebuild_selection (
        rebuild_run_id,
        coalesce(source_file_hash, ''),
        source_record_number
    );

create index if not exists ix_mt101_rebuild_selection_lookup
    on vertical_mt101.mt101_rebuild_selection (rebuild_run_id, record_index);

create index if not exists ix_mt101_rebuild_selection_original_ref
    on vertical_mt101.mt101_rebuild_selection (rebuild_run_id, original_senders_reference);

create table if not exists vertical_mt101.mt101_fragment_record (
    id bigserial primary key,
    fragment_id bigint references vertical_mt101.mt101_build_fragment(id) on delete cascade,
    fragment_set_id varchar(80) not null,
    original_fragment_set_id varchar(80),
    source_file_hash varchar(64),
    source_record_number bigint not null,
    staging_id bigint,
    original_senders_reference varchar(16),
    original_transaction_reference varchar(35),
    current_senders_reference varchar(16),
    current_transaction_reference varchar(35),
    rebuild_run_id varchar(80),
    status varchar(30) not null default 'BUILT',
    created_at timestamp not null default current_timestamp
);

create unique index if not exists ux_mt101_fragment_record_current
    on vertical_mt101.mt101_fragment_record (
        fragment_set_id,
        coalesce(source_file_hash, ''),
        source_record_number
    );

create index if not exists ix_mt101_fragment_record_source
    on vertical_mt101.mt101_fragment_record (source_file_hash, source_record_number);

create index if not exists ix_mt101_fragment_record_transaction
    on vertical_mt101.mt101_fragment_record (current_transaction_reference);

create index if not exists ix_mt101_fragment_record_rebuild
    on vertical_mt101.mt101_fragment_record (rebuild_run_id);
