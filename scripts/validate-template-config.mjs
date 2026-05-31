#!/usr/bin/env node
// Validador de template.config.*.json sin dependencias externas.
// Soporta un subconjunto pragmatico de JSON Schema 2020-12 suficiente para nuestro schema:
//   - type (string, object, array, number, integer, boolean, null, o union via anyOf)
//   - required
//   - properties
//   - additionalProperties
//   - minLength
//   - pattern
//   - enum
//   - format ("uri": valida con new URL)
//
// Cross-platform: ESM puro, sin binarios.
// Uso:
//   node scripts/validate-template-config.mjs --config <path> [--schema <path>]
// Salida:
//   exit 0 si ok. exit 1 si hay errores, con listado por stdout.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { config: null, schema: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--config") args.config = argv[++i];
    else if (a === "--schema") args.schema = argv[++i];
    else if (a === "--help" || a === "-h") {
      printUsage();
      process.exit(0);
    }
  }
  return args;
}

function printUsage() {
  process.stdout.write(`Uso: node scripts/validate-template-config.mjs --config <path> [--schema <path>]\n`);
}

function readJson(p) {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchType(expected, actualType, value) {
  if (expected === "integer") return actualType === "number" && Number.isInteger(value);
  if (expected === "number") return actualType === "number";
  return expected === actualType;
}

function validate(node, schema, pathSegs, errors) {
  const actualType = typeOf(node);

  if (schema.enum) {
    if (!schema.enum.includes(node)) {
      errors.push({
        path: pathSegs.join(".") || "<root>",
        msg: `valor '${JSON.stringify(node)}' no esta en enum ${JSON.stringify(schema.enum)}`,
      });
      return;
    }
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchType(t, actualType, node))) {
      errors.push({
        path: pathSegs.join(".") || "<root>",
        msg: `tipo incorrecto: se esperaba ${types.join("|")}, se encontro ${actualType}`,
      });
      return;
    }
  }

  if (actualType === "string") {
    if (typeof schema.minLength === "number" && node.length < schema.minLength) {
      errors.push({
        path: pathSegs.join(".") || "<root>",
        msg: `string muy corto (min ${schema.minLength}, actual ${node.length})`,
      });
    }
    if (schema.pattern) {
      try {
        const re = new RegExp(schema.pattern);
        if (!re.test(node)) {
          errors.push({
            path: pathSegs.join(".") || "<root>",
            msg: `no coincide con pattern ${schema.pattern}`,
          });
        }
      } catch (ex) {
        errors.push({
          path: pathSegs.join(".") || "<root>",
          msg: `pattern regex invalido: ${schema.pattern}`,
        });
      }
    }
    if (schema.format === "uri") {
      try {
        new URL(node);
      } catch {
        errors.push({
          path: pathSegs.join(".") || "<root>",
          msg: `formato uri invalido: '${node}'`,
        });
      }
    }
  }

  if (actualType === "object" && schema.properties) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in node)) {
          errors.push({
            path: [...pathSegs, key].join(".") || key,
            msg: `campo requerido ausente`,
          });
        }
      }
    }
    for (const [key, child] of Object.entries(node)) {
      if (schema.properties[key]) {
        validate(child, schema.properties[key], [...pathSegs, key], errors);
      } else if (schema.additionalProperties === false) {
        errors.push({
          path: [...pathSegs, key].join("."),
          msg: `propiedad no permitida`,
        });
      }
    }
  }

  if (actualType === "array" && schema.items) {
    node.forEach((el, idx) => {
      validate(el, schema.items, [...pathSegs, `[${idx}]`], errors);
    });
  }
}

function resolveSchemaPath(args) {
  if (args.schema) return path.resolve(args.schema);
  const repoRoot = path.resolve(__dirname, "..");
  return path.join(repoRoot, "scripts", "schema", "template.config.schema.json");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) {
    process.stderr.write("Error: --config es requerido\n");
    printUsage();
    process.exit(2);
  }
  const configPath = path.resolve(args.config);
  const schemaPath = resolveSchemaPath(args);

  let schema;
  let config;
  try {
    schema = readJson(schemaPath);
  } catch (ex) {
    process.stderr.write(`Error leyendo schema (${schemaPath}): ${ex.message}\n`);
    process.exit(2);
  }
  try {
    config = readJson(configPath);
  } catch (ex) {
    process.stderr.write(`Error leyendo config (${configPath}): ${ex.message}\n`);
    process.exit(2);
  }

  const errors = [];
  validate(config, schema, [], errors);

  if (errors.length === 0) {
    process.stdout.write(`OK. ${configPath} cumple el schema.\n`);
    process.exit(0);
  }

  process.stderr.write(`Se encontraron ${errors.length} error(es) en ${configPath}:\n`);
  for (const e of errors) {
    process.stderr.write(`  - ${e.path}: ${e.msg}\n`);
  }
  process.exit(1);
}

main();
