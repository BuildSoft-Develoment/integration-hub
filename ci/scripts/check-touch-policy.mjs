#!/usr/bin/env node
/**
 * check-touch-policy.mjs (v12.150)
 *
 * Vigila que la politica de rutas del contrato de fases siga describiendo ESTE repositorio.
 *
 * POR QUE EXISTE. `touchAllow`/`touchForbid` son la guarda que dice que puede escribir cada fase, y
 * `roadmap:audit` la aplica de verdad contra `git diff`. Pero una guarda basada en globs tiene un
 * modo de fallo silencioso y total: **un glob que no matchea nada no protege nada, y desde fuera es
 * indistinguible de uno que funciona**. No lanza, no avisa, simplemente nunca se dispara.
 *
 * Paso aqui, y con consecuencias. El contrato declaraba las rutas de codigo como `src/**`,
 * `backend/**`, `tests/**` y `db/migration/**` -la plantilla generica de un proyecto de una sola
 * app-, mientras el codigo real vive en siete modulos Maven. Resultado medido: el commit que edito
 * cinco migraciones YA APLICADAS, dejando sin arrancar cualquier instalacion existente, se audito
 * contra una fase que declara `touchForbid: db/migration/**` y las cinco pasaron como avisos
 * corrientes entre 165. La regla estaba escrita, el mecanismo funcionaba, y la ruta apuntaba al vacio.
 *
 * QUE COMPRUEBA
 *   1. Ningun glob del contrato apunta a una ruta inexistente o a un directorio que solo tiene README.
 *   2. Los tokens de codigo (`<backend>`, `<migrations>`…) expanden a algo: si el pom raiz cambia de
 *      forma y la expansion se queda vacia, la guarda desaparece sin ruido.
 *   3. ORACULO: por cada modulo Maven se toma un fichero real de produccion y se comprueba que la
 *      fase de Construccion lo PERMITE y que una fase de analisis lo PROHIBE. Es la prueba de que la
 *      politica discrimina de verdad, no de que los strings tengan buena pinta.
 *
 * El punto 3 es el que importa. Los otros dos miran la forma; este ejercita la decision.
 *
 * Modos: --strict (default) · --warn · --root <path>
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { PHASE_CONTRACTS, getTouchPolicy } from "./_lib/phase-contracts.mjs";
import { mavenModules, globsMuertos } from "./_lib/code-roots.mjs";
import { matchAny } from "./_lib/glob-match.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v12.150";
const FASE_CONSTRUCCION = 5;
const FASES_ANALISIS = [1, 3];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const hallazgos = [];

console.log(`check-touch-policy (${VERSION})`);

const modulos = mavenModules(root);
if (modulos.length === 0) {
  console.error(`\nEl pom raiz no declara modulos. Sin eso, los tokens de codigo del contrato no`);
  console.error(`expanden a nada y toda la politica de rutas queda vacia.`);
  process.exit(strict ? 1 : 0);
}

// ── 1) globs que no describen nada ────────────────────────────────────────────────────
const muertosPorFase = new Map();
for (const c of PHASE_CONTRACTS) {
  const tp = getTouchPolicy(c.id, undefined, root);
  const m = [...globsMuertos(tp.allowed_paths, root), ...globsMuertos(tp.forbidden_paths, root)];
  if (m.length > 0) muertosPorFase.set(c.id, [...new Set(m)]);
}
const muertosDistintos = new Set([...muertosPorFase.values()].flat());

// ── 2) tokens que expanden a vacio ────────────────────────────────────────────────────
for (const c of PHASE_CONTRACTS) {
  for (const campo of ["touchAllow", "touchForbid"]) {
    for (const glob of c[campo] || []) {
      const tokens = glob.match(/<(backend|backend-test|migrations|frontend|frontend-test)>/g);
      if (!tokens) continue;
      const tp = getTouchPolicy(c.id, undefined, root);
      const lista = campo === "touchAllow" ? tp.allowed_paths : tp.forbidden_paths;
      const prefijo = glob.split("<")[0];
      if (!lista.some((p) => p.startsWith(prefijo) && !/[<>]/.test(p))) {
        hallazgos.push(
          `fase ${c.id} · ${campo}: el token ${tokens.join(",")} de "${glob}" no expandio a ninguna ruta. `
          + `La guarda existe en el contrato y no cubre nada.`,
        );
      }
    }
  }
}

// ── 3) EL ORACULO: la politica discrimina sobre ficheros reales ───────────────────────
function ficheroDeProduccion(modulo) {
  const base = join(root, modulo, "src/main/java");
  if (!existsSync(base)) return null;
  const buscar = (d, prof = 0) => {
    if (prof > 12) return null;
    let e; try { e = readdirSync(d, { withFileTypes: true }); } catch { return null; }
    for (const x of e) {
      if (x.isFile() && x.name.endsWith(".java")) return join(d, x.name);
    }
    for (const x of e) {
      if (x.isDirectory()) { const r = buscar(join(d, x.name), prof + 1); if (r) return r; }
    }
    return null;
  };
  const abs = buscar(base);
  return abs ? abs.slice(root.length + 1).split("\\").join("/") : null;
}

const construccion = getTouchPolicy(FASE_CONSTRUCCION, undefined, root);
let probados = 0;
for (const m of modulos) {
  const f = ficheroDeProduccion(m);
  if (!f) continue;
  probados += 1;

  if (!matchAny(f, construccion.allowed_paths)) {
    hallazgos.push(
      `fase ${FASE_CONSTRUCCION} (Construccion) NO PERMITE ${f}. El modulo '${m}' queda fuera de `
      + `allowed_paths: con la guarda encendida, construir en el seria una violacion.`,
    );
  }
  for (const fase of FASES_ANALISIS) {
    const tp = getTouchPolicy(fase, undefined, root);
    if (!matchAny(f, tp.forbidden_paths)) {
      hallazgos.push(
        `fase ${fase} NO PROHIBE ${f}. El modulo '${m}' se puede reescribir durante una fase de `
        + `analisis sin que la politica lo registre como violacion.`,
      );
    }
  }
}

console.log(`Modulos Maven: ${modulos.length} · probados con fichero real: ${probados} · globs sin destino: ${muertosDistintos.size}`);

// Los globs muertos se REPORTAN siempre pero no bloquean: distinguir "ruta mal escrita" de
// "carpeta que el proyecto aun no ha creado" necesita criterio humano, y bloquear por lo segundo
// convertiria este gate en ruido. Lo que SI bloquea es que la politica deje de discriminar.
if (muertosDistintos.size > 0) {
  console.log(`\nRutas declaradas que hoy no existen (informativo, no bloquea):`);
  for (const g of [...muertosDistintos].sort()) {
    const fases = [...muertosPorFase.entries()].filter(([, v]) => v.includes(g)).map(([k]) => k);
    console.log(`  · ${g}  (fases ${fases.join(", ")})`);
  }
  console.log(`  Decidir una por una: o se crea la ruta, o se quita del contrato. Una ruta declarada`);
  console.log(`  que no existe no protege nada y parece que si.`);
}

if (hallazgos.length === 0) {
  console.log(`\nOK. La politica de rutas describe los ${modulos.length} modulos reales y discrimina entre fases.`);
  process.exit(0);
}

console.error(`\nPOLITICA DE RUTAS QUE NO PROTEGE: ${hallazgos.length} hallazgo(s).`);
for (const h of hallazgos) console.error(`  ✗ ${h}`);
console.error(`\nLas rutas de codigo del contrato se derivan del pom raiz via _lib/code-roots.mjs.`);
console.error(`Si un modulo nuevo no aparece, revisa que este declarado como <module> y que use el`);
console.error(`layout estandar src/main · src/test.`);

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
