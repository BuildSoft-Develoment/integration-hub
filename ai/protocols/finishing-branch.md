# Protocolo: finishing-branch

## Cuando aplica
- Todos los T-NNN de la feature estan en `ai_task_runs.status = approved`.
- Para cerrar el ciclo del feature antes de PR o merge.

## Pasos obligatorios

0. **Antes de correrlo**, actualiza A MANO `traceability.md` (paths reales, no `-`) y
   `tdd-evidence.md` (timestamps de verificacion). `agent:finish` no genera ni actualiza
   ningun artefacto de documentacion: su propio docblock lo declara y el script importa
   `writeFileSync` sin llamarlo nunca.
1. Corre `npm run agent:finish -- --feature <slug>`. Los 4 checks y la auditoria corren
   sobre la **raiz resuelta** (`--root` o el cwd del proceso), nunca sobre el worktree:
   - `npm run check:project` → debe EXIT 0.
   - `npm run check:tasks-executable` → debe EXIT 0.
   - `npm run check:tdd-evidence` → debe EXIT 0.
   - `npm run check:task-reviews` → debe EXIT 0.
   - `npm run roadmap:audit` → si encuentra auto-aprobaciones **solo avisa**: no aborta,
     el script sigue hacia las opciones humanas. Leelo tu.
2. `agent:finish` pregunta al humano (Principio 1):
   ```
   Feature <slug> verificada. Opciones:
     [1] Crear PR (gh pr create)
     [2] Merge local (git merge --no-ff)
     [3] Mantener worktree para mas trabajo
     [4] Descartar worktree (confirmacion doble)
   ```
3. Segun opcion del humano. **`agent:finish` no toca los locks en NINGUNA de las 4
   opciones**: no importa `agent-locks.mjs` ni invoca `roadmap:release`. Libera tu el
   lock al final, siempre:
   - **PR**: crea un PR por cada rama de trabajo `agent/<slug>/<t-nnn>` de la feature
     (`gh pr create --fill --head <rama>`). Si no hay ninguna, avisa y no crea nada.
   - **Merge**: mergea esas mismas ramas **en la rama actual de la raiz**, que es el destino.
     Antes pide escribir literalmente `yes-merge` (cualquier otra respuesta cancela con
     exit 0) mostrando cuantas ramas y hacia donde. Aborta con **exit 5** en tres casos: no
     hay ramas, estas parado en una de ellas, o la raiz esta en HEAD despegado (ahi el merge
     crearia un commit huerfano que se pierde). Si un merge falla, corta ahi: las ramas
     restantes no se mergean.
     Una rama **no cuenta como integrada** si no aporta contenido, y se reporta «sin efecto»
     en dos casos: ya estaba contenida en el destino (`Already up to date.`), o creo commit
     de merge pero **no cambio el arbol** (commits vacios, o trabajo que ya llego por squash
     o cherry-pick). Si todas las ramas quedan «sin efecto», el script pide firma humana
     explicita (`yes-ya-integrada`) antes de dar la feature por cerrada.
   - **Keep**: deja el worktree tal cual para seguir trabajando.
   - **Discard**: pide escribir literalmente `yes-discard`. Ahi acaba: **no borra el
     worktree** (solo imprime que no esta automatizado).

## Output esperado

- Si PR: un Pull Request por rama de trabajo; el feature todavia NO esta integrado (el merge lo decide el revisor).
- Si Merge: las ramas `agent/<slug>/<t-nnn>` quedan mergeadas en la rama actual de la raiz,
  con commit de merge real (`--no-ff --no-edit`).
- Si Keep: estado intacto para continuar.
- Si Discard: nada se borro — el worktree sigue en disco y hay que limpiarlo a mano.
- `ai_task_runs.finished_at` se actualiza **solo si la integracion se completo de verdad**:
  todas las ramas movieron el HEAD del destino, o todos los PR se crearon. Una rama «sin
  efecto» cuenta como no integrada, asi que no se estampa nada. Si algo fallo, el script
  avisa. Con keep o discard tampoco se toca.
- El lock NUNCA queda liberado. Hazlo tu: `npm run roadmap:release -- --feature <slug> --agent <yo>`.
- **Exit codes** (el unico contrato legible por maquina): `1` accion invalida · `2` falta la
  BD · `3` algun T no esta `approved` · `4` checks en rojo · `5` destino invalido para merge ·
  `6` la integracion pedida no se completo · `7` algun check no llego a correr (fallo de
  entorno, no del proyecto: no sabemos si esta verde). `0` solo cuando salio todo bien.
- `memory:sync` NO lo corre `agent:finish`. Ejecutalo despues.

## Anti-patterns

- `agent:finish` que ejecuta merge sin confirmacion humana (rompe Principio 1).
- Saltar verificaciones porque "ya corrieron antes".
- Descartar worktree sin doble confirmacion.
- Dar por cerrada la feature sin liberar el lock ni remover el worktree: `agent:finish`
  no hace ninguna de las dos cosas, hay que hacerlas a mano.
- Confiar en que `agent:finish` dejo `traceability.md` y `tdd-evidence.md` al dia: no
  escribe archivos.
- Correr `agent:finish --action merge` estando parado en una rama de trabajo de la feature:
  aborta con exit 5. Haz checkout del destino primero.

## Verificacion

```bash
npm run check:all
# debe EXIT 0 en el repo principal post-finish

git worktree list
# agent:finish NUNCA remueve worktrees: ninguna de las 4 opciones ejecuta
# 'git worktree remove'. Tras integrar, quitalos tu, uno por T-NNN ejecutado:
#   git worktree remove worktrees/<slug>-<t-nnn>

node --no-warnings -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('ai/memory/framework-agent.db');console.table(db.prepare('select task_id,status from ai_task_runs where feature=?').all('<slug>'))"
# el ultimo run de cada T no-pending debe estar exactamente en 'approved': con cualquier
# otro status (done_with_concerns, quality_review_passed, blocked...) o sin run,
# agent:finish aborta en el paso 1 con exit 3 (solo --dry-run salta esa comprobacion).
# (se usa node:sqlite, built-in desde Node 22: el binario 'sqlite3' no es dependencia del proyecto)
```
