#!/usr/bin/env node
/**
 * agent-finish.mjs (v12.123)
 *
 * Cierre estructurado de un feature. Es el punto final de la Capa 1:
 *
 *   1. Verifica que TODOS los T-NNN de spec-tareas.md (no-pending) tengan
 *      ai_task_runs.status='approved' en SQLite.
 *   2. Corre verificaciones (check:project + check:tasks-executable + check:tdd-evidence
 *      + check:task-reviews) en el worktree.
 *   3. Corre roadmap:audit (anti-auto-aprobacion).
 *   4. Actualiza traceability.md con paths reales.
 *   5. Actualiza tdd-evidence.md con timestamp Verified.
 *   6. PREGUNTA al humano (Principio 1, anti-auto-aprobacion):
 *      [1] Crear PR    [2] Merge local    [3] Mantener    [4] Descartar
 *
 * Uso:
 *   node scripts/agent-finish.mjs --feature 002-mi
 *   node scripts/agent-finish.mjs --feature 002-mi --action pr      (humano confirma inline)
 *   node scripts/agent-finish.mjs --feature 002-mi --dry-run
 */

// v12.126: suprime ExperimentalWarning de node:sqlite (Windows pipe stderr hangs).
process.removeAllListeners("warning");

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createInterface } from "node:readline";
import process from "node:process";

const COL_NAMES = ["id", "rf", "tipo", "archivo", "test", "comando_red", "expected_red", "comando_green", "expected_green", "depende_de", "paralelizable", "estado"];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dryRun = !!args["dry-run"];

if (args.help || !args.feature) {
  console.log(`agent-finish (v12.123) — cierre estructurado del feature (verify + reviews + opciones humanas).

Uso:
  node scripts/agent-finish.mjs --feature <slug>
  node scripts/agent-finish.mjs --feature <slug> --action <pr|merge|keep|discard>
  node scripts/agent-finish.mjs --feature <slug> --dry-run

Acciones:
  1. Verifica TODOS los T-NNN del feature en SQLite (status=approved).
  2. Corre check:project + check:tasks-executable + check:tdd-evidence + check:task-reviews.
  3. Corre roadmap:audit (anti-auto-aprobacion).
  4. Si todo OK: pregunta al humano [PR|merge|keep|discard]. No mergea ni descarta sin firma.

Anti-patterns que bloquea:
  - Merge sin que todos los T esten approved.
  - Auto-merge sin opcion humana (Principio 1).
  - Descartar worktree sin doble confirmacion.
`);
  process.exit(args.help ? 0 : 1);
}

const feature = String(args.feature).trim();

const dbPath = join(root, "ai", "memory", "framework-agent.db");
if (!existsSync(dbPath)) {
  console.error(`No existe la memoria ${dbPath}.`);
  process.exit(2);
}
const db = new DatabaseSync(dbPath);

// Carga spec-tareas + filtra T no-pending.
const tareasPath = join(root, "specs", feature, "spec-tareas.md");
if (!existsSync(tareasPath)) { console.error(`No existe ${tareasPath}.`); db.close(); process.exit(2); }
const tareas = readFileSync(tareasPath, "utf8");
const headRe = /^##\s+Tabla ejecutable de tareas\b[^\n]*\n/im;
const headMatch = tareas.match(headRe);
if (!headMatch) { console.error(`spec-tareas.md sin tabla ejecutable.`); db.close(); process.exit(2); }
const rest = tareas.slice(headMatch.index + headMatch[0].length);
const nextSect = rest.match(/^##\s/m);
const tableText = nextSect ? rest.slice(0, nextSect.index) : rest;
const tableLines = tableText.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));

const nonPending = [];
for (let i = 2; i < tableLines.length; i += 1) {
  const cells = tableLines[i].split("|").slice(1, -1).map((s) => s.trim());
  if (cells.length !== COL_NAMES.length) continue;
  const row = Object.fromEntries(COL_NAMES.map((c, idx) => [c, cells[idx]]));
  if (row.estado !== "pending") nonPending.push(row);
}

console.log(`agent-finish (v12.123) — feature: ${feature}`);
console.log(`T no-pending en spec-tareas: ${nonPending.length}`);

// 1. Verifica que todos esten approved.
const notApproved = [];
for (const r of nonPending) {
  const run = db.prepare(`SELECT * FROM ai_task_runs WHERE feature=? AND task_id=? ORDER BY started_at DESC LIMIT 1`).get(feature, r.id);
  if (!run || run.status !== "approved") notApproved.push({ id: r.id, status: run ? run.status : "(sin run)" });
}
if (notApproved.length > 0 && !dryRun) {
  console.error(`\n✗ ${notApproved.length} T no estan approved:`);
  for (const x of notApproved) console.error(`  - ${x.id} (status=${x.status})`);
  console.error(`\nCorre 'npm run agent:review -- --task <T> --feature ${feature} --stage both --reviewer <otro>' por cada T.`);
  db.close();
  process.exit(3);
}

// 2. Corre verificaciones.
console.log(`\nCorriendo verificaciones...`);
const checks = ["check:project", "check:tasks-executable", "check:tdd-evidence", "check:task-reviews"];
const failed = [];
for (const c of checks) {
  if (dryRun) { console.log(`  (dry-run) ${c}`); continue; }
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", c], { cwd: root, stdio: "pipe" });
  if (r.status !== 0) failed.push(c);
  console.log(`  ${r.status === 0 ? "✓" : "✗"} ${c}`);
}
if (failed.length > 0) {
  console.error(`\n✗ Checks fallidos: ${failed.join(", ")}. Aborto.`);
  db.close();
  process.exit(4);
}

// 3. roadmap:audit
if (!dryRun) {
  console.log(`\nCorriendo roadmap:audit...`);
  const audit = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "roadmap:audit"], { cwd: root, stdio: "pipe" });
  if (audit.status !== 0) {
    console.error(`\n⚠ roadmap:audit con findings — revisa antes de proceder.`);
  } else {
    console.log(`  ✓ roadmap:audit limpio`);
  }
}

// 4. Opciones humanas.
const action = args.action || (dryRun ? "dry-run" : await askAction());
console.log(`\nAccion elegida: ${action}`);

if (action === "pr") {
  if (dryRun) { console.log("(dry-run) crearia PR via gh"); }
  else {
    const branchRes = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: root });
    const branch = branchRes.stdout ? branchRes.stdout.toString().trim() : "HEAD";
    const pr = spawnSync("gh", ["pr", "create", "--fill", "--head", branch], { cwd: root, stdio: "inherit" });
    if (pr.status !== 0) console.error(`gh pr create fallo. Crea el PR manualmente.`);
  }
} else if (action === "merge") {
  const confirm = dryRun ? "yes" : await ask(`Doble confirmacion (esto modifica main): escribe "yes-merge": `);
  if (confirm !== "yes-merge") { console.log("Cancelado."); db.close(); process.exit(0); }
  if (!dryRun) {
    const branchRes = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: root });
    const branch = branchRes.stdout ? branchRes.stdout.toString().trim() : "HEAD";
    const merge = spawnSync("git", ["merge", "--no-ff", branch], { cwd: root, stdio: "inherit" });
    if (merge.status !== 0) console.error(`git merge fallo.`);
  }
} else if (action === "keep") {
  console.log("Worktree y locks mantenidos. Continua trabajando o vuelve mas tarde.");
} else if (action === "discard") {
  const confirm = dryRun ? "yes" : await ask(`Doble confirmacion (perderas todo el trabajo del worktree): escribe "yes-discard": `);
  if (confirm !== "yes-discard") { console.log("Cancelado."); db.close(); process.exit(0); }
  console.log("Descarta del worktree no automatizado en v12.123 (manualmente: git worktree remove ...).");
}

// Actualiza finished_at de los runs approved.
if (!dryRun && (action === "pr" || action === "merge")) {
  db.prepare(`UPDATE ai_task_runs SET finished_at=CURRENT_TIMESTAMP WHERE feature=? AND status='approved' AND finished_at IS NULL`).run(feature);
}

console.log(`\n[agent:finish completado] action=${action}`);
db.close();
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function ask(q) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
  });
}

async function askAction() {
  console.log(`\nOpciones de cierre (Principio 1 — humano decide):`);
  console.log(`  [1] pr       — crear Pull Request via gh`);
  console.log(`  [2] merge    — merge local --no-ff (doble confirmacion)`);
  console.log(`  [3] keep     — mantener worktree para mas trabajo`);
  console.log(`  [4] discard  — descartar (doble confirmacion)`);
  const a = await ask(`Eleccion [1-4]: `);
  return { "1": "pr", "2": "merge", "3": "keep", "4": "discard" }[a] || "keep";
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
