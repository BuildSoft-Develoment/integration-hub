#!/usr/bin/env node
/**
 * specify-compat.mjs (v12.110)
 *
 * Capa de compatibilidad con spec-kit (github/spec-kit). Emite por feature:
 *
 *   specs/<NNN-slug>/.specify/spec.md   -> puntero a spec-funcional.md
 *   specs/<NNN-slug>/.specify/plan.md   -> puntero a spec-tecnica.md
 *   specs/<NNN-slug>/.specify/tasks.md  -> puntero a spec-tareas.md
 *
 * Por que: tooling y agentes que asumen el lexico de spec-kit (spec/plan/tasks) pueden
 * descubrir nuestra estructura sin que migremos los nombres canonicos. Los archivos
 * .specify/ NO son fuente de verdad — son punteros que el agente puede leer. Si
 * eventualmente quieres incluir el contenido inline para herramientas que no siguen
 * enlaces, usa --inline (clona contenido bajo un marcador anti-drift).
 *
 * Read-mostly: solo escribe en specs/<slug>/.specify/ (nunca toca el canonico).
 * Idempotente.
 *
 * Uso:
 *   node scripts/specify-compat.mjs --feature <NNN-slug>
 *   node scripts/specify-compat.mjs --all
 *   node scripts/specify-compat.mjs --feature <slug> --inline    (incluye contenido bajo marcador)
 *   node scripts/specify-compat.mjs --feature <slug> --check     (no escribe; exit 1 si hay drift)
 *   node scripts/specify-compat.mjs --feature <slug> --remove    (elimina .specify/)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const inlineMode = !!args.inline;
const checkMode = !!args.check;
const removeMode = !!args.remove;

if (args.help || (!args.feature && !args.all)) {
  console.log(`specify-compat (v12.110) — emite .specify/{spec,plan,tasks}.md como alias hacia los canonicos.

Uso:
  node scripts/specify-compat.mjs --feature <NNN-slug>
  node scripts/specify-compat.mjs --all
  node scripts/specify-compat.mjs --feature <slug> --inline   (incluye contenido bajo marcador)
  node scripts/specify-compat.mjs --feature <slug> --check    (no escribe; exit 1 si hay drift)
  node scripts/specify-compat.mjs --feature <slug> --remove   (elimina .specify/)
`);
  process.exit(args.help ? 0 : 1);
}

const MAP = {
  "spec.md": "spec-funcional.md",
  "plan.md": "spec-tecnica.md",
  "tasks.md": "spec-tareas.md",
};

const specsDir = join(root, "specs");
if (!existsSync(specsDir)) {
  console.error(`Error: no existe ${specsDir}.`);
  process.exit(1);
}

const targets = [];
if (args.all) {
  for (const e of readdirSync(specsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (!/^\d{3,}-/.test(e.name)) continue;
    if (e.name.startsWith("000-")) continue;
    if (existsSync(join(specsDir, e.name, "spec-funcional.md"))) targets.push(e.name);
  }
} else {
  targets.push(String(args.feature).trim());
}

let written = 0;
let removed = 0;
const drift = [];

for (const slug of targets) {
  const featureDir = join(specsDir, slug);
  const compatDir = join(featureDir, ".specify");
  if (!existsSync(featureDir)) {
    console.error(`✗ ${slug}: no existe specs/${slug}/`);
    continue;
  }

  if (removeMode) {
    if (existsSync(compatDir)) {
      rmSync(compatDir, { recursive: true, force: true });
      removed += 1;
      console.log(`✓ ${slug}: eliminado .specify/`);
    }
    continue;
  }

  if (!existsSync(compatDir)) {
    // v12.117: la capa .specify/ es OPT-IN. En modo --check no se debe flag como
    // drift una feature que simplemente no tiene .specify/ generado: el agente o el
    // proyecto pueden no haber querido habilitar la compat con spec-kit. Solo se
    // chequea drift cuando .specify/ EXISTE y diverge de los canonicos.
    if (checkMode) continue;
    mkdirSync(compatDir, { recursive: true });
  }

  for (const [alias, canonical] of Object.entries(MAP)) {
    const canPath = join(featureDir, canonical);
    if (!existsSync(canPath)) continue;
    const out = renderAlias(slug, alias, canonical, canPath, inlineMode);
    const dst = join(compatDir, alias);
    const current = existsSync(dst) ? readFileSync(dst, "utf8") : null;
    if (current === out) continue;
    if (checkMode) {
      drift.push(`specs/${slug}/.specify/${alias}`);
    } else {
      writeFileSync(dst, out, "utf8");
      written += 1;
    }
  }
}

if (checkMode) {
  if (drift.length === 0) {
    console.log(`OK. Capa .specify/ sincronizada (o no aplica).`);
    process.exit(0);
  }
  console.error(`Capa .specify/ desincronizada (${drift.length}):`);
  for (const d of drift) console.error(`  ~ ${d}`);
  console.error(`Fix: npm run specify:compat -- --all`);
  process.exit(1);
}

console.log(`specify-compat (v12.110)`);
console.log(`Features procesadas: ${targets.length}`);
console.log(`Archivos escritos:   ${written}`);
if (removeMode) console.log(`Carpetas eliminadas: ${removed}`);

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function renderAlias(slug, alias, canonical, canonicalPath, inline) {
  const head = `<!-- ALIAS spec-kit-compat (v12.110) — generado por scripts/specify-compat.mjs.
NO editar a mano. La fuente de verdad es \`../${canonical}\`. Regenera con:
  npm run specify:compat -- --feature ${slug}
-->

# ${alias.replace(/\.md$/, "")} — alias compat (${slug})

Este archivo existe para que herramientas que asumen el lexico de spec-kit (spec.md /
plan.md / tasks.md) descubran la estructura de esta feature. La **fuente de verdad**
canonica vive en \`../${canonical}\` — no edites este archivo.

- Canonico: [\`${canonical}\`](../${canonical})
- Slug:     \`${slug}\`
- Layer:    spec-kit-compat v12.110
`;
  if (!inline) return head + "\n";
  // Modo --inline: incluir el contenido del canonico bajo un marcador anti-drift.
  const content = readFileSync(canonicalPath, "utf8");
  return `${head}

<!-- spec-kit-compat:inline-begin (canonical=${canonical}) -->

${content}

<!-- spec-kit-compat:inline-end -->
`;
}

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
