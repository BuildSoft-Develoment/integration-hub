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
    # `git -C repo ls-tree -r --name-only <ref>`: el ref es el ULTIMO argumento. De aqui sale el
    # conjunto de migraciones que conoce cada commit, que es lo unico que decide si la base queda
    # por delante del binario.
    ls-tree)    f="$FALSO_MIG/${!#}.txt"; [ -f "$f" ] && cat "$f"; exit 0 ;;
  esac
done
exit 0
DOBLE

cat > "$BANCO/bin/docker" <<'DOBLE'
#!/usr/bin/env bash
if [ "${1:-}" = "compose" ]; then
  echo "[doble] docker $*" >> "$FALSO_DIARIO"
  # Un tag que no existe en el registro: `pull` falla y `up` nunca deberia llegar a correr.
  for a in "$@"; do
    if [ "$a" = "pull" ] && [ "${FALSO_PULL:-ok}" = "falla" ]; then
      echo "Error response from daemon: manifest unknown" >&2; exit 1
    fi
  done
  exit 0
fi
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
# 000 no es un codigo HTTP: es curl sin poder conectar. Se imita fallando de verdad, no
# imprimiendo la cadena, porque el agente distingue los dos casos y el doble tambien debe.
if [ "${FALSA_SALUD:-200}" = "000" ]; then echo "000"; exit 7; fi
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

  # Las migraciones que conoce cada commit. Con MIG_ACTUAL="101 102" y MIG_DESEADO="101", el
  # destino no conoce la 102: la base queda por delante del binario.
  mkdir -p "$caja/mig"; : > "$caja/mig/$actual.txt"; : > "$caja/mig/$tag.txt"
  for v in ${MIG_ACTUAL:-};  do echo "platform-app/src/main/resources/db/migration/V${v}__x.sql" >> "$caja/mig/$actual.txt"; done
  for v in ${MIG_DESEADO:-}; do echo "platform-app/src/main/resources/db/migration/V${v}__x.sql" >> "$caja/mig/$tag.txt"; done

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
  FALSO_MIG="$caja/mig" \
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
MIG_ACTUAL="101" MIG_DESEADO="101 102" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=200 \
  caso "pase normal, maquina ociosa" 0 "f9c273d" "9b064f6" "f9c273d" "A"
env_dice "IMAGE_TAG=9b064f6"
# D6: la variable se retira SIEMPRE al ir hacia adelante, la hubiera puesto quien la hubiera puesto.
env_dice "FLYWAY_IGNORE_FUTURE=false"

# EL ORDEN IMPORTA: si la imagen no existe, el .env NO puede quedar escrito. Escrito, la vuelta
# siguiente veria deseado == corriendo y daria por bueno un despliegue que nunca ocurrio.
MIG_ACTUAL="101" MIG_DESEADO="101 102" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSO_PULL=falla \
  caso "la imagen del tag no existe en el registro" 1 "f9c273d" "9b064f6" "f9c273d" "A"
env_dice "IMAGE_TAG=f9c273d"

MIG_ACTUAL="101" MIG_DESEADO="101 102" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=503 \
  caso "aplica y la salud responde 503" 30 "f9c273d" "9b064f6" "f9c273d" "A"
MIG_ACTUAL="101" MIG_DESEADO="101 102" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=000 \
  caso "aplica y no hay nadie escuchando" 30 "f9c273d" "9b064f6" "f9c273d" "A"

echo
echo "D12 - trabajo en vuelo"
MIG_ACTUAL="101" MIG_DESEADO="101 102" FALSAS_EJECUCIONES=3 FALSOS_PAGOS=0 \
  caso "hay ejecuciones RUNNING o PENDING" 10 "f9c273d" "9b064f6" "f9c273d" "A"
env_dice "IMAGE_TAG=f9c273d"
MIG_ACTUAL="101" MIG_DESEADO="101 102" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=1 \
  caso "hay un pago correctivo con arrendamiento vivo" 10 "f9c273d" "9b064f6" "f9c273d" "A"

echo
echo "Hacia atras"
# Clase A retrocediendo: el destino conoce TODAS las migraciones aplicadas, asi que la base no
# queda por delante de nada y la variable de Flyway no pinta aqui.
MIG_ACTUAL="101" MIG_DESEADO="101" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=200 \
  caso "retroceso de clase A" 0 "9b064f6" "f9c273d" "f9c273d" "A"
env_dice "FLYWAY_IGNORE_FUTURE=false"

# D5: sin esta variable la imagen vieja NO ARRANCA, aunque la migracion fuera aditiva.
MIG_ACTUAL="101 102" MIG_DESEADO="101" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 FALSA_SALUD=200 \
  caso "retroceso de clase B" 0 "9b064f6" "f9c273d" "f9c273d" "B"
env_dice "FLYWAY_IGNORE_FUTURE=true"

MIG_ACTUAL="101 102" MIG_DESEADO="101" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 \
  caso "retroceso de clase C - se niega" 20 "9b064f6" "f9c273d" "f9c273d" "C"
env_dice "IMAGE_TAG=9b064f6"

MIG_ACTUAL="101 102" MIG_DESEADO="101" FALSAS_EJECUCIONES=0 FALSOS_PAGOS=0 \
  caso "retroceso sin clase declarada - se niega" 20 "9b064f6" "f9c273d" "f9c273d" ""
env_dice "IMAGE_TAG=9b064f6"

echo
echo "Configuracion incompleta"
FALSAS_EJECUCIONES=0 \
  caso "el vertical no esta instalado" 0 "f9c273d" "f9c273d" "f9c273d" ""

echo
printf 'pasadas %s - falladas %s\n\n' "$PASADAS" "$FALLADAS"
[ "$FALLADAS" -eq 0 ]
