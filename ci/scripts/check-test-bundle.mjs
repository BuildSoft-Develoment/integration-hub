#!/usr/bin/env node
/**
 * check-test-bundle.mjs (v12.129)
 *
 * Verifica la integridad de un test bundle desempaquetado. Las reglas (5):
 *   1. Si `.git/` existe, `git status --porcelain` debe estar vacio (clean).
 *   2. Si `.git/` existe, el ultimo commit debe mencionar `vX.Y.Z` (la version de package.json).
 *   3. `ai/memory/framework-agent.db` NO debe existir (memoria reconstruible).
 *   4. `ai/memory/memory-report.html` NO debe existir (reconstruible con memory-report).
 *   5. `.agent/` NO debe existir (locks/runs son del entorno emisor, no del receptor).
 *
 * Modo de activacion: opt-in.
 *   - Por default no corre (no bloquea check:all del template canonico).
 *   - Activacion explicita:
 *       npm run check:test-bundle -- --root /path/to/extracted-bundle
 *       TEST_BUNDLE=1 npm run check:test-bundle
 *
 * Para un release bundle (sin .git/), reglas 1-2 se saltan (solo 3-4-5 aplican).
 *
 * Exit codes:
 *   0 - bundle valido o (sin --root y sin TEST_BUNDLE=1) skip silencioso
 *   1 - argumentos / configuracion
 *   2 - bundle invalido (regla rota)
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const envActive = process.env.TEST_BUNDLE === "1" || process.env.TEST_BUNDLE === "true";
const explicitRoot = args.root ? resolve(args.root) : null;

if (args.help) {
  console.log(`check-test-bundle (v12.129) — valida un bundle desempaquetado.

Uso:
  npm run check:test-bundle -- --root <path-extraido>
  TEST_BUNDLE=1 npm run check:test-bundle

Reglas:
  1. git status limpio (si .git existe)
  2. ultimo commit menciona la version (si .git existe)
  3. ai/memory/framework-agent.db NO existe
  4. ai/memory/memory-report.html NO existe
  5. .agent/ NO existe

Sin --root y sin TEST_BUNDLE=1 → skip silencioso (no bloquea check:all).
`);
  process.exit(0);
}

if (!explicitRoot && !envActive) {
  console.log(`check-test-bundle (v12.129) — skip (no se paso --root ni TEST_BUNDLE=1; usar para validar bundles desempaquetados).`);
  process.exit(0);
}

const root = explicitRoot || resolve(".");
console.log(`check-test-bundle (v12.129) — root: ${root}`);

const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) {
  console.error(`✗ ${pkgPath} no existe — no parece un bundle desempaquetado del template.`);
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const version = pkg.version;
console.log(`  version declarada: v${version}`);

const blockers = [];

// Reglas 1-2: solo si .git/ existe (test bundle). Para release bundle no aplican.
const hasGit = existsSync(join(root, ".git"));
if (hasGit) {
  console.log(`  .git/ detectado → es test bundle (validando git state)`);
  // Regla 1: git status limpio
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: root });
  if (status.status !== 0) {
    blockers.push(`regla 1: git no ejecutable en ${root}`);
  } else {
    const dirty = (status.stdout || Buffer.from("")).toString().split(/\r?\n/).filter(Boolean);
    if (dirty.length > 0) {
      blockers.push(`regla 1 [STRICT]: git status NO esta limpio (${dirty.length} archivos): ${dirty.slice(0, 3).join(", ")}${dirty.length > 3 ? "..." : ""}`);
    } else {
      console.log(`  ✓ regla 1: git status limpio`);
    }
  }
  // Regla 2: ultimo commit menciona la version
  const lastSubj = (spawnSync("git", ["log", "-1", "--format=%s"], { cwd: root }).stdout || Buffer.from("")).toString().trim();
  const lastTags = (spawnSync("git", ["tag", "--points-at", "HEAD"], { cwd: root }).stdout || Buffer.from("")).toString().trim();
  const mentionsVersion = lastSubj.includes(`v${version}`) || lastTags.split(/\s+/).includes(`v${version}`);
  if (!mentionsVersion) {
    blockers.push(`regla 2 [STRICT]: ultimo commit "${lastSubj.slice(0, 60)}" no menciona v${version} y no hay tag v${version} en HEAD`);
  } else {
    console.log(`  ✓ regla 2: HEAD vinculado a v${version}`);
  }
} else {
  console.log(`  .git/ ausente → es release bundle (reglas 1-2 no aplican)`);
}

// Regla 3: BD ausente
const dbPath = join(root, "ai", "memory", "framework-agent.db");
if (existsSync(dbPath)) {
  const sizeMB = (statSync(dbPath).size / 1024 / 1024).toFixed(1);
  blockers.push(`regla 3 [STRICT]: ai/memory/framework-agent.db esta presente (~${sizeMB} MB). Debe regenerarse con 'npm run memory:bootstrap'.`);
} else {
  console.log(`  ✓ regla 3: ai/memory/framework-agent.db ausente`);
}

// Regla 4: memory-report ausente
const reportPath = join(root, "ai", "memory", "memory-report.html");
if (existsSync(reportPath)) {
  blockers.push(`regla 4 [STRICT]: ai/memory/memory-report.html esta presente. Debe regenerarse con memory-report.`);
} else {
  console.log(`  ✓ regla 4: ai/memory/memory-report.html ausente`);
}

// Regla 5: .agent/ ausente
const agentDir = join(root, ".agent");
if (existsSync(agentDir)) {
  blockers.push(`regla 5 [STRICT]: .agent/ esta presente (locks/runs del emisor). Limpiar antes de empaquetar.`);
} else {
  console.log(`  ✓ regla 5: .agent/ ausente`);
}

console.log("");
if (blockers.length === 0) {
  console.log(`OK. Test bundle valido (5/5 reglas).`);
  process.exit(0);
}
console.error(`✗ Bundle invalido (${blockers.length} reglas rotas):`);
for (const b of blockers) console.error(`  ${b}`);
console.error(`\nFix sugerido:`);
console.error(`  - Si es bundle local: vuelve a generar con 'npm run package:test' (preserva las 5 reglas).`);
console.error(`  - Si es bundle distribuido: contacta al emisor y reportales que omitieron las reglas.`);
process.exit(2);

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
