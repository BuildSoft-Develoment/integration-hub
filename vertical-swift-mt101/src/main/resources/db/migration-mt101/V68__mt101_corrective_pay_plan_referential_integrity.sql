-- v45-fix: integridad referencial completa de la cadena run -> plan -> plan_fragment, y verificacion del puntero
-- del run para TODO el historico (no solo para cambios nuevos).
--   (1) plan -> run: ningun plan puede quedar huerfano de su run (ON DELETE RESTRICT: no se borra un run con planes).
--   (2) plan_fragment -> plan: ningun fragmento puede quedar huerfano de su cabecera. DEFERRABLE INITIALLY
--       DEFERRED porque compileDraftPlanRevision inserta los fragmentos ANTES que la cabecera dentro de UNA
--       transaccion: la FK se verifica al commit (ambos existen), sin necesidad de reordenar la ruta de dinero.
--   (3) saneamiento + VALIDATE del puntero active_plan_revision: la FK fk_run_active_plan_revision (V67) era
--       NOT VALID. Se anulan punteros colgados historicos (datos pre-V67; el claim ya los rechaza, anularlos es
--       seguro y no cambia ningun despacho) y se VALIDA la constraint -> integridad verificada para todo el historico.
-- Ambas FK nuevas se crean NOT VALID para no fallar el arranque por datos historicos; quedan enforced para escrituras nuevas.

alter table vertical_mt101.mt101_corrective_pay_plan
    add constraint fk_pay_plan_run
    foreign key (rebuild_run_id) references vertical_mt101.mt101_rebuild_run (rebuild_run_id)
    on delete restrict
    not valid;

alter table vertical_mt101.mt101_corrective_pay_plan_fragment
    add constraint fk_pay_plan_fragment_plan
    foreign key (rebuild_run_id, plan_revision)
    references vertical_mt101.mt101_corrective_pay_plan (rebuild_run_id, plan_revision)
    on delete restrict
    deferrable initially deferred
    not valid;

update vertical_mt101.mt101_rebuild_run r
   set active_plan_revision = null
 where r.active_plan_revision is not null
   and not exists (select 1 from vertical_mt101.mt101_corrective_pay_plan p
                   where p.rebuild_run_id = r.rebuild_run_id and p.plan_revision = r.active_plan_revision);

alter table vertical_mt101.mt101_rebuild_run validate constraint fk_run_active_plan_revision;
