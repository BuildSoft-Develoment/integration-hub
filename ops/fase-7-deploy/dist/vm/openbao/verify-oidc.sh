#!/bin/sh
# =====================================================================================
# Responde a una sola pregunta: ¿el rol de Keycloak se convirtio en permiso dentro de la boveda?
#
# La consola web no muestra las politicas de tu sesion en ningun sitio evidente, y "parece que
# entre bien" no prueba nada: entrar SIEMPRE funciona. Lo que decide es si tu entidad quedo dentro
# del grupo que lleva la politica.
#
# Se ejecuta con el token RAIZ, no con el de la sesion: mira el estado del servidor, no el tuyo.
#
#   docker exec -e BAO_TOKEN ih-int-openbao sh /openbao/setup/verify-oidc.sh
# =====================================================================================
set -eu

fallo() { echo "ERROR: $*" >&2; exit 1; }
[ -n "${BAO_TOKEN:-}" ] || fallo "falta BAO_TOKEN (el token raiz)."
BAO_ADDR="${BAO_ADDR:-http://127.0.0.1:8200}"
export BAO_ADDR BAO_TOKEN

bao status >/dev/null 2>&1 || fallo "OpenBao no responde o esta sellado."

echo "== Rol oidc 'sso' =="
echo "   politicas que reparte por si mismo: $(bao read -field=token_policies auth/oidc/role/sso 2>/dev/null || echo '?')"
echo "   (debe ser solo 'default': el permiso real llega por el grupo, no por entrar)"
echo

echo "== Grupo externo 'platform-admin' =="
POLITICAS="$(bao read -field=policies identity/group/name/platform-admin 2>/dev/null || echo '')"
[ -n "$POLITICAS" ] || fallo "el grupo 'platform-admin' no existe. Ejecutar setup-oidc.sh."
echo "   politicas: $POLITICAS"

MIEMBROS="$(bao read -field=member_entity_ids identity/group/name/platform-admin 2>/dev/null || echo '')"
# OJO con el separador: `bao read -field` sobre una lista imprime el formato Go `[a b]` —separado por
# ESPACIOS—, no JSON. Borrar los espacios junto con los corchetes fusionaba dos ids en uno inventado,
# y con un solo miembro NO se notaba: el fallo habria aparecido al entrar la segunda persona, que es
# cuando ya nadie sospecha del script. Espacios y comas se convierten en saltos, no se borran.
LIMPIO="$(printf '%s' "$MIEMBROS" | tr -d '[]"' | tr ', ' '\n\n' | grep -v '^$' || true)"

if [ -z "$LIMPIO" ]; then
  echo "   miembros: NINGUNO"
  echo
  echo "VEREDICTO: el grupo existe y lleva la politica, pero no tiene a nadie dentro."
  echo
  echo "El grupo se puebla EN EL MOMENTO DEL LOGIN, con el claim 'groups' del ID token."
  echo "Vacio significa una de tres cosas, y conviene descartarlas EN ESTE ORDEN:"
  echo
  echo "  1. NADIE HA ENTRADO TODAVIA por SSO desde que se inicializo la boveda."
  echo "     Es lo normal tras reinicializar o migrar el sello: las entidades viven en el"
  echo "     volumen y no sobreviven a que se borre. Entra una vez por OIDC en /ui/ y"
  echo "     repite esta comprobacion. Diez segundos."
  echo "  2. Quien entro NO TIENE el rol 'platform-admin' en Keycloak."
  echo "  3. El MAPPER del cliente 'openbao' no esta emitiendo el claim 'groups'."
  echo
  echo "Las tres producen EXACTAMENTE el mismo sintoma, asi que el mensaje por si solo no"
  echo "las distingue. Empieza por la 1, que es la mas probable y la mas barata de descartar."
  exit 1
fi

echo "   miembros (entidades que YA entraron y recibieron la politica):"
for ID in $LIMPIO; do
  NOMBRE="$(bao read -field=name identity/entity/id/$ID 2>/dev/null || echo '?')"
  echo "     - $NOMBRE"
done
echo
echo "VEREDICTO: el rol de Keycloak SI se traduce en permiso. Quien aparece arriba tiene"
echo "ih-secrets-admin al entrar por SSO; quien no tenga el rol se queda solo con 'default'."
