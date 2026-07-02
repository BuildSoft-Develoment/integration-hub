-- v24 (P0.2): el plan por fragmento debe ser inmutable. El ledger ya guarda payload_hash aprobado;
-- se agrega approved_routed_as para fijar tambien la ruta aprobada. Antes de DISPATCHING se valida que
-- el payload_hash y routed_as ACTUALES del build_fragment coincidan con los aprobados; si cambian
-- (payload o ruta) tras preparar la intencion, el fragmento se INVALIDA y no se envia (sin fallback).
alter table mt101_corrective_pay_fragment
    add column if not exists approved_routed_as varchar(80);
