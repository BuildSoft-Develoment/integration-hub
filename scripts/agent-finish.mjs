#!/usr/bin/env node
/**
 * agent-finish.mjs (v12.140)
 *
 * Cierre estructurado de un feature. Es el punto final de la Capa 1:
 *
 *   1. Verifica que TODOS los T-NNN de spec-tareas.md (no-pending) tengan
 *      ai_task_runs.status='approved' en SQLite. Si no, exit 3.
 *   2. Corre verificaciones (check:project + check:tasks-executable + check:tdd-evidence
 *      + check:task-reviews) sobre la RAIZ resuelta (--root o cwd), no el worktree.
 *      Si alguna falla, exit 4.
 *   3. Corre roadmap:audit (anti-auto-aprobacion). Si hay findings solo AVISA: no aborta.
 *   4. PREGUNTA al humano (Principio 1, anti-auto-aprobacion):
 *      [1] Crear PR    [2] Merge local    [3] Mantener    [4] Descartar
 *   5. Estampa finished_at solo si la integracion (pr/merge) se completo entera.
 *
 * NO escribe archivos: no toca traceability.md ni tdd-evidence.md — actualizalos antes.
 * NO libera locks ni remueve worktrees, en ninguna de las 4 opciones.
 *
 * pr / merge operan sobre las ramas de trabajo `agent/<feature>/<t-nnn>` que crea
 * agent:start, NO sobre el HEAD de la raiz. En merge, la rama actual de la raiz es el
 * DESTINO y hay tres motivos de exit 5: no hay ramas de la feature, estas parado en una
 * rama agent/* (de cualquier feature), o la raiz esta en HEAD despegado.
 *
 * Exit codes: 1 accion invalida · 2 falta la BD · 3 T no approved · 4 checks en rojo
 *             5 destino invalido para merge · 6 integracion pedida no completada
 *             7 algun check no llego a correr (fallo de entorno, no del proyecto)
 *
 * Uso:
 *   node scripts/agent-finish.mjs --feature 002-mi
 *   node scripts/agent-finish.mjs --feature 002-mi --action pr      (humano confirma inline)
 *   node scripts/agent-finish.mjs --feature 002-mi --dry-run
 */

// v12.126: suprime ExperimentalWarning de node:sqlite (Windows pipe stderr hangs).
process.removeAllListeners("warning");

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createInterface } from "node:readline";
import process from "node:process";

const COL_NAMES = ["id", "rf", "tipo", "archivo", "test", "comando_red", "expected_red", "comando_green", "expected_green", "depende_de", "paralelizable", "estado"];

// Estado de los prompts. Declarado AQUI y no junto a ask(): `let` no se iza, y el flujo
// principal —que corre antes de las funciones del final— lo tocaria en zona muerta.
let _rl = null;        // interfaz readline unica, en modo 'line'
let _rlCerrado = false;
let _cola = [];        // lineas ya recibidas que aun nadie pidio
let _esperando = null; // resolver de la pregunta en curso, si la hay

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dryRun = !!args["dry-run"];

if (args.help || !args.feature) {
  console.log(`agent-finish (v12.140) — cierre estructurado del feature (verify + reviews + opciones humanas).

Uso:
  node scripts/agent-finish.mjs --feature <slug>
  node scripts/agent-finish.mjs --feature <slug> --action <pr|merge|keep|discard>
  node scripts/agent-finish.mjs --feature <slug> --dry-run

Acciones:
  1. Verifica TODOS los T-NNN del feature en SQLite (status=approved).
  2. Corre check:project + check:tasks-executable + check:tdd-evidence + check:task-reviews.
  3. Corre roadmap:audit (anti-auto-aprobacion).
  4. Si todo OK: pregunta al humano [PR|merge|keep|discard]. No mergea ni descarta sin firma.

Anti-patterns que bloquea:
  - Merge sin que todos los T esten approved.
  - Auto-merge sin opcion humana (Principio 1).
  - Descartar worktree sin doble confirmacion.
`);
  process.exit(args.help ? 0 : 1);
}

const feature = String(args.feature).trim();

// v12.140: una accion desconocida (typo, o `--action` sin valor -> parseArgs devuelve
// true) caia por todos los if/else sin hacer nada y el script salia 0 diciendo
// "completado". Se valida la ENTRADA del usuario antes de abrir la BD y de correr los
// checks, para que un typo falle en milisegundos y no tras 40s. askAction() solo puede
// devolver pr|merge|keep|discard, asi que no hace falta validar el valor derivado.
const ACCIONES_VALIDAS = new Set(["pr", "merge", "keep", "discard"]);
if (args.action !== undefined && !ACCIONES_VALIDAS.has(args.action)) {
  console.error(`✗ Accion invalida: '${args.action}'. Usa --action pr|merge|keep|discard (u omitelo para elegir interactivamente).`);
  process.exit(1);
}

const dbPath = join(root, "ai", "memory", "framework-agent.db");
if (!existsSync(dbPath)) {
  console.error(`No existe la memoria ${dbPath}.`);
  process.exit(2);
}
const db = new DatabaseSync(dbPath);

// Carga spec-tareas + filtra T no-pending.
const tareasPath = join(root, "specs", feature, "spec-tareas.md");
if (!existsSync(tareasPath)) { console.error(`No existe ${tareasPath}.`); cerrarPrompt(); db.close(); process.exit(2); }
const tareas = readFileSync(tareasPath, "utf8");
const headRe = /^##\s+Tabla ejecutable de tareas\b[^\n]*\n/im;
const headMatch = tareas.match(headRe);
if (!headMatch) { console.error(`spec-tareas.md sin tabla ejecutable.`); cerrarPrompt(); db.close(); process.exit(2); }
const rest = tareas.slice(headMatch.index + headMatch[0].length);
const nextSect = rest.match(/^##\s/m);
const tableText = nextSect ? rest.slice(0, nextSect.index) : rest;
const tableLines = tableText.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));

const nonPending = [];
for (let i = 2; i < tableLines.length; i += 1) {
  const cells = tableLines[i].split("|").slice(1, -1).map((s) => s.trim());
  if (cells.length !== COL_NAMES.length) continue;
  const row = Object.fromEntries(COL_NAMES.map((c, idx) => [c, cells[idx]]));
  if (row.estado !== "pending") nonPending.push(row);
}

console.log(`agent-finish (v12.140) — feature: ${feature}`);
console.log(`T no-pending en spec-tareas: ${nonPending.length}`);

// 1. Verifica que todos esten approved.
const notApproved = [];
for (const r of nonPending) {
  const run = db.prepare(`SELECT * FROM ai_task_runs WHERE feature=? AND task_id=? ORDER BY started_at DESC LIMIT 1`).get(feature, r.id);
  if (!run || run.status !== "approved") notApproved.push({ id: r.id, status: run ? run.status : "(sin run)" });
}
if (notApproved.length > 0 && !dryRun) {
  console.error(`\n✗ ${notApproved.length} T no estan approved:`);
  for (const x of notApproved) console.error(`  - ${x.id} (status=${x.status})`);
  console.error(`\nCorre 'npm run agent:review -- --task <T> --feature ${feature} --stage both --reviewer <otro>' por cada T.`);
  cerrarPrompt(); db.close();
  process.exit(3);
}

// 2. Corre verificaciones.
console.log(`\nCorriendo verificaciones...`);
const checks = ["check:project", "check:tasks-executable", "check:tdd-evidence", "check:task-reviews"];
// v12.140: 'status !== 0' metia en el mismo saco dos cosas muy distintas: status=1..n
// (el check corrio y encontro blockers) y status=null (NUNCA llego a correr: EINVAL,
// ENOENT, ENOBUFS). Ese detector es el que mantuvo invisible el bug de spawn en Windows,
// reportando fallo de entorno como si el proyecto estuviera en rojo. Ahora se separan.
const failed = [];
const noEjecutados = [];
for (const c of checks) {
  if (dryRun) { console.log(`  (dry-run) ${c}`); continue; }
  const r = runNpm(c, "pipe");
  if (r.status === 0) { console.log(`  ✓ ${c}`); continue; }
  if (r.status === null) {
    console.error(`  ⚠ ${c} — NO se pudo ejecutar (${r.error ? r.error.code : "sin status"}). Fallo de entorno, no del proyecto.`);
    noEjecutados.push(c);
    continue;
  }
  console.log(`  ✗ ${c} (exit ${r.status})`);
  failed.push(c);
}
if (noEjecutados.length > 0) {
  console.error(`\n✗ Checks que no llegaron a correr: ${noEjecutados.join(", ")}.`);
  console.error(`  No sabemos si el proyecto esta verde. Arregla el entorno y reintenta.`);
  cerrarPrompt(); db.close();
  process.exit(7);
}
if (failed.length > 0) {
  console.error(`\n✗ Checks fallidos: ${failed.join(", ")}. Aborto.`);
  cerrarPrompt(); db.close();
  process.exit(4);
}

// 3. roadmap:audit
if (!dryRun) {
  console.log(`\nCorriendo roadmap:audit...`);
  const audit = runNpm("roadmap:audit", "pipe");
  if (audit.status !== 0) {
    console.error(`\n⚠ roadmap:audit con findings — revisa antes de proceder.`);
  } else {
    console.log(`  ✓ roadmap:audit limpio`);
  }
}

// 4. Opciones humanas.
const action = args.action || (dryRun ? "dry-run" : await askAction());
console.log(`\nAccion elegida: ${action}`);

// v12.140: pr/merge operan sobre las ramas de trabajo agent/<feature>/<t-nnn>, no
// sobre el HEAD de la raiz. Antes se leia el HEAD y se mergeaba contra si mismo:
// siempre "Already up to date", sin integrar nada, y aun asi se estampaba finished_at.
let integrationOk = false;

if (action === "pr") {
  const branches = featureBranches(root, feature);
  if (dryRun) { console.log(`(dry-run) crearia un PR por cada rama de trabajo (${branches.length} detectada(s))`); }
  else if (branches.length === 0) {
    console.error(`✗ No hay ramas agent/${feature}/* en ${root}. No se creo ningun PR.`);
  } else {
    let ok = 0;
    for (const b of branches) {
      const pr = spawnSync("gh", ["pr", "create", "--fill", "--head", b], { cwd: root, stdio: "inherit" });
      if (pr.status === 0) ok += 1;
      else console.error(`  ✗ gh pr create fallo para ${b}. Crealo manualmente.`);
    }
    console.log(`\nPRs creados: ${ok}/${branches.length}`);
    integrationOk = ok === branches.length;
  }
} else if (action === "merge") {
  const target = currentBranch(root);
  const branches = featureBranches(root, feature);
  // En --dry-run estos dos casos se REPORTAN pero no abortan: dry-run nunca falla.
  if (branches.length === 0) {
    console.error(`✗ No hay ramas agent/${feature}/* en ${root}. Nada que mergear.`);
    if (!dryRun) { cerrarPrompt(); db.close(); process.exit(5); }
  }
  // Contra TODAS las ramas agent/*, no solo las de esta feature: si la raiz esta parada
  // en la rama de trabajo de OTRA feature (lo que hay checkouteado dentro de un worktree),
  // el merge avanzaria sobre esa rama efimera y el destino real nunca lo veria.
  if (workBranches(root).has(target)) {
    console.error(`✗ Estas parado en '${target}', que es una rama de trabajo (agent/*).`);
    console.error(`  Mergear ahi deja el trabajo en una rama efimera, no en el destino.`);
    console.error(`  Haz checkout de la rama destino primero y vuelve a correr agent:finish.`);
    if (!dryRun) { cerrarPrompt(); db.close(); process.exit(5); }
  }
  // HEAD despegado: el merge funcionaria y HEAD avanzaria, pero el commit queda
  // huerfano — ninguna rama lo referencia y se pierde al siguiente checkout.
  if (target === "HEAD") {
    console.error(`✗ La raiz esta en HEAD despegado (detached).`);
    console.error(`  Un merge aqui crea un commit huerfano: ninguna rama lo apunta y se pierde.`);
    console.error(`  Haz checkout de la rama destino primero.`);
    if (!dryRun) { cerrarPrompt(); db.close(); process.exit(5); }
  }
  // El auto-confirm de dry-run debe coincidir con el literal exigido; con "yes" el
  // dry-run de merge caia siempre en "Cancelado." y la simulacion era inalcanzable.
  const confirm = dryRun ? "yes-merge" : await ask(`Doble confirmacion: vas a mergear ${branches.length} rama(s) en '${target}'. Escribe "yes-merge": `);
  if (confirm !== "yes-merge") { console.log("Cancelado."); cerrarPrompt(); db.close(); process.exit(0); }
  if (dryRun) {
    if (branches.length) console.log(`(dry-run) mergearia en '${target}': ${branches.join(", ")}`);
  } else {
    let ok = 0;
    // Dos tipos de no-op, contados por separado: el gate de firma humana NO puede
    // afirmar una causa que no es la del caso. Ver el bloque de la firma mas abajo.
    let noopHead = 0;  // la rama ya estaba contenida: HEAD no se movio
    let noopTree = 0;  // HEAD avanzo con un merge VACIO: el arbol quedo identico
    for (const b of branches) {
      // v12.140: el exit code de git NO basta como criterio de exito. Con la rama ya
      // contenida en el destino (sin commits, o ya integrada), 'git merge --no-ff'
      // imprime "Already up to date." y sale 0 sin mover HEAD. Contar eso como
      // integrado es lo que estampaba finished_at sin un solo commit de merge.
      const before = headSha(root);
      const beforeTree = treeSha(root);
      // --no-edit: sin el, git abre el editor del mensaje de merge y el script cuelga.
      const merge = spawnSync("git", ["merge", "--no-ff", "--no-edit", b], { cwd: root, stdio: "inherit" });
      if (merge.status !== 0) {
        // El fallo tiene DOS formas y hay que distinguirlas: con conflicto git deja
        // MERGE_HEAD y 'git merge --abort' sirve; si RECHAZA el merge antes de empezarlo
        // (raiz sucia, historias no relacionadas) no hay MERGE_HEAD y ese comando falla.
        console.error(`\n✗ git merge de '${b}' en '${target}' fallo.`);
        // No asumir que .git es un directorio: en un worktree enlazado es un ARCHIVO con
        // 'gitdir:'. git rev-parse --git-dir resuelve el real en ambos casos.
        if (existsSync(join(gitDir(root), "MERGE_HEAD"))) {
          console.error(`  '${target}' queda EN MEDIO del merge (revisa 'git status'):`);
          console.error(`    - para continuar: resuelve los conflictos, 'git add' y 'git commit'`);
          console.error(`    - para deshacer:  git merge --abort`);
        } else {
          console.error(`  git rechazo el merge antes de empezarlo: '${target}' esta intacto.`);
          console.error(`  Causa tipica: la raiz tiene cambios sin commitear. Revisa 'git status'`);
          console.error(`  y limpia el arbol (commit o stash) antes de reintentar.`);
        }
        console.error(`  Las ramas restantes NO se mergearon. Vuelve a correr agent:finish al terminar.`);
        break;
      }
      if (headSha(root) === before) {
        noopHead += 1;
        console.error(`  ⚠ '${b}' ya estaba contenida en '${target}': o nunca commiteo, o se integro por otra via.`);
        console.error(`    NO cuenta como integrada. Confirmalo antes de dar por cerrada la feature.`);
        continue;
      }
      if (treeSha(root) === beforeTree) {
        noopTree += 1;
        console.error(`  ⚠ '${b}' creo commit de merge pero NO cambio el arbol de '${target}'.`);
        console.error(`    Su contenido ya estaba ahi (squash, cherry-pick o commits vacios).`);
        console.error(`    NO cuenta como integrada. Confirmalo antes de dar por cerrada la feature.`);
        continue;
      }
      ok += 1;
    }
    const noop = noopHead + noopTree;
    const desglose = [
      noopHead ? `${noopHead} ya contenidas` : null,
      noopTree ? `${noopTree} con merge vacio` : null,
    ].filter(Boolean).join(", ");
    console.log(`\nRamas integradas en '${target}': ${ok}/${branches.length}${noop ? ` (${noop} sin efecto: ${desglose})` : ""}`);

    // Valvula de escape para las ramas que no aportan contenido. Cubre los DOS tipos:
    //  - noopHead: la rama ya estaba en el destino (PR mergeado en el remoto, merge
    //    manual, o conflicto que el humano resolvio). No volvera a mover HEAD nunca.
    //  - noopTree: movio HEAD una vez con un merge vacio, y en una segunda corrida
    //    degrada al caso anterior. Tampoco aporta nunca.
    // Sin esta salida, ok jamas alcanza branches.length y finished_at queda inalcanzable
    // para siempre. No lo decide el script: lo firma el humano (Principio 1) — y para que
    // esa firma valga algo, el mensaje NO puede afirmar una causa que no es la del caso.
    let firmadas = 0;
    if (noop > 0 && ok + noop === branches.length) {
      const detalle = [
        noopHead ? `${noopHead} ya estaban contenidas (HEAD no se movio)` : null,
        noopTree ? `${noopTree} crearon un merge VACIO que SI avanzo '${target}'` : null,
      ].filter(Boolean).join("; ");
      const c = await ask(`${noop} rama(s) no aportaron contenido a '${target}' — ${detalle}. Si VERIFICASTE que su trabajo ya esta ahi, escribe "yes-ya-integrada": `);
      if (c === "yes-ya-integrada") { firmadas = noop; console.log(`  ${noop} rama(s) dadas por integradas bajo firma humana.`); }
      else console.error(`  Sin firma: la feature NO se cierra.`);
    }
    integrationOk = ok + firmadas === branches.length;
    // El destino queda con esos merges vacios encima: hay que decirlo, no dejarlo callado.
    if (noopTree > 0 && !integrationOk) {
      console.error(`\n⚠ '${target}' quedo con ${noopTree} merge(s) vacio(s) encima. Revisalos:`);
      console.error(`    git log --oneline -${noopTree + 1} ${target}`);
    }
  }
} else if (action === "keep") {
  console.log("Worktree y locks mantenidos. Continua trabajando o vuelve mas tarde.");
} else if (action === "discard") {
  const confirm = dryRun ? "yes" : await ask(`Doble confirmacion (perderas todo el trabajo del worktree): escribe "yes-discard": `);
  if (confirm !== "yes-discard") { console.log("Cancelado."); cerrarPrompt(); db.close(); process.exit(0); }
  console.log("Descarta del worktree no automatizado en v12.123 (manualmente: git worktree remove ...).");
}

// Actualiza finished_at de los runs approved — solo si la integracion salio bien.
// v12.140: antes se estampaba con action=pr|merge aunque el merge fallara o fuera un
// no-op, dejando finished_at como falsa evidencia de que la feature quedo integrada.
const integracionFallida = !dryRun && (action === "pr" || action === "merge") && !integrationOk;

if (!dryRun && integrationOk) {
  db.prepare(`UPDATE ai_task_runs SET finished_at=CURRENT_TIMESTAMP WHERE feature=? AND status='approved' AND finished_at IS NULL`).run(feature);
} else if (integracionFallida) {
  console.error(`\n⚠ finished_at NO se actualizo: la integracion no se completo.`);
}

// El exit code es el unico contrato legible por maquina. Con 0 fijo, un wrapper leia
// "exito" sobre un repo que podia haber quedado con conflictos sin resolver.
console.log(`\n[agent:finish ${integracionFallida ? "INCOMPLETO" : "completado"}] action=${action}`);
cerrarPrompt(); db.close();
process.exit(integracionFallida ? 6 : 0);

// ─────────────────────────────────────────────────────────────────────────
/**
 * Corre un npm script sobre la raiz. En Windows, npm es un .cmd y desde Node 20.12
 * spawnSync lo rechaza con EINVAL (mitigacion de CVE-2024-27980) salvo con shell:true;
 * sin esto los 4 checks salian status=null y el script moria siempre en exit 4.
 * Se pasa el comando como string unico para no disparar DEP0190 (args + shell).
 */
function runNpm(script, stdio) {
  return spawnSync(`npm run ${script}`, { cwd: root, stdio, shell: true });
}

/**
 * Directorio .git REAL, resuelto por git. En un worktree enlazado `.git` es un archivo
 * con `gitdir: ...`, asi que join(root, ".git", X) no encuentra nada.
 */
function gitDir(dir) {
  const r = spawnSync("git", ["rev-parse", "--absolute-git-dir"], { cwd: dir });
  const out = r.stdout ? r.stdout.toString().trim() : "";
  return out || join(dir, ".git");
}

/** SHA del HEAD de la raiz. Primer indicio de que un merge movio algo. */
function headSha(dir) {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir });
  return r.stdout ? r.stdout.toString().trim() : "";
}

/**
 * SHA del ARBOL del HEAD. Necesario ademas del de HEAD: un merge --no-ff siempre crea
 * commit (HEAD avanza) aunque no aporte contenido — rama con commits vacios, o trabajo
 * que ya llego al destino por squash o cherry-pick. Sin esto, 'HEAD avanzo' bastaba para
 * declarar integrada una rama que no sumo un byte.
 */
function treeSha(dir) {
  const r = spawnSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: dir });
  return r.stdout ? r.stdout.toString().trim() : "";
}

/** Rama actual de la raiz resuelta (destino del merge). */
function currentBranch(dir) {
  const r = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: dir });
  return r.stdout ? r.stdout.toString().trim() : "HEAD";
}

/** TODAS las ramas de trabajo del repo (cualquier feature). Destino nunca puede ser una. */
function workBranches(dir) {
  const r = spawnSync("git", ["for-each-ref", "--format=%(refname:short)", "refs/heads/agent/"], { cwd: dir });
  if (r.status !== 0 || !r.stdout) return new Set();
  return new Set(r.stdout.toString().split("\n").map((s) => s.trim()).filter(Boolean));
}

/** Ramas de trabajo de la feature: las que agent:start crea como agent/<feature>/<t-nnn>. */
function featureBranches(dir, slug) {
  const r = spawnSync("git", ["for-each-ref", "--format=%(refname:short)", `refs/heads/agent/${slug}/`], { cwd: dir });
  if (r.status !== 0 || !r.stdout) return [];
  return r.stdout.toString().split("\n").map((s) => s.trim()).filter(Boolean);
}

/**
 * Pregunta al humano. Dos caminos, porque el script encadena hasta 3 prompts:
 *
 *  - stdin NO interactivo (piped, CI, tests): se lee entero de una vez y las respuestas
 *    se sirven por orden. Con readline aqui, el 'close' de EOF llegaba antes de que se
 *    registrara la segunda pregunta: devolvia "" aunque la linea estuviera ahi, y la
 *    promesa sin resolver mataba el proceso con exit 13.
 *  - stdin interactivo (TTY): una unica interfaz readline reutilizada. Crear una por
 *    pregunta hacia que la segunda no recibiera nada.
 *
 * Si no hay respuesta devuelve "". Ninguna confirmacion acepta "", asi que el flujo
 * cancela de forma segura en vez de colgarse o cerrar la feature por su cuenta.
 * Tolera CRLF y espacios alrededor.
 */
function ask(q) {
  process.stdout.write(q);
  if (_rlCerrado && !_cola.length) return Promise.resolve("");
  if (!_rl) {
    // Una sola interfaz, en modo 'line'. NO se usa rl.question: readline emite las lineas
    // en cuanto llegan, y si no hay un question() pendiente en ese instante se pierden —
    // por eso con pipe fallaban la 2a y 3a respuesta. Con cola no se pierde ninguna.
    _rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    _rl.on("line", (l) => { if (_esperando) { const f = _esperando; _esperando = null; f(l); } else _cola.push(l); });
    _rl.on("close", () => { _rlCerrado = true; if (_esperando) { const f = _esperando; _esperando = null; f(""); } });
  }
  if (_cola.length) return Promise.resolve(String(_cola.shift() ?? "").trim());
  if (_rlCerrado) return Promise.resolve("");
  return new Promise((resolve) => { _esperando = (v) => resolve(String(v ?? "").trim()); });
}

/** Cierra la interfaz para que el proceso no quede vivo por el stdin abierto. */
function cerrarPrompt() { if (_rl && !_rlCerrado) { _rlCerrado = true; _rl.close(); } }

async function askAction() {
  console.log(`\nOpciones de cierre (Principio 1 — humano decide):`);
  console.log(`  [1] pr       — crear Pull Request via gh`);
  console.log(`  [2] merge    — merge local --no-ff (doble confirmacion)`);
  console.log(`  [3] keep     — mantener worktree para mas trabajo`);
  console.log(`  [4] discard  — descartar (doble confirmacion)`);
  const a = await ask(`Eleccion [1-4]: `);
  return { "1": "pr", "2": "merge", "3": "keep", "4": "discard" }[a] || "keep";
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
