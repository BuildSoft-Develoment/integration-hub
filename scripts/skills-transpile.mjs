#!/usr/bin/env node
/**
 * skills-transpile.mjs (v12.138)
 *
 * Fuente unica de skills = ai/skills/*.skill.md (formato ES: "# Skill X" +
 * "## Objetivo" / "## Aplicala cuando" / "## No la apliques cuando").
 *
 * Este script hace DOS cosas, sin per-agente y sin duplicar la fuente:
 *
 *   --write-frontmatter   Inyecta (idempotente) un bloque YAML al inicio de cada
 *                         *.skill.md con `name: aif-<stem>` + `description` (ES).
 *                         Si ya hay frontmatter valido, lo RESPETA (no pisa lo
 *                         curado). Para las skills foundacionales usa una
 *                         description curada; para el resto la deriva de
 *                         Objetivo + Aplicala cuando.
 *
 *   --emit-claude         Genera el arbol nativo de Claude:
 *                         <out>/<name>/SKILL.md  (frontmatter + cuerpo sin "# Skill").
 *                         Claude Code descubre cada skill por su `description`.
 *                         Limpia carpetas huerfanas (skills borradas en la fuente).
 *                         --out <dir>   default: .claude/skills
 *
 * Otros flags: --root <path> (default cwd), --dry-run, --force.
 *
 * Exit: 0 ok, 1 error (fuente ausente / frontmatter invalido en --emit-claude).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dryRun = !!args["dry-run"];
const force = !!args.force;
const outDir = args.out ? String(args.out) : ".claude/skills";

const skillsDir = join(root, "ai", "skills");
if (!existsSync(skillsDir)) {
  console.error(`Error: no existe ${skillsDir}. Estas en la raiz del proyecto/template?`);
  process.exit(1);
}

// Descriptions curadas para skills foundacionales (Capa 1). El resto se derivan.
const CURATED = {
  "brainstorming": "Usa antes de escribir specs o codigo cuando la necesidad es una idea o problema incompleto, o hay mas de una forma razonable de resolver la feature; explora alternativas y aterriza una opcion ejecutable. No la uses si ya hay spec aprobada y tareas verificables.",
  "writing-plans": "Usa cuando una feature con spec aprobada va a construccion y necesitas convertirla en tareas pequenas, concretas, ordenadas y verificables. No la uses si aun no hay spec o el trabajo sigue en brainstorming.",
  "test-driven-development": "Usa al implementar una feature o cambio de comportamiento con criterio de aceptacion o contrato; obliga el ciclo red-green-refactor con evidencia verificable. No la uses en cambios solo-doc o investigacion sin codigo.",
  "verification-before-completion": "Usa antes de declarar done/approved/listo (cerrar un T-NNN, mover un gate a approved, correr agent:finish o responder 'esta listo'); verifica empiricamente los criterios. Implementa el Principio 1 anti-auto-aprobacion. No la uses en trabajo exploratorio que no declara nada listo.",
  "using-git-worktrees": "Usa cuando una feature pasa de specs a construccion o se asigna a un agente IA, para ejecutar en un workspace aislado y rama limpia sin contaminar la rama principal. No la uses en trabajo de solo lectura/analisis ni si el repo no usa git.",
  "finishing-development-branch": "Usa cuando una feature termino implementacion y QA y se prepara PR/merge: valida, junta evidencia, hace PR/merge y limpia el worktree. No la uses si quedan tareas bloqueantes, QA pendiente o sin autorizacion de merge.",
  "debugging-workflow": "Usa cuando hay un bug reproducible o intermitente, o falla una prueba/build/flujo, y necesitas reproducir el sintoma y reducir el espacio de causa probable con evidencia. No la uses si la solicitud real es discovery o documentacion.",
};

const files = readdirSync(skillsDir).filter((f) => f.endsWith(".skill.md")).sort();

if (args["write-frontmatter"]) {
  runWriteFrontmatter();
} else if (args["emit-claude"]) {
  runEmitClaude();
} else {
  console.error(`Uso: node scripts/skills-transpile.mjs (--write-frontmatter | --emit-claude [--out <dir>]) [--root <path>] [--dry-run] [--force]`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
function runWriteFrontmatter() {
  let written = 0;
  let kept = 0;
  for (const f of files) {
    const abs = join(skillsDir, f);
    const raw = readFileSync(abs, "utf8");
    const stem = f.replace(/\.skill\.md$/, "");
    const fm = parseFrontmatter(raw);
    if (fm && fm.name && fm.description && fm.description.length >= 40) {
      kept += 1;
      continue; // respeta frontmatter curado existente
    }
    const name = `aif-${stem}`;
    const description = CURATED[stem] || deriveDescription(stripFrontmatter(raw));
    const body = stripFrontmatter(raw).replace(/^\s+/, "");
    const out = `---\nname: ${name}\ndescription: ${yamlScalar(description)}\n---\n\n${body}`;
    if (dryRun) {
      console.log(`(dry-run) frontmatter -> ai/skills/${f}  [${CURATED[stem] ? "curada" : "derivada"}]`);
    } else {
      writeFileSync(abs, out, "utf8");
      written += 1;
    }
  }
  console.log(`skills-transpile --write-frontmatter (v12.138)`);
  console.log(`Skills: ${files.length} | escritas: ${written} | ya tenian frontmatter: ${kept}`);
  process.exit(0);
}

function runEmitClaude() {
  const outAbs = resolve(root, outDir); // resolve respeta --out absoluto (p.ej. staging del bundle)
  const errors = [];
  const validNames = new Set();
  const emitted = [];
  for (const f of files) {
    const raw = readFileSync(join(skillsDir, f), "utf8");
    const stem = f.replace(/\.skill\.md$/, "");
    const fm = parseFrontmatter(raw);
    if (!fm || !fm.name || !fm.description) {
      errors.push(`ai/skills/${f}: sin frontmatter name+description. Corre 'npm run skills:frontmatter' primero.`);
      continue;
    }
    validNames.add(fm.name);
    const title = (raw.match(/^#\s+Skill\s+(.+)$/m) || [])[1] || stem;
    const body = stripFrontmatter(raw)
      .replace(/^\s+/, "")
      .replace(/^#\s+Skill\s+.+$/m, `# ${title}`);
    const skillMd = `---\nname: ${fm.name}\ndescription: ${yamlScalar(fm.description)}\n---\n\n${body}`;
    emitted.push({ name: fm.name, skillMd });
  }
  if (errors.length) {
    console.error(`skills-transpile --emit-claude (v12.138): ${errors.length} error(es):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  // Limpia huerfanas (carpetas <out>/<x>/SKILL.md cuyo x ya no es una skill valida).
  if (existsSync(outAbs)) {
    for (const d of readdirSync(outAbs, { withFileTypes: true })) {
      if (d.isDirectory() && !validNames.has(d.name)) {
        if (dryRun) console.log(`(dry-run) eliminaria huerfana ${outDir}/${d.name}/`);
        else rmSync(join(outAbs, d.name), { recursive: true, force: true });
      }
    }
  }
  let wrote = 0;
  for (const { name, skillMd } of emitted) {
    const dst = join(outAbs, name, "SKILL.md");
    if (dryRun) { console.log(`(dry-run) escribiria ${outDir}/${name}/SKILL.md`); continue; }
    mkdirSync(join(outAbs, name), { recursive: true });
    writeFileSync(dst, skillMd, "utf8");
    wrote += 1;
  }
  console.log(`skills-transpile --emit-claude (v12.138)`);
  console.log(`Fuente: ai/skills/ (${files.length}) -> ${outDir}/<name>/SKILL.md`);
  console.log(`Generados: ${wrote}`);
  process.exit(0);
}

// ─── helpers ───────────────────────────────────────────────────────────────
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

function yamlScalar(s) {
  // Double-quoted YAML scalar (single line). Escapa backslash y comilla.
  const safe = String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim();
  return `"${safe}"`;
}

function deriveDescription(body) {
  const objetivo = sectionText(body, "Objetivo");
  const aplica = sectionBullets(body, "Aplicala cuando");
  const objSentence = (objetivo.split(/(?<=\.)\s/)[0] || objetivo).trim();
  let desc = objSentence;
  if (aplica.length) {
    const clause = aplica.slice(0, 2).map((b) => b.replace(/[.,;]\s*$/, "")).join("; ");
    desc = `${objSentence.replace(/\.\s*$/, "")}. Usala cuando ${lowerFirst(clause)}.`;
  }
  desc = desc.replace(/\s+/g, " ").trim();
  if (desc.length < 40) desc = `${desc} (skill del framework AI-first).`;
  if (desc.length > 1000) desc = desc.slice(0, 997).trimEnd() + "...";
  return desc;
}

function sectionText(body, heading) {
  const re = new RegExp(`^##\\s+${escapeRe(heading)}\\b\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "m");
  const m = body.match(re);
  if (!m) return "";
  return m[1].split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("- ")).join(" ").trim();
}

function sectionBullets(body, heading) {
  const re = new RegExp(`^##\\s+${escapeRe(heading)}\\b\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "m");
  const m = body.match(re);
  if (!m) return [];
  return m[1].split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("- ")).map((l) => l.replace(/^- /, "").trim());
}

function lowerFirst(s) { return s ? s[0].toLowerCase() + s.slice(1) : s; }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

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
