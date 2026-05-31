# Protocolo: finishing-branch

## Cuando aplica
- Todos los T-NNN de la feature estan en `ai_task_runs.status = approved`.
- Para cerrar el ciclo del feature antes de PR o merge.

## Pasos obligatorios

1. Corre `npm run agent:finish -- --feature <slug>`:
   - Verifica que tests del worktree pasen.
   - Corre `npm run check:project` en el worktree → debe EXIT 0.
   - Corre `npm run check:tasks-executable` → debe EXIT 0.
   - Corre `npm run check:tdd-evidence` → debe EXIT 0.
   - Corre `npm run check:task-reviews` → debe EXIT 0.
   - Corre `npm run roadmap:audit` → no debe haber auto-aprobaciones.
   - Actualiza `traceability.md` con paths finales (no `-`).
   - Actualiza `tdd-evidence.md` con timestamps de verificacion.
2. `agent:finish` pregunta al humano (Principio 1):
   ```
   Feature <slug> verificada. Opciones:
     [1] Crear PR (gh pr create)
     [2] Merge local (git merge --no-ff)
     [3] Mantener worktree para mas trabajo
     [4] Descartar worktree (confirmacion doble)
   ```
3. Segun opcion del humano:
   - **PR**: crea PR via `gh`, NO mergea solo, libera lock.
   - **Merge**: requiere doble confirmacion ("¿estas seguro? esto modifica main") + mergea + libera lock.
   - **Keep**: deja el worktree y el lock activos.
   - **Discard**: requiere doble confirmacion ("¿estas seguro? perderas todo el trabajo") + cierra worktree + libera lock.

## Output esperado

- Si PR/Merge: el lock liberado y el feature integrado.
- Si Keep: estado intacto para continuar.
- Si Discard: worktree + lock limpios; trabajo perdido por decision humana.
- En todos los casos: `ai_task_runs` con `finished_at` actualizado y `memory:sync` ejecutado.

## Anti-patterns

- `agent:finish` que ejecuta merge sin confirmacion humana (rompe Principio 1).
- Saltar verificaciones porque "ya corrieron antes".
- Descartar worktree sin doble confirmacion.
- Marcar feature como cerrada sin liberar el lock.

## Verificacion

```bash
npm run check:all
# debe EXIT 0 en el repo principal post-finish
git worktree list
# el worktree del feature debe estar removido (si PR o Merge o Discard)
sqlite3 ai/memory/framework-agent.db "select status from ai_task_runs where feature='<slug>'"
# todos los T deben estar 'approved' o 'done_with_concerns'
```
