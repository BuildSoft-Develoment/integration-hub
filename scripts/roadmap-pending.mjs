#!/usr/bin/env node
/**
 * roadmap-pending.mjs (v12.139)
 *
 * Agregador de PENDIENTES POR FASE. Responde "¿que falta exactamente en cada
 * fase del roadmap?" en una sola vista organizada, clasificando cada pendiente
 * en: blocker | gate (firma humana) | info.
 *
 * Fuentes de verdad (todas ya existen — esto es capa de agregacion, no de datos):
 *   - ci/scripts/_lib/phase-contracts.mjs : debeValidar + gates + transition por fase.
 *   - ai_action_runs (BD)                 : corridas registradas de validaciones.
 *   - specs/<slug>/traceability.md ## Gates: estado de gates por feature.
 *   - ai_trace_links (BD)                 : cobertura RF -> codigo/test (fases 5/6).
 *
 * Uso:
 *   npm run roadmap:pending
 *   npm run roadmap:pending -- --phase 7
 *   npm run roadmap:pending -- --feature 003-diseno-y-ejecucion-procesos
 *   npm run roadmap:pending -- --json
 *
 * Exit: 0 siempre (es un reporte; no bloquea).
 */

process.removeAllListeners("warning");

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { getAllPhaseContracts, getTransitionRequest } from "../ci/scripts/_lib/phase-contracts.mjs";
import { listIncludedFeatures, isReengineering } from "../ci/scripts/_lib/feature-filter.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const asJson = !!args.json;
const onlyPhase = args.phase != null ? Number(args.phase) : null;
const onlyFeature = args.feature || null;

const specsRoot = join(root, "specs");
const dbPath = join(root, "ai", "memory", "framework-agent.db");
const db = existsSync(dbPath) ? new DatabaseSync(dbPath) : null;

// ── Helpers ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      out[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}

// Convierte un comando del contrato (debeValidar) al action_id de ai_action_runs.
// Misma logica que ai-framework-agent.mjs > npmCommandToActionId.
function commandToActionId(cmd) {
  const m = String(cmd).match(/npm run ([a-z][a-z0-9:-]+)/i);
  if (!m) return null;
  const s = m[1];
  const MEMORY = { "memory:sync": "sync-memory", "memory:harvest-trace": "harvest-trace", "memory:index": "index-docs", "memory:embed": "embed-docs", "memory:context": "regenerate-context" };
  if (MEMORY[s]) return MEMORY[s];
  if (s.startsWith("check:")) return "check-" + s.slice("check:".length);
  if (s.startsWith("generate:")) return "generate-" + s.slice("generate:".length);
  return s.replace(/:/g, "-");
}

function lastRunExit(actionId) {
  if (!db || !actionId) return undefined;
  try {
    const r = db.prepare("SELECT exit_code FROM ai_action_runs WHERE action_id = ? ORDER BY started_at DESC LIMIT 1").get(actionId);
    return r ? r.exit_code : undefined;
  } catch { return undefined; }
}

// {feature: {gate: estado}} desde specs/<slug>/traceability.md ## Gates.
function loadGateStatus(features) {
  const map = {};
  for (const slug of features) {
    const p = join(specsRoot, slug, "traceability.md");
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    const sec = text.match(/##\s+Gates\s*\n([\s\S]*?)(?=\n##\s|$)/i);
    if (!sec) continue;
    const gates = {};
    for (const line of sec[1].split("\n")) {
      const m = line.match(/^\|\s*(gate-[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|/i);
      if (m) gates[m[1].toLowerCase()] = m[2].trim().toLowerCase();
    }
    map[slug] = gates;
  }
  return map;
}

function tracedCodes(relation) {
  if (!db) return new Set();
  try {
    return new Set(db.prepare("SELECT DISTINCT target_ref FROM ai_trace_links WHERE origin = 'source-harvest' AND relation = ?").all(relation).map((r) => r.target_ref));
  } catch { return new Set(); }
}

// RFs declarados con codigo/test en la matriz, por feature.
function declaredRf(targetType) {
  if (!db) return [];
  try {
    return db.prepare(
      `SELECT DISTINCT source_ref AS rf, source_file AS sf FROM ai_trace_links
       WHERE source_type IN ('RF','origen','requerimiento') AND target_type = ?
         AND link_status IN ('implemented','validated')`,
    ).all(targetType).map((r) => ({ rf: r.rf, feature: (r.sf || "").match(/specs\/([^/]+)\//)?.[1] || "?" }));
  } catch { return []; }
}

// ── Computo de pendientes por fase ───────────────────────────────────────────
let features = listIncludedFeatures(root);
if (onlyFeature) features = features.filter((s) => s.startsWith(onlyFeature));
const allReeng = features.length > 0 && features.every((s) => isReengineering(s, specsRoot));
const gateStatus = loadGateStatus(features);
const tracedTrace = tracedCodes("trazado-en");   // @trace (codigo)
const tracedCovers = tracedCodes("cubre-test");   // @covers (test)

const report = [];
for (const c of getAllPhaseContracts()) {
  if (onlyPhase != null && c.id !== onlyPhase) continue;
  const items = [];

  // Fase 2 N/A si todas las features son reingenieria.
  const phase2NA = c.id === 2 && allReeng;

  if (!phase2NA) {
    // 1) Validaciones (debeValidar) sin registro / fallidas.
    for (const cmd of (c.debeValidar || [])) {
      const aid = commandToActionId(cmd);
      if (!aid) continue; // texto libre sin action_id
      const exit = lastRunExit(aid);
      if (exit === undefined) items.push({ kind: "validation", severity: "info", item: cmd.split("  ")[0].trim(), detail: "sin corrida registrada" });
      else if (exit !== 0) items.push({ kind: "validation", severity: "blocker", item: cmd.split("  ")[0].trim(), detail: `ultima corrida fallo (exit ${exit})` });
    }

    // 2) Gates de la fase pendientes (no approved).
    const transition = getTransitionRequest(c.id);
    const owner = transition?.approver || "humano";
    for (const gate of (c.gates || [])) {
      const featsWith = features.filter((s) => gateStatus[s] && gate in gateStatus[s]);
      if (featsWith.length === 0) {
        items.push({ kind: "gate", severity: "gate", item: gate, detail: `pendiente (gate de transicion; aprueba: ${owner})` });
      } else {
        const pend = featsWith.filter((s) => gateStatus[s][gate] !== "approved");
        if (pend.length > 0) items.push({ kind: "gate", severity: "gate", item: gate, detail: `pendiente en ${pend.length}/${featsWith.length} feature(s) — aprueba: ${owner}` });
      }
    }

    // 3) Huecos de RF (fase 5: codigo sin @trace; fase 6: test sin @covers).
    if (c.id === 5) {
      for (const { rf, feature } of declaredRf("codigo")) {
        if (onlyFeature && !feature.startsWith(onlyFeature)) continue;
        if (!tracedTrace.has(rf)) items.push({ kind: "rf", severity: "blocker", item: `${rf} (${feature})`, detail: "declarado con Codigo pero sin @trace en codigo" });
      }
    }
    if (c.id === 6) {
      for (const { rf, feature } of declaredRf("test")) {
        if (onlyFeature && !feature.startsWith(onlyFeature)) continue;
        if (!tracedCovers.has(rf)) items.push({ kind: "rf", severity: "blocker", item: `${rf} (${feature})`, detail: "declarado con Test pero sin @covers en tests" });
      }
    }
  }

  report.push({ phase: c.id, name: c.name, na: phase2NA, items });
}
if (db) db.close();

// ── Salida ────────────────────────────────────────────────────────────────
if (asJson) {
  console.log(JSON.stringify({ root, features: features.length, phases: report }, null, 2));
  process.exit(0);
}

const ICON = { blocker: "✗", gate: "🔒", info: "◦" };
let totalBlocker = 0, totalGate = 0, totalInfo = 0;
console.log("ROADMAP PENDING — pendientes por fase");
console.log("=====================================");
console.log(`Features: ${features.length}${onlyFeature ? ` (filtro: ${onlyFeature})` : ""}\n`);
for (const ph of report) {
  if (ph.na) { console.log(`Fase ${ph.phase} (${ph.name}) — ⊘ N/A (reingenieria)`); continue; }
  if (ph.items.length === 0) { console.log(`Fase ${ph.phase} (${ph.name}) — ✓ sin pendientes`); continue; }
  console.log(`Fase ${ph.phase} (${ph.name}) — ${ph.items.length} pendiente(s):`);
  for (const it of ph.items) {
    console.log(`   ${ICON[it.severity] || "•"} [${it.kind}] ${it.item} — ${it.detail}`);
    if (it.severity === "blocker") totalBlocker++; else if (it.severity === "gate") totalGate++; else totalInfo++;
  }
}
console.log(`\nResumen: ${totalBlocker} blocker · ${totalGate} gate (firma humana) · ${totalInfo} info (sin registro)`);
console.log(`Leyenda: ✗ blocker (el agente puede resolver) · 🔒 gate (requiere firma humana) · ◦ info (validacion sin corrida registrada)`);
process.exit(0);
