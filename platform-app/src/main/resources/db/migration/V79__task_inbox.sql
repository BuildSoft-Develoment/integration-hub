-- Ledger de idempotencia del consumer de tareas asíncronas (ADR-015). Como el broker entrega
-- at-least-once, el consumer registra aquí cada work-item terminal (por idempotency_key) para
-- descartar reentregas sin repetir el efecto. Es la contraparte de entrada del task_dispatch_outbox.
create table if not exists task_inbox (
    id bigserial primary key,
    idempotency_key varchar(200),
    task_type varchar(80),
    process_execution_id bigint,
    task_definition_id bigint,
    status varchar(16) not null,
    outputs_json text,
    details text,
    error text,
    raw_payload text,
    broker_type varchar(40),
    topic varchar(200),
    created_at timestamp not null default current_timestamp
);

-- Dedup: un registro terminal por idempotency_key. Parcial (WHERE not null) porque las tramas
-- POISON no llevan clave decodificable y no participan del dedup.
create unique index if not exists ux_task_inbox_idem
    on task_inbox (idempotency_key) where idempotency_key is not null;
