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

## Donde vive el despliegue REAL

Esta carpeta es el gate documental. Siguiendo solo sus enlaces nunca se llegaba al despliegue de
verdad; estos son los que faltaban:

- [ADR-024 — despliegue nativo bajo subpath](../fase-3-arquitectura/adr/ADR-024-despliegue-nativo-bajo-subpath.md):
  por que el perfil `appih` es una decision de build-time irreversible.
- [`ops/fase-7-deploy/dist/`](../../ops/fase-7-deploy/dist/README.md): artefactos por destino
  (onprem, aws, azure, gcp, oracle) y el Dockerfile nativo.
- [`dist/NATIVE-STATUS.md`](../../ops/fase-7-deploy/dist/NATIVE-STATUS.md): que capacidades estan
  homologadas en nativo, con su evidencia.
- [`ops/fase-7-deploy/runbook.md`](../../ops/fase-7-deploy/runbook.md): el procedimiento por ambiente.
- [`ops/fase-7-deploy/rollback.md`](../../ops/fase-7-deploy/rollback.md): **esta release no es
  reversible solo con el artefacto**.
- [`.github/workflows/`](../../.github/workflows/): el CI (`ci.yml`) y la matriz multi-motor
  (`ci-compat-db.yml`).

## Adopcion real de la fase

- La evidencia operativa vive en `ci/`, `ops/fase-7-deploy/` y `releases/`.
- Esta carpeta resume el gate documental y los controles minimos antes de promover cambios.
- No reemplaza runbook, rollback, pipeline ni snapshots de release.

## Referencias

- [../../ci/README.md](../../ci/README.md)
- [../../ops/fase-7-deploy/README.md](../../ops/fase-7-deploy/README.md)
- [../../releases/README.md](../../releases/README.md)
