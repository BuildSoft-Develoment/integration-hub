-- v42 (propiedad exclusiva de la reserva de preparacion): la reserva PREPARING_PLAN (v40-bis) se identificaba
-- solo por el estado + la marca de tiempo, sin DUENO. Una reclamacion por reserva vencida podia interferir con el
-- maker original si este seguia vivo: ese maker podia aun escribir specs, concretar la solicitud o liberar la
-- reserva del nuevo dueno (rompiendo "el maker que solicito = dueno del conjunto exacto que el checker aprobo").
-- Se anade un TOKEN DE PROPIEDAD inmutable: cada reserva genera un reservation_id (UUID); toda escritura,
-- compilacion, promocion y liberacion exige ese reservation_id ademas de PREPARING_PLAN. Un maker que perdio la
-- reserva (takeover de una reserva vencida) ya no puede ni escribir, ni solicitar, ni liberar el trabajo ajeno.
alter table mt101_rebuild_run
    add column if not exists pay_plan_reservation_id varchar(64);
alter table mt101_rebuild_run
    add column if not exists pay_plan_reserved_by varchar(120);
