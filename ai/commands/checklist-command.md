# Command `/checklist`

## Objetivo
Generar o evaluar una CHECKLIST de calidad por feature: items automatizables (validados
por scripts) + items humanos (que solo un revisor puede confirmar). Es la version
"checklist" de spec-kit adaptada a este template.

## Fases donde aplica mejor
- Cierre de cualquier fase con artefactos por feature (1, 2, 4, 6).
- Antes de cerrar `gate-spdd-approved` y antes de cerrar la feature en QA.

## Required inputs
- Feature en `specs/<NNN-slug>/`.

## Process
1. Correr `npm run project:checklist -- --feature <NNN-slug>` (advisory).
2. Si todos los items auto estan en verde, opcionalmente `--write` para dejar
   `specs/<slug>/checklist.md` con la evaluacion congelada y los items humanos
   pendientes para el revisor.
3. El revisor humano marca los items humanos, llena Revisor/Fecha/Resultado al final.
4. Cuando todos los items quedan en verde, la checklist es evidencia de calidad
   (referenciar en `traceability.md > ## Evidencia`).

## Items automatizables (auto)
- spec-funcional con Objetivo no vacio.
- RF con descripcion real.
- spec-tecnica con Tabla identificable.
- traceability con matriz de 10 columnas.
- api-contract con al menos un endpoint.
- spec-tareas con tareas T-NNN.
- prototype-html5/index.html presente.
- prototype-validation declara Revisor humano.
- Sin placeholders `<...>` obvios.

## Items humanos
- Reglas validadas con stakeholder real.
- Roles/permisos reales (no scaffold).
- Criterios de aceptacion cubren caso feliz/error/permisos.
- Prototipo revisado visualmente.
- Fuera de alcance explicito.
- Estimado de volumen/latencia con datos reales.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| "Lo valido yo mismo" | Anti-auto-aprobacion: revisor != autor (Principio 1 de CONSTITUTION.md). |
| "Esta implicito en la spec" | Si esta implicito, ponlo explicito. |

## Verification evidence
- `checklist.md` con todos los items en `[x]` y Revisor/Fecha llenados.
- Referencia en `traceability.md`.

## Artefactos relacionados
- `./clarify-command.md`
- `./analyze-command.md`
- `../../CONSTITUTION.md`
- `../../scripts/project-checklist.mjs`
