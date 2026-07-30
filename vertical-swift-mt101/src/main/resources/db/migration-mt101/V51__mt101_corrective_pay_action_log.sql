-- v23 (auditoria bancaria append-only): mt101_rebuild_run conserva solo la ULTIMA solicitud y la
-- ultima resolucion de PAY (una fila que se sobrescribe). Para una pista de auditoria bancaria se
-- agrega un historial INMUTABLE con una fila por accion del ciclo PAY (REQUESTED/CLAIMED/SENT/
-- UNCERTAIN/RESOLVED/REJECTED/INVALIDATED/PARTIALLY_SENT), con actor, motivo, ticket y hashes del
-- payload/config aprobados. Sin fallback: cada transicion deja un rastro que no se borra.
create table if not exists vertical_mt101.mt101_corrective_pay_action (
    id bigserial primary key,
    rebuild_run_id varchar(80) not null,
    action_type varchar(30) not null,
    previous_status varchar(30),
    new_status varchar(30),
    actor varchar(120),
    reason text,
    ticket varchar(120),
    payload_hash varchar(64),
    config_hash varchar(64),
    created_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_pay_action_run
    on vertical_mt101.mt101_corrective_pay_action (rebuild_run_id, id);
