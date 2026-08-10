#!/usr/bin/env node
// Golden path: crear un servicio nuevo a partir de un stack de la plantilla.
//
// Cross-platform (Windows, Linux, macOS). Solo requiere Node.js 20+ y git en PATH.
//
// Uso:
//   node scripts/new-service.mjs --stack <node-next|java-monolith|quarkus-angular|spring-react> \
//       --config <ruta-json> [--dest <ruta-destino>] [--no-git] [--skip-smoke]
//
// Que hace:
//   1. Copia el template del stack indicado a la ruta destino.
//   2. Delega la sustitucion de tokens en scripts/init-project.mjs sobre la copia.
//   3. Ejecuta validaciones tecnicas y smoke checks del stack generado.
//   4. Inicializa git y hace commit inicial (salvo --no-git).
//   5. Imprime checklist de proximos pasos.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawnSync } from "node:child_process";

const SUPPORTED_STACKS = ["node-next", "java-monolith", "quarkus-angular", "spring-react"];
const WINDOWS_EXECUTABLES = new Map([
  ["npm", "npm.cmd"],
  ["npx", "npx.cmd"],
  ["mvn", "mvn.cmd"],
  ["gradle", "gradle.bat"],
  ["git", "git.exe"],
]);

const IGNORED_DIRS = new Set([
  ".git",
  ".gradle",
  "node_modules",
  ".next",
  ".angular",
  ".cache",
  "dist",
  "build",
  "bin",
  "target",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
]);

function usage() {
  console.log(`Uso:
  node scripts/new-service.mjs --stack <${SUPPORTED_STACKS.join("|")}> \\
      --config <ruta-json> [--dest <ruta-destino>] [--no-git] [--skip-smoke] [--allow-existing-empty]

Ejemplo:
  node scripts/new-service.mjs --stack node-next \\
      --config template.config.example.json --dest ../case-management-web
`);
}

function parseArgs(argv) {
  const args = { initGit: true, smoke: true };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "-h" || flag === "--help") { args.help = true; continue; }
    if (flag === "--no-git") { args.initGit = false; continue; }
    if (flag === "--skip-smoke") { args.smoke = false; continue; }
    if (flag === "--allow-existing-empty") { args.allowExistingEmpty = true; continue; }
    if (flag === "--stack") { args.stack = value; i += 1; continue; }
    if (flag === "--config") { args.config = value; i += 1; continue; }
    if (flag === "--dest") { args.dest = value; i += 1; continue; }
    throw new Error(`Argumento desconocido: ${flag}`);
  }
  return args;
}

function rootDir() {
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
    const src = path.join(source, entry.name);
    const dst = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dst);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dst);
    } else if (entry.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(src);
      try {
        fs.symlinkSync(linkTarget, dst);
      } catch {
        // En Windows sin permisos de symlink, copiar el contenido referenciado.
        if (fs.existsSync(src) && fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dst);
        }
      }
    }
  }
}

function resolveConfigPath(configArg, root) {
  if (!configArg) return null;
  const absolute = path.isAbsolute(configArg) ? configArg : path.resolve(process.cwd(), configArg);
  if (fs.existsSync(absolute)) return absolute;
  const fallback = path.join(root, configArg);
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

function resolveDefaultDest(configPath) {
  try {
    const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const name = data?.project?.webComponentName || data?.project?.slug || "new-service";
    return path.resolve(process.cwd(), name);
  } catch {
    return path.resolve(process.cwd(), "new-service");
  }
}

function executableName(command) {
  return process.platform === "win32" ? (WINDOWS_EXECUTABLES.get(command) ?? command) : command;
}

function commandExists(command) {
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(locator, [executableName(command)], { stdio: "ignore", shell: false });
  return result.status === 0;
}

function runNode(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`node ${path.basename(scriptPath)} fallo con codigo ${result.status}`);
  }
}

function runTool(cwd, command, args) {
  // En Windows npm/npx/mvn/gradle se resuelven a .cmd/.bat y desde Node 20.12 spawnSync
  // los rechaza con EINVAL (mitigacion de CVE-2024-27980) salvo con shell:true. Sin esto
  // result.status quedaba en null y TODO smoke check fallaba en Windows, en los 4 stacks.
  const useShell = process.platform === "win32";
  const result = spawnSync(executableName(command), args, { cwd, stdio: "inherit", shell: useShell });
  if (result.status !== 0) {
    const detalle = result.error ? ` (${result.error.code})` : "";
    throw new Error(`${command} ${args.join(" ")} fallo con codigo ${result.status}${detalle}`);
  }
}

function smokePlanForStack(stack) {
  switch (stack) {
    case "node-next":
      return [
        { cwd: ".", command: "npm", args: ["install"] },
        { cwd: ".", command: "npm", args: ["run", "build"] },
      ];
    case "java-monolith":
      return [
        { cwd: ".", command: "mvn", args: ["-q", "-DskipTests", "package"] },
      ];
    case "quarkus-angular":
      return [
        { cwd: "backend", command: "mvn", args: ["-q", "-DskipTests", "package"] },
        { cwd: "frontend", command: "npm", args: ["install"] },
        { cwd: "frontend", command: "npm", args: ["run", "build"] },
      ];
    case "spring-react":
      return [
        { cwd: "backend", command: "gradle", args: ["bootJar", "--no-daemon"] },
        { cwd: "frontend", command: "npm", args: ["install"] },
        { cwd: "frontend", command: "npm", args: ["run", "build"] },
      ];
    default:
      return [];
  }
}

function runGeneratedValidations(root, dest) {
  console.log("==> Validando estructura documental del repo generado");
  runNode(path.join(root, "ci", "scripts", "check-docs.mjs"), [dest]);
  console.log("==> Validando instanciacion tecnica del repo generado");
  runNode(path.join(root, "ci", "scripts", "check-template-instantiation.mjs"), [
    "--mode", "instantiated",
    "--root", dest,
  ]);
}

function runGeneratedSmokeChecks(dest, stack) {
  const plan = smokePlanForStack(stack);
  const missingTools = [...new Set(plan.map((step) => step.command).filter((command) => !commandExists(command)))];
  if (missingTools.length > 0) {
    throw new Error(
      `No se puede completar el smoke check del stack ${stack}. Faltan herramientas en PATH: ${missingTools.join(", ")}`,
    );
  }

  console.log("==> Ejecutando smoke checks del stack generado");
  for (const step of plan) {
    const cwd = path.resolve(dest, step.cwd);
    console.log(`--> ${step.command} ${step.args.join(" ")} (${cwd})`);
    runTool(cwd, step.command, step.args);
  }
}

function runGit(cwd, args) {
  const result = spawnSync(executableName("git"), args, { cwd, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} fallo con codigo ${result.status}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return 0; }
  if (!args.stack || !args.config) {
    usage();
    return 1;
  }
  if (!SUPPORTED_STACKS.includes(args.stack)) {
    console.error(`Stack no soportado: ${args.stack}`);
    console.error(`Stacks soportados: ${SUPPORTED_STACKS.join(", ")}`);
    return 1;
  }

  const root = rootDir();
  const templateDir = path.join(root, "stacks", args.stack, "template");
  if (!fs.existsSync(templateDir)) {
    console.error(`No existe el template del stack: ${templateDir}`);
    return 1;
  }

  const configPath = resolveConfigPath(args.config, root);
  if (!configPath) {
    console.error(`No se encontro el archivo de config: ${args.config}`);
    return 1;
  }

  console.log("==> Validando config contra schema");
  const validation = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "validate-template-config.mjs"), "--config", configPath],
    { stdio: "inherit" },
  );
  if (validation.status !== 0) {
    console.error("Config invalida. Corrige los errores antes de instanciar el proyecto.");
    return 1;
  }

  const dest = path.resolve(args.dest ?? resolveDefaultDest(configPath));
  if (fs.existsSync(dest)) {
    const entries = fs.readdirSync(dest);
    if (!args.allowExistingEmpty || entries.length > 0) {
      console.error(`El destino ya existe: ${dest}`);
      return 1;
    }
    console.log(`==> Reutilizando destino vacio existente: ${dest}`);
  }

  console.log(`==> Copiando template ${args.stack} -> ${dest}`);
  copyDir(templateDir, dest);

  console.log("==> Instanciando tokens via scripts/init-project.mjs");
  runNode(path.join(root, "scripts", "init-project.mjs"), [
    "--config", configPath,
    "--root", dest,
  ]);

  runGeneratedValidations(root, dest);
  if (args.smoke) {
    runGeneratedSmokeChecks(dest, args.stack);
  } else {
    console.log("==> Smoke checks omitidos por --skip-smoke");
  }

  if (args.initGit) {
    console.log("==> Inicializando git");
    try {
      runGit(dest, ["init", "-q"]);
      runGit(dest, ["add", "-A"]);
      runGit(dest, ["commit", "-q", "-m", `chore: bootstrap desde stack ${args.stack}`]);
    } catch (error) {
      console.warn(`Aviso: git fallo (${error.message}). Puedes inicializar el repo manualmente.`);
    }
  }

  console.log(`
Servicio creado en: ${dest}
Config usada: ${configPath}
Proximos pasos:
  1. Revisar que la config final (nombres, dominios, package Java y catalogo) coincide con el proyecto real.
  2. Registrar el repo en GitHub/GitLab y hacer push inicial.
  3. Anadir catalog-info.yaml del servicio al catalogo Backstage organizacional.
  4. Crear ADR-001 con contexto de negocio en docs/fase-3-arquitectura/adr/.
  5. Habilitar los workflows .github/workflows/*.yml en la organizacion.
  6. Solicitar secrets: cosign (keyless via OIDC), infra, integraciones.

Validaciones ya ejecutadas automaticamente:
  node ${path.join(root, "ci", "scripts", "check-docs.mjs")} ${dest}
  node ${path.join(root, "ci", "scripts", "check-template-instantiation.mjs")} --mode instantiated --root ${dest}
  ${args.smoke ? "smoke checks del stack segun herramientas disponibles en PATH" : "smoke checks omitidos con --skip-smoke"}
`);
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(1);
}
