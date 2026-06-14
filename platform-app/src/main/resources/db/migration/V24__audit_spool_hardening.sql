-- Hardening operativo del outbox de auditoria.
-- Estados: PENDING -> IN_FLIGHT -> SENT, con retry/backoff y DEAD para poison
-- del productor/broker. Permite multiples replicas mediante claiming con lock.
alter table audit_spool add column if not exists locked_by varchar(120);
alter table audit_spool add column if not exists locked_at timestamp;
alter table audit_spool add column if not exists next_attempt_at timestamp;
alter table audit_spool add column if not exists dead_at timestamp;
alter table audit_spool add column if not exists dead_reason text;

create index if not exists ix_audit_spool_due
    on audit_spool (spool_status, next_attempt_at, id);

create index if not exists ix_audit_spool_locked
    on audit_spool (spool_status, locked_at);

create index if not exists ix_audit_spool_dead
    on audit_spool (spool_status, dead_at);
