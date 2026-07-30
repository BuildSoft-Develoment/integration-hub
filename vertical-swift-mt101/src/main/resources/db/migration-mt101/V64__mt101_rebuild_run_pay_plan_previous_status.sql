-- v43 (auditoria del abandono de preparacion): al reservar (PREPARING_PLAN) se conserva el estado ANTERIOR del
-- run (NOT_REQUESTED / FAILED / INVALIDATED). Si la preparacion se ABANDONA (la solicitud no concreta), se
-- restaura ese estado anterior en vez de forzar siempre NOT_REQUESTED (no se pierde la semantica de gobierno:
-- un run INVALIDATED que intento re-prepararse y fallo, vuelve a INVALIDATED). El abandono se hace en una sola
-- transaccion (borra DRAFT + intents parciales, restaura estado, limpia el token y registra
-- PAY_PLAN_PREPARATION_ABORTED), evitando la revision DRAFT huerfana que dejaba la secuencia release+delete.
alter table vertical_mt101.mt101_rebuild_run
    add column if not exists pay_plan_previous_status varchar(30);
