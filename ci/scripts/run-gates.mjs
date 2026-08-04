#!/usr/bin/env node
/**
 * run-gates.mjs (v12.152)
 *
 * Ejecuta la cadena de gates del proyecto y DEJA CONSTANCIA de cada ejecucion en la memoria viva.
 *
 * POR QUE EXISTE. `ai_gate_runs` acumulaba 47 filas y ninguna era una ejecucion: todas salian de
 * aprobaciones escritas a mano en documentos. La consola de documentacion viva mostraba, por tanto,
 * quien habia DICHO que un gate paso, no que hubiera pasado. Se anadio un gate nuevo, se ejecuto
 * decenas de veces, y el contador siguio en 47.
 *
 * DE DONDE SALE LA LISTA. De `scripts["check:project:chain"]` del package.json — la MISMA cadena que
 * ya se ejecutaba. No se copia la lista aqui: una segunda copia se desincroniza el primer dia y
 * volveriamos a tener un registro que no describe lo que corre.
 *
 * COMPORTAMIENTO. Se ejecutan TODOS los gates aunque alguno falle; el exit code es 1 si hubo alguno
 * rojo. Se abandona el fail-fast del `&&` original a proposito: paraba en el puesto 32 por la deuda
 * conocida de 008, y los 15 gates siguientes no se ejecutaban NUNCA. Un gate que no corre no vigila
 * nada, y ademas su ausencia en el ledger era indistinguible de "no hay nada que reportar".
 * `--fail-fast` recupera el comportamiento anterior para quien lo quiera.
 *
 * El exit code lo deciden los gates. Si la base de memoria no esta, se avisa y se sigue: el
 * veredicto de un gate no puede depender de que exista un sqlite local.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { registrarEjecucion, estadoDelArbol } from "./_lib/gate-ledger.mjs";

const VERSION = "v12.152";
const CADENA = "check:project:chain";

const args = process.argv.slice(2);
// Por defecto se ejecutan TODOS. El `&&` de la cadena original paraba al primer rojo, y eso dejaba
// 15 de 47 gates sin correr nunca: con la deuda conocida de 008 clavada en el puesto 32, los que
// venian detras llevaban meses sin que nadie supiera si pasaban. Un gate que no corre no vigila
// nada — que es justo el fallo que este proyecto persigue. `--fail-fast` recupera lo anterior.
const seguirTrasFallo = !args.includes("--fail-fast");
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const cadena = pkg.scripts?.[CADENA];
if (!cadena) {
  console.error(`\nNo existe el script '${CADENA}' en package.json. Es de donde sale la lista de gates.`);
  process.exit(1);
}

// `npm run X` y `npm run X -- --flag`: se conserva el nombre, que es lo que identifica al gate.
const gates = [...cadena.matchAll(/npm run ([a-z0-9:_-]+)/g)].map((m) => m[1]);
if (gates.length === 0) {
  console.error(`\n'${CADENA}' no declara ningun 'npm run <gate>'. Un ejecutor sin gates no puede dar OK.`);
  process.exit(1);
}

console.log(`run-gates (${VERSION}) · ${gates.length} gates · arbol ${estadoDelArbol(root)}`);
console.log(
  seguirTrasFallo
    ? "Se ejecutan TODOS aunque alguno falle (--fail-fast para parar en el primer rojo).\n"
    : "Modo --fail-fast: se para en el primer rojo; los siguientes no se ejecutan ni se registran.\n"
);

/**
 * Extrae la linea que de verdad explica el resultado.
 *
 * Tomar la ultima linea a secas no vale: 12 de 32 filas del primer registro guardaron o un aviso de
 * Node (`ExperimentalWarning` de node:sqlite) o una linea de guiones. Y justo el unico FAIL guardo
 * `---`, o sea que la fila que mas importa era la que menos decia.
 *
 * En un fallo interesa la PRIMERA linea con sustancia (los gates de este repo abren con el titular
 * del hallazgo y luego enumeran); en un OK, la ULTIMA, que es el veredicto.
 */
function resumirSalida(bruto, ok) {
  const utiles = String(bruto)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    // Ruido del runtime, no del gate.
    .filter((l) => !/^\(node:\d+\)|ExperimentalWarning|trace-warnings/.test(l))
    // Lineas decorativas: solo guiones, iguales, puntos o barras.
    .filter((l) => !/^[-─=_·.\s|+]+$/.test(l));
  if (utiles.length === 0) return "(sin salida util)";
  return ok ? utiles[utiles.length - 1] : utiles.find((l) => /[✗×!]|falla|error|falta|no /i.test(l)) ?? utiles[0];
}

const resultados = [];
let registrados = 0;
for (const gate of gates) {
  const t0 = Date.now();
  const res = spawnSync("npm", ["run", "--silent", gate], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const ms = Date.now() - t0;
  const exitCode = res.status ?? -1;
  const ok = exitCode === 0;
  const detalle = resumirSalida(`${res.stdout ?? ""}${res.stderr ?? ""}`, ok);

  resultados.push({ gate, ok, exitCode, ms, detalle });
  console.log(`  ${ok ? "OK  " : "FALLA"} ${gate.padEnd(38)} ${(ms / 1000).toFixed(1)}s  ${detalle.slice(0, 70)}`);

  if (await registrarEjecucion({ gate, alcance: CADENA, ok, exitCode, ms, detalle, root })) registrados += 1;

  if (!ok && !seguirTrasFallo) {
    console.error(`\nSe para en '${gate}' (exit ${exitCode}), (--fail-fast).`);
    console.error(`Modo --fail-fast activo; sin el se ejecutan todos.`);
    break;
  }
}

const fallidos = resultados.filter((r) => !r.ok);
console.log(`\nEjecutados ${resultados.length}/${gates.length} · fallidos ${fallidos.length} · registrados en la memoria viva ${registrados}`);
if (registrados < resultados.length) {
  console.error(`AVISO: ${resultados.length - registrados} ejecucion(es) no quedaron registradas (ver avisos [ledger] arriba).`);
}
for (const r of fallidos) console.error(`  ✗ ${r.gate} (exit ${r.exitCode})`);

process.exit(fallidos.length === 0 ? 0 : 1);
