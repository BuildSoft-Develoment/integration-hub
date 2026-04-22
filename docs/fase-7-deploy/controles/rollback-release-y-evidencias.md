# Rollback, release y evidencias

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Pipeline y runbook](pipeline-y-runbook.md)
- Siguiente: [Fase 8 - Operacion](../../fase-8-operacion/README.md)
<!-- nav-guided:end -->

## Objetivo

Explicar como se cierra la salida a ambientes cuando hay que dejar capacidad de recuperacion y snapshot del release.

## Fuentes oficiales

- `ops/fase-7-deploy/rollback.md`
- `releases/`
- notas por feature en `ops/fase-7-deploy/features/`

## Criterios minimos

- rollback entendido y practicable
- impacto por feature reconocido
- release documentado o snapshot disponible
- evidencia suficiente para soporte posterior

## Regla de cierre

Si un cambio puede salir a produccion pero no puede revertirse o explicarse despues, la fase 7 no esta suficientemente consolidada.
