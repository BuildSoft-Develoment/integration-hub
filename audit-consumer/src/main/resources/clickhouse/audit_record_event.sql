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
    event_ts             DateTime64(3),
    ingested_at          DateTime64(3) default now64(3)
)
engine = ReplacingMergeTree(ingested_at)
partition by toYYYYMM(event_ts)
order by (record_id, event_ts, event_id);
