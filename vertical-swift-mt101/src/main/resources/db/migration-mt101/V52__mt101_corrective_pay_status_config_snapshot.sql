-- v23 (hardening, perfil de STATUS congelado): la resolucion de un PAY_UNCERTAIN consulta MT101_STATUS
-- con la config VIGENTE del task definition. Si routeQuery/endpoint de STATUS cambia entre el PAY y la
-- resolucion (que puede ocurrir mucho despues), la consulta podria ir a otro endpoint y decidir mal
-- SENT/REJECTED. Se congela un snapshot de la config de MT101_STATUS en el momento del PAY para que la
-- resolucion consulte exactamente el perfil aprobado/usado al enviar. Sin fallback: si hay snapshot, se
-- usa ese; no se re-resuelve la config dinamica vigente.
alter table vertical_mt101.mt101_rebuild_run
    add column if not exists pay_status_config_snapshot text;
