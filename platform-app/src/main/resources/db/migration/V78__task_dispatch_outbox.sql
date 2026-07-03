-- Outbox durable de despacho de tareas asíncronas (ADR-015). Espejo de audit_spool:
-- el motor escribe aquí el work-item en su TX y un relay lo drena al broker de forma
-- fiable (sin pérdida ni duplicado). No acopla la ejecución al broker.
create table if not exists task_dispatch_outbox (
    id bigserial primary key,
    idempotency_key varchar(200) not null,
    transport varchar(40) not null,
    envelope_json text not null,
    status varchar(16) not null default 'PENDING',
    attempts integer not null default 0,
    next_attempt_at timestamp not null default current_timestamp,
    locked_by varchar(80),
    locked_at timestamp,
    last_error text,
    reference varchar(200),
    created_at timestamp not null default current_timestamp,
    sent_at timestamp
);

-- Idempotencia de despacho: un work-item por idempotency_key (at-least-once en el broker,
-- exactly-once en el outbox).
create unique index if not exists ux_task_dispatch_outbox_idem on task_dispatch_outbox (idempotency_key);

-- Drenaje del relay: PENDING vencidos, ordenados por id.
create index if not exists ix_task_dispatch_outbox_due on task_dispatch_outbox (status, next_attempt_at, id);
