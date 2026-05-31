#!/usr/bin/env node
/**
 * sync-plantillas.mjs (v12.88)
 *
 * Regenera plantillas/fase-4-sdd/*.md desde la FUENTE UNICA
 * (scripts/_lib/feature-templates.mjs), la misma que usa `scaffold:feature`.
 * Asi la plantilla por-feature no puede divergir de lo que el generador produce.
 *
 * Uso:
 *   node scripts/sync-plantillas.mjs            (escribe)
 *   node scripts/sync-plantillas.mjs --check    (no escribe; exit 1 si hay drift)
 *
 * El modo --check es el que usa ci/scripts/check-plantillas.mjs.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { emitFase4Plantillas } from "./_lib/feature-templates.mjs";

const args = process.argv.slice(2);
const root = resolve(argVal("--root") || ".");
const check = args.includes("--check");

const dir = join(root, "plantillas", "fase-4-sdd");
const emitted = emitFase4Plantillas();
const drift = [];
let written = 0;

for (const [name, content] of Object.entries(emitted)) {
  const p = join(dir, name);
  const current = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (current === content) continue;
  if (check) {
    drift.push(name);
  } else {
    writeFileSync(p, content, "utf8");
    written += 1;
  }
}

if (check) {
  if (drift.length === 0) {
    console.log("OK. plantillas/fase-4-sdd sincronizadas con la fuente unica.");
    process.exit(0);
  }
  console.error(`plantillas/fase-4-sdd DESINCRONIZADAS (${drift.length}): ${drift.join(", ")}`);
  console.error(`Fix: npm run plantillas:sync`);
  process.exit(1);
}

console.log(`plantillas:sync — ${written} archivo(s) regenerado(s) en plantillas/fase-4-sdd/ desde la fuente unica.`);
process.exit(0);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
}
