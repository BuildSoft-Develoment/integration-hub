#!/usr/bin/env node
/**
 * check-task-reviews.mjs (v12.122)
 *
 * Verifica que cada T-NNN con estado=done en spec-tareas.md tenga reviews 2-stage
 * en SQLite (ai_task_runs + ai_task_reviews) con reviewer_agent != implementer.
 *
 * v12.125: promovido a STRICT por default. Para el template mismo, las 3 specs de
 * ejemplo (001/002/003) tienen todos sus T en state=pending — el validador solo
 * verifica T en state=done, asi que pasa trivialmente. Para proyectos instanciados,
 * STRICT obliga a usar agent:start/finish/review cuando promuevan T a done.
 *
 * Origen v12.122: comenzo en WARN para no romper proyectos sin runs. v12.125 lo
 * cierra como STRICT siguiendo "no back-compat" (los proyectos antiguos se recrean).
 */

// v12.126: suprime ExperimentalWarning de node:sqlite (estable en uso real;
// el warning piped a stderr causaba hangs en Windows al chainar check:all).
process.removeAllListeners("warning");

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const COL_NAMES = ["id", "rf", "tipo", "archivo", "test", "comando_red", "expected_red", "comando_green", "expected_green", "depende_de", "paralelizable", "estado"];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true); // v12.125: default STRICT

const dbPath = join(root, "ai", "memory", "framework-agent.db");
const specsDir = join(root, "specs");
const blockers = [];
const warnings = [];
let evaluated = 0;

if (!existsSync(dbPath)) {
  console.log(`check-task-reviews (v12.122) ${strict ? "[STRICT]" : "[WARN]"}`);
  console.log(`(no hay memoria SQLite — ejecuta memory:bootstrap. Skip.)`);
  process.exit(0);
}

if (existsSync(specsDir)) {
  const db = new DatabaseSync(dbPath);
  try {
  const entries = readdirSync(specsDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!/^\d{3,}-[a-z0-9-]+/i.test(e.name)) continue;
    if (e.name.startsWith("000-")) continue;
    const tareasPath = join(specsDir, e.name, "spec-tareas.md");
    if (!existsSync(tareasPath)) continue;
    const tareas = readFileSync(tareasPath, "utf8");

    const headRe = /^##\s+Tabla ejecutable de tareas\b[^\n]*\n/im;
    const headMatch = tareas.match(headRe);
    if (!headMatch) continue;
    const rest = tareas.slice(headMatch.index + headMatch[0].length);
    const nextSect = rest.match(/^##\s/m);
    const tableText = nextSect ? rest.slice(0, nextSect.index) : rest;
    const tableLines = tableText.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
    if (tableLines.length < 3) continue;

    for (let i = 2; i < tableLines.length; i += 1) {
      const cells = tableLines[i].split("|").slice(1, -1).map((s) => s.trim());
      if (cells.length !== COL_NAMES.length) continue;
      const row = Object.fromEntries(COL_NAMES.map((c, idx) => [c, cells[idx]]));
      if (row.estado !== "done") continue;
      evaluated += 1;
      const run = db.prepare(`SELECT * FROM ai_task_runs WHERE feature=? AND task_id=? ORDER BY started_at DESC LIMIT 1`).get(e.name, row.id);
      if (!run) {
        warnings.push(`specs/${e.name}/spec-tareas.md: ${row.id} en estado=done pero no hay ai_task_run registrado. ¿Se uso agent:start?`);
        continue;
      }
      if (run.status !== "approved") {
        warnings.push(`specs/${e.name}: ${row.id} estado=done en spec-tareas pero ai_task_runs.status='${run.status}' (esperado 'approved' tras 2-stage review).`);
        continue;
      }
      const specRev = db.prepare(`SELECT * FROM ai_task_reviews WHERE run_uuid=? AND stage='spec_compliance' ORDER BY reviewed_at DESC LIMIT 1`).get(run.run_uuid);
      const qualRev = db.prepare(`SELECT * FROM ai_task_reviews WHERE run_uuid=? AND stage='code_quality' ORDER BY reviewed_at DESC LIMIT 1`).get(run.run_uuid);
      if (!specRev) blockers.push(`specs/${e.name}: ${row.id} approved pero sin spec_compliance review en SQLite.`);
      if (!qualRev) blockers.push(`specs/${e.name}: ${row.id} approved pero sin code_quality review en SQLite.`);
      // Anti-self-approval.
      if (specRev && specRev.reviewer_agent === run.agent) blockers.push(`specs/${e.name}: ${row.id} spec-compliance review hecho por el mismo agente que el implementer (${run.agent}). Rompe Principio 1.`);
      if (qualRev && qualRev.reviewer_agent === run.agent) blockers.push(`specs/${e.name}: ${row.id} code-quality review hecho por el mismo agente que el implementer (${run.agent}). Rompe Principio 1.`);
    }
  }
  } finally {
    db.close();
  }
}

console.log(`check-task-reviews (v12.122) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`T en state=done evaluadas: ${evaluated}`);

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`OK. Reviews 2-stage consistentes con spec-tareas en todas las features.`);
  process.exit(0);
}

if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ ${b}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ ${w}`);
}
console.error(`\nFix sugerido: ver ai/protocols/code-review.md.`);
process.exit(strict && blockers.length > 0 ? 1 : 0);

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
