-- Índice para la correlación de la completación async (ADR-015 Etapa 4):
-- ProcessTaskExecutionRepository.findActiveSuspendedByExecutionAndTask filtra por
-- (process_execution_id, task_definition_id) entre las suspensiones ACTIVAS. Sin él, cada
-- completación hace un seq-scan de process_task_execution (O(N) por work-item) -> catastrófico a
-- escala (muchas ejecuciones). Parcial: solo indexa suspensiones activas, así que es diminuto y
-- exacto para la consulta (process_execution_id no tenía índice: era solo FK).
create index if not exists ix_process_task_execution_active_suspension
    on process_task_execution (process_execution_id, task_definition_id)
    where resumed_at is null and status = 'SUSPENDED';
