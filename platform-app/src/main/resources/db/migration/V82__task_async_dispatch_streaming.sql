-- Scatter en streaming (ADR-015, page-chain): un scatter de input por table-streaming descubre sus
-- slices incrementalmente (keyset paging), así que el total NO se conoce al abrir. total_slices pasa a
-- ser NULLABLE: NULL = scatter "unsealed" (aún despachando páginas); un seal posterior fija el total.
-- Con total_slices NULL, la condición terminal (completed+failed >= total_slices) es NULL en SQL → nunca
-- cierra hasta el seal, evitando el cierre prematuro. Los scatter materializados (N conocido) siguen
-- abriendo con total_slices = N y no cambian de comportamiento.
alter table task_async_dispatch alter column total_slices drop not null;
