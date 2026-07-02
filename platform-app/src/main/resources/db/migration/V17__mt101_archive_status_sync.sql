-- @trace spec 008-mensajeria-pagos RF-017 (trazabilidad de estado de negocio)
--
-- Sincronizacion del estado durable de mt101_archive a lo largo del pipeline:
-- ARCHIVE marca ARCHIVED, PAY -> SENT/REJECTED, STATUS -> CONFIRMED/REJECTED,
-- RECONCILE -> RECONCILED/UNMATCHED. updated_at audita cada transicion.

alter table mt101_archive
    add column if not exists updated_at timestamp not null default current_timestamp;

-- Indice para que el UPDATE por senders_reference de cada etapa sea O(log n)
-- (un set masivo actualiza decenas de miles de filas por etapa).
create index if not exists ix_mt101_archive_senders_reference
    on mt101_archive (senders_reference);
