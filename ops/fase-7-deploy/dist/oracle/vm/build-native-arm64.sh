#!/bin/sh
# =====================================================================================
# Compila las dos imagenes propias para aarch64, EN ESTA MISMA VM.
#
#   ./build-native-arm64.sh /ruta/al/repo
#
# POR QUE NO SIRVEN LAS IMAGENES DEL ENTORNO DE INTEGRACION
# Son binarios NATIVOS de GraalVM compilados para amd64, y un binario nativo no es portable
# entre arquitecturas. Aqui el contenedor arranca y muere al instante con "exec format error",
# un mensaje que no menciona la arquitectura por ningun lado y parece corrupcion de imagen.
#
# POR QUE SE COMPILA AQUI Y NO EN EL PORTATIL
# Compilar aarch64 desde amd64 exige emulacion (QEMU), que multiplica por varias veces un build
# que ya dura decenas de minutos. Esta VM ES ARM: compila a velocidad nativa.
#
# QUE HACE FALTA EN LA VM: solo Docker. La compilacion entera —Maven, Node para la UI y GraalVM—
# ocurre DENTRO del contenedor de build. Ni JDK ni Maven instalados en la maquina.
# =====================================================================================
set -eu

fallo() { echo "ERROR: $*" >&2; exit 1; }

REPO="${1:-}"
[ -n "$REPO" ] || fallo "uso: $0 /ruta/al/repo"
[ -d "$REPO/platform-app" ] || fallo "$REPO no parece la raiz del repositorio (no veo platform-app/)."

ARCH="$(uname -m)"
[ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ] \
  || fallo "esta maquina es $ARCH, no ARM. Este script compila EN la arquitectura destino; en amd64 produciria imagenes que no arrancan en la VM."

# -------------------------------------------------------------------------------------
# La stack tiene que estar PARADA. No es una recomendacion.
#
# El build nativo pica ~9,3 GB. Lanzarlo con la stack viva hace que el nucleo mate procesos por
# falta de memoria — y no mata al build, mata a lo que haya. Ya ocurrio en el entorno de
# integracion: servicios cayendose durante una compilacion que parecia ir bien, con `free`
# mostrando memoria disponible un segundo antes.
# -------------------------------------------------------------------------------------
if docker ps --format '{{.Names}}' | grep -q '^ih-'; then
  fallo "hay contenedores de la stack corriendo. Pararlos antes:
    docker compose -f docker-compose.cloud.yml --env-file .env down
  El build necesita casi toda la memoria y el nucleo matara procesos al azar si compite."
fi

cd "$REPO"
DOCKERFILE=ops/fase-7-deploy/dist/common/Dockerfile.native-build

echo "==> Compilando en $ARCH desde $REPO"
echo "    (el contexto es el repositorio entero porque el build necesita las fuentes;"
echo "     la primera vez tarda tambien en enviarlo)"

# El perfil `appih` hornea el root-path /appih en el binario. Sin el, la app se sirve en la raiz y
# nginx la enruta a un sitio donde no esta: 404 en todas las rutas, con la app perfectamente viva.
echo "==> [1/2] platform-app (nativo, con /appih horneado)"
docker build -f "$DOCKERFILE" \
  --build-arg MAVEN_PROFILES=native,appih \
  -t integration-hub:native-appih-arm64 .

echo "==> [2/2] audit-consumer (nativo)"
docker build -f "$DOCKERFILE" \
  --build-arg MODULE=audit-consumer \
  -t integration-hub-audit-consumer:native-arm64 .

# -------------------------------------------------------------------------------------
# Verificar por ARQUITECTURA, no por que el build dijera OK. Una imagen amd64 construida aqui
# por error pasaria todos los pasos y solo fallaria al arrancar el contenedor.
# -------------------------------------------------------------------------------------
echo
for IMG in integration-hub:native-appih-arm64 integration-hub-audit-consumer:native-arm64; do
  A="$(docker image inspect "$IMG" --format '{{.Architecture}}' 2>/dev/null || echo '?')"
  printf '%-48s %s\n' "$IMG" "$A"
  [ "$A" = "arm64" ] || fallo "$IMG quedo en '$A', no arm64. No arrancara."
done
echo
echo "LISTO. Las dos imagenes son arm64."
