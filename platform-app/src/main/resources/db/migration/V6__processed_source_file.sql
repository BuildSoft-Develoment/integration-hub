create table if not exists processed_source_file (
    id bigserial primary key,
    process_execution_id bigint not null references process_execution(id) on delete cascade,
    task_definition_id bigint not null references process_task_definition(id) on delete cascade,
    file_name varchar(255) not null,
    file_path text,
    media_type varchar(120),
    file_size bigint,
    last_modified timestamp,
    status varchar(30) not null,
    record_count integer not null default 0,
    skipped_count integer not null default 0,
    written_count integer not null default 0,
    error_message text,
    created_at timestamp not null default now()
);

create index if not exists idx_processed_source_file_execution_task
    on processed_source_file(process_execution_id, task_definition_id);
