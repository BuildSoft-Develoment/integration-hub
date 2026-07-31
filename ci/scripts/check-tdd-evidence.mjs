#!/usr/bin/env node
/**
 * check-tdd-evidence.mjs (v12.120)
 *
 * Verifica que cada feature tenga `tdd-evidence.md` y que cada T tipo=impl en
 * `spec-tareas.md` con estado != pending tenga un bloque correspondiente con
 * RED + GREEN reales (no `pending`).
 *
 * Reglas:
 *   - Existe specs/<slug>/tdd-evidence.md.
 *   - Para cada T tipo=impl en spec-tareas.md:
 *     - Si estado=pending: el bloque puede estar "pending" (es el scaffold).
 *     - Si estado=in_progress: RED + GREEN command deben estar (logs pueden ser pending).
 *     - Si estado=done: RED + GREEN result + log deben ser reales (no pending). Verified timestamp obligatorio.
 *     - Si estado=blocked: bloque debe explicar por que esta bloqueado.
 *
 * Default STRICT (en check:project).
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const COL_NAMES = ["id", "rf", "tipo", "archivo", "test", "comando_red", "expected_red", "comando_green", "expected_green", "depende_de", "paralelizable", "estado"];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true);
const featureFilter = args.feature ? String(args.feature).trim() : null;

const specsDir = join(root, "specs");
const blockers = [];
const warnings = [];
let evaluated = 0;

if (existsSync(specsDir)) {
  const entries = readdirSync(specsDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!/^\d{3,}-[a-z0-9-]+/i.test(e.name)) continue;
    if (e.name.startsWith("000-")) continue;
    if (featureFilter && e.name !== featureFilter) continue;
    const featureDir = join(specsDir, e.name);
    if (!existsSync(join(featureDir, "spec-funcional.md"))) continue;
    evaluated += 1;
    const evidencePath = join(featureDir, "tdd-evidence.md");
    if (!existsSync(evidencePath)) {
      blockers.push(`specs/${e.name}/tdd-evidence.md:1: archivo faltante (v12.120+). Genera con scaffold:feature o copia plantillas/fase-4-sdd/tdd-evidence.md.`);
      continue;
    }
    const evidence = readFileSync(evidencePath, "utf8");
    const tareasPath = join(featureDir, "spec-tareas.md");
    if (!existsSync(tareasPath)) continue;
    const tareas = readFileSync(tareasPath, "utf8");

    // Localiza la tabla y extrae filas tipo=impl.
    const headRe = /^##\s+Tabla ejecutable de tareas\b[^\n]*\n/im;
    const headMatch = tareas.match(headRe);
    if (!headMatch) continue;
    const rest = tareas.slice(headMatch.index + headMatch[0].length);
    const nextSect = rest.match(/^##\s/m);
    const tableText = nextSect ? rest.slice(0, nextSect.index) : rest;
    const tableLines = tableText.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
    if (tableLines.length < 3) continue;

    // Mismo motivo que en check-tasks-executable: la seccion puede traer varias sub-tablas (una por
    // sprint) y sus cabeceras no son filas de datos.
    const isSeparator = (l) => /^\|[\s:|-]+\|?$/.test(l.trim());
    const isHeader = (l) => /^\|\s*id\s*\|/i.test(l.trim());
    for (let i = 2; i < tableLines.length; i += 1) {
      if (isSeparator(tableLines[i]) || isHeader(tableLines[i])) continue;
      const cells = tableLines[i].split("|").slice(1, -1).map((s) => s.trim());
      if (cells.length !== COL_NAMES.length) continue;
      const row = Object.fromEntries(COL_NAMES.map((c, idx) => [c, cells[idx]]));
      if (row.tipo !== "impl") continue;
      // Busca bloque en tdd-evidence.md.
      //
      // SIN la bandera `m`, a proposito. La version anterior la llevaba, y con `m` el `$` de la
      // mirada anticipada `(?=\n##\s|$)` casa al final de CADA linea, no del documento: el `+?`
      // perezoso paraba en el primer salto y el cuerpo capturado era UN caracter (`"\r"` en ficheros
      // CRLF, que son todos los de este repositorio). Es decir, la extraccion de campos de este gate
      // no habia funcionado NUNCA; los `- Comando RED:` reales del corpus jamas se leyeron.
      //
      // No se noto porque las unicas filas que consultan esos campos -las que no estan en `pending`-
      // eran invisibles: su columna `tipo` decia "impl backend" y el gate solo reconoce "impl". Dos
      // fallos que se tapaban mutuamente y dejaban el carril en verde.
      //
      // El inicio de linea se ancla con `(?:^|\n)` en vez de con `^` + `m`.
      const blockRe = new RegExp(`(?:^|\\n)##[ \\t]+${escapeRe(row.rf)}[ \\t]*\\/[ \\t]*${escapeRe(row.id)}\\b[^\\n]*\\n([\\s\\S]+?)(?=\\n##[ \\t]|$)`);
      const blockMatch = evidence.match(blockRe);
      if (!blockMatch) {
        blockers.push(`specs/${e.name}/tdd-evidence.md:1: falta bloque "## ${row.rf} / ${row.id}" para T tipo=impl.`);
        continue;
      }
      const body = blockMatch[1];
      const rel = `specs/${e.name}/tdd-evidence.md`;
      // Las claves se aceptan en ingles (como las escribe plantillas/fase-4-sdd/tdd-evidence.md) y en
      // castellano (como las escribe este repositorio).
      //
      // Medido: de las 7 tdd-evidence.md existentes, CERO usan las claves inglesas y las 7 usan las
      // castellanas. El gate solo conocia las de la plantilla, asi que ningun bloque real satisfacia
      // jamas estos campos. No se habia notado porque las filas que los exigen -las que no estan en
      // `pending`- eran invisibles: su columna `tipo` decia "impl backend" y el gate solo mira "impl".
      // Al normalizar el vocabulario de tipos aparecieron 30 bloqueantes de golpe, todos por el
      // idioma de la clave. Exigir que un proyecto documentado en castellano reescriba su corpus a
      // las etiquetas del andamiaje seria poner el molde por encima de lo moldeado.
      const ALIAS = {
        "RED command": ["Comando RED"],
        "GREEN command": ["Comando GREEN"],
        "RED result": ["Resultado RED"],
        "GREEN result": ["Resultado GREEN"],
        "Verified": ["Verificado", "Verificacion"],
      };
      // La clave admite un CALIFICADOR antes de los dos puntos, y si aparece varias veces se juntan
      // todas.
      //
      // El corpus real escribe `- Comando GREEN backend:`, `- Comando GREEN frontend:`,
      // `- Comando GREEN consumer:`, `- Comando GREEN broker SPI:`... porque esas tareas se
      // verifican con VARIOS comandos. La documentacion es mas rica que el esquema de un solo campo,
      // y obligar a colapsarla a un unico `Comando GREEN:` perderia evidencia: una tarea verificada
      // por tres corridas esta mejor sostenida, no peor.
      const get = (key) => {
        for (const k of [key, ...(ALIAS[key] || [])]) {
          const re = new RegExp(`^- ${escapeRe(k)}[^:\\n]*:[ \\t]*(.+)$`, "gim");
          const found = [...body.matchAll(re)].map((m) => m[1].trim()).filter(Boolean);
          if (found.length) return found.join(" | ");
        }
        return null;
      };
      // Pending state: bloque puede ser todo "pending" — solo verifica que existe.
      if (row.estado === "pending") continue;
      // Estado in_progress: RED + GREEN command obligatorios.
      const fields = {
        "RED command": get("RED command"),
        "GREEN command": get("GREEN command"),
        "RED result": get("RED result"),
        "GREEN result": get("GREEN result"),
        "Verified": get("Verified"),
      };
      if (row.estado === "in_progress") {
        if (!fields["RED command"] || /pending|TBD/i.test(fields["RED command"])) blockers.push(`${rel}: ${row.id} en estado=in_progress requiere RED command real (no pending)`);
        if (!fields["GREEN command"] || /pending|TBD/i.test(fields["GREEN command"])) blockers.push(`${rel}: ${row.id} en estado=in_progress requiere GREEN command real (no pending)`);
        continue;
      }
      if (row.estado === "done") {
        for (const [k, v] of Object.entries(fields)) {
          if (!v || /pending|TBD|FIXME/i.test(v)) {
            blockers.push(`${rel}: ${row.id} en estado=done requiere ${k} real (no pending). Sin evidencia TDD, esta task no puede estar done.`);
          }
        }
        // RED result debe contener evidencia de fallo + GREEN debe contener pass.
        if (fields["RED result"] && !/fail|red|esperado|expected/i.test(fields["RED result"])) {
          warnings.push(`${rel}: ${row.id} RED result no parece reflejar un fallo (esperado: "failed as expected" o similar)`);
        }
        if (fields["GREEN result"] && !/pass|ok|green/i.test(fields["GREEN result"])) {
          warnings.push(`${rel}: ${row.id} GREEN result no parece reflejar un pass`);
        }
      }
      if (row.estado === "blocked") {
        if (!/bloqueo|blocked|porque|reason/i.test(body)) {
          warnings.push(`${rel}: ${row.id} en estado=blocked debe explicar la razon en el bloque`);
        }
      }
    }
  }
}

console.log(`check-tdd-evidence (v12.120) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Features evaluadas: ${evaluated}`);

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`OK. tdd-evidence.md consistente con spec-tareas.md en todas las features.`);
  process.exit(0);
}

if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ ${b}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ ${w}`);
}
console.error(`\nFix sugerido: ver ai/protocols/tdd.md.`);
process.exit(strict && blockers.length > 0 ? 1 : 0);

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

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
