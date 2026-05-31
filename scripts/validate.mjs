#!/usr/bin/env node
/**
 * validate.mjs (v12.89)
 *
 * Equivalente TRAZADO de check:all para humanos/agentes: corre cada validador
 * HOJA (check:* cuyo script es `node ...`) individualmente, mide exit + duracion,
 * y REGISTRA cada corrida en ai_action_runs (origin cli). Asi el semaforo del panel
 * ("Debe validar") refleja las corridas de terminal — antes solo contaban las del
 * panel/agente y todo aparecia "sin registro".
 *
 * Diferencia con `npm run check:all`:
 *   - check:all es composite npm (CI puro, sin tocar la BD), corta al primer fallo.
 *   - validate corre TODOS, no corta, y alimenta el panel (registra cada uno).
 *
 * Uso:
 *   npm run validate            (corre + registra; exit 1 si alguno falla)
 *   npm run validate -- --quiet (menos verboso)
 *
 * Exit: 0 si todos pasan; 1 si alguno falla (como check:all).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);
const root = resolve(argVal("--root") || ".");
const quiet = args.includes("--quiet");

const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) { console.error("validate: no hay package.json en " + root); process.exit(1); }
const scripts = (JSON.parse(readFileSync(pkgPath, "utf8")).scripts) || {};

// Conjunto de check:* ALCANZABLES desde check:all (= check:template + check:project),
// expandiendo composites (valor con `npm run`). Asi validate corre exactamente lo
// mismo que check:all y no validadores sueltos (p.ej. check:instantiation).
function tokensOf(text) { return [...String(text).matchAll(/npm run (check:[a-z0-9:-]+)/g)].map((m) => m[1]); }
const reachable = new Set();
const queue = [...tokensOf(scripts["check:template"]), ...tokensOf(scripts["check:project"])];
while (queue.length) {
  const t = queue.shift();
  if (reachable.has(t)) continue;
  reachable.add(t);
  const val = scripts[t];
  if (val && /npm run /.test(val)) queue.push(...tokensOf(val)); // composite -> expandir
}

// Validadores HOJA alcanzables: check:* cuyo valor ejecuta `node ...`.
const leaves = [...reachable]
  .filter((k) => scripts[k] && /^node\s/.test(String(scripts[k])))
  .sort()
  .map((k) => ({ script: k, actionId: "check-" + k.slice("check:".length), cmd: String(scripts[k]) }));

if (leaves.length === 0) { console.error("validate: no se encontraron validadores hoja check:* en package.json"); process.exit(1); }

console.log(`validate (v12.89) — ${leaves.length} validadores hoja · registrando en ai_action_runs (origin cli)`);

const batch = [];
let failed = 0;
for (const leaf of leaves) {
  // "node ci/scripts/check-x.mjs --flag" -> [ci/scripts/check-x.mjs, --flag]
  const nodeArgs = leaf.cmd.replace(/^node\s+/, "").split(/\s+/);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, nodeArgs, { cwd: root, encoding: "utf8" });
  const ms = Date.now() - t0;
  const exit = r.status == null ? 1 : r.status;
  batch.push({ action: leaf.actionId, exit, ms });
  if (exit !== 0) failed += 1;
  const icon = exit === 0 ? "✓" : "✗";
  if (!quiet || exit !== 0) console.log(`  ${icon} ${leaf.script} (${ms}ms${exit !== 0 ? `, exit ${exit}` : ""})`);
}

// Registrar el batch en la BD (best-effort; no rompe validate si falla).
try {
  const batchFile = join(tmpdir(), `spdd-validate-${Date.now()}.json`);
  writeFileSync(batchFile, JSON.stringify(batch), "utf8");
  const agent = join(root, "scripts", "ai-framework-agent.mjs");
  if (existsSync(agent)) {
    const rec = spawnSync(process.execPath, [agent, "record-run", "--batch", batchFile, "--origin", "cli", "--root", root], { cwd: root, encoding: "utf8" });
    if (!quiet && rec.stdout) process.stdout.write(rec.stdout);
  }
} catch { /* best-effort */ }

const passed = leaves.length - failed;
console.log(`\nvalidate: ${passed}/${leaves.length} OK${failed ? ` · ${failed} con fallo` : ""}. Registrado en el panel (Roadmap → fase → Debe validar).`);
process.exit(failed > 0 ? 1 : 0);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
}
