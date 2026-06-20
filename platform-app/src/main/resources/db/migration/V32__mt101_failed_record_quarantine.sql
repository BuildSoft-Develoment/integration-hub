-- @trace spec 008-mensajeria-pagos RF-022 (reproceso quirurgico: cuarentena por fila)
-- Cuarentena de filas que fallan validacion para reprocesar SOLO esas filas, sin
-- regenerar el lote. Requiere mapeo transaccion -> fila exacta del archivo.

-- 1) Mapeo ordenado transaccion -> numero de fila (1-based) por fragmento, alineado
--    con el orden de las transacciones en message_json. Permite resolver el :21:
--    fallido a su fila exacta del archivo sin depender del template de :21:.
alter table mt101_build_fragment
    add column if not exists source_records_json text,
    add column if not exists superseded_by varchar(80);

-- 2) Cola de cuarentena: una fila por transaccion fallida con su identidad completa.
create table if not exists mt101_failed_record (
    id bigserial primary key,
    fragment_set_id varchar(80) not null,
    senders_reference varchar(16),          -- :20: del fragmento que la contenia
    transaction_reference varchar(35),       -- :21: de la transaccion fallida
    source_file_hash varchar(64),
    source_record_number bigint,             -- fila exacta del archivo (1-based)
    rule_code varchar(80),
    rule_set varchar(50),
    severity char(1),
    message text,
    status varchar(20) not null default 'QUARANTINED',  -- ampliado a varchar(40) en V38 para lifecycle correctivo
    created_at timestamp not null default current_timestamp,
    resolved_at timestamp
);

create index if not exists ix_mt101_failed_set
    on mt101_failed_record (fragment_set_id, status);

create index if not exists ix_mt101_failed_source_row
    on mt101_failed_record (source_file_hash, source_record_number);

-- Idempotencia: una entrada por (set, :20:, :21:, regla). Requarantine no duplica.
create unique index if not exists ux_mt101_failed_dedup
    on mt101_failed_record (
        fragment_set_id,
        coalesce(senders_reference, ''),
        coalesce(transaction_reference, ''),
        coalesce(rule_code, ''));
