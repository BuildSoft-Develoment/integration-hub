---
name: aif-writing-plans
description: "Usa cuando una feature con spec aprobada va a construccion y necesitas convertirla en tareas pequenas, concretas, ordenadas y verificables. No la uses si aun no hay spec o el trabajo sigue en brainstorming."
---

# Skill Writing Plans

## Objetivo
Convertir una spec aprobada en tareas pequenas, concretas, ordenadas y verificables.

## Aplicala cuando
- existe `spec-funcional.md` y `spec-tecnica.md`,
- una feature va a construccion,
- un proveedor IA necesita saber exactamente que hacer,
- las tareas actuales son demasiado genericas.

## No la apliques cuando
- todavia no hay spec aprobada,
- el trabajo sigue en brainstorming,
- la tarea es solo una correccion documental puntual.

## Entradas minimas
- spec funcional,
- spec tecnica,
- criterios de aceptacion,
- arquitectura o ADR aplicables,
- pruebas esperadas.

## Flujo recomendado
1. Divide el trabajo en slices pequenos.
2. Para cada tarea declara objetivo, entradas y rutas permitidas.
3. Define el ciclo TDD esperado.
4. Agrega comandos de verificacion.
5. Define evidencia de cierre.
6. Marca dependencias, bloqueantes y preguntas abiertas.

## Formato minimo de tarea
```md
## T-001 - Nombre de tarea

Objetivo:

Entradas:

Archivos permitidos:

Ciclo TDD:
1. Red:
2. Green:
3. Refactor:

Comandos de verificacion:

Evidencia esperada:

Trazabilidad:
```

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Implementar backend es una tarea suficiente | Una tarea debe ser verificable y cerrable |
| El agente sabra que archivos tocar | Las rutas permitidas reducen drift y cambios accidentales |
| Primero codigo, luego tareas | El plan guia la ejecucion; no se reconstruye al final |

## Red flags
- Tareas sin criterio de cierre.
- Tareas que mezclan backend, frontend, QA y deploy sin frontera.
- No hay comandos de verificacion.
- No hay trazabilidad a RF/HU/spec.

## Verification evidence
- `spec-tareas.md` actualizado,
- tareas con IDs estables,
- comandos por tarea,
- evidencia esperada por tarea,
- bloqueantes visibles.

## Referencias
- `../references/feature-delivery-workflow.md`
- `../references/documentation-and-traceability.md`
