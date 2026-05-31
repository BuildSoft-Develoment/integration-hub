#!/usr/bin/env node
/**
 * project-checklist.mjs (v12.109)
 *
 * Genera o evalua una CHECKLIST de calidad por feature, ortogonal a los validadores
 * automaticos: items que un HUMANO confirma (no validador), pero formalizados como
 * marca de "feature lista". Es la contraparte de spec-kit /speckit.checklist.
 *
 * Modos:
 *   --feature <slug>            evalua y emite a stdout (advisory).
 *   --feature <slug> --write    escribe specs/<slug>/checklist.md (no sobrescribe si ya existe a menos que --force).
 *   --all                       evalua todas las features.
 *   --json                      salida estructurada.
 *   --strict                    exit 2 si hay items en falso (uso de gate).
 *
 * El checklist evalua AUTOMATICAMENTE cuando puede (cada item dice "auto" vs "humano");
 * lo que es solo humano queda como `[ ]` (sin marcar) y es responsabilidad del revisor.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = !!args.strict;
const json = !!args.json;
const writeMode = !!args.write;
const force = !!args.force;

if (args.help || (!args.feature && !args.all)) {
  console.log(`project-checklist (v12.109) — checklist de calidad por feature.

Uso:
  node scripts/project-checklist.mjs --feature <NNN-slug>            (stdout)
  node scripts/project-checklist.mjs --feature <NNN-slug> --write    (escribe checklist.md)
  node scripts/project-checklist.mjs --all
  node scripts/project-checklist.mjs --feature <NNN-slug> --strict   (exit 2 si auto-items en falso)
  node scripts/project-checklist.mjs --feature <NNN-slug> --json
`);
  process.exit(args.help ? 0 : 1);
}

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

const reports = [];
for (const slug of targets) {
  const dir = join(specsDir, slug);
  const items = evaluateChecklist(dir);
  reports.push({ feature: slug, dir, items });
  if (writeMode) {
    const out = renderMarkdown(slug, items);
    const dst = join(dir, "checklist.md");
    if (existsSync(dst) && !force) {
      console.error(`✗ ${slug}: ya existe checklist.md (usa --force para sobrescribir).`);
    } else if (existsSync(dir)) {
      writeFileSync(dst, out, "utf8");
      console.log(`✓ ${slug}: escrito ${dst.replace(root, "<root>")}`);
    } else {
      console.error(`✗ ${slug}: no existe el directorio ${dir}`);
    }
  }
}

const autoFails = reports.reduce((acc, r) => acc + r.items.filter((it) => it.kind === "auto" && it.checked === false).length, 0);

if (json) {
  console.log(JSON.stringify({ root, reports, autoFails }, null, 2));
  process.exit(strict && autoFails > 0 ? 2 : 0);
}

if (writeMode) {
  console.log(`\nEvaluados ${reports.length} feature(s). Auto-items en falso: ${autoFails}`);
  process.exit(strict && autoFails > 0 ? 2 : 0);
}

console.log(`project-checklist (v12.109) ${strict ? "[STRICT]" : "[ADVISORY]"}`);
console.log("");
for (const r of reports) {
  console.log(`# ${r.feature}`);
  for (const it of r.items) {
    const mark = it.kind === "auto" ? (it.checked ? "[x]" : "[ ]") : "[ ]";
    console.log(`- ${mark} ${it.text} ${it.kind === "auto" ? "(auto)" : "(humano)"}`);
    if (it.kind === "auto" && it.checked === false && it.hint) {
      console.log(`      hint: ${it.hint}`);
    }
  }
  console.log("");
}
console.log(`Auto-items en falso: ${autoFails}`);
process.exit(strict && autoFails > 0 ? 2 : 0);

// ─────────────────────────────────────────────────────────────────────────
function evaluateChecklist(featureDir) {
  const has = (name) => existsSync(join(featureDir, name));
  const read = (name) => has(name) ? readFileSync(join(featureDir, name), "utf8") : "";

  const sf = read("spec-funcional.md");
  const st = read("spec-tecnica.md");
  const tr = read("traceability.md");
  const ac = read("api-contract.md");
  const sk = read("spec-tareas.md");
  const pv = read("prototype-validation.md");
  const proto = has(join("prototype-html5", "index.html"));

  const items = [];

  // Auto-items: validan por presencia y sustancia.
  items.push({ kind: "auto", text: "Existe spec-funcional.md con Objetivo no vacio.", checked: sf && hasNonEmptySection(sf, "Objetivo"), hint: "rellena ## Objetivo." });
  items.push({ kind: "auto", text: "Existe al menos un RF con descripcion real.", checked: hasRealRf(sf), hint: "agrega RF-XX: <comportamiento observable real>." });
  items.push({ kind: "auto", text: "Existe spec-tecnica.md con una Tabla identificable.", checked: /Tabla\s+`[a-z_][a-z_0-9]*`/.test(st), hint: "declara la tabla principal en spec-tecnica." });
  items.push({ kind: "auto", text: "Existe traceability.md con matriz de 10 columnas.", checked: /\|\s*RF\s*\|\s*HU\s*\|\s*UX\/SPDD\s*\|\s*Prototipo\s*\|\s*API\s*\|\s*BD\s*\|\s*Codigo\s*\|\s*Test\s*\|\s*Estado\s*\|\s*Evidencia\s*\|/i.test(tr), hint: "asegura el encabezado canonico." });
  items.push({ kind: "auto", text: "Existe api-contract.md con al menos un endpoint.", checked: /###\s+(GET|POST|PUT|PATCH|DELETE)\s+\//.test(ac), hint: "agrega `### METHOD /ruta`." });
  items.push({ kind: "auto", text: "Existe spec-tareas.md con al menos una tarea identificable.", checked: /^##\s+T-\d{3}\b/m.test(sk) || /^-\s*\[\s\]/m.test(sk), hint: "regenera con scaffold:feature o agrega tareas T-NNN." });
  items.push({ kind: "auto", text: "Existe prototype-html5/index.html (feature visual).", checked: proto, hint: "npm run scaffold:prototype --feature <slug> --domain <dominio>." });
  items.push({ kind: "auto", text: "prototype-validation.md declara Revisor humano.", checked: /Revisor:\s*\S/i.test(pv), hint: "rellena Revisor humano + Resultado en prototype-validation.md." });
  items.push({ kind: "auto", text: "Sin placeholders <...> obvios en spec-funcional.", checked: !sf || !/^[\s>*-]*<[A-Z][^>]+>\s*$/m.test(sf), hint: "responde los placeholders del scaffold." });

  // Humano-items: lo confirma un humano.
  items.push({ kind: "humano", text: "Las reglas de negocio fueron validadas con stakeholder real." });
  items.push({ kind: "humano", text: "Los roles/permisos reflejan la organizacion real (no solo el scaffold)." });
  items.push({ kind: "humano", text: "Los criterios de aceptacion cubren caso feliz, error y permisos." });
  items.push({ kind: "humano", text: "El prototipo HTML5 fue revisado visualmente por un humano y parece producto real." });
  items.push({ kind: "humano", text: "El alcance fuera de scope esta explicito (no implicito)." });
  items.push({ kind: "humano", text: "El estimado de volumen / latencia de spec-tecnica refleja datos reales del dominio." });

  return items;
}

function hasNonEmptySection(text, heading) {
  const re = new RegExp(`^##\\s+${heading}\\b[^\\n]*$`, "im");
  const m = re.exec(text);
  if (!m) return false;
  const start = m.index + m[0].length;
  const next = text.slice(start).search(/^##\s+/m);
  const body = next === -1 ? text.slice(start) : text.slice(start, start + next);
  return body.replace(/[<>\s\-*]/g, "").length >= 20;
}

function hasRealRf(text) {
  if (!text) return false;
  const rfs = [...text.matchAll(/^[\s>*-]*\*\*?(RF-[A-Z0-9-]+)\*\*?\s*:\s*(.+)$/gim)];
  return rfs.some((m) => {
    const desc = (m[2] || "").trim();
    return desc && !/^<[^>]+>$/.test(desc) && desc.length > 8;
  });
}

function renderMarkdown(slug, items) {
  const lines = [
    `# Checklist de calidad — ${slug}`,
    "",
    "> Generado por \`node scripts/project-checklist.mjs --feature " + slug + " --write\` (v12.109).",
    "> Re-evalua con \`npm run project:checklist -- --feature " + slug + "\` cuando completes secciones.",
    "",
    "## Items automatizables (validados por scripts)",
    "",
  ];
  for (const it of items.filter((i) => i.kind === "auto")) {
    lines.push(`- [${it.checked ? "x" : " "}] ${it.text}`);
  }
  lines.push("");
  lines.push("## Items humanos (no automatizables — los confirma el revisor)");
  lines.push("");
  for (const it of items.filter((i) => i.kind === "humano")) {
    lines.push(`- [ ] ${it.text}`);
  }
  lines.push("");
  lines.push("## Revision");
  lines.push("- Revisor humano:");
  lines.push("- Fecha:");
  lines.push("- Resultado: pending  <!-- approved | blocked | pending -->");
  return lines.join("\n") + "\n";
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
