#!/usr/bin/env node
/**
 * preset.mjs (v12.113)
 *
 * Lista, muestra y valida presets bajo presets/{projects,brands}/. Los presets son
 * JSON simples; este script es un descubridor + validador minimo, NO un aplicador
 * automatico (aplicar = editar template.config.json del proyecto, una decision
 * humana — Principio 1).
 *
 * Uso:
 *   node scripts/preset.mjs list                # lista todos
 *   node scripts/preset.mjs list projects       # solo projects
 *   node scripts/preset.mjs list brands         # solo brands
 *   node scripts/preset.mjs show saas-backoffice
 *   node scripts/preset.mjs validate            # valida sintaxis de todos
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const presetsRoot = join(root, "presets");

const argv = process.argv.slice(2);
const cmd = argv[0] || "list";

if (cmd === "help" || cmd === "--help" || cmd === "-h") {
  printHelp();
  process.exit(0);
}

if (!existsSync(presetsRoot)) {
  console.error(`Error: no existe ${presetsRoot}.`);
  process.exit(1);
}

const KINDS = ["projects", "brands"];

if (cmd === "list") {
  const filterKind = argv[1] || null;
  for (const kind of KINDS) {
    if (filterKind && filterKind !== kind) continue;
    const dir = join(presetsRoot, kind);
    if (!existsSync(dir)) continue;
    console.log(`\n${kind}:`);
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    if (files.length === 0) { console.log(`  (vacio)`); continue; }
    for (const f of files) {
      try {
        const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
        console.log(`  ${(p.name || f.replace(/\.json$/, "")).padEnd(24)} ${p.description || ""}`);
      } catch (e) {
        console.log(`  ${f} (JSON invalido: ${e.message})`);
      }
    }
  }
  process.exit(0);
}

if (cmd === "show") {
  const name = argv[1];
  if (!name) { console.error("Falta nombre. Uso: preset.mjs show <name>"); process.exit(1); }
  const hit = find(name);
  if (!hit) { console.error(`Preset "${name}" no encontrado.`); process.exit(1); }
  console.log(`# ${hit.kind}/${hit.file}`);
  console.log(readFileSync(hit.path, "utf8"));
  process.exit(0);
}

if (cmd === "validate") {
  let total = 0;
  let bad = 0;
  for (const kind of KINDS) {
    const dir = join(presetsRoot, kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      total += 1;
      try {
        const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
        const probs = validatePreset(kind, p);
        if (probs.length === 0) {
          console.log(`✓ ${kind}/${f}`);
        } else {
          bad += 1;
          console.error(`✗ ${kind}/${f}`);
          for (const x of probs) console.error(`    - ${x}`);
        }
      } catch (e) {
        bad += 1;
        console.error(`✗ ${kind}/${f}: JSON invalido (${e.message})`);
      }
    }
  }
  console.log(`\nTotal: ${total}   Invalidos: ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

console.error(`Comando desconocido: ${cmd}`);
printHelp();
process.exit(1);

// ─────────────────────────────────────────────────────────────────────────
function find(name) {
  for (const kind of KINDS) {
    const dir = join(presetsRoot, kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const stem = f.replace(/\.json$/, "");
      if (stem === name) return { kind, file: f, path: join(dir, f) };
      try {
        const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
        if (p.name === name) return { kind, file: f, path: join(dir, f) };
      } catch { /* skip */ }
    }
  }
  return null;
}

function validatePreset(kind, p) {
  const out = [];
  if (!p.name || typeof p.name !== "string") out.push(`falta 'name' (string)`);
  if (!p.description || typeof p.description !== "string") out.push(`falta 'description' (string)`);
  if (kind === "brands") {
    if (typeof p.brand_hue !== "number" || p.brand_hue < 0 || p.brand_hue > 360) out.push(`brand_hue debe ser numero 0-360`);
    if (typeof p.brand_saturation !== "number" || p.brand_saturation < 0 || p.brand_saturation > 100) out.push(`brand_saturation debe ser numero 0-100`);
  }
  if (kind === "projects") {
    if (!p.stack || typeof p.stack !== "object") out.push(`falta 'stack' (object)`);
    if (!Array.isArray(p.default_features)) out.push(`'default_features' debe ser array`);
  }
  return out;
}

function printHelp() {
  console.log(`preset.mjs (v12.113) — descubridor de presets bajo presets/{projects,brands}/.

Uso:
  node scripts/preset.mjs list [projects|brands]
  node scripts/preset.mjs show <name>
  node scripts/preset.mjs validate

Aplicar un preset = decision humana: copia los campos al template.config.json del
proyecto y commit. Este script NO lo hace por ti (Principio 1 — anti-auto-aprobacion).
`);
}
