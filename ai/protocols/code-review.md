# Protocolo: code-review

## Cuando aplica
- Despues de cada T-NNN cuyo estado en `ai_task_runs` es `implementer_done`.
- Antes de marcar el T-NNN como `approved`.
- 2 stages secuenciales: spec-compliance PRIMERO, code-quality DESPUES.

## Pasos obligatorios

### Stage 1 — Spec-compliance

1. Reviewer (subagente diferente al implementer — Principio 1 anti-self-approval).
2. Corre `npm run agent:review-spec -- --task T-NNN --feature <slug>`:
   - Verifica que los archivos modificados ∈ `touch_policy.allowed_paths`.
   - Verifica que el RF declarado en T-NNN aparece en commits.
   - Verifica que existen tdd-evidence RED+GREEN para el T.
   - Verifica que `traceability.md` se actualizo con Codigo/Test reales.
3. Registra en `ai_task_reviews` con `stage=spec_compliance`, `result=pass|fail|concerns`.
4. Si `fail` con severity=blocker → bloquea avance al Stage 2; el implementer corrige y re-itera.

### Stage 2 — Code-quality

5. Reviewer (puede ser el mismo del Stage 1 o uno tercero).
6. Corre `npm run agent:review-quality -- --task T-NNN --feature <slug>`:
   - Linters / formatters declarados en el stack.
   - Complejidad ciclomatica (umbral por stack).
   - Dead code / unused imports.
   - Secrets / credentials hardcoded.
   - TODO/FIXME nuevos (ben pero registrados).
7. Registra en `ai_task_reviews` con `stage=code_quality`, `result=pass|fail|concerns`.
8. Si ambos stages = pass → `ai_task_runs.status = approved`. Si quedan concerns no-blocker → `done_with_concerns` (humano decide).

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
npm run check:task-reviews -- --feature <slug>
# debe EXIT 0 para cerrar el feature
```
