-- v43-ter: cierra el hueco de V65 (que solo cubria UPDATE/DELETE): una INSERCION directa podia agregar una fila a
-- una revision ACTIVE/SUPERSEDED (agregar al conjunto aprobado tambien es mutarlo). Ahora el trigger de
-- inmutabilidad de mt101_corrective_pay_plan_fragment cubre tambien INSERT: rechaza insertar en una revision cuya
-- cabecera ya este ACTIVE o SUPERSEDED. La compilacion normal sigue funcionando porque inserta los plan_fragment
-- ANTES de crear la cabecera DRAFT (en ese momento no existe cabecera para la revision). Ademas, la cabecera del
-- plan solo puede insertarse como DRAFT (la promocion a ACTIVE/SUPERSEDED es solo via UPDATE, ya restringido en V65).

create or replace function vertical_mt101.mt101_pay_plan_fragment_immutable() returns trigger as $$
declare
    target_run text;
    target_rev integer;
begin
    if tg_op = 'INSERT' then
        target_run := new.rebuild_run_id;
        target_rev := new.plan_revision;
    else
        target_run := old.rebuild_run_id;
        target_rev := old.plan_revision;
    end if;
    if exists (select 1 from vertical_mt101.mt101_corrective_pay_plan p
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

drop trigger if exists trg_pay_plan_fragment_immutable on vertical_mt101.mt101_corrective_pay_plan_fragment;
create trigger trg_pay_plan_fragment_immutable
    before insert or update or delete on vertical_mt101.mt101_corrective_pay_plan_fragment
    for each row execute function vertical_mt101.mt101_pay_plan_fragment_immutable();

create or replace function vertical_mt101.mt101_pay_plan_insert_guard() returns trigger as $$
begin
    if new.status <> 'DRAFT' then
        raise exception 'mt101_corrective_pay_plan must be inserted as DRAFT (run %, revision %, status %)',
            new.rebuild_run_id, new.plan_revision, new.status;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pay_plan_insert_guard on vertical_mt101.mt101_corrective_pay_plan;
create trigger trg_pay_plan_insert_guard
    before insert on vertical_mt101.mt101_corrective_pay_plan
    for each row execute function vertical_mt101.mt101_pay_plan_insert_guard();
