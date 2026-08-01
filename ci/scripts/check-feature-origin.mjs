#!/usr/bin/env node
/**
 * check-feature-origin.mjs (v12.144)
 *
 * Certifica que el frontmatter de cada feature se LEE de verdad, no solo que exista.
 *
 * POR QUE EXISTE. El parser de `_lib/feature-filter.mjs` perdia en silencio la ULTIMA clave
 * del frontmatter en ficheros CRLF: la captura dejaba el `\r` dentro del grupo, el
 * `split(/\r?\n/)` solo lo limpia en las lineas seguidas de `\n`, y la regex de clave/valor
 * termina en `(.+)$` -en JS `.` no matchea `\r`, ni `$` sin flag `m` matchea antes de el-. Como
 * estos ficheros tienen UNA sola clave, se perdia la unica que hay. Medido: 8 de 8 ficheros con
 * frontmatter en specs/ perdian su clave. `origin: reingenieria` estaba declarado en 7 features
 * y `getFeatureOrigin` devolvia "nuevo" para todas, asi que el roadmap les exigia los 4
 * artefactos de Fase 2 de los que la reingenieria esta EXENTA: 8 bloqueadores fantasma.
 *
 * El gate no fallaba. No miraba. Y ninguno de los 39 validadores de check:project podia notarlo,
 * porque todos consumen la MISMA libreria: si la libreria miente, todos coinciden en la mentira.
 *
 * DE AHI EL DISENO DE ESTE VALIDADOR. No pregunta a la libreria si el frontmatter esta bien.
 * Lee el fichero por su cuenta -con un lector deliberadamente distinto e insensible a CRLF- y
 * COMPARA su lectura con la de la libreria. Un oraculo independiente. Si divergen, la libreria
 * esta ciega y eso es el fallo, tenga el fichero lo que tenga.
 *
 * Comprueba, por cada feature incluida:
 *   1. spec-funcional.md existe y tiene bloque de frontmatter.
 *   2. NINGUNA linea no vacia del bloque se pierde al parsear (el fallo silencioso original).
 *   3. `origin` esta declarado explicitamente (no se acepta el default por omision: un default
 *      invisible es indistinguible de un parser roto, que es justo como paso desapercibido).
 *   4. El valor es uno de los reconocidos.
 *   5. La libreria coincide con la lectura directa. <- el oraculo
 *
 * Modos:
 *   --strict       exit 1 si hay hallazgos (default segun CHECK_STRICT).
 *   --warn         exit 0 (solo reporta).
 *   --feature X    valida solo una feature.
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures, getFeatureOrigin, parseFrontmatter } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v12.144";
const ORIGENES_REINGENIERIA = new Set([
  "reingenieria", "reingeniería", "brownfield", "existing-code", "existing_code",
]);
const ORIGENES_NUEVO = new Set(["nuevo", "new", "greenfield"]);

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const featureFilter = args.feature || null;

/**
 * Lector independiente, a proposito distinto del de la libreria.
 * Normaliza saltos de linea ANTES de nada y trocea a mano, sin `$` ni `.` -las dos piezas que
 * fallaron-. Su unico trabajo es no compartir el modo de fallo con el codigo que audita.
 */
function leerFrontmatterDirecto(texto) {
  const lineas = String(texto).split(/\r\n|\r|\n/);
  if (lineas.length === 0 || lineas[0].trim() !== "---") return null;
  const cuerpo = [];
  for (let i = 1; i < lineas.length; i += 1) {
    if (lineas[i].trim() === "---") return cuerpo;
    cuerpo.push(lineas[i]);
  }
  return null; // bloque abierto y nunca cerrado
}

function partirClaveValor(linea) {
  const idx = linea.indexOf(":");
  if (idx <= 0) return null;
  const clave = linea.slice(0, idx).trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(clave)) return null;
  let valor = linea.slice(idx + 1).trim();
  if (valor.length >= 2 && /^["']/.test(valor) && valor.slice(-1) === valor[0]) valor = valor.slice(1, -1);
  return { clave, valor };
}

const specsRoot = join(root, "specs");
const hallazgos = [];
const resumen = [];

// N/A legitimo: repo sin specs/ (por ejemplo el repo del framework).
if (!existsSync(specsRoot)) {
  console.log(`check-feature-origin (${VERSION})`);
  console.log("N/A: no hay directorio specs/ en este repo.");
  process.exit(0);
}

// ORACULO SOBRE EL PROPIO CENSO. `listIncludedFeatures` sale de la MISMA libreria que este gate
// audita, asi que no se puede usar como unica fuente de verdad sobre cuantas features hay: si esa
// funcion se queda ciega y devuelve una lista corta -o vacia-, el gate certificaria la nada en
// verde. Ese fallo es real, no teorico: la primera version de este validador pasaba con
// "Features analizadas: 0". Se cuentan los directorios en disco y se comparan.
const enDisco = readdirSync(specsRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^[0-9]{3}-/.test(e.name) && !e.name.startsWith("000-"))
  .map((e) => e.name)
  .sort();
const segunLibreria = listIncludedFeatures(root);
const ignorables = new Set(segunLibreria);
const noVistas = enDisco.filter((s) => !ignorables.has(s));

const features = segunLibreria.filter((s) => !featureFilter || s.startsWith(featureFilter));

if (featureFilter && features.length === 0) {
  console.error(`check-feature-origin (${VERSION})`);
  console.error(`\n--feature '${featureFilter}' no coincide con ninguna feature. En disco hay: ${enDisco.join(", ") || "(ninguna)"}`);
  process.exit(1);
}
if (!featureFilter && enDisco.length > 0 && segunLibreria.length === 0) {
  // Fallar aqui es correcto en los dos casos -no se esta validando nada-, pero la CAUSA es
  // distinta y el mensaje no puede inventarsela. Se comprueba con el lector directo si cada
  // exclusion esta declarada de verdad; acusar a la libreria de ciega cuando el repo pidio
  // ignorar sus features es la clase de mensaje que enseña a ignorar el gate.
  const declaranIgnore = enDisco.filter((slug) => {
    const p = join(specsRoot, slug, "spec-funcional.md");
    if (!existsSync(p)) return false;
    const cuerpo = leerFrontmatterDirecto(readFileSync(p, "utf8"));
    if (!cuerpo) return false;
    return cuerpo.some((l) => {
      const kv = partirClaveValor(l);
      return kv && kv.clave === "roadmap" && kv.valor.trim().toLowerCase() === "ignore";
    });
  });

  console.error(`check-feature-origin (${VERSION})`);
  if (declaranIgnore.length === enDisco.length) {
    console.error(`\nNADA QUE VALIDAR: las ${enDisco.length} feature(s) de specs/ declaran 'roadmap: ignore'.`);
    console.error(`La exclusion es explicita y legitima, pero el resultado es que ningun validador`);
    console.error(`de features esta comprobando nada. Si es intencional, quita este gate del pipeline;`);
    console.error(`si no, revisa que feature deberia estar incluida.`);
  } else {
    console.error(`\nCENSO VACIO: hay ${enDisco.length} directorio(s) de feature en specs/ y solo`);
    console.error(`${declaranIgnore.length} declara(n) 'roadmap: ignore', pero listIncludedFeatures() no`);
    console.error(`devolvio ninguna. La libreria que decide que features existen esta ciega; ningun`);
    console.error(`validador que dependa de ella esta comprobando nada.`);
  }
  console.error(`  en disco: ${enDisco.join(", ")}`);
  process.exit(1);
}

for (const slug of features) {
  const p = join(root, "specs", slug, "spec-funcional.md");
  if (!existsSync(p)) {
    hallazgos.push(`${slug}: no existe specs/${slug}/spec-funcional.md`);
    continue;
  }
  const texto = readFileSync(p, "utf8");
  const cuerpo = leerFrontmatterDirecto(texto);
  if (cuerpo === null) {
    hallazgos.push(`${slug}: spec-funcional.md no tiene bloque de frontmatter cerrado (--- ... ---)`);
    continue;
  }

  // (2) ninguna linea no vacia puede quedarse sin parsear
  const claves = new Map();
  for (const linea of cuerpo) {
    if (linea.trim() === "" || linea.trim().startsWith("#")) continue;
    const kv = partirClaveValor(linea);
    if (!kv) {
      hallazgos.push(`${slug}: linea de frontmatter no parseable, se perderia en silencio: ${JSON.stringify(linea)}`);
      continue;
    }
    claves.set(kv.clave, kv.valor);
  }

  // (3) origin explicito
  if (!claves.has("origin")) {
    hallazgos.push(
      `${slug}: no declara 'origin' en el frontmatter de spec-funcional.md. `
      + `Sin declaracion se asume 'nuevo' por defecto, y un default invisible no se distingue `
      + `de un parser roto. Declaralo: 'origin: reingenieria' o 'origin: nuevo'.`,
    );
    continue;
  }

  const declarado = String(claves.get("origin")).trim().toLowerCase();
  const esReingDirecto = ORIGENES_REINGENIERIA.has(declarado);

  // (4) valor reconocido
  if (!esReingDirecto && !ORIGENES_NUEVO.has(declarado)) {
    hallazgos.push(
      `${slug}: origin='${declarado}' no es un valor reconocido. `
      + `Reingenieria: ${[...ORIGENES_REINGENIERIA].join(" | ")}. Nuevo: ${[...ORIGENES_NUEVO].join(" | ")}. `
      + `Un valor desconocido cae al default 'nuevo' sin avisar.`,
    );
    continue;
  }

  // (5a) EL ORACULO, sobre TODAS las claves. No basta comparar el veredicto de `origin`: si la
  // libreria pierde una clave cuyo valor coincide por casualidad con el default, el veredicto
  // sale bien y el fallo queda invisible. Asi sobrevivio este bug en 008 (perdia 'origin: nuevo',
  // el default era 'nuevo', nadie lo noto). Se compara el CONJUNTO de claves leidas.
  const segunLibreriaFm = parseFrontmatter(texto) || {};
  const clavesLibreria = new Set(Object.keys(segunLibreriaFm));
  const perdidas = [...claves.keys()].filter((k) => !clavesLibreria.has(k));
  if (perdidas.length > 0) {
    hallazgos.push(
      `${slug}: el parser de _lib/feature-filter.mjs PIERDE ${perdidas.length} clave(s) del `
      + `frontmatter que si estan en el fichero: ${perdidas.join(", ")}. `
      + `Se pierden en silencio (no lanza, devuelve el objeto incompleto), asi que cualquier `
      + `decision basada en ellas es un default disfrazado de dato. Arregla el parser.`,
    );
    continue;
  }

  // (5b) y el veredicto de origin, que es la decision que de verdad usa el roadmap
  const esperado = esReingDirecto ? "reingenieria" : "nuevo";
  const segunLibreria = getFeatureOrigin(slug, join(root, "specs"));
  if (segunLibreria !== esperado) {
    hallazgos.push(
      `${slug}: DIVERGENCIA. El fichero declara origin='${declarado}' (=> ${esperado}) pero `
      + `getFeatureOrigin() devuelve '${segunLibreria}'. El parser de _lib/feature-filter.mjs `
      + `no esta leyendo lo que hay en disco; TODOS los validadores que dependen de el estan `
      + `decidiendo sobre datos falsos. Arregla el parser, no el fichero.`,
    );
    continue;
  }

  resumen.push({ slug, origin: esperado, claves: claves.size });
}

console.log(`check-feature-origin (${VERSION})`);
const reing = resumen.filter((r) => r.origin === "reingenieria").length;
const nuevos = resumen.filter((r) => r.origin === "nuevo").length;
console.log(`Features analizadas: ${features.length} · reingenieria: ${reing} · nuevo: ${nuevos}`);
if (noVistas.length > 0) {
  // Exclusion legitima (`roadmap: ignore`) o sintoma de censo incompleto. Se imprime SIEMPRE:
  // una feature que desaparece del analisis sin dejar rastro es indistinguible de una que nadie
  // valida. Que se vea, y que quien lea decida.
  console.log(`Excluidas del censo (${noVistas.length}): ${noVistas.join(", ")} — revisa que sea por 'roadmap: ignore' y no por un filtro roto.`);
}

if (hallazgos.length === 0) {
  console.log("OK. Cada feature declara su origin y la libreria lee exactamente lo que hay en disco.");
  process.exit(0);
}

console.error(`\nFRONTMATTER NO FIABLE: ${hallazgos.length} hallazgo(s).`);
for (const h of hallazgos) console.error(`  ✗ ${h}`);
console.error(`\nPor que importa: 'origin' decide si una feature esta exenta de los artefactos de`);
console.error(`Fase 2 (prototype.md, prototype-validation.md, product-design.md, spdd-frontend.md).`);
console.error(`Si se lee mal, el roadmap reclama trabajo que la metodologia no exige — o peor, deja`);
console.error(`de reclamar el que si exige.`);

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
