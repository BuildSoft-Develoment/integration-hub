-- Store inbound dedicado para mensajes SWIFT MT101 parseados a escala.
-- Espeja el patron table-backed + paginado del outbound (mt101_build_fragment):
-- MT101_PARSE_FROM_TABLE escribe aqui (1 fila por mensaje), y VALIDATE/ROUTE leen
-- por keyset (id) en paginas, manteniendo memoria O(pageSize) en flujos de 1M tx.
create table if not exists vertical_mt101.swift_inbound_message (
    id bigserial primary key,
    inbound_set_id varchar(80) not null,
    process_execution_id bigint,
    task_definition_id bigint,
    source_table varchar(160),
    row_from bigint,
    row_to bigint,
    senders_reference varchar(16),
    payload_hash varchar(64),
    raw_payload text not null,
    message_json text not null,
    status varchar(16) not null default 'PARSED',
    routed_as varchar(40),
    error_message text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp
);

-- Keyset pagination por (set, status, id): VALIDATE lee PARSED, ROUTE lee VALIDATED.
create index if not exists ix_swift_inbound_message_set_status
    on vertical_mt101.swift_inbound_message (inbound_set_id, status, id);
create index if not exists ix_swift_inbound_message_set_id
    on vertical_mt101.swift_inbound_message (inbound_set_id, id);
