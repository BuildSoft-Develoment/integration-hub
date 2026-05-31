#!/usr/bin/env node
/**
 * prototype-prompt.mjs (v12.65)
 *
 * Renderiza un prompt "construye este prototipo HTML5 a especificacion" para un
 * agente IA, a partir del CONTRATO de la feature (spec-funcional + decisiones-ux)
 * + touch_policy de fase 2 + Definition of Done. Analogo de `roadmap:prompt`
 * pero enfocado en el prototipo.
 *
 * Uso:
 *   npm run prototype:prompt -- --feature 002-...              # > stdout
 *   npm run prototype:prompt -- --feature 002-... --agent codex
 *   npm run prototype:prompt -- --feature 002-... --out ai/prompts/proto-002.md
 *
 * Exit codes: 0 ok; 1 si falta --feature.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { computeContract } from "../ci/scripts/_lib/prototype-contract.mjs";
import { getTouchPolicy } from "../ci/scripts/_lib/phase-contracts.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const slug = args.feature || null;
const agent = args.agent || "agente UX/frontend";
const outPath = args.out ? resolve(args.out) : null;

if (!slug) {
  console.error(`Falta --feature <slug>. Ej: npm run prototype:prompt -- --feature 002-mi-feature`);
  process.exit(1);
}

const c = computeContract(root, slug);
const dec = readIf(join(root, "specs", slug, "prototype-html5", "decisiones-ux.md"));
const domain = (dec.match(/Dominio[^\n:]*:\s*([^\n]+)/i) || [])[1]?.trim() || "(declarar en decisiones-ux.md)";
const golden = (dec.match(/Golden[\s\S]*?Path:\s*`?([^`\n]+)`?/i) || [])[1]?.trim() || "(elegir de ejemplos/fase-2-ux-ui/prototype-html5-golden/)";
const tp = getTouchPolicy(2, slug);

const prompt = render();
console.log(prompt);
if (outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, prompt + "\n", "utf8");
  console.error(`\n[prototype:prompt] escrito en ${outPath.replace(root, "<root>")}`);
}
process.exit(0);

function render() {
  const L = [];
  L.push(`# Construir prototipo HTML5 — ${slug}`);
  L.push(``);
  L.push(`Eres: ${agent}. Objetivo: construir el prototipo HTML5 de la feature ${slug} como PRODUCTO VISIBLE real, no una especificacion.`);
  L.push(``);
  L.push(`## Dominio y golden`);
  L.push(`- Dominio: ${domain}`);
  L.push(`- Golden de referencia (copia + adapta, NO escribas desde cero): ${golden}`);
  L.push(`- Comando base: npm run scaffold:prototype -- --feature ${slug} --domain <dominio> --replace-mock`);
  L.push(``);
  L.push(`## Contrato a implementar (obligatorio)`);
  L.push(`Debe REPRESENTAR estos requisitos del spec-funcional.md (no omitir ninguno):`);
  L.push(`- RF/HU: ${c.spec.rfs.join(", ") || "(ninguno declarado en el spec)"}`);
  L.push(`- Actores: ${c.spec.actors.map((a) => a.raw).join(", ") || "(ninguno)"}`);
  if (c.declared.hasSection) {
    L.push(``);
    L.push(`Contrato declarado en decisiones-ux.md (implementa cada item en index.html):`);
    L.push(`- Estados: ${c.declared.states.join(", ") || "loading, empty, error, success"}`);
    L.push(`- Roles: ${c.declared.roles.join(", ") || "(declarar)"}`);
    L.push(`- Entidades: ${c.declared.entities.join(", ") || "(declarar)"}`);
  } else {
    L.push(``);
    L.push(`PRIMERO declara el contrato en decisiones-ux.md > '## Contrato del prototipo':`);
    L.push(`  - Estados: loading, empty, error, success`);
    L.push(`  - Roles: ${c.spec.actors.map((a) => a.token).join(", ") || "<actores>"}`);
    L.push(`  - Entidades: <entidad principal del dominio>`);
    L.push(`  - RF representados: ${c.spec.rfs.join(", ") || "RF-NN"}`);
  }
  L.push(``);
  L.push(`## Puedes MODIFICAR (touch_policy fase 2)`);
  for (const p of tp.allowed_paths) L.push(`- ${p}`);
  L.push(`## NO puedes modificar`);
  for (const p of tp.forbidden_paths) L.push(`- ${p}`);
  L.push(``);
  L.push(`## Reglas duras`);
  L.push(`- Producto VISIBLE: nada de fixtures ocultos, .validation-only, display:none con records para inflar metricas.`);
  L.push(`- Estados como COMPORTAMIENTO (addEventListener/data-view), no como texto.`);
  L.push(`- Sin Tailwind CDN ni frameworks externos: HTML5 autocontenido (o _shared/ en modo portfolio-spa).`);
  L.push(`- No copiar el prototipo de otra feature (rompe check:prototype-diversity).`);
  L.push(`- NO firmes la revision visual humana ni apruebes gates: eso lo hace un humano.`);
  L.push(``);
  L.push(`## Definition of Done`);
  L.push(`- [ ] decisiones-ux.md tiene '## Contrato del prototipo' que cubre los RF/actores del spec`);
  L.push(`- [ ] cada Estado/Rol/Entidad del contrato aparece en index.html`);
  L.push(`- [ ] $ npm run check:prototype-contract -- --strict`);
  L.push(`- [ ] $ npm run check:prototype-html5 -- --strict --spec specs/${slug}`);
  L.push(`- [ ] $ npm run check:prototype-visible-product -- --strict`);
  L.push(`- [ ] $ npm run check:prototype-domain-mismatch`);
  L.push(`- [ ] prototype-validation.md con '## Revision visual humana' en pending (la firma un humano)`);
  L.push(`- [ ] $ npm run prototype:hub && npm run check:project`);
  return L.join("\n");
}

function readIf(p) { try { return existsSync(p) ? readFileSync(p, "utf8") : ""; } catch { return ""; } }

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
