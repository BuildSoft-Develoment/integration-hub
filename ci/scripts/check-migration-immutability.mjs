#!/usr/bin/env node
/**
 * check-migration-immutability.mjs (v12.146)
 *
 * Detecta en CI que alguien EDITO una migracion ya publicada, antes de que lo descubra un pod en
 * produccion a las tres de la manana.
 *
 * POR QUE EXISTE. La guarda ya existia, pero en el sitio equivocado: `validateOnMigrate` tiene
 * `@WithDefault("true")` en quarkus-flyway 3.37.2 y `Flyway.migrate()` llama a `DbValidate.validate()`,
 * asi que un checksum alterado SI revienta el arranque. El problema es CUANDO: con
 * `migrate-at-start=true` y `replicaCount: 2` (values.yaml), eso ocurre durante el rollout, en el
 * unico momento en que no se quiere descubrirlo.
 *
 * Y el carril de CI que toca migraciones no puede verlo: `.github/workflows/ci-compat-db.yml` corre
 * sobre bases LIMPIAS, y sobre una base vacia `validateOnMigrate` siempre pasa porque no hay fila
 * previa contra la que comparar. Se dispara justo con los cambios en los directorios de migracion,
 * y sale en verde sobre commits que dejan la produccion inarrancable.
 *
 * NO ES HIPOTETICO. Al escribir este gate habia 6 migraciones ya aplicadas en el entorno de
 * integracion con contenido distinto al del repo. Cinco las rompio un commit de trazabilidad que solo
 * cambiaba UNA LINEA DE COMENTARIO en cada una (`-- @trace spec 003` -> `-- @trace spec
 * 003-diseno-y-ejecucion-procesos`). Semanticamente inocuo, letal para el arranque: cada linea entra
 * al CRC32.
 *
 * COMO FUNCIONA. `ci/migrations.lock` guarda el checksum de Flyway de cada migracion publicada. Este
 * gate lo recalcula y compara:
 *   - migracion nueva  -> hay que anadirla al lock (`--update`)
 *   - migracion editada -> FALLA. Es el caso que rompe instalaciones existentes.
 *   - migracion borrada -> FALLA. Flyway la reclama en toda instalacion que la aplico.
 *
 * El lock es regenerable a proposito: no pretende impedir el cambio, sino hacerlo VISIBLE en el diff
 * y en la revision. Hoy el cambio es invisible.
 *
 * Modos: --strict (exit 1, default segun CHECK_STRICT) · --warn · --update (regenera el lock) · --root
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { flywayChecksum } from "./_lib/flyway-checksum.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v12.146";
const DIRECTORIOS = [
  "platform-app/src/main/resources/db/migration",
  "vertical-swift-mt101/src/main/resources/db/migration-mt101",
];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const lockPath = join(root, "ci", "migrations.lock");

const actuales = new Map();
for (const dir of DIRECTORIOS) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const nombre of readdirSync(abs).filter((f) => f.endsWith(".sql")).sort()) {
    const rel = relative(root, join(abs, nombre)).split("\\").join("/");
    actuales.set(rel, flywayChecksum(readFileSync(join(abs, nombre))));
  }
}

console.log(`check-migration-immutability (${VERSION})`);

if (args.update) {
  const cuerpo = [
    "# Checksums de Flyway (CRC32, int32 con signo) de cada migracion PUBLICADA.",
    "# Generado por: npm run check:migration-immutability -- --update",
    "#",
    "# Editar una migracion ya aplicada rompe el arranque de toda instalacion que la aplico:",
    "# validateOnMigrate=true compara este checksum contra flyway_schema_history. Si una linea de este",
    "# fichero cambia sin que la migracion sea nueva, el diff lo esta gritando: pregunta por que.",
    "#",
    "# El checksum ignora CRLF vs LF (verificado sobre las 104 migraciones), asi que este fichero es",
    "# identico en Windows y en el CI de Linux.",
    "",
    ...[...actuales.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([r, c]) => `${c}  ${r}`),
    "",
  ].join("\n");
  writeFileSync(lockPath, cuerpo, "utf8");
  console.log(`Lock regenerado con ${actuales.size} migracion(es): ci/migrations.lock`);
  process.exit(0);
}

if (!existsSync(lockPath)) {
  console.error(`\nNo existe ci/migrations.lock. Generalo con:`);
  console.error(`  npm run check:migration-immutability -- --update`);
  process.exit(strict ? 1 : 0);
}

const bloqueadas = new Map();
for (const linea of readFileSync(lockPath, "utf8").split(/\r?\n/)) {
  const t = linea.trim();
  if (!t || t.startsWith("#")) continue;
  const m = t.match(/^(-?\d+)\s+(.+)$/);
  if (m) bloqueadas.set(m[2].trim(), Number(m[1]));
}

const editadas = [];
const borradas = [];
const nuevas = [];

for (const [rel, checksum] of actuales) {
  if (!bloqueadas.has(rel)) { nuevas.push(rel); continue; }
  if (bloqueadas.get(rel) !== checksum) editadas.push({ rel, antes: bloqueadas.get(rel), ahora: checksum });
}
for (const rel of bloqueadas.keys()) {
  if (!actuales.has(rel)) borradas.push(rel);
}

console.log(`Migraciones: ${actuales.size} en disco · ${bloqueadas.size} en el lock · ${nuevas.length} nueva(s)`);

if (editadas.length === 0 && borradas.length === 0 && nuevas.length === 0) {
  console.log("OK. Ninguna migracion publicada ha cambiado de checksum.");
  process.exit(0);
}

if (nuevas.length > 0 && editadas.length === 0 && borradas.length === 0) {
  console.log(`\nHay ${nuevas.length} migracion(es) nueva(s) sin registrar:`);
  for (const r of nuevas) console.log(`  + ${r}`);
  console.log(`\nAnadelas al lock (es lo normal al crear una migracion):`);
  console.log(`  npm run check:migration-immutability -- --update`);
  process.exit(strict ? 1 : 0);
}

console.error(`\nMIGRACION PUBLICADA MODIFICADA: ${editadas.length} editada(s), ${borradas.length} borrada(s).`);
for (const e of editadas) {
  console.error(`  ✗ EDITADA  ${e.rel}`);
  console.error(`             checksum ${e.antes} -> ${e.ahora}`);
}
for (const r of borradas) console.error(`  ✗ BORRADA  ${r}`);
if (nuevas.length > 0) for (const r of nuevas) console.error(`  + nueva    ${r}`);

console.error(`\nQUE SIGNIFICA. Toda instalacion que YA aplico esa migracion tiene el checksum viejo en`);
console.error(`flyway_schema_history. Al arrancar, validateOnMigrate compara y aborta: el pod no levanta.`);
console.error(`Con replicaCount: 2 y migrate-at-start=true, eso pasa en mitad del rollout.`);
console.error(`\nQUE HACER, por orden de preferencia:`);
console.error(`  1. Revertir el cambio y poner lo que querias en una migracion NUEVA. Es lo correcto`);
console.error(`     casi siempre, y SIEMPRE si el cambio era un comentario: ningun comentario vale`);
console.error(`     romper el arranque de una instalacion.`);
console.error(`  2. Si el cambio es imprescindible para instalaciones NUEVAS (p.ej. la migracion fallaba`);
console.error(`     de origen), entonces requiere 'flyway repair' coordinado en cada entorno que ya la`);
console.error(`     aplico, documentado en el runbook, ANTES de desplegar. Es una decision de operacion,`);
console.error(`     no un detalle de implementacion: dejalo escrito y actualiza el lock con --update.`);

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
