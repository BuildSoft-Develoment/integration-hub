-- v37 fase 2 (maker-checker del conjunto de planes): el maker, al SOLICITAR el PAY, compila y persiste los
-- planes ejecutables por fragmento y un hash AGREGADO del conjunto (orden canonico por senders_reference de
-- senders_reference|payload_hash|dispatch_spec_hash). El checker aprueba ese conjunto EXACTO: la aprobacion
-- valida que el hash agregado actual siga siendo el aprobado y NO reconstruye ni reemplaza los planes.
alter table mt101_rebuild_run
    add column if not exists pay_plan_version varchar(40);
alter table mt101_rebuild_run
    add column if not exists pay_plan_count integer;
alter table mt101_rebuild_run
    add column if not exists pay_plan_set_hash varchar(64);
