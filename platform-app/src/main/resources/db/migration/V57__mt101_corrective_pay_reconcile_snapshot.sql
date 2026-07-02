-- v26 #4: simetrico al snapshot de STATUS (V52). MT101_RECONCILE aun se ejecutaba con su config vigente;
-- si las reglas/fuente de conciliacion cambian entre el PAY y la conciliacion, se conciliaria con una
-- config distinta de la aprobada. Se congela un snapshot (redactado) de la config de MT101_RECONCILE en
-- el momento del PAY, para que la conciliacion (inmediata o diferida) use el perfil aprobado, no el vigente.
alter table mt101_rebuild_run
    add column if not exists pay_reconcile_config_snapshot text;
