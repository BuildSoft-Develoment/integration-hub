#!/usr/bin/env node
/**
 * check-rbac-vs-code.mjs (v12.143)
 *
 * Guarda el RBAC REAL del producto contra su matriz canonica documentada (ADR-003),
 * cerrando el mismo tipo de blind-spot que check-api-vs-code cerro para la API: que el
 * codigo y la documentacion de roles no diverjan.
 *
 * Que hace:
 *   - Extrae el conjunto de roles usados en `@RolesAllowed(...)` del backend (JAX-RS/Quarkus).
 *   - Lee el ADR de RBAC (matriz endpoint x rol) y verifica que TODO rol real este
 *     documentado, y que NINGUN rol documentado haya desaparecido del codigo.
 *
 * Generico/portable:
 *   - Dirs de codigo de template.config.json (api.codeScanDirs); default platform-app/src/main/java.
 *   - ADR: docs/fase-3-arquitectura/adr/ADR-003-rbac-endpoint-rol.md (override --adr).
 *   - Si no hay backend o no hay ADR -> N/A, exit 0 (p.ej. el template).
 *
 * Severidad: WARNING por defecto; --strict bloquea (exit 1) ante drift de roles.
 *
 * Uso: node ci/scripts/check-rbac-vs-code.mjs [--strict] [--root <repo>] [--adr <path>]
 */

process.removeAllListeners("warning");

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const argv = process.argv.slice(2);
const root = resolve(argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : ".");
const strict = argv.includes("--strict");
const adrArg = argv.includes("--adr") ? argv[argv.indexOf("--adr") + 1] : null;

function readScanDirs() {
  const cfgPath = join(root, "template.config.json");
  if (existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
      const dirs = cfg && cfg.api && Array.isArray(cfg.api.codeScanDirs) ? cfg.api.codeScanDirs : null;
      if (dirs && dirs.length) return dirs;
    } catch { /* ignora */ }
  }
  return ["platform-app/src/main/java"];
}

const scanDirs = readScanDirs().map((d) => join(root, d)).filter((d) => existsSync(d));
const adrPath = adrArg ? resolve(adrArg) : join(root, "docs", "fase-3-arquitectura", "adr", "ADR-003-rbac-endpoint-rol.md");

if (scanDirs.length === 0 || !existsSync(adrPath)) {
  console.log("check-rbac-vs-code (v12.143)");
  console.log(scanDirs.length === 0
    ? "⊘ N/A: sin dirs de codigo backend (sin api.codeScanDirs / sin backend)."
    : "⊘ N/A: no existe el ADR de RBAC (docs/fase-3-arquitectura/adr/ADR-003-rbac-endpoint-rol.md).");
  process.exit(0);
}

// ── Roles reales del codigo (@RolesAllowed) ──────────────────────────────────
function listJavaFiles(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) listJavaFiles(full, out);
    else if (e.isFile() && e.name.endsWith(".java")) out.push(full);
  }
  return out;
}
const codeRoles = new Set();
const rolesAllowedRe = /@RolesAllowed\(\s*\{?([^)}]*)\}?\s*\)/g;
const quotedRe = /"([^"]+)"/g;
for (const dir of scanDirs) {
  for (const file of listJavaFiles(dir, [])) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("@RolesAllowed")) continue;
    let m;
    while ((m = rolesAllowedRe.exec(text)) !== null) {
      let q;
      while ((q = quotedRe.exec(m[1])) !== null) codeRoles.add(q[1]);
    }
  }
}

// ── ADR ──────────────────────────────────────────────────────────────────────
const adrText = readFileSync(adrPath, "utf8");
// Roles documentados: tokens role-like (lowercase + guiones) en backticks dentro del ADR.
const docRoles = new Set();
let b;
const backtickRe = /`([a-z][a-z0-9-]{2,})`/g;
while ((b = backtickRe.exec(adrText)) !== null) {
  // heuristica: descarta tokens que claramente no son roles (rutas, anotaciones, tipos).
  const t = b[1];
  if (t.includes("/") || t.includes(".") || t.startsWith("api") || t === "rolesallowed") continue;
  docRoles.add(t);
}

// ── Comparacion ───────────────────────────────────────────────────────────────
// 1) Todo rol real debe estar documentado (texto literal en el ADR).
const undocumented = [...codeRoles].filter((r) => !adrText.includes(r)).sort();
// 2) Todo rol documentado (que parezca rol) deberia existir en el codigo (informativo).
//    Solo consideramos como "rol documentado" los que el ADR lista en backticks y que
//    siguen el patron de rol (para evitar falsos positivos, intersecamos con conocidos del codigo
//    o terminados en -admin / operator / auditor).
const ROLE_HINT = /(-admin$|^operator$|^auditor$|^operator-|^viewer$|^editor$|^approver$)/;
const phantom = [...docRoles].filter((r) => ROLE_HINT.test(r) && !codeRoles.has(r)).sort();

console.log("check-rbac-vs-code (v12.143)");
console.log(`Roles en codigo (@RolesAllowed): ${[...codeRoles].sort().join(", ") || "(ninguno)"}`);
console.log(`Sin documentar en ADR: ${undocumented.length} · roles documentados huerfanos (no en codigo): ${phantom.length}`);

let drift = false;
if (undocumented.length) {
  drift = true;
  console.log(`\n${strict ? "✗" : "⚠"} Roles usados en @RolesAllowed pero AUSENTES del ADR de RBAC:`);
  for (const r of undocumented) console.log(`   ${r}`);
  console.log("Accion: documenta el rol en docs/fase-3-arquitectura/adr/ADR-003-rbac-endpoint-rol.md (y en 03.08).");
}
if (phantom.length) {
  console.log(`\n⚠ Roles documentados en el ADR que NO aparecen en @RolesAllowed (posible doc obsoleta):`);
  for (const r of phantom) console.log(`   ${r}`);
}
if (!drift && !phantom.length) {
  console.log("OK. Los roles del codigo coinciden con el ADR de RBAC.");
  process.exit(0);
}
if (strict && drift) { console.log("\nMODO STRICT: bloquea (exit 1)."); process.exit(1); }
console.log("\n(Drift de roles informado; revisa el ADR de RBAC.)");
process.exit(0);
