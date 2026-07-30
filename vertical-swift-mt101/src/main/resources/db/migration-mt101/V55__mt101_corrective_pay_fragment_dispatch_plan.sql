-- v25 P0.4: persistir el PLAN aprobado por fragmento para auditoria/reconstruccion. El ledger ya guarda
-- payload_hash, transport, idempotency_key/dropPath (endpoint_ref como correlacion) y approved_routed_as,
-- pero NO el destino real ni un hash del plan completo. Se agregan:
--  - dispatch_destination: el endpoint/destino REAL resuelto (URL REST o sftp://host/dropPath), redactado
--    de credenciales; permite reconstruir a que host/ruta se despacho sin re-resolver.
--  - dispatch_plan_hash: sha256 del plan canonico (transport|ruta|destino|correlacion|payload_hash),
--    evidencia durable del plan aprobado por el checker. Sin secretos resueltos.
alter table vertical_mt101.mt101_corrective_pay_fragment
    add column if not exists dispatch_destination text,
    add column if not exists dispatch_plan_hash varchar(64);
