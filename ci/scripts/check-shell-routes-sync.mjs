#!/usr/bin/env node
/**
 * check-shell-routes-sync.mjs
 *
 * Mantiene alineadas las TRES listas de rutas del shell que un plugin externo puede referenciar:
 *
 *   1. El shell de verdad  -> frontend/apps/web/src/app/core/platform-plugin.manifest.ts
 *                             (campos `routes[].path`, `navigation[].route`, `workspaces[].route`)
 *   2. El contrato publico -> frontend/apps/web/public/plugins/catalog.schema.json  ($defs.knownShellRoute.enum)
 *   3. El gate de build    -> frontend/scripts/validate-plugin-catalog.js           (KNOWN_SHELL_ROUTES)
 *
 * POR QUE EXISTE
 * Las tres estaban desincronizadas y el fallo era de los caros, porque rompia en las DOS
 * direcciones a la vez:
 *
 *   - `/swift-mt101/fragments` es una ruta REAL del shell, pero no estaba en el enum: un proveedor
 *     que apuntara a ella era rechazado por el contrato y por el gate.
 *   - `/audit/mt101-fragments` estaba en el enum y NO existe como ruta montada (solo sobrevive como
 *     redirect): un proveedor que apuntara ahi pasaba el schema, pasaba el gate... y el runtime lo
 *     ponia en cuarentena con `declares navigation "..." for unknown route`.
 *
 * Es decir: contrato publico verde -> gate de build verde -> plugin muerto en produccion. La unica
 * senal llegaba en runtime, al cliente, y en forma de plugin degradado.
 *
 * La fuente de verdad es el manifest estatico, porque es exactamente el conjunto que
 * `app-plugin-runtime.registry.ts` usa para construir `knownStaticRoutes` y decidir la cuarentena.
 * Este gate no elige: compara contra el.
 *
 * Exit: 0 alineadas; 1 si alguna difiere (imprime el diff en las dos direcciones).
 */

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const root = resolve(process.argv.includes("--root") ? process.argv[process.argv.indexOf("--root") + 1] : ".");

const MANIFEST = join(root, "frontend/apps/web/src/app/core/platform-plugin.manifest.ts");
const SCHEMA = join(root, "frontend/apps/web/public/plugins/catalog.schema.json");
const GATE = join(root, "frontend/scripts/validate-plugin-catalog.js");

for (const [label, file] of [["manifest", MANIFEST], ["schema", SCHEMA], ["gate", GATE]]) {
  if (!existsSync(file)) {
    console.log(`check-shell-routes-sync: N/A (falta el ${label}: ${file})`);
    process.exit(0);
  }
}

/** Extrae los bloques `<clave>: [ ... ]` balanceando corchetes (hay objetos anidados dentro). */
function arrayBlocks(text, key) {
  const out = [];
  const re = new RegExp(`\\b${key}\\s*:\\s*\\[`, "g");
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[0].length - 1;
    let depth = 0;
    for (let j = start; j < text.length; j += 1) {
      if (text[j] === "[") depth += 1;
      else if (text[j] === "]") {
        depth -= 1;
        if (depth === 0) { out.push(text.slice(start, j + 1)); break; }
      }
    }
  }
  return out.join("\n");
}

function fieldValues(text, field) {
  return [...text.matchAll(new RegExp(`\\b${field}\\s*:\\s*['"]([^'"]+)['"]`, "g"))].map((m) => m[1]);
}

const manifestText = readFileSync(MANIFEST, "utf8");

// El manifest no trae los tres arrays inline: `routes` y `navigation` son REFERENCIAS a constantes
// (`PLATFORM_ROUTE_CONTRIBUTIONS`, definida en el mismo fichero, y `APP_NAVIGATION_DEFINITIONS`, que
// vive en app-navigation.policy.ts). Solo `workspaces` esta inline. Buscar unicamente `<clave>: [`
// devolvia 7 de las 20 rutas y marcaba como inexistentes cosas tan evidentes como `/overview`.
const NAV_POLICY = join(root, "frontend/apps/web/src/app/core/app-navigation.policy.ts");
const navText = existsSync(NAV_POLICY) ? readFileSync(NAV_POLICY, "utf8") : "";

/**
 * Cuerpo de `export const <NOMBRE> ... = [ ... ];` balanceando corchetes.
 *
 * Se busca el `[` que sigue al SIGNO IGUAL, no el primero que aparezca: la declaracion lleva
 * anotacion de tipo (`: readonly AppRouteContribution[] =`) y sus corchetes estan vacios, de modo
 * que quedarse con el primero devolvia "[]" y el gate creia que el shell montaba 7 rutas en vez de
 * 20 — marcando `/overview` y `/sources` como inexistentes.
 */
function constArray(text, name) {
  const at = text.indexOf(name);
  if (at < 0) return "";
  const eq = text.indexOf("=", at);
  if (eq < 0) return "";
  const open = text.indexOf("[", eq);
  if (open < 0) return "";
  let depth = 0;
  for (let j = open; j < text.length; j += 1) {
    if (text[j] === "[") depth += 1;
    else if (text[j] === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(open, j + 1);
    }
  }
  return "";
}

// Mismo criterio que knownStaticRoutes en app-plugin-runtime.registry.ts:
// routes[].path + navigation[].route + workspaces[].route.
const real = new Set([
  ...fieldValues(constArray(manifestText, "PLATFORM_ROUTE_CONTRIBUTIONS"), "path"),
  ...fieldValues(constArray(navText, "APP_NAVIGATION_DEFINITIONS"), "route"),
  ...fieldValues(arrayBlocks(manifestText, "workspaces"), "route"),
]);
if (real.size === 0) {
  console.error("check-shell-routes-sync: no se extrajo NINGUNA ruta del shell. El extractor esta roto o el manifest cambio de forma; no se afirma nada.");
  process.exit(2);
}

// `--list` imprime el conjunto autoritativo en JSON, para poder sincronizar las otras dos listas
// desde la MISMA extraccion que despues las verifica (y no desde una copia a mano que ya nacería
// divergiendo).
if (process.argv.includes("--list")) {
  console.log(JSON.stringify([...real].sort(), null, 2));
  process.exit(0);
}

const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
const schemaEnum = new Set((schema.$defs && schema.$defs.knownShellRoute && schema.$defs.knownShellRoute.enum) || []);

const gateText = readFileSync(GATE, "utf8");
const gateMatch = gateText.match(/KNOWN_SHELL_ROUTES\s*=\s*(?:new Set\()?\[([\s\S]*?)\]/);
const gateList = new Set(gateMatch ? [...gateMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]) : []);

const problemas = [];
const diff = (etiqueta, declarado) => {
  const sobran = [...declarado].filter((r) => !real.has(r)).sort();
  const faltan = [...real].filter((r) => !declarado.has(r)).sort();
  if (sobran.length) {
    problemas.push(`${etiqueta}: ${sobran.length} ruta(s) declarada(s) que el shell NO monta -> el plugin pasa el gate y el runtime lo pone en cuarentena: ${sobran.join(", ")}`);
  }
  if (faltan.length) {
    problemas.push(`${etiqueta}: ${faltan.length} ruta(s) REAL(es) del shell ausente(s) -> un plugin que apunte ahi es rechazado sin motivo: ${faltan.join(", ")}`);
  }
};

console.log("check-shell-routes-sync");
console.log(`Rutas reales del shell (manifest estatico): ${real.size}`);
diff("catalog.schema.json ($defs.knownShellRoute.enum)", schemaEnum);
diff("validate-plugin-catalog.js (KNOWN_SHELL_ROUTES)", gateList);

if (problemas.length > 0) {
  for (const p of problemas) console.error(`  ✗ ${p}`);
  console.error("\nFuente de verdad: frontend/apps/web/src/app/core/platform-plugin.manifest.ts");
  console.error("(es el mismo conjunto con el que app-plugin-runtime.registry.ts construye knownStaticRoutes)");
  process.exit(1);
}

console.log("OK. El contrato publico y el gate de build declaran exactamente las rutas que el shell monta.");
process.exit(0);
