#!/usr/bin/env node
/**
 * check-trace-scope.mjs
 *
 * Mide cuanta de la trazabilidad codigo->requisito identifica DE QUE FEATURE es el requisito.
 *
 * EL PROBLEMA QUE MIDE
 * Los RF se numeran por spec: `RF-006` designa cosas distintas en siete features a la vez. Una
 * anotacion desnuda (`// @covers RF-006`) certifica el codigo, pero no dice de cual de las siete, asi
 * que los gates que preguntan "¿esta cubierto el RF-006 de la feature X?" respondian que si para las
 * ocho. Un verde que no significaba nada.
 *
 * La forma cualificada -`// @covers spec 004-observabilidad-y-auditoria RF-006`- si lo dice, y es la
 * que la casa ya usaba en 162 sitios. Este script cuenta cuantas quedan por migrar.
 *
 * NO BLOQUEA (exit 0 siempre). Es un medidor de progreso: sirve para que el numero baje y para que
 * nadie confunda "el panel esta verde" con "la cobertura esta probada". Cuando llegue a cero, tiene
 * sentido convertirlo en bloqueante y retirar el fallback de roadmap-pending.
 *
 * Uso: node ci/scripts/check-trace-scope.mjs [--list]
 */

process.removeAllListeners("warning");

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const root = resolve(process.argv.includes("--root") ? process.argv[process.argv.indexOf("--root") + 1] : ".");
const dbPath = join(root, "ai", "memory", "framework-agent.db");
if (!existsSync(dbPath)) {
  console.log("check-trace-scope: N/A (sin ai/memory/framework-agent.db; corre memory:sync).");
  process.exit(0);
}

const db = new DatabaseSync(dbPath);
const rows = db.prepare(
  `SELECT target_ref, target_scope, source_ref, relation
     FROM ai_trace_links
    WHERE origin = 'source-harvest' AND target_type IN ('RF','RNF')`,
).all();

const total = rows.length;
const conScope = rows.filter((r) => r.target_scope).length;
const sinScope = total - conScope;

console.log("check-trace-scope");
console.log(`Anotaciones de codigo hacia RF/RNF: ${total}`);
console.log(`  con feature (\`spec <slug>\`): ${conScope}` + (total ? `  (${Math.round((conScope * 100) / total)}%)` : ""));
console.log(`  sin cualificar:              ${sinScope}` + (total ? `  (${Math.round((sinScope * 100) / total)}%)` : ""));

if (sinScope > 0) {
  // Los codigos que MAS se repiten entre features son los que mas dano hacen: son los que un gate
  // scope-ciego da por cubiertos en todas.
  const porCodigo = {};
  for (const r of rows) {
    if (r.target_scope) continue;
    porCodigo[r.target_ref] = (porCodigo[r.target_ref] || 0) + 1;
  }
  const top = Object.entries(porCodigo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log("\n  Codigos sin cualificar que mas se repiten (los mas ambiguos):");
  for (const [cod, n] of top) console.log(`    ${String(n).padStart(4)}  ${cod}`);

  if (process.argv.includes("--list")) {
    console.log("\n  Ficheros con anotaciones sin cualificar:");
    const files = [...new Set(rows.filter((r) => !r.target_scope).map((r) => r.source_ref))].sort();
    for (const f of files) console.log(`    ${f}`);
  } else {
    console.log("\n  (--list para ver los ficheros)");
  }
  console.log("\n  Migracion: anteponer `spec <slug>` al codigo, p.ej.");
  console.log("    // @covers spec 004-observabilidad-y-auditoria RF-006 (...)");
}

process.exit(0);
