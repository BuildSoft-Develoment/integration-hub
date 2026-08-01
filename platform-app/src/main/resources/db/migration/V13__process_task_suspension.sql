-- @trace spec 003 T-017 (M-2 suspension engine), ADR-009
-- @trace spec 008-mensajeria-pagos RF-019 (MT101_STATUS callback mode)
--
-- Anade soporte de suspend/resume a process_task_execution. El estado
-- SUSPENDED se aplica tanto al task_execution como al process_execution
-- contenedor (con el mismo enum varchar(30) ya existente).

alter table process_task_execution
    add column if not exists suspended_state text,
    add column if not exists resume_token varchar(64),
    add column if not exists suspended_at timestamp,
    add column if not exists suspend_expires_at timestamp,
    add column if not exists resumed_at timestamp,
    add column if not exists resume_count integer not null default 0;

-- Token opaco (SecureRandom base64url 32 bytes -> 43 chars). Unique a nivel
-- de tabla para que la lookup por callback sea O(log n) y no haya colisiones.
create unique index if not exists ux_process_task_execution_resume_token
    on process_task_execution(resume_token)
    where resume_token is not null;

-- Index para el scheduler periodico que despierte tareas SUSPENDED expiradas.
create index if not exists ix_process_task_execution_suspend_expires_at
    on process_task_execution(suspend_expires_at)
    where suspend_expires_at is not null and resumed_at is null;
