# AGENT_RUNTIME.md — disciplina de ejecucion del agente

> **Que es esto.** El framework AI-first empresarial tiene 3 capas ortogonales:
> 1. **Capa 2 — Governance del proyecto** (`AGENTS.md`, `CONSTITUTION.md`, `ROADMAP_STATE.json`, memoria SQLite, gates, 9 fases, 48 validadores encadenados por `check:all`). Responde **QUE es el proyecto y donde esta**.
> 2. **Capa 3 — Lifecycle compat** (`specs/<slug>/.specify/`). Responde **como se mapea a Spec Kit**.
> 3. **Capa 1 — Execution discipline** (este archivo + `ai/protocols/`). Responde **COMO debe comportarse el agente mientras trabaja**.
>
> AGENTS.md te dice **que** tocar (touch_policy) y **cuando** (fase activa). AGENT_RUNTIME.md te dice **como** ejecutar con disciplina dentro de esa fase.

## Regla 0 — Selecciona el protocolo antes de actuar

Antes de cualquier accion sobre el repo, ejecuta:

```bash
npm run agent:protocol -- --task "<descripcion breve de la tarea>"
```

Te devolvera el protocolo aplicable (`brainstorming` / `planning` / `tdd` / `subagent-execution` / `code-review` / `finishing-branch`) y los pasos OBLIGATORIOS antes de tocar codigo.

> **Si la tarea modifica comportamiento o crea UI, el protocolo aplicable es brainstorming + planning ANTES de tocar codigo.** Si el protocolo dice `required_before_action: true`, NO puedes saltartelo.

## Los 6 protocolos

Cada uno vive en `ai/protocols/<nombre>.md`. Su estructura es identica y validable (`check:protocols`):

| Protocolo | Cuando aplica |
|---|---|
| [brainstorming](ai/protocols/brainstorming.md) | crear/modificar feature, RF, UX, comportamiento — refinar diseño en Socratic antes de codigo |
| [planning](ai/protocols/planning.md) | toda tarea no-trivial — escribir `spec-tareas.md` ejecutable antes de tocar codigo |
| [tdd](ai/protocols/tdd.md) | fase 5 (construccion) — test fallido ANTES del codigo de produccion (RED → GREEN → REFACTOR) |
| [subagent-execution](ai/protocols/subagent-execution.md) | dispatch de tareas T-NNN a subagentes en worktrees aislados |
| [code-review](ai/protocols/code-review.md) | tras cada T-NNN — 2 stages secuenciales (spec-compliance, luego code-quality) con reviewer != implementer; el Stage 2 puede reusar el reviewer del Stage 1 |
| [finishing-branch](ai/protocols/finishing-branch.md) | cierre de feature — verify + reviews + opciones humanas (PR/merge/keep/discard) |

## Skills activables (complementan los protocolos)

Las skills viven en `ai/skills/<nombre>.skill.md`. **Los protocolos son OBLIGATORIOS por tipo de tarea; las skills son ACTIVABLES segun contexto.** No confundir.

Cuando una skill aplica al >50% (heuristica del agente al leer la descripcion), debe invocarla. Las skills clave de la capa 1 son:

- `brainstorming.skill.md` — refinar diseño en Socratic (consumida por el protocolo `brainstorming`)
- `writing-plans.skill.md` — escribir planes ejecutables (consumida por el protocolo `planning`)
- `test-driven-development.skill.md` — disciplina TDD (consumida por el protocolo `tdd`)
- `verification-before-completion.skill.md` — anti-auto-aprobacion empirica
- `debugging-workflow.skill.md` — reproducir el sintoma y reducir el espacio de causa
- `using-git-worktrees.skill.md` — aislamiento por tarea
- `finishing-development-branch.skill.md` — cierre estructurado

## Flujo canonico del agente (resumen visual)

```text
1. Recibe tarea
   ↓
2. npm run agent:protocol -- --task "..."
   ↓
3. Aplica protocolo(s) aplicable(s)
   ↓
4. (opcional, multiagente) npm run roadmap:claim -- --feature X --agent <yo>
   (toma el lock de feature en ai/locks/<feature>.lock.json, TTL 240 min)
   ↓
5. npm run agent:start -- --feature X --task T-NNN --agent <yo>
   (worktree + entry en ai_task_runs + context pack + baseline informativo)
   ↓
6. Ejecuta T-NNN segun protocolo
   ↓
7. (entre tareas) protocolo code-review (2 stages, reviewer != implementer)
   ↓
8. npm run agent:finish -- --feature X
   (verify + reviews + opciones humanas; no escribe archivos)
   ↓
9. (si tomaste lock en el paso 4) npm run roadmap:release -- --feature X --agent <yo>
   (agent:finish NO libera locks en ninguna opcion)
```

> **agent:start NO toma el lock de feature.** Crea el worktree, registra el run en
> `ai_task_runs` y emite el context pack; el `check:all` final es un baseline
> informativo sobre la raiz del repo (si falla solo avisa, y se omite con
> `--skip-baseline`). El lock lo toma `roadmap:claim`, y `AGENT_BOARD.md` es un
> tablero de solo lectura que regenera `roadmap:sync` a partir de esos archivos
> de lock (gitignored: se crean en runtime, no se versionan).
>
> **`agent:finish` no escribe archivos.** Su cabecera lo declara explicitamente: importa
> `writeFileSync` y nunca lo llama. Verifica que todos los T-NNN no-pending esten
> `approved` (si no, exit 3), corre los 4 checks y `roadmap:audit` —cuyos findings solo
> avisan— y pregunta al humano entre PR / merge / keep / descartar. Mantener
> `traceability.md` al dia sigue siendo trabajo del implementer en fase 5.

## Anti-patterns que esta capa bloquea

- **Saltar a codigo sin diseño** → bloqueado por protocolo `brainstorming` para tareas que modifican comportamiento.
- **Codigo sin test fallido primero** → bloqueado por protocolo `tdd` + `check:tdd-evidence`.
- **Self-approval** → bloqueado por `check:task-reviews` (reviewer != implementer).
- **Plan con placeholders/paths inventados** → bloqueado por `check:tasks-executable`.
- **Cerrar tarea sin verificar empiricamente** → skill `verification-before-completion`.
- **Race sobre el mismo T-NNN** → `agent:start` aborta con exit 2 si ya hay un run activo (`in_progress` / `implementer_done`) de OTRO agente para ese feature+task. NO cubre worktrees huerfanos (si el directorio existe lo reusa sin validar) ni races a nivel de feature: eso lo da `roadmap:claim` con su lock por TTL.

## Como interactua con la Capa 2 (governance)

| Capa 2 declara | Capa 1 ejecuta |
|---|---|
| Fase activa + touch_policy | `roadmap:next` lo resuelve e interpola al slug. **No** viaja en el context pack de `agent:start` |
| Gate aplicable (gate-spdd-approved, etc.) | **Capa 1 no lo verifica.** `agent:finish` no lee gates ni firmas; solo corre `roadmap:audit`, que detecta `gate_self_approved` pero cuyo fallo **no aborta** (avisa y sigue). Lo bloqueante vive en `check:project` |
| `spec-funcional.md` + `spec-tecnica.md` | Protocolo `planning` los consume para generar `spec-tareas.md` ejecutable |
| `traceability.md` | Lo actualiza el implementer durante la fase 5. **`agent:finish` NO lo escribe** (ver nota abajo) |
| `check:project` (39 validadores encadenados) | `agent:finish` lo corre antes de opciones humanas |

> **Tools write del MCP y gates humanos (Principio 1).** Las 3 tools de escritura del MCP
> (`aif_agent_start`, `aif_agent_review`, `aif_agent_finish`) exigen `confirm:true` y **ninguna
> aprueba un gate humano**: `aif_agent_review` registra la revision pero no firma el gate,
> y `aif_agent_finish` nunca mergea — devuelve el plan de cierre para que el humano decida.
> La firma de un gate (gate-spdd-approved, etc.) es siempre acto humano fuera del MCP.

## Como interactua con la Capa 3 (lifecycle compat)

Los archivos bajo `.specify/` (spec, plan, tasks) son **vistas alias** hacia los canonicos. Capa 1 NO las consume; consume los canonicos directamente. Si un agente externo viene con expectativas spec-kit, recibe los alias; si viene con expectativas SPDD, recibe los canonicos. La Capa 1 trabaja siempre contra la fuente de verdad.

## Cumplimiento

- `npm run check:protocols` (en `check:template`) — cada protocolo declara su estructura canonica.
- `npm run check:tasks-executable` (en `check:project`, v12.119+) — los planes son strictly executable.
- `npm run check:tdd-evidence` (en `check:project`, v12.120+) — TDD auditable.
- `npm run check:task-reviews` (en `check:project`, v12.122+) — anti-self-approval en task reviews.
- `npm run check:all` — todas las capas verdes simultaneamente.
