#!/usr/bin/env node
/**
 * generate-openapi.mjs (v12.50)
 *
 * Ensambla `contracts/api/openapi.yaml` consolidado a partir de los
 * `specs/<feature>/api-contract.md` de cada feature. Cierra el patron real
 * visto en los 3 casos auditados: agentes generaron endpoints en cada
 * api-contract.md pero el openapi.yaml quedo desincronizado o vacio.
 *
 * Que extrae de cada api-contract.md:
 *   - Bloques YAML embebidos entre triple-backtick yaml.
 *   - Hace merge inteligente: paths se concatenan; components.schemas se mergean;
 *     conflictos del mismo path entre features se warningean.
 *
 * Uso:
 *   node scripts/generate-openapi.mjs                # produce contracts/api/openapi.yaml
 *   node scripts/generate-openapi.mjs --dry-run      # solo reporta, no escribe
 *   node scripts/generate-openapi.mjs --check        # exit 1 si el yaml existente no coincide
 *   node scripts/generate-openapi.mjs --out <path>   # custom output path
 *
 * Exit codes:
 *   0 - generado / sin cambios
 *   1 - error de parsing
 *   2 - en modo --check, hay drift entre api-contract.md y openapi.yaml
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const outPath = args.out ? resolve(args.out) : join(root, "contracts", "api", "openapi.yaml");
const dryRun = !!args["dry-run"];
const checkMode = !!args.check;

const specsRoot = join(root, "specs");
if (!existsSync(specsRoot)) {
  console.error(`No existe ${specsRoot}. Genera features primero con: npm run scaffold:feature`);
  process.exit(1);
}

const featureDirs = readdirSync(specsRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d{3,}-/.test(e.name))
  .map((e) => e.name);

// Modelo intermedio.
const merged = {
  paths: {},        // { "/api/x": { get: {...}, post: {...} } }
  components: { schemas: {} },
  features: [],     // tracking de origen
  warnings: [],
};

const pathConflicts = new Map();

for (const slug of featureDirs) {
  const apiPath = join(specsRoot, slug, "api-contract.md");
  if (!existsSync(apiPath)) continue;
  const text = readFileSync(apiPath, "utf8");

  // Extraer bloques ```yaml ... ```
  const yamlBlocks = [...text.matchAll(/```ya?ml\s*\n([\s\S]*?)\n```/gi)].map((m) => m[1]);
  if (yamlBlocks.length === 0) {
    merged.warnings.push(`${slug}: sin bloques YAML en api-contract.md. Agrega ejemplos como en plantillas/fase-4-sdd/api-contract.md`);
    continue;
  }

  for (const block of yamlBlocks) {
    const parsed = parseSimpleYaml(block);
    if (!parsed) continue;

    // Mergear paths.
    if (parsed.paths) {
      for (const [p, methods] of Object.entries(parsed.paths)) {
        if (!merged.paths[p]) merged.paths[p] = {};
        for (const [method, def] of Object.entries(methods)) {
          if (merged.paths[p][method]) {
            const prev = pathConflicts.get(`${method.toUpperCase()} ${p}`) || [];
            pathConflicts.set(`${method.toUpperCase()} ${p}`, [...prev, slug]);
          }
          merged.paths[p][method] = { ...def, "x-source-feature": slug };
        }
      }
    }

    // Mergear components.schemas.
    if (parsed.components && parsed.components.schemas) {
      for (const [name, schema] of Object.entries(parsed.components.schemas)) {
        if (merged.components.schemas[name] && JSON.stringify(merged.components.schemas[name]) !== JSON.stringify(schema)) {
          merged.warnings.push(`${slug}: redefine schema "${name}" con shape distinta (puede romper consumidores).`);
        }
        merged.components.schemas[name] = schema;
      }
    }
  }

  merged.features.push(slug);
}

for (const [endpoint, slugs] of pathConflicts) {
  if (slugs.length >= 1) {
    merged.warnings.push(`Endpoint ${endpoint} definido en multiples features: ${slugs.join(", ")} (ultima definicion gana).`);
  }
}

// Construir YAML resultante.
const header = `openapi: 3.0.3
info:
  title: API consolidada (generado por scripts/generate-openapi.mjs)
  version: 1.0.0
  description: |
    Este archivo es generado automaticamente desde los api-contract.md
    de cada specs/<feature>/. NO editar a mano — perdera los cambios al
    proximo \`npm run generate:openapi\`.
    Features fuente: ${merged.features.join(", ") || "(ninguna)"}
servers:
  - url: /
`;

const pathsYaml = Object.keys(merged.paths).length === 0
  ? "paths: {}\n"
  : "paths:\n" + Object.entries(merged.paths)
    .map(([p, methods]) => `  ${p}:\n` + Object.entries(methods)
      .map(([method, def]) => `    ${method}:\n${indentYaml(serializeNode(def), 6)}\n`)
      .join("")
    ).join("");

const schemasYaml = Object.keys(merged.components.schemas).length === 0
  ? ""
  : "\ncomponents:\n  schemas:\n" + Object.entries(merged.components.schemas)
    .map(([name, schema]) => `    ${name}:\n${indentYaml(serializeNode(schema), 6)}\n`)
    .join("");

const output = header + pathsYaml + schemasYaml;

const pathCount = Object.keys(merged.paths).length;
const operationCount = Object.values(merged.paths).reduce((a, b) => a + Object.keys(b).length, 0);
const schemaCount = Object.keys(merged.components.schemas).length;

console.log(`generate-openapi (v12.50)`);
console.log(`Features procesadas:     ${merged.features.length}`);
console.log(`Paths consolidados:      ${pathCount}`);
console.log(`Operaciones (METHOD):    ${operationCount}`);
console.log(`Schemas (components):    ${schemaCount}`);

if (merged.warnings.length > 0) {
  console.log(`\nWarnings:`);
  for (const w of merged.warnings) console.log(`  ⚠ ${w}`);
}

if (dryRun) {
  console.log(`\n(dry-run) NO se escribio ${outPath.replace(root, "<root>")}`);
  process.exit(0);
}

if (checkMode) {
  if (!existsSync(outPath)) {
    console.error(`\ncheck-mode: ${outPath.replace(root, "<root>")} no existe. Corre sin --check para generarlo.`);
    process.exit(2);
  }
  const existing = readFileSync(outPath, "utf8");
  if (existing.trim() === output.trim()) {
    console.log(`\ncheck-mode: openapi.yaml coincide con api-contract.md. Sin drift.`);
    process.exit(0);
  } else {
    console.error(`\ncheck-mode: DRIFT detectado entre api-contract.md y ${outPath.replace(root, "<root>")}.`);
    console.error(`Corre 'npm run generate:openapi' para regenerar.`);
    process.exit(2);
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, output, "utf8");
console.log(`\nOK. ${outPath.replace(root, "<root>")} regenerado (${output.length} bytes).`);
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
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

/**
 * Parser YAML minimalista. Sin dependencias externas; suficiente para
 * el subset que escriben los agentes en api-contract.md (paths/components).
 * Limitaciones: no soporta anchors, multiline strings (>|), tagging.
 * Para casos complejos, los agentes deben validar con un parser real.
 */
function parseSimpleYaml(text) {
  const lines = text.split(/\r?\n/);
  // Para casos simples, hacemos algo basico: convertir a JSON via heuristica de indentacion.
  // En realidad, ya que el output canonico que generamos lo escribe el script, podemos
  // simplemente extraer top-level keys "paths:" y "components:" y mantenerlos como rawNodes.
  const root = parseBlock(lines, 0, 0).value;
  return root;
}

function parseBlock(lines, startIdx, indent) {
  const result = {};
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) { i += 1; continue; }
    const currentIndent = line.length - line.trimStart().length;
    if (currentIndent < indent) return { value: result, nextIdx: i };
    if (currentIndent > indent) { i += 1; continue; } // contenido de sub-bloque, lo procesa el recursivo
    const keyMatch = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (!keyMatch) { i += 1; continue; }
    const key = keyMatch[2].trim();
    const inline = keyMatch[3].trim();
    if (inline === "" || inline === "|" || inline === ">") {
      // sub-bloque
      const sub = parseBlock(lines, i + 1, currentIndent + 2);
      result[key] = sub.value;
      i = sub.nextIdx;
    } else if (inline.startsWith("[") && inline.endsWith("]")) {
      result[key] = inline.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
      i += 1;
    } else if (inline.startsWith("'") || inline.startsWith('"')) {
      result[key] = inline.slice(1, -1);
      i += 1;
    } else if (/^-?\d+$/.test(inline)) {
      result[key] = Number(inline);
      i += 1;
    } else if (inline === "true" || inline === "false") {
      result[key] = inline === "true";
      i += 1;
    } else {
      result[key] = inline;
      i += 1;
    }
  }
  return { value: result, nextIdx: i };
}

function serializeNode(node, indent = 0) {
  if (node === null || node === undefined) return "null";
  if (typeof node === "string") {
    if (/[:#\n]/.test(node) || /^[\d-]/.test(node)) return `"${node.replace(/"/g, '\\"')}"`;
    return node;
  }
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) {
    return node.map((item) => `- ${typeof item === "object" ? "\n" + indentYaml(serializeNode(item), 2) : serializeNode(item)}`).join("\n");
  }
  if (typeof node === "object") {
    return Object.entries(node)
      .filter(([k]) => k !== "x-source-feature" || !args["no-source"])
      .map(([k, v]) => {
        if (v === null || v === undefined) return `${k}: null`;
        if (typeof v === "object") {
          if (Array.isArray(v)) {
            return `${k}:\n${indentYaml(serializeNode(v), 2)}`;
          }
          return `${k}:\n${indentYaml(serializeNode(v), 2)}`;
        }
        return `${k}: ${serializeNode(v)}`;
      }).join("\n");
  }
  return "";
}

function indentYaml(text, spaces) {
  const pad = " ".repeat(spaces);
  return text.split("\n").map((l) => l ? pad + l : l).join("\n");
}
