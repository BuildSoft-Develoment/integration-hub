#!/usr/bin/env node
/**
 * prototype-contract.mjs (v12.65)
 *
 * Imprime el CONTRATO de un prototipo HTML5 por feature: que DEBE contener
 * (derivado de spec-funcional.md + lo declarado en decisiones-ux.md) y que falta.
 * Analogo de `roadmap:next` pero a nivel prototipo.
 *
 * Uso:
 *   npm run prototype:contract -- --feature 001-...        # JSON del contrato
 *   npm run prototype:contract -- --feature 001-... --format text
 *   npm run prototype:contract                              # resumen de todas las features
 *
 * Exit codes: 0 siempre (es informativo; el gate es check:prototype-contract).
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "../ci/scripts/_lib/feature-filter.mjs";
import { computeContract } from "../ci/scripts/_lib/prototype-contract.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const format = args.format || (args.feature ? "json" : "text");
const featureFilter = args.feature || null;

const slugs = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));

if (featureFilter) {
  const slug = slugs[0];
  if (!slug) { console.error(`No existe la feature "${featureFilter}".`); process.exit(0); }
  const c = computeContract(root, slug);
  if (format === "text") printContract(c);
  else console.log(JSON.stringify(c, null, 2));
  process.exit(0);
}

// Resumen de todas.
console.log(`\nCONTRATO DE PROTOTIPOS (v12.65)`);
console.log(`===============================`);
for (const slug of slugs) {
  const hasProto = existsSync(join(root, "specs", slug, "prototype-html5", "index.html"));
  if (!hasProto) { console.log(`  ○ ${slug}  (sin prototipo)`); continue; }
  const c = computeContract(root, slug);
  const gaps = c.coverage.missingRfs.length + c.coverage.missingActors.length;
  const sect = c.declared.hasSection ? "contrato declarado" : "SIN seccion de contrato";
  const icon = !c.declared.hasSection ? "✗" : gaps > 0 ? "⚠" : "✓";
  console.log(`  ${icon} ${slug}  — ${sect}${gaps > 0 ? `, ${gaps} gap(s) de cobertura` : ""}`);
}
console.log(`\nDetalle de una feature: npm run prototype:contract -- --feature <slug> --format text`);
console.log(`Validar (gate):         npm run check:prototype-contract`);
process.exit(0);

function printContract(c) {
  console.log(`\nCONTRATO DEL PROTOTIPO — ${c.feature}`);
  console.log(`==========================================`);
  console.log(`Prototipo: ${c.hasPrototype ? "existe" : "NO existe (genera con scaffold:prototype)"}`);
  console.log(`\nDerivado del spec-funcional.md (no omitible):`);
  console.log(`  RF/HU requeridos: ${c.spec.rfs.join(", ") || "(ninguno)"}`);
  console.log(`  Actores:          ${c.spec.actors.map((a) => a.raw).join(", ") || "(ninguno)"}`);
  console.log(`\nDeclarado en decisiones-ux.md > '## Contrato del prototipo':`);
  if (!c.declared.hasSection) {
    console.log(`  ✗ FALTA la seccion '## Contrato del prototipo'. Agregala con:`);
    console.log(`      ## Contrato del prototipo`);
    console.log(`      - Estados: loading, empty, error, success`);
    console.log(`      - Roles: <actores del spec>`);
    console.log(`      - Entidades: <entidad principal>`);
    console.log(`      - RF representados: ${c.spec.rfs.join(", ") || "RF-NN"}`);
  } else {
    console.log(`  Estados:   ${c.declared.states.join(", ") || "(ninguno)"}`);
    console.log(`  Roles:     ${c.declared.roles.join(", ") || "(ninguno)"}`);
    console.log(`  Entidades: ${c.declared.entities.join(", ") || "(ninguno)"}`);
    console.log(`  RF:        ${c.declared.rfs.join(", ") || "(ninguno)"}`);
  }
  if (c.coverage.missingRfs.length > 0 || c.coverage.missingActors.length > 0) {
    console.log(`\nGaps de cobertura (resolver antes de validar):`);
    for (const rf of c.coverage.missingRfs) console.log(`  ✗ ${rf} del spec no esta en 'RF representados'`);
    for (const a of c.coverage.missingActors) console.log(`  ⚠ actor '${a.raw}' del spec no esta en Roles`);
  } else if (c.declared.hasSection) {
    console.log(`\n✓ Cobertura completa (todos los RF/actores del spec estan en el contrato).`);
  }
  console.log(``);
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
