#!/usr/bin/env node
/**
 * check-rollback-class.mjs (v1.1)
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
 * EL ANCHO ANTERIOR SE MIDE ANTES, NO DESPUES. Para saber si un `ALTER ... TYPE` ensancha o estrecha
 * hace falta el tipo previo, y eso obliga a reconstruir el esquema recorriendo las migraciones EN
 * ORDEN DE VERSION y evaluando cada una con el mapa tal y como estaba ANTES de aplicarla. La v1.0
 * construia el mapa con todas de golpe, incluida la que estaba clasificando: comparaba la columna
 * consigo misma, y un `varchar(255) -> varchar(20)` salia como clase B. Verificado con una migracion
 * de prueba antes y despues del arreglo.
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

const VERSION = "v1.1";
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
  return execFileSync("git", args, {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024,
  });
}

/**
 * Deja el SQL listo para buscar patrones:
 *   - fuera comentarios: sin esto, un `-- ampliado a varchar(40) en V38` cuenta como sentencia, y
 *     este repositorio tiene comentarios asi;
 *   - fuera cuerpos `$$ ... $$`: el DDL de dentro de una funcion o un trigger no se ejecuta al
 *     migrar, y ademas sus `;` internos rompen el troceo por sentencia.
 */
function limpiar(sql) {
  return sql
    .replace(/\r\n/g, "\n")
    .replace(/\$\$[\s\S]*?\$\$/g, " $BLOQUE$ ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

const norm = (s) => s.replace(/\s+/g, " ").trim();
const sinEsquema = (t) => norm(t).toLowerCase().replace(/^[a-z0-9_]+\./, "");
const versionDe = (nombre) => (nombre.match(/(?:^|\/)V(\d+)__/) || [])[1] || null;

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
  const modulos = readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "node_modules");

  for (const loc of locations) {
    const encontrados = modulos
      .map((m) => `${m.name}/src/main/resources/${loc}`)
      .filter((rel) => existsSync(join(root, rel)));
    if (encontrados.length === 0) sinResolver.push(loc);
    else dirs.push(...encontrados);
  }
  if (sinResolver.length) return { dirs, error: `sin resolver a directorio: ${sinResolver.join(", ")}` };
  return { dirs };
}

// -------------------------------------------------------------------------------------------------
// Reconstruccion del ancho declarado de cada columna
// -------------------------------------------------------------------------------------------------

/** varchar(80) -> 80 · char(1) -> 1 · text -> Infinity · lo demas -> null (no comparable) */
function anchoDe(tipo) {
  const t = norm(tipo).toLowerCase();
  if (/^text\b/.test(t)) return Infinity;
  const m = t.match(/^(?:varchar|character varying|char|character)\s*\(\s*(\d+)\s*\)/);
  return m ? Number(m[1]) : null;
}

/**
 * Extrae los cuerpos de `create table ... ( ... )` contando parentesis.
 * Con expresion regular no vale: el cierre puede caer en la misma linea que la ultima columna, y hay
 * 45 CREATE TABLE en el repositorio con formatos distintos.
 */
function cuerposCreateTable(sql) {
  const out = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_.]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    let nivel = 1;
    let i = re.lastIndex;
    while (i < sql.length && nivel > 0) {
      if (sql[i] === "(") nivel++;
      else if (sql[i] === ")") nivel--;
      i++;
    }
    if (nivel === 0) out.push({ tabla: m[1], cuerpo: sql.slice(re.lastIndex, i - 1) });
  }
  return out;
}

/** Trocea el cuerpo de un CREATE TABLE por comas de primer nivel: `varchar(80)` no debe partirlo. */
function columnasDe(cuerpo) {
  const trozos = [];
  let nivel = 0, actual = "";
  for (const ch of cuerpo) {
    if (ch === "(") nivel++;
    else if (ch === ")") nivel--;
    if (ch === "," && nivel === 0) { trozos.push(actual); actual = ""; } else actual += ch;
  }
  trozos.push(actual);
  return trozos;
}

/** Aplica al mapa las declaraciones de ESTA migracion. Muta `ancho`. */
function aplicaDeclaraciones(contenido, ancho) {
  const sql = limpiar(contenido);
  const anota = (tabla, col, tipo) =>
    ancho.set(`${sinEsquema(tabla)}.${col.toLowerCase()}`, anchoDe(tipo));

  for (const { tabla, cuerpo } of cuerposCreateTable(sql)) {
    for (const cruda of columnasDe(cuerpo)) {
      const c = norm(cruda);
      const d = c.match(/^([a-z0-9_]+)\s+(.+)$/i);
      if (!d) continue;
      if (/^(primary|foreign|unique|constraint|check|exclude|like)$/i.test(d[1])) continue;
      anota(tabla, d[1], d[2]);
    }
  }

  for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?([a-z0-9_.]+)([\s\S]*?);/gi)) {
    for (const a of m[2].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\s+([^,;]+)/gi)) {
      anota(m[1], a[1], a[2]);
    }
    for (const a of m[2].matchAll(/alter\s+column\s+([a-z0-9_]+)\s+(?:set\s+data\s+)?type\s+([^,;]+)/gi)) {
      anota(m[1], a[1], a[2]);
    }
  }
}

// -------------------------------------------------------------------------------------------------
// Clasificacion de una migracion
// -------------------------------------------------------------------------------------------------

/** Motivos por los que la migracion impide retroceder. Vacio = aditiva. `ancho` es el estado PREVIO. */
function motivosDestructivos(contenido, ancho) {
  const sql = limpiar(contenido);
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
      if (/\bnot\s+null\b/i.test(a[2]) && !/\bdefault\b/i.test(a[2])) {
        motivos.push(`ADD COLUMN ${sinEsquema(tabla)}.${a[1]} NOT NULL sin DEFAULT — la version vieja no la rellena`);
      }
    }
    for (const t of cuerpo.matchAll(/alter\s+column\s+([a-z0-9_]+)\s+(?:set\s+data\s+)?type\s+([^,;]+)/gi)) {
      const clave = `${sinEsquema(tabla)}.${t[1].toLowerCase()}`;
      const nuevo = anchoDe(t[2]);
      const previo = ancho.get(clave);
      if (nuevo === null || previo === null || previo === undefined) {
        motivos.push(`ALTER TYPE ${sinEsquema(tabla)}.${t[1]} -> ${norm(t[2])} — no se puede probar que ensanche`);
      } else if (nuevo < previo) {
        const antes = previo === Infinity ? "text" : previo;
        motivos.push(`ALTER TYPE ${sinEsquema(tabla)}.${t[1]} ESTRECHA ${antes} -> ${nuevo} — los datos existentes pueden no caber`);
      }
    }
  }

  for (const d of sql.matchAll(/drop\s+table\s+(?:if\s+exists\s+)?([a-z0-9_.]+)/gi)) {
    motivos.push(`DROP TABLE ${sinEsquema(d[1])} — irreversible sin copia`);
  }

  return motivos;
}

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
    anadidos = new Set(salida.split("\n").map((s) => s.trim()).filter((s) => s.endsWith(".sql")));
  } catch (e) {
    console.error(`No se pudo comparar ${desde}...${hasta}: ${String(e.stderr || e.message).trim()}`);
    console.error("Un veredicto que no se puede calcular no es un veredicto de clase A.");
    return 1;
  }

  console.log(`Salto analizado: ${desde}...${hasta}`);

  if (anadidos.size === 0) {
    console.log("");
    console.log("CLASE A — el salto no anade migraciones.");
    console.log("Retroceder es cambiar el tag: ni script de bajada ni variables ni instantanea.");
    return 0;
  }

  // Todo el historial DEL LADO `hasta`, no de la copia de trabajo: el salto puede no ser HEAD.
  let inventario;
  try {
    inventario = git(root, ["ls-tree", "-r", "--name-only", hasta, "--", ...dirs])
      .split("\n").map((s) => s.trim()).filter((s) => /\/V\d+__.*\.sql$/.test(s));
  } catch (e) {
    console.error(`No se pudo listar las migraciones en ${hasta}: ${String(e.stderr || e.message).trim()}`);
    return 1;
  }
  inventario.sort((a, b) => Number(versionDe(a)) - Number(versionDe(b)));

  // ORDEN DE VERSION, y cada migracion se juzga con el esquema tal y como estaba ANTES de ella.
  const ancho = new Map();
  const destructivas = [];
  const aditivas = [];
  for (const ruta of inventario) {
    let contenido;
    try {
      contenido = git(root, ["show", `${hasta}:${ruta}`]);
    } catch {
      console.error(`No se pudo leer ${ruta} en ${hasta}.`);
      return 1;
    }
    if (anadidos.has(ruta)) {
      const motivos = motivosDestructivos(contenido, ancho);
      (motivos.length ? destructivas : aditivas).push({ ruta, motivos });
    }
    aplicaDeclaraciones(contenido, ancho);
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
  if (aditivas.length) console.log(`  (${aditivas.length} aditiva(s) mas en el mismo salto)`);

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
    if (!/flyway_schema_history/i.test(readFileSync(join(dirBajadas, bajada), "utf8"))) {
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
