#!/usr/bin/env node
/**
 * check-tasks-executable.mjs (v12.119)
 *
 * Verifica que cada specs/<slug>/spec-tareas.md tenga la TABLA EJECUTABLE canonica
 * y que cada fila sea strict:
 *   - id matches /^T-\d{3,}$/
 *   - rf matches /^RF-[A-Z0-9-]+$/ y existe en spec-funcional.md
 *   - tipo in {test, impl, refactor, doc}
 *   - archivo: no placeholder (<...>, TBD, vacio)
 *   - test: no placeholder (excepto "(self)" para filas tipo=test)
 *   - comando_red / comando_green: no placeholder, no <comando>
 *   - expected_red / expected_green: no vacio
 *   - estado in {pending, in_progress, done, blocked}
 *   - Para tipo=impl: depende_de debe referir un T existente tipo=test
 *
 * Default STRICT (en check:project).
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VALID_TIPO = new Set(["test", "impl", "refactor", "doc"]);
const VALID_ESTADO = new Set(["pending", "in_progress", "done", "blocked"]);
const PLACEHOLDER_RE = /<[^>]+>|^\s*$|\bTBD\b|\bTODO\b|\bFIXME\b|\bpendiente\b|por definir/i;
const COL_NAMES = ["id", "rf", "tipo", "archivo", "test", "comando_red", "expected_red", "comando_green", "expected_green", "depende_de", "paralelizable", "estado"];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true);
const featureFilter = args.feature ? String(args.feature).trim() : null;

const specsDir = join(root, "specs");
const blockers = [];
const warnings = [];
let evaluated = 0;

if (existsSync(specsDir)) {
  const entries = readdirSync(specsDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!/^\d{3,}-[a-z0-9-]+/i.test(e.name)) continue;
    if (e.name.startsWith("000-")) continue;
    if (featureFilter && e.name !== featureFilter) continue;
    const featureDir = join(specsDir, e.name);
    const tareasPath = join(featureDir, "spec-tareas.md");
    if (!existsSync(tareasPath)) continue; // check:tasks lo reporta
    evaluated += 1;
    const tareas = readFileSync(tareasPath, "utf8");
    const specFunPath = join(featureDir, "spec-funcional.md");
    const specFun = existsSync(specFunPath) ? readFileSync(specFunPath, "utf8") : "";
    const rfsInSpec = new Set([...specFun.matchAll(/\b(RF-[A-Z0-9-]+|RNF-[A-Z0-9-]+)/g)].map((m) => m[1]));

    // Localiza la tabla bajo "## Tabla ejecutable de tareas". Tomamos desde el header
    // hasta el siguiente "## " o EOF. Anchored al inicio de linea para no matchear
    // menciones dentro de codigo inline.
    const headRe = /^##\s+Tabla ejecutable de tareas\b[^\n]*\n/im;
    const headMatch = tareas.match(headRe);
    if (!headMatch) {
      blockers.push(`specs/${e.name}/spec-tareas.md:1: falta seccion "## Tabla ejecutable de tareas" (v12.119+)`);
      continue;
    }
    const startIdx = headMatch.index + headMatch[0].length;
    const rest = tareas.slice(startIdx);
    // Siguiente "## " al inicio de linea o EOF.
    const nextSect = rest.match(/^##\s/m);
    const tableText = nextSect ? rest.slice(0, nextSect.index) : rest;
    const lines = tableText.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
    if (lines.length < 3) {
      blockers.push(`specs/${e.name}/spec-tareas.md:1: la tabla no tiene filas de datos (encabezado + separador + ≥1 fila)`);
      continue;
    }
    // Header (linea 0), separador (linea 1), datos (lineas 2+).
    const header = parseRow(lines[0]);
    if (!validHeader(header)) {
      blockers.push(`specs/${e.name}/spec-tareas.md:1: encabezado de tabla invalido. Esperado: ${COL_NAMES.join(" | ")}`);
      continue;
    }
    const seenIds = new Set();
    const testIds = new Set();
    const rowsAll = [];
    for (let i = 2; i < lines.length; i += 1) {
      const cells = parseRow(lines[i]);
      if (cells.length !== COL_NAMES.length) {
        blockers.push(`specs/${e.name}/spec-tareas.md:${i + 1}: fila tiene ${cells.length} columnas; esperado ${COL_NAMES.length}`);
        continue;
      }
      const row = Object.fromEntries(COL_NAMES.map((c, idx) => [c, cells[idx]]));
      rowsAll.push(row);
      // Validaciones por fila.
      const rel = `specs/${e.name}/spec-tareas.md`;
      if (!/^T-\d{3,}$/.test(row.id)) blockers.push(`${rel}: id "${row.id}" no matchea /^T-\\d{3,}$/`);
      if (seenIds.has(row.id)) blockers.push(`${rel}: id duplicado "${row.id}"`);
      seenIds.add(row.id);
      if (row.tipo === "test") testIds.add(row.id);
      if (!/^(RF|RNF)-[A-Z0-9-]+$/.test(row.rf)) blockers.push(`${rel}: ${row.id} rf "${row.rf}" no matchea RF-XX o RNF-XX`);
      else if (rfsInSpec.size > 0 && !rfsInSpec.has(row.rf)) blockers.push(`${rel}: ${row.id} rf "${row.rf}" no existe en spec-funcional.md`);
      if (!VALID_TIPO.has(row.tipo)) blockers.push(`${rel}: ${row.id} tipo "${row.tipo}" no valido (esperado: ${[...VALID_TIPO].join("|")})`);
      if (!VALID_ESTADO.has(row.estado)) blockers.push(`${rel}: ${row.id} estado "${row.estado}" no valido (esperado: ${[...VALID_ESTADO].join("|")})`);
      // Strict cuando estado != pending: no se aceptan placeholders.
      const isStrict = row.estado !== "pending";
      const checkCell = (col, allowSelf = false) => {
        const v = row[col];
        if (!v || v === "-" || (allowSelf && v === "(self)")) {
          if (col === "depende_de" || col === "test") return;
          if (col === "paralelizable") return;
          blockers.push(`${rel}: ${row.id} columna ${col} esta vacia`);
          return;
        }
        if (PLACEHOLDER_RE.test(v) && !(allowSelf && v === "(self)")) {
          (isStrict ? blockers : warnings).push(`${rel}: ${row.id} columna ${col} tiene placeholder "${v}" (estado=${row.estado})`);
        }
      };
      checkCell("archivo");
      if (row.tipo === "impl" || row.tipo === "refactor") checkCell("test");
      else if (row.tipo === "test") checkCell("test", true);
      checkCell("comando_red");
      checkCell("expected_red");
      checkCell("comando_green");
      checkCell("expected_green");
      // depende_de para impl: debe referir un T tipo=test existente.
      if (row.tipo === "impl" && row.depende_de !== "-" && row.depende_de) {
        if (!seenIds.has(row.depende_de) && !rowsAll.some((r) => r.id === row.depende_de)) {
          warnings.push(`${rel}: ${row.id} depende_de "${row.depende_de}" no es un T conocido aun (verifica orden)`);
        }
      }
    }
    // Cobertura: cada RF de spec-funcional debe tener al menos un T.
    const rfsInRows = new Set(rowsAll.map((r) => r.rf));
    for (const rf of rfsInSpec) {
      if (rf.startsWith("RNF-")) continue; // RNFs son opcionales en tabla
      if (!rfsInRows.has(rf)) warnings.push(`specs/${e.name}/spec-tareas.md:1: ${rf} declarado en spec-funcional no tiene ninguna fila T en la tabla ejecutable`);
    }
  }
}

console.log(`check-tasks-executable (v12.119) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`spec-tareas.md evaluadas: ${evaluated}`);

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`OK. Tabla ejecutable de tareas verificada en todas las features.`);
  process.exit(0);
}

if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ ${b}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ ${w}`);
}
console.error(`\nFix sugerido: ver protocolo de planning en ai/protocols/planning.md.`);
process.exit(strict && blockers.length > 0 ? 1 : 0);

function parseRow(line) {
  // "| a | b | c |" -> ["a", "b", "c"]
  return line.split("|").slice(1, -1).map((s) => s.trim());
}

function validHeader(cells) {
  if (cells.length !== COL_NAMES.length) return false;
  return cells.every((c, i) => c.toLowerCase() === COL_NAMES[i]);
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
