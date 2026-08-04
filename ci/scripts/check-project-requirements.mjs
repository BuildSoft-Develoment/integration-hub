#!/usr/bin/env node
/**
 * check-project-requirements.mjs
 *
 * Cierra el enlace entre los requisitos de PROYECTO (`RF-NN` del analisis de fase 1) y las features
 * que los implementan (columna `Req. global` de TRACEABILITY_MATRIX.md). En los DOS sentidos.
 *
 * POR QUE
 * `check-global-matrix` ya exige que los codigos de proyecto no se repitan, y que cada feature tenga
 * filas. Pero nadie comprobaba si un requisito DECLARADO tiene alguien que lo implemente, ni si una
 * fila apunta a un requisito que existe. Sin eso, el analisis de fase 1 puede declarar trece
 * funcionales y que tres no los recoja nadie, sin que ningun gate diga nada.
 *
 * Lo que encontro al escribirlo: `RF-08` (administrar conexiones) y `RF-09` (programar procesos)
 * estaban declarados con nombre propio y NADIE apuntaba a ellos — las features de conexiones y de
 * scheduling referenciaban "funcional 3" y "funcional 4", que son otros requisitos. El mapeo se
 * habia quedado atras cuando se anadieron los dos nuevos.
 *
 * NO BLOQUEA (exit 0 siempre). Es un medidor, no un trinquete, por una razon concreta: hay
 * requisitos transversales que NINGUNA feature implementa en exclusiva -- el acceso por roles, el
 * alto volumen, la operabilidad -- y forzar un puntero para ponerlo verde seria inventar una
 * trazabilidad que no existe. Lo util es que el numero se vea y baje, no que alguien lo silencie.
 *
 * Uso: node ci/scripts/check-project-requirements.mjs [--root <path>]
 */

process.removeAllListeners("warning");

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");

const ANALISIS = join(root, "docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md");
const MATRIZ = join(root, "TRACEABILITY_MATRIX.md");

if (!existsSync(ANALISIS) || !existsSync(MATRIZ)) {
  console.log("check-project-requirements: N/A (falta el analisis de fase 1 o la matriz global).");
  process.exit(0);
}

/** Codigos declarados: van entre comillas invertidas en la lista de requerimientos. */
function declarados() {
  const texto = readFileSync(ANALISIS, "utf8");
  const out = new Map();
  for (const m of texto.matchAll(/^[-*]\s*`(RF|RNF)-(\d{2})`\s*(.{0,70})/gmi)) {
    out.set(`${m[1].toUpperCase()}-${m[2]}`, m[3].replace(/\.$/, "").trim());
  }
  return out;
}

/**
 * Codigos referenciados desde la matriz. La columna se escribe en prosa ("funcional 11
 * (money-path)"), asi que se extrae el numero; las que no llevan numero se cuentan aparte en vez de
 * darlas por buenas.
 */
function referenciados() {
  const texto = readFileSync(MATRIZ, "utf8");
  const usados = new Map();
  const sinCodigo = [];
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea.startsWith("|")) continue;
    const c = linea.split("|").map((x) => x.trim());
    if (!/^\d{3}-/.test(c[1] || "")) continue;
    const valor = c[3] || "";
    const m = valor.match(/^(no\s+)?funcional\s+(\d+)/i);
    if (!m) { sinCodigo.push(`${c[1]} ${c[2]}: "${valor}"`); continue; }
    const codigo = `${m[1] ? "RNF" : "RF"}-${String(m[2]).padStart(2, "0")}`;
    if (!usados.has(codigo)) usados.set(codigo, []);
    usados.get(codigo).push(`${c[1]} ${c[2]}`);
  }
  return { usados, sinCodigo };
}

const decl = declarados();
const { usados, sinCodigo } = referenciados();

const huerfanos = [...decl.keys()].filter((c) => !usados.has(c));
const inventados = [...usados.keys()].filter((c) => !decl.has(c));

console.log("check-project-requirements");
console.log(`  requisitos de proyecto declarados : ${decl.size}`);
console.log(`  referenciados por alguna feature  : ${decl.size - huerfanos.length}`);
console.log(`  filas de la matriz sin codigo     : ${sinCodigo.length}`);

if (huerfanos.length) {
  console.log(`\n  Declarados que NADIE implementa (${huerfanos.length}):`);
  for (const c of huerfanos) console.log(`    ${c}  ${decl.get(c)}`);
  console.log("    Si es transversal y no lo posee ninguna feature, esta bien que salga aqui:");
  console.log("    lo que no puede pasar es que se pierda de vista.");
}

if (inventados.length) {
  console.log(`\n  ✗ La matriz apunta a codigos que NO existen en el analisis (${inventados.length}):`);
  for (const c of inventados) console.log(`    ${c} <- ${usados.get(c).join(", ")}`);
  console.log("    Esto si es un error: la fila referencia un requisito que nadie declaro.");
}

if (sinCodigo.length) {
  console.log(`\n  Filas cuya 'Req. global' no lleva numero de requisito (${sinCodigo.length}):`);
  for (const s of sinCodigo.slice(0, 12)) console.log(`    ${s}`);
  if (sinCodigo.length > 12) console.log(`    ... y ${sinCodigo.length - 12} mas`);
  console.log("    No enlazan con el analisis de fase 1: describen, pero no trazan.");
}

if (!huerfanos.length && !inventados.length && !sinCodigo.length) {
  console.log("\nOK. Cada requisito de proyecto tiene quien lo implemente, y cada fila apunta a uno real.");
}
process.exit(0);
