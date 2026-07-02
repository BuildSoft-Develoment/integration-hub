-- @trace spec 008-mensajeria-pagos RF-017, RF-022
-- Cierra gobernanza bancaria del PAY correctivo:
-- 1) hash inmutable del lote MT101 aprobado para envio,
-- 2) lease de ejecucion para detectar PAY incierto tras caidas,
-- 3) estado granular por fragmento correctivo enviado/rechazado.

alter table mt101_rebuild_run
    add column if not exists pay_requested_payload_hash varchar(64),
    add column if not exists pay_claimed_payload_hash varchar(64),
    add column if not exists pay_lease_until timestamp,
    add column if not exists pay_uncertain_reason text;

create table if not exists mt101_corrective_pay_fragment (
    id bigserial primary key,
    rebuild_run_id varchar(80) not null references mt101_rebuild_run(rebuild_run_id) on delete cascade,
    corrective_set_id varchar(80) not null,
    corrective_senders_reference varchar(16) not null,
    source_file_hash varchar(64),
    source_record_number bigint,
    staging_id bigint,
    payload_hash varchar(64) not null,
    idempotency_key varchar(180) not null,
    gateway_reference varchar(120),
    pay_status varchar(30) not null default 'REQUESTED',
    attempts integer not null default 0,
    error_message text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    unique (rebuild_run_id, corrective_senders_reference)
);

create index if not exists ix_mt101_corrective_pay_fragment_run_status
    on mt101_corrective_pay_fragment (rebuild_run_id, pay_status);

create index if not exists ix_mt101_corrective_pay_fragment_staging
    on mt101_corrective_pay_fragment (rebuild_run_id, staging_id);
