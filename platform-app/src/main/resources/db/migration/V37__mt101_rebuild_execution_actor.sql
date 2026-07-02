alter table mt101_rebuild_run
    add column if not exists executed_by varchar(120),
    add column if not exists executed_at timestamp;
