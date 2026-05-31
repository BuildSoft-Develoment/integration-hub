#!/usr/bin/env node
/**
 * plugin-publish.mjs (v12.136)
 *
 * Publica el plugin bundle a un destino INTERNO (sin marketplace publico):
 *   - filesystem local (shared drive, network mount, etc.)
 *   - git repo local (con --git-commit hace add+commit)
 *
 * Updates marketplace.json en el destino con la version nueva + checksum + tamano.
 * Las versiones anteriores se mueven a previous_versions[] (preserva historial).
 *
 * Uso:
 *   node scripts/plugin-publish.mjs --destination /shared/aif-plugin
 *   node scripts/plugin-publish.mjs --destination /shared/aif-plugin --bundle dist/bundles/aif-plugin-v12.136.0.zip
 *   node scripts/plugin-publish.mjs --destination /git/internal/aif-mirror --git-commit
 *   AIF_PLUGIN_DESTINATION=/shared/aif-plugin node scripts/plugin-publish.mjs   (env override)
 *
 * El destination puede ser:
 *   - Path local absoluto (Windows o Unix)
 *   - Path UNC (Windows): \\server\share\path
 *   - file:// URL (se convierte a path)
 *
 * NO sube a HTTP (eso seria un servidor). Para HTTP, simplemente sirve el destino
 * via nginx/apache/IIS apuntando al folder.
 *
 * Exit codes:
 *   0 - publicado OK
 *   1 - argumentos
 *   2 - bundle no existe o invalido
 *   3 - destination no accesible
 *   4 - git commit fallo (con --git-commit)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, copyFileSync, readdirSync } from "node:fs";
import { resolve, join, relative, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const destinationArg = args.destination || process.env.AIF_PLUGIN_DESTINATION;
const gitCommit = !!args["git-commit"];

if (args.help || !destinationArg) {
  console.log(`plugin-publish (v12.136) — publica plugin bundle a destino interno.

Uso:
  node scripts/plugin-publish.mjs --destination <path>
  node scripts/plugin-publish.mjs --destination <path> --bundle <path>
  node scripts/plugin-publish.mjs --destination <git-repo> --git-commit

Env override:
  AIF_PLUGIN_DESTINATION=<path>  (en vez de --destination)

Destino soportado:
  - filesystem local / shared drive / UNC path
  - git repo local (con --git-commit hace add+commit)

NO sube a HTTP. Para servir HTTP, simplemente apunta nginx/apache al folder.

Output: copia <bundle.zip> + <bundle.zip.sha256> al destino + actualiza
<destino>/marketplace.json con version + checksum + size + timestamp.
`);
  process.exit(args.help ? 0 : 1);
}

// Normaliza destination (file:// → path).
let destination = destinationArg;
if (destination.startsWith("file://")) destination = destination.slice(7);
destination = resolve(destination);

const root = resolve(args.root || ".");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;
const bundleArg = args.bundle || join(root, "dist", "bundles", `aif-plugin-v${version}.zip`);
const bundlePath = resolve(bundleArg);

if (!existsSync(bundlePath)) {
  console.error(`✗ Bundle no existe: ${bundlePath}`);
  console.error(`  Generalo con: npm run plugin:bundle`);
  process.exit(2);
}

console.log(`plugin-publish (v12.136)`);
console.log(`  Bundle:      ${bundlePath}`);
console.log(`  Destination: ${destination}`);

if (!existsSync(destination)) {
  console.log(`  (destination no existe; creandolo)`);
  mkdirSync(destination, { recursive: true });
}

// Compute checksum + size del bundle.
const data = readFileSync(bundlePath);
const sha256 = createHash("sha256").update(data).digest("hex");
const sizeBytes = statSync(bundlePath).size;
console.log(`  Version:     v${version}`);
console.log(`  Size:        ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  sha256:      ${sha256.slice(0, 32)}...`);

// Lee o inicializa marketplace.json.
const marketplacePath = join(destination, "marketplace.json");
let marketplace;
if (existsSync(marketplacePath)) {
  try {
    marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  } catch (e) {
    console.error(`⚠ marketplace.json invalido (${e.message}); reinicializo`);
    marketplace = initMarketplace();
  }
} else {
  marketplace = initMarketplace();
}

// Move current → previous (si existe y es distinta version).
if (marketplace.current_version && marketplace.current_version !== version) {
  const prev = {
    version: marketplace.current_version,
    bundle: marketplace.bundle,
    sha256: marketplace.sha256,
    size_bytes: marketplace.size_bytes,
    released_at: marketplace.released_at,
  };
  marketplace.previous_versions = [prev, ...(marketplace.previous_versions || [])].slice(0, 10);
}

const bundleFilename = `aif-plugin-v${version}.zip`;
marketplace.current_version = version;
marketplace.released_at = new Date().toISOString();
marketplace.bundle = bundleFilename;
marketplace.sha256 = sha256;
marketplace.size_bytes = sizeBytes;
marketplace.template_compatibility = `>=12.131.0 <13.0.0`;
marketplace.last_published_by = process.env.USER || process.env.USERNAME || "unknown";

// Copia bundle + sha256 sidecar.
const dstBundle = join(destination, bundleFilename);
const dstSha = `${dstBundle}.sha256`;
copyFileSync(bundlePath, dstBundle);
writeFileSync(dstSha, `${sha256}  ${bundleFilename}\n`, "utf8");
console.log(`\n✓ bundle copiado: ${relative(root, dstBundle).replace(/\\/g, "/")}`);
console.log(`✓ checksum:       ${relative(root, dstSha).replace(/\\/g, "/")}`);

// Escribir marketplace.json.
writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + "\n", "utf8");
console.log(`✓ marketplace.json actualizado (${(marketplace.previous_versions || []).length} versiones previas)`);

// Optional git commit.
if (gitCommit) {
  console.log(`\nCommitting al git del destino...`);
  const gitCheck = spawnSync("git", ["status"], { cwd: destination, stdio: "pipe" });
  if (gitCheck.status !== 0) {
    console.error(`⚠ ${destination} no es un git repo — saltando --git-commit`);
  } else {
    spawnSync("git", ["add", bundleFilename, `${bundleFilename}.sha256`, "marketplace.json"], { cwd: destination, stdio: "inherit" });
    const commit = spawnSync("git", ["commit", "-m", `chore: publish aif-plugin v${version}`], { cwd: destination, stdio: "inherit" });
    if (commit.status !== 0) { console.error(`✗ git commit fallo`); process.exit(4); }
    console.log(`✓ git commit OK (no push — hazlo manual cuando quieras: cd ${destination} && git push)`);
  }
}

// Print receptor instructions.
console.log(`\nReceptores: para instalar esta version en su proyecto:`);
const receptorPath = destination.replace(/\\/g, "/");
console.log(`  AIF_PLUGIN_REGISTRY="${receptorPath}/marketplace.json" npm run plugin:check-updates`);
console.log(`  node scripts/plugin-install-local.mjs --bundle "${receptorPath}/${bundleFilename}" --target . --agent claude`);
console.log(``);
console.log(`O fija el registry en su shell: export AIF_PLUGIN_REGISTRY="${receptorPath}/marketplace.json"`);

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function initMarketplace() {
  return {
    name: "aif-framework",
    description: "AI-First Framework Empresarial — plugin bundle distribuible interno.",
    current_version: null,
    bundle: null,
    sha256: null,
    size_bytes: null,
    released_at: null,
    template_compatibility: `>=12.131.0 <13.0.0`,
    previous_versions: [],
    created_at: new Date().toISOString(),
  };
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
