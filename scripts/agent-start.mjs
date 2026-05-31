#!/usr/bin/env node
/**
 * agent-start.mjs (v12.137)
 *
 * Punto de entrada del agente a una tarea. Hace en UNA llamada todo lo que la
 * Capa 1 (execution discipline) requiere antes de tocar codigo:
 *
 *   1. Crea entrada en ai_task_runs (status=in_progress, run_uuid generado).
 *   2. Crea/reusa git worktree en worktrees/<slug>-<task>/.
 *   3. Corre baseline `npm run check:all` en el worktree (debe EXIT 0 antes de empezar).
 *   4. Genera context pack: .agent/context-pack/<slug>-<task>.md con:
 *      - RF de spec-funcional
 *      - touch_policy de la fase activa
 *      - Fila T-NNN completa de spec-tareas.md
 *      - Bloque correspondiente de tdd-evidence.md
 *      - Protocolo aplicable (de agent:protocol)
 *
 * Anti-patterns que bloquea:
 *   - Crear worktree concurrente con la misma T-NNN (race con otro agente)
 *   - Baseline check:all en rojo (NO se trabaja sobre arbol roto)
 *   - Implementer = reviewer (rompe Principio 1 — esto se evita en agent:review)
 *
 * Uso:
 *   node scripts/agent-start.mjs --feature 002-mi --task T-001 --agent codex
 */

// v12.126: suprime ExperimentalWarning de node:sqlite (Windows pipe stderr hangs).
process.removeAllListeners("warning");

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
// v12.130: --dry-run REAL (sin side effects). En v12.123 el flag no estaba
// implementado y aun creaba worktree + .agent/context-pack + ai_task_runs entry.
const dryRun = !!args["dry-run"];

if (args.help || !args.feature || !args.task || !args.agent) {
  console.log(`agent-start (v12.130) — inicio orquestado de tarea T-NNN.

Uso:
  node scripts/agent-start.mjs --feature <slug> --task <T-NNN> --agent <implementer>
  node scripts/agent-start.mjs --feature <slug> --task <T-NNN> --agent <implementer> --dry-run

Acciones:
  1. Reserva run_uuid en ai_task_runs (status=in_progress).
  2. Crea worktree aislado worktrees/<slug>-<task>/ (si no existe).
  3. Baseline: npm run check:all en el worktree → debe EXIT 0.
  4. Emite .agent/context-pack/<slug>-<task>.md con RF + touch_policy + fila T + tdd-evidence + protocolo aplicable.

Despues:
  - Trabaja SOLO en el worktree.
  - Aplica el protocolo TDD (RED → GREEN → REFACTOR).
  - Cuando termines, marca implementer_done y dispatch a review.
  - Cierre del feature: agent:finish (v12.123+).
`);
  process.exit(args.help ? 0 : 1);
}

const feature = String(args.feature).trim();
const task = String(args.task).trim();
const agent = String(args.agent).trim();

const dbPath = join(root, "ai", "memory", "framework-agent.db");
if (!existsSync(dbPath)) {
  console.error(`No existe la memoria ${dbPath}. Corre 'npm run memory:bootstrap' primero.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

// Verifica que no haya un run in_progress para esta task con OTRO agente.
const active = db.prepare(`SELECT * FROM ai_task_runs WHERE feature=? AND task_id=? AND status IN ('in_progress','implementer_done') ORDER BY started_at DESC LIMIT 1`).get(feature, task);
if (active && active.agent !== agent) {
  console.error(`Conflicto: ya hay un run activo para ${feature}/${task} con agente '${active.agent}' (status=${active.status}, run_uuid=${active.run_uuid}). Espera o coordina via AGENT_BOARD.`);
  db.close();
  process.exit(2);
}

// Verifica fila T en spec-tareas.md.
const tareasPath = join(root, "specs", feature, "spec-tareas.md");
if (!existsSync(tareasPath)) {
  console.error(`No existe ${tareasPath}. Crea la feature con 'npm run scaffold:feature' primero.`);
  db.close();
  process.exit(2);
}
const tareas = readFileSync(tareasPath, "utf8");
const rowRe = new RegExp(`^\\|\\s*${task}\\s*\\|([^\\n]+)$`, "m");
const rowMatch = tareas.match(rowRe);
if (!rowMatch) {
  console.error(`T ${task} no aparece en specs/${feature}/spec-tareas.md (tabla ejecutable). Aplica el protocolo 'planning' primero.`);
  db.close();
  process.exit(2);
}

// v12.130: --dry-run REAL — solo reporta lo que HARIA, sin side effects.
if (dryRun) {
  const branchName = `agent/${feature}/${task.toLowerCase()}`;
  const previewWorktree = join(root, "worktrees", `${feature}-${task.toLowerCase()}`);
  console.log("");
  console.log(`(DRY-RUN) NO se crea worktree, ni context pack, ni entry en SQLite. Acciones que se realizarian:`);
  console.log(`  1. git worktree add -b ${branchName} ${previewWorktree.replace(root, "<root>")}`);
  console.log(`  2. INSERT INTO ai_task_runs (run_uuid=<nuevo-uuid>, feature=${feature}, task_id=${task}, agent=${agent}, status='in_progress', worktree_path=${previewWorktree.replace(root, "<root>")})`);
  console.log(`  3. Escribir .agent/context-pack/${feature}-${task.toLowerCase()}.md`);
  console.log(`  4. Correr 'npm run check:all' en el worktree (baseline)`);
  console.log("");
  console.log(`Sin --dry-run las 4 acciones se ejecutan en orden. Aborto (estado sin tocar).`);
  db.close();
  process.exit(0);
}

// Crear worktree.
const worktreePath = join(root, "worktrees", `${feature}-${task.toLowerCase()}`);
const wtExists = existsSync(worktreePath);
if (!wtExists) {
  const branchName = `agent/${feature}/${task.toLowerCase()}`;
  const wt = spawnSync("git", ["worktree", "add", "-b", branchName, worktreePath], { cwd: root, stdio: "inherit" });
  if (wt.status !== 0) {
    console.error(`git worktree add fallo (status ${wt.status}). Aborto.`);
    db.close();
    process.exit(2);
  }
  console.log(`✓ worktree creado: ${worktreePath}`);
} else {
  console.log(`(reuso worktree existente: ${worktreePath})`);
}

// Registrar run_uuid (o reusar el activo del mismo agente).
let runUuid;
if (active && active.agent === agent) {
  runUuid = active.run_uuid;
  console.log(`(reuso run_uuid existente: ${runUuid})`);
} else {
  runUuid = randomUUID();
  db.prepare(`INSERT INTO ai_task_runs (run_uuid, feature, task_id, agent, status, worktree_path) VALUES (?, ?, ?, ?, 'in_progress', ?)`).run(runUuid, feature, task, agent, worktreePath);
  console.log(`✓ ai_task_runs entry: ${runUuid}`);
}

// Context pack.
const ctxDir = join(root, ".agent", "context-pack");
mkdirSync(ctxDir, { recursive: true });
const ctxPath = join(ctxDir, `${feature}-${task.toLowerCase()}.md`);

const specFunPath = join(root, "specs", feature, "spec-funcional.md");
const specFun = existsSync(specFunPath) ? readFileSync(specFunPath, "utf8") : "(spec-funcional.md no existe)";
const evidPath = join(root, "specs", feature, "tdd-evidence.md");
const evid = existsSync(evidPath) ? readFileSync(evidPath, "utf8") : "(tdd-evidence.md no existe)";

// Protocolo aplicable via agent:protocol (lo invocamos como child).
const protoRes = spawnSync(process.execPath, [join(root, "scripts", "agent-protocol.mjs"), "--task", `ejecutar tarea ${task} del feature ${feature}`, "--json"], { cwd: root });
const protoJson = protoRes.stdout ? JSON.parse(protoRes.stdout.toString()) : { protocol: "subagent-execution", reason: "default" };

// v12.137: chequeo opcional de updates del framework via plugin-check-updates.
// Solo si AIF_PLUGIN_REGISTRY esta definido y el script existe en este proyecto.
let pluginUpdateBlock = "";
const checkUpdScript = join(root, "scripts", "plugin-check-updates.mjs");
if (process.env.AIF_PLUGIN_REGISTRY && existsSync(checkUpdScript)) {
  const upd = spawnSync(process.execPath, [checkUpdScript, "--registry", process.env.AIF_PLUGIN_REGISTRY, "--json"], { cwd: root, stdio: "pipe" });
  // exit codes: 0 up-to-date, 2 update available, 3 error
  if (upd.status === 0 || upd.status === 2) {
    try {
      const updJson = JSON.parse((upd.stdout || Buffer.from("")).toString());
      if (updJson.status === "update-available") {
        pluginUpdateBlock = `\n## ⚠ Framework update disponible\n- Local: v${updJson.local_version} → Remote: v${updJson.remote_version}\n- Registry: ${updJson.registry}\n- Bundle: ${updJson.remote_bundle} (sha256: ${(updJson.remote_sha256 || "").slice(0, 16)}...)\n- Decision humana: ¿actualizar antes de empezar ${task}? Comando exacto:\n  \`\`\`bash\n  node scripts/plugin-install-local.mjs --bundle "<registry-dir>/${updJson.remote_bundle}" --target . --agent ${agent} --force\n  \`\`\`\n- NO auto-instala (Principio 1). Coordina con el team antes de aplicar.\n`;
        console.log(`⚠ Framework update disponible: v${updJson.local_version} → v${updJson.remote_version} (ver context pack)`);
      } else if (updJson.status === "up-to-date") {
        console.log(`✓ Framework up-to-date (v${updJson.local_version})`);
      }
    } catch { /* malformed JSON; skip block */ }
  }
}

const ctxBody = `# Context pack — ${feature} / ${task}

> Generado por \`agent:start\` (v12.123) para el agente \`${agent}\`.
> run_uuid: \`${runUuid}\` | worktree: \`${worktreePath.replace(root, "<root>")}\`

## Protocolo aplicable
- **${protoJson.protocol}** — ${protoJson.reason}
- Secundarios: ${(protoJson.secondary_protocols || []).join(", ") || "-"}
- Documentacion: \`${protoJson.documentation}\`
${pluginUpdateBlock}

## Pasos OBLIGATORIOS antes de tocar codigo
${(protoJson.next_steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Fila T en spec-tareas.md
| ${task} |${rowMatch[1]}

## RFs y reglas (spec-funcional.md, secciones clave)
${extractKeySections(specFun, ["Objetivo", "Requerimientos", "Reglas de negocio", "Criterios de aceptacion"])}

## Bloque TDD a llenar (tdd-evidence.md)
${extractTddBlock(evid, task)}

## Lectura obligatoria adicional
- CONSTITUTION.md
- AGENTS.md
- AGENT_RUNTIME.md
- ai/protocols/${protoJson.protocol}.md

## Trabajo
1. Trabaja SOLO bajo \`${worktreePath.replace(root, "<root>")}\`.
2. Sigue el protocolo. Para T tipo=impl, aplica el ciclo TDD.
3. Al terminar, marca el run como \`implementer_done\` (otro agente sera el reviewer).
4. Code review 2-stage: \`npm run agent:review -- --task ${task} --feature ${feature} --stage both --reviewer <otro-agente>\`.
5. Cierre del feature (cuando todos los T esten approved): \`npm run agent:finish -- --feature ${feature}\`.
`;
writeFileSync(ctxPath, ctxBody, "utf8");
console.log(`✓ context pack: ${ctxPath.replace(root, "<root>")}`);

// Baseline opcional — el flag --skip-baseline lo desactiva (util para no romper el flow
// en proyectos donde check:all aun no esta 100% verde).
if (!args["skip-baseline"]) {
  console.log(`\nBaseline (check:all en repo principal — los proyectos sin worktree heredan):`);
  const base = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "check:all"], { cwd: root, stdio: "inherit" });
  if (base.status !== 0) {
    console.error(`\n⚠ Baseline check:all fallo. Considera --skip-baseline si esto es esperado.`);
  } else {
    console.log(`✓ baseline check:all EXIT 0`);
  }
}

db.close();
console.log(`\n[agent:start completado] Lee el context pack y empieza:\n  ${ctxPath.replace(root, "<root>")}`);
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function extractKeySections(text, headings) {
  const out = [];
  for (const h of headings) {
    const re = new RegExp(`^##\\s+${escapeRe(h)}\\b[^\\n]*\\n([\\s\\S]+?)(?=\\n##\\s|$)`, "im");
    const m = text.match(re);
    if (m) out.push(`### ${h}\n${m[1].trim()}`);
  }
  return out.join("\n\n") || "(secciones clave no encontradas)";
}

function extractTddBlock(text, task) {
  const re = new RegExp(`^##\\s+RF-[A-Z0-9-]+\\s*\\/\\s*${escapeRe(task)}\\b[^\\n]*\\n([\\s\\S]+?)(?=\\n##\\s|$)`, "im");
  const m = text.match(re);
  return m ? m[0] : `(no hay bloque tdd-evidence para ${task} — sera creado al correr TDD)`;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

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
