# Protocolo: subagent-execution

## Cuando aplica
- Ejecutar un T-NNN concreto cuyo plan ya esta cerrado (`spec-tareas.md` strict OK).
- Dispatch desde agente "padre" (el que coordina) a agente "implementer" (el que ejecuta).
- Para paralelizar T-NNN marcados `paralelizable=si` que no comparten archivos.

No aplica para: brainstorming, planning, code-review (esos son protocolos del padre).

## Pasos obligatorios

0. (Solo si hay varios agentes en paralelo) el padre toma el lock de feature con
   `npm run roadmap:claim -- --feature <slug> --agent <implementer>`. `agent:start` NO lo hace.
1. Agente padre corre `npm run agent:start -- --feature <slug> --task T-NNN --agent <implementer>` (v12.123+; los tres flags son obligatorios).
   Primero valida **precondiciones** y, si alguna falla, aborta con exit 2 **sin crear nada**
   (ni worktree, ni rama, ni entry, ni pack): que exista `ai/memory/framework-agent.db`, que el
   run activo mas reciente de ese T-NNN no sea de otro agente, y que exista la fila del T en
   `spec-tareas.md`. Superadas esas, hace en este orden:
   - Crea worktree aislado: `worktrees/<slug>-<t-nnn>/` con rama `agent/<slug>/<t-nnn>`.
     `--task` se pasa en MAYUSCULAS (`T-001`: el match contra la tabla de
     `spec-tareas.md` es case-sensitive), pero worktree, rama y context pack usan
     `<t-nnn>` = ese mismo T en minusculas (`t-001`).
   - Registra `ai_task_runs.status = in_progress` en SQLite (o reusa el run si ya era tuyo).
   - Genera `.agent/context-pack/<slug>-<t-nnn>.md` con:
     - Protocolo aplicable + sus pasos OBLIGATORIOS
     - Fila T-NNN completa de `spec-tareas.md` (los comandos RED/GREEN llegan en sus
       columnas `comando_red` / `comando_green`)
     - RFs y reglas de `spec-funcional.md`
     - Bloque de `tdd-evidence.md` del T
     - Lectura obligatoria (CONSTITUTION / AGENTS / AGENT_RUNTIME + el protocolo)
     - **NO incluye el touch_policy de la fase.** El pack te ordena respetarlo pero no
       lo entrega: resuelvelo con `npm run roadmap:next`.
   - Corre `check:all` como baseline **informativo**, al final y sobre la raiz del repo
     (no el worktree). Si falla solo avisa y el script igual termina en exit 0.
     Se omite con `--skip-baseline`.
2. Agente implementer trabaja SOLO en el worktree. Lee solo el context pack + canonicos referenciados.
3. Agente implementer corre el ciclo TDD (protocolo `tdd`) hasta GREEN.
4. Agente implementer **NO marca como done**. Marca `implementer_done` — pero **ningun
   script del framework escribe ese status**: `agent:start` solo hace INSERT con
   `in_progress`, y `agent:review` salta directo a `spec_review_passed` /
   `quality_review_passed` / `done_with_concerns` / `blocked` / `approved`. Hazlo a mano,
   desde la raiz del repo (la BD vive en `ai/memory/`, fuera del worktree):
   ```bash
   node --no-warnings -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('ai/memory/framework-agent.db');const r=db.prepare('update ai_task_runs set status=? where feature=? and task_id=? and status=?').run('implementer_done','<slug>','T-NNN','in_progress');console.log('filas:',r.changes)"
   ```
5. Agente padre detecta `implementer_done` → dispatch al code-review.

## Output esperado

- Cambios committed en el worktree.
- `ai_task_runs` con `worktree_path` y `started_at`. `finished_at` NO lo pone este
  protocolo: lo escribe `agent:finish`, y solo con PR o merge.
- `status = implementer_done`, puesto a mano (ver paso 4).
- `tdd-evidence.md` con bloque para el T-NNN.

## Anti-patterns

- Implementer trabaja fuera del worktree (race condition con otros agentes).
- Implementer toca archivos fuera de `touch_policy.allowed_paths`.
- Implementer marca su propia tarea como `approved` (rompe Principio 1).
- Multiple implementers sobre el mismo T-NNN (lo aborta `agent:start` con exit 2).
- Arrancar sobre un arbol roto: el baseline de `agent:start` solo AVISA, no bloquea.
  Si `check:all` sale en rojo, arreglalo antes de tocar codigo en vez de seguir.

## Verificacion

```bash
git -C worktrees/<slug>-<t-nnn> status   # debe haber commits
npm run check:project --prefix worktrees/<slug>-<t-nnn>   # debe EXIT 0

node --no-warnings -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('ai/memory/framework-agent.db');console.table(db.prepare('select task_id,status from ai_task_runs where feature=? and task_id=?').all('<slug>','T-NNN'))"
# debe ser 'implementer_done' (no 'approved')
# node:sqlite es built-in desde Node 22; el binario 'sqlite3' no es dependencia del proyecto
```
