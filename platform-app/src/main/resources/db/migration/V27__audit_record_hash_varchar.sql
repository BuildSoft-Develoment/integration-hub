-- Las columnas de hash se crearon como char(64) (V23, V26), que Postgres reporta
-- como bpchar. La entidad JPA AuditRecordEvent las mapea como varchar(64), lo que
-- dispara un ERROR de validacion de esquema de Hibernate en cada arranque
-- (no bloqueante con database.generation=none, pero ensucia el log). Ademas char(64)
-- rellena con espacios a la derecha; varchar evita sorpresas en igualdad/indices.
-- Se alinean a varchar(64). Los hashes son sha256 hex de longitud fija 64, asi que
-- el cambio no altera datos existentes.
alter table audit_record_event alter column business_key_hash type varchar(64);
alter table audit_record_event alter column source_file_hash type varchar(64);

-- Misma normalizacion para el hash de dedup del DLQ (no tiene entidad JPA, pero se
-- alinea por consistencia del esquema de auditoria).
alter table audit_dead_letter_event alter column payload_hash type varchar(64);
