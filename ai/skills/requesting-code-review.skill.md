---
name: aif-requesting-code-review
description: "Revisar cambios entre tareas o antes de cerrar una feature, priorizando bugs, riesgos y falta de evidencia. Usala cuando termina una tarea de implementacion."
---

# Skill Requesting Code Review

## Objetivo
Revisar cambios entre tareas o antes de cerrar una feature, priorizando bugs, riesgos y falta de evidencia.

## Aplicala cuando
- termina una tarea de implementacion,
- cambia contrato, seguridad, persistencia, permisos o UX critica,
- se prepara una rama para PR,
- otro proveedor IA o subagente entrego cambios.

## No la apliques cuando
- aun no hay cambios,
- solo se esta haciendo brainstorming,
- el usuario pidio expresamente no revisar todavia.

## Entradas minimas
- diff o lista de archivos modificados,
- spec y tarea asociada,
- comandos de verificacion ejecutados,
- riesgos conocidos.

## Flujo recomendado
1. Revisa diff contra spec y tarea.
2. Busca bugs, regresiones, seguridad, contratos y pruebas faltantes.
3. Prioriza hallazgos por severidad.
4. Exige evidencia para cerrar o bloquear.
5. Registra riesgos residuales.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Lo hizo otro agente, debe estar bien | Todo cambio requiere revision proporcional al riesgo |
| La prueba pasa, no hace falta revisar | Las pruebas no cubren todos los riesgos |
| Es solo refactor | Refactor puede romper contratos o trazabilidad |

## Red flags
- Diff sin spec asociada.
- Cambios fuera de rutas permitidas.
- Tests omitidos o no ejecutados.
- Hallazgos mezclados con refactors no pedidos.

## Verification evidence
- archivos revisados,
- hallazgos priorizados,
- pruebas o comandos citados,
- decision: aprobado, aprobado con observaciones o bloqueado.

## Referencias
- `../references/feature-delivery-workflow.md`
- `../quality-gates/gate-4-6.md`
