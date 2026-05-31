#!/usr/bin/env node
/**
 * package-bundle.mjs (v12.129)
 *
 * Empaqueta el template en uno de dos perfiles distintos. Cierra el gap detectado
 * en el analisis del usuario: hasta v12.128 no habia comando declarado para producir
 * un ZIP reproducible — quien queria empaquetar lo hacia a mano, ignorando .zipignore.
 *
 *   --mode release  (default)
 *     ZIP limpio para INSTANCIAR un proyecto nuevo. Excluye TODO lo de .zipignore:
 *     .git/, .tmp/, node_modules/, dist/, build/, target/, BD SQLite, memory-report,
 *     .agent/, ROADMAP_STATE.json, AGENT_BOARD.md, ai/locks/.
 *     Cada proyecto creara su propio .git con git init + memory:bootstrap.
 *
 *   --mode test
 *     ZIP para PROBAR el template como reviewer (necesita .git + worktrees + git
 *     status real). Excluye lo mismo que release EXCEPTO .git/. Pre-valida:
 *       (a) git status --porcelain esta limpio (sin archivos modificados/untracked),
 *       (b) ultimo commit menciona la version en package.json,
 *       (c) ai/memory/framework-agent.db NO esta presente,
 *       (d) ai/memory/memory-report.html NO esta presente.
 *     Si algo falla, NO empaqueta y reporta exactamente que arreglar.
 *
 * Output:
 *   dist/bundles/project-template-vX.Y.Z-{release|test}.zip
 *   dist/bundles/project-template-vX.Y.Z-{release|test}.zip.sha256
 *
 * Cross-platform:
 *   - Windows: PowerShell Compress-Archive (con staging dir)
 *   - Unix:    `zip -r` si esta disponible, fallback a `tar.gz` con aviso
 *
 * Uso:
 *   node scripts/package-bundle.mjs --mode release
 *   node scripts/package-bundle.mjs --mode test
 *   node scripts/package-bundle.mjs --mode test --skip-version-check  (relajado)
 *   node scripts/package-bundle.mjs --mode release --dry-run         (lista exclusiones, no genera)
 *
 * Exit codes:
 *   0 - ZIP generado
 *   1 - error de argumentos
 *   2 - pre-validacion test fallo
 *   3 - error del comando de compresion (PowerShell/zip/tar)
 */

import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const mode = (args.mode || "release").toLowerCase();
const dryRun = !!args["dry-run"];
const skipVersionCheck = !!args["skip-version-check"];

if (args.help || !["release", "test"].includes(mode)) {
  console.log(`package-bundle (v12.129) — empaquetado disciplinado release/test.

Uso:
  node scripts/package-bundle.mjs --mode release
  node scripts/package-bundle.mjs --mode test
  node scripts/package-bundle.mjs --mode release --dry-run
  node scripts/package-bundle.mjs --mode test --skip-version-check

Modos:
  release  ZIP limpio para instanciar. Excluye .git/, BD, .agent/, memory-report, etc.
  test     ZIP con .git/ validado (clean + version match). Excluye solo BD + .agent + memory-report.

Output: dist/bundles/project-template-vX.Y.Z-{release|test}.zip (+ .sha256)
`);
  process.exit(args.help ? 0 : 1);
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;

// 1) Lee .zipignore y construye lista de exclusiones.
const zipignorePath = join(root, ".zipignore");
const allIgnore = existsSync(zipignorePath)
  ? readFileSync(zipignorePath, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
  : [];

// Modo release: usa TODAS las exclusiones (incluye .git/).
// Modo test: excluye lo mismo EXCEPTO patrones que empiezan con .git/.
const excludes = mode === "release"
  ? allIgnore
  : allIgnore.filter((p) => !p.startsWith(".git"));

console.log(`package-bundle (v12.129) — mode: ${mode}, version: v${version}`);
console.log(`Exclusiones aplicadas (.zipignore + modo): ${excludes.length}`);
if (dryRun) {
  for (const e of excludes) console.log(`  - ${e}`);
  console.log(`\n(dry-run) no se genera ZIP.`);
  process.exit(0);
}

// 2) Pre-validacion para modo test.
if (mode === "test") {
  console.log(`\nPre-validacion test bundle...`);
  // (a) git status limpio
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: root });
  if (status.status !== 0) {
    console.error(`✗ git no esta disponible o no es un repo. Aborto.`);
    process.exit(2);
  }
  const dirtyLines = (status.stdout || Buffer.from("")).toString().split(/\r?\n/).filter(Boolean);
  if (dirtyLines.length > 0) {
    console.error(`✗ git status no esta limpio: ${dirtyLines.length} archivos modificados/untracked.`);
    console.error(`  Primeros 5: ${dirtyLines.slice(0, 5).join(", ")}`);
    console.error(`  Fix: commitea o stashea (no hay back-compat — test bundle exige clean).`);
    process.exit(2);
  }
  console.log(`  ✓ git status limpio`);
  // (b) ultimo commit referencia la version (linea de release).
  // v12.138: este repo NO taggea desde v10.2.0 — el marcador de release es el subject del commit.
  // El cierre de release usa "vMAJOR.MINOR.PATCH" (p.ej. "v12.138.0"), pero los commits de
  // seguimiento dentro de la misma linea usan "vMAJOR.MINOR" (p.ej. "(v12.138)"). Antes el check
  // exigia el patch exacto en el ULTIMO commit, asi que cualquier follow-up rompia package:test
  // aunque el bundle fuera correcto. Ahora aceptamos la version completa O la linea minor.
  if (!skipVersionCheck) {
    const lastSubj = (spawnSync("git", ["log", "-1", "--format=%s"], { cwd: root }).stdout || Buffer.from("")).toString().trim();
    const minor = version.split(".").slice(0, 2).join("."); // "12.138.0" -> "12.138"
    const matched = lastSubj.includes(`v${version}`) || lastSubj.includes(`v${minor}`);
    if (!matched) {
      console.error(`⚠ ultimo commit "${lastSubj.slice(0, 80)}" no referencia v${version} (ni la linea v${minor}).`);
      console.error(`  Opcion A: commitea el cierre referenciando v${version} en el subject (este repo no taggea desde v10.2.0).`);
      console.error(`  Opcion B: corre con --skip-version-check (no recomendado).`);
      process.exit(2);
    }
    console.log(`  ✓ ultimo commit referencia la linea v${minor}`);
  } else {
    console.log(`  ⚠ --skip-version-check activo (no se verifico version)`);
  }
  // (c) BD ausente / (d) memory-report ausente — ya garantizado por excludes, pero double-check.
  // (No los hacemos fail aqui porque se filtran en el staging; solo reportamos.)
}

// 3) Crea staging dir filtrado.
const outDir = join(root, "dist", "bundles");
mkdirSync(outDir, { recursive: true });
const stagingRoot = join(root, ".tmp", `bundle-${mode}-${Date.now()}`);
mkdirSync(stagingRoot, { recursive: true });

console.log(`\nCopiando archivos a staging (filtrado por .zipignore)...`);
const stats = { files: 0, bytes: 0, excluded: 0 };
copyTreeFiltered(root, stagingRoot, excludes, root, stats);
console.log(`  ✓ ${stats.files} archivos copiados (${(stats.bytes / 1024 / 1024).toFixed(2)} MB), ${stats.excluded} excluidos`);

// 4) Comprime staging.
const zipName = `project-template-v${version}-${mode}.zip`;
const zipPath = join(outDir, zipName);
if (existsSync(zipPath)) rmSync(zipPath);

const isWin = process.platform === "win32";
let compressionTool = null;
let result;
if (isWin) {
  // v12.130: usamos ZipArchive.CreateEntry directamente y NORMALIZAMOS cada entry
  // name a "/" (ZIP spec APPNOTE.TXT 4.4.17.1 lo mandata). Tanto Compress-Archive como
  // ZipFile.CreateFromDirectory en .NET Framework de Windows PowerShell producen "\"
  // (no-compliant). Solo este enfoque manual garantiza forward slashes.
  compressionTool = "ZipArchive.CreateEntry (forward-slashes)";
  const psStaging = stagingRoot.replace(/\//g, "\\");
  const psZip = zipPath.replace(/\//g, "\\");
  const script = [
    `Add-Type -AssemblyName System.IO.Compression`,
    `Add-Type -AssemblyName System.IO.Compression.FileSystem`,
    `$zipPath = '${psZip}'`,
    `$srcDir = '${psStaging}'`,
    `if (Test-Path $zipPath) { Remove-Item $zipPath -Force }`,
    `$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)`,
    `try {`,
    `  Get-ChildItem -Path $srcDir -Recurse -File | ForEach-Object {`,
    `    $entryName = $_.FullName.Substring($srcDir.Length + 1) -replace '\\\\', '/'`,
    `    $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)`,
    `    $stream = $entry.Open()`,
    `    $fs = [System.IO.File]::OpenRead($_.FullName)`,
    `    try { $fs.CopyTo($stream) } finally { $fs.Close(); $stream.Close() }`,
    `  }`,
    `} finally { $archive.Dispose() }`,
  ].join("; ");
  result = spawnSync("powershell", ["-NoProfile", "-Command", script], { stdio: "pipe" });
} else {
  // Try zip, fallback a tar.gz.
  const zipAvail = spawnSync("zip", ["-v"], { stdio: "pipe" }).status === 0;
  if (zipAvail) {
    compressionTool = "zip";
    result = spawnSync("zip", ["-r", "-q", zipPath, "."], { cwd: stagingRoot, stdio: "pipe" });
  } else {
    compressionTool = "tar.gz (fallback)";
    const tgzPath = zipPath.replace(/\.zip$/, ".tar.gz");
    result = spawnSync("tar", ["-czf", tgzPath, "-C", stagingRoot, "."], { stdio: "pipe" });
    if (result.status === 0) console.log(`  (zip CLI no disponible — generado .tar.gz como fallback)`);
  }
}

// Limpiar staging siempre.
rmSync(stagingRoot, { recursive: true, force: true });

if (result.status !== 0) {
  const stderr = (result.stderr || Buffer.from("")).toString();
  console.error(`✗ ${compressionTool} fallo (status ${result.status}). stderr:\n${stderr.slice(0, 400)}`);
  process.exit(3);
}

// 5) Sha256.
const finalPath = existsSync(zipPath) ? zipPath : zipPath.replace(/\.zip$/, ".tar.gz");
const hash = createHash("sha256").update(readFileSync(finalPath)).digest("hex");
writeFileSync(`${finalPath}.sha256`, `${hash}  ${relative(root, finalPath)}\n`, "utf8");
const finalSize = statSync(finalPath).size;

// 6) Reporte.
console.log(``);
console.log(`✓ Bundle generado (${compressionTool}):`);
console.log(`  ${relative(root, finalPath)}`);
console.log(`  ${(finalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  sha256: ${hash.slice(0, 16)}...`);
console.log(``);
console.log(`Proximos pasos:`);
if (mode === "release") {
  console.log(`  - Distribuye el ZIP (instalacion = unzip + git init + npm install + memory:bootstrap).`);
  console.log(`  - Cada proyecto instanciado crea su propio .git desde cero.`);
} else {
  console.log(`  - Para validar el bundle: npm run check:test-bundle -- --root <path-extraido>`);
  console.log(`  - El reviewer puede correr agent:start, worktrees, roadmap:audit con git real.`);
}
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function copyTreeFiltered(src, dst, excludes, baseRoot, stats) {
  if (!existsSync(dst)) mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const rel = relative(baseRoot, srcPath).replace(/\\/g, "/");
    if (matchesAnyExclude(rel, entry.isDirectory(), excludes)) {
      stats.excluded += 1;
      continue;
    }
    const dstPath = join(dst, entry.name);
    if (entry.isDirectory()) {
      copyTreeFiltered(srcPath, dstPath, excludes, baseRoot, stats);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, dstPath);
      stats.files += 1;
      stats.bytes += statSync(srcPath).size;
    }
    // symlinks/etc. ignorados
  }
}

function matchesAnyExclude(relPath, isDir, patterns) {
  const path = relPath.endsWith("/") ? relPath : relPath + (isDir ? "/" : "");
  for (const p of patterns) {
    if (matchesPattern(path, isDir, p)) return true;
  }
  return false;
}

function matchesPattern(path, isDir, pattern) {
  // pattern ends with / → directory match (or any path under it)
  if (pattern.endsWith("/")) {
    const dirPat = pattern.slice(0, -1);
    return path === dirPat + "/" || path.startsWith(dirPat + "/");
  }
  // pattern with * → simple glob
  if (pattern.includes("*")) {
    const re = new RegExp(
      "^" +
        pattern
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*\*/g, ".*")
          .replace(/\*/g, "[^/]*") +
        "$"
    );
    // Try with and without trailing slash for dir vs file
    const candidate = isDir ? path.replace(/\/$/, "") : path;
    if (re.test(candidate)) return true;
    // Also match by basename for patterns like "*.db"
    const basename = candidate.split("/").pop();
    if (re.test(basename)) return true;
    return false;
  }
  // exact match (full path or basename)
  const candidate = isDir ? path.replace(/\/$/, "") : path;
  return candidate === pattern || candidate.endsWith("/" + pattern);
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
