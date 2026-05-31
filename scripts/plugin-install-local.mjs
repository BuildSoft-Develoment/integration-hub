#!/usr/bin/env node
/**
 * plugin-install-local.mjs (v12.135)
 *
 * Instala un plugin bundle desempaquetado en un proyecto destino. Reemplaza el
 * proceso manual de "unzip + install:agent".
 *
 * Uso:
 *   node scripts/plugin-install-local.mjs --bundle dist/bundles/aif-plugin-vX.Y.Z.zip --target /path/to/project
 *   node scripts/plugin-install-local.mjs --bundle <path> --target <project> --agent claude
 *
 * Flujo:
 *   1. Verifica que --bundle existe (es .zip o .tar.gz).
 *   2. Verifica que --target existe y tiene package.json (es un proyecto Node).
 *   3. Extrae el bundle a un staging temporal.
 *   4. Valida que el bundle es valido (check:plugin-no-project-data).
 *   5. Copia los archivos del plugin al target (overwrite si --force).
 *   6. Opcionalmente corre install:agent --agent <X> en el target.
 *
 * Esto cierra el loop: el plugin se distribuye como bundle, y el receptor lo instala
 * con UN comando en su proyecto.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { resolve, join, dirname, relative } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.bundle || !args.target) {
  console.log(`plugin-install-local (v12.135) — instala plugin bundle en proyecto destino.

Uso:
  node scripts/plugin-install-local.mjs --bundle <path> --target <project>
  node scripts/plugin-install-local.mjs --bundle <path> --target <project> --agent claude
  node scripts/plugin-install-local.mjs --bundle <path> --target <project> --force

Flujo:
  1. Extrae bundle a staging temporal.
  2. Valida sin project data.
  3. Copia archivos al target (sin --force, salta los que existen).
  4. Si --agent <name>: corre install:agent --agent <name> en el target.
`);
  process.exit(args.help ? 0 : 1);
}

const bundlePath = resolve(args.bundle);
const targetRoot = resolve(args.target);
const force = !!args.force;
const agent = args.agent || null;

if (!existsSync(bundlePath)) { console.error(`✗ Bundle no existe: ${bundlePath}`); process.exit(2); }
if (!existsSync(join(targetRoot, "package.json"))) { console.error(`✗ Target no tiene package.json: ${targetRoot}`); process.exit(2); }

console.log(`plugin-install-local (v12.135)`);
console.log(`  Bundle:  ${bundlePath}`);
console.log(`  Target:  ${targetRoot}`);

const stagingRoot = join(targetRoot, ".tmp", `plugin-install-${Date.now()}`);
mkdirSync(stagingRoot, { recursive: true });

// Extract
console.log(`\nExtrayendo bundle a staging...`);
const isWin = process.platform === "win32";
let xresult;
if (isWin) {
  const psBundle = bundlePath.replace(/\//g, "\\");
  const psStaging = stagingRoot.replace(/\//g, "\\");
  xresult = spawnSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -Path '${psBundle}' -DestinationPath '${psStaging}' -Force`], { stdio: "pipe" });
} else {
  xresult = spawnSync("unzip", ["-q", bundlePath, "-d", stagingRoot], { stdio: "pipe" });
}
if (xresult.status !== 0) {
  rmSync(stagingRoot, { recursive: true, force: true });
  console.error(`✗ extraccion fallo: ${(xresult.stderr || Buffer.from("")).toString().slice(0, 400)}`);
  process.exit(3);
}

// Validate via check-plugin-no-project-data
console.log(`Validando bundle (sin project data)...`);
const cpndScript = join(targetRoot, "ci", "scripts", "check-plugin-no-project-data.mjs");
if (existsSync(cpndScript)) {
  const v = spawnSync(process.execPath, [cpndScript, "--plugin-zip", bundlePath], { stdio: "pipe" });
  if (v.status !== 0) {
    rmSync(stagingRoot, { recursive: true, force: true });
    console.error(`✗ check-plugin-no-project-data fallo. Bundle contiene project data — aborto.`);
    process.exit(4);
  }
  console.log(`  ✓ bundle limpio`);
} else {
  console.log(`  (target no tiene check-plugin-no-project-data — skip validacion)`);
}

// Copy
console.log(`Copiando archivos al target...`);
let written = 0;
let skipped = 0;
const stats = { written: 0, skipped: 0 };
copyDirOverwrite(stagingRoot, targetRoot, force, stats);
console.log(`  ✓ ${stats.written} escritos, ${stats.skipped} saltados (existian sin --force)`);

rmSync(stagingRoot, { recursive: true, force: true });

// Optional install:agent
if (agent) {
  console.log(`\nCorriendo install:agent --agent ${agent} en el target...`);
  const installScript = join(targetRoot, "scripts", "install-agent.mjs");
  if (!existsSync(installScript)) {
    console.error(`⚠ ${installScript} no existe — saltado.`);
  } else {
    const r = spawnSync(process.execPath, [installScript, "--agent", agent, "--root", targetRoot], { cwd: targetRoot, stdio: "inherit" });
    if (r.status !== 0) console.error(`⚠ install:agent fallo (status ${r.status})`);
  }
}

console.log(`\n✓ Plugin instalado en ${targetRoot}.`);
console.log(`\nProximos pasos:`);
console.log(`  cd ${targetRoot}`);
console.log(`  npm install`);
console.log(`  npm run memory:bootstrap`);
console.log(`  ${agent ? `# install:agent ya corrio para ${agent}` : `npm run install:agent -- --agent <name>`}`);
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function copyDirOverwrite(src, dst, force, stats) {
  for (const e of readdirSync(src, { withFileTypes: true })) {
    const sp = join(src, e.name);
    const dp = join(dst, e.name);
    if (e.isDirectory()) {
      if (!existsSync(dp)) mkdirSync(dp, { recursive: true });
      copyDirOverwrite(sp, dp, force, stats);
    } else if (e.isFile()) {
      if (existsSync(dp) && !force) { stats.skipped += 1; continue; }
      mkdirSync(dirname(dp), { recursive: true });
      copyFileSync(sp, dp);
      stats.written += 1;
    }
  }
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
