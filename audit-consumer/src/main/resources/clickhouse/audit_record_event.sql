-- DDL de referencia para el store frio en ClickHouse (audit.cold-store.type=CLICKHOUSE).
-- ClickHouse no corre Flyway; crear esta tabla antes de apuntar el consumidor.
-- ReplacingMergeTree dedup por event_id (entrega del MQ at-least-once).
create table if not exists audit_record_event
(
    event_id             String,
    trace_id             String,
    record_id            String,
    stage                String,
    status               String,
    process_execution_id Nullable(Int64),
    task_definition_id   Nullable(Int64),
    message              Nullable(String),
    payload_json         Nullable(String),
    standard             Nullable(String),
    message_type         Nullable(String),
    source_file_name     Nullable(String),
    source_file_hash     Nullable(String),
    record_number        Nullable(Int64),
    business_key         Nullable(String),
    business_key_hash    Nullable(String),
    payment_reference    Nullable(String),
    transaction_reference Nullable(String),
    uetr                 Nullable(String),
    archive_id           Nullable(Int64),
    gateway_reference    Nullable(String),
    event_ts             DateTime64(3),
    ingested_at          DateTime64(3) default now64(3)
)
engine = ReplacingMergeTree(ingested_at)
partition by toYYYYMM(event_ts)
order by (record_id, payment_reference, transaction_reference, event_ts, event_id);
