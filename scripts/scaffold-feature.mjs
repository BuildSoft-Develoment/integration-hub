#!/usr/bin/env node
/**
 * scaffold-feature.mjs (v12.83)
 *
 * v12.83: con --domain genera ademas el prototipo REAL desde el golden en la
 * ubicacion canonica specs/<slug>/prototype-html5/index.html (delega en
 * scaffold-prototype). Asi crear una feature visual con su prototipo en su sitio
 * es UN solo comando y el agente no improvisa la ubicacion.
 *
 * Genera los 9 archivos canonicos de una feature bajo `specs/NNN-slug/` con
 * estructura ya alineada al canon v12.45+:
 *   - spec-funcional.md   con secciones Origen, Objetivo, Requerimientos, Reglas, Actores
 *   - spec-tecnica.md     con bloque `Tabla \`<entidad>\`` + columnas/PK/Indices
 *   - traceability.md     con matriz 10 columnas + seccion Gates + Decisiones + Preguntas
 *   - prototype.md        con anatomia visual + decisiones-ux mas comunes
 *   - prototype-validation.md  segun plantilla canonica
 *   - product-design.md   con jobs-to-be-done + flujos
 *   - spdd-frontend.md    con componentes, estados, permisos
 *   - api-contract.md     con endpoints + OpenAPI snippets
 *   - ui-test-cases.md    con casos manuales por estado
 *
 * El agente solo necesita rellenar valores; la estructura ya es canonica y
 * pasa `check:project` (matriz 10 cols, gates declarados, BD documentada).
 *
 * Cierra los 9 patrones de error vistos en opencode/codex/gemini.
 *
 * Uso:
 *   node scripts/scaffold-feature.mjs --slug 002-control-parental \
 *     --titulo "Control parental" \
 *     --rfs RF-01,RF-02 \
 *     --rnfs RNF-01 \
 *     --hus HU-01 \
 *     --entidad perfil_parental \
 *     --endpoint "GET /api/parental,POST /api/parental"
 *
 *   node scripts/scaffold-feature.mjs --slug 002-foo --titulo "Foo" --interactive
 *
 *   node scripts/scaffold-feature.mjs --help
 *
 * Exit codes:
 *   0 - todos los archivos creados (9/9)
 *   1 - error de argumentos
 *   2 - el slug ya existe (usar --force para sobrescribir)
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";
// v12.88: builders extraidos a fuente unica (compartida con sync-plantillas + check-plantillas).
import { buildCanonicalFiles } from "./_lib/feature-templates.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.slug) {
  console.log(`scaffold-feature.mjs (v12.116) — generador canonico de feature (10 artefactos)

Uso:
  node scripts/scaffold-feature.mjs --slug NNN-slug [opciones]

Argumentos:
  --slug <NNN-slug>       (obligatorio) slug de la feature, ej. 002-control-parental
  --titulo "<titulo>"     titulo legible. Default: derivado del slug.
  --rfs RF-01,RF-02       lista de requerimientos funcionales. Default: RF-01.
  --rnfs RNF-01           lista de RNFs. Default: RNF-01.
  --hus HU-01             lista de historias de usuario. Default: HU-01.
  --entidad <name>        nombre de la entidad BD principal. Default: derivado del slug.
  --endpoint "M /p,M /p"  lista de endpoints. Default: GET /api/<entidad>.
  --root <path>           directorio raiz del proyecto. Default: cwd.
  --origin <modo>         "nuevo" (default, rigor completo) | "reingenieria"
                          (codigo ya construido: omite los artefactos de Fase 2
                          prototipo/SPDD/product-design y estampa el frontmatter).
  --force                 sobrescribir si el slug existe.
  --interactive           preguntar valores faltantes en el prompt.

Genera un placeholder neutro en specs/<slug>/prototype-html5/index.html. Para el
prototipo real, corre DESPUES (v12.116+ default freeform):
  npm run scaffold:prototype -- --feature <slug>
La metodologia favorece freeform: el agente disena el prototipo desde los RF, no
copiando un golden. Goldens en ejemplos/fase-2-ux-ui/prototype-html5-golden/ son
REFERENCIA visual, no plantilla a copiar (Principios 5 y 7 de CONSTITUTION.md).

Ejemplo:
  node scripts/scaffold-feature.mjs \\
    --slug 003-perfiles-familiares \\
    --titulo "Perfiles familiares" \\
    --rfs RF-04,RF-05 \\
    --rnfs RNF-02 \\
    --hus HU-04 \\
    --entidad perfil_familiar \\
    --endpoint "GET /api/familias/{id}/perfiles,POST /api/familias/{id}/perfiles"
`);
  process.exit(args.help ? 0 : 1);
}

const root = resolve(args.root || ".");
const slug = String(args.slug).trim();
if (!/^\d{3,}-[a-z0-9-]+$/i.test(slug)) {
  console.error(`Error: slug invalido "${slug}". Debe ser NNN-kebab-case (ej. 002-control-parental).`);
  process.exit(1);
}
const titulo = args.titulo || slug.replace(/^\d+-/, "").split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
const rfs = csv(args.rfs, "RF-01");
const rnfs = csv(args.rnfs, "RNF-01");
const hus = csv(args.hus, "HU-01");
const entidad = (args.entidad || slug.replace(/^\d+-/, "").replace(/-/g, "_")).toLowerCase();
const endpoints = csv(args.endpoint, `GET /api/${entidad}`);

// v12.139: --origin reingenieria genera la feature SIN los artefactos de Fase 2
// (prototipo/SPDD/product-design), porque el producto real ya esta construido.
// Default "nuevo" = set canonico completo (rigor metodologico total).
const REENGINEERING_ORIGINS = new Set(["reingenieria", "reingeniería", "brownfield", "existing-code", "existing_code"]);
const originRaw = args.origin ? String(args.origin).trim().toLowerCase() : "nuevo";
const reengineering = REENGINEERING_ORIGINS.has(originRaw);
const FASE2_FILES = ["prototype.md", "prototype-validation.md", "product-design.md", "spdd-frontend.md", "prototype-html5/index.html"];

const featureDir = join(root, "specs", slug);
if (existsSync(featureDir) && !args.force) {
  console.error(`Error: ${featureDir} ya existe. Usa --force para sobrescribir.`);
  process.exit(2);
}
mkdirSync(featureDir, { recursive: true });
// El dir de prototipo solo se crea para features nuevas (Fase 2 aplica).
if (!reengineering) mkdirSync(join(featureDir, "prototype-html5"), { recursive: true });

const ctx = { slug, titulo, rfs, rnfs, hus, entidad, endpoints, primaryRf: rfs[0], primaryHu: hus[0] };
const files = buildCanonicalFiles(ctx);
if (reengineering) {
  if (files["spec-funcional.md"] && !/^---\s*\n/.test(files["spec-funcional.md"])) {
    files["spec-funcional.md"] = `---\norigin: reingenieria\n---\n\n` + files["spec-funcional.md"];
  }
  for (const f of FASE2_FILES) delete files[f];
}
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(featureDir, name), content, "utf8");
}

// Verificacion inmediata: cuenta de archivos canonicos generados por scaffold-feature.
// v12.106: spec-tareas.md es ahora ciudadano de primera clase del scaffold.
const REQUIRED = reengineering
  ? [
      "spec-funcional.md", "spec-tecnica.md", "spec-tareas.md", "tdd-evidence.md", "traceability.md",
      "api-contract.md", "ui-test-cases.md",
    ]
  : [
      "spec-funcional.md", "spec-tecnica.md", "spec-tareas.md", "tdd-evidence.md", "traceability.md",
      "prototype.md", "prototype-validation.md", "product-design.md",
      "spdd-frontend.md", "api-contract.md", "ui-test-cases.md",
    ];
const present = new Set(readdirSync(featureDir));
const missing = REQUIRED.filter((f) => !present.has(f));

console.log(`OK. Feature canonica generada en ${featureDir.replace(root, "<root>")}`);
console.log(`Archivos canonicos: ${REQUIRED.length - missing.length}/${REQUIRED.length}`);
console.log(`Slug: ${slug}`);
console.log(`Titulo: ${titulo}`);
console.log(`RFs: ${rfs.join(", ")}   RNFs: ${rnfs.join(", ")}   HUs: ${hus.join(", ")}`);
console.log(`Entidad BD: ${entidad}`);
console.log(`Endpoints: ${endpoints.join(", ")}`);
if (missing.length) {
  console.error(`Archivos faltantes (no se crearon): ${missing.join(", ")}`);
  process.exit(2);
}

// v12.116: eliminada la auto-llamada con --domain (copia golden) que vivia aqui
// desde v12.83. La metodologia ahora favorece freeform por default: el agente
// disena el prototipo desde los RF, no copiando un golden. Si pasaste --domain,
// se ignora (el flag se mantiene para retrocompatibilidad de mensaje, pero no
// dispara nada). Para generar el prototipo, corre el comando explicito:
//   npm run scaffold:prototype -- --feature <slug>            (default freeform)
//   npm run scaffold:prototype -- --feature <slug> --domain X (opt-in, desaconsejado)
if (args.domain) {
  console.log("");
  console.log(`(aviso v12.116) --domain ${args.domain} fue ignorado: scaffold:feature ya no copia goldens automaticamente.`);
  console.log(`  La metodologia favorece freeform (el agente disena desde los RF, no copia el golden).`);
  console.log(`  Genera el prototipo explicitamente con:  npm run scaffold:prototype -- --feature ${slug}`);
}

console.log("");
console.log("Proximos pasos:");
if (reengineering) {
  console.log(`  (origin: reingenieria — Fase 2 / prototipo EXENTA; el resto de la metodologia aplica)`);
  console.log(`  1. Editar specs/${slug}/spec-funcional.md (reglas reales segun el codigo existente)`);
  console.log(`  2. Editar specs/${slug}/spec-tecnica.md (columnas reales de la tabla ${entidad})`);
  console.log(`  3. Editar specs/${slug}/api-contract.md (rutas/contratos reales del codigo)`);
  console.log(`  4. Editar specs/${slug}/traceability.md y tdd-evidence.md (GREEN real de las pruebas)`);
  console.log(`  5. npm run memory:sync && npm run check:project`);
} else {
  console.log(`  1. Editar specs/${slug}/spec-funcional.md (rellenar reglas reales del dominio)`);
  console.log(`  2. Editar specs/${slug}/spec-tecnica.md (columnas reales de la tabla ${entidad})`);
  console.log(`  3. Editar specs/${slug}/api-contract.md (request/response reales)`);
  console.log(`  4. Generar el prototipo en su lugar (freeform por default v12.116+):`);
  console.log(`        npm run scaffold:prototype -- --feature ${slug}`);
  console.log(`     (NO crees prototype/<feature>/ — el prototipo va SIEMPRE en specs/${slug}/prototype-html5/.`);
  console.log(`     Goldens en ejemplos/fase-2-ux-ui/prototype-html5-golden/ son REFERENCIA visual, no plantilla a copiar.)`);
  console.log(`  5. npm run memory:sync && npm run check:project`);
}
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
// v12.88: los builders (readme/specFuncional/.../placeholderProtoHtml + buildCanonicalFiles)
// viven ahora en scripts/_lib/feature-templates.mjs (fuente unica compartida con
// sync-plantillas y check-plantillas). Aqui solo quedan los helpers de argumentos.

function csv(value, fallback) {
  if (!value || value === true) return Array.isArray(fallback) ? fallback : [fallback];
  return String(value).split(",").map((s) => s.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}
