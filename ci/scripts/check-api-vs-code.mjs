#!/usr/bin/env node
/**
 * check-api-vs-code.mjs (v12.142)
 *
 * Cierra el blind-spot detectado en la auditoria 90.37: el resto del toolchain de
 * contratos compara DOCS contra DOCS (generate-openapi lee api-contract.md;
 * check-openapi-coverage cruza traceability ∩ openapi.yaml; check-api-documented
 * cruza api-contract.md ∪ openapi.yaml). NINGUNO mira el codigo real.
 *
 * Este validador compara los endpoints REALES del backend (anotaciones JAX-RS/Quarkus
 * `@Path` + `@GET/@POST/...`) contra `contracts/api/openapi.yaml`, y reporta los que
 * existen en codigo pero faltan en el contrato (drift codigo -> contrato).
 *
 * Generico y portable:
 *   - Lee los dirs a escanear de template.config.json (api.codeScanDirs); default
 *     ["platform-app/src/main/java"]. Si NINGUN dir existe (p.ej. el template, sin
 *     backend) -> N/A, exit 0. Si no hay openapi.yaml -> N/A, exit 0.
 *
 * Severidad:
 *   - default: WARNING (lista el drift, exit 0).
 *   - --strict: BLOQUEA (exit 1) si hay endpoints de codigo sin contrato.
 *
 * Uso:
 *   node ci/scripts/check-api-vs-code.mjs
 *   node ci/scripts/check-api-vs-code.mjs --strict
 */

process.removeAllListeners("warning");

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const root = resolve(process.argv.includes("--root") ? process.argv[process.argv.indexOf("--root") + 1] : ".");
const strict = process.argv.includes("--strict");

// ── Config: dirs de codigo a escanear ────────────────────────────────────────
function readScanDirs() {
  const cfgPath = join(root, "template.config.json");
  if (existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
      const dirs = cfg && cfg.api && Array.isArray(cfg.api.codeScanDirs) ? cfg.api.codeScanDirs : null;
      if (dirs && dirs.length) return dirs;
    } catch { /* ignora config invalida */ }
  }
  return ["platform-app/src/main/java"];
}

const scanDirs = readScanDirs().map((d) => join(root, d)).filter((d) => existsSync(d));
const openapiPath = join(root, "contracts", "api", "openapi.yaml");

// ── N/A: sin backend o sin contrato (p.ej. el template) ──────────────────────
if (scanDirs.length === 0 || !existsSync(openapiPath)) {
  console.log("check-api-vs-code (v12.142)");
  console.log(scanDirs.length === 0
    ? "⊘ N/A: no hay dirs de codigo backend para escanear (sin api.codeScanDirs / sin backend)."
    : "⊘ N/A: no existe contracts/api/openapi.yaml.");
  process.exit(0);
}

// ── Extraer endpoints reales del codigo (JAX-RS / Quarkus) ───────────────────
//
// OPTIONS y HEAD quedan FUERA: no son superficie de negocio sino comportamiento de transporte.
// OPTIONS es el preflight que emite el navegador antes de una peticion con CORS, y OpenAPI 3 no lo
// modela -se deriva de la configuracion CORS, no del contrato-. Medido: en todo el backend hay UN
// solo @OPTIONS, `BrandingResource.preflight()`, cuyo propio javadoc dice "Preflight CORS (por si el
// navegador lo emite)". Exigir que se contrate obligaria a documentar como endpoint algo que ningun
// cliente invoca a proposito, y sentaria el precedente para cada preflight futuro.
const HTTP_VERBS = "GET|POST|PUT|DELETE|PATCH";
function listJavaFiles(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) listJavaFiles(full, out);
    else if (e.isFile() && e.name.endsWith(".java")) out.push(full);
  }
  return out;
}
function joinPath(base, sub) {
  let p = (base || "") + (sub ? (sub.startsWith("/") ? sub : "/" + sub) : "");
  p = p.replace(/\/{2,}/g, "/");
  // normaliza params JAX-RS con regex: {id: \\d+} -> {id}
  p = p.replace(/\{\s*([A-Za-z0-9_]+)\s*:[^}]*\}/g, "{$1}");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}
function extractFromJava(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  const pathRe = /@Path\(\s*"([^"]*)"\s*\)/;
  const verbRe = new RegExp(`@(${HTTP_VERBS})\\b`);
  let base = "", sawClass = false, lastPathBeforeClass = "";
  let curVerb = null, curSub = null, stashedSub = null;
  for (const line of lines) {
    const pm = line.match(pathRe);
    const vm = line.match(verbRe);
    if (!sawClass) {
      if (pm) lastPathBeforeClass = pm[1];
      if (/\b(class|interface)\s+\w+/.test(line)) { base = lastPathBeforeClass; sawClass = true; }
      continue;
    }
    if (vm) { curVerb = vm[1]; curSub = stashedSub; stashedSub = null; continue; }
    if (pm) { if (curVerb !== null) curSub = pm[1]; else stashedSub = pm[1]; continue; }
    if (curVerb !== null) {
      const t = line.trim();
      if (t === "" || t.startsWith("@") || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) continue;
      // primera linea no-anotacion tras el verbo = firma del metodo -> emitir
      out.push(`${curVerb} ${joinPath(base, curSub)}`);
      curVerb = null; curSub = null;
    }
  }
  return out;
}

const codeEndpoints = new Set();
const codeByFile = new Map();
for (const dir of scanDirs) {
  for (const file of listJavaFiles(dir, [])) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("@Path")) continue;
    const eps = extractFromJava(text);
    if (eps.length) codeByFile.set(file, eps);
    eps.forEach((e) => codeEndpoints.add(e));
  }
}

// ── Extraer endpoints del openapi.yaml (parser ligero, igual que check-api-documented) ──
function extractFromOpenapi(text) {
  const set = new Set();
  const lines = text.split(/\r?\n/);
  let curPath = null, pathIndent = 0;
  for (const line of lines) {
    const pathM = line.match(/^(\s{2,4})(\/[A-Za-z0-9_\-/{}.]+):\s*$/);
    if (pathM) { curPath = pathM[2]; pathIndent = pathM[1].length; continue; }
    if (curPath) {
      const methM = line.match(/^(\s+)(get|post|put|patch|delete|head|options):\s*$/i);
      if (methM && methM[1].length > pathIndent) set.add(`${methM[2].toUpperCase()} ${curPath}`);
      else if (/^\s{0,2}\S/.test(line) && !/^\s/.test(line)) curPath = null; // salio del bloque paths
    }
  }
  return set;
}
const openapiEndpoints = extractFromOpenapi(readFileSync(openapiPath, "utf8"));

// ── Comparar: codigo - openapi = drift ───────────────────────────────────────
const missing = [...codeEndpoints].filter((e) => !openapiEndpoints.has(e)).sort();

console.log("check-api-vs-code (v12.142)");
console.log(`Endpoints en codigo: ${codeEndpoints.size} · en openapi.yaml: ${openapiEndpoints.size} · faltantes en contrato: ${missing.length}`);
if (missing.length === 0) {
  console.log("OK. Todos los endpoints del backend estan en contracts/api/openapi.yaml.");
  process.exit(0);
}
const tag = strict ? "✗" : "⚠";
console.log(`\n${tag} Endpoints REALES del backend ausentes de openapi.yaml (drift codigo -> contrato):`);
for (const e of missing) console.log(`   ${e}`);
console.log("\nAccion: documenta cada uno en el api-contract.md de su feature (## Paths OpenAPI) y corre `npm run generate:openapi`.");
if (strict) { console.log("\nMODO STRICT: bloquea (exit 1)."); process.exit(1); }
console.log("\nMODO WARNING: no bloquea (exit 0). Se promovera a --strict cuando el contrato este completo.");
process.exit(0);
