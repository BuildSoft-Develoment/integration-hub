create index if not exists ix_mt101_build_fragment_source_row
    on mt101_build_fragment (source_table, source_row_from, source_row_to);

create index if not exists ix_mt101_build_fragment_execution_source_row
    on mt101_build_fragment (process_execution_id, source_table, source_row_from, source_row_to);
