# Mapa de construccion backend y frontend

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Construccion](../05.00-estructura-construccion-actual.md)
- Siguiente: [Verificacion tecnica y trazabilidad](../verificacion/verificacion-tecnica-y-trazabilidad.md)
<!-- nav-guided:end -->

## Objetivo

Ubicar donde se construyen realmente las capacidades del producto dentro del repositorio.

## Backend

- `platform-app/`
- API, seguridad, scheduler, persistencia y reglas de orquestacion
- pruebas Java y soporte a `Quinoa`

## Frontend

- `frontend/apps/web/`
- `frontend/libs/core/`
- `frontend/libs/features/`
- `frontend/libs/shared/`

## Calidad y operacion

- `qa/` para plan, casos, defectos y evidencias
- `ops/` para runbook, rollback, operacion y metricas
- `ci/` para baseline de pipeline y chequeos documentales
- `releases/` para snapshots y notas de version

## Regla practica

Cuando una feature toca mas de una capa, la carpeta `specs/<feature>/` debe ser la referencia comun para coordinar backend, frontend, QA y operaciones.
