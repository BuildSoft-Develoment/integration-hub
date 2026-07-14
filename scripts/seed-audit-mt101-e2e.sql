-- Seed reproducible para probar las pantallas /audit/* en localhost.
-- Lote canónico: QA-AUDIT-MT101-001.

with seed_process as (
  insert into process_definition (name, description, active, scheduled, flow_layout_json)
  values (
    'QA Audit MT101 Seed',
    'Datos QA para pantallas audit/*',
    true,
    false,
    '{"nodes":[],"edges":[]}'
  )
  on conflict (name) do update
    set description = excluded.description,
        active = true
  returning id
),
process_ref as (
  select id from seed_process
  union all
  select id from process_definition where name = 'QA Audit MT101 Seed'
  limit 1
),
read_task_insert as (
  insert into process_task_definition (
    process_definition_id,
    task_order,
    task_type,
    configuration_json,
    active
  )
  select id, 1, 'FILE_READ', '{"taskRef":"qa-file-read"}', true
  from process_ref
  where not exists (
    select 1
    from process_task_definition t
    where t.process_definition_id = process_ref.id
      and t.task_order = 1
      and t.task_type = 'FILE_READ'
  )
  returning id
),
build_task_insert as (
  insert into process_task_definition (
    process_definition_id,
    task_order,
    task_type,
    configuration_json,
    active
  )
  select id, 2, 'MT101_BUILD_FROM_TABLE',
    '{"taskRef":"qa-mt101-build","fragmentSetIdTemplate":"QA-AUDIT-MT101-001"}',
    true
  from process_ref
  where not exists (
    select 1
    from process_task_definition t
    where t.process_definition_id = process_ref.id
      and t.task_order = 2
      and t.task_type = 'MT101_BUILD_FROM_TABLE'
  )
  returning id
),
read_task as (
  select id from read_task_insert
  union all
  select t.id
  from process_task_definition t
  join process_ref p on p.id = t.process_definition_id
  where t.task_order = 1 and t.task_type = 'FILE_READ'
  limit 1
),
build_task as (
  select id from build_task_insert
  union all
  select t.id
  from process_task_definition t
  join process_ref p on p.id = t.process_definition_id
  where t.task_order = 2 and t.task_type = 'MT101_BUILD_FROM_TABLE'
  limit 1
),
execution_insert as (
  insert into process_execution (
    process_definition_id,
    status,
    started_at,
    finished_at,
    details,
    trigger_source,
    request_payload_json,
    execution_owner
  )
  select
    id,
    'COMPLETED_WITH_ERRORS',
    current_timestamp - interval '15 minutes',
    current_timestamp - interval '12 minutes',
    'Seed QA audit/* MT101 con cuarentena y conflicto PAY',
    'QA_SEED',
    '{"seed":"audit-ui-mt101","fragmentSetId":"QA-AUDIT-MT101-001"}',
    'codex'
  from process_ref
  where not exists (
    select 1
    from process_execution e
    where e.process_definition_id = process_ref.id
      and e.request_payload_json = '{"seed":"audit-ui-mt101","fragmentSetId":"QA-AUDIT-MT101-001"}'
  )
  returning id
),
execution_ref as (
  select id from execution_insert
  union all
  select e.id
  from process_execution e
  join process_ref p on p.id = e.process_definition_id
  where e.request_payload_json = '{"seed":"audit-ui-mt101","fragmentSetId":"QA-AUDIT-MT101-001"}'
  limit 1
),
task_exec_seed as (
  insert into process_task_execution (
    process_execution_id,
    task_definition_id,
    status,
    started_at,
    finished_at,
    details
  )
  select execution_ref.id, read_task.id, 'COMPLETED', current_timestamp - interval '15 minutes', current_timestamp - interval '14 minutes', 'QA seed read'
  from execution_ref, read_task
  where not exists (
    select 1 from process_task_execution x
    where x.process_execution_id = execution_ref.id and x.task_definition_id = read_task.id
  )
  union all
  select execution_ref.id, build_task.id, 'COMPLETED_WITH_ERRORS', current_timestamp - interval '14 minutes', current_timestamp - interval '12 minutes', 'QA seed MT101 build'
  from execution_ref, build_task
  where not exists (
    select 1 from process_task_execution x
    where x.process_execution_id = execution_ref.id and x.task_definition_id = build_task.id
  )
  returning id
),
staging_seed as (
  insert into staging_record (
    process_execution_id,
    task_definition_id,
    source_name,
    record_index,
    payload_json,
    source_file_hash,
    physical_line,
    sheet_name,
    sheet_row
  )
  select execution_ref.id, read_task.id, 'qa-mt101-seed.csv', 1,
    '{"sender":"BANKPEPLAXXX","sendersReference":"QA20A","transactionReference":"QA21A","amount":1250.50,"currency":"PEN"}',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    42,
    'Pagos',
    7
  from execution_ref, read_task
  where not exists (
    select 1 from staging_record s
    where s.process_execution_id = execution_ref.id
      and s.task_definition_id = read_task.id
      and s.record_index = 1
  )
  union all
  select execution_ref.id, read_task.id, 'qa-mt101-seed.csv', 2,
    '{"sender":"BANKPEPLAXXX","sendersReference":"QA20B","transactionReference":"QA21B","amount":999999999,"currency":"XXX"}',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    43,
    'Pagos',
    8
  from execution_ref, read_task
  where not exists (
    select 1 from staging_record s
    where s.process_execution_id = execution_ref.id
      and s.task_definition_id = read_task.id
      and s.record_index = 2
  )
  returning id, record_index
),
staging_ref as (
  select id, record_index from staging_seed
  union all
  select s.id, s.record_index
  from staging_record s
  join execution_ref e on e.id = s.process_execution_id
  join read_task t on t.id = s.task_definition_id
  where s.record_index in (1, 2)
),
fragment_seed as (
  insert into mt101_build_fragment (
    fragment_set_id,
    process_execution_id,
    task_definition_id,
    source_table,
    source_row_from,
    source_row_to,
    fragment_index,
    fragment_total,
    senders_reference,
    payload_hash,
    raw_payload,
    message_json,
    status,
    error_message,
    staging_id_from,
    staging_id_to,
    source_record_from,
    source_record_to,
    source_file_hash,
    source_records_json,
    routed_as,
    routed_at,
    pay_conflict,
    pay_conflict_reason
  )
  select
    'QA-AUDIT-MT101-001',
    execution_ref.id,
    build_task.id,
    'staging_record',
    1,
    1,
    1,
    2,
    'QA20A',
    '1111111111111111111111111111111111111111111111111111111111111111',
    '{1:F01BANKPEPLAXXX0000000000}{4::20:QA20A:21:QA21A-}',
    '{"sendersReference":"QA20A","transactionReference":"QA21A","status":"SENT"}',
    'SENT',
    null,
    s.id,
    s.id,
    1,
    1,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '[1]',
    'REST',
    current_timestamp - interval '10 minutes',
    true,
    'Banco confirmó REJECTED pero worker dejó SENT'
  from execution_ref, build_task, staging_ref s
  where s.record_index = 1
  on conflict (fragment_set_id, fragment_index) do update
    set status = excluded.status,
        pay_conflict = excluded.pay_conflict,
        pay_conflict_reason = excluded.pay_conflict_reason,
        updated_at = current_timestamp
  returning id, senders_reference
),
fragment_seed_2 as (
  insert into mt101_build_fragment (
    fragment_set_id,
    process_execution_id,
    task_definition_id,
    source_table,
    source_row_from,
    source_row_to,
    fragment_index,
    fragment_total,
    senders_reference,
    payload_hash,
    raw_payload,
    message_json,
    status,
    error_message,
    staging_id_from,
    staging_id_to,
    source_record_from,
    source_record_to,
    source_file_hash,
    source_records_json,
    routed_as,
    route_error
  )
  select
    'QA-AUDIT-MT101-001',
    execution_ref.id,
    build_task.id,
    'staging_record',
    2,
    2,
    2,
    2,
    'QA20B',
    '2222222222222222222222222222222222222222222222222222222222222222',
    '{1:F01BANKPEPLAXXX0000000000}{4::20:QA20B:21:QA21B-}',
    '{"sendersReference":"QA20B","transactionReference":"QA21B","status":"REJECTED"}',
    'REJECTED',
    'Currency XXX no permitida',
    s.id,
    s.id,
    2,
    2,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '[2]',
    'MANUAL_REVIEW',
    'Regla QA.CURRENCY'
  from execution_ref, build_task, staging_ref s
  where s.record_index = 2
  on conflict (fragment_set_id, fragment_index) do update
    set status = excluded.status,
        error_message = excluded.error_message,
        updated_at = current_timestamp
  returning id, senders_reference
),
fragment_ref as (
  select id, senders_reference from fragment_seed
  union all
  select id, senders_reference from fragment_seed_2
  union all
  select id, senders_reference
  from mt101_build_fragment
  where fragment_set_id = 'QA-AUDIT-MT101-001'
),
fragment_record_seed as (
  insert into mt101_fragment_record (
    fragment_id,
    fragment_set_id,
    source_file_hash,
    source_record_number,
    staging_id,
    original_senders_reference,
    original_transaction_reference,
    current_senders_reference,
    current_transaction_reference,
    source_task_definition_id,
    source_name
  )
  select f.id, 'QA-AUDIT-MT101-001',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    case f.senders_reference when 'QA20A' then 1 else 2 end,
    s.id,
    f.senders_reference,
    case f.senders_reference when 'QA20A' then 'QA21A' else 'QA21B' end,
    f.senders_reference,
    case f.senders_reference when 'QA20A' then 'QA21A' else 'QA21B' end,
    read_task.id,
    'qa-mt101-seed.csv'
  from fragment_ref f
  join staging_ref s on s.record_index = case f.senders_reference when 'QA20A' then 1 else 2 end
  cross join read_task
  on conflict do nothing
  returning id
),
failed_seed as (
  insert into mt101_failed_record (
    fragment_set_id,
    senders_reference,
    transaction_reference,
    source_file_hash,
    source_record_number,
    rule_code,
    rule_set,
    severity,
    message,
    status,
    staging_id,
    source_task_definition_id,
    source_name
  )
  select 'QA-AUDIT-MT101-001',
    'QA20B',
    'QA21B',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    2,
    'QA.CURRENCY',
    'QA_MT101',
    'E',
    'Moneda XXX rechazada para evidencia visual',
    'QUARANTINED',
    s.id,
    read_task.id,
    'qa-mt101-seed.csv'
  from staging_ref s, read_task
  where s.record_index = 2
  on conflict do nothing
  returning id
),
archive_a as (
  insert into mt101_archive (
    senders_reference,
    requested_execution_date,
    sender_lt,
    status,
    format,
    process_execution_id
  )
  select 'QA20A', current_date, 'QASEEDLT001', 'SENT', 'MT01', execution_ref.id
  from execution_ref
  on conflict do nothing
  returning id, senders_reference
),
archive_b as (
  insert into mt101_archive (
    senders_reference,
    requested_execution_date,
    sender_lt,
    status,
    format,
    process_execution_id
  )
  select 'QA20B', current_date, 'QASEEDLT001', 'REJECTED', 'MT01', execution_ref.id
  from execution_ref
  on conflict do nothing
  returning id, senders_reference
),
archive_ref as (
  select id, senders_reference from archive_a
  union all
  select id, senders_reference from archive_b
  union all
  select id, senders_reference
  from mt101_archive
  where sender_lt = 'QASEEDLT001'
    and senders_reference in ('QA20A', 'QA20B')
),
confirmation_seed as (
  insert into mt101_confirmation (
    archive_id,
    confirmation_type,
    gateway_reference,
    confirmed_status,
    raw_payload
  )
  select id, 'STATUS', 'GW-QA-REJ-001', 'REJECTED', '{1:F21BANKPEPLAXXX}{4::20:QA20A:25:REJECTED-}'
  from archive_ref
  where senders_reference = 'QA20A'
    and not exists (
      select 1 from mt101_confirmation c
      where c.archive_id = archive_ref.id and c.gateway_reference = 'GW-QA-REJ-001'
    )
  returning id
),
dispatch_seed as (
  insert into mt101_pay_dispatch_intent (
    dispatch_key,
    process_execution_id,
    senders_reference,
    status,
    gateway_reference,
    attempts,
    error_message,
    payload_hash
  )
  select
    'QA-AUDIT-MT101-001:QA20A',
    execution_ref.id,
    'QA20A',
    'UNCERTAIN',
    'GW-QA-REJ-001',
    2,
    'Timeout posterior al envio; requiere conciliacion',
    '1111111111111111111111111111111111111111111111111111111111111111'
  from execution_ref
  on conflict (dispatch_key) do update
    set status = excluded.status,
        attempts = excluded.attempts,
        error_message = excluded.error_message,
        updated_at = current_timestamp
  returning id
),
rebuild_seed as (
  insert into mt101_rebuild_run (
    rebuild_run_id,
    original_fragment_set_id,
    corrective_set_id,
    status,
    requested_by,
    approved_by,
    selected_rows,
    affected_fragments,
    reference_code,
    executed_by,
    executed_at,
    request_reason,
    approval_reason,
    connection_ref,
    pay_status
  )
  values (
    'QA-REBUILD-001',
    'QA-AUDIT-MT101-001',
    'QA-AUDIT-MT101-CORR-001',
    'EXECUTED',
    'qa-maker',
    'qa-checker',
    1,
    1,
    'QAREB001',
    'qa-operator',
    current_timestamp - interval '5 minutes',
    'Correccion de moneda para prueba audit/*',
    'Aprobado QA',
    null,
    'UNCERTAIN'
  )
  on conflict (rebuild_run_id) do update
    set status = excluded.status,
        pay_status = excluded.pay_status,
        updated_at = current_timestamp
  returning rebuild_run_id
),
rebuild_selection_seed as (
  insert into mt101_rebuild_selection (
    rebuild_run_id,
    fragment_set_id,
    source_file_hash,
    source_record_number,
    record_index,
    staging_id,
    original_senders_reference,
    original_transaction_reference,
    selected_payload_hash,
    selected_staging_version,
    source_task_definition_id,
    source_name,
    corrective_senders_reference,
    corrective_transaction_reference
  )
  select
    'QA-REBUILD-001',
    'QA-AUDIT-MT101-001',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    2,
    2,
    s.id,
    'QA20B',
    'QA21B',
    '2222222222222222222222222222222222222222222222222222222222222222',
    0,
    read_task.id,
    'qa-mt101-seed.csv',
    'QAC20B',
    'QAC21B'
  from staging_ref s, read_task
  where s.record_index = 2
  on conflict do nothing
  returning id
),
corrective_seed as (
  insert into mt101_corrective_pay_fragment (
    rebuild_run_id,
    corrective_set_id,
    corrective_senders_reference,
    source_file_hash,
    source_record_number,
    staging_id,
    payload_hash,
    idempotency_key,
    gateway_reference,
    pay_status,
    attempts,
    error_message,
    transport,
    endpoint_ref,
    prepared_at,
    dispatched_at,
    approved_routed_as,
    dispatch_destination,
    dispatch_plan_hash,
    pay_conflict,
    pay_conflict_reason
  )
  select
    'QA-REBUILD-001',
    'QA-AUDIT-MT101-CORR-001',
    'QAC20B',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    2,
    s.id,
    '3333333333333333333333333333333333333333333333333333333333333333',
    'QA-REBUILD-001:QAC20B',
    'GW-QA-CORR-001',
    'UNCERTAIN',
    1,
    'Correctivo enviado sin confirmacion final',
    'REST',
    'qa-bank-simulator',
    current_timestamp - interval '6 minutes',
    current_timestamp - interval '4 minutes',
    'REST',
    'qa-bank-simulator',
    '4444444444444444444444444444444444444444444444444444444444444444',
    true,
    'Correctivo incierto para evidencia QA'
  from staging_ref s
  where s.record_index = 2
  on conflict (rebuild_run_id, corrective_senders_reference) do update
    set pay_status = excluded.pay_status,
        error_message = excluded.error_message,
        pay_conflict = excluded.pay_conflict,
        pay_conflict_reason = excluded.pay_conflict_reason,
        updated_at = current_timestamp
  returning id
),
audit_seed as (
  insert into audit_event (
    process_execution_id,
    task_definition_id,
    event_type,
    status,
    message,
    payload_json,
    event_id
  )
  select execution_ref.id, build_task.id, 'MT101_QA_SEED', 'COMPLETED_WITH_ERRORS',
    'Lote QA-AUDIT-MT101-001 listo para audit/*',
    '{"fragmentSetId":"QA-AUDIT-MT101-001","records":2,"failed":1,"payConflicts":2}',
    'qa-audit-mt101-seed-event'
  from execution_ref, build_task
  on conflict (event_id) do update
    set status = excluded.status,
        message = excluded.message,
        payload_json = excluded.payload_json,
        created_at = current_timestamp
  returning id
),
spool_seed as (
  insert into audit_spool (
    event_id,
    trace_id,
    topic,
    partition_key,
    payload,
    spool_status,
    attempts,
    last_error,
    next_attempt_at,
    dead_at,
    dead_reason
  )
  values
    (
      'qa-audit-mt101-spool-dead',
      'qa-trace-mt101-001',
      'audit-events',
      'QA-AUDIT-MT101-001',
      '{"event":"QA_DEAD","fragmentSetId":"QA-AUDIT-MT101-001"}',
      'DEAD',
      20,
      'Simulated poison message for audit spool screen',
      current_timestamp + interval '1 hour',
      current_timestamp,
      'QA seed dead-letter'
    ),
    (
      'qa-audit-mt101-spool-pending',
      'qa-trace-mt101-002',
      'audit-events',
      'QA-AUDIT-MT101-001',
      '{"event":"QA_PENDING","fragmentSetId":"QA-AUDIT-MT101-001"}',
      'PENDING',
      1,
      null,
      current_timestamp,
      null,
      null
    )
  on conflict (event_id) do update
    set spool_status = excluded.spool_status,
        attempts = excluded.attempts,
        last_error = excluded.last_error,
        next_attempt_at = excluded.next_attempt_at,
        dead_at = excluded.dead_at,
        dead_reason = excluded.dead_reason
  returning id
)
select
  (select id from execution_ref) as process_execution_id,
  'QA-AUDIT-MT101-001' as fragment_set_id,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as source_file_hash,
  42 as physical_line,
  'Pagos' as sheet_name,
  8 as sheet_row,
  (select count(*) from mt101_build_fragment where fragment_set_id = 'QA-AUDIT-MT101-001') as fragments,
  (select count(*) from mt101_failed_record where fragment_set_id = 'QA-AUDIT-MT101-001') as failed_rows,
  (select count(*) from mt101_pay_dispatch_intent where dispatch_key like 'QA-AUDIT-MT101-001:%') as dispatch_intents,
  (select count(*) from audit_spool where event_id like 'qa-audit-mt101-spool-%') as spool_rows;
