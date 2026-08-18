#!/bin/sh
# =====================================================================================
# Emite el primer certificado y deja la stack sirviendo por HTTPS. Idempotente.
#
#   ./init-tls.sh
#
# EL PROBLEMA QUE RESUELVE: HUEVO Y GALLINA
# nginx no arranca si su configuracion apunta a un certificado que no existe. Y el
# certificado no se puede emitir sin que nginx este sirviendo, porque la CA valida haciendo
# una peticion HTTP REAL contra /.well-known/acme-challenge/ del nombre publico.
#
# Se rompe por orden, no por trucos: primero nginx con SOLO el fichero del puerto 80, que no
# menciona ningun certificado; con el en pie se emite; y solo entonces se activa el 443.
#
# ANTES DE EJECUTARLO, el DNS del nombre publico TIENE que resolver a la IP de esta maquina.
# No es un detalle de configuracion: la validacion es una peticion de verdad desde internet.
# Si el nombre apunta a otro sitio, certbot falla — y falla bien, diciendo que no pudo
# alcanzar el reto.
# =====================================================================================
set -eu

fallo() { echo "ERROR: $*" >&2; exit 1; }

[ -f .env ] || fallo "no encuentro .env. Copiar .env.example y rellenarlo."

# shellcheck disable=SC1091
PUBLIC_HOST="$(grep '^PUBLIC_HOST=' .env | cut -d= -f2- | tr -d '[:space:]')"
CERTBOT_EMAIL="$(grep '^CERTBOT_EMAIL=' .env | cut -d= -f2- | tr -d '[:space:]')"

[ -n "$PUBLIC_HOST" ] || fallo "falta PUBLIC_HOST en .env."
[ -n "$CERTBOT_EMAIL" ] || fallo "falta CERTBOT_EMAIL en .env. La CA lo exige, y es el unico aviso que llega si la renovacion automatica deja de funcionar."

COMPOSE="docker compose -f docker-compose.cloud.yml --env-file .env"
CONF="nginx/conf.d/10-https.conf"

echo "==> Nombre publico: ${PUBLIC_HOST}"

# -------------------------------------------------------------------------------------
# 1. Solo el puerto 80. Si el fichero del 443 ya estaba, se retira: apunta a un certificado
#    que quiza no exista todavia, y nginx no arrancaria.
# -------------------------------------------------------------------------------------
[ -f "$CONF" ] && { echo "==> Retirando temporalmente la configuracion de 443"; rm -f "$CONF"; }

echo "==> Levantando nginx (solo para la validacion)"
# --no-deps: nginx declara depends_on de la app y de Keycloak, que aqui no hacen falta y
# tardarian en arrancar. Para responder un reto ACME basta el proxy.
$COMPOSE up -d --no-deps nginx

# -------------------------------------------------------------------------------------
# 2. El certificado. Si ya existe y sigue vigente, certbot no hace nada: repetir esto no
#    gasta cuota de la CA.
# -------------------------------------------------------------------------------------
echo "==> Pidiendo el certificado para ${PUBLIC_HOST}"
$COMPOSE run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$PUBLIC_HOST" \
  -m "$CERTBOT_EMAIL" \
  --agree-tos --no-eff-email --non-interactive --keep-until-expiring \
  || fallo "la CA no pudo validar ${PUBLIC_HOST}.
  Lo habitual es una de estas tres:
   - el DNS de ese nombre no apunta a la IP publica de esta maquina;
   - el puerto 80 esta cerrado en la security list de Oracle;
   - el puerto 80 esta cerrado en el cortafuegos DE DENTRO de la imagen (iptables), que
     Oracle Linux y Ubuntu traen filtrando por defecto y sorprende a todo el mundo."

# -------------------------------------------------------------------------------------
# 3. Ahora si, el 443. El nombre va sustituido en la plantilla porque nginx NO interpola
#    variables de entorno en su configuracion, y las rutas del certificado lo llevan dentro.
# -------------------------------------------------------------------------------------
echo "==> Activando HTTPS"
sed "s|__PUBLIC_HOST__|${PUBLIC_HOST}|g" nginx/conf.d/10-https.conf.template > "$CONF"

echo "==> Levantando la stack completa"
$COMPOSE up -d

echo "==> Recargando nginx"
$COMPOSE exec -T nginx nginx -t
$COMPOSE exec -T nginx nginx -s reload

echo
echo "LISTO. https://${PUBLIC_HOST}/appih/"
echo "La renovacion es automatica: el contenedor certbot reintenta cada 12h y actua cuando"
echo "faltan menos de 30 dias. Para eso el puerto 80 debe seguir abierto."
