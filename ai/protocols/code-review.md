# Protocolo: code-review

## Cuando aplica
- Despues de cada T-NNN cuyo estado en `ai_task_runs` es `implementer_done`.
- Antes de marcar el T-NNN como `approved`.
- 2 stages secuenciales: spec-compliance PRIMERO, code-quality DESPUES.

## Pasos obligatorios

### Stage 1 — Spec-compliance

1. Reviewer (subagente diferente al implementer — Principio 1 anti-self-approval).
2. Corre `npm run agent:review -- --task T-NNN --feature <slug> --stage spec-compliance --reviewer <otro>`:
   - Verifica que existe `specs/<slug>/spec-tareas.md` y que contiene la fila `| T-NNN |`
     (falta el archivo o la fila → **blocker**).
   - Verifica que `specs/<slug>/tdd-evidence.md` tiene un bloque para el T (→ **major**).
     Solo comprueba que el bloque exista: no valida que el RED fallara ni que el GREEN pase.
   - Mira `specs/<slug>/traceability.md` y, si encuentra celdas Codigo/Test todavia en `-`,
     emite un finding **minor** (advisory: no lo enforza, y si el archivo no existe no dice nada).
   - **Lo que NO hace, pese a lo que sugiere el nombre del stage**: no compara los archivos
     modificados contra `touch_policy.allowed_paths` (eso es `roadmap:audit`) ni busca el RF
     en los commits. Para enforzar de verdad la trazabilidad, corre `check:trace-coverage`.
3. Registra en `ai_task_reviews` con `stage=spec_compliance`, `result=pass|fail|concerns`.
4. Si `fail` con severity=blocker → **es regla de proceso, no del script**: corre los
   stages por separado y no lances el Stage 2 hasta que el Stage 1 pase. Con `--stage both`
   el bucle no corta, asi que el Stage 2 corre igual aunque el Stage 1 haya fallado.

### Stage 2 — Code-quality

5. Reviewer (puede ser el mismo del Stage 1 o uno tercero).
6. Corre `npm run agent:review -- --task T-NNN --feature <slug> --stage code-quality --reviewer <otro>`:
   - **Este stage es un stub heuristico.** El script no corre ningun linter, ni analisis
     de complejidad, ni deteccion de dead code, ni scanner de secretos. Su unica salida es
     un finding `minor` que se autodeclara heuristico y recomienda integrar linters reales
     del stack en `check:project`.
   - Consecuencia practica: `code-quality` siempre sale `pass`. No lo trates como una
     puerta de calidad — si necesitas linters o deteccion de secretos, agregalos tu al
     stack y al `check:project` del proyecto.
7. Registra en `ai_task_reviews` con `stage=code_quality`, `result=pass|fail|concerns`.
8. Si ambos stages = pass → `ai_task_runs.status = approved`. Si quedan concerns no-blocker → `done_with_concerns` (humano decide).

   **El status del run NO conserva el veredicto del Stage 1.** El script lo reescribe en CADA
   stage, asi que con `--stage both` el Stage 2 —que siempre pasa— sobrescribe un
   `done_with_concerns` o `blocked` que hubiera dejado el Stage 1. Razon de mas para correr
   los stages por separado y leer los findings, no el status.

> Los cuatro flags (`--task`, `--feature`, `--stage`, `--reviewer`) son obligatorios; sin uno de ellos el script imprime el uso y aborta. `--stage both` corre los dos stages seguidos en una sola llamada. El script sale con **exit 3** si `--reviewer` coincide con el implementer del run (Principio 1).

## Output esperado

- `.agent/runs/<run-uuid>/spec-review.md` + `quality-review.md` + `result.json`.
- `ai_task_reviews` + `ai_task_review_findings` actualizados.
- `traceability.md` con evidencia de review (commit con tag review).

## Anti-patterns

- Reviewer = implementer (rompe Principio 1).
- Saltar Stage 1 y solo correr Stage 2.
- Marcar `approved` con findings blocker activos.
- `--auto-approve` o equivalente sin firma humana cuando hay concerns.

## Verificacion

```bash
npm run check:task-reviews          # audita el ledger completo; no acepta --feature
# debe EXIT 0 para cerrar el feature
```
