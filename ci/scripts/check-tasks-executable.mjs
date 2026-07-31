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
    // Header (linea 0), separador (linea 1), datos (el resto).
    const header = parseRow(lines[0]);
    if (!validHeader(header)) {
      blockers.push(`specs/${e.name}/spec-tareas.md:1: encabezado de tabla invalido. Esperado: ${COL_NAMES.join(" | ")}`);
      continue;
    }
    const seenIds = new Set();
    const testIds = new Set();
    const rowsAll = [];
    // Se saltan cabeceras y separadores DONDE SEA, no solo las dos primeras lineas.
    //
    // La seccion "Tabla ejecutable de tareas" puede contener varias sub-tablas -spec 008 tiene una
    // por sprint, cada una bajo su `###`-, que es estructura legitima y util. Al aplanar de `##` a
    // `##` y saltar solo dos lineas, las cabeceras de la segunda y la tercera sub-tabla entraban
    // como filas de datos y producian 14 bloqueantes fantasma: id "id", id "---", estado "estado",
    // rf "rf", id duplicado "id"... El documento estaba bien; el parser era fragil.
    const isSeparator = (l) => /^\|[\s:|-]+\|?$/.test(l.trim());
    const isHeader = (l) => /^\|\s*id\s*\|/i.test(l.trim());
    for (let i = 2; i < lines.length; i += 1) {
      if (isSeparator(lines[i]) || isHeader(lines[i])) continue;
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
      // La celda admite VARIOS requisitos separados por coma, y se valida cada uno.
      //
      // Antes exigia exactamente uno. Una tarea puede implementar varios requisitos y la spec del
      // camino del dinero lo hace: el formulario de pagos cubre RF-001..RF-004, MT101_PAY cubre
      // RF-004 y RF-016. Colapsar esas celdas a "el RF principal" para contentar al gate habria
      // dejado SIN NINGUNA TAREA a RF-004 (MT101_PAY), RF-014, RF-016, RF-021 y RF-022
      // (MT101_BUILD_FROM_TABLE) — medido. Es decir, habria borrado la trazabilidad de lo mas
      // critico del producto a cambio de un semaforo verde.
      //
      // Lo que si se exige es que la celda sea una lista de identificadores, sin rangos en prosa
      // ("RF-001 a RF-004", "RF-005..RF-008"): un rango no es verificable sin interpretar.
      const rfTokens = row.rf.split(",").map((s) => s.trim()).filter(Boolean);
      const rfShapeOk = rfTokens.length > 0 && rfTokens.every((t) => /^(RF|RNF)-[A-Z0-9-]+$/.test(t));
      if (!rfShapeOk) {
        blockers.push(`${rel}: ${row.id} rf "${row.rf}" no es una lista de RF-XX o RNF-XX separados por coma`);
      } else if (rfsInSpec.size > 0) {
        for (const t of rfTokens) {
          if (!rfsInSpec.has(t)) blockers.push(`${rel}: ${row.id} rf "${t}" no existe en spec-funcional.md`);
        }
      }
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
