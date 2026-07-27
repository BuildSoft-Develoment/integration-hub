-- Casuisticas de pago para revisar los formularios /pay-conflicts y /pay-dispatch en el int.
-- Idempotente: re-ejecutar deja el mismo estado (no acumula). Requiere fragmentos SENT ya presentes
-- (de una corrida de pago previa) para la parte de conflictos; el dispatch es autocontenido.
--   docker cp preload-pay-casuistica.sql ih-int-postgres:/tmp/ && \
--   docker exec ih-int-postgres psql -U postgres -d integration_hub -f /tmp/preload-pay-casuistica.sql

-- === /pay-conflicts ===
-- Un conflicto de pago = fragmento con pay_conflict=true: el worker lo dejo SENT pero el STATUS del
-- banco luego dice REJECTED (contradiccion terminal). Marcamos los 2 fragmentos SENT de menor id
-- (estable -> idempotente). Reconocerlos en la UI limpia el flag (pay_conflict=false).
UPDATE mt101_build_fragment
   SET pay_conflict = true,
       pay_conflict_reason = 'STATUS terminal REJECTED contradice el SENT del worker; conciliar vs extracto del banco',
       updated_at = current_timestamp
 WHERE id IN (SELECT id FROM mt101_build_fragment WHERE status = 'SENT' ORDER BY id LIMIT 2);

-- === /pay-dispatch ===
-- El ledger de dispatch del PAY directo. Los "atascados" son UNCERTAIN (no sabemos si se envio:
-- timeout/crash durante el envio) o DISPATCHING colgado; bloquean el reenvio "hasta conciliar".
-- Sembramos 2 UNCERTAIN + 1 DISPATCHING (atascados) + 2 SENT (resueltos, para el desglose del resumen).
DELETE FROM mt101_pay_dispatch_intent WHERE dispatch_key LIKE 'demo-%';
INSERT INTO mt101_pay_dispatch_intent
       (dispatch_key, process_execution_id, senders_reference, status, gateway_reference, attempts, error_message, created_at, updated_at, payload_hash)
VALUES ('demo-uncertain-1',   61, 'P61-1', 'UNCERTAIN',   NULL,        3, 'timeout esperando ack del gateway; no se puede asumir enviado', now(), now(), 'demohash1'),
       ('demo-uncertain-2',   63, 'S63-1', 'UNCERTAIN',   NULL,        2, 'crash del worker durante el envio SWIFT',                     now(), now(), 'demohash2'),
       ('demo-dispatching-1', 64, 'F64-1', 'DISPATCHING', NULL,        1, 'colgado en DISPATCHING (proceso caido a mitad del envio)',    now(), now(), 'demohash3'),
       ('demo-sent-1',        61, 'P61-2', 'SENT',        'GW-REF-778', 1, NULL,                                                         now(), now(), 'demohash4'),
       ('demo-sent-2',        61, 'P61-3', 'SENT',        'GW-REF-779', 1, NULL,                                                         now(), now(), 'demohash5');

SELECT 'conflicts (pay_conflict=true)'            AS caso, count(*) FROM mt101_build_fragment  WHERE pay_conflict = true
UNION ALL SELECT 'dispatch total',                         count(*) FROM mt101_pay_dispatch_intent
UNION ALL SELECT 'dispatch stuck (UNCERTAIN/DISPATCHING)', count(*) FROM mt101_pay_dispatch_intent WHERE status IN ('UNCERTAIN','DISPATCHING');
