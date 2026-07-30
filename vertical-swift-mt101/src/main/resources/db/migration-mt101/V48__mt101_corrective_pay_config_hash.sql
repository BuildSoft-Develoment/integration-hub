-- @trace specs/008-mensajeria-pagos RF-004, RF-024
-- El maker aprueba no solo el payload archivado sino tambien la configuracion
-- efectiva de MT101_PAY (transporte/rutas/destinos/correlacion). El checker
-- solo puede ejecutar si ambos hashes siguen iguales.

alter table vertical_mt101.mt101_rebuild_run
    add column if not exists pay_requested_config_hash varchar(64),
    add column if not exists pay_claimed_config_hash varchar(64);
