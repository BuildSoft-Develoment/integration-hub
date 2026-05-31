# Command `/clarify`

## Objetivo
Detectar AMBIGUEDADES en `spec-funcional.md` de una feature ANTES de cerrar fase 1 y
entrar a fase 3 (arquitectura). Emite una lista priorizada de preguntas de desambiguacion;
no toca archivos.

## Fases donde aplica mejor
- `1 - Analisis de requerimientos` (cierre)
- transicion `1 -> 3` (antes de decidir arquitectura)

## Required inputs
- Una feature con `specs/<NNN-slug>/spec-funcional.md` (no necesariamente cerrada).

## Process
1. Correr `npm run project:clarify -- --feature <NNN-slug>` (o `--all`).
2. Por cada pregunta `[BLOCKER]`: rellenar el placeholder o decidir y registrar en
   `traceability.md > ## Decisiones`.
3. Por cada `[MAJOR]`: validar con stakeholder humano si la respuesta no es obvia.
4. Por cada `[MINOR]`: completar o explicitar la decision de dejarlo asi.
5. Re-correr hasta cero preguntas.

## Que detecta (heuristica v12.107)
- Placeholders `<...>` y `${ctx.x}` sin resolver.
- Marcadores `TBD/TODO/FIXME/pendiente`.
- Objetivo vacio.
- RF/RNF sin descripcion (firma del scaffold sin rellenar).
- Reglas de negocio en placeholder.
- Actores `<Rol-A>/<Rol-B>` sin reemplazar.
- Criterios de aceptacion sin escenario real Dado/Cuando/Entonces.
- Fuera de alcance sin declarar.
- spec-tecnica.md sin tabla identificable.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| "Es obvio lo que significa" | Si es obvio, escribelo. Si no, registra una pregunta. |
| "Eso lo resolvemos en arquitectura" | No: si la spec funcional ambigua entra a fase 3, la arquitectura responde a una pregunta equivocada. |
| "El cliente sabra mas adelante" | Entonces el cierre de fase 1 NO es ahora. Documenta el bloqueo. |

## Red flags
- 5+ preguntas blocker -> la feature no esta lista para cerrar fase 1.
- Placeholders en Actores o Criterios -> la spec es scaffold sin contenido.
- TBDs sin owner ni fecha -> registralos en `traceability.md > ## Preguntas abiertas`.

## Verification evidence
- Reporte de `project-clarify` con cero preguntas blocker.
- Decisiones documentadas en `traceability.md > ## Decisiones`.
- Cambios en `spec-funcional.md` reflejando las respuestas.

## Artefactos relacionados
- `../prompts/refinar-requerimientos.md`
- `../prompts/generar-spec-funcional.md`
- `../skills/spec-writer.skill.md`
- `../../scripts/project-clarify.mjs` (ejecutable)
