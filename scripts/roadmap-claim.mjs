#!/usr/bin/env node
/**
 * roadmap-claim.mjs (v12.76)
 *
 * Reclama una feature para un agente IA (lock cooperativo) antes de trabajarla,
 * para que otro agente no tome la misma tarea. El lock vive en
 * ai/locks/<feature>.lock.json con TTL (auto-libera si el agente muere).
 *
 * Uso:
 *   npm run roadmap:claim -- --feature 002-... --agent codex
 *   npm run roadmap:claim -- --feature 002-... --agent codex --task "prototipo" --ttl 120
 *   npm run roadmap:claim -- --feature 002-... --agent codex --force   # roba un lock ajeno
 *
 * Exit codes: 0 reclamada/refrescada; 1 ya tomada por otro (sin --force) o args invalidos.
 */

import { resolve } from "node:path";
import { claim } from "../ci/scripts/_lib/agent-locks.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
if (!args.feature || !args.agent) {
  console.error("Uso: npm run roadmap:claim -- --feature <slug> --agent <nombre> [--task ...] [--ttl <min>] [--force]");
  process.exit(1);
}
const r = claim(root, String(args.feature), String(args.agent), {
  task: args.task || null,
  ttlMin: args.ttl ? Number(args.ttl) : undefined,
  force: !!args.force,
});
if (!r.ok) {
  console.error(`✗ No se pudo reclamar: ${r.error}`);
  process.exit(1);
}
console.log(`✓ ${r.refreshed ? "Lock refrescado" : "Feature reclamada"}: ${r.lock.feature} → ${r.lock.agent}`);
console.log(`  expira: ${r.lock.expires_at} (TTL ${r.lock.ttl_min} min)`);
console.log(`  Recuerda liberar al terminar: npm run roadmap:release -- --feature ${r.lock.feature} --agent ${r.lock.agent}`);
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
