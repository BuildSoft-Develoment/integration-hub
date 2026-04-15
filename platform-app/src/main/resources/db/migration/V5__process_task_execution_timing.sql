alter table if exists process_task_execution
    add column if not exists started_at timestamp,
    add column if not exists finished_at timestamp;

update process_task_execution
set started_at = coalesce(started_at, executed_at)
where started_at is null;

update process_task_execution
set finished_at = coalesce(finished_at, executed_at)
where finished_at is null
  and status in ('COMPLETED', 'FAILED');
