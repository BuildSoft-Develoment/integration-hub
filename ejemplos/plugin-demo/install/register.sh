#!/usr/bin/env bash
# Registra los 4 plugins del ejemplo en la plataforma local (http://localhost:8080).
# Requiere un bearer token de un usuario con rol PLATFORM_ADMIN o INTEGRATION_ADMIN.
#
# Uso:
#   ./install/register.sh <BEARER_TOKEN> [PLATFORM_URL]
#
# El token lo obtienes iniciando sesion en la plataforma (admin) y copiando el JWT.
set -euo pipefail

TOKEN="${1:?Uso: register.sh <BEARER_TOKEN> [PLATFORM_URL]}"
PLATFORM="${2:-http://localhost:8080}"
DIR="$(cd "$(dirname "$0")" && pwd)"
AUTH=(-H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")

echo "== Backends gRPC (POST ${PLATFORM}/api/plugins/install) =="
for f in backend-java backend-node backend-python; do
  echo "-- ${f}"
  curl -fsS "${AUTH[@]}" -X POST "${PLATFORM}/api/plugins/install" \
    --data @"${DIR}/${f}.json" > /dev/null && echo "   OK"
done

echo "== Front widget (POST ${PLATFORM}/api/plugins/ui-catalog) =="
# OJO: firma el remoteEntry.json construido y pega integrity+signature reales en
# frontend-widget/manifest.json ANTES de esto (ver README). La clave publica debe estar
# en APP_PLUGIN_REMOTE_TRUSTED_KEYS del host.
curl -fsS "${AUTH[@]}" -X POST "${PLATFORM}/api/plugins/ui-catalog" \
  --data @"${DIR}/../frontend-widget/manifest.json" > /dev/null && echo "   OK"

echo "== Diagnostico (GET ${PLATFORM}/api/plugins) =="
curl -fsS "${AUTH[@]}" "${PLATFORM}/api/plugins" | head -c 600; echo
echo "Listo. DEMO_TRANSFORM_JAVA/NODE/PY y DEMO_REMOTE_CSV quedan instalados para diagnostico."
echo "Nota: los backends vienen trusted=false; la ejecucion queda bloqueada hasta registrar confianza."
