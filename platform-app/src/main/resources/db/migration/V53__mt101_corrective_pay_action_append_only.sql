-- v24 (P0.1): la tabla mt101_corrective_pay_action se documenta como "append-only" pero el DDL no lo
-- impedia tecnicamente. Se refuerza con un trigger que rechaza UPDATE/DELETE/TRUNCATE: la evidencia de
-- auditoria bancaria no se puede alterar ni borrar desde la aplicacion. Sin fallback: cualquier mutacion
-- distinta de INSERT falla a nivel de base de datos.
create or replace function mt101_pay_action_block_mutation() returns trigger as $$
begin
    raise exception 'mt101_corrective_pay_action is append-only: % is not allowed', tg_op;
end;
$$ language plpgsql;

drop trigger if exists trg_mt101_pay_action_no_row_mutation on mt101_corrective_pay_action;
create trigger trg_mt101_pay_action_no_row_mutation
    before update or delete on mt101_corrective_pay_action
    for each row execute function mt101_pay_action_block_mutation();

drop trigger if exists trg_mt101_pay_action_no_truncate on mt101_corrective_pay_action;
create trigger trg_mt101_pay_action_no_truncate
    before truncate on mt101_corrective_pay_action
    for each statement execute function mt101_pay_action_block_mutation();
