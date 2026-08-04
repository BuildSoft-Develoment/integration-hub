/**
 * Registro de EJECUCIONES reales de gates en la memoria viva.
 *
 * POR QUE EXISTE. `ai_gate_runs` tenia 47 filas y ninguna era una ejecucion: se cosechan de las
 * aprobaciones escritas en documentos (`origin='feature'`). Es decir, la consola de documentacion
 * viva mostraba que ALGUIEN DIJO que un gate paso — no que un gate se hubiera ejecutado. Un gate
 * nuevo podia correr cincuenta veces y el ledger seguia clavado en 47.
 *
 * Para una homologacion bancaria esa diferencia es el asunto entero: una declaracion no es
 * evidencia. Aqui se escribe lo que de verdad paso, con `origin='execution'`, sin tocar las filas
 * documentales — el discriminador ya existia en el esquema.
 *
 * QUE SE GUARDA Y POR QUE. Lo minimo que permite comprobar la afirmacion mas tarde:
 *   - `status`  PASS/FAIL segun el codigo de salida REAL del proceso, no segun lo que imprima.
 *   - `summary` codigo de salida + duracion + la ultima linea util de la salida.
 *   - `actor`   quien EJECUTO (usuario del SO + host). No es un aprobador y no se presenta como tal:
 *               el `actor` de las filas documentales sale de `git log` y no acredita a nadie.
 *   - `evidence_paths` commit + si el arbol estaba sucio. Sin eso, "el gate paso" no dice sobre QUE.
 *   - `decided_at` queda NULL a proposito: nadie decidio nada, se ejecuto.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { hostname, userInfo } from "node:os";
import { resolve } from "node:path";

const DB_REL = "ai/memory/framework-agent.db";

/**
 * La base esta en .gitignore, asi que en CI no existe y el aviso saldria una vez POR GATE: 47 lineas
 * de ruido que acabarian ensenando a la gente a ignorar los avisos de este pipeline. Se avisa una
 * vez y se calla.
 */
let avisadoSinBase = false;

/** Commit actual + marca de arbol sucio; sin esto no se sabe sobre que codigo corrio el gate. */
export function estadoDelArbol(root = ".") {
  try {
    const commit = execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim();
    const sucio = execSync("git status --porcelain", { cwd: root, encoding: "utf8" }).trim().length > 0;
    return `${commit}${sucio ? "+sucio" : ""}`;
  } catch {
    return "sin-git";
  }
}

/**
 * Escribe una ejecucion. Devuelve true si se registro.
 *
 * NO lanza si la base no esta: el resultado de un gate no puede depender de que exista un sqlite
 * local. Avisa fuerte y sigue — quien manda sobre el exit code es el gate, no el ledger.
 */
export async function registrarEjecucion({ gate, alcance, ok, exitCode, ms, detalle, root = "." }) {
  const dbPath = resolve(root, DB_REL);
  if (!existsSync(dbPath)) {
    if (!avisadoSinBase) {
      avisadoSinBase = true;
      console.error(`  [ledger] AVISO: no existe ${DB_REL} (esta en .gitignore, normal en CI).`);
      console.error(`  [ledger] Ninguna ejecucion quedara registrada en la memoria viva. Para tenerla: npm run memory:bootstrap`);
    }
    return false;
  }
  let DatabaseSync;
  try {
    // `import()` y no `require`: esto es un modulo ESM. node:sqlite es built-in desde Node 22.
    ({ DatabaseSync } = await import("node:sqlite"));
  } catch {
    console.error("  [ledger] AVISO: node:sqlite no disponible (se requiere Node >= 22).");
    return false;
  }
  try {
    const db = new DatabaseSync(dbPath);
    db.prepare(
      `insert into ai_gate_runs (gate, phase_scope, status, summary, actor, decided_at, evidence_paths, run_at, origin)
       values (?, ?, ?, ?, ?, null, ?, ?, 'execution')`
    ).run(
      gate,
      alcance,
      ok ? "PASS" : "FAIL",
      `exit=${exitCode} · ${(ms / 1000).toFixed(1)}s · ${String(detalle ?? "").slice(0, 300)}`,
      `${userInfo().username}@${hostname()}`,
      `tree:${estadoDelArbol(root)}`,
      new Date().toISOString().replace("T", " ").slice(0, 19)
    );
    db.close();
    return true;
  } catch (error) {
    console.error(`  [ledger] AVISO: no se pudo registrar '${gate}': ${error.message}`);
    return false;
  }
}
