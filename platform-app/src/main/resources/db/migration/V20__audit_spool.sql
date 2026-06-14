-- Spool local durable de auditoria (productor). La trama se escribe aqui en una
-- mini-TX propia (NO la TX de negocio) y un relay la drena al MQ de forma async.
-- Garantiza cero perdida sin acoplar la auditoria al pago ni anadir delay.
create table if not exists audit_spool (
    id bigserial primary key,
    event_id varchar(64) not null,
    trace_id varchar(120),
    topic varchar(160) not null,
    partition_key varchar(120),
    payload text not null,
    spool_status varchar(16) not null default 'PENDING',
    attempts integer not null default 0,
    last_error text,
    created_at timestamp not null default current_timestamp,
    sent_at timestamp
);

-- Idempotencia: una trama por event_id.
create unique index if not exists ux_audit_spool_event_id on audit_spool (event_id);

-- Drenaje keyset por el relay: PENDING ordenado por id.
create index if not exists ix_audit_spool_pending on audit_spool (spool_status, id);
