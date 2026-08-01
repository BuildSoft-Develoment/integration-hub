#!/usr/bin/env node
/**
 * check-global-matrix.mjs (v12.145)
 *
 * Exige que TRACEABILITY_MATRIX.md sea de verdad el rollup que dice ser, y que los codigos de
 * requisito de proyecto sean unicos.
 *
 * POR QUE EXISTE. La metodologia ya nombraba este fallo: `_lib/phase-contracts.mjs` lista
 * "TRACEABILITY_MATRIX.md (matriz consolidada)" en el `debeActualizar` de fase 1, exige
 * "TRACEABILITY_MATRIX.md raiz actualizada" en su `debeValidar`, y tiene literalmente
 * "Cambiar RFs sin actualizar TRACEABILITY_MATRIX.md" en su lista de antipatrones. Pasaba igual,
 * porque `check-phase-contract.mjs` solo comprueba que los ficheros EXISTAN, nunca su contenido.
 *
 * Lo que encontro al escribirlo, con la matriz "en verde":
 *   - `008-mensajeria-pagos` -la feature del money-path- no aparecia NI UNA VEZ. La matriz
 *     hablaba de "las siete features" y afirmaba "Requerimientos sin implementacion: Ninguno"
 *     mientras RF-015, RF-020 y RF-021 de 008 estaban sin implementar.
 *   - `004-observabilidad-y-auditoria` tenia 10 RF en su spec y solo 5 filas en la matriz.
 *   - `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` tenia `RF-10`
 *     DUPLICADO: money-path y tema del sistema compartian codigo canonico.
 * Nada de eso hacia fallar ningun gate, y `sync-memory` parsea este fichero para poblar
 * `ai_trace_links`: lo que no esta aqui, no existe para la memoria del proyecto.
 *
 * QUE COMPRUEBA
 *   1. Cada feature incluida tiene AL MENOS una fila en la matriz global.
 *   2. El conjunto de RF de la matriz coincide con el de `specs/<slug>/traceability.md`.
 *      En ambos sentidos: ni faltan ni sobran. Un RF de mas apunta a algo que ya no existe.
 *   3. Los codigos de proyecto (`RF-NN`/`RNF-NN`) del analisis de fase 1 no se repiten.
 *   4. Toda fila de la matriz tiene el mismo numero de columnas que la cabecera.
 *
 * Modos: --strict (exit 1, default segun CHECK_STRICT) · --warn · --root <path>
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v12.145";
const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);

const matrizPath = join(root, "TRACEABILITY_MATRIX.md");
const analisisPath = join(root, "docs", "fase-1-analisis-requerimientos", "01.00-analisis-requerimientos.md");
const hallazgos = [];

console.log(`check-global-matrix (${VERSION})`);

if (!existsSync(matrizPath)) {
  console.error(`\nNo existe TRACEABILITY_MATRIX.md en la raiz. Es el rollup que sync-memory parsea.`);
  process.exit(strict ? 1 : 0);
}
const matriz = readFileSync(matrizPath, "utf8");
const lineasMatriz = matriz.split(/\r?\n/);

// ── 1) RF por feature segun la matriz ────────────────────────────────────────────────
const enMatriz = new Map();
for (const linea of lineasMatriz) {
  const m = linea.match(/^\|\s*([0-9]{3}-[a-z0-9-]+)\s*\|\s*(RF-\d+)\s*\|/);
  if (!m) continue;
  if (!enMatriz.has(m[1])) enMatriz.set(m[1], new Set());
  enMatriz.get(m[1]).add(m[2]);
}

// Censo independiente: no se confia solo en la libreria (ver check-feature-origin).
const specsRoot = join(root, "specs");
const enDisco = existsSync(specsRoot)
  ? readdirSync(specsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^[0-9]{3}-/.test(e.name) && !e.name.startsWith("000-"))
      .map((e) => e.name)
      .sort()
  : [];
const features = listIncludedFeatures(root);
if (enDisco.length > 0 && features.length === 0) {
  console.error(`\nCENSO VACIO: ${enDisco.length} feature(s) en specs/ y listIncludedFeatures() devolvio 0.`);
  process.exit(1);
}

let filasTotales = 0;
for (const slug of features) {
  const tracePath = join(specsRoot, slug, "traceability.md");
  if (!existsSync(tracePath)) {
    hallazgos.push(`${slug}: no tiene traceability.md, no se puede contrastar con la matriz global.`);
    continue;
  }
  const enSpec = new Set();
  for (const linea of readFileSync(tracePath, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\|\s*(RF-\d+)\s*\|/);
    if (m) enSpec.add(m[1]);
  }
  const mat = enMatriz.get(slug) || new Set();
  filasTotales += mat.size;

  if (mat.size === 0) {
    hallazgos.push(
      `${slug}: NO APARECE en TRACEABILITY_MATRIX.md (${enSpec.size} RF en su traceability.md). `
      + `El rollup global no la incluye, asi que sync-memory no la ingiere y cualquier lectura de `
      + `"que hay pendiente en el proyecto" la omite por completo.`,
    );
    continue;
  }
  const faltan = [...enSpec].filter((rf) => !mat.has(rf)).sort();
  const sobran = [...mat].filter((rf) => !enSpec.has(rf)).sort();
  if (faltan.length > 0) {
    hallazgos.push(`${slug}: ${faltan.length} RF en su traceability.md sin fila en la matriz global: ${faltan.join(", ")}.`);
  }
  if (sobran.length > 0) {
    hallazgos.push(`${slug}: ${sobran.length} RF en la matriz global que su traceability.md no declara: ${sobran.join(", ")}. Apuntan a algo que ya no existe.`);
  }
}

// ── 2) columnas coherentes ───────────────────────────────────────────────────────────
const cabecera = lineasMatriz.find((l) => /^\|\s*Feature\s*\|\s*RF\s*\|/.test(l));
if (cabecera) {
  const nCols = cabecera.split("|").length;
  const malas = [];
  for (let i = 0; i < lineasMatriz.length; i += 1) {
    if (!/^\|\s*[0-9]{3}-[a-z0-9-]+\s*\|\s*RF-\d+\s*\|/.test(lineasMatriz[i])) continue;
    if (lineasMatriz[i].split("|").length !== nCols) malas.push(i + 1);
  }
  if (malas.length > 0) {
    hallazgos.push(`la matriz tiene ${malas.length} fila(s) con distinto numero de columnas que la cabecera (lineas: ${malas.slice(0, 8).join(", ")}${malas.length > 8 ? "..." : ""}).`);
  }
}

// ── 3) codigos de proyecto unicos ────────────────────────────────────────────────────
let codigosProyecto = 0;
if (existsSync(analisisPath)) {
  const texto = readFileSync(analisisPath, "utf8");
  for (const prefijo of ["RF", "RNF"]) {
    const vistos = new Map();
    const re = new RegExp("^\\s*-\\s*`(" + prefijo + "-\\d{2})`", "gm");
    let m;
    while ((m = re.exec(texto)) !== null) {
      vistos.set(m[1], (vistos.get(m[1]) || 0) + 1);
    }
    codigosProyecto += vistos.size;
    for (const [codigo, veces] of vistos) {
      if (veces > 1) {
        hallazgos.push(
          `01.00-analisis-requerimientos.md: el codigo de proyecto \`${codigo}\` esta definido ${veces} veces. `
          + `Dos requisitos distintos con el mismo codigo canonico rompen toda referencia aguas abajo `
          + `(casos de uso, historias, la columna "Req. global" de la matriz): quien lo cite no dice cual de los dos.`,
        );
      }
    }
  }
} else {
  hallazgos.push(`no existe ${analisisPath.replace(root, ".")}; el contrato de fase 1 lo exige.`);
}

console.log(`Features: ${features.length} · filas RF en la matriz global: ${filasTotales} · codigos de proyecto: ${codigosProyecto}`);

if (hallazgos.length === 0) {
  console.log("OK. La matriz global cubre todas las features RF a RF, y los codigos de proyecto son unicos.");
  process.exit(0);
}

console.error(`\nMATRIZ GLOBAL INCOMPLETA O INCOHERENTE: ${hallazgos.length} hallazgo(s).`);
for (const h of hallazgos) console.error(`  ✗ ${h}`);
console.error(`\nPor que importa: 'scripts/ai-framework-agent.mjs sync-memory' parsea este fichero para`);
console.error(`poblar ai_trace_links. Una feature que no esta aqui no existe para la memoria del proyecto,`);
console.error(`por completa que este su specs/<slug>/. La metodologia ya lo exige: ver 'debeActualizar' y`);
console.error(`el antipatron "Cambiar RFs sin actualizar TRACEABILITY_MATRIX.md" en _lib/phase-contracts.mjs.`);

process.exit(strict ? 1 : 0);

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
