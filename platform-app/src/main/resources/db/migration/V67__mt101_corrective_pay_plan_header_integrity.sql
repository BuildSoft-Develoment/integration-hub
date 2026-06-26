-- v44-fix: protege la EXISTENCIA y la JERARQUIA de la revision activa, no solo su contenido. Hasta v43-ter, la
-- cabecera mt101_corrective_pay_plan tenia trigger BEFORE UPDATE (V65) y BEFORE INSERT (V66) pero NO BEFORE DELETE:
-- un DELETE directo de una cabecera ACTIVE/SUPERSEDED dejaba los plan_fragment huerfanos y desactivaba su trigger
-- de inmutabilidad (que decide consultando la cabecera). Ademas, nada ataba el puntero rebuild_run.active_plan_revision
-- a una cabecera realmente existente. Se cierra con: (1) trigger DELETE (solo DRAFT se borra), (2) FK del puntero del
-- run a la cabecera (sin cascade), (3) y -en el claim, por codigo- exigir que la cabecera de la revision activa sea ACTIVE.

-- (1) Solo una revision DRAFT abandonada puede borrarse; ACTIVE/SUPERSEDED son permanentes.
create or replace function mt101_pay_plan_delete_guard() returns trigger as $$
begin
    if old.status in ('ACTIVE', 'SUPERSEDED') then
        raise exception 'mt101_corrective_pay_plan %/% cannot be deleted once % (immutable history)',
            old.rebuild_run_id, old.plan_revision, old.status;
    end if;
    return old;
end;
$$ language plpgsql;

drop trigger if exists trg_pay_plan_delete_guard on mt101_corrective_pay_plan;
create trigger trg_pay_plan_delete_guard
    before delete on mt101_corrective_pay_plan
    for each row execute function mt101_pay_plan_delete_guard();

-- (2) Promueve el indice unico (rebuild_run_id, plan_revision) a CONSTRAINT para poder referenciarlo por FK.
alter table mt101_corrective_pay_plan
    add constraint uq_pay_plan_run_rev unique using index ux_pay_plan_run_rev;

-- (3) El puntero del run a su revision activa debe referenciar una cabecera EXISTENTE (sin cascade: no se puede
--     borrar una revision que el run aun declara activa). NOT VALID: protege filas nuevas sin fallar por datos
--     historicos. active_plan_revision NULL no se valida (MATCH SIMPLE), asi runs sin plan siguen validos.
alter table mt101_rebuild_run
    add constraint fk_run_active_plan_revision
    foreign key (rebuild_run_id, active_plan_revision)
    references mt101_corrective_pay_plan (rebuild_run_id, plan_revision)
    not valid;
