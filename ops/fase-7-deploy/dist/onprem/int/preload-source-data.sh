#!/usr/bin/env bash
# Precarga de datos de prueba MT101 en las fuentes del stack de integracion (SFTP / FTP / S3-MinIO),
# para que los casos de prueba tengan archivos listos en cada tipo de fuente.
#
# Uso:  bash preload-source-data.sh
# Requiere: el stack int levantado (ih-int-sftp-source / ih-int-ftp-source / ih-int-minio).
# Idempotente: vuelve a copiar (sobrescribe) sin romper nada.
#
# Nota Windows/git-bash: se desactiva la conversion de rutas de MSYS (mangea /tmp, /home, etc. en los
# args de docker) y se pasan las rutas del host en forma Windows via cygpath.
set -uo pipefail
export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Portable: si hay un ./data junto al script (paquete C:\deploy autocontenido) se usa; si no, el repo (qa/).
if [[ -d "$SCRIPT_DIR/data" ]]; then
  DATA_DIR="$SCRIPT_DIR/data"; FIN_DIR="$SCRIPT_DIR/data"
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
  DATA_DIR="$REPO_ROOT/qa/fase-6-qa/datos-prueba"; FIN_DIR="$REPO_ROOT"
fi

# Set de archivos a precargar en cada fuente (uno por formato + humo + SWIFT FIN).
FILES=(
  "$DATA_DIR/mt101-10k.csv"            # CSV principal (E2E)
  "$DATA_DIR/mt101-6.csv"             # humo rapido (6 filas)
  "$DATA_DIR/mt101-10k.xlsx"          # reader Excel
  "$DATA_DIR/mt101-10k.txt"           # reader TXT ancho fijo
  "$FIN_DIR/swift-mt101-10k-qa.fin"   # FIN SWIFT (si existe)
)

SFTP_C="ih-int-sftp-source";  SFTP_DIR="/home/ihsource/upload"
FTP_C="ih-int-ftp-source";    FTP_DIR="/ftp/ihftp"
MINIO_C="ih-int-minio";       MINIO_BUCKET="ih-source-inbox"
MINIO_USER="minioadmin";      MINIO_PASS="minioadmin"

# Convierte una ruta git-bash (/c/...) a Windows (C:\...) para que docker la acepte con la conversion apagada.
winpath() { cygpath -w "$1"; }

require_up() {
  for c in "$SFTP_C" "$FTP_C" "$MINIO_C"; do
    if [[ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" != "true" ]]; then
      echo "ERROR: el contenedor $c no esta corriendo. Levanta el stack int primero." >&2
      exit 1
    fi
  done
}

# Alias mc dentro del contenedor minio (el pre-existente puede dar Access Denied): re-set a localhost con root creds.
minio_alias() { docker exec "$MINIO_C" mc alias set local "http://localhost:9000" "$MINIO_USER" "$MINIO_PASS" >/dev/null; }

main() {
  require_up
  minio_alias
  echo "== Precargando en SFTP ($SFTP_C:$SFTP_DIR), FTP ($FTP_C:$FTP_DIR) y S3 ($MINIO_C/$MINIO_BUCKET) =="
  local ok=0
  for f in "${FILES[@]}"; do
    if [[ ! -f "$f" ]]; then echo "  (omito, no existe: $f)"; continue; fi
    local base w; base="$(basename "$f")"; w="$(winpath "$f")"
    echo "  -> $base"
    docker cp "$w" "$SFTP_C:$SFTP_DIR/$base"
    docker cp "$w" "$FTP_C:$FTP_DIR/$base"
    docker cp "$w" "$MINIO_C:/tmp/$base"
    docker exec "$MINIO_C" mc cp "/tmp/$base" "local/$MINIO_BUCKET/$base" >/dev/null
    docker exec "$MINIO_C" rm -f "/tmp/$base"
    ok=$((ok+1))
  done
  docker exec "$SFTP_C" chown -R 1001:1001 "$SFTP_DIR" 2>/dev/null || true

  echo ""
  echo "== Verificacion =="
  echo "-- SFTP $SFTP_DIR --"; docker exec "$SFTP_C" ls -la "$SFTP_DIR"
  echo "-- FTP $FTP_DIR --";   docker exec "$FTP_C"  ls -la "$FTP_DIR"
  echo "-- S3 $MINIO_BUCKET --"; docker exec "$MINIO_C" mc ls "local/$MINIO_BUCKET"
  echo ""
  echo "OK. $ok archivos precargados en las 3 fuentes (SFTP / FTP / S3)."
}

main "$@"
