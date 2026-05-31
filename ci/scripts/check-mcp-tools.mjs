#!/usr/bin/env node
/**
 * check-mcp-tools.mjs (v12.134)
 *
 * Valida que aif-mcp-server.mjs exponga tools con schemas correctos:
 *   - Lista las tools via --list-tools.
 *   - Cada tool tiene: name (snake_case con prefijo aif_), description (>=40 chars),
 *     inputSchema (type:object con additionalProperties:false).
 *   - Write tools (agent_start/review/finish) tienen confirm:boolean en su schema.
 *
 * Default STRICT. Opt-in via --strict / TEMPLATE_LEVEL.
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true);

const serverPath = join(root, "scripts", "aif-mcp-server.mjs");
if (!existsSync(serverPath)) {
  console.log(`check-mcp-tools (v12.134) — scripts/aif-mcp-server.mjs no existe. Skip.`);
  process.exit(0);
}

const r = spawnSync(process.execPath, [serverPath, "--list-tools"], { stdio: "pipe" });
if (r.status !== 0) {
  console.error(`✗ aif-mcp-server.mjs --list-tools fallo (status ${r.status})`);
  process.exit(1);
}
let tools;
try {
  tools = JSON.parse((r.stdout || Buffer.from("")).toString());
} catch (e) {
  console.error(`✗ output --list-tools no es JSON valido: ${e.message}`);
  process.exit(1);
}

const WRITE_TOOLS = new Set(["aif_agent_start", "aif_agent_review", "aif_agent_finish"]);
const blockers = [];

console.log(`check-mcp-tools (v12.134) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Tools encontradas: ${tools.length}`);

const seenNames = new Set();
for (const t of tools) {
  // 1. name snake_case con prefijo aif_
  if (!/^aif_[a-z_]+$/.test(t.name)) blockers.push(`tool ${t.name}: name debe matchear /^aif_[a-z_]+$/`);
  if (seenNames.has(t.name)) blockers.push(`tool ${t.name}: name duplicado`);
  seenNames.add(t.name);
  // 2. description >= 40 chars
  if (!t.description || t.description.length < 40) blockers.push(`tool ${t.name}: description muy corta (${(t.description || "").length} chars, esperado >=40)`);
  // 3. inputSchema valido
  if (!t.inputSchema || t.inputSchema.type !== "object") blockers.push(`tool ${t.name}: inputSchema debe ser {type:'object',...}`);
  else if (t.inputSchema.additionalProperties !== false) blockers.push(`tool ${t.name}: inputSchema.additionalProperties debe ser false (anti-injection)`);
  // 4. WRITE tools deben tener confirm:boolean
  if (WRITE_TOOLS.has(t.name)) {
    const conf = t.inputSchema?.properties?.confirm;
    if (!conf || conf.type !== "boolean") blockers.push(`tool ${t.name}: write tool DEBE declarar 'confirm' (type:boolean) en properties (Principio 1)`);
  }
}

if (blockers.length === 0) {
  console.log(`OK. ${tools.length} tools (${[...WRITE_TOOLS].filter((n) => seenNames.has(n)).length} write con confirm) — schemas validos.`);
  process.exit(0);
}
console.error(`\nHallazgos (${blockers.length}):`);
for (const b of blockers) console.error(`  ✗ ${b}`);
console.error(`\nFix: ajustar TOOLS en scripts/aif-mcp-server.mjs.`);
process.exit(strict ? 1 : 0);

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
