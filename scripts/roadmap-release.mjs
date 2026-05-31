#!/usr/bin/env node
/**
 * roadmap-release.mjs (v12.76)
 *
 * Libera el lock de una feature al terminar de trabajarla.
 *
 * Uso:
 *   npm run roadmap:release -- --feature 002-... --agent codex
 *   npm run roadmap:release -- --feature 002-... --agent codex --force  # libera aunque sea de otro
 *   npm run roadmap:release -- --prune                                  # borra todos los locks expirados
 *
 * Exit codes: 0 liberada/sin cambios; 1 el lock es de otro agente (sin --force).
 */

import { resolve } from "node:path";
import { release, pruneExpired } from "../ci/scripts/_lib/agent-locks.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");

if (args.prune) {
  const n = pruneExpired(root);
  console.log(`✓ Locks expirados purgados: ${n}`);
  process.exit(0);
}
if (!args.feature) {
  console.error("Uso: npm run roadmap:release -- --feature <slug> --agent <nombre> [--force]  |  --prune");
  process.exit(1);
}
const r = release(root, String(args.feature), args.agent ? String(args.agent) : null, { force: !!args.force });
if (!r.ok) {
  console.error(`✗ ${r.error}`);
  process.exit(1);
}
if (r.noop) console.log(`(sin cambios) ${args.feature} no tenia lock.`);
else console.log(`✓ Liberada: ${args.feature}${r.was && r.was.agent ? " (era de " + r.was.agent + ")" : ""}`);
process.exit(0);

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
