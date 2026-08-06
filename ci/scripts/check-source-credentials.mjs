#!/usr/bin/env node
/**
 * check-source-credentials.mjs
 *
 * Exige que todo tipo de fuente diga QUE campos suyos son credenciales (ADR-025 / QA-006).
 *
 * POR QUE
 * El bloqueo de credenciales en texto plano usaba una lista central, y esa lista se quedo atras: no
 * incluia GCS ni AZURE_BLOB. Como el lookup terminaba en "no esta en la lista" -> "no hay nada que
 * proteger", la clave privada de una service account de Google se guardaba literal en la base de
 * datos mientras un password de SFTP si se rechazaba. El control existia y miraba a otro lado.
 *
 * ADR-025 movio ese conocimiento al provider (`SourceProvider.credentialKeys()`), que es quien no
 * puede olvidarse de si mismo. Pero el metodo tiene un DEFAULT, y un default silencioso reproduce el
 * mismo fallo: un provider nuevo que no lo sobrescriba ni declare campos `secret` en su schema
 * hereda "no tengo credenciales" sin que nadie lo decida. Este gate obliga a decidirlo.
 *
 * QUE COMPRUEBA
 * Que cada `*SourceProvider` este en uno de estos tres casos, y NINGUNO por omision:
 *   1. sobrescribe `credentialKeys()`  -> lo declara explicitamente (incluida la lista vacia, que es
 *      una afirmacion valida: FILESYSTEM lee de disco y no tiene credenciales);
 *   2. declara campos `PluginConfigField.secret(...)` en su `configSchema()` -> el default los deriva;
 *   3. esta en SIN_DECLARAR_ESPERADO de abajo, con su motivo escrito.
 *
 * NO comprueba que las claves declaradas sean las correctas -eso lo sabe quien escribio el provider-.
 * Comprueba que alguien lo haya pensado.
 *
 * Uso: node ci/scripts/check-source-credentials.mjs [--root <path>]
 */

process.removeAllListeners("warning");

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { collectProviders } from "./_lib/java-provider-types.mjs";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");

/**
 * Providers que legitimamente no declaran nada de forma estatica.
 *
 * Uno solo: `RemoteSourceProvider` no tiene campos propios — su schema, y con el sus campos
 * `secret`, se los da el plugin fuera de proceso en tiempo de ejecucion (ADR-014). El default de
 * `credentialKeys()` los deriva de ese schema, asi que queda cubierto; lo que no se puede es
 * verificarlo leyendo el fichero.
 */
const SIN_DECLARAR_ESPERADO = new Map([
  ["RemoteSourceProvider", "su schema (y sus campos secret) los aporta el plugin en runtime (ADR-014)"],
]);

const { tipos, sinTipo } = collectProviders(root, "SourceProvider", ["sourceType", "type"]);

// Un fichero puede aportar varios tipos; interesa el fichero, no el tipo.
const ficheros = new Map();
for (const p of [...tipos, ...sinTipo]) {
  if (p.ruta) ficheros.set(p.ruta, p);
}

if (ficheros.size === 0) {
  console.log("check-source-credentials: N/A (no se encontro ningun SourceProvider).");
  process.exit(0);
}

const declarados = [];
const derivados = [];
const exentos = [];
const huerfanos = [];

for (const [ruta, p] of ficheros) {
  const texto = readFileSync(ruta, "utf8");
  if (/\bcredentialKeys\s*\(\s*\)/.test(texto)) {
    declarados.push(p);
  } else if (/PluginConfigField\s*\.\s*secret\s*\(/.test(texto)) {
    derivados.push(p);
  } else if (SIN_DECLARAR_ESPERADO.has(p.clase)) {
    exentos.push(p);
  } else {
    huerfanos.push(p);
  }
}

console.log("check-source-credentials");
console.log(`  providers de fuente                       : ${ficheros.size}`);
console.log(`  declaran credentialKeys()                 : ${declarados.length}`);
console.log(`  las derivan de campos secret del schema   : ${derivados.length}`);
for (const p of exentos) {
  console.log(`  exento: ${p.clase} (${p.modulo}) — ${SIN_DECLARAR_ESPERADO.get(p.clase)}`);
}

if (huerfanos.length) {
  console.error(`\n  ✗ Providers que NO dicen si tienen credenciales (${huerfanos.length}):`);
  for (const p of huerfanos) console.error(`    ${p.clase} (${p.modulo})`);
  console.error("    Heredan el default en silencio, que significa 'no tengo ninguna credencial'.");
  console.error("    Asi se colaron GCS y AZURE_BLOB: nadie lo decidio, se dio por supuesto.");
  console.error("    Sobrescribe `credentialKeys()` -List.of() vale si de verdad no tiene ninguna-,");
  console.error("    o declara los campos como `PluginConfigField.secret(...)` en su configSchema().");
  console.error("\n  Reproduce con: npm run check:source-credentials");
  process.exit(1);
}

console.log("\nOK. Todo tipo de fuente declara si tiene credenciales, y cuales.");
process.exit(0);
