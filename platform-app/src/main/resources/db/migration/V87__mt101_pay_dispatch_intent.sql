-- P3 (PAY directo por lista durable): ledger de INTENCIÓN de dispatch para el camino de lista en memoria
-- (MT101_BUILD/SPLIT -> MT101_PAY), que hoy llama transport.send() sin claim ni durabilidad.
--
-- El camino persistido (BUILD_FROM_TABLE -> mt101_build_fragment) ya reclama ARCHIVED->DISPATCHING antes de enviar y
-- deja UNCERTAIN durable. Este ledger le da la MISMA re-request-safety al camino de lista, SIN cambiar la topología:
-- antes de enviar se reclama la clave de dispatch (la idempotency key del banco, determinista por-pago); un re-request
-- del mismo pago encuentra la fila y NO reenvía (SENT/UNCERTAIN/DISPATCHING bloquean; REJECTED pre-dispatch permite
-- reintento). Vive en la DB de la plataforma (dedup platform-side, no dato de banco).
create table mt101_pay_dispatch_intent (
    id                    bigserial primary key,
    dispatch_key          varchar(512) not null,
    process_execution_id  bigint,
    senders_reference     varchar(35),
    status                varchar(20)  not null,   -- DISPATCHING | SENT | REJECTED | UNCERTAIN
    gateway_reference     varchar(140),
    attempts              integer      not null default 0,
    error_message         text,
    created_at            timestamp    not null default current_timestamp,
    updated_at            timestamp    not null default current_timestamp,
    constraint ux_mt101_pay_dispatch_intent_key unique (dispatch_key)
);

-- La unicidad de dispatch_key hace el claim atómico (INSERT ... ON CONFLICT). Índice de soporte para consultas por
-- ejecución (trazabilidad/conciliación).
create index ix_mt101_pay_dispatch_intent_exec on mt101_pay_dispatch_intent (process_execution_id);
