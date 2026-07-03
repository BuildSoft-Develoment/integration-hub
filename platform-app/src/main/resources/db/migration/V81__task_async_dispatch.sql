-- Tracker de agregación scatter-gather N→1 de tareas async por-slice (ADR-015, Opción B). Una fila
-- por tarea despachada en N slices; el consumer incrementa completed_slices atómicamente y la tarea
-- se reanuda cuando completed == total. Único por (process_execution_id, task_definition_id).
create table if not exists task_async_dispatch (
    id bigserial primary key,
    process_execution_id bigint not null,
    task_definition_id bigint not null,
    total_slices integer not null,
    completed_slices integer not null default 0,
    failed_slices integer not null default 0,
    status varchar(16) not null default 'PENDING',
    created_at timestamp not null default current_timestamp,
    completed_at timestamp
);

create unique index if not exists ux_task_async_dispatch_exec_task
    on task_async_dispatch (process_execution_id, task_definition_id);
