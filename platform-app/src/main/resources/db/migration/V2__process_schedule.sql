alter table if exists process_definition
    add column if not exists scheduled boolean not null default false;

alter table if exists process_definition
    add column if not exists schedule_every varchar(40);

alter table if exists process_definition
    add column if not exists next_run_at timestamp;

alter table if exists process_definition
    add column if not exists last_run_at timestamp;