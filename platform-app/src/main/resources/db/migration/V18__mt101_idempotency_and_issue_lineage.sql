-- @trace spec 008-mensajeria-pagos RF-013, RF-017, RF-022
-- Hardening productivo:
-- 1) idempotencia operacional de mt101_archive por sender LT + :20: + anio.
-- 2) linaje de issues NVR contra fragment_set/senders_reference en flujos masivos.

alter table mt101_archive
    add column if not exists sender_lt char(12);

update mt101_archive archive
set sender_lt = envelope.sender_lt
from swift_message_envelope envelope
where archive.envelope_id = envelope.id
  and archive.sender_lt is null;

drop index if exists ux_mt101_archive_idempotency;

create unique index if not exists ux_mt101_archive_operational_idempotency
    on mt101_archive (
        coalesce(sender_lt, ''),
        senders_reference,
        (extract(year from coalesce(requested_execution_date, created_at::date))::integer)
    );

alter table mt101_validation_issue
    add column if not exists fragment_set_id varchar(80),
    add column if not exists senders_reference varchar(16),
    add column if not exists fragment_index integer;

create index if not exists ix_mt101_validation_fragment
    on mt101_validation_issue (fragment_set_id, senders_reference);
