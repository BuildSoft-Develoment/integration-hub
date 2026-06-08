-- @trace spec 008-mensajeria-pagos RF-013 (modelo de datos sub-catalogo swift/)
-- @trace spec 008-mensajeria-pagos T-001 (tabla ejecutable de tareas)
-- ADR-009 vertical de mensajeria de pagos

-- Envelope SWIFT (multi-MT: 101, 103, 202, 900, 910, 940, 942)
create table if not exists swift_message_envelope (
    id bigserial primary key,
    message_type char(3) not null,
    sender_lt char(12),
    receiver_lt char(12),
    session bigint,
    sequence bigint,
    uetr varchar(36),
    priority char(1),
    raw_payload text,
    payload_hash char(64),
    parsed_at timestamp not null default current_timestamp,
    source_file_name varchar(255),
    process_execution_id bigint references process_execution(id) on delete set null
);

create unique index if not exists ux_swift_envelope_uetr
    on swift_message_envelope (sender_lt, uetr)
    where uetr is not null;

create index if not exists ix_swift_envelope_type_parsed
    on swift_message_envelope (message_type, parsed_at);

-- Archivo inmutable MT101 (sec A)
create table if not exists mt101_archive (
    id bigserial primary key,
    envelope_id bigint references swift_message_envelope(id) on delete set null,
    senders_reference varchar(16) not null,
    customer_specified_reference varchar(16),
    message_index integer,
    message_total integer,
    requested_execution_date date,
    instructing_party_kind char(1),
    instructing_party_value text,
    ordering_customer_kind char(1),
    ordering_customer_account varchar(34),
    ordering_customer_name_addr text,
    account_servicing_kind char(1),
    account_servicing_value text,
    status varchar(20) not null default 'PENDING',
    format char(4),
    created_at timestamp not null default current_timestamp,
    retention_until date
);

create unique index if not exists ux_mt101_archive_idempotency
    on mt101_archive (senders_reference, requested_execution_date);

create index if not exists ix_mt101_archive_status
    on mt101_archive (status, created_at);

-- Transacciones MT101 (sec B, repetitiva)
create table if not exists mt101_transaction (
    id bigserial primary key,
    archive_id bigint not null references mt101_archive(id) on delete cascade,
    sequence_number integer not null,
    transaction_reference varchar(16) not null,
    fx_deal_reference varchar(16),
    instruction_code varchar(35),
    amount_currency char(3) not null,
    amount_value numeric(18,3) not null,
    ordering_customer_kind char(1),
    ordering_customer_account varchar(34),
    ordering_customer_name_addr text,
    account_servicing_kind char(1),
    account_servicing_value text,
    intermediary text,
    account_with_institution text,
    beneficiary_kind char(1),
    beneficiary_account varchar(34),
    beneficiary_name_addr text,
    remittance_information text,
    regulatory_reporting text,
    original_amount_currency char(3),
    original_amount_value numeric(18,3),
    details_of_charges char(3) not null,
    charges_account varchar(34),
    exchange_rate numeric(15,8)
);

create unique index if not exists ux_mt101_transaction_ref
    on mt101_transaction (archive_id, transaction_reference);

create index if not exists ix_mt101_transaction_currency
    on mt101_transaction (amount_currency);

-- Issues de validacion (NVR y otras reglas del catalogo)
create table if not exists mt101_validation_issue (
    id bigserial primary key,
    archive_id bigint references mt101_archive(id) on delete cascade,
    transaction_id bigint references mt101_transaction(id) on delete cascade,
    rule_code varchar(20) not null,
    rule_set varchar(50) not null,
    severity char(1) not null,
    message text,
    detected_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_validation_archive
    on mt101_validation_issue (archive_id);

create index if not exists ix_mt101_validation_rule
    on mt101_validation_issue (rule_set, rule_code);

-- Confirmaciones recibidas (MT900/MT910/STATUS_API)
create table if not exists mt101_confirmation (
    id bigserial primary key,
    archive_id bigint references mt101_archive(id) on delete cascade,
    confirmation_type varchar(10) not null,
    gateway_reference varchar(35),
    confirmed_status varchar(20),
    raw_payload text,
    received_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_confirmation_archive
    on mt101_confirmation (archive_id);

-- Excepciones de conciliacion (cruce N:N enviados vs confirmados)
create table if not exists mt101_reconciliation_exception (
    id bigserial primary key,
    as_of_date date not null,
    archive_id bigint references mt101_archive(id) on delete set null,
    confirmation_id bigint references mt101_confirmation(id) on delete set null,
    exception_type varchar(30) not null,
    details text,
    resolved_at timestamp
);

create index if not exists ix_mt101_recon_asof
    on mt101_reconciliation_exception (as_of_date, exception_type);

-- Catalogo de reglas de validacion (parametrizable, sin enumerar codigos en spec)
create table if not exists payment_validation_rule (
    id bigserial primary key,
    rule_set varchar(50) not null,
    code varchar(20) not null,
    standard varchar(20) not null,
    applies_to varchar(50) not null,
    severity char(1) not null,
    predicate_kind varchar(20) not null,
    predicate_body text not null,
    active boolean not null default true
);

create unique index if not exists ux_payment_rule
    on payment_validation_rule (rule_set, code, applies_to);
