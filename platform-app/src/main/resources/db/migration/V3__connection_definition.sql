create table if not exists connection_definition (
    id bigserial primary key,
    name varchar(120) not null unique,
    connection_type varchar(40) not null,
    active boolean not null default true,
    configuration_json text not null
);