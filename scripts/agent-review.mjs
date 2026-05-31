#!/usr/bin/env node
/**
 * agent-review.mjs (v12.122)
 *
 * Code review en 2 stages: spec-compliance (Stage 1) y code-quality (Stage 2).
 * Cada review queda registrada en SQLite (ai_task_reviews + ai_task_review_findings)
 * con reviewer_agent != implementer_agent (anti-self-approval, Principio 1).
 *
 * Uso:
 *   node scripts/agent-review.mjs --task T-001 --feature 002-mi --stage spec-compliance --reviewer codex
 *   node scripts/agent-review.mjs --task T-001 --feature 002-mi --stage code-quality --reviewer opencode
 *   node scripts/agent-review.mjs --task T-001 --feature 002-mi --stage both --reviewer codex
 *
 * Salida:
 *   .agent/runs/<run-uuid>/spec-review.md (markdown human-readable)
 *   .agent/runs/<run-uuid>/quality-review.md
 *   .agent/runs/<run-uuid>/result.json
 *   ai_task_reviews + ai_task_review_findings (SQLite)
 *
 * Exit codes:
 *   0 - review completada (puede haber findings); state actualizado
 *   1 - argumentos invalidos
 *   2 - no hay ai_task_run con ese task/feature (corre agent:start primero)
 *   3 - reviewer == implementer (rompe anti-self-approval)
 */

// v12.126: suprime ExperimentalWarning de node:sqlite (causa hangs en Windows
// cuando el stderr esta piped por npm en check:all encadenado).
process.removeAllListeners("warning");

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");

if (args.help || !args.task || !args.feature || !args.stage || !args.reviewer) {
  console.log(`agent-review (v12.122) — 2-stage code review programatico.

Uso:
  node scripts/agent-review.mjs --task <T-NNN> --feature <slug> --stage <spec-compliance|code-quality|both> --reviewer <agent>

Argumentos:
  --task <T-NNN>           id de la tarea a revisar
  --feature <slug>         feature de la tarea
  --stage <s>              spec-compliance | code-quality | both
  --reviewer <agent>       agente que hace la review (debe ser distinto del implementer)
  --root <path>            raiz del proyecto

Cada stage hace checks programaticos y persiste findings en SQLite.
`);
  process.exit(args.help ? 0 : 1);
}

const task = String(args.task).trim();
const feature = String(args.feature).trim();
const stage = String(args.stage).trim();
const reviewer = String(args.reviewer).trim();

if (!["spec-compliance", "code-quality", "both"].includes(stage)) {
  console.error(`Stage invalido: ${stage} (esperado: spec-compliance | code-quality | both)`);
  process.exit(1);
}

const dbPath = join(root, "ai", "memory", "framework-agent.db");
if (!existsSync(dbPath)) {
  console.error(`No existe la memoria ${dbPath}. Corre 'npm run memory:bootstrap' primero.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);
// Localiza el ai_task_run mas reciente para esta task/feature.
const run = db.prepare(`SELECT * FROM ai_task_runs WHERE feature=? AND task_id=? ORDER BY started_at DESC LIMIT 1`).get(feature, task);
if (!run) {
  console.error(`No hay ai_task_run para ${feature} / ${task}. Corre 'npm run agent:start --feature ${feature} --task ${task} --agent <implementer>' primero.`);
  process.exit(2);
}
if (run.agent === reviewer) {
  console.error(`Anti-self-approval (Principio 1): reviewer "${reviewer}" es el mismo que el implementer del run. El reviewer DEBE ser distinto.`);
  process.exit(3);
}

const runDir = join(root, ".agent", "runs", run.run_uuid);
mkdirSync(runDir, { recursive: true });

const stages = stage === "both" ? ["spec-compliance", "code-quality"] : [stage];
const allResults = [];

for (const s of stages) {
  const findings = s === "spec-compliance"
    ? runSpecCompliance(root, feature, task, run)
    : runCodeQuality(root, feature, task, run);

  const blocker = findings.filter((f) => f.severity === "blocker").length;
  const major = findings.filter((f) => f.severity === "major").length;
  const result = blocker > 0 ? "fail" : (major > 0 ? "concerns" : "pass");

  // Persistir review.
  const reviewInsert = db.prepare(`INSERT INTO ai_task_reviews (run_uuid, stage, reviewer_agent, result, summary) VALUES (?, ?, ?, ?, ?)`);
  const summary = `Stage ${s}: ${result} (blockers=${blocker}, major=${major}, total=${findings.length})`;
  const r = reviewInsert.run(run.run_uuid, s.replace("-", "_"), reviewer, result, summary);
  const reviewId = Number(r.lastInsertRowid);

  const findingInsert = db.prepare(`INSERT INTO ai_task_review_findings (review_id, severity, area, message, file_path, line) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const f of findings) {
    findingInsert.run(reviewId, f.severity, f.area, f.message, f.file_path || null, f.line || null);
  }

  // Markdown human-readable.
  const md = renderMd(run, s, reviewer, result, findings);
  writeFileSync(join(runDir, `${s === "spec-compliance" ? "spec" : "quality"}-review.md`), md, "utf8");

  // Actualizar status del run.
  if (result === "pass") {
    const newStatus = s === "spec-compliance" ? "spec_review_passed" : "quality_review_passed";
    db.prepare(`UPDATE ai_task_runs SET status=? WHERE run_uuid=?`).run(newStatus, run.run_uuid);
  } else if (result === "concerns") {
    db.prepare(`UPDATE ai_task_runs SET status='done_with_concerns' WHERE run_uuid=?`).run(run.run_uuid);
  } else {
    db.prepare(`UPDATE ai_task_runs SET status='blocked' WHERE run_uuid=?`).run(run.run_uuid);
  }
  // Si ambos stages pasaron, marca approved.
  const updatedRun = db.prepare(`SELECT status FROM ai_task_runs WHERE run_uuid=?`).get(run.run_uuid);
  const spec = db.prepare(`SELECT result FROM ai_task_reviews WHERE run_uuid=? AND stage='spec_compliance' ORDER BY reviewed_at DESC LIMIT 1`).get(run.run_uuid);
  const qual = db.prepare(`SELECT result FROM ai_task_reviews WHERE run_uuid=? AND stage='code_quality' ORDER BY reviewed_at DESC LIMIT 1`).get(run.run_uuid);
  if (spec && qual && spec.result === "pass" && qual.result === "pass") {
    db.prepare(`UPDATE ai_task_runs SET status='approved' WHERE run_uuid=?`).run(run.run_uuid);
  }

  allResults.push({ stage: s, reviewer, result, findings_count: findings.length, blockers: blocker, major });
  console.log(`Stage ${s}: ${result} (blocker=${blocker} major=${major} total=${findings.length})`);
}

writeFileSync(join(runDir, "result.json"), JSON.stringify({
  run_uuid: run.run_uuid,
  feature,
  task,
  implementer: run.agent,
  reviewer,
  results: allResults,
}, null, 2), "utf8");

console.log(`\n.agent/runs/${run.run_uuid}/ actualizado.`);
console.log(`Estado del run: ${db.prepare(`SELECT status FROM ai_task_runs WHERE run_uuid=?`).get(run.run_uuid).status}`);
db.close();
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function runSpecCompliance(root, feature, task, run) {
  const findings = [];
  // 1. spec-tareas tiene la row T-NNN con estado != pending?
  const tareasPath = join(root, "specs", feature, "spec-tareas.md");
  if (!existsSync(tareasPath)) {
    findings.push({ severity: "blocker", area: "trazabilidad", message: `falta specs/${feature}/spec-tareas.md` });
    return findings;
  }
  const tareas = readFileSync(tareasPath, "utf8");
  if (!new RegExp(`\\|\\s*${task}\\s*\\|`).test(tareas)) {
    findings.push({ severity: "blocker", area: "trazabilidad", message: `T ${task} no aparece en spec-tareas.md` });
  }
  // 2. tdd-evidence para T tipo=impl
  const evidPath = join(root, "specs", feature, "tdd-evidence.md");
  if (existsSync(evidPath)) {
    const evid = readFileSync(evidPath, "utf8");
    const blockRe = new RegExp(`^##\\s+RF-[A-Z0-9-]+\\s*\\/\\s*${task}\\b`, "im");
    if (!blockRe.test(evid)) {
      findings.push({ severity: "major", area: "tdd", message: `tdd-evidence.md no tiene bloque para ${task}` });
    }
  } else {
    findings.push({ severity: "major", area: "tdd", message: `specs/${feature}/tdd-evidence.md no existe` });
  }
  // 3. traceability tocada (busca codigo o test concretos)
  const tracePath = join(root, "specs", feature, "traceability.md");
  if (existsSync(tracePath)) {
    const trace = readFileSync(tracePath, "utf8");
    // No es check exhaustivo — solo placeholder advisory.
    if (/\|\s*-\s*\|\s*-\s*\|/.test(trace)) {
      findings.push({ severity: "minor", area: "trazabilidad", message: `traceability.md aun tiene celdas Codigo/Test con \`-\` (planned). Si el T esta done, deberian tener path real.` });
    }
  }
  return findings;
}

function runCodeQuality(root, feature, task, run) {
  const findings = [];
  // Heuristica light en MVP — los proyectos pueden extender con linters reales.
  // 1. Si hay worktree_path, busca archivos modificados.
  const wt = run.worktree_path;
  if (wt && existsSync(wt)) {
    // (extension futura: leer git diff del worktree)
    findings.push({ severity: "minor", area: "other", message: `code-quality es heuristico en v12.122 (MVP). Integra linters reales del stack en check:project para enforcement completo.` });
  }
  return findings;
}

function renderMd(run, stage, reviewer, result, findings) {
  const lines = [
    `# ${stage === "spec-compliance" ? "Spec Compliance" : "Code Quality"} Review`,
    ``,
    `- run_uuid: \`${run.run_uuid}\``,
    `- feature: ${run.feature}`,
    `- task: ${run.task_id}`,
    `- implementer: ${run.agent}`,
    `- reviewer: ${reviewer}`,
    `- result: **${result.toUpperCase()}**`,
    `- timestamp: ${new Date().toISOString()}`,
    ``,
    `## Findings`,
    findings.length === 0 ? "(ninguno)" : "",
  ];
  for (const f of findings) {
    lines.push(`- [${f.severity}][${f.area}] ${f.message}${f.file_path ? ` (${f.file_path}${f.line ? ":" + f.line : ""})` : ""}`);
  }
  return lines.join("\n") + "\n";
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
