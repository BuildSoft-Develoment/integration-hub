#!/usr/bin/env node
/**
 * generate-global-matrix.mjs
 *
 * Regenera la tabla de `TRACEABILITY_MATRIX.md` desde las `specs/<slug>/traceability.md`.
 *
 * POR QUE
 * La matriz global se llama a si misma "rollup", pero se mantenia A MANO: 72 filas copiadas de
 * ocho ficheros. `check-global-matrix` ya vigilaba que no faltara ni sobrara ningun RF, y por eso
 * el conjunto de filas estaba bien; lo que nadie comparaba era el CONTENIDO de las celdas. Al
 * compararlo salieron 158 celdas distintas entre la fuente y el rollup.
 *
 * QUE SE DERIVA Y QUE NO — esto es lo importante de este script
 * De las 12 columnas, 10 son rollup literal y se generan. Dos NO lo son, y generarlas habria
 * destruido informacion:
 *
 *   - `Req. global`  mapea la numeracion LOCAL de cada feature (RF-001) a la de PROYECTO
 *                    (funcional 1). Ese mapeo es criterio humano; no se deduce de ningun sitio.
 *   - `Backlog (HU)` en la feature guarda el CODIGO (`HU-01`) y en el global el NOMBRE
 *                    ("Administrar fuentes"). No es la misma columna con deriva: son dos datos
 *                    complementarios, y 64 nombres existian SOLO en el global.
 *
 * Por eso el generador no las inventa: las LEE de la version anterior del fichero y las vuelve a
 * colocar. Regenerar no puede costar informacion que nadie mas tiene.
 *
 * Normalizaciones aplicadas (diferencias legitimas de representacion, no deriva):
 *   - `Evidencia`: la feature escribe `tdd-evidence.md`; el global necesita la ruta desde la raiz,
 *     porque se lee desde otro sitio. Se prefija con `specs/<slug>/`.
 *
 * Uso:
 *   node scripts/generate-global-matrix.mjs           regenera el fichero
 *   node scripts/generate-global-matrix.mjs --check   exit 1 si esta desactualizado (CI)
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");
const soloComprobar = args.includes("--check");

const MATRIZ = join(root, "TRACEABILITY_MATRIX.md");
const MARCA_INICIO = "<!-- auto:start name=matriz-global -->";
const MARCA_FIN = "<!-- auto:end -->";

const COL_FEATURE = ["RF", "HU", "UX/SPDD", "Prototipo", "API", "BD", "Codigo", "Test", "Estado", "Evidencia", "Frontend", "Front-test"];
const COL_GLOBAL = ["Feature", "RF", "Req. global", "Backlog (HU)", "API", "BD", "Codigo", "Test", "Estado", "Evidencia", "Frontend", "Front-test"];

/** Columnas del global que NO se derivan: se conservan de la version anterior. */
const COLUMNAS_HUMANAS = ["Req. global", "Backlog (HU)"];

function celdas(linea) {
  return linea.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function filasDeTabla(texto, columnas, colRf) {
  const out = [];
  for (const l of texto.split(/\r?\n/)) {
    if (!l.trim().startsWith("|")) continue;
    const c = celdas(l);
    if (!/^(RF|RNF)-\d+$/i.test((c[colRf] || "").trim())) continue;
    const fila = {};
    columnas.forEach((n, i) => { fila[n] = (c[i] ?? "").trim(); });
    out.push(fila);
  }
  return out;
}

function listarFeatures() {
  return readdirSync(join(root, "specs"))
    .filter((d) => /^\d{3}-/.test(d))
    .filter((d) => existsSync(join(root, "specs", d, "traceability.md")))
    .sort();
}

// ── Lo que ya hay: de aqui salen las columnas humanas.
const anterior = existsSync(MATRIZ) ? readFileSync(MATRIZ, "utf8") : "";
const humanas = new Map();
for (const g of filasDeTabla(anterior, COL_GLOBAL, 1)) {
  const clave = `${g.Feature}|${g.RF}`;
  humanas.set(clave, Object.fromEntries(COLUMNAS_HUMANAS.map((c) => [c, g[c] || "-"])));
}

// ── Lo que se deriva.
const filas = [];
const sinMapeo = [];
for (const slug of listarFeatures()) {
  const texto = readFileSync(join(root, "specs", slug, "traceability.md"), "utf8");
  for (const f of filasDeTabla(texto, COL_FEATURE, 0)) {
    const clave = `${slug}|${f.RF}`;
    const human = humanas.get(clave);
    if (!human) sinMapeo.push(clave);

    // La evidencia se escribe relativa a la feature; el global la necesita desde la raiz.
    let evidencia = f.Evidencia || "-";
    if (evidencia && evidencia !== "-" && !evidencia.includes("/")) {
      evidencia = `specs/${slug}/${evidencia}`;
    }

    filas.push({
      Feature: slug,
      RF: f.RF,
      "Req. global": human?.["Req. global"] || "-",
      "Backlog (HU)": human?.["Backlog (HU)"] || f.HU || "-",
      API: f.API || "-",
      BD: f.BD || "-",
      Codigo: f.Codigo || "-",
      Test: f.Test || "-",
      Estado: f.Estado || "-",
      Evidencia: evidencia,
      Frontend: f.Frontend || "-",
      "Front-test": f["Front-test"] || "-",
    });
  }
}

const tabla = [
  `| ${COL_GLOBAL.join(" | ")} |`,
  `|${COL_GLOBAL.map(() => "---").join("|")}|`,
  ...filas.map((r) => `| ${COL_GLOBAL.map((c) => r[c] || "-").join(" | ")} |`),
].join("\n");

const bloque = `${MARCA_INICIO}\n<!-- Generado por: npm run generate:matriz. No editar a mano dentro de esta zona.\n     Las columnas "Req. global" y "Backlog (HU)" NO se derivan: se conservan de la version\n     anterior porque son criterio humano. Editarlas aqui SI vale; sobreviven a la regeneracion. -->\n\n${tabla}\n\n${MARCA_FIN}`;

let salida;
if (anterior.includes(MARCA_INICIO)) {
  salida = anterior.replace(
    new RegExp(`${MARCA_INICIO.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${MARCA_FIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    bloque,
  );
} else {
  // Primera vez: sustituye la tabla suelta que hubiera bajo "## Matriz global".
  const idx = anterior.indexOf("## Matriz global");
  if (idx === -1) {
    console.error("No se encuentra la seccion '## Matriz global' en TRACEABILITY_MATRIX.md.");
    process.exit(1);
  }
  const cabecera = anterior.slice(0, idx + "## Matriz global".length);
  const resto = anterior.slice(idx + "## Matriz global".length);
  // Se descarta la tabla vieja (desde la primera fila de tabla hasta la ultima consecutiva).
  const sinTabla = resto.replace(/\n\|[\s\S]*?\n(?=\n[^|]|$)/, "\n");
  salida = `${cabecera}\n\n${bloque}\n${sinTabla}`;
}

if (soloComprobar) {
  const igual = anterior === salida;
  console.log(`generate-global-matrix --check: ${filas.length} filas derivadas de ${listarFeatures().length} features.`);
  if (!igual) {
    console.error("TRACEABILITY_MATRIX.md esta DESACTUALIZADA respecto a las traceability.md por feature.");
    console.error("Regenera con: npm run generate:matriz");
    process.exit(1);
  }
  console.log("OK. La matriz global coincide con las matrices por feature.");
  process.exit(0);
}

writeFileSync(MATRIZ, salida);
console.log(`TRACEABILITY_MATRIX.md regenerada: ${filas.length} filas de ${listarFeatures().length} features.`);
if (sinMapeo.length) {
  console.log(`\nAVISO: ${sinMapeo.length} fila(s) nuevas sin mapeo humano ('Req. global'). Rellenalas a mano:`);
  for (const c of sinMapeo.slice(0, 20)) console.log(`  - ${c}`);
}
