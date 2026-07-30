-- P2 v20: visibilidad operativa separada del PAY vs la sincronizacion posterior. Hoy un fallo de
-- MT101_STATUS o MT101_RECONCILE tras un PAY ya enviado lanzaba un error al operador (parecia "el
-- PAY fallo"), aunque pay_status seguia SENT (markPayCompleted es condicional a EXECUTING, no hay
-- falsa reversion). Con estos estados el operador distingue "el pago salio; fallo la consulta
-- posterior" de "el PAY fallo". No reintenta PAY: solo registra el resultado de cada etapa.
alter table vertical_mt101.mt101_rebuild_run
    add column if not exists status_sync_status varchar(20) not null default 'PENDING',
    add column if not exists status_sync_error text,
    add column if not exists reconciliation_status varchar(20) not null default 'PENDING',
    add column if not exists reconciliation_error text;
