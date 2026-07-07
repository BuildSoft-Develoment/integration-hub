-- Auto-recuperación de la page-chain (ADR-015): timestamp de la última actividad del scatter, para
-- detectar streaming scatters ESTANCADOS (PENDING sin progreso por > umbral) y re-inyectar su última
-- página automáticamente. Se actualiza en cada mutación del tracker (open/slice/dispatch/seal).
alter table task_async_dispatch add column if not exists last_progress_at timestamp;
update task_async_dispatch set last_progress_at = coalesce(completed_at, created_at) where last_progress_at is null;
