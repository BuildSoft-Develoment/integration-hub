-- B2': gobernanza propia del envio (PAY) del set correctivo. VALIDATE/ARCHIVE se
-- automatizan (no mueven dinero), pero PAY exige maker-checker propio: un usuario solicita
-- el envio y OTRO distinto lo aprueba+ejecuta. Se registra fuera del status (que es
-- derivado del lifecycle) para no colisionar con la sincronizacion automatica.
alter table mt101_rebuild_run
    add column if not exists pay_requested_by varchar(120),
    add column if not exists pay_requested_at timestamp,
    add column if not exists pay_approved_by varchar(120),
    add column if not exists pay_approved_at timestamp;
