-- Consola de PAY Conflicts (inbox transversal) — rama correctiva: espejo de V94 pero para el ledger correctivo
-- (mt101_corrective_pay_fragment). Los conflictos correctivos ya se marcaban durables (V58 pay_conflict) pero no había
-- forma eficiente de listar todos los abiertos. Índice PARCIAL (el conflicto es excepcional) → la query global es
-- O(conflictos), sin escanear el ledger, ordenada por recencia con id de desempate.
create index if not exists ix_corrective_pay_fragment_conflict_open
    on vertical_mt101.mt101_corrective_pay_fragment (updated_at desc, id desc)
    where pay_conflict = true;
