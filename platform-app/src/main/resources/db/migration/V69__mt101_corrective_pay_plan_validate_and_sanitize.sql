-- v46-fix: completa la homologacion de la integridad referencial del plan versionado.
--   (1) Saneamiento EXTENDIDO del puntero: V68 solo anulaba active_plan_revision que apuntaba a una cabecera
--       INEXISTENTE. Tambien puede quedar (historico) un puntero a una cabecera DRAFT o SUPERSEDED: la FK lo permite
--       (la cabecera existe) y el claim lo bloquea (exige status=ACTIVE), pero deja el run semanticamente
--       inconsistente. Se anula todo puntero que NO apunte a una cabecera ACTIVE. Un run legitimo siempre apunta a
--       su revision ACTIVE, por lo que NO se ve afectado; solo se corrigen punteros corruptos historicos.
--   (2) VALIDATE de las FKs anti-huerfanos de V68 (creadas NOT VALID): se promueven de "protegidas para escrituras
--       nuevas" a "verificadas para todo el historico". En datos del lifecycle no hay huerfanos (los runs nunca se
--       borran y los plan_fragment siempre se crean con/tras su cabecera dentro de la misma transaccion).

update mt101_rebuild_run r
   set active_plan_revision = null
 where r.active_plan_revision is not null
   and not exists (select 1 from mt101_corrective_pay_plan p
                   where p.rebuild_run_id = r.rebuild_run_id
                     and p.plan_revision = r.active_plan_revision
                     and p.status = 'ACTIVE');

alter table mt101_corrective_pay_plan validate constraint fk_pay_plan_run;
alter table mt101_corrective_pay_plan_fragment validate constraint fk_pay_plan_fragment_plan;
