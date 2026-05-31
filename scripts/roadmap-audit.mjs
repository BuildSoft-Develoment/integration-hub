#!/usr/bin/env node
/**
 * roadmap-audit.mjs (v12.63)
 *
 * Cierra el lazo del contrato de ejecucion: DESPUES de que un agente trabajo,
 * verifica que respeto el contrato de su fase. touch_policy sin auditoria es
 * teatro — este comando es lo que la vuelve enforzable.
 *
 * Verifica:
 *   1. forbidden_path_modified — toco un archivo de touch_policy.forbidden_paths.
 *   2. outside_touch_policy     — toco un archivo fuera de allowed Y de forbidden (warning).
 *   3. gate_self_approved       — un gate quedo 'approved' firmado por agente/IA
 *                                 (traceability.md ## Gates) o revision visual humana
 *                                 'approved' por un revisor no-humano (prototype-validation.md).
 *   4. missing_session_log      — hubo cambios pero SESSION_LOG.md no se actualizo (warning).
 *
 * El conjunto de archivos "tocados" sale de git:
 *   - default: working tree (staged + unstaged + untracked) — lo que el agente acaba de hacer.
 *   - --base <ref>: diff <ref>...HEAD (util en CI / post-merge).
 *
 * La fase + touch_policy salen de:
 *   - --feature <slug>: se infiere la fase de esa feature por sus gates.
 *   - sin --feature: se usa la tarea que roadmap:next prioriza (next.feature + next.phase).
 *
 * Uso:
 *   npm run roadmap:audit                          # audita working tree vs tarea recomendada
 *   npm run roadmap:audit -- --feature 002-...      # audita contra una feature concreta
 *   npm run roadmap:audit -- --base origin/main     # audita un rango de commits
 *   npm run roadmap:audit -- --format text          # salida legible
 *
 * Exit codes:
 *   0 - sin violaciones (puede haber warnings).
 *   1 - hay violaciones (forbidden_path / gate_self_approved) -> falla.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { listIncludedFeatures } from "../ci/scripts/_lib/feature-filter.mjs";
import { getTouchPolicy } from "../ci/scripts/_lib/phase-contracts.mjs";
import { matchAny } from "../ci/scripts/_lib/glob-match.mjs";
import { listLocks } from "../ci/scripts/_lib/agent-locks.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const base = args.base || null;
const format = args.format || "json";
let feature = args.feature || null;

// Revisores/aprobadores que NO cuentan como humano (espejo anti self-approval).
const NON_HUMAN = /\b(agente|agent|ia\b|a\.?i\.?|claude|gpt|codex|copilot|gemini|cursor|opencode|bot|automatico|automatic|sistema|script)\b/i;

// 1. Resolver fase + feature objetivo.
let phase = typeof args.phase !== "undefined" ? Number(args.phase) : null;
if (feature == null || phase == null) {
  const next = getRoadmapNext();
  if (feature == null) feature = next?.feature || null;
  if (phase == null) phase = typeof next?.phase === "number" ? next.phase : inferPhaseForFeature(feature);
}
if (phase == null || phase < 0) phase = inferPhaseForFeature(feature);

// 2. touch_policy de la fase (con slug interpolado).
const touch = getTouchPolicy(phase, feature || undefined);

// 3. Archivos tocados.
const changed = getChangedFiles(base);

// 4. Evaluar.
const violations = [];
const warnings = [];

for (const file of changed) {
  const inForbidden = matchAny(file, touch.forbidden_paths);
  const inAllowed = matchAny(file, touch.allowed_paths);
  if (inForbidden) {
    violations.push({ type: "forbidden_path_modified", path: file, detail: `archivo en touch_policy.forbidden_paths para fase ${phase}` });
  } else if (!inAllowed) {
    warnings.push({ type: "outside_touch_policy", path: file, detail: `fuera de allowed_paths de fase ${phase} (revisar si corresponde a esta tarea)` });
  }
}

// 5. Gate self-approval (en todas las features incluidas o solo la objetivo).
const featuresToScan = feature ? [feature] : listIncludedFeatures(root);
for (const slug of featuresToScan) {
  violations.push(...detectGateSelfApproval(slug));
}

// 6. Bitacora.
const hasMeaningfulChange = changed.some((f) => !/^(AI_CONTEXT\.md|ROADMAP_STATE\.json)$/.test(f));
if (hasMeaningfulChange && !changed.includes("SESSION_LOG.md")) {
  warnings.push({ type: "missing_session_log", path: "SESSION_LOG.md", detail: "hubo cambios pero SESSION_LOG.md no se actualizo (deja bitacora de la sesion)." });
}

// v12.76: locks huerfanos/expirados (multiagente).
for (const lk of listLocks(root)) {
  if (lk.expired) {
    warnings.push({ type: "orphan-lock", path: `ai/locks/${lk.feature}.lock.json`, detail: `lock expirado de '${lk.agent}' (expiro ${lk.expires_at}). Libera con: npm run roadmap:release -- --prune` });
  }
}

const result = violations.length === 0 ? "passed" : "failed";
const report = {
  result,
  feature: feature || null,
  phase,
  base: base || "working-tree",
  changed_files: changed.length,
  touch_policy: touch,
  violations,
  warnings,
};

if (format === "text") {
  printText(report);
} else {
  console.log(JSON.stringify(report, null, 2));
}

process.exit(result === "failed" ? 1 : 0);

// ─────────────────────────────────────────────────────────────────────────
function getRoadmapNext() {
  const nextScript = join(root, "scripts", "roadmap-next.mjs");
  if (!existsSync(nextScript)) return null;
  const r = spawnSync(process.execPath, [nextScript, "--root", root], { encoding: "utf8", timeout: 15000 });
  if (r.status !== 0 || !r.stdout) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}

function inferPhaseForFeature(slug) {
  if (!slug) return 2;
  const tracePath = join(root, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) return 2;
  const text = readFileSync(tracePath, "utf8");
  const has = (g) => new RegExp(`\\|\\s*${g}\\s*\\|\\s*approved\\b`, "i").test(text);
  if (has("gate-operations-ready")) return 8;
  if (has("gate-deploy-ready")) return 7;
  if (has("gate-qa-passed")) return 6;
  if (has("gate-build-ready")) return 5;
  if (has("gate-sdd-approved")) return 4;
  return 2;
}

function getChangedFiles(baseRef) {
  const out = new Set();
  const run = (cmdArgs) => {
    const r = spawnSync("git", cmdArgs, { encoding: "utf8", cwd: root, timeout: 15000 });
    if (r.status === 0 && r.stdout) {
      for (const line of r.stdout.split(/\r?\n/)) {
        const f = line.trim();
        if (f) out.add(f.replace(/\\/g, "/"));
      }
    }
  };
  if (baseRef) {
    run(["diff", "--name-only", `${baseRef}...HEAD`]);
  } else {
    run(["diff", "--name-only", "HEAD"]);          // staged + unstaged vs HEAD
    run(["ls-files", "--others", "--exclude-standard"]); // untracked
  }
  return [...out];
}

function detectGateSelfApproval(slug) {
  const found = [];
  // a) traceability.md ## Gates: fila approved con Aprobador no-humano.
  const tracePath = join(root, "specs", slug, "traceability.md");
  if (existsSync(tracePath)) {
    const text = readFileSync(tracePath, "utf8");
    const m = text.match(/##\s+Gates\s*\n([\s\S]*?)(?=\n##\s|\n$|$)/i);
    if (m) {
      const rows = m[1].split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s-]+\|/.test(l));
      for (const row of rows.slice(1)) {
        const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (cells.length < 3) continue;
        const [gate, estado, aprobador] = cells;
        if (/^(approved|aprobado)$/i.test(estado) && aprobador && NON_HUMAN.test(aprobador)) {
          found.push({ type: "gate_self_approved", gate, path: `specs/${slug}/traceability.md`, detail: `gate '${gate}' approved con Aprobador no-humano '${aprobador}'` });
        }
      }
    }
  }
  // b) prototype-validation.md: revision visual humana approved por revisor no-humano.
  const valPath = join(root, "specs", slug, "prototype-validation.md");
  if (existsSync(valPath)) {
    const val = readFileSync(valPath, "utf8");
    const sec = val.match(/##\s*Revision\s+visual\s+humana([\s\S]*?)(?=\n##\s|$)/i);
    if (sec) {
      const body = sec[1];
      const result = (body.match(/Resultado\s*:\s*(approved|aprobado)/i) || [])[1];
      const reviewer = ((body.match(/Revisor\s*:\s*(.+)/i) || [])[1] || "").trim();
      if (result && reviewer && NON_HUMAN.test(reviewer)) {
        found.push({ type: "gate_self_approved", gate: "gate-prototype-human-visual-review", path: `specs/${slug}/prototype-validation.md`, detail: `revision visual 'approved' por revisor no-humano '${reviewer}'` });
      }
    }
  }
  return found;
}

function printText(r) {
  console.log(`\nROADMAP AUDIT (v12.63)`);
  console.log(`======================`);
  console.log(`Feature:        ${r.feature || "(transversal)"}`);
  console.log(`Fase:           ${r.phase}`);
  console.log(`Base:           ${r.base}`);
  console.log(`Archivos tocados: ${r.changed_files}`);
  console.log(`Resultado:      ${r.result === "passed" ? "✓ PASSED" : "✗ FAILED"}`);
  if (r.violations.length > 0) {
    console.log(`\nViolaciones (${r.violations.length}):`);
    for (const v of r.violations) console.log(`  ✗ [${v.type}] ${v.path || v.gate}: ${v.detail}`);
  }
  if (r.warnings.length > 0) {
    console.log(`\nWarnings (${r.warnings.length}):`);
    for (const w of r.warnings) console.log(`  ⚠ [${w.type}] ${w.path}: ${w.detail}`);
  }
  if (r.violations.length === 0 && r.warnings.length === 0) {
    console.log(`\nOK. El trabajo respeto el contrato de la fase ${r.phase}.`);
  }
  console.log(``);
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
