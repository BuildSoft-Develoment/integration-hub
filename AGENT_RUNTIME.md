# AGENT_RUNTIME.md — disciplina de ejecucion del agente

> **Que es esto.** El framework AI-first empresarial tiene 3 capas ortogonales:
> 1. **Capa 2 — Governance del proyecto** (`AGENTS.md`, `CONSTITUTION.md`, `ROADMAP_STATE.json`, memoria SQLite, gates, 9 fases, 41 validadores). Responde **QUE es el proyecto y donde esta**.
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
| [code-review](ai/protocols/code-review.md) | tras cada T-NNN — 2 stages (spec-compliance + code-quality) por subagentes diferentes |
| [finishing-branch](ai/protocols/finishing-branch.md) | cierre de feature — verify + reviews + traceability update + opciones humanas (PR/merge/keep/discard) |

## Skills activables (complementan los protocolos)

Las skills viven en `ai/skills/<nombre>.skill.md`. **Los protocolos son OBLIGATORIOS por tipo de tarea; las skills son ACTIVABLES segun contexto.** No confundir.

Cuando una skill aplica al >50% (heuristica del agente al leer la descripcion), debe invocarla. Las skills clave de la capa 1 son:

- `writing-plans.skill.md` — escribir planes ejecutables (consumida por el protocolo `planning`)
- `test-driven-development.skill.md` — disciplina TDD (consumida por el protocolo `tdd`)
- `verification-before-completion.skill.md` — anti-auto-aprobacion empirica
- `systematic-debugging.skill.md` — 4 fases root cause
- `using-git-worktrees.skill.md` — aislamiento por tarea
- `finishing-a-development-branch.skill.md` — cierre estructurado

## Flujo canonico del agente (resumen visual)

```text
1. Recibe tarea / lock
   ↓
2. npm run agent:protocol -- --task "..."
   ↓
3. Aplica protocolo(s) aplicable(s)
   ↓
4. npm run agent:start --feature X --agent <yo>
   (crea worktree + claim + baseline + context pack)
   ↓
5. Ejecuta T-NNN segun protocolo
   ↓
6. (entre tareas) protocolo code-review (2 stages, subagentes diferentes)
   ↓
7. npm run agent:finish --feature X
   (verify + reviews + traceability update + opciones humanas)
```

## Anti-patterns que esta capa bloquea

- **Saltar a codigo sin diseño** → bloqueado por protocolo `brainstorming` para tareas que modifican comportamiento.
- **Codigo sin test fallido primero** → bloqueado por protocolo `tdd` + `check:tdd-evidence`.
- **Self-approval** → bloqueado por `check:task-reviews` (reviewer != implementer).
- **Plan con placeholders/paths inventados** → bloqueado por `check:tasks-executable`.
- **Cerrar tarea sin verificar empiricamente** → skill `verification-before-completion`.
- **Worktrees huerfanos o multi-agent races** → `agent:start` valida estado y bloquea concurrencia.

## Como interactua con la Capa 2 (governance)

| Capa 2 declara | Capa 1 ejecuta |
|---|---|
| Fase activa + touch_policy | `agent:start` lee y agrega al context pack |
| Gate aplicable (gate-spdd-approved, etc.) | `agent:finish` verifica firma humana antes de cerrar |
| `spec-funcional.md` + `spec-tecnica.md` | Protocolo `planning` los consume para generar `spec-tareas.md` ejecutable |
| `traceability.md` | `agent:finish` lo actualiza con codigo/test reales |
| `check:project` (41 validators) | `agent:finish` lo corre antes de opciones humanas |

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
