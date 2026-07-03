-- Progreso en vivo de tareas SÍNCRONAS a escala (mejora UI/UX): el loop batch sync procesa 1M+ registros
-- pero solo reportaba el conteo al terminar. records_processed se actualiza (throttled) durante la corrida
-- para que la UI de monitoreo muestre avance en vez de solo running→done. NULL = sin progreso reportado
-- (once / tareas no batch). El progreso granular de scatter vive en task_async_dispatch.
alter table process_task_execution add column if not exists records_processed bigint;
