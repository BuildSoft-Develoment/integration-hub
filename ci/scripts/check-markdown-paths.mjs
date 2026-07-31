#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { docPathRoots } from "./_lib/source-roots.mjs";

const PATH_EXTENSIONS = new Set([
  ".md",
  ".yml",
  ".yaml",
  ".json",
  ".mjs",
  ".js",
  ".ts",
  ".tsx",
  ".java",
  ".xml",
  ".tf",
  ".sh",
  ".ps1",
  ".sql",
  ".likec4",
  ".svg",
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
  ".tmp",
  "__pycache__",
  ".venv",
  // v12.130: git worktrees (sandboxes locales por T-NNN creados por agent:start).
  "worktrees",
  ".worktrees",
  // v12.138: artefactos generados por install:agent/skills:transpile (gitignored).
  // La fuente de verdad de las skills es ai/skills/, no el arbol transpilado.
  ".claude",
]);
const IGNORED_FILE_PREFIXES = [
  "CHANGELOG.md",
  "releases/",
  "revisiones/",
];
// Carpetas de registro fechado: una evidencia de QA describe lo que se verifico EL DIA que se
// verifico. Sus rutas se rompieron porque despues ADR-021 movio el codigo, no porque el documento
// este mal: reescribirlas para que el gate pase falsificaria el registro, que es justo lo que una
// evidencia no puede permitirse. `revisiones/` ya estaba exento arriba por la misma razon; esto
// extiende el criterio a las evidencias, que viven anidadas bajo `qa/fase-N/`.
const IGNORED_PATH_SEGMENTS = new Set(["evidencias"]);
const ROOT_PREFIXES = [
  ".github/",
  "ai/",
  "catalog/",
  "ci/",
  "contracts/",
  "docs/",
  "ejemplos/",
  "estimacion/",
  "escenarios/",
  "likec4/",
  "ops/",
  "plantillas/",
  "qa/",
  "scripts/",
  "specs/",
  "src/",
  "stacks/",
  "tests/",
];

/** Se rellena en main(): depende de la raiz del repositorio, que llega por argumento. */
let DOC_PATH_ROOTS = [];

function parseArgs(argv) {
  return { root: path.resolve(argv[0] || ".") };
}

function collectMarkdown(rootDir) {
  const files = [];
  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolute = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(absolute);
        }
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
        const ignored =
          IGNORED_FILE_PREFIXES.some((prefix) => relative === prefix || relative.startsWith(prefix)) ||
          relative.split("/").some((segment) => IGNORED_PATH_SEGMENTS.has(segment));
        if (!ignored) {
          files.push(absolute);
        }
      }
    }
  };
  visit(rootDir);
  return files.sort();
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

function looksLikePath(value) {
  if (!value.includes("/") && !value.includes("\\")) {
    return false;
  }
  if (/\s/.test(value.trim())) {
    return false;
  }
  // La elipsis tipografica U+2026 es lo mismo que "..." escrito con un solo caracter, y la
  // documentacion la usa para elidir tramos largos (`ops/…/onprem/int/`). El guard de arriba solo
  // cubria la version de tres puntos, asi que la misma abreviatura pasaba o fallaba segun como se
  // hubiera tecleado.
  if (/[<>{}*|$]/.test(value) || value.includes("NNN") || value.includes("...") || value.includes("…")) {
    return false;
  }
  if (/[A-Z]{2,}/.test(value) || /(^|\/)fase-x(\/|$)/.test(value) || /vX\.Y\.Z/.test(value)) {
    return false;
  }
  if (/^(https?:|s3:|ghcr\.io\/|gcr\.io\/|pkg:|mailto:)/.test(value)) {
    return false;
  }
  // Una barra inicial marca una URL servida por la aplicacion, no un fichero del repositorio:
  // `/plugins/catalog.json` lo descarga el host por HTTP, y su fuente vive en
  // `frontend/apps/web/public/`. Medido sobre el arbol completo: de los 27 valores en backticks que
  // empiezan por barra, los unicos que resolvian contra el disco eran `/` y `//` -separadores
  // sueltos, no rutas-, asi que descartarlos no pierde ni una comprobacion real.
  if (value.startsWith("/")) {
    return false;
  }
  const extension = path.extname(value.replace(/\\/g, "/"));
  return value.endsWith("/") || PATH_EXTENSIONS.has(extension);
}

function resolveCandidate(rootDir, markdownFile, rawValue) {
  const normalized = rawValue.replace(/\\/g, "/").replace(/^\.?\//, "");
  const relativeToFile = path.resolve(path.dirname(markdownFile), normalized);
  if (fs.existsSync(relativeToFile)) {
    return relativeToFile;
  }
  if (normalized.startsWith("../")) {
    return path.resolve(path.dirname(markdownFile), normalized);
  }
  // Las raices desde las que la documentacion cita codigo (raiz de paquete de cada modulo Maven, sus
  // resources, y `frontend/`). Ver el porque en _lib/source-roots.mjs. Se sigue exigiendo que el
  // fichero EXISTA; lo unico que cambia es desde donde se busca.
  //
  // Se prueban ANTES de dar por buena la raiz del repositorio, no despues. Un valor que empieza por
  // un ROOT_PREFIX (`scripts/`, `docs/`) tiene el mismo nombre en la raiz y dentro de `frontend/`:
  // resolver a la raiz sin comprobar que existe daba por rota `scripts/sign-plugin-remote.js`, que es
  // `frontend/scripts/sign-plugin-remote.js`. Se elige el primer candidato que EXISTE.
  const atRoot = path.resolve(rootDir, normalized);
  if (fs.existsSync(atRoot)) {
    return atRoot;
  }
  for (const docRoot of DOC_PATH_ROOTS) {
    const candidate = path.resolve(rootDir, docRoot, normalized);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  if (ROOT_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix))) {
    return atRoot;
  }
  if (normalized.endsWith("/") && !PATH_EXTENSIONS.has(path.extname(normalized))) {
    return path.resolve(path.dirname(markdownFile), normalized);
  }
  return atRoot;
}

function main() {
  const { root } = parseArgs(process.argv.slice(2));
  DOC_PATH_ROOTS = docPathRoots(root, fs, path);
  const findings = [];

  for (const file of collectMarkdown(root)) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/`([^`\n]+)`/g)) {
      const value = match[1].trim();
      if (!looksLikePath(value)) {
        continue;
      }
      const candidate = resolveCandidate(root, file, value);
      if (value.endsWith("/") && !ROOT_PREFIXES.some((prefix) => value.startsWith(prefix)) && !value.startsWith("../")) {
        if (!fs.existsSync(candidate)) {
          continue;
        }
      }
      if (!fs.existsSync(candidate)) {
        const relativeFile = path.relative(root, file).replace(/\\/g, "/");
        findings.push(
          `${relativeFile}:${lineNumberForIndex(text, match.index ?? 0)}: ruta en backticks no existe: ${value}`,
        );
      }
    }
  }

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    console.error(`\nTotal hallazgos: ${findings.length}`);
    return 1;
  }

  console.log("OK. Rutas en backticks verificadas sin hallazgos.");
  return 0;
}

process.exit(main());
