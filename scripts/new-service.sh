#!/usr/bin/env bash
# Wrapper cross-platform: delega en scripts/new-service.mjs.
# Uso:
#   scripts/new-service.sh --stack node-next --config template.config.example.json --dest ../mi-servicio

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"

node "$root/scripts/new-service.mjs" "$@"
