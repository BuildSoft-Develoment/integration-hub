-- v25 (hardening): el trigger de V53 evita mutacion desde la app, pero no detecta alteraciones hechas
-- por un DBA con privilegios (deshabilitar trigger, editar filas). Se agrega una CADENA criptografica:
-- cada accion guarda el hash de la anterior (previous_action_hash) y su propio action_hash =
-- sha256(previous | campos de la fila). Alterar/insertar/borrar cualquier fila rompe la cadena, lo que
-- hace el historial tamper-evident (no solo append-only). Sin secretos: solo hashes.
alter table vertical_mt101.mt101_corrective_pay_action
    add column if not exists previous_action_hash varchar(64),
    add column if not exists action_hash varchar(64);
