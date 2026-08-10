# Protocolo: brainstorming

## Cuando aplica
- Crear o modificar una feature (RF nuevo).
- Tocar comportamiento de cara al usuario (UX, flujo, UI, validaciones).
- Cambiar reglas de negocio o invariantes del dominio.
- Reescribir un componente desde cero.

No aplica para: bugfix puntual sin cambio de comportamiento, refactor mecanico, doc edits, version bumps.

## Pasos obligatorios

1. **NO escribir codigo todavia.** Tampoco pseudo-codigo concreto.
2. Lee `specs/<slug>/spec-funcional.md` si existe (puede no existir aun).
3. Plantea al humano 3-7 preguntas Socratic que refinen:
   - Que problema concreto resuelve esta feature para que usuario?
   - Cual es el JTBD (job-to-be-done) principal?
   - Cuales son los criterios de aceptacion observables?
   - Quien NO usa esta feature (out-of-scope)?
   - Que riesgos tiene (UX, datos, perf, seguridad)?
4. Espera respuestas. Iter hasta tener RFs claros (no `<placeholder>`).
5. Propon: lista de RFs + entidad BD + endpoints + roles. Presenta en chunks digeribles.
6. Pide confirmacion humana explicita: "¿Sigo con planning?"

## Output esperado

- `specs/<slug>/spec-funcional.md` con:
  - Objetivo no vacio (no placeholder).
  - RFs con descripcion real.
  - Reglas de negocio listadas.
  - Actores con roles reales.
  - Criterios de aceptacion en Dado/Cuando/Entonces concretos.
  - Fuera de alcance explicito.
- Decisiones registradas en `specs/<slug>/traceability.md > ## Decisiones`.

## Anti-patterns

- Saltar a codigo o pseudo-codigo durante brainstorm.
- Inventar RFs sin preguntar.
- Cerrar el protocolo con placeholders aun visibles (cero `<...>`).
- Auto-aprobar el diseño y pasar al siguiente protocolo (Principio 1: requiere firma humana explicita).

## Verificacion

```bash
npm run project:clarify -- --feature <slug> --strict
# con --strict: EXIT 2 si queda CUALQUIER pregunta pendiente (blocker, major o minor).
#
# OJO — EXIT 0 no significa "spec clara": tambien sale 0 cuando specs/<slug>/ o
# spec-funcional.md NO existen todavia, es decir justo antes de escribir nada.
# Confirma en la salida que efectivamente analizo la spec.
```

Si queda cualquier pregunta pendiente —de la severidad que sea— el protocolo brainstorming NO termino.
