#!/usr/bin/env node
/**
 * plugin-check-updates.mjs (v12.136)
 *
 * Receptor: chequea si hay una version nueva del plugin disponible en el registry
 * interno. Compara la version LOCAL (de .claude-plugin/manifest.json o
 * package.json) contra el current_version del registry.
 *
 * Uso:
 *   node scripts/plugin-check-updates.mjs --registry /shared/aif-plugin/marketplace.json
 *   node scripts/plugin-check-updates.mjs --registry https://internal.acme.com/aif-plugin/marketplace.json
 *   AIF_PLUGIN_REGISTRY=/shared/aif-plugin/marketplace.json npm run plugin:check-updates
 *   node scripts/plugin-check-updates.mjs --registry <path> --json
 *
 * Soporta:
 *   - file:// path local (incluye UNC en Windows)
 *   - http:// y https:// URL
 *
 * NO instala automaticamente (Principio 1 anti-self-approval — el humano decide).
 * Solo reporta + imprime el comando exacto para actualizar.
 *
 * Exit codes:
 *   0 - up-to-date (o reporte JSON)
 *   2 - update disponible (util para CI: 'plugin:check-updates || echo "actualiza"')
 *   3 - error de registry
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const registryArg = args.registry || process.env.AIF_PLUGIN_REGISTRY;
const json = !!args.json;

if (args.help || !registryArg) {
  console.log(`plugin-check-updates (v12.136) — compara version local vs registry interno.

Uso:
  node scripts/plugin-check-updates.mjs --registry <path-o-url>
  AIF_PLUGIN_REGISTRY=<path-o-url> npm run plugin:check-updates
  node scripts/plugin-check-updates.mjs --registry <path> --json

Registry soportado:
  - path local: /shared/aif-plugin/marketplace.json
  - UNC Windows: \\\\server\\share\\aif-plugin\\marketplace.json
  - HTTP(S): https://internal.acme.com/aif-plugin/marketplace.json

NO instala — solo reporta. Para actualizar, corre el comando que se imprime al final.

Exit codes:
  0 - up-to-date
  2 - update disponible
  3 - error de registry
`);
  process.exit(args.help ? 0 : 1);
}

const root = resolve(args.root || ".");

// Version local: prefiere .claude-plugin/manifest.json, luego package.json.
let localVersion = null;
const manifestPath = join(root, ".claude-plugin", "manifest.json");
const pkgPath = join(root, "package.json");
if (existsSync(manifestPath)) {
  try {
    localVersion = JSON.parse(readFileSync(manifestPath, "utf8")).version;
  } catch { /* fallback */ }
}
if (!localVersion && existsSync(pkgPath)) {
  try {
    localVersion = JSON.parse(readFileSync(pkgPath, "utf8")).version;
  } catch { /* nothing */ }
}
if (!localVersion) {
  console.error(`✗ No pude detectar version local (.claude-plugin/manifest.json o package.json).`);
  process.exit(3);
}

// Cargar registry.
let marketplace;
try {
  marketplace = await loadRegistry(registryArg);
} catch (e) {
  console.error(`✗ Registry error: ${e.message}`);
  process.exit(3);
}

const remoteVersion = marketplace.current_version;
const cmp = compareSemver(localVersion, remoteVersion);

const result = {
  registry: registryArg,
  local_version: localVersion,
  remote_version: remoteVersion,
  status: cmp >= 0 ? "up-to-date" : "update-available",
  remote_bundle: marketplace.bundle,
  remote_sha256: marketplace.sha256,
  remote_size_bytes: marketplace.size_bytes,
  remote_released_at: marketplace.released_at,
  template_compatibility: marketplace.template_compatibility,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(cmp >= 0 ? 0 : 2);
}

console.log(`plugin-check-updates (v12.136)`);
console.log(`  Registry:         ${registryArg}`);
console.log(`  Local version:    v${localVersion}`);
console.log(`  Remote version:   v${remoteVersion}`);
console.log(`  Released:         ${marketplace.released_at || "(unknown)"}`);
console.log(``);

if (cmp >= 0) {
  console.log(`✓ Up-to-date. No hay version mas nueva en el registry.`);
  process.exit(0);
}

console.log(`⚠ UPDATE DISPONIBLE: v${localVersion} → v${remoteVersion}`);
console.log(``);
console.log(`Para actualizar (decision humana — NO se auto-instala):`);
const registryDir = registryDirOf(registryArg);
const bundleUrl = registryDir ? `${registryDir}/${marketplace.bundle}` : marketplace.bundle;
console.log(`  node scripts/plugin-install-local.mjs \\`);
console.log(`    --bundle "${bundleUrl}" \\`);
console.log(`    --target . \\`);
console.log(`    --agent <claude|codex|opencode|gemini|cursor|copilot> \\`);
console.log(`    --force`);
console.log(``);
console.log(`Verifica primero el changelog y prueba en un proyecto staging antes de aplicar.`);
process.exit(2);

// ─────────────────────────────────────────────────────────────────────────
async function loadRegistry(reg) {
  if (reg.startsWith("http://") || reg.startsWith("https://")) {
    // Fetch HTTP. Node 18+ has global fetch.
    const r = await fetch(reg);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
  // Local file: support file:// and bare path.
  let path = reg.startsWith("file://") ? reg.slice(7) : reg;
  path = resolve(path);
  if (!existsSync(path)) throw new Error(`registry file no existe: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function registryDirOf(reg) {
  if (reg.startsWith("http://") || reg.startsWith("https://")) {
    return reg.replace(/\/marketplace\.json$/, "");
  }
  let path = reg.startsWith("file://") ? reg.slice(7) : reg;
  return resolve(path).replace(/[\\/]marketplace\.json$/, "").replace(/\\/g, "/");
}

function compareSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
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
