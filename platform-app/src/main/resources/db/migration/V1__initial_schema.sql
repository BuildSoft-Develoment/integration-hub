create table if not exists source_definition (
    id bigserial primary key,
    name varchar(120) not null unique,
    source_type varchar(40) not null,
    active boolean not null default true,
    configuration_json text not null
);

create table if not exists reader_definition (
    id bigserial primary key,
    name varchar(120) not null unique,
    reader_type varchar(40) not null,
    active boolean not null default true,
    configuration_json text not null
);

create table if not exists process_definition (
    id bigserial primary key,
    name varchar(120) not null unique,
    description varchar(255),
    active boolean not null default true
);

create table if not exists process_task_definition (
    id bigserial primary key,
    process_definition_id bigint not null references process_definition(id) on delete cascade,
    task_order integer not null,
    task_type varchar(50) not null,
    source_definition_id bigint references source_definition(id),
    reader_definition_id bigint references reader_definition(id),
    configuration_json text not null
);

create table if not exists process_execution (
    id bigserial primary key,
    process_definition_id bigint not null references process_definition(id),
    status varchar(30) not null,
    started_at timestamp,
    finished_at timestamp,
    details text
);

create table if not exists process_task_execution (
    id bigserial primary key,
    process_execution_id bigint not null references process_execution(id) on delete cascade,
    task_definition_id bigint not null references process_task_definition(id),
    status varchar(30) not null,
    executed_at timestamp,
    details text
);

create table if not exists staging_record (
    id bigserial primary key,
    process_execution_id bigint not null references process_execution(id) on delete cascade,
    task_definition_id bigint not null references process_task_definition(id),
    source_name varchar(255),
    record_index integer not null,
    payload_json text not null,
    created_at timestamp not null default current_timestamp
);

create table if not exists audit_event (
    id bigserial primary key,
    process_execution_id bigint references process_execution(id) on delete set null,
    task_definition_id bigint references process_task_definition(id) on delete set null,
    event_type varchar(80) not null,
    status varchar(30) not null,
    message text,
    payload_json text,
    created_at timestamp not null default current_timestamp
);
