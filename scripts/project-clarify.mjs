#!/usr/bin/env node
/**
 * project-clarify.mjs (v12.107)
 *
 * Lee la spec funcional (y, opcionalmente, los artefactos relacionados) de una feature
 * y emite una lista PRIORIZADA de preguntas de desambiguacion. Es la contraparte de
 * spec-kit /speckit.clarify, adaptada al canon de este template.
 *
 * Es READ-ONLY: no toca archivos, solo reporta. Pensado para correr ANTES de cerrar
 * fase 1 (analisis) y de entrar a fase 3 (arquitectura).
 *
 * Que detecta:
 *   - Placeholders sin resolver (`<...>`, `${ctx.x}`, "TBD", "TODO", "<descripcion>").
 *   - Requerimientos (RF/RNF) sin texto descriptivo (firma del scaffold sin rellenar).
 *   - Secciones criticas vacias: Objetivo, Reglas de negocio, Actores, Criterios de aceptacion.
 *   - Criterios de aceptacion sin patron "Dado/Cuando/Entonces".
 *   - Reglas de negocio en placeholder.
 *   - Actores con permisos sin definir.
 *   - Fuera de alcance no declarado.
 *
 * Uso:
 *   node scripts/project-clarify.mjs --feature 002-foo
 *   node scripts/project-clarify.mjs --all
 *   node scripts/project-clarify.mjs --feature 002-foo --json
 *
 * Exit codes:
 *   0 - cero preguntas (spec clara) o se pidio reporte advisory.
 *   2 - en --strict, hay preguntas pendientes (para usar como gate).
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = !!args.strict;
const json = !!args.json;

if (args.help || (!args.feature && !args.all)) {
  console.log(`project-clarify (v12.107) — preguntas de desambiguacion ANTES de cerrar fase 1.

Uso:
  node scripts/project-clarify.mjs --feature <NNN-slug>
  node scripts/project-clarify.mjs --all
  node scripts/project-clarify.mjs --feature <NNN-slug> --json
  node scripts/project-clarify.mjs --feature <NNN-slug> --strict   (exit 2 si hay preguntas)

Opciones:
  --feature <slug>   feature objetivo bajo specs/.
  --all              evaluar todas las features con spec-funcional.md.
  --json             salida JSON estructurada.
  --strict           exit 2 si hay preguntas pendientes (uso de gate).
  --root <path>      raiz del proyecto (default cwd).
`);
  process.exit(args.help ? 0 : 1);
}

const specsDir = join(root, "specs");
if (!existsSync(specsDir)) {
  console.error(`Error: no existe ${specsDir}. Estas en la raiz del proyecto?`);
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
  if (!existsSync(dir)) {
    reports.push({ feature: slug, error: `no existe specs/${slug}/` });
    continue;
  }
  const specPath = join(dir, "spec-funcional.md");
  if (!existsSync(specPath)) {
    reports.push({ feature: slug, error: `falta specs/${slug}/spec-funcional.md` });
    continue;
  }
  const text = readFileSync(specPath, "utf8");
  reports.push({ feature: slug, questions: clarify(text, slug, dir) });
}

const totalQuestions = reports.reduce((acc, r) => acc + (r.questions ? r.questions.length : 0), 0);

if (json) {
  console.log(JSON.stringify({ root, targets, reports, totalQuestions }, null, 2));
  process.exit(strict && totalQuestions > 0 ? 2 : 0);
}

console.log(`project-clarify (v12.107) ${strict ? "[STRICT]" : "[ADVISORY]"}`);
console.log(`Features evaluadas: ${reports.length}`);
console.log("");

for (const r of reports) {
  if (r.error) {
    console.error(`✗ ${r.feature}: ${r.error}`);
    continue;
  }
  if (r.questions.length === 0) {
    console.log(`✓ ${r.feature}: spec clara (cero preguntas).`);
    continue;
  }
  console.log(`? ${r.feature} — ${r.questions.length} pregunta(s) de desambiguacion:`);
  r.questions.forEach((q, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. [${q.severity.toUpperCase()}] ${q.area} — ${q.question}`);
    if (q.evidence) console.log(`      evidencia: ${q.evidence}`);
  });
  console.log("");
}

console.log(`Total preguntas pendientes: ${totalQuestions}`);
console.log("");
console.log(`Como cerrarlas:`);
console.log(`  - Edita specs/<slug>/spec-funcional.md respondiendo cada pregunta.`);
console.log(`  - Documenta las decisiones en 'specs/<slug>/traceability.md' (## Decisiones).`);
console.log(`  - Re-corre 'node scripts/project-clarify.mjs --feature <slug>' hasta cero.`);

process.exit(strict && totalQuestions > 0 ? 2 : 0);

// ─────────────────────────────────────────────────────────────────────────
function clarify(text, slug, featureDir) {
  const out = [];

  // 1) Placeholders sin resolver.
  const phMatches = [...text.matchAll(/<([A-Za-z][^>\n]{1,80})>/g)]
    .filter((m) => !/^[\/!]/.test(m[1]) && !/^a\s/.test(m[1].toLowerCase()) && !/^\/?(td|tr|th|table|br|hr|p|div|span|li|ul|ol|h\d)\b/i.test(m[1]));
  if (phMatches.length > 0) {
    const sample = phMatches.slice(0, 3).map((m) => `\`<${m[1]}>\``).join(", ");
    out.push({
      severity: "blocker",
      area: "placeholders",
      question: `Hay ${phMatches.length} placeholder(s) sin resolver. Que valor real corresponde a ${sample}${phMatches.length > 3 ? "..." : ""}?`,
      evidence: `linea(s): ${phMatches.slice(0, 3).map((m) => lineOf(text, m.index)).join(", ")}`,
    });
  }

  // 2) ${ctx.x} sin expandir (residuo de template literal).
  if (/\$\{ctx\.[\w.]+\}/.test(text)) {
    out.push({ severity: "blocker", area: "template-literals", question: "Hay tokens ${ctx.x} sin expandir (template literal no renderizado). Regenera con 'scaffold:feature'." });
  }

  // 3) TBD/TODO/pendiente.
  const tbd = [...text.matchAll(/\b(TBD|TODO|FIXME|pendiente|por definir|por confirmar)\b/gi)];
  if (tbd.length > 0) {
    out.push({
      severity: "major",
      area: "marcadores-pendientes",
      question: `Quedan ${tbd.length} marcador(es) ${[...new Set(tbd.map((m) => m[1]))].join("/")}. Cada uno requiere decision o referencia.`,
    });
  }

  // 4) Objetivo vacio / sin sustancia.
  const obj = sectionBody(text, "Objetivo");
  if (obj !== null && obj.replace(/[<>\s]/g, "").length < 20) {
    out.push({ severity: "blocker", area: "objetivo", question: "El Objetivo esta vacio o es solo placeholder. Que problema concreto resuelve esta feature para el usuario final?" });
  }

  // 5) Requerimientos sin descripcion (linea termina en el placeholder).
  const rfRe = /^[\s>*-]*\*\*?(RF-\w+|RNF-\w+)\*\*?\s*:\s*(.*)$/gim;
  for (const m of text.matchAll(rfRe)) {
    const desc = (m[2] || "").trim();
    const stripped = desc.replace(/\s+/g, " ");
    if (!stripped || /^<[^>]+>$/.test(stripped)) {
      out.push({
        severity: "blocker",
        area: "requerimientos",
        question: `${m[1]} no tiene descripcion. Que comportamiento observable describe?`,
        evidence: `linea ${lineOf(text, m.index)}`,
      });
    }
  }

  // 6) Reglas de negocio en placeholder.
  const reglas = sectionBody(text, "Reglas de negocio");
  if (reglas !== null) {
    const nonPlaceholder = reglas.split(/\n/).filter((l) => /^[\s>*-]/.test(l) && !/^[\s>*-]+<[^>]+>\s*$/.test(l) && l.trim().length > 10);
    if (nonPlaceholder.length < 1) {
      out.push({ severity: "major", area: "reglas", question: "No hay reglas de negocio reales (solo placeholders). Cuales son los invariantes del dominio?" });
    }
  }

  // 7) Actores con permisos placeholder.
  const actores = sectionBody(text, "Actores");
  if (actores !== null) {
    if (/<Rol-[AB]>/.test(actores) || actores.replace(/[\s|]/g, "").length < 30) {
      out.push({ severity: "major", area: "actores", question: "La tabla de Actores tiene roles/permisos sin definir. Quien usa esta feature y que puede hacer cada uno?" });
    }
  }

  // 8) Criterios de aceptacion sin Dado/Cuando/Entonces real.
  const crit = sectionBody(text, "Criterios de aceptacion");
  if (crit !== null) {
    const dcec = (crit.match(/Dado\s+<[^>]+>/gi) || []).length;
    const real = (crit.match(/Dado\s+[^<\n][^,\n]{5,}/gi) || []).length;
    if (real < 1) {
      out.push({ severity: "blocker", area: "criterios", question: `Criterios de aceptacion sin contenido real (solo placeholders Dado <X>). Define al menos 1 escenario "Dado/Cuando/Entonces" del caso feliz.` });
    }
    if (dcec > 0 && real > 0) {
      out.push({ severity: "minor", area: "criterios", question: `Aun quedan ${dcec} criterio(s) en placeholder. Compleeta o elimina.` });
    }
  }

  // 9) Fuera de alcance sin declarar.
  const fa = sectionBody(text, "Fuera de alcance");
  if (fa !== null && fa.replace(/[<>\s\-*]/g, "").length < 10) {
    out.push({ severity: "minor", area: "fuera-de-alcance", question: "No declaras nada como fuera de alcance. Que NO hace esta iteracion (mover a backlog)?" });
  }

  // 10) Cross-check minimo con spec-tecnica: si la entidad referenciada en spec-funcional
  // no aparece en spec-tecnica, marcar para clarify.
  const sft = join(featureDir, "spec-tecnica.md");
  if (existsSync(sft)) {
    const tec = readFileSync(sft, "utf8");
    // entidad esperada — el slug sin el prefijo numerico, en snake_case.
    const guess = slug.replace(/^\d+-/, "").replace(/-/g, "_");
    if (!new RegExp(`\\b${guess}\\b`, "i").test(tec) && !/Tabla `[a-z_][a-z_0-9]*`/i.test(tec)) {
      out.push({ severity: "minor", area: "modelo-datos", question: `spec-tecnica.md no nombra ninguna tabla identificable. Cual es la entidad principal de esta feature en BD?` });
    }
  }

  // Orden por severidad.
  const rank = { blocker: 0, major: 1, minor: 2 };
  out.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));
  return out;
}

function sectionBody(text, heading) {
  const re = new RegExp(`^##\\s+${escapeRe(heading)}\\b[^\\n]*$`, "im");
  const m = re.exec(text);
  if (!m) return null;
  const start = m.index + m[0].length;
  const next = text.slice(start).search(/^##\s+/m);
  return next === -1 ? text.slice(start) : text.slice(start, start + next);
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function lineOf(text, index) { return text.slice(0, index).split(/\r?\n/).length; }

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
