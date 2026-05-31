#!/usr/bin/env node
/**
 * check-bundle-release.mjs (v12.130)
 *
 * Valida un ZIP RELEASE generado (sin desempaquetarlo). Lee el End of Central
 * Directory (EOCD) + Central Directory para enumerar entradas. Sin dependencias
 * externas (parser ZIP minimo en Node).
 *
 * Reglas:
 *   1. TODAS las entradas usan separador "/" (no "\"). ZIP spec APPNOTE.TXT 4.4.17.1
 *      lo mandata; sin esto, unzip en Linux emite warning.
 *   2. NO existen entradas en los paths excluidos:
 *      .git/, *.db, *.sqlite, ai/memory/memory-report.html, .agent/,
 *      ROADMAP_STATE.json, AGENT_BOARD.md, worktrees/, node_modules/
 *   3. Entradas requeridas al root o en estructura canonica:
 *      package.json, AGENT_RUNTIME.md, AGENTS.md, CONSTITUTION.md,
 *      AI_CONTEXT.md, README.md, scripts/aif.mjs, scripts/agent-protocol.mjs,
 *      ai/protocols/*.md (>= 6), ai/skills/*.skill.md (>= 7).
 *   4. Si --expect-test-bundle: ademas espera al menos algunas entradas .git/.
 *      (Default: espera release bundle SIN .git/).
 *
 * Uso:
 *   npm run check:bundle:release -- --zip dist/bundles/project-template-v12.130.0-release.zip
 *   npm run check:bundle:release -- --zip <path> --expect-test-bundle
 *
 * Exit codes:
 *   0 - ZIP valido
 *   1 - argumentos
 *   2 - ZIP invalido (regla rota)
 */

import { existsSync, openSync, readSync, fstatSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const expectTest = !!args["expect-test-bundle"];

if (args.help || !args.zip) {
  console.log(`check-bundle-release (v12.130) — valida un ZIP generado sin desempaquetarlo.

Uso:
  node ci/scripts/check-bundle-release.mjs --zip <path>
  node ci/scripts/check-bundle-release.mjs --zip <path> --expect-test-bundle

Lee EOCD + Central Directory + valida 3 reglas (paths "/", sin excluidos, con
requeridos). No requiere unzip/PowerShell.
`);
  process.exit(args.help ? 0 : 1);
}

const zipPath = resolve(args.zip);
if (!existsSync(zipPath)) {
  console.error(`✗ ZIP no existe: ${zipPath}`);
  process.exit(1);
}

console.log(`check-bundle-release (v12.130) — zip: ${zipPath}`);

const fd = openSync(zipPath, "r");
const size = fstatSync(fd).st_size ?? fstatSync(fd).size;
let entries;
try {
  entries = readZipEntries(fd, size);
} finally {
  closeSync(fd);
}

console.log(`  ${entries.length} entradas detectadas`);

const EXCLUDED_PATTERNS = [
  /^\.git\//,
  /^\.git$/,
  /\.db$/,
  /\.sqlite$/,
  /\.db-/,
  /\.sqlite-/,
  /^ai\/memory\/memory-report\.html$/,
  /^\.agent\//,
  /^ROADMAP_STATE\.json$/,
  /^AGENT_BOARD\.md$/,
  /^worktrees\//,
  /^\.worktrees\//,
  /^node_modules\//,
];

const REQUIRED_FILES = [
  "package.json",
  "AGENT_RUNTIME.md",
  "AGENTS.md",
  "CONSTITUTION.md",
  "AI_CONTEXT.md",
  "README.md",
  "scripts/aif.mjs",
  "scripts/agent-protocol.mjs",
  "scripts/agent-start.mjs",
  "scripts/agent-finish.mjs",
  "scripts/agent-review.mjs",
  ".zipignore",
  ".gitignore",
];

const blockers = [];

// Regla 1: separadores "/"
const backslashEntries = entries.filter((e) => e.name.includes("\\"));
if (backslashEntries.length > 0) {
  blockers.push(`regla 1 [STRICT]: ${backslashEntries.length} entradas con "\\" en lugar de "/". Primeras 3: ${backslashEntries.slice(0, 3).map((e) => e.name).join(", ")}`);
} else {
  console.log(`  ✓ regla 1: todas las entradas usan "/" (ZIP-compliant)`);
}

// Regla 2: nada excluido
const offenders = [];
for (const e of entries) {
  for (const re of EXCLUDED_PATTERNS) {
    if (re.test(e.name)) { offenders.push({ name: e.name, pattern: re.source }); break; }
  }
}
if (expectTest) {
  // En test bundle, .git/ es esperado; lo removemos de offenders.
  const realOff = offenders.filter((o) => !/^\.git/.test(o.name));
  if (realOff.length > 0) {
    blockers.push(`regla 2 [STRICT, expect-test-bundle]: ${realOff.length} entradas excluidas presentes (excluyendo .git/ esperado). Primeras 3: ${realOff.slice(0, 3).map((o) => `${o.name} (${o.pattern})`).join(", ")}`);
  } else {
    console.log(`  ✓ regla 2: sin entradas excluidas (test bundle, .git/ esperado)`);
  }
} else {
  if (offenders.length > 0) {
    blockers.push(`regla 2 [STRICT, release]: ${offenders.length} entradas excluidas presentes. Primeras 3: ${offenders.slice(0, 3).map((o) => `${o.name} (${o.pattern})`).join(", ")}`);
  } else {
    console.log(`  ✓ regla 2: sin entradas excluidas`);
  }
}

// Regla 3: archivos requeridos
const nameSet = new Set(entries.map((e) => e.name));
const missingRequired = REQUIRED_FILES.filter((f) => !nameSet.has(f));
if (missingRequired.length > 0) {
  blockers.push(`regla 3 [STRICT]: faltan ${missingRequired.length} archivos requeridos: ${missingRequired.join(", ")}`);
} else {
  console.log(`  ✓ regla 3: ${REQUIRED_FILES.length} archivos requeridos presentes`);
}

// Regla 3b: ai/protocols/ y ai/skills/ con minimo de entradas
const protocols = entries.filter((e) => /^ai\/protocols\/[^/]+\.md$/.test(e.name));
const skills = entries.filter((e) => /^ai\/skills\/[^/]+\.skill\.md$/.test(e.name));
if (protocols.length < 6) {
  blockers.push(`regla 3b [STRICT]: ai/protocols/ tiene ${protocols.length} .md (esperado >= 6)`);
} else {
  console.log(`  ✓ regla 3b: ai/protocols/ = ${protocols.length} archivos`);
}
if (skills.length < 7) {
  blockers.push(`regla 3b [STRICT]: ai/skills/ tiene ${skills.length} *.skill.md (esperado >= 7)`);
} else {
  console.log(`  ✓ regla 3b: ai/skills/ = ${skills.length} skills`);
}

// Regla 4: si --expect-test-bundle, .git/ presente
if (expectTest) {
  const gitEntries = entries.filter((e) => /^\.git\//.test(e.name)).length;
  if (gitEntries === 0) {
    blockers.push(`regla 4 [STRICT, expect-test-bundle]: NO hay entradas .git/ en el ZIP (esperado para test bundle)`);
  } else {
    console.log(`  ✓ regla 4: ${gitEntries} entradas .git/ presentes (test bundle valido)`);
  }
} else {
  // Release bundle: NO debe tener .git/
  const gitEntries = entries.filter((e) => /^\.git\//.test(e.name)).length;
  if (gitEntries > 0) {
    blockers.push(`regla 4 [STRICT, release]: ${gitEntries} entradas .git/ presentes (NO esperadas en release bundle)`);
  } else {
    console.log(`  ✓ regla 4: sin entradas .git/ (release bundle limpio)`);
  }
}

console.log("");
if (blockers.length === 0) {
  console.log(`OK. Bundle ZIP valido (4 reglas, ${entries.length} entradas).`);
  process.exit(0);
}
console.error(`✗ Bundle ZIP invalido (${blockers.length} reglas rotas):`);
for (const b of blockers) console.error(`  ${b}`);
console.error(`\nFix sugerido:`);
console.error(`  - Regenera con 'npm run package:release' (o 'npm run package:test' para test bundle).`);
console.error(`  - Verifica que .zipignore tiene las exclusiones correctas.`);
process.exit(2);

// ─────────────────────────────────────────────────────────────────────────
function readZipEntries(fd, fileSize) {
  // ZIP EOCD: signature 0x06054b50, length min 22, max 22 + 65535 (comment).
  // Buscamos hacia atras.
  const EOCD_SIG = 0x06054b50;
  const maxBack = Math.min(fileSize, 22 + 65535);
  const buf = Buffer.alloc(maxBack);
  readSync(fd, buf, 0, maxBack, fileSize - maxBack);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocdOffset = i; break; }
  }
  if (eocdOffset === -1) throw new Error("EOCD signature no encontrada — no es un ZIP valido");
  // EOCD: 4 sig + 2 disk + 2 disk-cd + 2 entries-disk + 2 entries-total +
  //       4 cd-size + 4 cd-offset + 2 comment-len
  const cdEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  // Leer Central Directory
  const cdBuf = Buffer.alloc(cdSize);
  readSync(fd, cdBuf, 0, cdSize, cdOffset);
  const entries = [];
  let pos = 0;
  const CD_SIG = 0x02014b50;
  for (let i = 0; i < cdEntries; i += 1) {
    if (pos + 46 > cdBuf.length) throw new Error(`Central directory truncado en entry ${i}`);
    const sig = cdBuf.readUInt32LE(pos);
    if (sig !== CD_SIG) throw new Error(`Central directory entry signature invalida en ${pos}`);
    const fnLen = cdBuf.readUInt16LE(pos + 28);
    const extraLen = cdBuf.readUInt16LE(pos + 30);
    const commentLen = cdBuf.readUInt16LE(pos + 32);
    const filename = cdBuf.subarray(pos + 46, pos + 46 + fnLen).toString("utf8");
    entries.push({ name: filename });
    pos += 46 + fnLen + extraLen + commentLen;
  }
  return entries;
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
