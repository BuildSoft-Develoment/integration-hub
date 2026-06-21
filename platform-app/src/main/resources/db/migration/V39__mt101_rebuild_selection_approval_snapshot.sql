-- B2: congelar el payload aprobado por el checker (maker-checker real).
-- La seleccion guarda el hash SHA-256 y la version del staging al solicitar el rebuild.
-- Al ejecutar se compara contra el staging actual: si una fila cambio despues de
-- aprobar, la aprobacion se invalida (el run vuelve a REQUESTED) y no se ejecuta con
-- datos no aprobados. Sin fallback: no se reconstruye con un payload distinto al aprobado.
alter table mt101_rebuild_selection
    add column if not exists selected_payload_hash varchar(64),
    add column if not exists selected_staging_version bigint;
