#!/usr/bin/env node
/**
 * check-tasks.mjs (v12.114)
 *
 * Verifica que cada feature scaffoldada tenga su `spec-tareas.md` con sustancia:
 *   - existe en specs/<NNN-slug>/spec-tareas.md,
 *   - declara al menos 1 tarea identificable (`T-NNN` o checkbox `- [ ]`),
 *   - contiene seccion "Checklist de cierre",
 *   - cuerpo no trivial.
 *
 * v12.114: DEFAULT STRICT. Antes (v12.106) era WARN para no romper proyectos
 * pre-v12.106 que tenian spec-tareas en formato manual sin "Checklist de cierre".
 * Decision del usuario: los proyectos antiguos se recrean desde cero — no se
 * mantiene back-compat. Si todavia hay specs en formato viejo, agrega la seccion
 * "## Checklist de cierre" al final de cada una (apendice, preserva contenido) o
 * regenera con `npm run scaffold:feature`.
 *
 * Para suavizar temporalmente: --warn | CHECK_STRICT=0 no aplica (resolveStrict
 * solo bajaria a false si pasas --warn explicito).
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true); // v12.114: default STRICT

const specsDir = join(root, "specs");
const blockers = [];
const warnings = [];
let evaluated = 0;

if (existsSync(specsDir)) {
  const entries = readdirSync(specsDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!/^\d{3,}-[a-z0-9-]+/i.test(e.name)) continue;
    if (e.name.startsWith("000-")) continue; // ejemplo/scaffold, no se valida
    const featureDir = join(specsDir, e.name);
    // Solo evaluamos features con spec-funcional.md (activas).
    if (!existsSync(join(featureDir, "spec-funcional.md"))) continue;
    evaluated += 1;
    const tareasPath = join(featureDir, "spec-tareas.md");
    if (!existsSync(tareasPath)) {
      warnings.push(`specs/${e.name}/spec-tareas.md: falta. Generala via 'npm run scaffold:feature' o copia plantillas/fase-4-sdd/spec-tareas.md y rellena.`);
      continue;
    }
    const text = readFileSync(tareasPath, "utf8");
    if (text.replace(/\s+/g, "").length < 80) {
      warnings.push(`specs/${e.name}/spec-tareas.md: archivo vacio o trivialmente corto (sin sustancia).`);
      continue;
    }
    if (!/^##\s+T-\d{3}\b/m.test(text) && !/^-\s*\[\s\]/m.test(text)) {
      warnings.push(`specs/${e.name}/spec-tareas.md: no declara tareas identificables (## T-NNN o lista con checkboxes "- [ ]").`);
    }
    if (!/Checklist de cierre/i.test(text)) {
      warnings.push(`specs/${e.name}/spec-tareas.md: falta seccion "Checklist de cierre".`);
    }
  }
}

console.log(`check-tasks (v12.114) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Features con spec-funcional.md evaluadas: ${evaluated}`);

if (warnings.length === 0 && blockers.length === 0) {
  console.log(`\nOK. Toda feature activa tiene spec-tareas.md con sustancia minima.`);
  process.exit(0);
}

if (warnings.length > 0) {
  console.error(`\nHallazgos (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ ${w}`);
}
console.error(`\nFix sugerido:`);
console.error(`  - Nuevas features: 'npm run scaffold:feature' las genera automaticamente (v12.106+).`);
console.error(`  - Features pre-v12.106: copia 'plantillas/fase-4-sdd/spec-tareas.md' y adapta al slug.`);

process.exit(strict && warnings.length > 0 ? 1 : 0);

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
