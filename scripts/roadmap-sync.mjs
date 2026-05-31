#!/usr/bin/env node
/**
 * roadmap-sync.mjs (v12.57)
 *
 * Genera/actualiza ROADMAP_STATE.json en la raiz del proyecto con el estado
 * consolidado del roadmap. Util para CI, dashboards externos, integraciones
 * con Backstage, y para que un agente lea el estado sin shell-exec.
 *
 * Estructura del JSON (versionada):
 *   {
 *     "version": "12.57",
 *     "generated_at": "2026-05-18T10:00:00.000Z",
 *     "project": "<name>",
 *     "template_version": "v12.57.0",
 *     "phases": [...],          // de roadmap-status
 *     "features": [...],        // con phase, gates enum, agent_readiness
 *     "dependencies": [...],    // grafo de dependencias entre features
 *     "blockers": [...],
 *     "next_action": {...}      // de roadmap-next
 *   }
 *
 * Uso:
 *   npm run roadmap:sync                    # genera/actualiza ROADMAP_STATE.json
 *   npm run roadmap:sync -- --dry-run       # solo imprime, no escribe
 *   npm run roadmap:sync -- --check         # exit 1 si el archivo esta desactualizado
 *
 * Exit codes:
 *   0 - archivo escrito/sin cambios.
 *   1 - error al generar.
 *   2 - en modo --check, ROADMAP_STATE.json esta desactualizado.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { refreshPhaseDocZones } from "../ci/scripts/_lib/doc-autozones.mjs";
import { listLocks } from "../ci/scripts/_lib/agent-locks.mjs";
import { resolveStrict } from "../ci/scripts/_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dryRun = !!args["dry-run"];
const checkMode = !!args.check;
// v12.78: en --check, por defecto WARN (exit 0) si falta/stale para no romper
// pipelines ni clones frescos; con --strict / CHECK_STRICT=1 BLOQUEA (exit 2).
const strictCheck = resolveStrict(args, false);

const outPath = join(root, "ROADMAP_STATE.json");

// 1. Obtener roadmap-status.
const statusResult = spawnSync(process.execPath, [join(root, "scripts", "roadmap-status.mjs"), "--json", "--root", root], { encoding: "utf8", timeout: 15000 });
if (statusResult.status !== 0) {
  console.error(`Error: roadmap-status fallo. stderr:`);
  console.error(statusResult.stderr?.slice(0, 500));
  process.exit(1);
}
const status = JSON.parse(statusResult.stdout);

// 2. Obtener roadmap-next.
let next = null;
const nextScript = join(root, "scripts", "roadmap-next.mjs");
if (existsSync(nextScript)) {
  const nextResult = spawnSync(process.execPath, [nextScript, "--root", root], { encoding: "utf8", timeout: 15000 });
  if (nextResult.status === 0) {
    try { next = JSON.parse(nextResult.stdout); } catch { next = null; }
  }
}

// 3. Obtener dependencies (parsing simple — sin shell-exec adicional).
const dependencies = collectDependencies();

// 4. Construir el snapshot consolidado.
let projectName = "(unknown)";
let templateVersion = "(unknown)";
try {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  projectName = pkg.name || "(unnamed)";
  templateVersion = pkg.version ? `v${pkg.version}` : "(unversioned)";
} catch { /* ignore */ }

const state = {
  version: "12.62",
  generated_at: new Date().toISOString(),
  project: projectName,
  template_version: templateVersion,
  phases: status.phases || [],
  features: status.features || [],
  prototype_states: status.prototypeStates || null, // v12.62: semaforo + avance 2→3
  dependencies,
  blockers: status.blockers || [],
  next_action: next,
};

const stateText = JSON.stringify(state, null, 2) + "\n";

if (dryRun) {
  console.log(stateText);
  console.error(`\n(dry-run) NO se escribio ${outPath.replace(root, "<root>")}`);
  process.exit(0);
}

if (checkMode) {
  const suffix = strictCheck ? "" : " (warning — usa --strict / CHECK_STRICT=1 para bloquear)";
  if (!existsSync(outPath)) {
    console.error(`check-mode: ROADMAP_STATE.json no existe. Corre 'npm run roadmap:sync' para generarlo.${suffix}`);
    process.exit(strictCheck ? 2 : 0);
  }
  const existing = readFileSync(outPath, "utf8");
  // Comparar ignorando generated_at (siempre cambia).
  const normalize = (s) => s.replace(/"generated_at":\s*"[^"]+"/, '"generated_at":"X"');
  if (normalize(existing) === normalize(stateText)) {
    console.log(`check-mode: ROADMAP_STATE.json al dia.`);
    process.exit(0);
  }
  console.error(`check-mode: ROADMAP_STATE.json desactualizado. Corre 'npm run roadmap:sync'.${suffix}`);
  process.exit(strictCheck ? 2 : 0);
}

writeFileSync(outPath, stateText, "utf8");
console.log(`OK. ${outPath.replace(root, "<root>")} regenerado (${stateText.length} bytes).`);
console.log(`Features: ${state.features.length} · Phases: ${state.phases.length} · Dependencies: ${dependencies.length} · Blockers: ${state.blockers.length}`);

// v12.67: refrescar zonas de estado vivo en docs de fase (00.02/00.03/01.01).
try {
  const zoneResults = refreshPhaseDocZones(root, status);
  const updated = zoneResults.filter((r) => r.updated).map((r) => r.file);
  if (updated.length > 0) {
    console.log(`Docs de fase con estado vivo actualizado (${updated.length}):`);
    for (const f of updated) console.log(`  ~ ${f}`);
  }
} catch (e) {
  console.error(`(aviso) no se pudieron refrescar zonas de docs de fase: ${String(e.message || e)}`);
}

// v12.76: AGENT_BOARD.md — tablero de coordinacion multiagente.
try {
  const locks = listLocks(root);
  const lockBySlug = {};
  for (const l of locks) if (!l.expired) lockBySlug[l.feature] = l;
  const protoBySlug = {};
  if (status.prototypeStates && status.prototypeStates.features) {
    for (const f of status.prototypeStates.features) protoBySlug[f.slug] = f;
  }
  const boardLines = [
    "# AGENT BOARD",
    "",
    "> Tablero de coordinacion multiagente. Autogenerado por `npm run roadmap:sync`. NO editar a mano.",
    `> Generado: ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    "",
    "| Feature | Fase | Estado prototipo | Lock (agente) | Expira |",
    "|---|:-:|---|---|---|",
  ];
  for (const f of (status.features || [])) {
    const lk = lockBySlug[f.slug];
    const ps = protoBySlug[f.slug];
    boardLines.push(`| ${f.slug} | ${f.phase} | ${ps ? ps.state : "—"} | ${lk ? lk.agent : "libre"} | ${lk ? lk.expires_at : "—"} |`);
  }
  const expired = locks.filter((l) => l.expired);
  if (expired.length > 0) {
    boardLines.push("", `_Locks expirados: ${expired.map((l) => l.feature).join(", ")} — corre \`npm run roadmap:release -- --prune\`._`);
  }
  writeFileSync(join(root, "AGENT_BOARD.md"), boardLines.join("\n") + "\n", "utf8");
  console.log(`AGENT_BOARD.md actualizado (${locks.length} lock(s) activos/expirados).`);
} catch (e) {
  console.error(`(aviso) no se pudo generar AGENT_BOARD.md: ${String(e.message || e)}`);
}

// v12.78: roadmap:sync reescribe zonas vivas de los docs de fase -> la memoria
// (indice/embeddings) queda STALE. Recordatorio para reindexar.
console.log(`\n→ Los docs de fase se actualizaron. Corre 'npm run memory:sync' para reindexar la memoria.`);

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function collectDependencies() {
  const specsRoot = join(root, "specs");
  if (!existsSync(specsRoot)) return [];
  const deps = [];
  let entries;
  try { entries = readdirSync(specsRoot, { withFileTypes: true }); } catch { return []; }
  for (const e of entries) {
    if (!e.isDirectory() || !/^\d{3,}-/.test(e.name)) continue;
    const tracePath = join(specsRoot, e.name, "traceability.md");
    if (!existsSync(tracePath)) continue;
    const text = readFileSync(tracePath, "utf8");
    const m = text.match(/##\s+Dependencias\s*\n([\s\S]*?)(?=\n##\s|\n$|$)/i);
    if (!m) continue;
    const rows = m[1].split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s-]+\|/.test(l));
    for (const row of rows.slice(1)) { // skip header
      const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.length < 3) continue;
      const arrow = cells[0].match(/^\s*(\d{3,}-[a-z0-9-]+)\s*(?:→|->|-->)\s*(\d{3,}-[a-z0-9-]+)/i);
      if (!arrow) continue;
      deps.push({ from: arrow[1], to: arrow[2], type: cells[1].toLowerCase(), reason: cells[2] });
    }
  }
  return deps;
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
