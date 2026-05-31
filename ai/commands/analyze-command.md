# Command `/analyze`

## Objetivo
Detectar INCOHERENCIAS entre los artefactos canonicos de una feature (spec-funcional /
spec-tecnica / traceability / api-contract / spec-tareas / prototype). Es la version
"analyze" de spec-kit adaptada a este template.

## Fases donde aplica mejor
- `1 - Analisis` (al cerrar)
- `4 - SDD` (al cerrar)
- transicion `4 -> 5` (antes de iniciar construccion)

## Required inputs
- Feature en `specs/<NNN-slug>/` con al menos `spec-funcional.md`.

## Process
1. Correr `npm run project:analyze -- --feature <NNN-slug>` (o `--all`).
2. Por cada hallazgo `[BLOCKER]`: corregir antes de cerrar la fase actual.
3. Por cada `[MAJOR]`: corregir o documentar la decision en `traceability.md > ## Decisiones`.
4. Por cada `[MINOR]`: completar o explicitar.
5. Re-correr hasta cero.

## Que cruza
- RFs de spec-funcional vs filas en traceability.
- RFs referenciados en spec-tareas vs RFs reales en spec-funcional (anti-drift).
- Endpoints declarados en api-contract vs columnas de traceability.
- Entidad/tabla de spec-tecnica vs referencias en spec-funcional/api-contract.
- Gates core (`gate-prototype-ready`, `gate-spdd-approved`) cuando hay prototype.md.
- RFs huerfanos en traceability (declarados pero ausentes en spec-funcional).

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| "La matriz se llena al final" | No: vive en `traceability.md` desde el momento que se declara el RF. |
| "El endpoint todavia no esta" | Si esta en api-contract, debe estar trazado; usa `-` en Codigo/Test hasta que exista. |
| "Esa tabla la sabremos al construir" | Entonces todavia no se cierra `spec-tecnica`. |

## Red flags
- 3+ hallazgos `BLOCKER` -> la feature no esta lista para cerrar fase.
- RFs huerfanos en traceability -> alguien edito traceability sin pasar por spec-funcional.

## Verification evidence
- Reporte `project-analyze` con cero hallazgos blocker.
- Diff de `spec-funcional` / `traceability` corrigiendo las incoherencias.

## Artefactos relacionados
- `./clarify-command.md` (correr ANTES, en fase 1).
- `../skills/spec-writer.skill.md`
- `../../scripts/project-analyze.mjs`
