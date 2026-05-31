#!/usr/bin/env node
/**
 * template-upgrade.mjs (v12.64)
 *
 * Sincroniza un proyecto instanciado con el template canonico actual.
 *
 * v12.64: --force-framework refresca archivos template-owned que YA existen pero
 * estan outdated (validadores ci/scripts/, modulos _lib/, scripts de framework
 * roadmap/scaffold/generate). Sin esto, un proyecto viejo que corre el upgrade
 * recibe archivos NUEVOS pero conserva los viejos -> nunca obtiene mejoras a
 * archivos existentes (p.ej. el contrato de ejecucion roadmap v12.63+).
 *
 * v12.77: --force-framework tambien refresca scripts/ai-framework-agent.mjs (el
 * motor + el FRONT EMBEBIDO de memory-serve). Antes quedaba fuera, asi que los
 * proyectos no recibian las mejoras del panel (visor de Proyecto, semaforo de
 * prototipos, comandos universales en Acciones, etc.).
 *
 * Problema que resuelve (visto en codex case):
 *   - codex fue instanciado cuando el template estaba en v12.40.
 *   - El template canonico ahora esta en v12.52 con 14 scripts npm nuevos.
 *   - El proyecto codex no tiene mecanismo de "pull updates from template".
 *   - npm run check:all falla porque faltan validadores nuevos.
 *
 * Que hace este comando (idempotente, seguro):
 *   1. Lee package.json del proyecto destino.
 *   2. Lee package.json canonico del template (auto-detecta el path).
 *   3. Lista scripts que faltan en el destino pero existen en el template.
 *   4. Lista ci/scripts/ que faltan (validadores nuevos).
 *   5. Lista scripts/ que faltan (scaffold-*, generate-*, etc.).
 *   6. Lista plantillas/transversal/shared-prototype-helpers.js si falta.
 *   7. v12.61: Lista specs/_shared/ (tokens.css, mock-api.js, app-state.js, ui.js,
 *      README.md) — infra compartida para modo portfolio-spa. Safe-to-copy si falta.
 *
 *   Por default --dry-run: imprime el reporte SIN aplicar cambios.
 *   Con --apply: agrega scripts faltantes a package.json (preserva customizaciones),
 *                copia ci/scripts/check-*.mjs faltantes,
 *                copia scripts/scaffold-*.mjs + generate-*.mjs faltantes,
 *                copia plantillas/transversal/shared-prototype-helpers.js si falta.
 *
 * NUNCA borra ni sobrescribe customizaciones. Solo agrega lo que falta.
 *
 * Uso:
 *   node scripts/template-upgrade.mjs                # dry-run, reporta diff
 *   node scripts/template-upgrade.mjs --apply        # aplica cambios safe (preserva customizaciones)
 *   node scripts/template-upgrade.mjs --apply --force-scripts  # tambien sobreescribe scripts pipeline outdated (check:project, check:all, etc.)
 *   node scripts/template-upgrade.mjs --apply --force-framework # tambien refresca validadores/_lib/scripts de framework outdated (regenerables)
 *   node scripts/template-upgrade.mjs --template <path>   # template custom
 *   node scripts/template-upgrade.mjs --root <path>       # proyecto destino custom
 *
 * Exit codes:
 *   0 - sin cambios pendientes / dry-run completado / cambios aplicados OK.
 *   1 - error de argumentos / no se encuentra template.
 *   2 - en modo --check, hay drift pendiente.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { resolve, join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const apply = !!args.apply;
const checkMode = !!args.check;
const forceScripts = !!args["force-scripts"];
const forceFramework = !!args["force-framework"]; // v12.64: refresca archivos template-owned outdated
const migrateGates = !!args["migrate-gates"];
const fixBidirectional = !!args["fix-bidirectional"];

// v12.55: scripts npm "pipeline" que son safe-to-overwrite (regenerables, sin customizacion semantica).
// Cuando un proyecto viejo tiene un check:project con menos validadores que el canonico, podemos
// sobrescribirlo con --force-scripts porque "check:project" siempre debe correr TODOS los check:*
// disponibles. Otros scripts no se tocan automaticamente.
const SAFE_OVERWRITE_SCRIPTS = new Set([
  "check:project",
  "check:all",
  "check:template",
  "memory:bootstrap",
  "memory:bootstrap:quick",
  "memory:sync",
  "memory:sync:quick",
]);

// Detectar el template canonico:
//   1. --template <path> explicito
//   2. el dir del script si estamos en el template mismo
//   3. ../project-template/ relativo al cwd (caso comun)
let templateRoot = args.template ? resolve(args.template) : null;
if (!templateRoot) {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const scriptTemplateRoot = resolve(scriptDir, "..");
  if (existsSync(join(scriptTemplateRoot, "ai-framework-agent.mjs")) || existsSync(join(scriptDir, "ai-framework-agent.mjs"))) {
    templateRoot = scriptTemplateRoot;
  }
}
if (!templateRoot || !existsSync(join(templateRoot, "package.json"))) {
  console.error(`Error: no se encuentra el template canonico. Pasa --template <path>.`);
  console.error(`Buscado en: ${templateRoot || "(no detectado)"}`);
  process.exit(1);
}
if (resolve(templateRoot) === resolve(root)) {
  console.error(`Error: estas corriendo template-upgrade DENTRO del template canonico mismo. Apunta --root a un proyecto instanciado.`);
  process.exit(1);
}

console.log(`template-upgrade (v12.64)`);
console.log(`Template canonico:   ${templateRoot}`);
console.log(`Proyecto destino:    ${root}`);
console.log(`Modo:                ${apply ? "APPLY" : (checkMode ? "CHECK" : "DRY-RUN")}`);
console.log(``);

if (!existsSync(join(root, "package.json"))) {
  console.error(`Error: ${root} no tiene package.json. Es un proyecto instanciado?`);
  process.exit(1);
}

const diff = analyzeDiff();

reportDiff(diff);

if (diff.totalPending === 0) {
  console.log(`\nOK. Proyecto al dia con el template canonico.`);
  process.exit(0);
}

if (checkMode) {
  console.error(`\ncheck-mode: ${diff.totalPending} cambios pendientes. Corre con --apply para aplicarlos.`);
  process.exit(2);
}

if (!apply) {
  console.log(`\n(dry-run) NO se aplicaron cambios. Corre con --apply para aplicarlos.`);
  process.exit(0);
}

const applied = applyChanges(diff);

// v12.56: --migrate-gates reescribe traceability.md de cada feature al formato
// canonico de 5 columnas (Gate | Estado | Aprobador | Fecha | Evidencia).
let migratedGates = 0;
if (migrateGates) {
  migratedGates = applyGatesMigration();
}

// v12.57: --fix-bidirectional reescribe los href hub↔spec con depth correcta.
let fixedLinks = 0;
if (fixBidirectional) {
  fixedLinks = applyBidirectionalFix();
}

console.log(`\nCambios aplicados:`);
console.log(`  scripts npm agregados:               ${applied.npmScripts}`);
console.log(`  scripts npm forzados (--force-scripts): ${applied.npmScriptsForced}`);
console.log(`  archivos ci/scripts/:                ${applied.ciScripts}`);
console.log(`  modulos ci/scripts/_lib/:            ${applied.libFiles || 0}`);
console.log(`  archivos scripts/:                   ${applied.scripts}`);
console.log(`  helpers plantillas:                  ${applied.helpers}`);
console.log(`  docs transversales:                  ${applied.docs}`);
console.log(`  infra compartida specs/_shared/:     ${applied.shared || 0}`);
console.log(`  framework refrescado (--force-framework): ${applied.framework || 0}`);
if (migrateGates) console.log(`  traceability.md migrados (--migrate-gates): ${migratedGates}`);
if (fixBidirectional) console.log(`  prototipos con link corregido (--fix-bidirectional): ${fixedLinks}`);
console.log(`\nProximos pasos:`);
console.log(`  1. npm run memory:sync`);
console.log(`  2. npm run check:project           (para confirmar que los nuevos validadores pasan)`);
console.log(`  3. revisar SESSION_LOG.md y AI_CONTEXT.md (opcional)`);
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function analyzeDiff() {
  const dstPkg = readJson(join(root, "package.json"));
  const tplPkg = readJson(join(templateRoot, "package.json"));

  // 1. Scripts npm faltantes.
  const dstScripts = dstPkg.scripts || {};
  const tplScripts = tplPkg.scripts || {};
  const npmScriptsToAdd = {};
  for (const [name, cmd] of Object.entries(tplScripts)) {
    if (!(name in dstScripts)) {
      npmScriptsToAdd[name] = cmd;
    }
  }
  // Tambien detectar si scripts existentes tienen un comando diferente (out of date)
  const npmScriptsOutdated = {};
  for (const [name, cmd] of Object.entries(tplScripts)) {
    if (name in dstScripts && dstScripts[name] !== cmd) {
      npmScriptsOutdated[name] = { actual: dstScripts[name], canonical: cmd };
    }
  }

  // 2. ci/scripts/ faltantes (validadores nuevos).
  const tplCi = listFiles(join(templateRoot, "ci", "scripts"));
  const dstCi = new Set(listFiles(join(root, "ci", "scripts")));
  const ciScriptsToAdd = tplCi.filter((f) => !dstCi.has(f));

  // 2b. v12.59: ci/scripts/_lib/ faltantes (modulos compartidos: strict-mode,
  // ignore-paths, feature-filter, project-config, phase-contracts). CRITICO:
  // los validadores nuevos importan de _lib/, sin estos archivos crashean.
  const tplLib = listFiles(join(templateRoot, "ci", "scripts", "_lib"));
  const dstLib = new Set(listFiles(join(root, "ci", "scripts", "_lib")));
  const libFilesToAdd = tplLib.filter((f) => !dstLib.has(f));

  // 3. scripts/ del template no esenciales pero recomendados (scaffold-*, generate-*, template-upgrade).
  // v12.107+: incluimos project-* (clarify/analyze/checklist), aif (CLI unificada
  // del framework AI-first empresarial, v12.111-v12.115), install-agent (v12.112) y
  // specify-compat (v12.110). Sin esto, los proyectos instanciados antes de v12.107
  // nunca recibirian los nuevos comandos.
  const tplScriptsDir = listFiles(join(templateRoot, "scripts")).filter((f) =>
    /^(scaffold|generate|template-upgrade|roadmap|project-|aif|install-agent|specify-compat|preset|agent-)/.test(f) && f.endsWith(".mjs")
  );
  const dstScriptsDir = new Set(listFiles(join(root, "scripts")));
  const scriptsToAdd = tplScriptsDir.filter((f) => !dstScriptsDir.has(f));

  // 4. plantillas/transversal/shared-prototype-helpers.js
  const helpersToAdd = [];
  const helperPath = join("plantillas", "transversal", "shared-prototype-helpers.js");
  if (existsSync(join(templateRoot, helperPath)) && !existsSync(join(root, helperPath))) {
    helpersToAdd.push(helperPath);
  }

  // 5. v12.55: docs transversales nuevas (90.35+, 90.36+) que son referencias copy-paste seguras
  // — el agente las consulta pero no las customiza.
  const docsToAdd = [];
  const TRANSVERSAL_DOCS_TO_SYNC = [
    "docs/transversal/90.35-trace-annotations-por-stack.md",
    "docs/transversal/90.36-roadmap-metodologico.md",
  ];
  for (const d of TRANSVERSAL_DOCS_TO_SYNC) {
    if (existsSync(join(templateRoot, d)) && !existsSync(join(root, d))) {
      docsToAdd.push(d);
    }
  }

  // 6. v12.61/85: specs/_shared/ — infraestructura compartida para modo portfolio-spa
  // (tokens.css, seed.js, mock-api.js, app-state.js, ui.js, nav.js, nav-items.js,
  // README.md). Safe-to-copy si falta: son helpers de bajo nivel sin customizacion
  // semantica. Sin ellos, scaffold:prototype --mode portfolio-spa y los prototipos que
  // enlazan _shared/ no funcionan. NOTA: nav-items.js y seed.js son editados por el
  // usuario (manifiesto/datos), por eso solo se AGREGAN si faltan, nunca se sobreescriben.
  const tplShared = listFiles(join(templateRoot, "specs", "_shared"));
  const dstShared = new Set(listFiles(join(root, "specs", "_shared")));
  const sharedFilesToAdd = tplShared.filter((f) => !dstShared.has(f));

  // 7. v12.64: archivos de FRAMEWORK template-owned que EXISTEN en destino pero
  // DIFIEREN del canonico (outdated). Son regenerables, sin customizacion del
  // usuario: validadores ci/scripts/*.mjs, modulos _lib/*.mjs y scripts de
  // framework (roadmap-*, scaffold-*, generate-*, template-upgrade, pre-flight-gate).
  // Cierra la brecha: hoy template-upgrade solo AGREGA lo que falta; los archivos
  // viejos que ya existen nunca se refrescan, asi que un proyecto v12.60 no recibe
  // el contrato de ejecucion v12.63 aunque corra el upgrade. Solo se sobreescriben
  // con --force-framework (opt-in, para no pisar nada por sorpresa).
  // v12.107+: incluimos project-*, aif, install-agent, specify-compat, preset para refresco.
  const isFrameworkScript = (f) => f.endsWith(".mjs") && /^(ai-framework-agent|roadmap-|scaffold-|generate-|template-upgrade|pre-flight-gate|project-|aif|install-agent|specify-compat|preset|agent-)/.test(f);
  const frameworkOutdated = [];
  const collectOutdated = (relDir, files, filter) => {
    for (const f of files) {
      if (filter && !filter(f)) continue;
      const src = join(templateRoot, relDir, f);
      const dst = join(root, relDir, f);
      if (!existsSync(dst)) continue; // los faltantes ya los cubre *ToAdd
      if (!filesEqual(src, dst)) frameworkOutdated.push(join(relDir, f).replace(/\\/g, "/"));
    }
  };
  collectOutdated("ci/scripts", tplCi, (f) => f.endsWith(".mjs"));
  collectOutdated(join("ci", "scripts", "_lib"), tplLib, (f) => f.endsWith(".mjs"));
  collectOutdated("scripts", listFiles(join(templateRoot, "scripts")), isFrameworkScript);

  // 5. Detectar version del template usada (heuristica: cuales scripts post-v12.45 existen).
  const versionHeuristic = inferProjectVersion(dstScripts);

  // v12.55: separar scripts outdated en safe-overwrite vs custom.
  const safeOutdated = {};
  const customOutdated = {};
  for (const [name, diff] of Object.entries(npmScriptsOutdated)) {
    if (SAFE_OVERWRITE_SCRIPTS.has(name)) safeOutdated[name] = diff;
    else customOutdated[name] = diff;
  }

  return {
    npmScriptsToAdd,
    npmScriptsOutdated,
    safeOutdated,
    customOutdated,
    ciScriptsToAdd,
    libFilesToAdd,
    scriptsToAdd,
    helpersToAdd,
    docsToAdd,
    sharedFilesToAdd,
    frameworkOutdated,
    versionHeuristic,
    totalPending: Object.keys(npmScriptsToAdd).length + ciScriptsToAdd.length + libFilesToAdd.length + scriptsToAdd.length + helpersToAdd.length + docsToAdd.length + sharedFilesToAdd.length + (forceScripts ? Object.keys(safeOutdated).length : 0) + (forceFramework ? frameworkOutdated.length : 0),
  };
}

function reportDiff(d) {
  console.log(`Version inferida del proyecto: ~${d.versionHeuristic}`);
  console.log(`Version canonica del template: ${readJson(join(templateRoot, "package.json")).version}`);
  console.log(``);
  console.log(`Resumen del diff:`);
  console.log(`  scripts npm faltantes:                  ${Object.keys(d.npmScriptsToAdd).length}`);
  console.log(`  scripts npm outdated (safe-overwrite): ${Object.keys(d.safeOutdated || {}).length}`);
  console.log(`  scripts npm outdated (custom — no se tocan): ${Object.keys(d.customOutdated || {}).length}`);
  console.log(`  validadores ci/scripts/:                ${d.ciScriptsToAdd.length}`);
  console.log(`  modulos ci/scripts/_lib/:               ${(d.libFilesToAdd || []).length}`);
  console.log(`  scripts/ recomendados:                  ${d.scriptsToAdd.length}`);
  console.log(`  helpers plantillas:                     ${d.helpersToAdd.length}`);
  console.log(`  docs transversales nuevas:              ${d.docsToAdd.length}`);
  console.log(`  infra compartida specs/_shared/:        ${(d.sharedFilesToAdd || []).length}`);
  console.log(`  framework outdated (--force-framework):  ${(d.frameworkOutdated || []).length}`);

  if (Object.keys(d.npmScriptsToAdd).length > 0) {
    console.log(`\nScripts npm a agregar:`);
    for (const [name, cmd] of Object.entries(d.npmScriptsToAdd)) {
      console.log(`  + ${name}: ${cmd.length > 90 ? cmd.slice(0, 90) + "..." : cmd}`);
    }
  }
  if (Object.keys(d.safeOutdated || {}).length > 0) {
    console.log(`\nScripts pipeline outdated (safe overwrite con --force-scripts):`);
    for (const [name, { actual, canonical }] of Object.entries(d.safeOutdated)) {
      console.log(`  ~ ${name}  ${forceScripts ? "(SE SOBRESCRIBE)" : "(NO se sobrescribe sin --force-scripts)"}`);
      console.log(`      actual:    ${actual.length > 100 ? actual.slice(0, 100) + "..." : actual}`);
      console.log(`      canonico:  ${canonical.length > 100 ? canonical.slice(0, 100) + "..." : canonical}`);
    }
  }
  if (Object.keys(d.customOutdated || {}).length > 0) {
    console.log(`\nScripts custom outdated (NO se tocan — el usuario los modifico):`);
    for (const [name, { actual, canonical }] of Object.entries(d.customOutdated)) {
      console.log(`  ~ ${name}`);
      console.log(`      actual:    ${actual.length > 100 ? actual.slice(0, 100) + "..." : actual}`);
      console.log(`      canonico:  ${canonical.length > 100 ? canonical.slice(0, 100) + "..." : canonical}`);
    }
  }
  if (d.ciScriptsToAdd.length > 0) {
    console.log(`\nValidadores ci/scripts/ a copiar:`);
    for (const f of d.ciScriptsToAdd) console.log(`  + ci/scripts/${f}`);
  }
  if (d.scriptsToAdd.length > 0) {
    console.log(`\nScripts/ recomendados a copiar:`);
    for (const f of d.scriptsToAdd) console.log(`  + scripts/${f}`);
  }
  if (d.helpersToAdd.length > 0) {
    console.log(`\nHelpers plantillas a copiar:`);
    for (const f of d.helpersToAdd) console.log(`  + ${f}`);
  }
  if (d.docsToAdd && d.docsToAdd.length > 0) {
    console.log(`\nDocs transversales nuevas a copiar:`);
    for (const f of d.docsToAdd) console.log(`  + ${f}`);
  }
  if (d.sharedFilesToAdd && d.sharedFilesToAdd.length > 0) {
    console.log(`\nInfra compartida specs/_shared/ a copiar (modo portfolio-spa):`);
    for (const f of d.sharedFilesToAdd) console.log(`  + specs/_shared/${f}`);
  }
  if (d.frameworkOutdated && d.frameworkOutdated.length > 0) {
    console.log(`\nArchivos de framework OUTDATED (template-owned, regenerables) ${forceFramework ? "(SE REFRESCAN)" : "(NO se tocan sin --force-framework)"}:`);
    for (const f of d.frameworkOutdated) console.log(`  ~ ${f}`);
    if (!forceFramework) {
      console.log(`  -> Corre con --force-framework para que el proyecto reciba la version canonica (p.ej. el contrato de ejecucion roadmap v12.63+).`);
    }
  }
}

function applyChanges(d) {
  const applied = { npmScripts: 0, npmScriptsForced: 0, ciScripts: 0, scripts: 0, helpers: 0, docs: 0 };

  // 1. Mergear scripts npm (preserva existentes y customizaciones).
  const needsPkgUpdate = Object.keys(d.npmScriptsToAdd).length > 0 || (forceScripts && Object.keys(d.safeOutdated || {}).length > 0);
  if (needsPkgUpdate) {
    const pkgPath = join(root, "package.json");
    const pkg = readJson(pkgPath);
    pkg.scripts = pkg.scripts || {};
    for (const [name, cmd] of Object.entries(d.npmScriptsToAdd)) {
      pkg.scripts[name] = cmd;
      applied.npmScripts += 1;
    }
    // v12.55: --force-scripts sobreescribe pipeline scripts outdated.
    if (forceScripts && d.safeOutdated) {
      for (const [name, { canonical }] of Object.entries(d.safeOutdated)) {
        pkg.scripts[name] = canonical;
        applied.npmScriptsForced += 1;
      }
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  }

  // 2. Copiar ci/scripts/ faltantes.
  for (const f of d.ciScriptsToAdd) {
    const src = join(templateRoot, "ci", "scripts", f);
    const dst = join(root, "ci", "scripts", f);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    applied.ciScripts += 1;
  }

  // 2b. v12.59: copiar ci/scripts/_lib/ faltantes (modulos compartidos criticos).
  applied.libFiles = 0;
  for (const f of (d.libFilesToAdd || [])) {
    const src = join(templateRoot, "ci", "scripts", "_lib", f);
    const dst = join(root, "ci", "scripts", "_lib", f);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    applied.libFiles += 1;
  }

  // 3. Copiar scripts/ recomendados faltantes.
  for (const f of d.scriptsToAdd) {
    const src = join(templateRoot, "scripts", f);
    const dst = join(root, "scripts", f);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    applied.scripts += 1;
  }

  // 4. Copiar plantillas/transversal/shared-prototype-helpers.js si falta.
  for (const f of d.helpersToAdd) {
    const src = join(templateRoot, f);
    const dst = join(root, f);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    applied.helpers += 1;
  }

  // 5. v12.55: copiar docs transversales nuevas (90.35+, 90.36+).
  if (d.docsToAdd) {
    for (const f of d.docsToAdd) {
      const src = join(templateRoot, f);
      const dst = join(root, f);
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      applied.docs += 1;
    }
  }

  // 6. v12.61: copiar specs/_shared/ faltantes (infra compartida portfolio-spa).
  applied.shared = 0;
  for (const f of (d.sharedFilesToAdd || [])) {
    const src = join(templateRoot, "specs", "_shared", f);
    const dst = join(root, "specs", "_shared", f);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    applied.shared += 1;
  }

  // 7. v12.64: refrescar archivos de framework outdated (solo con --force-framework).
  applied.framework = 0;
  if (forceFramework) {
    for (const rel of (d.frameworkOutdated || [])) {
      const src = join(templateRoot, rel);
      const dst = join(root, rel);
      if (!existsSync(src)) continue;
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      applied.framework += 1;
    }
  }

  return applied;
}

/**
 * Heuristica para inferir aproximadamente que version de template fue usada para
 * generar este proyecto, basado en que scripts npm ya tiene.
 */
function inferProjectVersion(scripts) {
  if (scripts["check:prototype-cross-links"]) return "v12.52+";
  if (scripts["check:openapi-coverage"]) return "v12.51";
  if (scripts["check:prototype-diversity"]) return "v12.50";
  if (scripts["scaffold:prototype"]) return "v12.49";
  if (scripts["scaffold:feature"]) return "v12.47";
  if (scripts["check:orphan-evidence"]) return "v12.45";
  if (scripts["check:evidence-exists"]) return "v12.43";
  if (scripts["memory:bootstrap"]) return "v12.20-v12.42";
  return "pre-v12";
}

/**
 * v12.56: migra la seccion `## Gates` de cada specs/<feature>/traceability.md
 * del formato legacy (3 cols: Gate | Estado | Evidencia) al canonico v12.56
 * (5 cols: Gate | Estado | Aprobador | Fecha | Evidencia).
 *
 * Reglas de migracion:
 *   - "Aprobado" / "Aprobado con observaciones" / "Validado" / "Completo" -> "approved"
 *   - "Pendiente" / "Listo para validacion" / "En diseno SDD" / vacio -> "pending"
 *   - "Rechazado" -> "rejected"
 *   - "Bloqueado" -> "blocked"
 *   - Aprobador y Fecha quedan como "—" (humano completa al validar).
 *
 * Idempotente: si ya esta en formato canonico, no la toca.
 * Preserva todo lo demas del archivo (matriz, decisiones, preguntas).
 */
function applyGatesMigration() {
  const specsRoot = join(root, "specs");
  if (!existsSync(specsRoot)) return 0;
  let entries;
  try { entries = readdirSync(specsRoot, { withFileTypes: true }); } catch { return 0; }
  let migrated = 0;
  for (const e of entries) {
    if (!e.isDirectory() || !/^\d{3,}-/.test(e.name)) continue;
    const tracePath = join(specsRoot, e.name, "traceability.md");
    if (!existsSync(tracePath)) continue;
    const text = readFileSync(tracePath, "utf8");
    const newText = migrateTraceabilityGates(text);
    if (newText !== null && newText !== text) {
      writeFileSync(tracePath, newText, "utf8");
      migrated += 1;
    }
  }
  return migrated;
}

function migrateTraceabilityGates(text) {
  // Buscar seccion ## Gates.
  const gatesMatch = text.match(/(##\s+Gates\s*\n)([\s\S]*?)(?=\n##\s|\n$|$)/i);
  if (!gatesMatch) return null;
  const header = gatesMatch[1];
  const section = gatesMatch[2];
  const startIdx = gatesMatch.index;
  const fullMatch = gatesMatch[0];

  // Detectar formato actual.
  const headerLineMatch = section.match(/^\s*\|([^\n]+)\|\s*$/m);
  if (!headerLineMatch) return null;
  const cols = headerLineMatch[1].split("|").map((c) => c.trim().toLowerCase()).filter(Boolean);

  // Si ya es canonico (5 cols), no tocar.
  if (cols.length === 5
      && /^gate$/i.test(cols[0])
      && /^estado$/i.test(cols[1])
      && /^aprobador$/i.test(cols[2])
      && /^fecha$/i.test(cols[3])
      && /^evidencia$/i.test(cols[4])) {
    return null;
  }

  // Si es legacy 3 cols (Gate | Estado | Evidencia), migrar.
  if (cols.length === 3
      && /^gate$/i.test(cols[0])
      && /^estado$/i.test(cols[1])
      && /^evidencia$/i.test(cols[2])) {
    const rows = section.split(/\r?\n/);
    const newRows = [];
    let inTable = false;
    let headerProcessed = false;
    for (const row of rows) {
      if (/^\s*\|.*Gate.*Estado.*Evidencia/i.test(row)) {
        // Header viejo -> nuevo.
        newRows.push("| Gate | Estado | Aprobador | Fecha | Evidencia |");
        inTable = true;
        headerProcessed = true;
        continue;
      }
      if (inTable && /^\s*\|[\s-]+\|/.test(row)) {
        // Separador.
        newRows.push("|---|---|---|---|---|");
        continue;
      }
      if (inTable && /^\s*\|/.test(row)) {
        // Fila de datos.
        const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (cells.length === 3) {
          const gate = cells[0];
          const oldStatus = cells[1];
          const evidence = cells[2];
          const newStatus = mapLegacyStatus(oldStatus);
          newRows.push(`| ${gate} | ${newStatus} | — | — | ${evidence} |`);
          continue;
        }
      }
      if (inTable && row.trim() === "") {
        inTable = false;
      }
      newRows.push(row);
    }
    const newSection = newRows.join("\n");
    return text.slice(0, startIdx) + header + newSection + text.slice(startIdx + fullMatch.length);
  }

  // Formato desconocido, no tocar.
  return null;
}

/**
 * v12.57: corrige href hub↔spec en todos los prototipos.
 * - Detecta href con depth incorrecta (4+ niveles, 2 niveles, absoluto).
 * - Reescribe a `../../../prototype/index.html`.
 * - Agrega atributo `data-hub-link` si no esta.
 * Idempotente.
 */
function applyBidirectionalFix() {
  const specsRoot = join(root, "specs");
  if (!existsSync(specsRoot)) return 0;
  let entries;
  try { entries = readdirSync(specsRoot, { withFileTypes: true }); } catch { return 0; }
  let fixed = 0;
  for (const e of entries) {
    if (!e.isDirectory() || !/^\d{3,}-/.test(e.name)) continue;
    const protoPath = join(specsRoot, e.name, "prototype-html5", "index.html");
    if (!existsSync(protoPath)) continue;
    let text = readFileSync(protoPath, "utf8");
    const original = text;
    // Reemplazar href con depth incorrecta.
    text = text.replace(/href\s*=\s*["'](\.\.\/){4,}prototype\/index\.html(\?[^"']*)?["']/g, 'href="../../../prototype/index.html$2"');
    text = text.replace(/href\s*=\s*["']\.\.\/\.\.\/prototype\/index\.html(\?[^"']*)?["'](?!.*prototype-html5)/g, 'href="../../../prototype/index.html$1"');
    text = text.replace(/href\s*=\s*["']\/prototype\/index\.html(\?[^"']*)?["']/g, 'href="../../../prototype/index.html$1"');
    // Si tiene href correcto pero falta data-hub-link, agregarlo.
    text = text.replace(/(<a\s+(?![^>]*data-hub-link)[^>]*href\s*=\s*["']\.\.\/\.\.\/\.\.\/prototype\/index\.html[^"']*["'])([^>]*>)/g, '$1 data-hub-link$2');
    if (text !== original) {
      writeFileSync(protoPath, text, "utf8");
      fixed += 1;
    }
  }
  return fixed;
}

function mapLegacyStatus(oldStatus) {
  const lower = oldStatus.toLowerCase();
  if (/aprob|complet|valid|listo/i.test(lower)) return "approved";
  if (/recha/i.test(lower)) return "rejected";
  if (/bloque/i.test(lower)) return "blocked";
  return "pending";
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * v12.64: compara dos archivos por contenido (normalizando EOL CRLF/LF para no
 * marcar diff por fin de linea). Devuelve true si son iguales.
 */
function filesEqual(a, b) {
  try {
    const ca = readFileSync(a, "utf8").replace(/\r\n/g, "\n");
    const cb = readFileSync(b, "utf8").replace(/\r\n/g, "\n");
    return ca === cb;
  } catch {
    return false;
  }
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter((f) => {
      try { return statSync(join(dir, f)).isFile(); } catch { return false; }
    });
  } catch {
    return [];
  }
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
