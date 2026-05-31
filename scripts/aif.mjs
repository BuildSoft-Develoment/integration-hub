#!/usr/bin/env node
/**
 * aif.mjs (v12.115)
 *
 * CLI unificada del framework AI-first empresarial. Es un DISPATCHER ligero: cada
 * subcomando envuelve un script existente y pasa los argumentos transparentemente.
 * La ventaja sobre los npm scripts directos: una sola superficie con `--help` y
 * tab completion (cuando el agente lista subcomandos), y un nombre estable
 * para los proveedores IA que asumen un CLI estilo `specify` (spec-kit) pero
 * orientado al ciclo completo (fases 0-8, no solo spec-driven).
 *
 * Nombre: AI-First Framework -> aif. Antes (v12.111-v12.114) se llamaba `spdd`,
 * pero ese acronimo nombra solo el patron de fase 2 (Spec + Prototype Driven
 * Development) — under-sells el alcance real (lifecycle 0-8 + memoria BD +
 * multiagente + gates + trazabilidad + UX prototyping + QA + deploy + operacion).
 *
 * Uso:
 *   npx aif <subcomando> [opciones]
 *   node scripts/aif.mjs <subcomando> [opciones]
 *
 *   aif feature   ...   -> scripts/scaffold-feature.mjs
 *   aif prototype ...   -> scripts/scaffold-prototype.mjs
 *   aif clarify   ...   -> scripts/project-clarify.mjs
 *   aif analyze   ...   -> scripts/project-analyze.mjs
 *   aif checklist ...   -> scripts/project-checklist.mjs
 *   aif specify-compat ...   -> scripts/specify-compat.mjs
 *   aif status    ...   -> scripts/roadmap-status.mjs
 *   aif next      ...   -> scripts/roadmap-next.mjs
 *   aif prompt    ...   -> scripts/roadmap-prompt.mjs
 *   aif upgrade   ...   -> scripts/template-upgrade.mjs
 *   aif install-agent ...   -> scripts/install-agent.mjs
 *   aif preset    ...   -> scripts/preset.mjs
 *   aif check           -> npm run check:all (en el cwd)
 *   aif help            -> imprime esta ayuda.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";
import process from "node:process";

const here = dirname(fileURLToPath(import.meta.url));

const COMMANDS = {
  feature:           { script: "scaffold-feature.mjs", desc: "scaffold de feature (10 canonicos + placeholder de prototipo)" },
  prototype:         { script: "scaffold-prototype.mjs", desc: "scaffold de prototipo HTML5 (golden de referencia o --freeform)" },
  clarify:           { script: "project-clarify.mjs", desc: "preguntas de desambiguacion sobre spec-funcional (fase 1)" },
  analyze:           { script: "project-analyze.mjs", desc: "coherencia cross-artefacto (spec/tecnica/api/traceability)" },
  checklist:         { script: "project-checklist.mjs", desc: "checklist de calidad por feature (auto + humano)" },
  "specify-compat":  { script: "specify-compat.mjs", desc: "alias .specify/{spec,plan,tasks}.md hacia los canonicos" },
  status:            { script: "roadmap-status.mjs", desc: "estado del roadmap (fases, prototipos, gates)" },
  next:              { script: "roadmap-next.mjs", desc: "siguiente tarea segura (contrato completo)" },
  prompt:            { script: "roadmap-prompt.mjs", desc: "render del contrato para un agente concreto" },
  upgrade:           { script: "template-upgrade.mjs", desc: "sincroniza un proyecto instanciado con el template canonico" },
  "install-agent":   { script: "install-agent.mjs", desc: "instala slash-commands para un agente (claude/codex/opencode/gemini/copilot/cursor)" },
  preset:            { script: "preset.mjs", desc: "lista, muestra y valida presets de projects/brands" },
};

const argv = process.argv.slice(2);
const sub = argv[0];

if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
  printHelp();
  process.exit(sub ? 0 : 1);
}

if (sub === "check") {
  // Atajo: corre `npm run check:all` en el cwd actual.
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "check:all"], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}

const def = COMMANDS[sub];
if (!def) {
  console.error(`aif: subcomando desconocido "${sub}".`);
  printHelp();
  process.exit(1);
}

const scriptPath = join(here, def.script);
if (!existsSync(scriptPath)) {
  console.error(`aif: el script ${def.script} no existe aun en este template. Posiblemente este proyecto fue instanciado de una version anterior — corre 'npm run template:upgrade -- --apply --force-framework'.`);
  process.exit(127);
}

const r = spawnSync(process.execPath, [scriptPath, ...argv.slice(1)], { stdio: "inherit" });
process.exit(r.status ?? 1);

function printHelp() {
  const cmds = Object.entries(COMMANDS);
  const w = Math.max(...cmds.map(([k]) => k.length));
  console.log(`aif (v12.115) — CLI del framework AI-first empresarial.

Tagline: framework AI-first empresarial con fases 0-8, roadmap operativo, memoria BD,
trazabilidad, gates con firma humana, prototipos, QA, deploy y operacion — orientado a
agentes IA (Claude / Codex / OpenCode / Gemini / Copilot / Cursor).

Uso:
  npx aif <subcomando> [opciones]
  node scripts/aif.mjs <subcomando> [opciones]

Subcomandos disponibles:
${cmds.map(([k, v]) => `  ${k.padEnd(w + 2)} ${v.desc}`).join("\n")}

Atajos:
  aif check                   -> npm run check:all
  aif help                    -> imprime esta ayuda

Cada subcomando reenvia argumentos al script subyacente. Ej:
  aif feature --slug 042-bar --titulo "Bar"
  aif clarify --feature 042-bar --strict
  aif install-agent --agent claude
`);
}
