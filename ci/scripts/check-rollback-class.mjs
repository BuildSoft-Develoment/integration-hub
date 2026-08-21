#!/usr/bin/env node
/**
 * check-rollback-class.mjs (v1.0)
 *
 * Clasifica un pase en A/B/C segun lo que costaria RETROCEDERLO, y bloquea el que no traiga con que.
 * Es la regla D4 de ADR-030, y la primera comprobacion mecanica que tiene la R3 de ADR-029.
 *
 * POR QUE EXISTE. "Toda migracion debe ser compatible con la version anterior" lleva 106 migraciones
 * siendo una intencion escrita: `ci-compat-db.yml` no la cubre —lo que ejecuta es la matriz
 * multi-motor— y nadie mas mira. Y el momento en que se descubre el error es el peor posible: en
 * produccion `quarkus.hibernate-orm.database.generation=none`, asi que un esquema que el codigo no
 * entiende no revienta al arrancar, sino en la primera consulta que toca la columna, a mitad de un
 * proceso.
 *
 * LAS TRES CLASES. Lo que cambia entre ellas no es el riesgo del despliegue: es el precio del
 * rollback.
 *   A - sin migraciones          -> retroceder es cambiar el tag.
 *   B - migraciones aditivas     -> cambiar el tag y arrancar ese contenedor con
 *                                   QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS=true. Sin tocar la base.
 *   C - alguna destructiva       -> hace falta script de bajada, borrar las filas del historial y
 *                                   una instantanea previa.
 *
 * OJO: ni siquiera la clase B retrocede sola. Volver a la imagen anterior NO ARRANCA aunque la
 * migracion fuera inofensiva —Quarkus sobrescribe con una lista vacia el `["*:future"]` que Flyway
 * trae por defecto—, y por eso la B lleva variable. Verificado en JVM y en nativo (ADR-030, hecho 1).
 *
 * CAE SIEMPRE DEL LADO ESTRICTO. Leer SQL con expresiones regulares se puede enganar. Un filtro solo
 * puede permitirse ser permisivo cuando esta seguro, asi que ante cualquier duda -tipo que no se
 * puede comparar, sentencia que no se reconoce- la clase sube a C. Equivocarse hacia C cuesta
 * escribir un script de bajada de mas; equivocarse hacia B cuesta un rollback que no funciona.
 *
 * LO QUE NO VE, y no lo puede ver. Clasifica por la FORMA del DDL, no por lo que hace: una migracion
 * estructuralmente aditiva que ademas lance un UPDATE que machaca datos sale como B, y es mentira.
 * Eso lo caza la revision del pull request, no un validador.
 *
 * Modos: --desde <ref> --hasta <ref> (por defecto, la rama contra origin/develop) · --strict / --warn
 *        · --root
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v1.0";
const DIR_BAJADAS = "ops/fase-7-deploy/rollback";
const PROPIEDADES = "platform-app/src/main/resources/application.properties";

// -------------------------------------------------------------------------------------------------
// Utilidades
// -------------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") out.strict = true;
    else if (a === "--warn") out.warn = true;
    else if (a === "--desde") out.desde = argv[++i];
    else if (a === "--hasta") out.hasta = argv[++i];
    else if (a === "--root") out.root = argv[++i];
  }
  return out;
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Quita comentarios antes de buscar patrones. Sin esto, un `-- ampliado a varchar(40)` cuenta. */
function sinComentarios(sql) {
  return sql.replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Localiza los directorios de migracion leyendo `quarkus.flyway.locations`, NO con una lista escrita.
 * Por ADR-023 cada modulo es dueno de su DDL, asi que la lista crece con cada vertical nuevo; el dia
 * que nazca el tercero, su primera migracion destructiva se colaria como clase A.
 */
function directoriosDeMigracion(root) {
  const props = join(root, PROPIEDADES);
  if (!existsSync(props)) return { dirs: [], error: `no existe ${PROPIEDADES}` };

  const texto = readFileSync(props, "utf8").replace(/\r\n/g, "\n");
  const linea = texto.split("\n").find((l) => /^\s*quarkus\.flyway\.locations\s*=/.test(l));
  if (!linea) return { dirs: [], error: `${PROPIEDADES} no declara quarkus.flyway.locations` };

  const locations = linea.split("=").slice(1).join("=").split(",")
    .map((x) => x.trim().replace(/^classpath:/, "")).filter(Boolean);

  const dirs = [];
  const sinResolver = [];
  for (const loc of locations) {
    const encontrados = [];
    for (const modulo of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      const cand = join(root, modulo.name, "src", "main", "resources", loc);
      if (existsSync(cand)) encontrados.push(`${modulo.name}/src/main/resources/${loc}`);
    }
    if (encontrados.length === 0) sinResolver.push(loc);
    else dirs.push(...encontrados);
  }
  if (sinResolver.length) return { dirs, error: `sin resolver a directorio: ${sinResolver.join(", ")}` };
  return { dirs };
}

// -------------------------------------------------------------------------------------------------
// Tipos declarados: para saber si un ALTER ... TYPE ensancha hace falta el tipo ANTERIOR
// -------------------------------------------------------------------------------------------------

/** varchar(80) -> 80 · char(1) -> 1 · text -> Infinity · lo demas -> null (no comparable) */
function anchoDe(tipo) {
  const t = norm(tipo).toLowerCase();
  if (/^text\b/.test(t)) return Infinity;
  const m = t.match(/^(?:varchar|character varying|char|character)\s*\(\s*(\d+)\s*\)/);
  return m ? Number(m[1]) : null;
}

const sinEsquema = (t) => norm(t).toLowerCase().replace(/^[a-z0-9_]+\./, "");

/**
 * Recorre las migraciones en orden de version y anota el ultimo ancho conocido de cada `tabla.columna`.
 * Se indexa por tabla para no confundir dos columnas homonimas de tablas distintas —`status` aparece
 * declarada con cinco anchos distintos en este repositorio—.
 */
function anchosDeclarados(ficheros) {
  const ancho = new Map();
  const anota = (tabla, col, tipo) => {
    const a = anchoDe(tipo);
    ancho.set(`${sinEsquema(tabla)}.${col.toLowerCase()}`, a);
  };

  for (const { contenido } of ficheros) {
    const sql = sinComentarios(contenido);

    for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_.]+)\s*\(([\s\S]*?)\n\s*\)\s*;/gi)) {
      const tabla = m[1];
      for (const cruda of m[2].split("\n")) {
        const c = norm(cruda).replace(/,$/, "");
        const d = c.match(/^([a-z0-9_]+)\s+(.+)$/i);
        if (!d) continue;
        if (/^(primary|foreign|unique|constraint|check)\b/i.test(d[1])) continue;
        anota(tabla, d[1], d[2]);
      }
    }

    for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?([a-z0-9_.]+)([\s\S]*?);/gi)) {
      const tabla = m[1];
      for (const a of m[2].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\s+([^,;]+)/gi)) {
        anota(tabla, a[1], a[2]);
      }
      for (const a of m[2].matchAll(/alter\s+column\s+([a-z0-9_]+)\s+(?:set\s+data\s+)?type\s+([^,;]+)/gi)) {
        anota(tabla, a[1], a[2]);
      }
    }
  }
  return ancho;
}

// -------------------------------------------------------------------------------------------------
// Clasificacion de una migracion
// -------------------------------------------------------------------------------------------------

/** Devuelve los motivos por los que la migracion impide retroceder. Vacio = aditiva. */
function motivosDestructivos(contenido, anchos) {
  const sql = sinComentarios(contenido);
  const motivos = [];

  for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?([a-z0-9_.]+)([\s\S]*?);/gi)) {
    const tabla = m[1];
    const cuerpo = m[2];

    for (const d of cuerpo.matchAll(/drop\s+column\s+(?:if\s+exists\s+)?([a-z0-9_]+)/gi)) {
      motivos.push(`DROP COLUMN ${sinEsquema(tabla)}.${d[1]} — la version vieja la sigue leyendo`);
    }
    for (const r of cuerpo.matchAll(/rename\s+(?:column\s+)?([a-z0-9_]+)\s+to\s+([a-z0-9_]+)/gi)) {
      motivos.push(`RENAME ${sinEsquema(tabla)}.${r[1]} -> ${r[2]} — para la version vieja equivale a borrarla`);
    }
    for (const s of cuerpo.matchAll(/alter\s+column\s+([a-z0-9_]+)\s+set\s+not\s+null/gi)) {
      motivos.push(`SET NOT NULL ${sinEsquema(tabla)}.${s[1]} — la version vieja insertaria NULL`);
    }
    for (const a of cuerpo.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\s+([^,;]+)/gi)) {
      const def = a[2];
      if (/\bnot\s+null\b/i.test(def) && !/\bdefault\b/i.test(def)) {
        motivos.push(`ADD COLUMN ${sinEsquema(tabla)}.${a[1]} NOT NULL sin DEFAULT — la version vieja no la rellena`);
      }
    }
    for (const t of cuerpo.matchAll(/alter\s+column\s+([a-z0-9_]+)\s+(?:set\s+data\s+)?type\s+([^,;]+)/gi)) {
      const col = t[1];
      const nuevo = anchoDe(t[2]);
      const previo = anchos.get(`${sinEsquema(tabla)}.${col.toLowerCase()}`);
      if (nuevo === null || previo === null || previo === undefined) {
        motivos.push(`ALTER TYPE ${sinEsquema(tabla)}.${col} -> ${norm(t[2])} — no se puede probar que ensanche`);
      } else if (nuevo < previo) {
        motivos.push(`ALTER TYPE ${sinEsquema(tabla)}.${col} estrecha ${previo} -> ${nuevo} — los datos existentes pueden no caber`);
      }
    }
  }

  for (const d of sql.matchAll(/drop\s+table\s+(?:if\s+exists\s+)?([a-z0-9_.]+)/gi)) {
    motivos.push(`DROP TABLE ${sinEsquema(d[1])} — irreversible sin copia`);
  }

  return motivos;
}

const versionDe = (nombre) => (nombre.match(/(?:^|\/)V(\d+)__/) || [])[1] || null;

// -------------------------------------------------------------------------------------------------
// Principal
// -------------------------------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || ".");
  const strict = resolveStrict(args);

  console.log(`check-rollback-class (${VERSION})`);

  const { dirs, error } = directoriosDeMigracion(root);
  if (error) {
    console.error(`No se pudieron localizar los directorios de migracion: ${error}`);
    console.error("Sin esa lista la clasificacion mentiria por omision, asi que no se emite veredicto.");
    return 1;
  }
  console.log(`Directorios vigilados (de quarkus.flyway.locations): ${dirs.join(", ")}`);

  const desde = args.desde || "origin/develop";
  const hasta = args.hasta || "HEAD";

  let anadidos;
  try {
    const salida = git(root, ["diff", "--name-only", "--diff-filter=A", `${desde}...${hasta}`, "--", ...dirs]);
    anadidos = salida.split("\n").map((s) => s.trim()).filter((s) => s.endsWith(".sql"));
  } catch (e) {
    console.error(`No se pudo comparar ${desde}...${hasta}: ${String(e.stderr || e.message).trim()}`);
    console.error("Un veredicto que no se puede calcular no es un veredicto de clase A.");
    return 1;
  }

  console.log(`Salto analizado: ${desde}...${hasta}`);

  if (anadidos.length === 0) {
    console.log("");
    console.log("CLASE A — el salto no anade migraciones.");
    console.log("Retroceder es cambiar el tag: ni script de bajada ni variables ni instantanea.");
    return 0;
  }

  // El contenido se lee del lado `hasta`: los ficheros pueden no existir en la copia de trabajo.
  const ficheros = [];
  for (const ruta of anadidos) {
    try {
      ficheros.push({ ruta, contenido: git(root, ["show", `${hasta}:${ruta}`]) });
    } catch {
      console.error(`No se pudo leer ${ruta} en ${hasta}.`);
      return 1;
    }
  }
  ficheros.sort((a, b) => Number(versionDe(a.ruta) || 0) - Number(versionDe(b.ruta) || 0));

  // Para comparar anchos hace falta la historia completa, no solo lo que anade el salto.
  const todas = [];
  for (const dir of dirs) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const n of readdirSync(abs).filter((f) => f.endsWith(".sql"))) {
      todas.push({ ruta: `${dir}/${n}`, contenido: readFileSync(join(abs, n), "utf8") });
    }
  }
  todas.sort((a, b) => Number(versionDe(a.ruta) || 0) - Number(versionDe(b.ruta) || 0));
  const anchos = anchosDeclarados(todas);

  const destructivas = [];
  const aditivas = [];
  for (const f of ficheros) {
    const motivos = motivosDestructivos(f.contenido, anchos);
    (motivos.length ? destructivas : aditivas).push({ ...f, motivos });
  }

  console.log("");
  if (destructivas.length === 0) {
    console.log(`CLASE B — ${aditivas.length} migracion(es), todas aditivas.`);
    for (const f of aditivas) console.log(`  + ${f.ruta}`);
    console.log("");
    console.log("Para retroceder: cambiar el tag Y arrancar ese contenedor con");
    console.log("  QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS=true");
    console.log("Sin esa variable la imagen anterior NO arranca, aunque las migraciones sean inocuas.");
    console.log("Y la variable se retira al volver adelante (D6): mientras este puesta, el entorno");
    console.log("acepta en silencio una imagen a la que le faltan migraciones.");
    return 0;
  }

  console.log(`CLASE C — ${destructivas.length} migracion(es) impiden retroceder cambiando el tag.`);
  for (const f of destructivas) {
    console.log(`  ! ${f.ruta}`);
    for (const m of f.motivos) console.log(`      ${m}`);
  }
  if (aditivas.length) {
    console.log(`  (${aditivas.length} aditiva(s) mas en el mismo salto)`);
  }

  // D7: un pase de clase C no se aprueba sin script de bajada, y el script lleva DOS mitades.
  const dirBajadas = join(root, DIR_BAJADAS);
  const existentes = existsSync(dirBajadas) ? readdirSync(dirBajadas) : [];
  const hallazgos = [];

  for (const f of destructivas) {
    const v = versionDe(f.ruta);
    if (!v) {
      hallazgos.push(`${f.ruta}: no se pudo extraer la version del nombre; no hay como exigir su script de bajada.`);
      continue;
    }
    const bajada = existentes.find((n) => new RegExp(`^V${v}__.*\\.down\\.sql$`, "i").test(n));
    if (!bajada) {
      hallazgos.push(`falta ${DIR_BAJADAS}/V${v}__<nombre>.down.sql para ${f.ruta}`);
      continue;
    }
    const cuerpo = readFileSync(join(dirBajadas, bajada), "utf8");
    if (!/flyway_schema_history/i.test(cuerpo)) {
      hallazgos.push(
        `${DIR_BAJADAS}/${bajada} deshace el DDL pero no borra su fila de flyway_schema_history; ` +
        `sin esa mitad la imagen anterior tampoco arranca.`,
      );
    }
  }

  console.log("");
  if (hallazgos.length === 0) {
    console.log("Script de bajada presente y con sus dos mitades para cada migracion destructiva.");
    console.log("Antes de aprobar hay que ENSAYARLO (D15) y tomar la instantanea (D9).");
    return 0;
  }

  for (const h of hallazgos) console.error(`  - ${h}`);
  console.error(`\nTotal hallazgos: ${hallazgos.length}`);
  console.error(`Ver ${DIR_BAJADAS}/README.md para la convencion.`);
  return strict ? 1 : 0;
}

process.exit(main());
