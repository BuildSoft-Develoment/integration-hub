# Verificacion tecnica y trazabilidad

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Mapa de construccion backend y frontend](../modulos/mapa-construccion-backend-frontend.md)
- Siguiente: [Fase 6 - QA](../../fase-6-qa/README.md)
<!-- nav-guided:end -->

## Objetivo

Concentrar la verificacion minima que acompana la construccion antes de pasar a QA formal.

## Verificaciones tecnicas base

- `test-jdk25.cmd`
- `test-quarkus-jdk25.cmd`
- `npm run build` dentro de `frontend/`
- `npm run test -- --watch=false` dentro de `frontend/`

## Trazabilidad esperada

- la implementacion debe apuntar a una feature de `specs/`
- los resultados deben poder reflejarse luego en `qa/`
- si el cambio altera salida a ambientes, debe dejar referencia en `ops/` o `releases/`

## Riesgos a controlar

- drift entre spec y codigo
- cambios de UI sin actualizacion documental
- cambios operativos sin runbook o rollback
- cambios arquitectonicos sin `ADR`
