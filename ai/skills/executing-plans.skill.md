---
name: aif-executing-plans
description: "Ejecutar planes de tareas de forma controlada, task por task, con checkpoints y evidencia. Usala cuando ya existe `spec-tareas.md`."
---

# Skill Executing Plans

## Objetivo
Ejecutar planes de tareas de forma controlada, task por task, con checkpoints y evidencia.

## Aplicala cuando
- ya existe `spec-tareas.md`,
- se va a implementar una feature,
- se quiere coordinar trabajo entre agente principal, subagentes o proveedor IA,
- el riesgo de drift entre tareas es alto.

## No la apliques cuando
- no hay plan de tareas,
- la feature no tiene specs minimas,
- el usuario pidio solo revisar o estimar.

## Entradas minimas
- task packet,
- `spec-tareas.md`,
- rutas permitidas,
- comandos de verificacion,
- gate aplicable.

## Flujo recomendado
1. Selecciona una tarea pendiente.
2. Declara archivos que esperas tocar.
3. Ejecuta solo esa tarea.
4. Corre la verificacion definida.
5. Registra resultado y evidencia.
6. Pide o ejecuta revision antes de pasar al siguiente slice si cambia contrato, seguridad o flujo critico.
7. Actualiza estado de tarea y preguntas abiertas.

## Modo subagent-driven
Si se usan subagentes o proveedores IA paralelos:
- cada subagente debe tener ownership de archivos o modulo,
- no deben editar la misma ruta sin coordinacion,
- el agente principal integra cambios y ejecuta gate,
- ningun subagente puede aprobar su propio gate final.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Hago varias tareas juntas | Las tareas pequenas permiten revisar y revertir |
| Ya compila, sigo | Cada tarea requiere evidencia contra su criterio |
| El subagente lo resolvio | El integrador debe validar, no solo confiar |

## Red flags
- Se ejecutan tareas sin orden.
- Cambios fuera de rutas permitidas.
- No se actualiza el estado de tareas.
- Un subagente modifica trabajo de otro sin aviso.

## Verification evidence
- tarea ejecutada,
- archivos modificados,
- comando de verificacion,
- resultado,
- estado de `spec-tareas.md` actualizado.

## Referencias
- `../references/feature-delivery-workflow.md`
- `../quality-gates/gate-4-6.md`
