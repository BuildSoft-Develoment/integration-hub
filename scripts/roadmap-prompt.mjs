#!/usr/bin/env node
/**
 * roadmap-prompt.mjs (v12.63)
 *
 * Renderiza el CONTRATO DE EJECUCION de la siguiente tarea segura como un prompt
 * listo para copiar/pegar a un agente IA (Codex, OpenCode, Claude Code, Gemini).
 *
 * Fuente unica: spawnea `roadmap-next.mjs --json` (que ya deriva touch_policy,
 * recommended_agent, definition_of_done y transition_request de phase-contracts).
 * Este script SOLO formatea — no decide nada, para no duplicar la logica de
 * seleccion ni el contrato.
 *
 * Uso:
 *   npm run roadmap:prompt                              # prompt de la siguiente tarea
 *   npm run roadmap:prompt -- --agent codex             # personaliza el encabezado
 *   npm run roadmap:prompt -- --feature 002-...         # nota si difiere de la auto-seleccionada
 *   npm run roadmap:prompt -- --out ai/prompts/next.md  # ademas escribe a archivo
 *
 * Exit codes:
 *   0 - prompt generado.
 *   1 - error (no se pudo obtener roadmap-next).
 */

import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const agentName = args.agent || null;
const focusFeature = args.feature || null;
const outPath = args.out ? resolve(args.out) : null;

const nextScript = join(root, "scripts", "roadmap-next.mjs");
if (!existsSync(nextScript)) {
  console.error(`Error: scripts/roadmap-next.mjs no existe. Corre: npm run template:upgrade -- --apply`);
  process.exit(1);
}
const result = spawnSync(process.execPath, [nextScript, "--root", root], { encoding: "utf8", timeout: 15000 });
if (result.status !== 0 || !result.stdout) {
  console.error(`Error: roadmap-next fallo.`);
  console.error(result.stderr?.slice(0, 400));
  process.exit(1);
}
let next;
try { next = JSON.parse(result.stdout); } catch { console.error("Error: roadmap-next devolvio JSON invalido."); process.exit(1); }

const prompt = renderPrompt(next, agentName, focusFeature);

console.log(prompt);

if (outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, prompt + "\n", "utf8");
  console.error(`\n[roadmap:prompt] escrito en ${outPath.replace(root, "<root>")}`);
}

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function renderPrompt(n, agent, focus) {
  const tp = n.touch_policy || { allowed_paths: [], forbidden_paths: [] };
  const dod = n.definition_of_done || { deliverables: [], checks: [] };
  const tr = n.transition_request || null;
  const who = agent || n.recommended_agent || "agente IA";
  const lines = [];

  lines.push(`# Tarea para: ${who}`);
  lines.push(``);
  if (focus && n.feature && focus !== n.feature && !n.feature.startsWith(focus)) {
    lines.push(`> NOTA: pediste foco en "${focus}", pero roadmap:next prioriza "${n.feature}".`);
    lines.push(`> Resuelve esa tarea primero (o sus bloqueadores) antes de tomar "${focus}".`);
    lines.push(``);
  }
  lines.push(`## Objetivo`);
  lines.push(n.next_action);
  lines.push(``);
  lines.push(`- Feature: ${n.feature || "(transversal / sin feature)"}`);
  if (typeof n.phase === "number" && n.phase >= 0) lines.push(`- Fase: ${n.phase}`);
  lines.push(`- Readiness: ${n.agent_readiness}${n.reason ? ` — ${n.reason}` : ""}`);
  if (n.recommended_agent) lines.push(`- Agente recomendado: ${n.recommended_agent} (permitidos: ${(n.allowed_agents || []).join(", ") || "-"})`);
  lines.push(``);

  if ((n.blockers || []).length > 0) {
    lines.push(`## Bloqueadores actuales`);
    for (const b of n.blockers) lines.push(`- ${b}`);
    lines.push(``);
  }

  // v12.117: lectura universal (CONSTITUTION + AGENTS + AI_CONTEXT + ROADMAP_STATE)
  // antepuesta. v12.121: agrega AGENT_RUNTIME y los protocolos relevantes (Capa 1 de
  // execution discipline). Dedup preservando orden.
  lines.push(`## Lee primero (contexto minimo)`);
  const universal = ["CONSTITUTION.md", "AGENTS.md", "AGENT_RUNTIME.md", "AI_CONTEXT.md", "ROADMAP_STATE.json"];
  const seen = new Set();
  for (const r of [...universal, ...(n.must_read || [])]) {
    if (seen.has(r)) continue;
    seen.add(r);
    lines.push(`- ${r}`);
  }
  // Capas opt-in de compat (no fuente de verdad — solo vistas alias hacia los canonicos).
  lines.push(`- (opcional, si existe) carpeta \`specs/<feature>/.specify/\` con spec, plan, tasks — vistas compat con spec-kit; la fuente de verdad sigue siendo los canonicos.`);
  lines.push(``);

  // v12.121: bloque de execution discipline (Capa 1). Antes de actuar, el agente DEBE
  // seleccionar protocolo y aplicar la disciplina correspondiente. Es ahora parte
  // OBLIGATORIA del prompt (no toggle, no opcional).
  lines.push(`## Execution discipline (Capa 1 — obligatoria, ver AGENT_RUNTIME.md)`);
  lines.push(`Antes de actuar, ejecuta:`);
  lines.push("```bash");
  lines.push(`npm run agent:protocol -- --task "<descripcion breve de tu tarea>"`);
  lines.push("```");
  lines.push(`Te devolvera el protocolo aplicable. Reglas no negociables:`);
  lines.push(``);
  lines.push(`- **Required protocol** (corre primero): brainstorming | planning | tdd | subagent-execution | code-review | finishing-branch (ver \`ai/protocols/<nombre>.md\`).`);
  lines.push(`- **Required skills** (activables segun contexto): brainstorming, writing-plans, test-driven-development, verification-before-completion, debugging-workflow, using-git-worktrees, finishing-development-branch.`);
  lines.push(`- **Worktree requirement**: para tareas T-NNN, corre \`npm run agent:start -- --feature <slug> --task <T-NNN> --agent <yo>\` ANTES de tocar codigo (v12.123+; los 3 flags son obligatorios). Crea worktree aislado + entry en \`ai_task_runs\` + context pack, y corre \`check:all\` como baseline INFORMATIVO: si sale en rojo solo AVISA y termina en 0. NO toma el lock de feature — eso es \`npm run roadmap:claim\`.`);
  lines.push(`- **TDD requirement**: para T tipo=impl, ESCRIBE el test que falla ANTES del codigo de produccion. Captura RED en \`specs/<slug>/tdd-evidence.md\`. Despues GREEN. No al reves.`);
  lines.push(`- **Plan file**: \`specs/<slug>/spec-tareas.md\` (tabla ejecutable v12.119+) — paths/comandos exactos, no \`<placeholder>\`, granularidad 2-5 min por T.`);
  lines.push(`- **Task granularity**: si una T tarda >5 min, dividela en spec-tareas antes de empezar.`);
  lines.push(`- **Review policy**: tras cada T en \`implementer_done\`, corre los 2 stages con \`npm run agent:review -- --task <T-NNN> --feature <slug> --stage spec-compliance --reviewer <otro-agente>\` y luego el mismo comando con \`--stage code-quality\` (o \`--stage both\` en una sola llamada). Reviewer DEBE ser distinto del implementer (Principio 1 anti-self-approval): con el mismo, el script sale con exit 3.`);
  lines.push(`- **Stop conditions**: si CUALQUIER \`check:*\` o validador bloquea (EXIT 1), NO continues. Reporta al humano y pide intervencion.`);
  lines.push(`- **Finish policy**: cuando todos los T del feature esten \`approved\`, corre \`npm run agent:finish -- --feature <slug>\` (v12.123+) — el humano elige PR/merge/keep/discard. No mergees ni borres worktrees sin confirmacion humana.`);
  lines.push(``);

  lines.push(`## Puedes MODIFICAR (touch_policy)`);
  if (tp.allowed_paths.length === 0) lines.push(`- (sin rutas declaradas para esta fase)`);
  for (const p of tp.allowed_paths) lines.push(`- ${p}`);
  lines.push(``);
  lines.push(`## NO puedes modificar`);
  if (tp.forbidden_paths.length === 0) lines.push(`- (sin restricciones declaradas)`);
  for (const p of tp.forbidden_paths) lines.push(`- ${p}`);
  lines.push(``);

  if ((n.allowed_actions || []).length > 0) {
    lines.push(`## Acciones permitidas`);
    for (const a of n.allowed_actions) lines.push(`- ${a}`);
    lines.push(``);
  }
  if ((n.forbidden_actions || []).length > 0) {
    lines.push(`## Acciones PROHIBIDAS`);
    for (const a of n.forbidden_actions) lines.push(`- ${a}`);
    lines.push(``);
  }

  lines.push(`## Ejecuta (en orden)`);
  for (const c of n.commands_to_run || []) lines.push(`- ${c.startsWith("#") ? c : "$ " + c}`);
  lines.push(``);

  lines.push(`## Definition of Done`);
  for (const d of dod.deliverables || []) lines.push(`- [ ] ${d}`);
  for (const c of dod.checks || []) lines.push(`- [ ] pasa: ${c}`);
  for (const e of n.exit_criteria || []) lines.push(`- [ ] ${e}`);
  lines.push(``);

  if (tr) {
    lines.push(`## Transicion de fase (gate)`);
    lines.push(`- Puedes SOLICITAR el gate: ${tr.toGate}`);
    lines.push(`- NO puedes aprobarlo${tr.canApprove ? "" : ` — lo firma un humano: ${tr.approver}`}`);
    lines.push(`- Deja el gate en \`pending\` en traceability.md hasta la firma humana.`);
    lines.push(``);
  }

  lines.push(`## Al terminar (auto-auditoria)`);
  lines.push(`- $ npm run memory:sync`);
  lines.push(`- $ npm run roadmap:audit${n.feature ? ` -- --feature ${n.feature}` : ""}`);
  lines.push(`- Si roadmap:audit reporta violaciones (rutas prohibidas tocadas, gate auto-aprobado), corrigelas antes de declarar la tarea completa.`);

  return lines.join("\n");
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key] = argv[++i];
      else out[key] = true;
    }
  }
  return out;
}
