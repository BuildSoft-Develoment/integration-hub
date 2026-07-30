-- v41 (modelo de plan versionado, maxima robustez): separa el PLAN APROBADO INMUTABLE (versionado) del ledger de
-- EJECUCION mutable. El maker compila el conjunto de planes como una revision DRAFT; al solicitar, la revision se
-- ACTIVA (DRAFT -> ACTIVE) y la anterior se marca SUPERSEDED. El ledger de ejecucion (mt101_corrective_pay_fragment)
-- sigue siendo el runtime, ahora ETIQUETADO con la revision activa; el dispatcher solo despacha fragmentos cuya
-- plan_revision = run.active_plan_revision, y la aprobacion valida el conjunto contra la revision ACTIVE inmutable.
-- Se conserva el HISTORICO de revisiones (auditoria del plan a lo largo del tiempo). NUNCA persiste secretos
-- resueltos: los specs llevan las referencias de secreto intactas (igual que el ledger de ejecucion).

create table if not exists vertical_mt101.mt101_corrective_pay_plan (
    id bigserial primary key,
    rebuild_run_id varchar(80) not null,
    plan_revision integer not null,
    plan_version varchar(40) not null,
    plan_count integer not null,
    plan_set_hash varchar(64) not null,
    status varchar(20) not null,            -- DRAFT | ACTIVE | SUPERSEDED
    created_by varchar(120),
    created_at timestamp not null default current_timestamp,
    activated_at timestamp,
    superseded_at timestamp
);
create unique index if not exists ux_pay_plan_run_rev
    on vertical_mt101.mt101_corrective_pay_plan (rebuild_run_id, plan_revision);
-- A lo sumo UNA revision ACTIVE y UNA DRAFT por run (invariante del modelo versionado).
create unique index if not exists ux_pay_plan_one_active
    on vertical_mt101.mt101_corrective_pay_plan (rebuild_run_id) where status = 'ACTIVE';
create unique index if not exists ux_pay_plan_one_draft
    on vertical_mt101.mt101_corrective_pay_plan (rebuild_run_id) where status = 'DRAFT';

create table if not exists vertical_mt101.mt101_corrective_pay_plan_fragment (
    id bigserial primary key,
    rebuild_run_id varchar(80) not null,
    plan_revision integer not null,
    corrective_set_id varchar(80),
    corrective_senders_reference varchar(16) not null,
    source_file_hash varchar(64),
    source_record_number bigint,
    staging_id bigint,
    payload_hash varchar(64),
    idempotency_key varchar(120),
    transport varchar(40),
    endpoint_ref varchar(255),
    approved_routed_as varchar(80),
    dispatch_destination text,
    dispatch_plan_hash varchar(64),
    dispatch_spec_version varchar(40),
    dispatch_spec_json text,
    dispatch_spec_hash varchar(64),
    created_at timestamp not null default current_timestamp
);
create unique index if not exists ux_pay_plan_frag_run_rev_ref
    on vertical_mt101.mt101_corrective_pay_plan_fragment (rebuild_run_id, plan_revision, corrective_senders_reference);

-- Revision ACTIVE del run (la unica despachable). El ledger de ejecucion se etiqueta con ella.
alter table vertical_mt101.mt101_rebuild_run
    add column if not exists active_plan_revision integer;
alter table vertical_mt101.mt101_corrective_pay_fragment
    add column if not exists plan_revision integer;
