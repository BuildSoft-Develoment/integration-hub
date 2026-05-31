---
name: aif-verification-before-completion
description: "Usa antes de declarar done/approved/listo (cerrar un T-NNN, mover un gate a approved, correr agent:finish o responder 'esta listo'); verifica empiricamente los criterios. Implementa el Principio 1 anti-auto-aprobacion. No la uses en trabajo exploratorio que no declara nada listo."
---

# Skill Verification Before Completion

## Objetivo
Antes de declarar una tarea, feature o gate como "listo / done / aprobado", verificar
empiricamente que los criterios objetivos se cumplen. Cierra el anti-pattern mas comun:
agente que dice "ya esta hecho" sin haber corrido los checks. Implementa Principio 1
(anti-auto-aprobacion) como practica activa.

## Aplicala cuando
- estas por marcar un T-NNN como `done` en `spec-tareas.md`,
- estas por mover un gate a `approved` en `traceability.md`,
- estas por correr `agent:finish` y elegir "PR" o "merge",
- estas por responder "esta listo" a un humano,
- vas a cerrar una sesion declarando trabajo completado.

## No la apliques cuando
- el trabajo es exploratorio (brainstorm o spike) y NO declaras nada como listo,
- ya un humano explicitamente acepto la entrega sabiendo que falta verificar.

## Entradas minimas
- la tarea/feature/gate concreto a verificar,
- los criterios objetivos de "done" (de `spec-tareas.md`, `spec-funcional.md`,
  `tdd-evidence.md`, `traceability.md`),
- los comandos de verificacion declarados.

## Flujo recomendado
1. **Lee los criterios.** Lee la fila T-NNN, los criterios de aceptacion y la columna
   `expected_green`. NO dependas de tu memoria de lo que la tarea pedia.
2. **Corre los comandos exactos.** No "casi correr" ni "deberia pasar". Corre y captura
   stdout/stderr.
3. **Compara empiricamente.** Output real == expected_green? Tests verdes? `check:all`
   EXIT 0? `roadmap:audit` limpio?
4. **Persiste evidencia.** Actualiza `tdd-evidence.md` con logs reales y `Verified: <timestamp>`.
   Actualiza `traceability.md` con paths reales (no `-`).
5. **Llama al reviewer.** Para T tipo=impl, dispatch a `agent:review` con un reviewer
   DIFERENTE. Tu rol como implementer termina aqui — el reviewer decide approved.
6. **Si algo falla, NO declares listo.** Reporta al humano con evidencia exacta del
   fallo (output completo, no resumen).

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| "Las pruebas ya las corri antes, deberian seguir pasando" | Correlas de nuevo. Es 5s. |
| "Es obvio que funciona" | Si es obvio, demuestrlo con un run real. |
| "El test es trivial, no necesito tdd-evidence" | El protocolo TDD no exenta tareas triviales. |
| "Yo mismo me reviso, soy el mejor reviewer" | Anti-self-approval (Principio 1): reviewer != implementer, sin excepciones. |
| "Si lo marco done puedo seguir, lo verifico despues" | NO. El estado `done` significa verificado. Si no esta verificado, es `in_progress` o `blocked`. |

## Red flags
- Marcaste un T como `done` SIN haber corrido el comando_green.
- Actualizaste `traceability.md > Codigo` con un path que no existe en el filesystem.
- `tdd-evidence.md` tiene `Verified: pending` y la fila T esta `done`.
- Ejecutaste `agent:finish --action merge` sin esperar la doble confirmacion del humano.
- Dijiste "listo" en chat sin un EXIT 0 reciente de `check:all`.

## Verification evidence
- Output capturado de `npm run check:all` (EXIT 0 timestamped).
- `tdd-evidence.md` con `Verified:` real (timestamp + commits).
- `traceability.md` con Codigo/Test = paths reales en el repo.
- `ai_task_runs.status = approved` en SQLite (no `done_with_concerns` ni `implementer_done`).
- Cuando declaras listo a un humano, adjunta el ultimo output del check.

## Referencias
- [Principio 1 — Gate humano y anti-auto-aprobacion](../../CONSTITUTION.md)
- [Protocolo TDD](../protocols/tdd.md)
- [Protocolo code-review](../protocols/code-review.md)
- [Protocolo finishing-branch](../protocols/finishing-branch.md)
- [check:tdd-evidence](../../ci/scripts/check-tdd-evidence.mjs)
- [check:task-reviews](../../ci/scripts/check-task-reviews.mjs)
