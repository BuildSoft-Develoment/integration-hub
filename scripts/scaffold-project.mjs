#!/usr/bin/env node
/**
 * scaffold-project.mjs (v12.50)
 *
 * Orquesta el bootstrap completo de un proyecto nuevo desde el template:
 *   1. init-project (si el proyecto destino aun no esta instanciado).
 *   2. memory:bootstrap (BD + indices + embeddings).
 *   3. check:template (4 validadores).
 *   4. check:project (10 validadores).
 *   5. check:instantiation strict.
 *   6. Reporte final con metricas y proximos pasos.
 *
 * Cierra el patron real: opencode/codex/gemini corrieron piezas sueltas en
 * orden distinto (uno bootstrapeo sin sincronizar despues, otro genero specs
 * sin correr check). Este comando orquesta el flujo correcto end-to-end.
 *
 * Uso (despues de clonar el template):
 *   node scripts/scaffold-project.mjs                # corre todo en el cwd actual
 *   node scripts/scaffold-project.mjs --skip-init    # solo bootstrap + checks (proyecto ya instanciado)
 *   node scripts/scaffold-project.mjs --dry-run      # imprime pasos sin ejecutarlos
 *   node scripts/scaffold-project.mjs --config template.config.example.json  # init-project con config
 *
 * Exit codes:
 *   0 - todos los pasos OK
 *   N - codigo del paso que fallo (1-6)
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dry = !!args["dry-run"];
const skipInit = !!args["skip-init"];

const steps = [
  {
    id: 1,
    label: "init-project (si aplica)",
    skip: skipInit,
    skipReason: skipInit ? "--skip-init" : null,
    cmd: () => {
      const cfg = args.config || "template.config.example.json";
      if (!existsSync(resolve(root, cfg))) {
        return { ok: false, reason: `No existe ${cfg} en ${root}. Pasa --skip-init si el proyecto ya esta instanciado, o --config <path>.` };
      }
      return execStep("node", ["scripts/init-project.mjs", "--config", cfg]);
    },
  },
  {
    id: 2,
    label: "memory:bootstrap (BD + indices + embeddings)",
    cmd: () => execStep("npm", ["run", "memory:bootstrap"]),
  },
  {
    id: 3,
    label: "check:template (4 validadores)",
    cmd: () => execStep("npm", ["run", "check:template"]),
  },
  {
    id: 4,
    label: "check:project (10 validadores)",
    cmd: () => execStep("npm", ["run", "check:project"]),
  },
  {
    id: 5,
    label: "check:instantiation strict",
    cmd: () => execStep("node", ["ci/scripts/check-template-instantiation.mjs", "--mode", "instantiated", "--root", "."]),
  },
  {
    id: 6,
    label: "check:prototype-diversity (detecta clones)",
    cmd: () => existsSync(resolve(root, "specs"))
      ? execStep("node", ["ci/scripts/check-prototype-diversity.mjs", "--root", "."])
      : { ok: true, reason: "specs/ no existe — saltando" },
  },
];

console.log(`scaffold-project (v12.50) — bootstrap orquestado`);
console.log(`Root: ${root}`);
console.log(`Modo: ${dry ? "DRY-RUN (sin ejecutar)" : "EJECUTAR"}`);
console.log(``);

let failedAt = null;
for (const step of steps) {
  if (step.skip) {
    console.log(`[${step.id}/${steps.length}] ⊘ ${step.label} (skip: ${step.skipReason})`);
    continue;
  }
  console.log(`[${step.id}/${steps.length}] → ${step.label}`);
  if (dry) {
    console.log(`     (dry-run) no ejecutado`);
    continue;
  }
  const start = Date.now();
  const result = step.cmd();
  const ms = Date.now() - start;
  if (result.ok) {
    console.log(`[${step.id}/${steps.length}] ✓ OK (${(ms / 1000).toFixed(1)}s) ${result.reason ? `— ${result.reason}` : ""}`);
  } else {
    console.error(`[${step.id}/${steps.length}] ✗ FAIL — ${result.reason || "exit code != 0"}`);
    failedAt = step.id;
    break;
  }
}

console.log("");
if (failedAt) {
  console.error(`Bootstrap fallo en paso ${failedAt}. Revisa el output arriba y corrige antes de continuar.`);
  console.error(`Tip: corre el paso manualmente para ver mas detalle.`);
  process.exit(failedAt);
}
if (dry) {
  console.log(`Dry-run completo. Para ejecutar, vuelve a correr sin --dry-run.`);
  process.exit(0);
}

console.log(`Bootstrap completo. El proyecto esta listo.`);
console.log(``);
console.log(`Proximos pasos para el agente:`);
console.log(`  1. Revisa AI_CONTEXT.md, PROJECT_MAP.md, TRACEABILITY_MATRIX.md.`);
console.log(`  2. Para CADA feature en tu backlog:`);
console.log(`     npm run scaffold:feature -- --slug NNN-mi --titulo "X" --rfs RF-N --hus HU-N --entidad x --endpoint "GET /api/x"`);
console.log(`     npm run scaffold:prototype -- --feature NNN-mi --domain <dom> --titulo "X" --marca "Y"`);
console.log(`     (adaptar mock data + decisiones-ux.md)`);
console.log(`     npm run memory:sync && npm run check:project`);
console.log(`  3. Al terminar, corre el pre-flight de AGENTS.md > 'Pre-flight checklist OBLIGATORIO'.`);
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
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

function execStep(cmd, argv) {
  // shell:true en Windows para resolver npm correctamente.
  const isWindows = process.platform === "win32";
  const result = spawnSync(cmd, argv, {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
  });
  if (result.error) return { ok: false, reason: result.error.message };
  if (result.status !== 0) return { ok: false, reason: `exit code ${result.status}` };
  return { ok: true };
}
