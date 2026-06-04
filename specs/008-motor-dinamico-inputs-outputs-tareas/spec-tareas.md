# Spec de tareas - Motor dinamico de inputs/outputs de tareas

[README principal](../../README.md) | [Specs](../README.md)

## Contexto

- Feature: `008-motor-dinamico-inputs-outputs-tareas`
- ADR: `docs/fase-3-arquitectura/adr/ADR-004-motor-input-output-tareas.md`
- Feature base: `specs/003-diseno-y-ejecucion-procesos`

## Tabla ejecutable de tareas

| id | rf | tipo | entregable | depende_de | estado |
| --- | --- | --- | --- | --- | --- |
| T-001 | RF-001 | diseno | Definir `taskRef`, `dependsOn`, `input`, `inputs`, `outputs` y `executionMode` | ADR-004 | pending |
| T-002 | RF-002/RF-003 | backend | Implementar metadata transversal y resolucion de inputs tipados | T-001 | pending |
| T-003 | RF-004/RF-005 | backend | Implementar ejecucion `once`, `per-record`, `batch` con checkpoint por lote | T-001 | pending |
| T-004 | RF-002/RF-008 | backend | Materializar o paginar outputs masivos sin listas completas en memoria | T-002 | pending |
| T-005 | RF-006/RF-007 | frontend | Permitir seleccionar output anterior, modo de ejecucion y mappings comunes | T-001 | pending |
| T-006 | RF-006 | backend/frontend | Validar grafo, fan-out, fan-in, ciclos y tareas futuras | T-001 | pending |
| T-007 | RF-008 | qa | Pruebas de volumen, retry, idempotencia y reproceso por lote | T-003/T-004 | pending |

## Checklist de cierre

- [ ] ADR aprobado por Arquitectura/Tech Lead.
- [ ] Contrato revisado por backend y frontend.
- [ ] Validaciones de grafo definidas antes de implementar UI final.
- [ ] Estrategia de alto volumen aprobada.
- [ ] QA define escenarios de mas de `1,000,000` registros.

