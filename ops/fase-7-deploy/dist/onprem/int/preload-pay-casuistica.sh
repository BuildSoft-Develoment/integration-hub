#!/bin/sh
# Siembra las casuisticas de pago para revisar los formularios /pay-conflicts y /pay-dispatch:
#   - /pay-conflicts: marca 2 fragmentos SENT como conflicto (pay_conflict=true).
#   - /pay-dispatch: 2 intents UNCERTAIN + 1 DISPATCHING (atascados) + 2 SENT (resueltos).
# Idempotente (re-ejecutar deja el mismo estado). Requiere el stack int levantado. La parte de
# conflictos necesita fragmentos SENT ya presentes (de una corrida de pago previa: E2E salida / QA-61).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Copiando el SQL al contenedor de postgres..."
docker cp "$DIR/preload-pay-casuistica.sql" ih-int-postgres:/tmp/preload-pay-casuistica.sql
echo "Sembrando casuisticas de pago..."
docker exec ih-int-postgres psql -U postgres -d integration_hub -f /tmp/preload-pay-casuistica.sql
echo ""
echo "Listo. Revisa: /swift-mt101/pay-conflicts  y  /swift-mt101/pay-dispatch"
