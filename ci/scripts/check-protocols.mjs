#!/usr/bin/env node
/**
 * check-protocols.mjs (v12.118)
 *
 * Verifica que cada protocolo bajo ai/protocols/*.md tenga la estructura canonica
 * de la Capa 1 (execution discipline):
 *   - Titulo "# Protocolo: <nombre>"
 *   - Seccion "## Cuando aplica"
 *   - Seccion "## Pasos obligatorios"
 *   - Seccion "## Output esperado"
 *   - Seccion "## Anti-patterns"
 *   - Seccion "## Verificacion"
 *
 * Default STRICT. Vive en check:template.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const REQUIRED_PROTOCOLS = [
  "brainstorming",
  "planning",
  "tdd",
  "subagent-execution",
  "code-review",
  "finishing-branch",
];

const REQUIRED_SECTIONS = [
  /^##\s+Cuando aplica\b/im,
  /^##\s+Pasos obligatorios\b/im,
  /^##\s+Output esperado\b/im,
  /^##\s+Anti-patterns\b/im,
  /^##\s+Verificacion\b/im,
];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true);

const dir = join(root, "ai", "protocols");
const blockers = [];

if (!existsSync(dir)) {
  blockers.push(`ai/protocols/:1: directorio no existe — la Capa 1 (execution discipline) requiere ai/protocols/`);
  finish();
}

const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md");
const present = new Set(files.map((f) => f.replace(/\.md$/, "")));

for (const req of REQUIRED_PROTOCOLS) {
  if (!present.has(req)) {
    blockers.push(`ai/protocols/${req}.md:1: protocolo obligatorio faltante (v12.118+)`);
  }
}

for (const f of files) {
  const rel = `ai/protocols/${f}`;
  const text = readFileSync(join(dir, f), "utf8");
  const nameFromFile = f.replace(/\.md$/, "");
  if (!new RegExp(`^#\\s+Protocolo:\\s+${escapeRe(nameFromFile)}\\b`, "im").test(text)) {
    blockers.push(`${rel}:1: titulo debe ser "# Protocolo: ${nameFromFile}"`);
  }
  for (const re of REQUIRED_SECTIONS) {
    if (!re.test(text)) {
      const sectName = re.source.match(/\\\+\s*(.+?)\\\\b/)?.[1] || re.source;
      blockers.push(`${rel}:1: falta seccion "${sectName.replace(/\\\\/g, "")}"`);
    }
  }
  if (text.replace(/\s+/g, "").length < 300) {
    blockers.push(`${rel}:1: contenido muy corto (sin sustancia minima)`);
  }
}

finish();

function finish() {
  console.log(`check-protocols (v12.118) ${strict ? "[STRICT]" : "[WARN]"}`);
  console.log(`Protocolos requeridos: ${REQUIRED_PROTOCOLS.length} | encontrados: ${present ? present.size : 0}`);
  if (blockers.length === 0) {
    console.log(`OK. Todos los protocolos de execution discipline tienen estructura canonica.`);
    process.exit(0);
  }
  console.error(`\nHallazgos (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ ${b}`);
  console.error(`\nFix: ver AGENT_RUNTIME.md y los protocolos en ai/protocols/.`);
  process.exit(strict ? 1 : 0);
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

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
