-- v53-fix (#8): claim ATOMICO DISTRIBUIDO de process_execution para cluster.
-- La transicion PENDING->RUNNING pasa de read-then-write (racy entre nodos) a un UPDATE...WHERE status='PENDING'
-- con owner/token/lease/heartbeat. Habilita ademas recuperacion segura de ejecuciones huerfanas (lease vencido):
-- una ejecucion que ya inicio PAY se marca NEEDS_RECONCILIATION (nunca se re-ejecuta a ciegas), no PAY -> PENDING.
alter table process_execution
    add column if not exists execution_owner varchar(120),
    add column if not exists execution_token varchar(64),
    add column if not exists execution_lease_until timestamp,
    add column if not exists execution_heartbeat_at timestamp,
    add column if not exists execution_attempt integer not null default 0;

-- Indice para el barrido de recuperacion (RUNNING con lease vencido) y para el claim por estado.
create index if not exists ix_process_execution_status_lease
    on process_execution (status, execution_lease_until);
