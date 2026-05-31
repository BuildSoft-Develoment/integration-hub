#!/usr/bin/env node
/**
 * agent-protocol.mjs (v12.118)
 *
 * Selector de PROTOCOLO de ejecucion para una tarea dada. Es la regla 0 de la
 * Capa 1 (execution discipline): antes de actuar, el agente debe correr este
 * comando para saber que protocolo(s) aplica.
 *
 * Uso:
 *   node scripts/agent-protocol.mjs --task "<descripcion breve de la tarea>"
 *   node scripts/agent-protocol.mjs --task "..." --json
 *
 * Salida (texto o JSON):
 *   {
 *     "task": "...",
 *     "protocol": "brainstorming",
 *     "secondary_protocols": ["planning"],
 *     "required_before_action": true,
 *     "reason": "...",
 *     "next_steps": ["...", "..."],
 *     "documentation": "ai/protocols/brainstorming.md"
 *   }
 *
 * Heuristica (regex sobre la descripcion):
 *   - palabras tipo "implementar"/"corregir bug"/"refactor"/"agregar funcionalidad"
 *     → planning (+ tdd si toca codigo de produccion)
 *   - palabras tipo "diseñar"/"nueva feature"/"UX"/"flujo"/"prototipo"
 *     → brainstorming (+ planning despues)
 *   - palabras tipo "ejecutar tarea T-NNN"/"dispatch"
 *     → subagent-execution
 *   - palabras tipo "review"/"revisar T-NNN"
 *     → code-review
 *   - palabras tipo "cerrar feature"/"finish"/"PR"
 *     → finishing-branch
 *   - cualquier tarea de codigo en fase 5 → siempre incluye tdd
 *
 * Si la heuristica es ambigua, devuelve planning como default (siempre seguro).
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const json = !!args.json;

if (args.help || !args.task) {
  console.log(`agent-protocol (v12.118) — selecciona el protocolo de execution discipline.

Uso:
  node scripts/agent-protocol.mjs --task "<descripcion breve de la tarea>"
  node scripts/agent-protocol.mjs --task "..." --json

Output: protocolo aplicable + reason + next_steps + documentation path.
Ver AGENT_RUNTIME.md y ai/protocols/ para el contexto.
`);
  process.exit(args.help ? 0 : 1);
}

const task = String(args.task).trim();
const lower = task.toLowerCase();

// Reglas en orden de prioridad (la primera que match gana).
const RULES = [
  {
    pattern: /(finish|cerrar|cierre|terminar)\b.*(feature|branch|rama)|^(pr |merge |descartar)/i,
    protocol: "finishing-branch",
    secondary: ["code-review"],
    reason: "Cerrar feature/branch requiere verify + review + opciones humanas (PR/merge/keep/discard).",
    next_steps: [
      "Verifica que TODOS los T-NNN de la feature esten en ai_task_runs.status=approved.",
      "Corre `npm run agent:finish -- --feature <slug>`.",
      "NO mergees ni hagas PR sin la confirmacion humana que el protocolo exige.",
    ],
  },
  {
    pattern: /^(review|revisar|code review|revision)\b/i,
    protocol: "code-review",
    secondary: [],
    reason: "Review post-tarea requiere 2 stages (spec-compliance + code-quality) con reviewer != implementer.",
    next_steps: [
      "Corre `npm run agent:review-spec -- --task <T-NNN> --feature <slug>` (Stage 1).",
      "Si pass, corre `npm run agent:review-quality -- --task <T-NNN> --feature <slug>` (Stage 2).",
      "NUNCA seas reviewer de tu propio implementer_done (Principio 1 anti-self-approval).",
    ],
  },
  {
    pattern: /^(ejecutar|dispatch|implementar)\s+(la\s+)?(tarea\s+)?T-?\d{2,}/i,
    protocol: "subagent-execution",
    secondary: ["tdd"],
    reason: "Dispatch de T-NNN concreto requiere worktree aislado + context pack + ciclo TDD.",
    next_steps: [
      "Corre `npm run agent:start -- --feature <slug> --task <T-NNN> --agent <implementer>`.",
      "Trabaja SOLO en el worktree. NO toques archivos fuera de touch_policy.allowed_paths.",
      "Aplica el ciclo TDD (RED → GREEN → REFACTOR) — ver ai/protocols/tdd.md.",
      "Marca implementer_done. NO te auto-apruebes; el code-review lo hara un subagente diferente.",
    ],
  },
  {
    pattern: /\b(diseñar|disenar|nueva feature|crear feature|UX|flujo de usuario|prototipo|jornada|JTBD|propuesta)/i,
    protocol: "brainstorming",
    secondary: ["planning"],
    reason: "Crear/modificar feature visual o comportamiento de cara al usuario requiere refinamiento Socratic ANTES de codigo.",
    next_steps: [
      "NO escribas codigo todavia.",
      "Plantea 3-7 preguntas Socratic al humano (problema, JTBD, criterios, out-of-scope, riesgos).",
      "Documenta RFs refinados en specs/<slug>/spec-funcional.md (no placeholders).",
      "Pide confirmacion humana explicita antes de pasar a planning.",
      "Verifica: `npm run project:clarify -- --feature <slug> --strict` debe devolver 0 blockers.",
    ],
  },
  {
    pattern: /\b(implementar|construir|agregar funcionalidad|escribir codigo|escribir test|corregir bug|fix|refactor|optimizar)/i,
    protocol: "planning",
    secondary: ["tdd"],
    reason: "Toda tarea no-trivial requiere spec-tareas.md ejecutable ANTES de tocar codigo.",
    next_steps: [
      "Lee spec-funcional.md y spec-tecnica.md cerradas.",
      "Actualiza specs/<slug>/spec-tareas.md como TABLA EJECUTABLE (v12.119+) con paths/comandos exactos.",
      "Verifica: `npm run check:tasks-executable -- --feature <slug>` debe EXIT 0.",
      "Si la tarea toca codigo de produccion, aplica protocolo `tdd` despues.",
    ],
  },
  {
    pattern: /\b(documentar|escribir doc|actualizar README|ADR)/i,
    protocol: "planning",
    secondary: [],
    reason: "Cambios documentales requieren plan minimo (que archivos + check:docs/check:markdown-paths verde).",
    next_steps: [
      "Identifica los archivos doc a tocar.",
      "Si tocas docs/, respeta el nav-guided (bloque Anterior/Siguiente).",
      "Corre `npm run check:docs && npm run check:markdown-paths` al cerrar.",
    ],
  },
];

let match = null;
for (const r of RULES) {
  if (r.pattern.test(task)) { match = r; break; }
}
if (!match) {
  match = {
    protocol: "planning",
    secondary: [],
    reason: "Heuristica ambigua. Default seguro: planning (siempre genera spec-tareas.md ejecutable antes de actuar).",
    next_steps: [
      "Lee AGENT_RUNTIME.md y ai/protocols/planning.md.",
      "Si la tarea modifica comportamiento o crea UX, primero aplica brainstorming.",
      "Si la tarea toca codigo de produccion, aplica tdd despues.",
    ],
  };
}

const proto = match.protocol;
const docPath = `ai/protocols/${proto}.md`;
const docExists = existsSync(join(root, docPath));

const result = {
  task,
  protocol: proto,
  secondary_protocols: match.secondary,
  required_before_action: true,
  reason: match.reason,
  next_steps: match.next_steps,
  documentation: docExists ? docPath : `(missing: ${docPath})`,
  agent_runtime: "AGENT_RUNTIME.md",
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`agent-protocol (v12.118)`);
console.log(`Task: ${task}`);
console.log("");
console.log(`Protocolo PRINCIPAL: ${proto}`);
if (match.secondary && match.secondary.length) {
  console.log(`Protocolos secundarios: ${match.secondary.join(", ")}`);
}
console.log(`Required before action: YES`);
console.log("");
console.log(`Razon: ${match.reason}`);
console.log("");
console.log(`Pasos OBLIGATORIOS antes de actuar:`);
match.next_steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
console.log("");
console.log(`Documentacion: ${result.documentation}`);
console.log(`Runtime general: AGENT_RUNTIME.md`);
process.exit(0);

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
