#!/usr/bin/env node
/**
 * check-likec4.mjs
 *
 * Valida el modelo de arquitectura con la herramienta que ya existe: `likec4 validate`.
 *
 * POR QUE
 * `docs/fase-3-arquitectura/03.02-diagramas-c4-likec4.md` trata `likec4/` como la fuente canonica de
 * la arquitectura del proyecto, y era lo unico del esqueleto que NADIE comprobaba: no estaba en
 * package.json, ningun gate lo miraba, y un error de sintaxis solo se descubria cuando alguien abria
 * el visor. Este gate nacio en este repositorio y se promovio a la plantilla; los tres fallos de abajo
 * se encontraron alli y se corrigen en los dos sitios.
 *
 * Peor: `roadmap-status.mjs` daba la fase 3 por entregada con que EXISTIERA el directorio
 * (`existsSync`). Un modelo roto, vacio o copiado de otro producto contaba igual. Ese `existsSync`
 * tambien se corrigio; los dos cambios van juntos porque el fallo era el mismo: dar por bueno un
 * entregable sin abrirlo.
 *
 * QUE COMPRUEBA
 * Lo que comprueba `likec4 validate`: sintaxis, semantica (que las vistas referencien elementos que
 * existen) y derivas de layout.
 *
 * NO COMPRUEBA que el modelo describa la arquitectura real — eso no lo puede saber una herramienta.
 * Para eso esta la revision humana. Este gate solo garantiza que lo que se dibuja es coherente
 * consigo mismo; es el suelo, no el techo.
 *
 * TRES TRAMPAS QUE ESTE GATE TUVO Y QUE CONVIENE NO REINTRODUCIR
 *
 * 1. `spawnSync("npx", [...args, dir], { shell: true })` NO escapa los argumentos. En una ruta con
 *    espacios (`C:\Users\Juan Perez\...`, `Mis documentos`, un runner de CI) cmd.exe partia la ruta,
 *    likec4 recibia un directorio inexistente, encontraba 0 ficheros y salia 0: el gate imprimia
 *    "OK. El modelo valida" sobre un modelo que ni siquiera habia abierto. Un falso verde con firma.
 *    Por eso ahora el argumento es el literal `likec4` y la ruta viaja por `cwd`, que no pasa por el
 *    shell.
 *
 * 2. Con `shell: true` quien responde es cmd.exe, asi que si falta `npx` el resultado es
 *    `{status:1, error:null}` — no `error`. La rama de "no se pudo ejecutar" nunca se tomaba y el
 *    gate acusaba al modelo de invalido cuando el problema era que no habia herramienta. Ahora se
 *    sondea `npx` aparte y los fallos de infraestructura se clasifican como N/A.
 *
 * 3. `likec4 validate` sale 0 cuando NO encuentra fuentes. Si por cualquier motivo el directorio no
 *    llega bien, "valido 0 ficheros" se lee como exito. Se comprueba explicitamente.
 *
 * Si `likec4` no se puede ejecutar (sin red, sin npx, registro caido), NO falla: avisa y sale 0. Un
 * gate que rompe la build por no poder descargar una herramienta acaba desactivado, y con el se va la
 * parte util. Lo que NO se hace es confundir eso con un modelo invalido.
 *
 * Uso: node ci/scripts/check-likec4.mjs [--root <path>]
 */

process.removeAllListeners("warning");

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");
const DIR = "likec4";
const dir = join(root, DIR);

/**
 * Version fijada a proposito, no `@latest`.
 *
 * Con `@latest` el veredicto de un gate obligatorio deja de ser reproducible: el mismo commit sale
 * verde hoy y rojo manana si se publica una version que endurezca la gramatica, sin que nadie haya
 * tocado el repositorio. Y `--yes` ejecuta sin preguntar lo que se acabe de descargar. Subirla es una
 * decision consciente, no un efecto secundario. Si el proyecto declara `likec4` en sus dependencias,
 * se usa esa instalacion y esto no se toca.
 */
const VERSION = "1.59.2";

/** Extensiones que LikeC4 reconoce. La plantilla usa `.likec4`; su propia guia de instanciacion y el
 *  plan de DR escriben `.c4`. Aceptar solo una daba un falso rojo a quien siguio la guia. */
const EXTENSIONES = [".likec4", ".c4"];

/** Busca ficheros de modelo EN PROFUNDIDAD: `likec4 validate` resuelve subcarpetas y esto tambien. */
function fuentesDeModelo(base, out = []) {
  let entradas;
  try {
    entradas = readdirSync(base, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entradas) {
    const full = join(base, e.name);
    if (e.isDirectory()) fuentesDeModelo(full, out);
    // Se exige FICHERO: un directorio llamado `views.likec4` -patron natural al crecer- colaba por
    // el filtro de nombre y dejaba pasar un modelo inexistente.
    else if (e.isFile() && EXTENSIONES.some((x) => e.name.toLowerCase().endsWith(x))) out.push(full);
  }
  return out;
}

if (!existsSync(dir)) {
  console.log("check-likec4: N/A (no hay carpeta likec4/).");
  process.exit(0);
}

const fuentes = fuentesDeModelo(dir);
if (fuentes.length === 0) {
  console.error(`check-likec4: la carpeta ${DIR}/ existe pero no contiene ningun fichero de modelo`);
  console.error(`  (${EXTENSIONES.join(" / ")}), ni siquiera en subcarpetas.`);
  console.error("  Un directorio sin fuentes no es un modelo de arquitectura.");
  process.exit(1);
}

/**
 * Marcas de que fallo la INFRAESTRUCTURA (no hay herramienta, no hay red), no el modelo.
 *
 * Hacen falta porque en Windows hay que invocar con `shell: true` -desde Node 18.20/20.12 un `.cmd`
 * no se puede lanzar sin shell (CVE-2024-27980)- y entonces quien responde es cmd.exe: un `npx` que
 * no existe llega como `{status:1, error:null}`, no como `error`. Sin esto, "no tengo la herramienta"
 * se leia como "tu modelo esta mal".
 */
const INFRA = /npm (error|ERR!)|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ERR_SOCKET|proxy|no se reconoce|is not recognized|command not found|404 Not Found/i;

// Sonda previa: distingue "no hay herramienta" de "el modelo esta mal".
const sonda = spawnSync("npx", ["--version"], { encoding: "utf8", shell: true, cwd: root, timeout: 60_000 });
if (sonda.error || sonda.status !== 0 || INFRA.test(`${sonda.stdout || ""}${sonda.stderr || ""}`)) {
  console.log("check-likec4: N/A (no hay npx disponible para ejecutar likec4).");
  process.exit(0);
}

// Los argumentos son literales SIN espacios; la ruta viaja por `cwd`, que no pasa por el shell. Asi
// una raiz con espacios deja de partir el comando (era el falso verde de la trampa 1).
const res = spawnSync("npx", ["--yes", `likec4@${VERSION}`, "validate", DIR], {
  encoding: "utf8",
  shell: true,
  cwd: root,
  timeout: 300_000,
});

const salida = `${res.stdout || ""}${res.stderr || ""}`;

if (res.error || res.status === null) {
  console.log("check-likec4: N/A (no se pudo ejecutar likec4).");
  console.log(`  detalle: ${res.error ? res.error.message : "terminado por senal o timeout"}`);
  process.exit(0);
}

if (res.status !== 0 && INFRA.test(salida)) {
  console.log("check-likec4: N/A (fallo de infraestructura al obtener likec4, no del modelo).");
  for (const l of salida.split(/\r?\n/).filter((l) => INFRA.test(l)).slice(0, 5)) console.log(`  ${l.trim()}`);
  process.exit(0);
}

if (res.status !== 0) {
  console.error("check-likec4: el modelo de arquitectura NO valida.");
  const lineas = salida.split(/\r?\n/).filter((l) => /error|invalid|expect/i.test(l));
  // Un rojo nunca sale desnudo: si el filtro no casa -mensajes en otro idioma, formato nuevo- se
  // imprime el final de la salida. Un gate que falla sin decir por que manda a buscar un fallo que
  // no existe.
  const detalle = lineas.length ? lineas.slice(0, 20) : salida.split(/\r?\n/).filter(Boolean).slice(-20);
  for (const l of detalle) console.error(`  ${l.trim()}`);
  console.error(`\n  Reproduce con: npx likec4@${VERSION} validate ${DIR}`);
  process.exit(1);
}

// Salio 0, pero ¿valido algo? `likec4 validate` da exito sobre cero ficheros.
if (/\(\s*0 (?:files|archivos)\s*\)/i.test(salida) || /no LikeC4 sources found|No likec4 documents found/i.test(salida)) {
  console.error(`check-likec4: likec4 salio con exito pero no valido NINGUN fichero, y aqui hay ${fuentes.length}.`);
  for (const l of salida.split(/\r?\n/).filter((l) => /workspace|sources|files/i.test(l)).slice(0, 8)) {
    console.error(`  ${l.trim()}`);
  }
  console.error("  Un 'valido' sobre cero ficheros no dice nada del modelo.");
  process.exit(1);
}

console.log("check-likec4");
console.log(`OK. El modelo de arquitectura valida (${fuentes.length} fichero(s): sintaxis, semantica y layout).`);
process.exit(0);
