#!/usr/bin/env node
/**
 * check-skills.mjs (v12.138)
 *
 * Verifica que cada ai/skills/*.skill.md tenga la estructura canonica:
 *   - Frontmatter YAML (v12.138): name (aif-<stem>, kebab, unico) + description (40-1024)
 *   - Titulo "# Skill <Name>"
 *   - "## Objetivo"
 *   - "## Aplicala cuando"
 *   - "## No la apliques cuando"
 *   - cuerpo no trivial
 *
 * Skills foundacionales obligatorias (v12.125+) — las que respaldan los protocolos
 * de la Capa 1:
 *   - brainstorming, writing-plans, test-driven-development, verification-before-completion,
 *     using-git-worktrees, finishing-development-branch, debugging-workflow.
 *
 * Default STRICT. Vive en check:template.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const FOUNDATIONAL_SKILLS = [
  "brainstorming",
  "writing-plans",
  "test-driven-development",
  "verification-before-completion",
  "using-git-worktrees",
  "finishing-development-branch",
  "debugging-workflow",
];

const REQUIRED_SECTIONS = [
  /^##\s+Objetivo\b/im,
  /^##\s+Aplicala cuando\b/im,
  /^##\s+No la apliques cuando\b/im,
];

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true);

const dir = join(root, "ai", "skills");
const blockers = [];
const warnings = [];

if (!existsSync(dir)) {
  blockers.push(`ai/skills/:1: directorio no existe`);
  finish();
}

const files = readdirSync(dir).filter((f) => f.endsWith(".skill.md"));
const presentStems = new Set(files.map((f) => f.replace(/\.skill\.md$/, "")));

for (const req of FOUNDATIONAL_SKILLS) {
  if (!presentStems.has(req)) {
    blockers.push(`ai/skills/${req}.skill.md:1: skill foundacional faltante (v12.125+)`);
  }
}

// v12.138: frontmatter discovery (name + description) para skills nativas de Claude.
// Cada skill DEBE empezar con un bloque YAML: name (aif-<stem>, kebab, unico) +
// description (40-1024 chars). Lo genera/inyecta 'npm run skills:frontmatter'.
const seenNames = new Map(); // name -> file

for (const f of files) {
  const rel = `ai/skills/${f}`;
  const text = readFileSync(join(dir, f), "utf8");
  const stem = f.replace(/\.skill\.md$/, "");

  // Frontmatter (v12.138).
  const fm = parseFrontmatter(text);
  if (!fm) {
    blockers.push(`${rel}:1: falta frontmatter YAML (--- name/description ---). Corre 'npm run skills:frontmatter'.`);
  } else {
    const expectedName = `aif-${stem}`;
    if (!fm.name) {
      blockers.push(`${rel}:1: frontmatter sin 'name'`);
    } else {
      if (!/^aif-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.name)) blockers.push(`${rel}:1: name "${fm.name}" debe ser kebab-case con prefijo aif- (/^aif-[a-z0-9-]+$/)`);
      if (fm.name !== expectedName) blockers.push(`${rel}:1: name "${fm.name}" debe coincidir con el archivo: "${expectedName}"`);
      if (seenNames.has(fm.name)) blockers.push(`${rel}:1: name "${fm.name}" duplicado (tambien en ${seenNames.get(fm.name)})`);
      seenNames.set(fm.name, rel);
    }
    if (!fm.description) {
      blockers.push(`${rel}:1: frontmatter sin 'description'`);
    } else if (fm.description.length < 40 || fm.description.length > 1024) {
      blockers.push(`${rel}:1: description debe tener 40-1024 chars (tiene ${fm.description.length})`);
    }
  }

  // Cuerpo canonico (ignorando el frontmatter).
  const body = stripFrontmatter(text);
  if (!/^#\s+Skill\b/im.test(body)) {
    blockers.push(`${rel}:1: titulo debe empezar con "# Skill <Nombre>"`);
  }
  for (const re of REQUIRED_SECTIONS) {
    if (!re.test(body)) {
      const sectName = re.source.replace(/[\\^$.|?*+(){}\[\]]/g, "").replace(/im$/, "").replace(/^##\s+/, "").replace(/\\b$/, "");
      blockers.push(`${rel}:1: falta seccion "${sectName}"`);
    }
  }
  if (body.replace(/\s+/g, "").length < 200) {
    warnings.push(`${rel}:1: skill corta (revisa que tenga sustancia minima)`);
  }
}

finish();

function finish() {
  console.log(`check-skills (v12.138) ${strict ? "[STRICT]" : "[WARN]"}`);
  console.log(`Skills totales: ${presentStems ? presentStems.size : 0} | foundacionales requeridas: ${FOUNDATIONAL_SKILLS.length}`);
  if (blockers.length === 0 && warnings.length === 0) {
    console.log(`OK. Todas las skills foundacionales presentes con estructura canonica.`);
    process.exit(0);
  }
  if (blockers.length > 0) {
    console.error(`\nBloqueantes (${blockers.length}):`);
    for (const b of blockers) console.error(`  ✗ ${b}`);
  }
  if (warnings.length > 0) {
    console.error(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.error(`  ⚠ ${w}`);
  }
  console.error(`\nFix sugerido: usa una skill existente como plantilla (estructura: Objetivo / Aplicala cuando / No la apliques cuando / ... / Referencias).`);
  process.exit(strict && blockers.length > 0 ? 1 : 0);
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

// v12.138: frontmatter helpers (single-line YAML scalars name/description).
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = unquote(kv[2].trim());
  }
  return out;
}
function stripFrontmatter(raw) {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}
function unquote(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const inner = s.slice(1, -1);
    return s[0] === '"' ? inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\") : inner;
  }
  return s;
}
