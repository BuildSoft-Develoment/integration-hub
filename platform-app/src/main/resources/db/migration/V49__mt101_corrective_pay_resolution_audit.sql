-- v22 (riesgo bancario): resolver un PAY_UNCERTAIN (decidir SENT/REJECTED/PARTIALLY_SENT tras la
-- incertidumbre) es una accion sensible que hoy exige executedBy pero NO lo persiste. Se agrega
-- evidencia durable de quien resolvio, cuando y por que. Sin fallback: la resolucion deja rastro.
alter table mt101_rebuild_run
    add column if not exists pay_resolved_by varchar(120),
    add column if not exists pay_resolved_at timestamp,
    add column if not exists pay_resolution_reason text;
