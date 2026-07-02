-- P0.1: record_id del nivel-registro compone "sourceName:index" (INGESTED). Con
-- nombres/rutas largos supera varchar(64) y el insert al cold store falla por
-- longitud (NO es poison -> no va a DLQ) y el lote se reintenta sin fin. Se amplia
-- para soportar nombre de archivo + indice global.
alter table audit_record_event alter column record_id type varchar(512);

-- 4.5: dedup del DLQ. La entrega at-least-once reentregaba el mismo poison y
-- duplicaba filas. Hash del payload + unique para absorber reentregas del mismo
-- mensaje (ON CONFLICT DO NOTHING en el writer). Nulls historicos no chocan.
alter table audit_dead_letter_event add column if not exists payload_hash char(64);

create unique index if not exists ux_audit_dead_letter_event_hash
    on audit_dead_letter_event (payload_hash);
