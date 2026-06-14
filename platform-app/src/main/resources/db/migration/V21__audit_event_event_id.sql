-- Idempotencia del consumidor de auditoria: el audit-consumer inserta audit_event
-- con el eventId de la trama y deduplica por aqui (ON CONFLICT DO NOTHING), porque
-- la entrega del MQ es at-least-once. Nulls permitidos (unique los ignora) para no
-- chocar con filas previas sin event_id.
alter table audit_event add column if not exists event_id varchar(64);

create unique index if not exists ux_audit_event_event_id on audit_event (event_id);
