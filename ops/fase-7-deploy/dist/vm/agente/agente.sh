#!/usr/bin/env bash
# =============================================================================================
# AGENTE DE DESPLIEGUE DE LA VM - el lado maquina de ADR-030.
#
# LA VM TIRA, NADIE EMPUJA (D1). Ningun workflow tiene clave SSH ni puerto abierto contra la
# maquina que guarda la boveda. Este script se despierta cada pocos minutos, mira que version
# dice la rama de estado que debe correr, y si no es la que corre, la aplica.
#
# LO QUE NO HACE, Y ES DELIBERADO:
#   - No decide retroceder (D10). Un rollback es una persona escribiendo `tag` en el fichero.
#   - No aplica un retroceso de clase C. Ese exige script de bajada e instantanea previa, y la
#     VM ni siquiera puede hacerse una instantanea a si misma: sus ambitos no incluyen `compute`.
#   - No avanza `tag_estable` (D13). Solo deja constancia de que ya se podria.
#
# CODIGOS DE SALIDA: 0 nada que hacer o aplicado con exito - 10 aplazado por trabajo en vuelo -
# 20 rechazado (retroceso de clase C, o sin clase declarada) - 30 aplicado pero la salud no
# volvio - 78 configuracion incompleta - 1 error inesperado.
# =============================================================================================
set -euo pipefail

CONF="${1:-/etc/ih-agente.conf}"
[ -r "$CONF" ] || { echo "FATAL: no puedo leer la configuracion $CONF" >&2; exit 78; }
# shellcheck source=/dev/null
. "$CONF"

: "${REPO:?falta REPO en la configuracion}"
: "${DESPLIEGUE:?falta DESPLIEGUE en la configuracion}"
: "${PUBLIC_HOST:?falta PUBLIC_HOST en la configuracion}"
RAMA_ESTADO="${RAMA_ESTADO:-estado/vm-produccion}"
ESTADO_AGENTE="${ESTADO_AGENTE:-/var/lib/ih-agente/ultimo.txt}"
SALUD_INTENTOS="${SALUD_INTENTOS:-36}"
SALUD_ESPERA="${SALUD_ESPERA:-5}"

COMPOSE="$DESPLIEGUE/docker-compose.cloud.yml"
ENTORNO="$DESPLIEGUE/.env"

log() { printf '%s  %s\n' "$(date -Is)" "$*"; }

# LA CONSTANCIA NO ES UN LOG. El journal se rota; esto es lo que mira una persona a las tres de
# la manana para saber por que la version no cambio. Se reescribe entera en cada decision.
constancia() {
  local veredicto="$1"; shift
  mkdir -p "$(dirname "$ESTADO_AGENTE")"
  { printf 'fecha: %s\n' "$(date -Is)"
    printf 'veredicto: %s\n' "$veredicto"
    printf '%s\n' "$@"
  } > "$ESTADO_AGENTE.tmp"
  mv "$ESTADO_AGENTE.tmp" "$ESTADO_AGENTE"
}

# -- lectura del fichero de estado -------------------------------------------------------------
# Se lee de origin/<rama>, NUNCA del arbol de trabajo del clon: si alguien dejo el clon en otra
# rama o con cambios locales, el agente seguiria leyendo lo que dice el remoto.
campo() {
  git -C "$REPO" show "origin/$RAMA_ESTADO:estado.yaml" \
    | sed 's/\r$//' | grep -E "^$1:" | head -1 | cut -d: -f2- | tr -d ' ' || true
}

variable_env() { sed 's/\r$//' "$ENTORNO" | grep -E "^$1=" | head -1 | cut -d= -f2- || true; }

# Escribe NOMBRE=VALOR en el .env sin tocar nada mas. Fichero temporal y `mv`, no `sed -i`: un
# corte a mitad de un sed en sitio deja el .env truncado, y sin .env no levanta ni `compose ps`.
poner_env() {
  local nombre="$1" valor="$2"
  if grep -qE "^$nombre=" "$ENTORNO"; then
    sed "s|^$nombre=.*|$nombre=$valor|" "$ENTORNO" > "$ENTORNO.tmp"
  else
    { cat "$ENTORNO"; printf '%s=%s\n' "$nombre" "$valor"; } > "$ENTORNO.tmp"
  fi
  mv "$ENTORNO.tmp" "$ENTORNO"
}

psql_() { docker exec ih-postgres psql -U postgres -d integration_hub -tAc "$1"; }

dc() { docker compose -f "$COMPOSE" --env-file "$ENTORNO" "$@"; }

# -- D14: salud por nginx ------------------------------------------------------------------------
# `--resolve` fuerza la conexion a la propia maquina manteniendo el nombre en SNI y en Host. Sin
# el, la peticion sale a internet y vuelve por la IP publica (hairpin NAT), que no siempre
# funciona: la comprobacion fallaria por red, no por la aplicacion.
salud() {
  curl -fsS --max-time 10 --resolve "$PUBLIC_HOST:443:127.0.0.1" \
    -o /dev/null -w '%{http_code}' "https://$PUBLIC_HOST/q/health" 2>/dev/null || echo "000"
}

esperar_salud() {
  local i codigo="000"
  for i in $(seq 1 "$SALUD_INTENTOS"); do
    codigo="$(salud)"
    if [ "$codigo" = "200" ]; then log "salud 200 al intento $i"; return 0; fi
    sleep "$SALUD_ESPERA"
  done
  log "salud sigue en $codigo tras $((SALUD_INTENTOS * SALUD_ESPERA))s"
  return 1
}

# ===============================================================================================
log "despierta: rama $RAMA_ESTADO, despliegue $DESPLIEGUE"

[ -r "$COMPOSE" ] || { echo "FATAL: no existe $COMPOSE" >&2; exit 78; }
[ -r "$ENTORNO" ] || { echo "FATAL: no existe $ENTORNO" >&2; exit 78; }

git -C "$REPO" fetch --quiet --prune origin "+refs/heads/*:refs/remotes/origin/*"

DESEADO="$(campo tag)"
ESTABLE="$(campo tag_estable)"
CLASE="$(campo clase)"
ACTUAL="$(variable_env IMAGE_TAG)"

log "fichero: tag=$DESEADO tag_estable=$ESTABLE clase=${CLASE:-<vacia>} - corriendo=$ACTUAL"

[ -n "$DESEADO" ] || { log "el fichero no pide ninguna version; nada que hacer"; exit 0; }

if [ "$DESEADO" = "$ACTUAL" ]; then
  log "ya corre la version pedida; nada que hacer"
  exit 0
fi

# -- direccion del salto -------------------------------------------------------------------------
# ADELANTE o ATRAS no se deduce del fichero sino de la historia: si el deseado es antepasado del
# que corre, se esta retrocediendo. Es exacto, y el clon ya tiene el dato.
DIRECCION="adelante"
if [ -n "$ACTUAL" ] && git -C "$REPO" merge-base --is-ancestor "$DESEADO" "$ACTUAL" 2>/dev/null; then
  DIRECCION="atras"
fi
log "el salto va hacia $DIRECCION"

# -- D7/D9/D10: un retroceso de clase C no lo aplica una maquina ----------------------------------
if [ "$DIRECCION" = "atras" ] && [ "$CLASE" = "C" ]; then
  log "RECHAZADO: retroceso de clase C"
  constancia "rechazado" "motivo: retroceso de clase C" "deseado: $DESEADO" "corriendo: $ACTUAL" \
    "que hacer: aplicar a mano el script de ops/fase-7-deploy/rollback/ y la instantanea previa (D7, D9)"
  exit 20
fi

if [ "$DIRECCION" = "atras" ] && [ -z "$CLASE" ]; then
  log "RECHAZADO: retroceso sin clase declarada"
  constancia "rechazado" "motivo: se pide retroceder y el campo clase esta vacio" \
    "deseado: $DESEADO" "corriendo: $ACTUAL" \
    "que hacer: declarar la clase en estado.yaml; el gate del pull request la verifica"
  exit 20
fi

# -- D12: trabajo en vuelo -------------------------------------------------------------------------
# SUSPENDED y NEEDS_RECONCILIATION no cuentan: esperan a una persona, no a un reloj. Bloquear por
# ellos seria bloquear los despliegues para siempre.
EJECUCIONES="$(psql_ "select count(*) from process_execution where status in ('RUNNING','PENDING')")"
if [ "$(psql_ "select to_regclass('vertical_mt101.mt101_rebuild_run') is not null")" = "t" ]; then
  PAGOS="$(psql_ "select count(*) from vertical_mt101.mt101_rebuild_run where pay_lease_until > now()")"
else
  PAGOS=0
fi
log "en vuelo: $EJECUCIONES ejecucion(es), $PAGOS pago(s) correctivo(s) con arrendamiento vivo"

if [ "$EJECUCIONES" -gt 0 ] || [ "$PAGOS" -gt 0 ]; then
  log "APLAZADO por trabajo en vuelo; se reintenta en la siguiente vuelta"
  constancia "aplazado" "motivo: trabajo en vuelo" \
    "ejecuciones RUNNING o PENDING: $EJECUCIONES" \
    "pagos correctivos con arrendamiento vivo: $PAGOS" \
    "deseado: $DESEADO" "corriendo: $ACTUAL" \
    "que hacer: nada; el agente lo aplicara solo cuando la maquina este ociosa"
  exit 10
fi

# -- aplicar ----------------------------------------------------------------------------------------
# D5: el retroceso de clase B necesita la variable para que la imagen vieja arranque con la base ya
# migrada. D6: en cualquier salto hacia adelante se RETIRA, siempre, la pusiera quien la pusiera.
IGNORAR="false"
if [ "$DIRECCION" = "atras" ] && [ "$CLASE" = "B" ]; then IGNORAR="true"; fi

log "aplicando $ACTUAL -> $DESEADO (clase ${CLASE:-A}, FLYWAY_IGNORE_FUTURE=$IGNORAR)"
poner_env IMAGE_TAG "$DESEADO"
poner_env FLYWAY_IGNORE_FUTURE "$IGNORAR"

dc pull platform-app audit-consumer
dc up -d platform-app audit-consumer

# D11: nginx resuelve `platform-app` UNA VEZ, al arrancar - el template no tiene `resolver`. Al
# recrear el contenedor cambia la IP y el proxy sigue hablando con la vieja: 502 con la aplicacion
# perfectamente viva. `nginx -s reload` recarga sin tirar el proceso, que es lo que importa cuando
# openbao o keycloak podrian no estar en pie: un arranque en frio abortaria por upstream ausente.
log "recargando nginx (D11)"
docker exec ih-nginx nginx -s reload

if esperar_salud; then
  log "LISTO: corriendo $DESEADO"
  constancia "aplicado" "de: $ACTUAL" "a: $DESEADO" "clase: ${CLASE:-A}" "direccion: $DIRECCION" \
    "flyway_ignore_future: $IGNORAR" \
    "tag_estable en el fichero: $ESTABLE" \
    "siguiente paso humano: si esta version se sostiene, avanzar tag_estable a $DESEADO (D13)"
  exit 0
fi

# D10: NO se retrocede solo. Volver a la imagen anterior sin saber por que fallo puede ser la
# segunda caida en lugar de la reparacion, y con migraciones aplicadas ni siquiera arrancaria.
log "APLICADO PERO SIN SALUD: se deja como esta y se avisa"
constancia "sin-salud" "de: $ACTUAL" "a: $DESEADO" \
  "motivo: /q/health no devolvio 200 tras $((SALUD_INTENTOS * SALUD_ESPERA))s" \
  "que hacer: mirar 'docker logs ih-app'. El agente NO retrocede solo (D10); si hay que volver," \
  "escribir tag: $ACTUAL en la rama de estado y dejar que este mismo agente lo aplique"
exit 30
