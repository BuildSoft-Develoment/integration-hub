#!/usr/bin/env node
/**
 * plugin-bundle.mjs (v12.134)
 *
 * Empaqueta el PLUGIN del framework AI-first empresarial (metodologia portable +
 * MCP server) — distinto del template release (project scaffolding).
 *
 * Contiene SOLO la metodologia reutilizable:
 *   - CONSTITUTION.md
 *   - AGENT_RUNTIME.md
 *   - AGENTS.md
 *   - ai/protocols/*
 *   - ai/skills/*.skill.md
 *   - ai/commands/*-command.md
 *   - scripts/aif-mcp-server.mjs
 *   - scripts/agent-protocol.mjs
 *   - scripts/install-agent.mjs (para instalarlo en otros proyectos)
 *   - scripts/plugin-install-local.mjs (wrapper de install/update — habilita 'update --target .' sin clone)
 *   - .claude-plugin/manifest.json
 *   (Codex no tiene plugin.json formal — usa config.toml; el MCP lo genera install:agent.)
 *
 * NO contiene project data (specs/, docs/, AI_CONTEXT, ROADMAP_STATE, BD).
 *
 * Output:
 *   dist/bundles/aif-plugin-vX.Y.Z.zip + .sha256
 *
 * Uso:
 *   node scripts/plugin-bundle.mjs
 *   node scripts/plugin-bundle.mjs --dry-run
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, statSync, copyFileSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dryRun = !!args["dry-run"];

if (args.help) {
  console.log(`plugin-bundle (v12.134) — empaqueta plugin distribuible del framework.

Uso:
  node scripts/plugin-bundle.mjs
  node scripts/plugin-bundle.mjs --dry-run

Incluye SOLO la metodologia: docs raiz + ai/protocols/ + ai/skills/ + ai/commands/ +
MCP server + install-agent. NO incluye specs/ docs/ AI_CONTEXT ROADMAP_STATE BD.

Output: dist/bundles/aif-plugin-vX.Y.Z.zip + .sha256
`);
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;

// Lista explicita de paths a INCLUIR (allowlist — opuesto a .zipignore que es denylist).
const INCLUDE_ROOTS = [
  "CONSTITUTION.md",
  "AGENT_RUNTIME.md",
  "AGENTS.md",
  "ai/protocols",
  "ai/skills",
  "ai/commands",
  "scripts/aif-mcp-server.mjs",
  "scripts/agent-protocol.mjs",
  "scripts/install-agent.mjs",
  // v12.138: el wrapper de instalacion/update viaja en el bundle para que el receptor
  // pueda correr 'plugin-install-local.mjs --target . --force' (el comando que imprime
  // plugin-check-updates) SIN depender de un clone del template. Cierra el loop de update.
  "scripts/plugin-install-local.mjs",
  ".claude-plugin",
];

console.log(`plugin-bundle (v12.134) — version: v${version}`);
console.log(`Allowlist roots: ${INCLUDE_ROOTS.length}`);

if (dryRun) {
  for (const p of INCLUDE_ROOTS) {
    const abs = join(root, p);
    const exists = existsSync(abs);
    const note = exists ? "✓" : "✗ NO EXISTE";
    console.log(`  ${note} ${p}`);
  }
  console.log(`\n(dry-run) no se genera ZIP.`);
  process.exit(0);
}

// Validar que todos existen.
const missing = INCLUDE_ROOTS.filter((p) => !existsSync(join(root, p)));
if (missing.length > 0) {
  console.error(`✗ Paths obligatorios faltantes: ${missing.join(", ")}`);
  process.exit(2);
}

// Crear staging.
const outDir = join(root, "dist", "bundles");
mkdirSync(outDir, { recursive: true });
const stagingRoot = join(root, ".tmp", `plugin-bundle-${Date.now()}`);
mkdirSync(stagingRoot, { recursive: true });

console.log(`\nCopiando paths permitidos a staging...`);
let files = 0;
let bytes = 0;
for (const rel of INCLUDE_ROOTS) {
  const src = join(root, rel);
  const dst = join(stagingRoot, rel);
  const st = statSync(src);
  if (st.isDirectory()) {
    const r = copyDirRecursive(src, dst);
    files += r.files;
    bytes += r.bytes;
  } else if (st.isFile()) {
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    files += 1;
    bytes += st.size;
  }
}
console.log(`  ✓ ${files} archivos copiados (${(bytes / 1024 / 1024).toFixed(2)} MB)`);

// v12.138: generar el arbol de skills NATIVAS de Claude (skills/<name>/SKILL.md
// con frontmatter name+description) DENTRO del staging, desde ai/skills/. Asi el
// plugin publicado las expone descubribles por Claude sin pasos extra en destino.
const transpiler = join(root, "scripts", "skills-transpile.mjs");
if (existsSync(transpiler)) {
  const skillsOut = join(stagingRoot, "skills");
  const r = spawnSync(process.execPath, [transpiler, "--emit-claude", "--out", skillsOut, "--root", root], { stdio: "pipe" });
  if (r.status !== 0) {
    console.error(`✗ skills-transpile --emit-claude fallo (status ${r.status}): ${(r.stderr || Buffer.from("")).toString().slice(0, 400)}`);
    console.error(`  Corre 'npm run skills:frontmatter' primero (frontmatter requerido en ai/skills/).`);
    rmSync(stagingRoot, { recursive: true, force: true });
    process.exit(4);
  }
  const skillCount = existsSync(skillsOut) ? readdirSync(skillsOut, { withFileTypes: true }).filter((d) => d.isDirectory()).length : 0;
  console.log(`  ✓ skills nativas Claude generadas en staging: ${skillCount} (skills/<name>/SKILL.md)`);
}

// Generar metadatos del plugin.
const meta = {
  name: "aif-framework-plugin",
  version,
  generated_at: new Date().toISOString(),
  contents: {
    docs: ["CONSTITUTION.md", "AGENT_RUNTIME.md", "AGENTS.md"],
    protocols_count: existsSync(join(stagingRoot, "ai/protocols")) ? readdirSync(join(stagingRoot, "ai/protocols")).filter((f) => f.endsWith(".md") && f !== "README.md").length : 0,
    skills_count: existsSync(join(stagingRoot, "ai/skills")) ? readdirSync(join(stagingRoot, "ai/skills")).filter((f) => f.endsWith(".skill.md")).length : 0,
    claude_native_skills_count: existsSync(join(stagingRoot, "skills")) ? readdirSync(join(stagingRoot, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory()).length : 0,
    commands_count: existsSync(join(stagingRoot, "ai/commands")) ? readdirSync(join(stagingRoot, "ai/commands")).filter((f) => f.endsWith("-command.md")).length : 0,
    mcp_server: "scripts/aif-mcp-server.mjs",
    install_command: "node scripts/install-agent.mjs --agent <claude|codex|opencode|gemini|cursor|copilot>",
  },
  supported_agents: ["claude", "codex", "opencode", "gemini", "copilot", "cursor"],
  template_compatibility: `>=12.131.0 <13.0.0`,
};
writeFileSync(join(stagingRoot, "PLUGIN_META.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");

// Empaquetar ZIP.
const zipName = `aif-plugin-v${version}.zip`;
const zipPath = join(outDir, zipName);
if (existsSync(zipPath)) rmSync(zipPath);

const isWin = process.platform === "win32";
let result;
let tool;
if (isWin) {
  tool = "ZipArchive.CreateEntry";
  const psStaging = stagingRoot.replace(/\//g, "\\");
  const psZip = zipPath.replace(/\//g, "\\");
  const script = [
    `Add-Type -AssemblyName System.IO.Compression`,
    `Add-Type -AssemblyName System.IO.Compression.FileSystem`,
    `$archive = [System.IO.Compression.ZipFile]::Open('${psZip}', [System.IO.Compression.ZipArchiveMode]::Create)`,
    `try { Get-ChildItem -Path '${psStaging}' -Recurse -File | ForEach-Object {`,
    `  $entryName = $_.FullName.Substring(${psStaging.length + 1}) -replace '\\\\', '/'`,
    `  $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)`,
    `  $stream = $entry.Open(); $fs = [System.IO.File]::OpenRead($_.FullName)`,
    `  try { $fs.CopyTo($stream) } finally { $fs.Close(); $stream.Close() }`,
    `} } finally { $archive.Dispose() }`,
  ].join("; ");
  result = spawnSync("powershell", ["-NoProfile", "-Command", script], { stdio: "pipe" });
} else {
  tool = "zip";
  const zipAvail = spawnSync("zip", ["-v"], { stdio: "pipe" }).status === 0;
  if (zipAvail) {
    result = spawnSync("zip", ["-r", "-q", zipPath, "."], { cwd: stagingRoot, stdio: "pipe" });
  } else {
    tool = "tar.gz";
    const tgzPath = zipPath.replace(/\.zip$/, ".tar.gz");
    result = spawnSync("tar", ["-czf", tgzPath, "-C", stagingRoot, "."], { stdio: "pipe" });
  }
}

rmSync(stagingRoot, { recursive: true, force: true });

if (result.status !== 0) {
  const err = (result.stderr || Buffer.from("")).toString();
  console.error(`✗ ${tool} fallo (status ${result.status}): ${err.slice(0, 400)}`);
  process.exit(3);
}

const finalPath = existsSync(zipPath) ? zipPath : zipPath.replace(/\.zip$/, ".tar.gz");
const hash = createHash("sha256").update(readFileSync(finalPath)).digest("hex");
writeFileSync(`${finalPath}.sha256`, `${hash}  ${relative(root, finalPath)}\n`, "utf8");

console.log(``);
console.log(`✓ Plugin bundle generado (${tool}):`);
console.log(`  ${relative(root, finalPath)}`);
console.log(`  ${(statSync(finalPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  sha256: ${hash.slice(0, 16)}...`);
console.log(``);
console.log(`Proximos pasos:`);
console.log(`  - Distribuye al team / sube a marketplace.`);
console.log(`  - En un proyecto destino: unzip + node scripts/install-agent.mjs --agent <name>`);

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function copyDirRecursive(src, dst) {
  mkdirSync(dst, { recursive: true });
  let files = 0;
  let bytes = 0;
  for (const e of readdirSync(src, { withFileTypes: true })) {
    const sp = join(src, e.name);
    const dp = join(dst, e.name);
    if (e.isDirectory()) {
      const r = copyDirRecursive(sp, dp);
      files += r.files;
      bytes += r.bytes;
    } else if (e.isFile()) {
      copyFileSync(sp, dp);
      files += 1;
      bytes += statSync(sp).size;
    }
  }
  return { files, bytes };
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
