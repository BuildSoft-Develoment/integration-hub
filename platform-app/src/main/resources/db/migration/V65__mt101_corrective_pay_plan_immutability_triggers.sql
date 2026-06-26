-- v43 (homologacion fuerte): impone a NIVEL DE BASE DE DATOS la inmutabilidad de las revisiones del plan, de modo
-- que ni un bug ni una manipulacion puedan mutar una revision ya aprobada (ACTIVE) o historica (SUPERSEDED).
--   * mt101_corrective_pay_plan_fragment: una vez la revision es ACTIVE o SUPERSEDED, sus filas no se pueden
--     UPDATE ni DELETE (spec/payload/destino/transporte/hash congelados). Las filas DRAFT si se pueden borrar
--     (descartar un borrador no concretado).
--   * mt101_corrective_pay_plan: solo se permite la maquina de estados DRAFT -> ACTIVE -> SUPERSEDED; una ACTIVE
--     solo puede pasar a SUPERSEDED (sin cambiar hash/count/version/revision); una SUPERSEDED es totalmente
--     inmutable; una DRAFT no puede saltar directo a SUPERSEDED.

create or replace function mt101_pay_plan_fragment_immutable() returns trigger as $$
declare
    target_run text;
    target_rev integer;
begin
    if tg_op = 'DELETE' then
        target_run := old.rebuild_run_id;
        target_rev := old.plan_revision;
    else
        target_run := old.rebuild_run_id;
        target_rev := old.plan_revision;
    end if;
    if exists (select 1 from mt101_corrective_pay_plan p
               where p.rebuild_run_id = target_run and p.plan_revision = target_rev
                 and p.status in ('ACTIVE', 'SUPERSEDED')) then
        raise exception 'mt101_corrective_pay_plan_fragment is immutable for ACTIVE/SUPERSEDED revisions (run %, revision %)',
            target_run, target_rev;
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pay_plan_fragment_immutable on mt101_corrective_pay_plan_fragment;
create trigger trg_pay_plan_fragment_immutable
    before update or delete on mt101_corrective_pay_plan_fragment
    for each row execute function mt101_pay_plan_fragment_immutable();

create or replace function mt101_pay_plan_status_guard() returns trigger as $$
begin
    if old.status = 'SUPERSEDED' then
        raise exception 'mt101_corrective_pay_plan SUPERSEDED revision is immutable (run %, revision %)',
            old.rebuild_run_id, old.plan_revision;
    end if;
    if old.status = 'ACTIVE' then
        if new.status not in ('ACTIVE', 'SUPERSEDED') then
            raise exception 'mt101_corrective_pay_plan ACTIVE revision can only transition to SUPERSEDED (run %, revision %)',
                old.rebuild_run_id, old.plan_revision;
        end if;
        if new.plan_set_hash is distinct from old.plan_set_hash
           or new.plan_count is distinct from old.plan_count
           or new.plan_version is distinct from old.plan_version
           or new.plan_revision is distinct from old.plan_revision then
            raise exception 'mt101_corrective_pay_plan ACTIVE revision hash/count/version/revision is immutable (run %, revision %)',
                old.rebuild_run_id, old.plan_revision;
        end if;
    end if;
    if old.status = 'DRAFT' and new.status = 'SUPERSEDED' then
        raise exception 'mt101_corrective_pay_plan DRAFT cannot transition directly to SUPERSEDED (run %, revision %)',
            old.rebuild_run_id, old.plan_revision;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pay_plan_status_guard on mt101_corrective_pay_plan;
create trigger trg_pay_plan_status_guard
    before update on mt101_corrective_pay_plan
    for each row execute function mt101_pay_plan_status_guard();
