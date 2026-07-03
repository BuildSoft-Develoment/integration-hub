-- Progreso en vivo de tareas SÍNCRONAS a escala (mejora UI/UX). Tabla DEDICADA (no una columna en
-- process_task_execution) porque el engine actualiza el estado de la tarea vía entity managed y el flush
-- de Hibernate reescribiría la columna out-of-band. Esta tabla NO es una entity del engine: el loop batch
-- la upsertea en su propia tx (throttled) durante la corrida y la UI de monitoreo la lee, sin que el
-- completeTask del engine la pise. El progreso granular de scatter vive en task_async_dispatch.
create table if not exists task_sync_progress (
    process_execution_id bigint not null,
    task_definition_id bigint not null,
    records_processed bigint not null default 0,
    updated_at timestamp not null default current_timestamp,
    primary key (process_execution_id, task_definition_id)
);
