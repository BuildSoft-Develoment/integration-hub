-- Refuerza el flujo correctivo MT101 sin caminos legacy:
-- 1) PAY correctivo usa maquina de estados y claim atomico.
-- 2) La cuarentena conserva la identidad tecnica de staging para archivos identicos.
-- 3) La seleccion del rebuild registra el fragmento correctivo y estado por fila.

alter table vertical_mt101.mt101_rebuild_run
    add column if not exists pay_status varchar(30) not null default 'NOT_REQUESTED',
    add column if not exists pay_claimed_by varchar(120),
    add column if not exists pay_claimed_at timestamp,
    add column if not exists pay_completed_at timestamp,
    add column if not exists pay_error_message text;

update vertical_mt101.mt101_rebuild_run
   set pay_status = case
       when pay_approved_by is not null then 'SENT'
       when pay_requested_by is not null then 'REQUESTED'
       else 'NOT_REQUESTED'
   end
 where pay_status = 'NOT_REQUESTED'
   and (pay_requested_by is not null or pay_approved_by is not null);

create index if not exists ix_mt101_rebuild_run_pay_status
    on vertical_mt101.mt101_rebuild_run (status, pay_status);

alter table vertical_mt101.mt101_failed_record
    add column if not exists staging_id bigint,
    add column if not exists source_task_definition_id bigint,
    add column if not exists source_name varchar(255);

update vertical_mt101.mt101_failed_record failed
   set staging_id = fr.staging_id,
       source_task_definition_id = fr.source_task_definition_id,
       source_name = fr.source_name
  from vertical_mt101.mt101_fragment_record fr
 where failed.fragment_set_id = fr.fragment_set_id
   and failed.senders_reference = fr.current_senders_reference
   and failed.transaction_reference = fr.current_transaction_reference
   and failed.source_file_hash = fr.source_file_hash
   and failed.source_record_number = fr.source_record_number
   and failed.staging_id is null;

create index if not exists ix_mt101_failed_staging
    on vertical_mt101.mt101_failed_record (fragment_set_id, staging_id, status);

drop index if exists vertical_mt101.ux_mt101_failed_dedup;
create unique index if not exists ux_mt101_failed_dedup
    on vertical_mt101.mt101_failed_record (
        fragment_set_id,
        coalesce(senders_reference, ''),
        coalesce(transaction_reference, ''),
        coalesce(rule_code, ''),
        coalesce(staging_id, 0)
    );

alter table vertical_mt101.mt101_rebuild_selection
    add column if not exists corrective_senders_reference varchar(16),
    add column if not exists corrective_transaction_reference varchar(35),
    add column if not exists lifecycle_updated_at timestamp;

create index if not exists ix_mt101_rebuild_selection_staging
    on vertical_mt101.mt101_rebuild_selection (rebuild_run_id, staging_id);

create index if not exists ix_mt101_fragment_record_rebuild_staging
    on vertical_mt101.mt101_fragment_record (rebuild_run_id, staging_id);
