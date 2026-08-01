#!/usr/bin/env node
/**
 * check-construction-map.mjs (v12.147)
 *
 * Exige que el mapa de construccion de fase 5 nombre TODOS los modulos del reactor Maven y todas
 * las librerias y apps del workspace de frontend.
 *
 * POR QUE EXISTE. `docs/fase-5-construccion/modulos/mapa-construccion-backend-frontend.md` decia
 * que el backend era `platform-app/` y nada mas. El reactor tiene SIETE modulos: no nombraba
 * `platform-spi`, `platform-contract`, `vertical-swift-mt101`, `vertical-iso20022`,
 * `audit-consumer` ni `ejemplos/backend-plugin-sidecar`. En frontend le faltaban `plugin-ui-kit`,
 * `sample-plugin` y `web-e2e`.
 *
 * No es un descuido cosmetico: el mapa es lo que responde "¿donde va este cambio?". Un mapa que
 * dice que solo existe `platform-app` empuja a meter codigo de vertical en el motor, que es
 * exactamente lo que ADR-021 y ADR-023 separan. Y ocultaba que `vertical-iso20022` (PAIN.001) es
 * una vertical DISTINTA de MT101, con la que es tentador confundirla por parecido.
 *
 * Ningun gate podia verlo: el contrato de fase 5 exige `src/`, tests y `traceability.md`, no la
 * documentacion descriptiva de la fase; y `check-markdown-paths` solo valida que los enlaces
 * resuelvan, no que el contenido siga siendo cierto. Este gate compara el documento contra el
 * reactor y contra el sistema de ficheros, que es lo unico que no se desactualiza.
 *
 * Modos: --strict (exit 1, default segun CHECK_STRICT) · --warn · --root <path>
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v12.147";
const MAPA = "docs/fase-5-construccion/modulos/mapa-construccion-backend-frontend.md";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);

console.log(`check-construction-map (${VERSION})`);

const mapaPath = join(root, MAPA);
if (!existsSync(mapaPath)) {
  console.error(`\nNo existe ${MAPA}. Es el documento que responde "donde va este cambio".`);
  process.exit(strict ? 1 : 0);
}
const texto = readFileSync(mapaPath, "utf8");

// ── modulos del reactor: la fuente es el pom, no una lista escrita a mano ──────────────
const pomPath = join(root, "pom.xml");
const modulos = existsSync(pomPath)
  ? [...readFileSync(pomPath, "utf8").matchAll(/<module>([^<]+)<\/module>/g)].map((m) => m[1].trim())
  : [];

// ── frontend: la fuente es el sistema de ficheros ─────────────────────────────────────
const frontend = [];
for (const grupo of ["apps", "libs"]) {
  const dir = join(root, "frontend", grupo);
  if (!existsSync(dir)) continue;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith(".")) frontend.push(`frontend/${grupo}/${e.name}`);
  }
}

const faltanBackend = modulos.filter((m) => !texto.includes(m));
const faltanFrontend = frontend.filter((f) => !texto.includes(f) && !texto.includes(f.split("/").pop()));

console.log(`Modulos del reactor: ${modulos.length} · rutas de frontend: ${frontend.length}`);

if (faltanBackend.length === 0 && faltanFrontend.length === 0) {
  console.log("OK. El mapa de construccion nombra cada modulo del reactor y cada ruta del frontend.");
  process.exit(0);
}

console.error(`\nMAPA DE CONSTRUCCION DESFASADO: ${faltanBackend.length + faltanFrontend.length} sin nombrar.`);
for (const m of faltanBackend) console.error(`  ✗ modulo Maven no aparece en el mapa: ${m}`);
for (const f of faltanFrontend) console.error(`  ✗ ruta de frontend no aparece en el mapa: ${f}`);
console.error(`\nPor que importa: ${MAPA} es lo que se lee para decidir DONDE va un cambio.`);
console.error(`Si no nombra un modulo, el codigo que le tocaba acaba en otro — normalmente en el`);
console.error(`motor, que es justo la frontera que ADR-021 y ADR-023 levantan.`);

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
