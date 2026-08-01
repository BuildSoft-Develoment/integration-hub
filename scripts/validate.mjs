#!/usr/bin/env node
/**
 * validate.mjs (v12.89)
 *
 * Equivalente TRAZADO de check:all para humanos/agentes: corre cada validador
 * HOJA (check:* cuyo script es `node ...`) individualmente, mide exit + duracion,
 * y REGISTRA cada corrida en ai_action_runs (origin cli). Asi el semaforo del panel
 * ("Debe validar") refleja las corridas de terminal — antes solo contaban las del
 * panel/agente y todo aparecia "sin registro".
 *
 * Diferencia con `npm run check:all`:
 *   - check:all es composite npm (CI puro, sin tocar la BD), corta al primer fallo.
 *   - validate corre TODOS, no corta, y alimenta el panel (registra cada uno).
 *
 * Uso:
 *   npm run validate            (corre + registra; exit 1 si alguno falla)
 *   npm run validate -- --quiet (menos verboso)
 *
 * Exit: 0 si todos pasan; 1 si alguno falla (como check:all).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);
const root = resolve(argVal("--root") || ".");
const quiet = args.includes("--quiet");

const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) { console.error("validate: no hay package.json en " + root); process.exit(1); }
const scripts = (JSON.parse(readFileSync(pkgPath, "utf8")).scripts) || {};

// Conjunto de check:* ALCANZABLES desde check:all (= check:template + check:project),
// expandiendo composites (valor con `npm run`). Asi validate corre exactamente lo
// mismo que check:all y no validadores sueltos (p.ej. check:instantiation).
// Se capturan TODOS los `npm run <script>`, no solo los que empiezan por `check:`, y se conservan
// los argumentos que vengan detras de `--`.
//
// Antes el patron era /npm run (check:[a-z0-9:-]+)/ y eso dejaba fuera dos pasos reales de la
// cadena: `gen:catalogo:check` (paso 39 de 39 de check:project) y `specify:compat:check` (paso 9 de
// 9 de check:template). validate anunciaba "47/47 OK" sin haberlos ejecutado nunca.
//
// Y descartaba los flags: `check:prototype-diversity -- --strict`,
// `check:prototype-html5 -- --strict` y `check:prototype-visible-product -- --strict` se corrian
// SIN --strict, que es un control mas debil que el que la cadena declara.
//
// Mientras solo se registraban hojas eso era una sobre-afirmacion contenida. Al empezar a registrar
// el agregado del compuesto pasa a ser una mentira con consecuencias: el panel diria "check:project
// paso" apoyandose en una corrida que no ejecuto todos sus pasos. De ahi que el arreglo tenga que
// ser este y no ensanchar el agregado.
function tokensOf(text) {
  return [...String(text).matchAll(/npm run ([a-z0-9:._-]+)((?:\s+--\s+[^&|\n]+)?)/g)]
    .map((m) => ({ script: m[1], extra: (m[2] || "").replace(/^\s*--\s*/, "").trim() }));
}
/** clave unica de invocacion: un mismo script puede invocarse con y sin flags. */
const invKey = (script, extra) => (extra ? `${script} :: ${extra}` : script);

const reachable = new Map(); // invKey -> {script, extra}
const queue = [
  ...tokensOf(scripts["check:template"]),
  ...tokensOf(scripts["check:project"]),
];
while (queue.length) {
  const t = queue.shift();
  const key = invKey(t.script, t.extra);
  if (reachable.has(key)) continue;
  reachable.set(key, t);
  const val = scripts[t.script];
  if (val && /npm run /.test(val)) queue.push(...tokensOf(val)); // composite -> expandir
}

// Invocaciones HOJA alcanzables: las que ejecutan `node ...` directamente.
const leaves = [...reachable.values()]
  .filter((t) => scripts[t.script] && /^node\s/.test(String(scripts[t.script])))
  .sort((a, b) => invKey(a.script, a.extra).localeCompare(invKey(b.script, b.extra)))
  .map((t) => ({
    script: t.extra ? `${t.script} -- ${t.extra}` : t.script,
    actionId: "check-" + (t.script.startsWith("check:") ? t.script.slice("check:".length) : t.script.replace(/:/g, "-")),
    cmd: String(scripts[t.script]) + (t.extra ? " " + t.extra : ""),
  }));

if (leaves.length === 0) { console.error("validate: no se encontraron validadores hoja check:* en package.json"); process.exit(1); }

console.log(`validate (v12.89) — ${leaves.length} validadores hoja · registrando en ai_action_runs (origin cli)`);

const batch = [];
let failed = 0;
for (const leaf of leaves) {
  // "node ci/scripts/check-x.mjs --flag" -> [ci/scripts/check-x.mjs, --flag]
  const nodeArgs = leaf.cmd.replace(/^node\s+/, "").split(/\s+/);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, nodeArgs, { cwd: root, encoding: "utf8" });
  const ms = Date.now() - t0;
  const exit = r.status == null ? 1 : r.status;
  batch.push({ action: leaf.actionId, exit, ms });
  if (exit !== 0) failed += 1;
  const icon = exit === 0 ? "✓" : "✗";
  if (!quiet || exit !== 0) console.log(`  ${icon} ${leaf.script} (${ms}ms${exit !== 0 ? `, exit ${exit}` : ""})`);
}

// Ademas de las hojas, se registran los COMPUESTOS que se acaban de expandir
// (check:project, check:all, check:template...) con su resultado agregado.
//
// Sin esto quedaban condenados a mostrar para siempre el ultimo resultado que alguien hubiera
// lanzado desde el panel. Caso real: el semaforo enseñaba `npm run check:project — ultima corrida
// fallo (exit 1)` fechado diez dias atras, mientras las 47 hojas de esa misma cadena acababan de
// pasar en verde en la fila de al lado. Los contratos de fase piden validar el COMPUESTO
// (`npm run check:project`), no las hojas, asi que era justo el registro que nunca se refrescaba.
//
// El agregado no es una suposicion: si `check:project` es la conjuncion de N hojas y las N pasaron,
// paso. Solo se registran los compuestos cuyas hojas se ejecutaron TODAS aqui.
// `reachable` contiene los HIJOS de check:template y check:project, no a ellos mismos ni a
// check:all, que es su raiz. Los tres hay que nombrarlos aparte o se quedan justo los que los
// contratos de fase citan.
const composites = [...new Set([
  ...[...reachable.values()].map((t) => t.script),
  "check:template", "check:project", "check:all",
])].filter((k) => scripts[k] && /npm run /.test(String(scripts[k]))).sort();

const actionIdOf = (script) =>
  "check-" + (script.startsWith("check:") ? script.slice("check:".length) : script.replace(/:/g, "-"));

for (const name of composites) {
  // Hojas alcanzables desde este compuesto en concreto, con la MISMA expansion que se ejecuto.
  const seen = new Set();
  const q = tokensOf(scripts[name]);
  const own = new Set();
  while (q.length) {
    const t = q.shift();
    const key = invKey(t.script, t.extra);
    if (seen.has(key)) continue;
    seen.add(key);
    const val = scripts[t.script];
    if (val && /npm run /.test(val)) q.push(...tokensOf(val));
    else if (val && /^node\s/.test(String(val))) own.add(actionIdOf(t.script));
  }
  if (own.size === 0) continue;
  const ejecutadas = batch.filter((b) => own.has(b.action));
  const cubiertas = new Set(ejecutadas.map((b) => b.action));
  if (cubiertas.size !== own.size) {
    // No se ejecutaron todas sus hojas: no se afirma NADA sobre este compuesto. Callar es correcto;
    // estampar un verde parcial seria peor que dejar el registro viejo.
    if (!quiet) {
      const faltan = [...own].filter((a) => !cubiertas.has(a));
      console.log(`  ~ ${name} sin registrar: ${faltan.length} de sus ${own.size} hojas no se ejecutaron (${faltan.slice(0, 3).join(", ")})`);
    }
    continue;
  }
  const exit = ejecutadas.some((b) => b.exit !== 0) ? 1 : 0;
  batch.push({ action: actionIdOf(name), exit, ms: null });
  if (!quiet) console.log(`  ${exit === 0 ? "✓" : "✗"} ${name} (agregado de ${own.size} hojas, todas ejecutadas)`);
}

// Registrar el batch en la BD (best-effort; no rompe validate si falla).
try {
  const batchFile = join(tmpdir(), `spdd-validate-${Date.now()}.json`);
  writeFileSync(batchFile, JSON.stringify(batch), "utf8");
  const agent = join(root, "scripts", "ai-framework-agent.mjs");
  if (existsSync(agent)) {
    const rec = spawnSync(process.execPath, [agent, "record-run", "--batch", batchFile, "--origin", "cli", "--root", root], { cwd: root, encoding: "utf8" });
    if (!quiet && rec.stdout) process.stdout.write(rec.stdout);
  }
} catch { /* best-effort */ }

const passed = leaves.length - failed;
console.log(`\nvalidate: ${passed}/${leaves.length} OK${failed ? ` · ${failed} con fallo` : ""}. Registrado en el panel (Roadmap → fase → Debe validar).`);
process.exit(failed > 0 ? 1 : 0);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
}
