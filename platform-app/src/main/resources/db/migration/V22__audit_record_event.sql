-- Store frio de auditoria a nivel de registro (trazabilidad E2E). Append-only,
-- separado de audit_event (proceso/tarea) para escalar a millones sin presionar el
-- modelo transaccional. Landing intercambiable por ClickHouse/Elastic/lake tras el
-- mismo writer del consumidor.
create table if not exists audit_record_event (
    id bigserial primary key,
    event_id varchar(64) not null,
    trace_id varchar(120),
    record_id varchar(64),
    stage varchar(80) not null,
    status varchar(30),
    process_execution_id bigint,
    task_definition_id bigint,
    message text,
    payload_json text,
    event_ts timestamp not null,
    ingested_at timestamp not null default current_timestamp
);

-- Idempotencia (entrega at-least-once).
create unique index if not exists ux_audit_record_event_event_id on audit_record_event (event_id);
-- Consulta E2E: linea de tiempo por registro (:20:) y por ejecucion (traceId).
create index if not exists ix_audit_record_event_record on audit_record_event (record_id, event_ts);
create index if not exists ix_audit_record_event_trace on audit_record_event (trace_id, event_ts);
