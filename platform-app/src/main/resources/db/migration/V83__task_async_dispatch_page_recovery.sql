-- Recuperación de la page-chain rota (ADR-015): el tracker persiste la ÚLTIMA página despachada de un
-- scatter en streaming (su work-item JSON + índice). Si la cadena se rompe (una página muere/DLQ bajo
-- failure-strategy=dead-letter-queue y su sucesora nunca se encola), la recuperación re-encola esta
-- página directamente y la cadena reanuda. Monótono por last_page_index (una reentrega fuera de orden no
-- regresa el progreso). NULL para scatter materializado (no aplica).
alter table task_async_dispatch add column if not exists last_page_index integer;
alter table task_async_dispatch add column if not exists last_page_json text;
