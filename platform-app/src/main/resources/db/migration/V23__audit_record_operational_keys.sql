-- Claves operativas para trazabilidad E2E por registro y por pago.
-- El consumer las llena desde AuditEnvelope v2; la UI/API puede filtrar sin
-- parsear payload_json y sin exponer datos sensibles en claro.
alter table audit_record_event add column if not exists standard varchar(20);
alter table audit_record_event add column if not exists message_type varchar(30);
alter table audit_record_event add column if not exists source_file_name varchar(255);
alter table audit_record_event add column if not exists source_file_hash char(64);
alter table audit_record_event add column if not exists record_number bigint;
alter table audit_record_event add column if not exists business_key varchar(120);
alter table audit_record_event add column if not exists business_key_hash char(64);
alter table audit_record_event add column if not exists payment_reference varchar(40);
alter table audit_record_event add column if not exists transaction_reference varchar(40);
alter table audit_record_event add column if not exists uetr varchar(36);
alter table audit_record_event add column if not exists archive_id bigint;
alter table audit_record_event add column if not exists gateway_reference varchar(120);

create index if not exists ix_audit_record_event_file_row
    on audit_record_event (source_file_hash, record_number, event_ts);

create index if not exists ix_audit_record_event_payment_ref
    on audit_record_event (payment_reference, event_ts);

create index if not exists ix_audit_record_event_tx_ref
    on audit_record_event (transaction_reference, event_ts);

create index if not exists ix_audit_record_event_uetr
    on audit_record_event (uetr, event_ts);

create index if not exists ix_audit_record_event_archive
    on audit_record_event (archive_id, event_ts);

create index if not exists ix_audit_record_event_business_hash
    on audit_record_event (business_key_hash, event_ts);

create table if not exists audit_dead_letter_event (
    id bigserial primary key,
    event_id varchar(64),
    broker_type varchar(30),
    topic varchar(160),
    payload text not null,
    error_message text not null,
    created_at timestamp not null default current_timestamp
);

create index if not exists ix_audit_dead_letter_event_created
    on audit_dead_letter_event (created_at);
