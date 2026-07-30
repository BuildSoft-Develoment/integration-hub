-- @trace specs/008-mensajeria-pagos RF-007, RF-024
-- Ruta persistida del correctivo y ledger PREPARED antes de invocar gateways.

alter table vertical_mt101.mt101_build_fragment
    add column if not exists routed_as varchar(80),
    add column if not exists routed_at timestamp,
    add column if not exists route_error text;

create index if not exists ix_mt101_build_fragment_route
    on vertical_mt101.mt101_build_fragment (fragment_set_id, routed_as);

alter table vertical_mt101.mt101_corrective_pay_fragment
    add column if not exists transport varchar(20),
    add column if not exists endpoint_ref varchar(512),
    add column if not exists prepared_at timestamp,
    add column if not exists dispatched_at timestamp;

create index if not exists ix_mt101_corrective_pay_fragment_reference
    on vertical_mt101.mt101_corrective_pay_fragment (corrective_set_id, corrective_senders_reference);
