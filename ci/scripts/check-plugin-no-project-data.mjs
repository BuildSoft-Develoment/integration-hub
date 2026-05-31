#!/usr/bin/env node
/**
 * check-plugin-no-project-data.mjs (v12.134)
 *
 * Valida que el plugin bundle distribuible NO contenga project data (specs/, docs/,
 * AI_CONTEXT.md, ROADMAP_STATE.json, BD). El plugin es metodologia PORTABLE — no debe
 * arrastrar contenido especifico del proyecto emisor.
 *
 * Opt-in: --plugin-zip <path>. Lee el ZIP via EOCD + central directory (cero deps).
 */

import { existsSync, openSync, readSync, fstatSync, closeSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const strict = resolveStrict(args, true);

if (args.help || !args["plugin-zip"]) {
  console.log(`check-plugin-no-project-data (v12.134) — valida que un plugin ZIP NO contenga project data.

Uso:
  node ci/scripts/check-plugin-no-project-data.mjs --plugin-zip dist/bundles/aif-plugin-vX.Y.Z.zip
`);
  process.exit(args.help ? 0 : 1);
}

const zipPath = resolve(args["plugin-zip"]);
if (!existsSync(zipPath)) {
  console.error(`✗ ZIP no existe: ${zipPath}`);
  process.exit(1);
}

console.log(`check-plugin-no-project-data (v12.134) — ${zipPath}`);

const fd = openSync(zipPath, "r");
const size = fstatSync(fd).size;
let entries;
try { entries = readZipEntries(fd, size); }
finally { closeSync(fd); }

// Patrones PROHIBIDOS en un plugin bundle (project data):
const FORBIDDEN = [
  /^specs\//,
  /^docs\//,
  /^plantillas\//,
  /^stacks\//,
  /^AI_CONTEXT\.md$/,
  /^ROADMAP_STATE\.json$/,
  /^TRACEABILITY_MATRIX\.md$/,
  /^PROJECT_MAP\.md$/,
  /^AGENT_BOARD\.md$/,
  /\.db$/,
  /\.sqlite$/,
  /^ai\/memory\//,
  /^\.agent\//,
  /^worktrees\//,
  /^\.git\//,
];

const offenders = [];
for (const e of entries) {
  for (const re of FORBIDDEN) {
    if (re.test(e.name)) { offenders.push({ name: e.name, pattern: re.source }); break; }
  }
}

console.log(`  ${entries.length} entradas, ${offenders.length} prohibidas`);
if (offenders.length === 0) {
  console.log(`OK. Plugin bundle limpio (sin project data).`);
  process.exit(0);
}
console.error(`\n✗ Entradas prohibidas (${offenders.length}):`);
for (const o of offenders.slice(0, 10)) console.error(`  ${o.name}  (${o.pattern})`);
if (offenders.length > 10) console.error(`  ... y ${offenders.length - 10} mas`);
console.error(`\nFix: regenera con 'npm run plugin:bundle' (allowlist explicito).`);
process.exit(strict ? 2 : 0);

function readZipEntries(fd, fileSize) {
  const EOCD_SIG = 0x06054b50;
  const maxBack = Math.min(fileSize, 22 + 65535);
  const buf = Buffer.alloc(maxBack);
  readSync(fd, buf, 0, maxBack, fileSize - maxBack);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocdOffset = i; break; }
  }
  if (eocdOffset === -1) throw new Error("EOCD no encontrado");
  const cdEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  const cdBuf = Buffer.alloc(cdSize);
  readSync(fd, cdBuf, 0, cdSize, cdOffset);
  const out = [];
  let pos = 0;
  for (let i = 0; i < cdEntries; i += 1) {
    if (pos + 46 > cdBuf.length) break;
    const fnLen = cdBuf.readUInt16LE(pos + 28);
    const extraLen = cdBuf.readUInt16LE(pos + 30);
    const commentLen = cdBuf.readUInt16LE(pos + 32);
    out.push({ name: cdBuf.subarray(pos + 46, pos + 46 + fnLen).toString("utf8") });
    pos += 46 + fnLen + extraLen + commentLen;
  }
  return out;
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
