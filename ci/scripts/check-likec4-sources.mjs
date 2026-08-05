#!/usr/bin/env node
/**
 * check-likec4-sources.mjs
 *
 * Compara los tipos de fuente que el codigo REGISTRA de verdad contra los que el modelo de
 * arquitectura DIBUJA, en los dos sentidos.
 *
 * POR QUE
 * `check-likec4` valida que el modelo sea coherente CONSIGO MISMO, y dice de si mismo que no puede
 * saber si describe la arquitectura real: "para eso esta la revision humana". Bien — pero eso dejo
 * pasar una deriva que un script si puede ver.
 *
 * El modelo dibujaba cuatro fuentes (disco, FTP, SFTP, REST) y el arranque registra OCHO: faltaban
 * los cuatro almacenes de objetos (S3, GCS, Azure Blob, OCI). El diagrama, que la fase 3 llama
 * "fuente canonica", decia que el producto no lee de la nube. Lo encontro una persona mirando, no
 * un gate; y lo que encuentra una persona mirando vuelve en cuanto deje de mirar.
 *
 * QUE COMPRUEBA
 * Que el conjunto de literales `type()` de los `*SourceProvider` coincida EXACTAMENTE con el
 * conjunto de `container` de `fileSources` en el modelo. Falla en los dos sentidos:
 *
 *   - fuente en el codigo que el modelo no dibuja  -> el diagrama promete de menos (el caso de hoy)
 *   - contenedor en el modelo sin provider detras  -> el diagrama promete de mas (fuente borrada)
 *
 * Un provider sin literal `type()` no aporta tipo y no se exige: `RemoteSourceProvider` es el
 * mecanismo de plugin fuera de proceso de ADR-013, no un tipo que el usuario elija en la UI.
 *
 * NORMALIZACION
 * Los dos lados nombran lo mismo con convenciones distintas: el codigo usa la constante que viaja
 * en la BD (`OCI_OBJECT_STORAGE`) y el modelo usa un identificador (`ociObjectStorage`). Se
 * comparan en minusculas, sin guiones bajos y sin el sufijo `source` — que es lo que distingue
 * `restSource` (el nodo) de `REST` (el tipo), no dos cosas diferentes.
 *
 * Uso: node ci/scripts/check-likec4-sources.mjs [--root <path>]
 */

process.removeAllListeners("warning");

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");

const DIR_PROVIDERS = join(root, "platform-app/src/main/java/com/integrationhub/platform/provider/source");
const MODELO = join(root, "likec4/integration-hub.likec4");

if (!existsSync(DIR_PROVIDERS) || !existsSync(MODELO)) {
  console.log("check-likec4-sources: N/A (falta el modelo likec4 o el paquete de providers).");
  process.exit(0);
}

/** Misma cosa escrita en dos convenciones: `OCI_OBJECT_STORAGE` y `ociObjectStorage`. */
const normalizar = (s) => s.toLowerCase().replace(/_/g, "").replace(/source$/, "");

/**
 * Tipos que registra el codigo: lo que devuelve `type()`.
 *
 * No todos lo escriben igual, y la diferencia importa. Unos devuelven el literal (`return "S3"`) y
 * otros una constante de la clase (`return TYPE`), que se resuelve aqui: son el mismo dato con
 * distinto estilo. Pero `RemoteSourceProvider` devuelve un CAMPO DE INSTANCIA (`return type`), y eso
 * no es estilo: su tipo se lo da el plugin en tiempo de ejecucion, asi que no tiene ninguno que
 * dibujar. Por eso se resuelven las constantes y no los campos, en vez de aceptar cualquier
 * identificador.
 */
function tiposDelCodigo() {
  const out = new Map();
  const sinTipo = [];
  for (const f of readdirSync(DIR_PROVIDERS).filter((f) => f.endsWith("SourceProvider.java"))) {
    const texto = readFileSync(join(DIR_PROVIDERS, f), "utf8");
    const m = texto.match(/String\s+type\(\)\s*\{\s*return\s*(?:"([^"]+)"|(\w+))\s*;/);
    if (!m) { sinTipo.push(`${f} (no se pudo leer type())`); continue; }

    let tipo = m[1];
    if (tipo === undefined) {
      const c = texto.match(new RegExp(`static\\s+final\\s+String\\s+${m[2]}\\s*=\\s*"([^"]+)"`));
      if (!c) { sinTipo.push(`${f} (type() dinamico: return ${m[2]})`); continue; }
      tipo = c[1];
    }
    out.set(normalizar(tipo), { tipo, clase: f });
  }
  return { out, sinTipo };
}

/** Contenedores que dibuja el modelo dentro del bloque `fileSources`. */
function contenedoresDelModelo() {
  const texto = readFileSync(MODELO, "utf8");
  const i = texto.indexOf("fileSources = system");
  if (i === -1) {
    console.error("check-likec4-sources: no se encuentra `fileSources = system` en el modelo.");
    process.exit(1);
  }
  // El bloque va desde su `{` hasta la llave que lo cierra, contando anidamiento.
  let j = texto.indexOf("{", i);
  let nivel = 0, fin = j;
  for (; fin < texto.length; fin++) {
    if (texto[fin] === "{") nivel++;
    else if (texto[fin] === "}" && --nivel === 0) break;
  }
  const bloque = texto.slice(j, fin);
  const out = new Map();
  for (const m of bloque.matchAll(/^\s*container\s+(\w+)/gm)) {
    out.set(normalizar(m[1]), m[1]);
  }
  return out;
}

const { out: codigo, sinTipo } = tiposDelCodigo();
const modelo = contenedoresDelModelo();

const noDibujados = [...codigo.keys()].filter((k) => !modelo.has(k));
const fantasmas = [...modelo.keys()].filter((k) => !codigo.has(k));

console.log("check-likec4-sources");
console.log(`  tipos de fuente registrados por el codigo : ${codigo.size}`);
console.log(`  contenedores dibujados en el modelo       : ${modelo.size}`);
if (sinTipo.length) {
  console.log(`  providers sin literal type() (no exigidos): ${sinTipo.join(", ")}`);
}

let fallo = false;

if (noDibujados.length) {
  fallo = true;
  console.error(`\n  ✗ El codigo lee de fuentes que el modelo NO dibuja (${noDibujados.length}):`);
  for (const k of noDibujados) console.error(`    ${codigo.get(k).tipo}  <-  ${codigo.get(k).clase}`);
  console.error("    El diagrama promete menos de lo que el producto hace.");
  console.error("    Anade un `container` en `fileSources` de likec4/integration-hub.likec4.");
}

if (fantasmas.length) {
  fallo = true;
  console.error(`\n  ✗ El modelo dibuja fuentes que NINGUN provider implementa (${fantasmas.length}):`);
  for (const k of fantasmas) console.error(`    container ${modelo.get(k)}`);
  console.error("    El diagrama promete mas de lo que el producto hace, que es peor:");
  console.error("    alguien puede planificar un entorno contando con una fuente que no existe.");
}

if (fallo) {
  console.error("\n  Reproduce con: npm run check:likec4-sources");
  process.exit(1);
}

console.log("\nOK. Las fuentes del modelo son exactamente las que el codigo registra.");
process.exit(0);
