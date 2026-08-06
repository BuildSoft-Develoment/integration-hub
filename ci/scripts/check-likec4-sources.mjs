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
 * El modelo dibujaba cuatro fuentes (disco, FTP, SFTP, REST) y el codigo registra OCHO: faltaban los
 * cuatro almacenes de objetos (S3, GCS, Azure Blob, OCI). El diagrama, que la fase 3 llama "fuente
 * canonica", decia que el producto no lee de la nube. Lo encontro una persona mirando, no un gate; y
 * lo que encuentra una persona mirando vuelve en cuanto deje de mirar.
 *
 * DE DONDE SALE EL LADO DEL CODIGO
 * De `_lib/java-provider-types.mjs`, el MISMO extractor que genera el catalogo canonico
 * (`docs/transversal/90.17-catalogo-de-tipos.md`). La primera version de este gate reimplemento esa
 * lectura escaneando un unico directorio plano, y daba verde con un provider en un subpaquete o en un
 * vertical: el mismo verde falso que venia a cerrar. Una sola implementacion, o dos puntos ciegos.
 *
 * QUE COMPRUEBA
 *   1. Que el conjunto de tipos del codigo coincida EXACTAMENTE con los `container` de `fileSources`.
 *      Falla en los dos sentidos: fuente sin dibujar (el diagrama promete de menos) y contenedor sin
 *      provider detras (promete de mas, que es peor: alguien planifica contando con algo que no hay).
 *   2. Que todo `*SourceProvider` cuyo tipo NO se pueda leer este en la lista de excepciones de abajo.
 *      FAIL-CLOSED a proposito: si el extractor no entiende un `type()`, ese provider desaparece del
 *      contrato en silencio y el gate quedaria verde con una fuente sin dibujar. Un hueco tiene que
 *      doler, no informar.
 *   3. Que ningun par de nombres colapse al normalizar. `Map.set` pisaria uno de los dos y el recuento
 *      mentiria sin imprimir nada.
 *   4. Que cada contenedor tenga una relacion que lo lea. Una fuente dibujada que nadie lee es un nodo
 *      decorativo, y el gate anterior la daba por buena.
 *
 * ALCANCE DECLARADO (lo que NO hace, para que nadie lo suponga)
 *   - No valida el TITULO de los contenedores. El estado de cada fuente (homologada en nativo o no)
 *     vive en `ops/fase-7-deploy/dist/NATIVE-STATUS.md` y NO se copia al diagrama: una etiqueta de
 *     estado escrita a mano caduca -ya paso: se copio "nativo pendiente" de una fila de trazabilidad
 *     de 2026-06-05 cuando el smoke nativo de S3 y Azure Blob habia pasado el 2026-07-13-.
 *   - `fileSources` contiene SOLO contenedores hoja, uno por tipo de fuente. Si algun dia se agrupan,
 *     este gate hay que cambiarlo: cuenta todo `container` del bloque.
 *
 * Uso: node ci/scripts/check-likec4-sources.mjs [--root <path>]
 */

process.removeAllListeners("warning");

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { collectProviders, DINAMICO } from "./_lib/java-provider-types.mjs";

const args = process.argv.slice(2);
const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : ".");
const MODELO = join(root, "likec4/integration-hub.likec4");

/**
 * Providers cuyo tipo NO se puede leer del codigo y que aun asi son legitimos.
 *
 * Uno solo, y con motivo: `RemoteSourceProvider` devuelve un CAMPO DE INSTANCIA (`return type;`), no
 * una constante. Su tipo se lo da el plugin fuera de proceso en tiempo de ejecucion (ADR-014), asi
 * que no hay ningun tipo fijo que dibujar. Cualquier otro que aparezca aqui es un hueco real.
 */
const SIN_TIPO_ESPERADO = new Map([
  ["RemoteSourceProvider", "tipo dinamico: lo aporta el plugin remoto en runtime (ADR-014)"],
]);

if (!existsSync(MODELO)) {
  console.log("check-likec4-sources: N/A (no existe likec4/integration-hub.likec4).");
  process.exit(0);
}

/**
 * Quita comentarios del modelo antes de parsearlo.
 *
 * Sin esto un `container` comentado seguia contando -que es justo como se esconde un nodo del
 * diagrama sin borrarlo- y una llave dentro de un comentario descuadraba el bloque. Las lineas 109-119
 * del modelo son once lineas seguidas de comentario, asi que no es un caso hipotetico.
 * Los titulos van entre comillas simples: un `//` dentro de un titulo no es un comentario.
 */
function sinComentarios(texto) {
  const sinBloque = texto.replace(/\/\*[\s\S]*?\*\//g, "");
  return sinBloque
    .split(/\r?\n/)
    .map((l) => {
      let comillas = 0;
      for (let i = 0; i < l.length - 1; i++) {
        if (l[i] === "'") comillas++;
        else if (l[i] === "/" && l[i + 1] === "/" && comillas % 2 === 0) return l.slice(0, i);
      }
      return l;
    })
    .join("\n");
}

/** Contenedores del bloque `fileSources`, y las relaciones que apuntan a ellos. */
function modelo() {
  const texto = sinComentarios(readFileSync(MODELO, "utf8"));
  const i = texto.indexOf("fileSources = system");
  if (i === -1) {
    console.error("check-likec4-sources: no se encuentra `fileSources = system` en el modelo.");
    process.exit(1);
  }
  let fin = texto.indexOf("{", i);
  for (let nivel = 0; fin < texto.length; fin++) {
    if (texto[fin] === "{") nivel++;
    else if (texto[fin] === "}" && --nivel === 0) break;
  }
  const bloque = texto.slice(texto.indexOf("{", i), fin);

  const contenedores = [...bloque.matchAll(/^\s*container\s+(\w+)/gm)].map((m) => m[1]);
  // Las relaciones viven fuera del bloque, en la seccion de relaciones del modelo.
  const leidos = new Set([...texto.matchAll(/->\s*fileSources\.(\w+)/g)].map((m) => m[1]));
  return { contenedores, leidos };
}

/**
 * Misma cosa escrita en dos convenciones: el codigo usa la constante que viaja en la BD
 * (`OCI_OBJECT_STORAGE`) y el modelo un identificador (`ociObjectStorage`).
 *
 * El sufijo `source` se quita SOLO en el lado del modelo, que es donde existe el desajuste real
 * (`restSource` el nodo vs `REST` el tipo). Quitarlo tambien del lado del codigo colapsaria tipos de
 * BD legitimos que terminaran en SOURCE contra otros distintos, sin ganar nada.
 */
const claveCodigo = (s) => s.toLowerCase().replace(/_/g, "");
const claveModelo = (s) => s.toLowerCase().replace(/_/g, "").replace(/source$/, "");

/** Indexa detectando colisiones en vez de dejar que `Map.set` pise una de las dos entradas. */
function indexar(pares, lado, colisiones) {
  const out = new Map();
  for (const { clave, valor } of pares) {
    const previo = out.get(clave);
    if (previo !== undefined && previo !== valor) {
      colisiones.push(`${lado}: '${previo}' y '${valor}' colapsan en la misma clave '${clave}'`);
      continue;
    }
    out.set(clave, valor);
  }
  return out;
}

const { tipos, sinTipo } = collectProviders(root, "SourceProvider", ["sourceType", "type"]);
const { contenedores, leidos } = modelo();

const colisiones = [];
const codigo = indexar(
  tipos.filter((t) => t.tipo !== DINAMICO).map((t) => ({ clave: claveCodigo(t.tipo), valor: t.tipo })),
  "codigo",
  colisiones,
);
const detalle = new Map(tipos.map((t) => [claveCodigo(t.tipo), t]));
const dibujados = indexar(
  contenedores.map((c) => ({ clave: claveModelo(c), valor: c })),
  "modelo",
  colisiones,
);

const noDibujados = [...codigo.keys()].filter((k) => !dibujados.has(k));
const fantasmas = [...dibujados.keys()].filter((k) => !codigo.has(k));
const inesperados = sinTipo.filter((s) => !SIN_TIPO_ESPERADO.has(s.clase));
const huerfanos = contenedores.filter((c) => !leidos.has(c));

console.log("check-likec4-sources");
console.log(`  tipos de fuente registrados por el codigo : ${codigo.size}`);
console.log(`  contenedores dibujados en el modelo       : ${dibujados.size}`);
for (const s of sinTipo) {
  const motivo = SIN_TIPO_ESPERADO.get(s.clase);
  if (motivo) console.log(`  exento: ${s.clase} (${s.modulo}) — ${motivo}`);
}

let fallo = false;

if (noDibujados.length) {
  fallo = true;
  console.error(`\n  ✗ El codigo lee de fuentes que el modelo NO dibuja (${noDibujados.length}):`);
  for (const k of noDibujados) {
    const d = detalle.get(k);
    console.error(`    ${codigo.get(k)}  <-  ${d.clase} (${d.modulo})`);
  }
  console.error("    El diagrama promete menos de lo que el producto hace.");
  console.error("    En likec4/integration-hub.likec4: anade un `container` en `fileSources` Y una");
  console.error("    relacion `integrationHub.quarkusApp -> fileSources.<id>` que lo lea.");
}

if (fantasmas.length) {
  fallo = true;
  console.error(`\n  ✗ El modelo dibuja fuentes que NINGUN provider implementa (${fantasmas.length}):`);
  for (const k of fantasmas) console.error(`    container ${dibujados.get(k)}`);
  console.error("    El diagrama promete mas de lo que el producto hace, que es peor:");
  console.error("    alguien puede planificar un entorno contando con una fuente que no existe.");
}

if (inesperados.length) {
  fallo = true;
  console.error(`\n  ✗ Providers de los que NO se pudo leer el tipo (${inesperados.length}):`);
  for (const s of inesperados) console.error(`    ${s.clase} (${s.modulo}) — ${s.motivo}`);
  console.error("    Sin tipo legible, ese provider se cae del contrato y el gate quedaria verde con");
  console.error("    una fuente sin dibujar. Escribe `return \"TIPO\";` o `return CONSTANTE;` con la");
  console.error("    constante en el mismo fichero; si el tipo es dinamico a proposito, decláralo en");
  console.error("    SIN_TIPO_ESPERADO de este script con su motivo.");
}

if (colisiones.length) {
  fallo = true;
  console.error(`\n  ✗ Nombres que colapsan al normalizar (${colisiones.length}):`);
  for (const c of colisiones) console.error(`    ${c}`);
  console.error("    Son cosas distintas en runtime y el gate las contaria como una sola.");
}

if (huerfanos.length) {
  fallo = true;
  console.error(`\n  ✗ Contenedores que nadie lee (${huerfanos.length}):`);
  for (const c of huerfanos) console.error(`    fileSources.${c}  sin ninguna relacion `);
  console.error("    Un nodo sin arista es decoracion: sale en el diagrama pero no dice quien lo usa.");
  console.error("    Anade `integrationHub.quarkusApp -> fileSources.<id> '...'`.");
}

if (fallo) {
  console.error("\n  Reproduce con: npm run check:likec4-sources");
  process.exit(1);
}

console.log("\nOK. Las fuentes del modelo son exactamente las que el codigo registra, y todas se leen.");
process.exit(0);
