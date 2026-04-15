alter table process_task_definition
    add column if not exists active boolean not null default true;

update process_task_definition
set active = true
where active is distinct from true;
