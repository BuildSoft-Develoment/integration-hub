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
LIMPIO="$(printf '%s' "$MIEMBROS" | tr -d '[]" ' | tr ',' '\n' | grep -v '^$' || true)"

if [ -z "$LIMPIO" ]; then
  echo "   miembros: NINGUNO"
  echo
  echo "VEREDICTO: entraste, pero tu sesion NO recibio ih-secrets-admin."
  echo "  El grupo se puebla en el momento del login, con el claim 'groups' del ID token."
  echo "  Estar vacio despues de haber entrado significa que ese claim no traia 'platform-admin':"
  echo "  o el usuario no tiene el rol en Keycloak, o el mapper del cliente no lo esta emitiendo."
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
