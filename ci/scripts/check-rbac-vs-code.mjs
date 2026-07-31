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
 *   - Dirs de codigo de template.config.json (api.codeScanDirs); si no estan, TODOS los modulos Java
 *     del reactor (JAVA_MODULES).
 *   - Roles documentados: el bloque `rbac-roles` del ADR si existe; si no, heuristica de backticks.
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

import { JAVA_MODULES } from "./_lib/source-roots.mjs";
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
  // Fallback derivado del reactor, no cableado a un solo modulo: si `template.config.json` no
  // declara los dirs, se escanean TODOS los modulos Java. Con la lista fija en `platform-app` un
  // @RolesAllowed en cualquier otro modulo era invisible y el gate salia en verde, que es el mismo
  // verde falso por el que existe `_lib/source-roots.mjs`.
  return JAVA_MODULES.map((m) => `${m}/src/main/java`);
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
// Este gate solo miraba literales entre comillas dentro de @RolesAllowed(...). El codigo real NO usa
// literales: usa constantes importadas (PlatformRoles.OPERATOR, Mt101Roles.PAY_CONFLICT_MAKER...), asi
// que el conjunto salia VACIO, el gate imprimia "Roles en codigo: (ninguno)" y salia con 0. Un gate que
// pasa en verde estando ciego es peor que no tenerlo: sostiene una confianza que no existe. Ahora se
// resuelven las constantes antes de comparar.

/** Mapa NOMBRE_DE_CONSTANTE -> valor, tomado de las declaraciones `static final String X = "y";`. */
const constantValues = new Map();
const constantDeclRe = /static\s+final\s+String\s+([A-Z0-9_]+)\s*=\s*"([^"]+)"\s*;/g;

/** Ficheros con @RolesAllowed, cacheados para no leer dos veces el arbol. */
const annotatedFiles = [];

for (const dir of scanDirs) {
  for (const file of listJavaFiles(dir, [])) {
    const text = readFileSync(file, "utf8");
    // Las constantes se recolectan de TODOS los ficheros: las clases que las declaran
    // (PlatformRoles, Mt101Roles) normalmente no llevan ninguna anotacion.
    let d;
    while ((d = constantDeclRe.exec(text)) !== null) constantValues.set(d[1], d[2]);
    if (text.includes("@RolesAllowed")) annotatedFiles.push(text);
  }
}

const codeRoles = new Set();
const unresolved = new Set();
const rolesAllowedRe = /@RolesAllowed\(\s*\{?([^)}]*)\}?\s*\)/g;
const quotedRe = /"([^"]+)"/g;
// Identificador suelto o cualificado: OPERATOR, PlatformRoles.OPERATOR, Mt101Roles.PAY_CONFLICT_MAKER.
const identifierRe = /(?:([A-Za-z_][A-Za-z0-9_]*)\s*\.\s*)?([A-Z][A-Z0-9_]{2,})/g;

for (const text of annotatedFiles) {
  let m;
  while ((m = rolesAllowedRe.exec(text)) !== null) {
    const args = m[1];
    let q;
    let sawLiteral = false;
    while ((q = quotedRe.exec(args)) !== null) { codeRoles.add(q[1]); sawLiteral = true; }
    if (sawLiteral) continue;
    let id;
    while ((id = identifierRe.exec(args)) !== null) {
      const name = id[2];
      if (constantValues.has(name)) codeRoles.add(constantValues.get(name));
      // Se registra lo no resuelto en vez de ignorarlo: si manana alguien mete un rol por una via que
      // este parser no entiende, el gate lo DICE en vez de volver a quedarse callado.
      else unresolved.add(id[1] ? id[1] + "." + name : name);
    }
  }
}

if (unresolved.size > 0) {
  console.log("⚠ Referencias en @RolesAllowed que no se pudieron resolver a un valor de rol: "
    + [...unresolved].sort().join(", "));
  console.log("  (declara la constante como `static final String X = \"...\"` en una clase escaneada)");
}

// ── ADR ──────────────────────────────────────────────────────────────────────
const adrText = readFileSync(adrPath, "utf8");
// Roles documentados. Fuente preferente: el bloque delimitado `rbac-roles` del ADR, que es la lista
// CANONICA escrita a mano.
//
// Antes se rascaban todos los tokens en backticks del documento entero y se filtraban con una
// heuristica de forma (`/-admin$/`, `/^operator$/`...). El problema no es que fallara al detectar
// roles, sino que no puede distinguir un rol de algo que se le PARECE: el ADR explica que
// `audit-admin` es una capacidad semantica de la UI -no existe en el realm ni en ningun
// @RolesAllowed- y el regex la reclamaba igualmente como "rol documentado huerfano". Un gate que
// exige borrar documentacion correcta entrena a la gente a ignorarlo.
//
// Con el bloque, lo que cuenta como rol es una decision explicita del autor del ADR. Sin bloque se
// mantiene la heuristica anterior, para no romper repositorios (ni el template) que aun no lo tengan.
const ROLE_BLOCK_RE = /<!--\s*rbac-roles:start\s*-->([\s\S]*?)<!--\s*rbac-roles:end\s*-->/;
const docRoles = new Set();
const roleBlock = adrText.match(ROLE_BLOCK_RE);
let usedRoleBlock = false;
if (roleBlock) {
  // Dentro del bloque, un rol es el primer token en backticks de cada vinneta.
  for (const line of roleBlock[1].split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s*`([a-z][a-z0-9-]{2,})`/);
    if (m) docRoles.add(m[1]);
  }
  usedRoleBlock = docRoles.size > 0;
}
if (!usedRoleBlock) {
  let b;
  const backtickRe = /`([a-z][a-z0-9-]{2,})`/g;
  while ((b = backtickRe.exec(adrText)) !== null) {
    // heuristica: descarta tokens que claramente no son roles (rutas, anotaciones, tipos).
    const t = b[1];
    if (t.includes("/") || t.includes(".") || t.startsWith("api") || t === "rolesallowed") continue;
    docRoles.add(t);
  }
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
