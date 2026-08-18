#!/bin/sh
# =====================================================================================
# Cablea el login de OpenBao contra Keycloak (OIDC). Idempotente: se puede repetir.
#
# COMO SE EJECUTA (desde ops/fase-7-deploy/dist/onprem)
#
#   docker exec -i \
#     -e BAO_TOKEN \
#     -e PUBLIC_BASE_URL="https://ih.buildsoft.com.pe" \
#     -e OPENBAO_OIDC_CLIENT_SECRET \
#     ih-int-openbao sh /openbao/setup/setup-oidc.sh
#
# `-e VAR` sin `=valor` pasa la variable DESDE TU SHELL sin escribirla en la linea de comandos:
# ni el token raiz ni el secreto del cliente quedan en el historial ni en `docker inspect`.
#
# POR QUE ESTO NO ESTA EN EL COMPOSE
# Necesita el token RAIZ, que solo existe tras `bao operator init` y no debe vivir en ningun
# fichero del repo ni en una variable de un contenedor. Es una operacion de puesta en marcha que
# hace una persona una vez, no algo que arranque con la stack.
# =====================================================================================
set -eu

fallo() { echo "ERROR: $*" >&2; exit 1; }

[ -n "${BAO_TOKEN:-}" ] || fallo "falta BAO_TOKEN (el token raiz de 'bao operator init')."
[ -n "${PUBLIC_BASE_URL:-}" ] || fallo "falta PUBLIC_BASE_URL (p.ej. https://ih.buildsoft.com.pe)."
[ -n "${OPENBAO_OIDC_CLIENT_SECRET:-}" ] || fallo "falta OPENBAO_OIDC_CLIENT_SECRET (el mismo valor de int/.env que recibio Keycloak)."

BAO_ADDR="${BAO_ADDR:-http://127.0.0.1:8200}"
export BAO_ADDR BAO_TOKEN

REALM_URL="${PUBLIC_BASE_URL}/iam/realms/integration-hub"
SETUP_DIR="/openbao/setup"

# Certificado en el que confiar al hablar con Keycloak.
#
# VACIO por defecto, al contrario que en el paquete de integracion. Alli el certificado de nginx
# es AUTOFIRMADO y OpenBao tiene que confiar en el explicitamente; aqui la cadena la emite una CA
# publica y le vale el almacen del sistema.
#
# Y no es que "sobre": pasarle el certificado HOJA de una cadena real haria FALLAR la
# verificacion, no relajarla. Solo se rellena apuntando a un autofirmado.
BAO_OIDC_CA_FILE="${BAO_OIDC_CA_FILE-}"

# -------------------------------------------------------------------------------------
# 1. La boveda tiene que estar viva y DESELLADA. Sellada, todo lo de abajo falla con un
#    "Vault is sealed" que no dice que basta con desellarla.
# -------------------------------------------------------------------------------------
bao status >/dev/null 2>&1 || fallo "OpenBao no responde o esta SELLADO. Desellalo primero (Unseal en /ui/ o 'bao operator unseal')."

# -------------------------------------------------------------------------------------
# 2. EL PUNTO QUE MAS FALLA: OpenBao tiene que alcanzar Keycloak POR LA URL PUBLICA, y el
#    `issuer` que Keycloak anuncia tiene que ser EXACTAMENTE esa misma URL.
#
#    OpenBao no se limita a redirigir el navegador: descubre la configuracion, canjea el codigo y
#    baja las claves por su cuenta. Si usara una URL interna (keycloak:8180) el issuer no
#    coincidiria y el metodo ni se deja configurar.
#
#    Se comprueba ANTES de escribir nada, porque el error nativo —"error checking oidc discovery
#    URL"— no distingue entre "no llego", "no me fio del certificado" y "el issuer no coincide".
# -------------------------------------------------------------------------------------
echo "==> Comprobando que OpenBao alcanza a Keycloak en ${REALM_URL}"
DESCUBRIMIENTO="$(wget -qO- --timeout=10 --no-check-certificate "${REALM_URL}/.well-known/openid-configuration" 2>/dev/null)" \
  || fallo "OpenBao no llega a ${REALM_URL}.
  Causa habitual: PUBLIC_BASE_URL apunta a un nombre que NO se resuelve dentro de la red de Docker.
  'localhost' nunca vale: dentro del contenedor es el propio contenedor.
  Comprobar que nginx tiene el alias de red de ese nombre y que escucha en el puerto de la URL."

ISSUER="$(printf '%s' "$DESCUBRIMIENTO" | grep -o '"issuer":"[^"]*"' | sed 's/.*"issuer":"\([^"]*\)".*/\1/')"
[ "$ISSUER" = "$REALM_URL" ] || fallo "el issuer que anuncia Keycloak NO coincide con la URL usada.
  esperado: ${REALM_URL}
  recibido: ${ISSUER}
  OpenBao rechaza la configuracion si no son identicos. Alinear KC_HOSTNAME/PUBLIC_BASE_URL."
echo "    issuer coincide: ${ISSUER}"

# -------------------------------------------------------------------------------------
# 3. Politicas. Se reescriben siempre: el fichero del repo es la fuente de verdad, no lo que
#    haya quedado en la boveda de una ejecucion anterior.
# -------------------------------------------------------------------------------------
echo "==> Politicas"
bao policy write integration-hub "${SETUP_DIR}/policy-integration-hub.hcl" >/dev/null
bao policy write ih-secrets-admin "${SETUP_DIR}/policy-secrets-admin.hcl" >/dev/null
echo "    integration-hub (la app, solo lectura) e ih-secrets-admin (operadores) escritas"

# -------------------------------------------------------------------------------------
# 4. Metodo OIDC. Habilitarlo dos veces es un error, no una operacion neutra: se comprueba antes.
# -------------------------------------------------------------------------------------
if bao auth list -format=json | grep -q '"oidc/"'; then
  echo "==> Metodo oidc ya habilitado"
else
  echo "==> Habilitando el metodo oidc"
  bao auth enable oidc >/dev/null
fi

echo "==> Configurando el proveedor"
if [ -n "$BAO_OIDC_CA_FILE" ]; then
  [ -r "$BAO_OIDC_CA_FILE" ] || fallo "no se puede leer el certificado ${BAO_OIDC_CA_FILE}. Comprobar que el compose lo monta."
  bao write auth/oidc/config \
    oidc_discovery_url="$REALM_URL" \
    oidc_discovery_ca_pem=@"$BAO_OIDC_CA_FILE" \
    oidc_client_id="openbao" \
    oidc_client_secret="$OPENBAO_OIDC_CLIENT_SECRET" \
    default_role="sso" >/dev/null
else
  bao write auth/oidc/config \
    oidc_discovery_url="$REALM_URL" \
    oidc_client_id="openbao" \
    oidc_client_secret="$OPENBAO_OIDC_CLIENT_SECRET" \
    default_role="sso" >/dev/null
fi

# -------------------------------------------------------------------------------------
# 5. El rol. NO lleva politicas de secretos: reparte solo `default`, que no alcanza ninguna
#    credencial. El permiso real llega por el grupo del paso 6, segun el rol de Keycloak.
#
#    Asi, entrar por SSO no concede nada por si mismo. Fail-closed.
#
#    Las tres redirect_uris tienen que coincidir con las del cliente en Keycloak; el navegador
#    usa la primera, la CLI la tercera (levanta un servidor local efimero en el 8250).
# -------------------------------------------------------------------------------------
echo "==> Rol 'sso'"
bao write auth/oidc/role/sso \
  role_type="oidc" \
  user_claim="preferred_username" \
  groups_claim="groups" \
  bound_audiences="openbao" \
  oidc_scopes="profile,email" \
  allowed_redirect_uris="${PUBLIC_BASE_URL}/ui/vault/auth/oidc/oidc/callback,${PUBLIC_BASE_URL}/v1/auth/oidc/oidc/callback,http://localhost:8250/oidc/callback" \
  token_policies="default" \
  token_ttl="1h" \
  token_max_ttl="8h" >/dev/null

# -------------------------------------------------------------------------------------
# 6. Grupo externo: el ROL `platform-admin` de Keycloak concede la politica de operador.
#
#    El claim `groups` del ID token lo pone un mapper del cliente `openbao` en el realm. Dar o
#    quitar el acceso a los secretos es dar o quitar ese rol en Keycloak — el mismo sitio que ya
#    gobierna el acceso a la aplicacion. Aqui no se mantiene ninguna lista de personas.
# -------------------------------------------------------------------------------------
echo "==> Grupo externo 'platform-admin' -> ih-secrets-admin"
bao write identity/group name="platform-admin" type="external" policies="ih-secrets-admin" >/dev/null
GROUP_ID="$(bao read -field=id identity/group/name/platform-admin)"

# El accesor del montaje oidc: sin jq en la imagen, se extrae del JSON. El prefijo `auth_oidc_`
# es estable, asi que el patron no depende del formateo.
ACCESSOR="$(bao auth list -format=json | grep -o '"accessor": *"auth_oidc_[^"]*"' | sed 's/.*"\(auth_oidc_[^"]*\)".*/\1/' | head -1)"
[ -n "$ACCESSOR" ] || fallo "no se pudo determinar el accessor del montaje oidc."
# Crear el alias dos veces es un error; que YA exista es exactamente el estado que se busca.
#
# NO se interpreta el MENSAJE del error para distinguirlo. Se intento y fallo: yo di por hecho que
# diria "already exists" y OpenBao dice "combination of mount and group alias name is already in
# use". El script aborto anunciando un problema donde el estado ya era el correcto: una falsa alarma
# justo en el ultimo paso, que es cuando mas parece que algo se rompio de verdad.
# justo en el paso final, que es cuando mas parece que algo se rompio de verdad.
#
# Ahora se comprueba el ESTADO, no el texto: si el grupo ya tiene un alias colgado de ESTE montaje
# oidc, el objetivo esta cumplido y da igual como lo dijera el error. Cualquier otro caso sube.
if ! ERR="$(bao write identity/group-alias name="platform-admin" mount_accessor="$ACCESSOR" canonical_id="$GROUP_ID" 2>&1 >/dev/null)"; then
  ESTADO="$(bao read identity/group/name/platform-admin 2>/dev/null || echo '')"
  case "$ESTADO" in
    *"$ACCESSOR"*) echo "    el alias ya estaba puesto (verificado en el grupo, no supuesto)" ;;
    *) fallo "no se pudo crear el alias y el grupo tampoco lo tiene. Error original: $ERR" ;;
  esac
fi

echo
echo "LISTO. Entrar en ${PUBLIC_BASE_URL}/ui/ -> Method: OIDC -> Sign in with OIDC Provider."
echo "Quien tenga el rol 'platform-admin' en Keycloak gestiona secretos; el resto entra sin acceso."
