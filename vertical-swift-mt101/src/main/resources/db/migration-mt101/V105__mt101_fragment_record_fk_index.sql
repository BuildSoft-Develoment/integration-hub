-- @trace spec 008-mensajeria-pagos RF-013, RNF-002
--
-- Indice sobre la clave foranea `mt101_fragment_record.fragment_id`.
--
-- POR QUE FALTABA Y POR QUE IMPORTA
-- PostgreSQL indexa automaticamente la clave PRIMARIA, no las FORANEAS. Sin este indice, borrar una
-- fila de `mt101_build_fragment` obliga al motor a recorrer `mt101_fragment_record` ENTERA para
-- comprobar que no queden hijas: un escaneo secuencial por cada fragmento borrado.
--
-- No es teorico. Al limpiar fragmentos de ejecuciones fallidas en la base de desarrollo, el borrado
-- llevaba mas de diez minutos sin terminar y hubo que cancelarlo; la tabla hija tenia 193.879 filas
-- y cada fragmento las repasaba todas. Con volumenes de produccion, una purga por retencion -que es
-- justo lo que exige el requisito de retencion de este vertical- se vuelve inviable, y lo hace en
-- silencio: no falla, solo no termina.
--
-- El indice tambien acelera el camino de lectura: recuperar los registros de un fragmento es la
-- consulta natural del linaje por registro.
create index if not exists ix_mt101_fragment_record_fragment
    on vertical_mt101.mt101_fragment_record (fragment_id);

-- El resto de foraneas del vertical que estaban en la misma situacion. Salieron de un barrido de
-- TODAS las claves foraneas sin indice, no de ir tabla por tabla.
--
-- Estas tres estan hoy vacias o casi, y por eso mismo salen ahora: crear el indice sobre una tabla
-- vacia es gratis, y sobre una tabla de auditoria de pagos con anos de historia es una ventana de
-- mantenimiento. Ademas cuelgan del camino del dinero -- una excepcion de conciliacion se consulta
-- por el archivo o la confirmacion a la que pertenece, que es exactamente este join.
create index if not exists ix_mt101_reconciliation_exception_archive
    on vertical_mt101.mt101_reconciliation_exception (archive_id);

create index if not exists ix_mt101_reconciliation_exception_confirmation
    on vertical_mt101.mt101_reconciliation_exception (confirmation_id);

create index if not exists ix_mt101_validation_issue_transaction
    on vertical_mt101.mt101_validation_issue (transaction_id);

-- El envelope es el punto de entrada del linaje: de una ejecucion a los mensajes SWIFT que produjo,
-- y de cada archivo a su envelope. Ambos lados se recorrian sin indice.
create index if not exists ix_swift_message_envelope_execution
    on vertical_mt101.swift_message_envelope (process_execution_id);

create index if not exists ix_mt101_archive_envelope
    on vertical_mt101.mt101_archive (envelope_id);

-- Revisiones del plan correctivo de pago. Mismo criterio: hoy vacias, y son parte de la maquinaria
-- de reconstruccion correctiva, donde una revision se consulta desde sus fragmentos.
create index if not exists ix_mt101_corrective_pay_plan_fragment_revision
    on vertical_mt101.mt101_corrective_pay_plan_fragment (plan_revision);

create index if not exists ix_mt101_rebuild_run_active_plan_revision
    on vertical_mt101.mt101_rebuild_run (active_plan_revision);
