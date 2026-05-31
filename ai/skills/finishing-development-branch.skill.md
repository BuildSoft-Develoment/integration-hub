---
name: aif-finishing-development-branch
description: "Usa cuando una feature termino implementacion y QA y se prepara PR/merge: valida, junta evidencia, hace PR/merge y limpia el worktree. No la uses si quedan tareas bloqueantes, QA pendiente o sin autorizacion de merge."
---

# Skill Finishing Development Branch

## Objetivo
Cerrar una rama de desarrollo con validacion, evidencia, PR/merge y limpieza de worktree.

## Aplicala cuando
- una feature termino implementacion y QA,
- se prepara PR o merge,
- se debe limpiar un worktree creado para proveedor IA,
- se necesita entregar evidencia final.

## No la apliques cuando
- quedan tareas bloqueantes,
- QA esta pendiente,
- no hay autorizacion para merge o PR,
- la rama contiene cambios de otra feature.

## Entradas minimas
- rama de trabajo,
- worktree,
- spec y task packet,
- resultados de pruebas,
- evidencia QA,
- criterio de release.

## Flujo recomendado
1. Verifica que no quedan tareas abiertas sin decision.
2. Ejecuta checks finales.
3. Actualiza evidencia y trazabilidad.
4. Prepara resumen de PR o merge.
5. Pide aprobacion humana si el merge o PR afecta rama remota.
6. Limpia worktree solo cuando el cambio fue integrado o descartado explicitamente.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Ya termino, cierro sin QA | La rama no se cierra sin evidencia |
| Mergeo rapido y luego arreglo | El cierre exige checks y rollback posible |
| Borro el worktree para limpiar | No se borra evidencia sin confirmar integracion |

## Red flags
- Tests finales no ejecutados.
- PR sin resumen de cambios y riesgos.
- Worktree eliminado antes de integrar.
- Rama con cambios no relacionados.

## Verification evidence
- checks finales,
- resumen de PR/merge,
- evidencia QA/release,
- estado de worktree,
- riesgos residuales o aprobaciones pendientes.

## Referencias
- `../../docs/transversal/90.19-versionado-commits.md`
- `../references/feature-delivery-workflow.md`
