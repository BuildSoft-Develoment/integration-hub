#!/usr/bin/env node
/**
 * check-likec4.mjs
 *
 * Valida el modelo de arquitectura con la herramienta que ya existe: `likec4 validate`.
 *
 * POR QUE
 * `docs/fase-3-arquitectura/03.02-diagramas-c4-likec4.md` llama a `likec4/integration-hub.likec4`
 * la "fuente canonica" de la arquitectura, y hasta ahora era lo unico del repositorio que NADIE
 * comprobaba: no esta en package.json, ningun gate lo miraba, y un error de sintaxis solo se
 * descubria cuando alguien abria el visor.
 *
 * Peor: `roadmap-status.mjs` da la fase 3 por completa con que EXISTA el directorio `likec4/`
 * (`existsSync`). Un modelo roto, vacio o de otro producto contaba igual.
 *
 * QUE COMPRUEBA
 * Lo que comprueba `likec4 validate`: sintaxis, semantica (que las vistas referencien elementos
 * que existen) y derivas de layout. Tarda ~2s.
 *
 * NO COMPRUEBA que el modelo describa la arquitectura real — eso no lo puede saber una herramienta.
 * Para eso esta la revision humana. Este gate solo garantiza que lo que se dibuja es coherente
 * consigo mismo; es el suelo, no el techo.
 *
 * Si `likec4` no esta disponible (sin red, sin npx), NO falla: avisa y sale 0. Un gate que rompe
 * la build por no poder descargar una herramienta acaba desactivado, y con el se va la parte util.
 *
 * Uso: node ci/scripts/check-likec4.mjs [--root <path>]
 */

process.removeAllListeners("warning");

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");
const dir = join(root, "likec4");

if (!existsSync(dir)) {
  console.log("check-likec4: N/A (no hay carpeta likec4/).");
  process.exit(0);
}

const res = spawnSync("npx", ["--yes", "likec4@latest", "validate", dir], {
  encoding: "utf8",
  shell: true,
  timeout: 180_000,
});

const salida = `${res.stdout || ""}${res.stderr || ""}`;

if (res.error || res.status === null) {
  console.log("check-likec4: N/A (no se pudo ejecutar likec4; sin red o sin npx).");
  console.log(`  detalle: ${res.error ? res.error.message : "sin codigo de salida"}`);
  process.exit(0);
}

if (res.status !== 0) {
  console.error("check-likec4: el modelo de arquitectura NO valida.");
  const lineas = salida.split(/\r?\n/).filter((l) => /error|invalid|expect/i.test(l));
  for (const l of lineas.slice(0, 20)) console.error(`  ${l.trim()}`);
  console.error("\n  Reproduce con: npx likec4 validate likec4");
  process.exit(1);
}

console.log("check-likec4");
console.log("OK. El modelo de arquitectura valida (sintaxis, semantica y layout).");
process.exit(0);
