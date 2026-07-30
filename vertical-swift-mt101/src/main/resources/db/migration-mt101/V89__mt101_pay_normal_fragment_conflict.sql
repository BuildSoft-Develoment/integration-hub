-- P0-1 (PAY normal, conflicto tardío): representación durable del conflicto terminal en el fragmento NORMAL,
-- espejo de V58 (que ya lo tiene en el ledger correctivo mt101_corrective_pay_fragment).
--
-- Motivo: el resultado tardío del worker (p.ej. ACCEPTED de un send colgado) NO debe sobrescribir un terminal
-- ya resuelto por STATUS/RECONCILE (p.ej. REJECTED). El update del resultado normal pasa a estar GUARDADO
-- (solo transiciona desde DISPATCHING/UNCERTAIN, como ya hace Mt101FragmentRepository.resolvePayStatus); un
-- ref que ya está en un terminal contradictorio NO se sobrescribe (conserva su pay_status real) y queda marcado
-- pay_conflict para que un lector operativo (API/UI) no lo malinterprete y se resuelva por conciliación.
alter table vertical_mt101.mt101_build_fragment
    add column if not exists pay_conflict boolean not null default false;
alter table vertical_mt101.mt101_build_fragment
    add column if not exists pay_conflict_reason text;
