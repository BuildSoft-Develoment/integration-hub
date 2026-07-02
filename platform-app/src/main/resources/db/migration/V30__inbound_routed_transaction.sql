-- Sink final de negocio del inbound: una fila por transaccion entregada tras ROUTE.
-- MT101_INBOUND_DELIVER (transport=DB) lee swift_inbound_message ROUTED por paginas y
-- aplana cada transaccion aqui (modelo consultable, separado del store tecnico).
create table if not exists inbound_routed_transaction (
    id bigserial primary key,
    inbound_set_id varchar(80) not null,
    process_execution_id bigint,
    senders_reference varchar(16),
    transaction_reference varchar(35),
    account varchar(40),
    beneficiary_name varchar(140),
    amount_currency varchar(3),
    amount_value numeric(18,2),
    uetr varchar(36),
    routed_as varchar(40),
    created_at timestamp not null default current_timestamp
);

create index if not exists ix_inbound_routed_transaction_set
    on inbound_routed_transaction (inbound_set_id);
