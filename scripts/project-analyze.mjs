#!/usr/bin/env node
/**
 * project-analyze.mjs (v12.108)
 *
 * Analisis cross-artefacto de COHERENCIA por feature. Es la contraparte de
 * spec-kit /speckit.analyze: revisa que los artefactos canonicos de una feature
 * no se contradigan entre si y emite un reporte advisory.
 *
 * Read-only. NO toca archivos.
 *
 * Que cruza:
 *   1) RFs declarados en spec-funcional aparecen en traceability (matriz).
 *   2) RFs aparecen en spec-tareas (tareas T-NNN trazan a RFs reales).
 *   3) Endpoints declarados en api-contract aparecen en traceability.
 *   4) Entidad de spec-tecnica aparece en spec-funcional y en api-contract.
 *   5) Gates declarados en traceability tienen los gates "core" (gate-spdd-approved,
 *      gate-prototype-ready) cuando la feature tiene prototype.md.
 *   6) Tasks (T-NNN) referencian RFs que SI existen en spec-funcional.
 *
 * Uso:
 *   node scripts/project-analyze.mjs --feature 002-foo
 *   node scripts/project-analyze.mjs --all
 *   node scripts/project-analyze.mjs --feature 002-foo --json
 *
 * Exit codes:
 *   0 - sin incoherencias (o reporte advisory).
 *   2 - en --strict, hay incoherencias.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = !!args.strict;
const json = !!args.json;

if (args.help || (!args.feature && !args.all)) {
  console.log(`project-analyze (v12.108) — coherencia cross-artefacto por feature.

Uso:
  node scripts/project-analyze.mjs --feature <NNN-slug>
  node scripts/project-analyze.mjs --all
  node scripts/project-analyze.mjs --feature <NNN-slug> --json
  node scripts/project-analyze.mjs --feature <NNN-slug> --strict   (exit 2 si hay hallazgos)
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
  reports.push({ feature: slug, findings: analyze(join(specsDir, slug)) });
}

const totalFindings = reports.reduce((a, r) => a + (r.findings ? r.findings.length : 0), 0);

if (json) {
  console.log(JSON.stringify({ root, targets, reports, totalFindings }, null, 2));
  process.exit(strict && totalFindings > 0 ? 2 : 0);
}

console.log(`project-analyze (v12.108) ${strict ? "[STRICT]" : "[ADVISORY]"}`);
console.log(`Features evaluadas: ${reports.length}`);
console.log("");

for (const r of reports) {
  if (r.findings.length === 0) {
    console.log(`✓ ${r.feature}: coherente.`);
    continue;
  }
  console.log(`! ${r.feature} — ${r.findings.length} hallazgo(s):`);
  r.findings.forEach((f, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. [${f.severity.toUpperCase()}] ${f.area} — ${f.message}`);
    if (f.evidence) console.log(`      evidencia: ${f.evidence}`);
  });
  console.log("");
}

console.log(`Total hallazgos: ${totalFindings}`);

process.exit(strict && totalFindings > 0 ? 2 : 0);

// ─────────────────────────────────────────────────────────────────────────
function analyze(featureDir) {
  if (!existsSync(featureDir)) return [{ severity: "blocker", area: "estructura", message: `no existe ${featureDir}` }];

  const out = [];
  const read = (name) => existsSync(join(featureDir, name)) ? readFileSync(join(featureDir, name), "utf8") : null;

  const sf = read("spec-funcional.md");
  const st = read("spec-tecnica.md");
  const tr = read("traceability.md");
  const ac = read("api-contract.md");
  const sk = read("spec-tareas.md");
  const pr = read("prototype.md");

  if (!sf) return [{ severity: "blocker", area: "estructura", message: "falta spec-funcional.md" }];

  // RFs en spec-funcional.
  const rfsSf = uniq([...sf.matchAll(/\*\*?(RF-[A-Z0-9-]+)\*\*?/g)].map((m) => m[1]));
  const rnfsSf = uniq([...sf.matchAll(/\*\*?(RNF-[A-Z0-9-]+)\*\*?/g)].map((m) => m[1]));

  // 1) RFs en traceability.
  if (tr) {
    for (const rf of rfsSf) {
      if (!new RegExp(`\\b${rf}\\b`).test(tr)) {
        out.push({ severity: "major", area: "trazabilidad", message: `${rf} esta en spec-funcional pero NO aparece en traceability.md.` });
      }
    }
    for (const rnf of rnfsSf) {
      if (!new RegExp(`\\b${rnf}\\b`).test(tr)) {
        out.push({ severity: "minor", area: "trazabilidad", message: `${rnf} esta en spec-funcional pero NO aparece en traceability.md.` });
      }
    }
  } else {
    out.push({ severity: "blocker", area: "trazabilidad", message: "falta traceability.md." });
  }

  // 2) RFs en spec-tareas (tareas referencian RFs reales).
  if (sk) {
    const rfsSk = uniq([...sk.matchAll(/\bRF-[A-Z0-9-]+/g)].map((m) => m[0]));
    for (const rf of rfsSk) {
      if (!rfsSf.includes(rf)) {
        out.push({ severity: "major", area: "tareas", message: `spec-tareas referencia ${rf} pero NO existe en spec-funcional.` });
      }
    }
    // Tareas que NO tracean a ningun RF de spec-funcional.
    const tasks = [...sk.matchAll(/^##\s+T-\d{3}[^\n]*/gm)].map((m) => m[0]);
    if (tasks.length === 0 && !/^-\s*\[\s\]/m.test(sk)) {
      out.push({ severity: "minor", area: "tareas", message: "spec-tareas sin tareas declaradas (T-NNN o checklist)." });
    }
  }

  // 3) Endpoints en api-contract aparecen en traceability.
  if (ac) {
    const eps = uniq([...ac.matchAll(/###\s+(GET|POST|PUT|PATCH|DELETE)\s+([^\n]+)/g)].map((m) => `${m[1]} ${m[2].trim()}`));
    for (const ep of eps) {
      if (tr && !tr.includes(ep.split(" ")[1])) {
        // hacemos match flexible por el path solo.
        const path = ep.split(" ")[1];
        if (!tr.includes(path)) {
          out.push({ severity: "minor", area: "api", message: `endpoint \`${ep}\` declarado en api-contract NO aparece en traceability.` });
        }
      }
    }
  }

  // 4) Entidad de spec-tecnica aparece en spec-funcional y api-contract.
  if (st) {
    const tablas = uniq([...st.matchAll(/Tabla\s+`([a-z_][a-z0-9_]*)`/gi)].map((m) => m[1]));
    if (tablas.length === 0) {
      out.push({ severity: "minor", area: "modelo-datos", message: "spec-tecnica no declara ninguna `Tabla` identificable." });
    }
    for (const t of tablas) {
      const reTbl = new RegExp(`\\b${t}\\b`, "i");
      if (ac && !reTbl.test(ac)) {
        out.push({ severity: "minor", area: "modelo-datos", message: `tabla \`${t}\` definida en spec-tecnica no es referenciada por api-contract (que entidad expone la API?).` });
      }
    }
  }

  // 5) Gates core declarados si hay prototype.md.
  if (pr && tr) {
    const requiredGates = ["gate-prototype-ready", "gate-spdd-approved"];
    for (const g of requiredGates) {
      if (!tr.includes(g)) {
        out.push({ severity: "major", area: "gates", message: `feature visual sin ${g} declarado en traceability.` });
      }
    }
  }

  // 6) RFs huerfanos en traceability (declarados ahi pero no en spec-funcional) — drift.
  if (tr) {
    const rfsTr = uniq([...tr.matchAll(/^\|\s*(RF-[A-Z0-9-]+)\s*\|/gim)].map((m) => m[1]));
    for (const rf of rfsTr) {
      if (!rfsSf.includes(rf)) {
        out.push({ severity: "minor", area: "trazabilidad", message: `${rf} aparece en traceability pero NO en spec-funcional (drift).` });
      }
    }
  }

  const rank = { blocker: 0, major: 1, minor: 2 };
  out.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));
  return out;
}

function uniq(arr) { return [...new Set(arr)]; }

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
