-- v35 (hallazgo 1): representacion UNICA, explicita y durable del conflicto terminal por fragmento.
-- Cuando un resultado terminal entrante (gateway o STATUS) CONTRADICE el terminal ya resuelto del ledger,
-- el fragmento NO se sobrescribe (conserva su pay_status real) pero queda marcado como en conflicto, para que
-- un lector operativo (API/UI) no interprete mal el estado (p.ej. archive=REJECTED como "nunca enviado"
-- mientras el ledger dice SENT). La marca acompana al PAY_CONFLICT append-only del run.
alter table vertical_mt101.mt101_corrective_pay_fragment
    add column if not exists pay_conflict boolean not null default false;
alter table vertical_mt101.mt101_corrective_pay_fragment
    add column if not exists pay_conflict_reason text;
