#!/usr/bin/env bash
# Bootstrap local development environment for project-template.
# Safe to run multiple times (idempotent-ish).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"

banner() {
  printf "\n\033[1;36m==> %s\033[0m\n" "$*"
}

banner "Verificando herramientas"
for tool in docker node npm java mvn; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf "  ok   %s (%s)\n" "$tool" "$(command -v "$tool")"
  else
    printf "  warn %s no encontrado (se requiere para algunos flujos)\n" "$tool"
  fi
done

banner "Instalando hooks pre-commit"
if command -v pre-commit >/dev/null 2>&1; then
  (cd "$root" && pre-commit install --install-hooks)
else
  echo "  warn pre-commit no esta instalado; instalar con 'pip install pre-commit' y reintentar."
fi

banner "Validando documentacion"
node "$root/ci/scripts/check-docs.mjs" "$root"

banner "Validando instanciacion del template"
node "$root/ci/scripts/check-template-instantiation.mjs" --mode template --root "$root"

banner "Levantando servicios de infraestructura local"
if command -v docker >/dev/null 2>&1; then
  docker compose -f "$root/ops/docker/docker-compose.yml" up -d
else
  echo "  warn Docker no esta disponible; omitiendo docker-compose."
fi

banner "Listo"
cat <<MSG
Siguientes pasos sugeridos:
  node scripts/init-project.mjs --config template.config.example.json --dry-run
  make help
  make check-docs
MSG
