-- Maker-checker OPT-IN para reconocer un PAY_CONFLICT (segregacion de funciones, control bancario).
-- Solo se usa cuando mt101.pay.conflict.acknowledge.maker-checker.enabled=true. Con false se mantiene el
-- acknowledge single-actor (V98). NO es un fallback: es el modo configurado por ambiente (off dev/UAT, on prod).
--
-- Flujo con maker-checker ON:
--   1) request-acknowledge (MAKER): registra la intencion (PENDING) SIN apagar la alerta (pay_conflict sigue true).
--   2) approve-acknowledge (CHECKER, actor DISTINTO): limpia el flag pay_conflict + emite PAY_CONFLICT_RESOLVED
--      con ambos actores, en una sola transaccion (V98).
create table mt101_pay_conflict_ack_request (
    id                bigserial primary key,
    source            varchar(12)  not null,   -- NORMAL | CORRECTIVE
    set_or_run_id     varchar(80)  not null,   -- fragmentSetId (NORMAL) | rebuildRunId (CORRECTIVE)
    senders_reference varchar(35)  not null,   -- :20:
    requested_by      varchar(120) not null,   -- maker
    reason            text         not null,
    ticket_ref        varchar(120) not null,
    status            varchar(12)  not null default 'PENDING',   -- PENDING | APPROVED
    approved_by       varchar(120),            -- checker
    requested_at      timestamp    not null default current_timestamp,
    approved_at       timestamp
);

-- Una sola solicitud PENDING por conflicto (source + set/run + :20:); el historial APPROVED se conserva.
create unique index ux_mt101_ack_request_pending
    on mt101_pay_conflict_ack_request (source, set_or_run_id, senders_reference)
    where status = 'PENDING';
