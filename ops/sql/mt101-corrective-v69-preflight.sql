-- Preflight de V69 (mt101 correctivo) — DIAGNOSTICO, NO migracion.
-- v49-fix: ejecutar ANTES de desplegar V69__mt101_corrective_pay_plan_validate_and_sanitize.sql.
-- V69 sanea punteros a revisiones no-ACTIVE y luego hace VALIDATE de fk_pay_plan_run y fk_pay_plan_fragment_plan;
-- si existen datos historicos huerfanos, ese VALIDATE FALLA y detiene el despliegue. Este script los detecta
-- (conteos + ejemplos) para resolverlos/archivarlos conservando evidencia ANTES de correr V69.
-- Idealmente las tres consultas de conteo devuelven 0. Solo-lectura: no modifica datos.

\echo '== 1) Planes sin run (romperian fk_pay_plan_run) =='
select count(*) as planes_sin_run
from mt101_corrective_pay_plan p
where not exists (select 1 from mt101_rebuild_run r where r.rebuild_run_id = p.rebuild_run_id);

select p.rebuild_run_id, p.plan_revision, p.status, p.created_at
from mt101_corrective_pay_plan p
where not exists (select 1 from mt101_rebuild_run r where r.rebuild_run_id = p.rebuild_run_id)
order by p.created_at
limit 20;

\echo '== 2) Fragmentos de plan sin cabecera (romperian fk_pay_plan_fragment_plan) =='
select count(*) as fragmentos_sin_cabecera
from mt101_corrective_pay_plan_fragment pf
where not exists (select 1 from mt101_corrective_pay_plan p
                  where p.rebuild_run_id = pf.rebuild_run_id and p.plan_revision = pf.plan_revision);

select pf.rebuild_run_id, pf.plan_revision, pf.corrective_senders_reference
from mt101_corrective_pay_plan_fragment pf
where not exists (select 1 from mt101_corrective_pay_plan p
                  where p.rebuild_run_id = pf.rebuild_run_id and p.plan_revision = pf.plan_revision)
order by pf.rebuild_run_id, pf.plan_revision
limit 20;

\echo '== 3) Runs cuyo active_plan_revision NO apunta a una cabecera ACTIVE (los saneara V69 a NULL) =='
select count(*) as punteros_no_active
from mt101_rebuild_run r
where r.active_plan_revision is not null
  and not exists (select 1 from mt101_corrective_pay_plan p
                  where p.rebuild_run_id = r.rebuild_run_id
                    and p.plan_revision = r.active_plan_revision
                    and p.status = 'ACTIVE');

select r.rebuild_run_id, r.active_plan_revision, r.pay_status
from mt101_rebuild_run r
where r.active_plan_revision is not null
  and not exists (select 1 from mt101_corrective_pay_plan p
                  where p.rebuild_run_id = r.rebuild_run_id
                    and p.plan_revision = r.active_plan_revision
                    and p.status = 'ACTIVE')
order by r.rebuild_run_id
limit 20;

\echo '== 4) (informativo) Runs REQUESTED firmados con un algoritmo de hash anterior al vigente =='
-- Tras v49 el algoritmo vigente es MT101_PAY_PLAN_SET_V3. Estos runs, al aprobarse, se INVALIDARAN con motivo de
-- version (no es un fallo de migracion; es comportamiento esperado: requieren re-solicitud).
select count(*) as requested_algoritmo_anterior
from mt101_rebuild_run r
where r.pay_status = 'REQUESTED'
  and r.pay_plan_version is distinct from 'MT101_PAY_PLAN_SET_V3';
