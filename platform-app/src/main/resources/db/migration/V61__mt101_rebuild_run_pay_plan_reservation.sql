-- v40-bis (inmutabilidad del plan, atomicidad de la preparacion): RESERVA EXCLUSIVA del run para preparar el
-- plan. requestCorrectivePay reserva primero el run (NOT_REQUESTED/FAILED/INVALIDATED -> PREPARING_PLAN) con un
-- UPDATE atomico; solo el maker que gana la reserva compila y persiste specs. Asi dos makers concurrentes no
-- pueden mezclar specs en el ledger, una 2a solicitud no reescribe un plan REQUESTED/EXECUTING, y un fallo a
-- mitad de la preparacion libera la reserva (no deja el run atascado ni specs parciales aprobables). La marca de
-- tiempo permite reclamar una reserva caida (maker muerto) tras una ventana de obsolescencia.
alter table mt101_rebuild_run
    add column if not exists pay_plan_reserved_at timestamp;
