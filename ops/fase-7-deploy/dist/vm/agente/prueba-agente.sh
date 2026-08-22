#!/usr/bin/env bash
# =============================================================================================
# BANCO DE PRUEBAS DEL AGENTE. Ejercita la matriz de decisiones sin VM, sin docker y sin red,
# sustituyendo `git`, `docker` y `curl` por dobles que responden lo que cada caso necesita.
#
# POR QUE EXISTE. El agente decide sobre el camino del dinero y solo se le ve trabajar el dia que
# hay un despliegue -- que es el peor dia para descubrir que la matriz estaba mal. Aqui se prueba
# lo unico que no puede fallar: que aplica cuando debe, que se aplaza cuando hay trabajo en vuelo,
# y que se NIEGA en los dos casos en los que aplicar seria peor que no hacer nada.
#
# Se ejecuta sin argumentos:  ./prueba-agente.sh
# =============================================================================================
set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
AGENTE="$AQUI/agente.sh"
BANCO="$(mktemp -d)"
trap 'rm -rf "$BANCO"' EXIT

PASADAS=0
FALLADAS=0

# ---------------------------------------------------------------------------------------------
# LOS DOBLES. Cada uno lee su comportamiento de variables de entorno que fija el caso.
# ---------------------------------------------------------------------------------------------
mkdir -p "$BANCO/bin"

cat > "$BANCO/bin/git" <<'DOBLE'
#!/usr/bin/env bash
for a in "$@"; do
  case "$a" in
    fetch)      exit 0 ;;
    show)       cat "$FALSO_ESTADO"; exit 0 ;;
    merge-base) [ "${FALSA_DIRECCION:-adelante}" = "atras" ] && exit 0 || exit 1 ;;
  esac
done
exit 0
DOBLE

cat > "$BANCO/bin/docker" <<'DOBLE'
#!/usr/bin/env bash
if [ "${1:-}" = "compose" ]; then echo "[doble] docker $*" >> "$FALSO_DIARIO"; exit 0; fi
if [ "${1:-}" = "exec" ] && [ "${2:-}" = "ih-nginx" ]; then
  echo "[doble] nginx reload" >> "$FALSO_DIARIO"; exit 0
fi
if [ "${1:-}" = "exec" ] && [ "${2:-}" = "ih-postgres" ]; then
  sql="${!#}"
  case "$sql" in
    *to_regclass*)        echo "${FALSO_VERTICAL:-t}" ;;
    *process_execution*)  echo "${FALSAS_EJECUCIONES:-0}" ;;
    *pay_lease_until*)    echo "${FALSOS_PAGOS:-0}" ;;
    *)                    echo "0" ;;
  esac
  exit 0
fi
exit 0
DOBLE

cat > "$BANCO/bin/curl" <<'DOBLE'
#!/usr/bin/env bash
echo "${FALSA_SALUD:-200}"
DOBLE

chmod +x "$BANCO/bin/git" "$BANCO/bin/docker" "$BANCO/bin/curl"

# ---------------------------------------------------------------------------------------------
# UN CASO. Monta un despliegue limpio, escribe el fichero de estado, corre el agente y compara.
#   caso <nombre> <esperado> <tag_actual> <tag> <tag_estable> <clase>
# El resto -- direccion, trabajo en vuelo, salud -- viaja en variables de entorno.
# ---------------------------------------------------------------------------------------------
caso() {
  local nombre="$1" esperado="$2" actual="$3" tag="$4" estable="$5" clase="$6"
  local caja="$BANCO/casos/$(echo "$nombre" | tr ' /' '__')"
  mkdir -p "$caja/despliegue"

  printf 'IMAGE_TAG=%s\nPOSTGRES_PASSWORD=lo-que-sea\n' "$actual" > "$caja/despliegue/.env"
  printf 'services: {}\n' > "$caja/despliegue/docker-compose.cloud.yml"
  printf 'tag: %s\ntag_estable: %s\nclase: %s\n' "$tag" "$estable" "$clase" > "$caja/estado.yaml"

  cat > "$caja/conf" <<CONF
REPO=$caja
DESPLIEGUE=$caja/despliegue
PUBLIC_HOST=ejemplo.invalido
ESTADO_AGENTE=$caja/constancia.txt
SALUD_INTENTOS=2
SALUD_ESPERA=0
CONF

  local obtenido=0
  set +e
  PATH="$BANCO/bin:$PATH" \
  FALSO_ESTADO="$caja/estado.yaml" \
  FALSO_DIARIO="$caja/diario.txt" \
    "$AGENTE" "$caja/conf" > "$caja/salida.txt" 2>&1
  obtenido=$?
  set -e

  ULTIMA_CAJA="$caja"
  if [ "$obtenido" = "$esperado" ]; then
    printf '  OK    %-44s salida %s\n' "$nombre" "$obtenido"
    PASADAS=$((PASADAS + 1))
  else
    printf '  FALLA %-44s esperaba %s y dio %s\n' "$nombre" "$esperado" "$obtenido"
    sed 's/^/          /' "$caja/salida.txt"
    FALLADAS=$((FALLADAS + 1))
  fi
}

# Comprueba una linea del .env resultante del ultimo caso.
env_dice() {
  local esperado="$1"
  if grep -qxF "$esperado" "$ULTIMA_CAJA/despliegue/.env"; then
    printf '  OK      -> el .env dice %s\n' "$esperado"
    PASADAS=$((PASADAS + 1))
  else
    printf '  FALLA   -> el .env NO dice %s; dice:\n' "$esperado"
    sed 's/^/          /' "$ULTIMA_CAJA/despliegue/.env"
    FALLADAS=$((FALLADAS + 1))
  fi
}

# =============================================================================================
echo
echo "Agente de despliegue - matriz de decisiones"
echo

echo "Nada que hacer"
FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 \
  caso "el tag pedido ya es el que corre" 0 "f9c273d" "f9c273d" "f9c273d" ""
FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 \
  caso "el fichero no pide ninguna version" 0 "f9c273d" "" "f9c273d" ""

echo
echo "Hacia adelante"
FALSA_DIRECCION=adelante FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=200 \
  caso "pase normal, maquina ociosa" 0 "f9c273d" "9b064f6" "f9c273d" "A"
env_dice "IMAGE_TAG=9b064f6"
# D6: la variable se retira SIEMPRE al ir hacia adelante, la hubiera puesto quien la hubiera puesto.
env_dice "FLYWAY_IGNORE_FUTURE=false"

FALSA_DIRECCION=adelante FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=503 \
  caso "aplica pero la salud no vuelve" 30 "f9c273d" "9b064f6" "f9c273d" "A"

echo
echo "D12 - trabajo en vuelo"
FALSA_DIRECCION=adelante FALSAS_EJECUCIONES=3 FALSOS_PAGOS=0 \
  caso "hay ejecuciones RUNNING o PENDING" 10 "f9c273d" "9b064f6" "f9c273d" "A"
env_dice "IMAGE_TAG=f9c273d"
FALSA_DIRECCION=adelante FALSAS_EJECUCIONES=0 FALSOS_PAGOS=1 \
  caso "hay un pago correctivo con arrendamiento vivo" 10 "f9c273d" "9b064f6" "f9c273d" "A"

echo
echo "Hacia atras"
FALSA_DIRECCION=atras FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=200 \
  caso "retroceso de clase A" 0 "9b064f6" "f9c273d" "f9c273d" "A"
env_dice "FLYWAY_IGNORE_FUTURE=false"

# D5: sin esta variable la imagen vieja NO ARRANCA, aunque la migracion fuera aditiva.
FALSA_DIRECCION=atras FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=200 \
  caso "retroceso de clase B" 0 "9b064f6" "f9c273d" "f9c273d" "B"
env_dice "FLYWAY_IGNORE_FUTURE=true"

FALSA_DIRECCION=atras FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 \
  caso "retroceso de clase C - se niega" 20 "9b064f6" "f9c273d" "f9c273d" "C"
env_dice "IMAGE_TAG=9b064f6"

FALSA_DIRECCION=atras FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 \
  caso "retroceso sin clase declarada - se niega" 20 "9b064f6" "f9c273d" "f9c273d" ""
env_dice "IMAGE_TAG=9b064f6"

echo
echo "Configuracion incompleta"
FALSAS_EJECUCIONES=0 \
  caso "el vertical no esta instalado" 0 "f9c273d" "f9c273d" "f9c273d" ""

echo
printf 'pasadas %s - falladas %s\n\n' "$PASADAS" "$FALLADAS"
[ "$FALLADAS" -eq 0 ]
