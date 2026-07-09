-- Consola de PAY Conflicts (inbox transversal): la visibilidad por-set ya existe (ix por fragment_set_id), pero no
-- había forma eficiente de listar TODOS los conflictos de pago abiertos across sets/ejecuciones (landing operativa).
-- Índice PARCIAL sobre los pocos fragmentos en conflicto (pay_conflict es excepcional): hace la query global
-- O(conflictos) ordenada por recencia, sin escanear mt101_build_fragment. Incluye id para paginación keyset estable.
create index if not exists ix_build_fragment_pay_conflict_open
    on mt101_build_fragment (updated_at desc, id desc)
    where pay_conflict = true;
