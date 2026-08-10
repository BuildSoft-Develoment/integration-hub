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
 * La fase se resuelve de --phase, de roadmap:next, de los gates de la feature o, si no hay tarea
 * activa, de una constante de partida. El origen viaja en `phase_source`, y cuando es la constante
 * las rutas prohibidas NO bloquean: el veredicto dependeria de un supuesto, no de un hecho.
 * `gate_self_approved` si bloquea siempre — no depende de en que fase estemos.
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
//
// De donde sale la fase importa tanto como la fase: "2" porque roadmap:next prioriza una tarea en
// fase 2 y "2" porque no hay ninguna tarea y esa es la constante de partida son cosas distintas.
// El origen lo declara SIEMPRE quien calcula el valor, nunca la rama del if: etiquetarlo por rama
// hacia que un fallo de roadmap:next (script ausente, exit != 0, JSON ilegible) devolviera la
// constante disfrazada de "roadmap:next" — y asi SI bloqueaba.
let phaseSource;
let phase = typeof args.phase !== "undefined" ? Number(args.phase) : null;
if (phase != null && !Number.isNaN(phase)) {
  phaseSource = "explicita";
} else {
  const next = getRoadmapNext();
  if (feature == null) feature = next?.feature || null;
  if (typeof next?.phase === "number" && next.phase >= 0) {
    phase = next.phase;
    phaseSource = "roadmap:next";
  } else {
    // roadmap:next devuelve -1 por DOS motivos distintos: no queda nada pendiente, o estan todas
    // las features tomadas por un lock. El segundo es el estado NORMAL mientras se trabaja
    // (roadmap:claim lo pone), y tratarlo como "no hay tarea" apagaba la politica de rutas justo
    // durante la fase de construccion: una migracion prohibida salia como aviso y exit 0.
    if (feature == null) feature = featureDeLock();
    ({ phase, source: phaseSource } = inferPhaseForFeature(feature));
  }
}
const faseConocida = phaseSource !== "por-defecto";

// 2. touch_policy de la fase (con slug interpolado).
const touch = getTouchPolicy(phase, feature || undefined, root);

// 3. Archivos tocados.
const changed = getChangedFiles(base);

// 4. Evaluar.
const violations = [];
const warnings = [];

for (const file of changed) {
  const inForbidden = matchAny(file, touch.forbidden_paths);
  const inAllowed = matchAny(file, touch.allowed_paths);
  if (inForbidden) {
    // Si la fase no se determino, esto NO bloquea. "Tocaste algo que la fase 2 prohibe" no
    // significa nada cuando nadie ha dicho que estemos en la fase 2: el veredicto saldria de una
    // constante, y de hecho cambia — el mismo arbol de trabajo pasa en las fases 5 y 6 y falla en
    // las otras siete. Un exit 1 tiene que apoyarse en algo que el audit sepa, no en un supuesto.
    const donde = faseConocida ? violations : warnings;
    donde.push({ type: "forbidden_path_modified", path: file, detail: `archivo en touch_policy.forbidden_paths para fase ${phase}${faseConocida ? "" : " (fase POR DEFECTO, no determinada: esto NO bloquea — ver el motivo con --format text)"}` });
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
  phase_source: phaseSource,
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

/**
 * La feature que este agente esta trabajando, deducida de los locks activos.
 *
 * Existe porque `roadmap:next` devuelve -1 cuando TODAS las features estan tomadas, que es el
 * estado corriente en cuanto alguien hace `roadmap:claim`. Sin esto, el audit se quedaba sin
 * feature y sin fase justo mientras se construye, que es cuando la politica de rutas mas importa.
 * Con `--agent` se desempata a favor del lock propio; con un solo lock no hace falta desempatar.
 */
function featureDeLock() {
  const activos = listLocks(root).filter((l) => !l.expired);
  if (activos.length === 0) return null;
  if (args.agent) {
    const mio = activos.find((l) => String(l.agent) === String(args.agent));
    if (mio) return mio.feature;
  }
  return activos.length === 1 ? activos[0].feature : null;
}

/**
 * Devuelve { phase, source }. El origen lo decide QUIEN calcula el valor: si ningun gate matchea,
 * el 2 que sale de aqui es la constante de partida y hay que decirlo, no presentarlo como inferido.
 */
function inferPhaseForFeature(slug) {
  const PARTIDA = { phase: 2, source: "por-defecto" };
  if (!slug) return PARTIDA;
  const tracePath = join(root, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) return PARTIDA;
  const text = readFileSync(tracePath, "utf8");
  const has = (g) => new RegExp(`\\|\\s*${g}\\s*\\|\\s*approved\\b`, "i").test(text);
  const deGate = (phase) => ({ phase, source: "inferida-de-gates" });
  if (has("gate-operations-ready")) return deGate(8);
  if (has("gate-deploy-ready")) return deGate(7);
  if (has("gate-qa-passed")) return deGate(6);
  if (has("gate-build-ready")) return deGate(5);
  if (has("gate-sdd-approved")) return deGate(4);
  return PARTIDA;
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
  console.log(`Fase:           ${r.phase}  [${r.phase_source}]`);
  if (r.phase_source === "por-defecto") {
    const tomadas = listLocks(root).filter((l) => !l.expired);
    console.log(`                ATENCION: la fase no se determino; esta es la de partida, y por eso`);
    console.log(`                las rutas prohibidas salen como AVISO y no bloquean.`);
    if (tomadas.length > 1) {
      console.log(`                Causa: hay ${tomadas.length} features tomadas y no se puede saber cual`);
      console.log(`                auditas. Desempata con --agent <tu-nombre> o con --feature <slug>.`);
    } else if (r.feature) {
      console.log(`                Causa: '${r.feature}' no tiene ningun gate approved todavia.`);
    } else {
      console.log(`                Causa: no hay tarea activa ni lock que la senale. Usa --phase N`);
      console.log(`                o --feature <slug> para auditar contra algo concreto.`);
    }
  }
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
