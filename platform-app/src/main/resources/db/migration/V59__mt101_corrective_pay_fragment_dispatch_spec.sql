-- v37: el ledger PAY pasa a ser el CONTRATO EJECUTABLE del despacho correctivo. Al preparar el plan (antes de
-- aprobar) se compila una especificacion canonica por fragmento desde la config PAY SIN resolver (referencias
-- a secretos por nombre intactas, nunca valores resueltos) y se persiste con su hash. En el dispatch correctivo
-- el provider LEE esta especificacion, re-resuelve solo las referencias a secretos y envia: Mt101PayRouteResolver
-- ya NO decide ruta/transporte/destino en el dispatch. Sin esta spec, el run correctivo NO tiene fallback al
-- resolver vigente: se INVALIDA (requiere solicitar PAY de nuevo).
alter table mt101_corrective_pay_fragment
    add column if not exists dispatch_spec_version varchar(40);
alter table mt101_corrective_pay_fragment
    add column if not exists dispatch_spec_json text;
alter table mt101_corrective_pay_fragment
    add column if not exists dispatch_spec_hash varchar(64);
