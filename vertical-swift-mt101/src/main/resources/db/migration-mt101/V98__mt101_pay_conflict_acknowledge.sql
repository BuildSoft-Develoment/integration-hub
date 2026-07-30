-- A2 (hardening del reconocimiento de PAY_CONFLICT):
-- El acknowledge escribia el motivo del RECONOCIMIENTO encima de pay_conflict_reason, que es el motivo
-- ORIGINAL del conflicto ("el banco confirmo REJECTED sobre un SENT"). La tabla operativa perdia el porque
-- del conflicto y solo conservaba el porque del cierre. Se separan en columnas propias: pay_conflict_reason
-- queda intacto (evidencia) y el reconocimiento se registra aparte, con actor, ticket y fecha.
alter table vertical_mt101.mt101_build_fragment
    add column if not exists pay_conflict_ack_by      varchar(255),
    add column if not exists pay_conflict_ack_at      timestamp,
    add column if not exists pay_conflict_ack_reason  text,
    add column if not exists pay_conflict_ack_ticket  varchar(120);

alter table vertical_mt101.mt101_corrective_pay_fragment
    add column if not exists pay_conflict_ack_by      varchar(255),
    add column if not exists pay_conflict_ack_at      timestamp,
    add column if not exists pay_conflict_ack_reason  text,
    add column if not exists pay_conflict_ack_ticket  varchar(120);
