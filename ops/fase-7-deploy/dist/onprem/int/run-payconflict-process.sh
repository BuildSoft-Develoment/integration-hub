#!/bin/sh
# Genera la casuistica de pay-conflicts de forma AUTENTICA (por pipeline, con evidencia real):
# dispara el proceso proc-mt101-payconflict-qa (id 3) que corre FILE_READ -> ... -> PAY -> MT101_STATUS.
# El STATUS consulta el mock gateway (http://ih-mock-gw), que rechaza las refs terminadas en 2/3 ->
# el task detecta la contradiccion SENT->REJECTED y crea el conflicto + la confirmacion (mt101_confirmation).
#
# Requiere: stack int arriba + el servicio mock-gateway (docker compose up -d mock-gateway) +
# mt101-6.csv en la fuente SFTP (lo deja preload-source-data.sh). Cada corrida crea un set PC-<execId> nuevo.
set -e
PG="docker exec ih-int-postgres psql -U postgres -d integration_hub -t -A"
PROC=3

BEFORE=$($PG -c "SELECT coalesce(max(id),0) FROM process_execution WHERE process_definition_id=$PROC;")
echo "Disparando proc $PROC por scheduler seed (ultima ejecucion: $BEFORE)..."
$PG -c "UPDATE process_definition SET scheduled=true, schedule_every='24h', next_run_at='2020-01-01 00:00:00' WHERE id=$PROC;" >/dev/null

EXEC=""
i=0
while [ $i -lt 30 ]; do
  N=$($PG -c "SELECT coalesce(max(id),0) FROM process_execution WHERE process_definition_id=$PROC;")
  if [ "$N" != "$BEFORE" ]; then EXEC="$N"; break; fi
  i=$((i+1)); sleep 3
done
# Restaurar (una sola corrida).
$PG -c "UPDATE process_definition SET scheduled=false, schedule_every=NULL, next_run_at=NULL WHERE id=$PROC;" >/dev/null

if [ -z "$EXEC" ]; then echo "No arranco el proceso (revisar el scheduler)."; exit 1; fi
echo "Ejecucion $EXEC lanzada. Esperando que termine..."
i=0
while [ $i -lt 25 ]; do
  ST=$($PG -c "SELECT status FROM process_execution WHERE id=$EXEC;")
  case "$ST" in RUNNING|"") i=$((i+1)); sleep 3;; *) break;; esac
done
echo "Ejecucion $EXEC -> $ST (set PC-$EXEC)"
$PG -c "SELECT senders_reference||' '||status||' conflict='||pay_conflict FROM mt101_build_fragment WHERE fragment_set_id='PC-$EXEC' ORDER BY senders_reference;"
echo "Listo. Revisa /swift-mt101/pay-conflicts (PC-$EXEC: las refs terminadas en 2/3 quedan en conflicto, con confirmacion REJECTED)."
