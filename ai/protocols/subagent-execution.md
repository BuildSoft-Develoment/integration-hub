# Protocolo: subagent-execution

## Cuando aplica
- Ejecutar un T-NNN concreto cuyo plan ya esta cerrado (`spec-tareas.md` strict OK).
- Dispatch desde agente "padre" (el que coordina) a agente "implementer" (el que ejecuta).
- Para paralelizar T-NNN marcados `paralelizable=si` que no comparten archivos.

No aplica para: brainstorming, planning, code-review (esos son protocolos del padre).

## Pasos obligatorios

1. Agente padre corre `npm run agent:start -- --feature <slug> --agent <implementer>` (v12.123+):
   - Reserva lock en `AGENT_BOARD.md`.
   - Crea worktree aislado: `worktrees/<slug>-<task>/`.
   - Verifica baseline: `check:all` debe EXIT 0 en el worktree.
   - Genera `.agent/context-pack/<slug>-<task>.md` con:
     - RF de spec-funcional
     - Fila T-NNN completa
     - touch_policy de la fase
     - Comandos RED/GREEN
   - Registra `ai_task_runs.status = in_progress` en SQLite.
2. Agente implementer trabaja SOLO en el worktree. Lee solo el context pack + canonicos referenciados.
3. Agente implementer corre el ciclo TDD (protocolo `tdd`) hasta GREEN.
4. Agente implementer **NO marca como done**. Marca `implementer_done`. El reviewer es otro.
5. Agente padre detecta `implementer_done` → dispatch al code-review.

## Output esperado

- Cambios committed en el worktree.
- `ai_task_runs` actualizado con `worktree_path`, `started_at`, `finished_at`, `status = implementer_done`.
- `tdd-evidence.md` con bloque para el T-NNN.

## Anti-patterns

- Implementer trabaja fuera del worktree (race condition con otros agentes).
- Implementer toca archivos fuera de `touch_policy.allowed_paths`.
- Implementer marca su propia tarea como `approved` (rompe Principio 1).
- Multiple implementers sobre el mismo T-NNN (rompe lock).
- Skip de baseline `check:all` antes de empezar.

## Verificacion

```bash
git -C worktrees/<slug>-<task> status   # debe haber commits
npm run check:project --prefix worktrees/<slug>-<task>   # debe EXIT 0
sqlite3 ai/memory/framework-agent.db "select status from ai_task_runs where task_id='T-NNN'"
# debe ser 'implementer_done' (no 'approved')
```
