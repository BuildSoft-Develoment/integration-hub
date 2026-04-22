# Fase 7 - Deploy

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Criterios de salida y defectos](../fase-6-qa/salida/criterios-salida-y-defectos.md)
- Siguiente: [Checklist de salida a produccion](07.00-checklist-salida-produccion.md)
<!-- nav-guided:end -->

## Objetivo

Preparar salida a ambientes, controles de pipeline, rollback y evidencia de release.

## Contenido

- [07.00-checklist-salida-produccion](07.00-checklist-salida-produccion.md)
- [controles/pipeline-y-runbook](controles/pipeline-y-runbook.md)
- [controles/rollback-release-y-evidencias](controles/rollback-release-y-evidencias.md)

## Adopcion real de la fase

- La evidencia operativa vive en `ci/`, `ops/fase-7-deploy/` y `releases/`.
- Esta carpeta resume el gate documental y los controles minimos antes de promover cambios.
- No reemplaza runbook, rollback, pipeline ni snapshots de release.

## Referencias

- [../../ci/README.md](../../ci/README.md)
- [../../ops/fase-7-deploy/README.md](../../ops/fase-7-deploy/README.md)
- [../../releases/README.md](../../releases/README.md)
