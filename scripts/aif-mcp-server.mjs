#!/usr/bin/env node
/**
 * aif-mcp-server.mjs (v12.137)
 *
 * MCP (Model Context Protocol) server que expone el framework AI-first empresarial
 * como herramientas para cualquier agente MCP-compatible (Claude Code, Codex CLI,
 * OpenCode, Gemini CLI, Cursor, Copilot).
 *
 * Transport: STDIO (JSON-RPC 2.0 newline-delimited en stdin/stdout; logs a stderr).
 * Per-project: el server lee process.cwd() — cada proyecto opera aislado sobre su
 * propio `./scripts/`, `./ai/memory/framework-agent.db`, etc.
 *
 * v12.131 entrega 8 tools READ-ONLY (sin side effects). Las tools WRITE
 * (agent_start, agent_review, agent_finish, check_all_run) llegan en v12.133+
 * con `confirm: true` mandatory.
 *
 * Tools:
 *   aif_constitution       — devuelve CONSTITUTION.md
 *   aif_agent_runtime      — devuelve AGENT_RUNTIME.md
 *   aif_roadmap_status     — estado de 9 fases (JSON)
 *   aif_roadmap_next       — siguiente tarea segura + contrato (JSON)
 *   aif_memory_query       — query SQLite via preset (18 presets; 4 requieren arg)
 *   aif_list_protocols     — los 6 protocolos canonicos
 *   aif_list_skills        — skills foundacionales (opt foundational_only)
 *   aif_agent_protocol     — selector heuristico de protocolo dado una tarea
 *
 * Uso:
 *   node scripts/aif-mcp-server.mjs                 (modo MCP STDIO, espera JSON-RPC)
 *   node scripts/aif-mcp-server.mjs --list-tools    (lista tools con JSON Schema; debug)
 *   node scripts/aif-mcp-server.mjs --version
 *
 * Logs: stderr (NUNCA stdout — stdout es protocolo MCP exclusivo).
 */

process.removeAllListeners("warning");

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import process from "node:process";

// v12.138: version dinamica. La fuente de verdad es el framework instalado, NO un literal
// (evita el desync de v12.137 hardcodeado). Orden de resolucion:
//   .claude-plugin/manifest.json (version del FRAMEWORK, viaja en el bundle)
//   -> package.json (fallback) -> "0.0.0-unknown".
// Se resuelve relativo al script (no a cwd) para ser robusto sin importar desde donde se invoque.
// En un proyecto instalado, package.json es la version de la app del proyecto; por eso el
// primario es manifest.json, que SI representa la version del framework.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
function resolveVersion() {
  const candidates = [
    join(SCRIPT_DIR, "..", ".claude-plugin", "manifest.json"),
    join(SCRIPT_DIR, "..", "package.json"),
  ];
  for (const p of candidates) {
    try {
      if (!existsSync(p)) continue;
      const v = JSON.parse(readFileSync(p, "utf8")).version;
      if (typeof v === "string" && v.trim()) return v.trim();
    } catch { /* candidato invalido: sigue al siguiente */ }
  }
  return "0.0.0-unknown";
}
const VERSION = resolveVersion();
const PROTOCOL_VERSION = "2024-11-05";

const root = process.cwd();

// ─── Tool definitions ─────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "aif_constitution",
    description: "Returns CONSTITUTION.md — the 10 non-negotiable principles of the AI-First Framework. Read this FIRST before any work on the project. Includes anti-self-approval rule (Principio 1), human gates, traceability, executable phase contracts.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: () => readFileOrError("CONSTITUTION.md"),
  },
  {
    name: "aif_agent_runtime",
    description: "Returns AGENT_RUNTIME.md — the execution discipline layer (Capa 1). Explains the 6 protocolos (brainstorming, planning, tdd, subagent-execution, code-review, finishing-branch), skills system, and the agent:* command flow.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: () => readFileOrError("AGENT_RUNTIME.md"),
  },
  {
    name: "aif_roadmap_status",
    description: "Returns the current roadmap state as JSON con 7 claves top-level: `project`, `templateVersion`, `phases` (las 9, Iniciacion → Operacion, con status y detalle), `features` (slug, fase, gates declarados en traceability.md, archivos canonicos faltantes), `prototypeStates` (el semaforo de prototipo por feature — NO vive dentro de features[]), `blockers` y `nextAction`. Equivalente a `npm run roadmap:status -- --json`. Nota: `agent_readiness` NO viene aqui — lo produce aif_roadmap_next.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: () => runJsonScript("scripts/roadmap-status.mjs", ["--json"]),
  },
  {
    name: "aif_roadmap_next",
    description: "Returns the next SAFE task for the agent with the full execution contract: next_action, feature, phase, agent_readiness, allowed_actions, forbidden_actions, must_read, commands_to_run, exit_criteria, phase_contract, touch_policy, recommended_agent. Always run this BEFORE acting on any task.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: () => runJsonScript("scripts/roadmap-next.mjs", ["--json"]),
  },
  {
    name: "aif_memory_query",
    description: "Query the SQLite memory BD. `preset` es OBLIGATORIO (18 disponibles). Cuatro de ellos exigen ademas `arg`: docs-for, apis-for, by-evidence y decisions-about.",
    inputSchema: {
      type: "object",
      properties: {
        preset: {
          type: "string",
          enum: ["docs-for", "apis-for", "features-pending-qa", "validated-prototypes", "decisions-pending",
                 "failed-gates", "rf-without-code", "rf-without-test", "rf-implemented", "rf-validated",
                 "rf-planned", "rf-not-implemented", "links-drift", "artifacts-pending", "artifacts-documented",
                 "artifacts-approved", "by-evidence", "decisions-about"],
          description: "Uno de los 18 presets. Requieren `arg`: docs-for, apis-for, by-evidence, decisions-about",
        },
        arg: { type: "string", description: "Argumento del preset (obligatorio para docs-for, apis-for, by-evidence y decisions-about)" },
      },
      additionalProperties: false,
    },
    handler: (args) => runMemoryQuery(args),
  },
  {
    name: "aif_list_protocols",
    description: "Lists the 6 canonical execution protocols (Capa 1) under ai/protocols/. Returns title + 'Cuando aplica' section for each. These are OBLIGATORY by task type — agent must select one via aif_agent_protocol before acting.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: () => listProtocols(),
  },
  {
    name: "aif_list_skills",
    description: "Lists skills under ai/skills/. With foundational_only=true returns only the 7 foundational skills (brainstorming, writing-plans, test-driven-development, verification-before-completion, using-git-worktrees, finishing-development-branch, debugging-workflow). Skills are activable by context (not obligatory per task type).",
    inputSchema: {
      type: "object",
      properties: {
        foundational_only: { type: "boolean", description: "If true, returns only the 7 foundational skills." },
      },
      additionalProperties: false,
    },
    handler: (args) => listSkills(!!args.foundational_only),
  },
  {
    name: "aif_agent_protocol",
    description: "Heuristic selector: given a brief task description, returns the applicable PROTOCOL (one of the 6) + secondary protocols + required next_steps + documentation path. ALWAYS call this before acting on a new task — protocols are OBLIGATORY per Regla 0 of AGENT_RUNTIME.md.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Brief description of the task (e.g., 'implementar RF-02', 'cerrar feature 002', 'review T-001')" },
      },
      required: ["task"],
      additionalProperties: false,
    },
    handler: (args) => runJsonScript("scripts/agent-protocol.mjs", ["--task", args.task, "--json"]),
  },
  // ─── v12.133: 4 safe (read-mostly) + 3 write con confirm:true ───────────
  {
    name: "aif_project_clarify",
    description: "Read-only. Detecta ambigueedades en spec-funcional.md de una feature (placeholders, criterios sin Dado/Cuando/Entonces, actores sin definir, RFs vacios). Devuelve preguntas priorizadas.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string", description: "NNN-slug de la feature (ej. 002-cambio-estado-expediente)" },
        all: { type: "boolean", description: "Si true, evalua TODAS las features (ignora 'feature')" },
      },
      additionalProperties: false,
    },
    handler: (args) => runProjectScript("project-clarify.mjs", args),
  },
  {
    name: "aif_project_analyze",
    description: "Read-only. Analisis cross-artefacto de coherencia: RFs spec↔traceability↔tareas, endpoints↔traceability, entidad↔api, gates si hay prototype. Devuelve hallazgos por severidad.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string", description: "NNN-slug de la feature" },
        all: { type: "boolean", description: "Si true, evalua TODAS" },
      },
      additionalProperties: false,
    },
    handler: (args) => runProjectScript("project-analyze.mjs", args),
  },
  {
    name: "aif_project_checklist",
    description: "Read-only. Checklist de calidad por feature: items auto (validados por scripts) + items humanos. Devuelve estado de cada item.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string", description: "NNN-slug de la feature" },
      },
      required: ["feature"],
      additionalProperties: false,
    },
    handler: (args) => runProjectScript("project-checklist.mjs", args),
  },
  {
    name: "aif_check_all",
    description: "Ejecuta 'npm run check:all' completo (48 validadores encadenados: 9 de check:template + 39 de check:project; la cadena para al primer fallo). Read-only sobre el repo pero costosa (~30s). Devuelve EXIT code + las ultimas lineas de STDOUT unicamente: los validadores imprimen sus blockers por STDERR, que aqui se descarta. Si falla, sirve para saber que validador corto — no por que. Corre el comando en terminal para ver el detalle.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: () => runNpmCheckAll(),
  },
  {
    name: "aif_plugin_check_updates",
    description: "Read-only. Compara version local del framework (.claude-plugin/manifest.json) contra el registry interno definido en AIF_PLUGIN_REGISTRY (file://, UNC, http://, https://). Devuelve JSON: { registry, local_version, remote_version, status, remote_bundle, remote_sha256, remote_size_bytes, remote_released_at, template_compatibility }. NO trae `command_to_update`: el comando de instalacion solo se imprime en el modo texto del script. NO instala — el humano decide. Sin AIF_PLUGIN_REGISTRY definido, devuelve estado 'no-registry-configured'.",
    inputSchema: {
      type: "object",
      properties: {
        registry: { type: "string", description: "Override del registry (path o URL). Si se omite, lee process.env.AIF_PLUGIN_REGISTRY." },
      },
      additionalProperties: false,
    },
    handler: (args) => runPluginCheckUpdates(args),
  },
  {
    name: "aif_agent_start",
    description: "WRITE. Inicio orquestado de T-NNN: worktree aislado + entry en ai_task_runs + context pack + protocolo aplicable, y al final un baseline informativo (npm run check:all sobre la raiz del repo; si falla solo avisa). NO toma el lock de feature: eso es 'npm run roadmap:claim'. REQUIERE confirm=true. Sin confirm, devuelve el PLAN de lo que haria. Anti-collision: rechaza si hay run activo con OTRO agente para el mismo T.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string", description: "NNN-slug" },
        task: { type: "string", description: "T-NNN" },
        agent: { type: "string", description: "Nombre del implementer (ej. codex, claude, opencode)" },
        confirm: { type: "boolean", description: "DEBE ser true para ejecutar. Sin esto, solo devuelve el plan." },
      },
      required: ["feature", "task", "agent"],
      additionalProperties: false,
    },
    handler: (args) => runAgentWrite("agent-start.mjs", args, ["--feature", args.feature, "--task", args.task, "--agent", args.agent]),
  },
  {
    name: "aif_agent_review",
    description: "WRITE. 2-stage code review (spec-compliance / code-quality / both). Anti-self-approval (Principio 1): rechaza si reviewer == implementer del run en SQLite. REQUIERE confirm=true.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string", description: "NNN-slug" },
        task: { type: "string", description: "T-NNN" },
        stage: { type: "string", description: "spec-compliance | code-quality | both" },
        reviewer: { type: "string", description: "Agente reviewer (DEBE ser distinto del implementer)" },
        confirm: { type: "boolean", description: "DEBE ser true para ejecutar." },
      },
      required: ["feature", "task", "stage", "reviewer"],
      additionalProperties: false,
    },
    handler: (args) => runAgentWrite("agent-review.mjs", args, ["--feature", args.feature, "--task", args.task, "--stage", args.stage, "--reviewer", args.reviewer]),
  },
  {
    name: "aif_agent_finish",
    description: "WRITE en el nombre, dry-run en los hechos. Invoca 'agent-finish.mjs --feature <slug> --action keep --dry-run' con flags fijos (el schema es additionalProperties:false, no se pueden sobreescribir). Con --dry-run NO verifica que los T esten approved, NO ejecuta ninguno de los 4 checks (solo los lista) y NO corre roadmap:audit. No cambia nada: ni PR, ni merge, ni SQLite, ni archivos. Para un cierre real corre el CLI 'npm run agent:finish -- --feature <slug>' en una terminal, donde el humano elige entre pr/merge/keep/discard.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string", description: "NNN-slug" },
        confirm: { type: "boolean", description: "DEBE ser true para invocar el script; sin esto solo devuelve el plan. Aun con true corre con --dry-run --action keep: no comprueba que los T esten approved, solo lista los 4 checks sin ejecutarlos, omite roadmap:audit y no cambia nada." },
      },
      required: ["feature"],
      additionalProperties: false,
    },
    handler: (args) => runAgentWrite("agent-finish.mjs", args, ["--feature", args.feature, "--action", "keep", "--dry-run"]),
  },
];

// ─── CLI helpers (--list-tools, --version) ────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes("--version") || argv.includes("-v")) {
  console.log(`aif-mcp-server v${VERSION}`);
  process.exit(0);
}
if (argv.includes("--list-tools")) {
  console.log(JSON.stringify(TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })), null, 2));
  process.exit(0);
}
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(`aif-mcp-server (v${VERSION}) — MCP server stdio for AI-First Framework.

Uso:
  node scripts/aif-mcp-server.mjs                 (modo MCP STDIO, espera JSON-RPC)
  node scripts/aif-mcp-server.mjs --list-tools    (imprime tool schemas)
  node scripts/aif-mcp-server.mjs --version

Tools (v12.131 read-only):
${TOOLS.map((t) => `  ${t.name.padEnd(22)} ${t.description.slice(0, 60)}...`).join("\n")}

Transport: STDIO (JSON-RPC 2.0). Logs a stderr.
Per-project: opera sobre process.cwd().
`);
  process.exit(0);
}

// ─── Tool handlers ────────────────────────────────────────────────────────
function readFileOrError(relativePath) {
  const abs = join(root, relativePath);
  if (!existsSync(abs)) {
    return { isError: true, content: [{ type: "text", text: `File not found: ${relativePath}. Is this a properly initialized AI-First Framework project? (cwd=${root})` }] };
  }
  return { content: [{ type: "text", text: readFileSync(abs, "utf8") }] };
}

function runJsonScript(scriptRelPath, extraArgs) {
  const abs = join(root, scriptRelPath);
  if (!existsSync(abs)) {
    return { isError: true, content: [{ type: "text", text: `Script not found: ${scriptRelPath} (cwd=${root}). Verifica que el proyecto tenga el framework instalado (template-upgrade).` }] };
  }
  const r = spawnSync(process.execPath, [abs, ...extraArgs], { cwd: root, stdio: "pipe" });
  if (r.status !== 0 && r.status !== null) {
    return { isError: true, content: [{ type: "text", text: `Script ${scriptRelPath} exit=${r.status}\n${(r.stderr || Buffer.from("")).toString().slice(0, 1500)}` }] };
  }
  return { content: [{ type: "text", text: (r.stdout || Buffer.from("")).toString() }] };
}

const MEMORY_PRESETS_NEEDING_ARG = new Set(["docs-for", "apis-for", "by-evidence", "decisions-about"]);

function runMemoryQuery(args) {
  if (!args.preset) {
    return { isError: true, content: [{ type: "text", text: "`preset` es obligatorio. Ver la lista en la description de la tool." }] };
  }
  if (MEMORY_PRESETS_NEEDING_ARG.has(String(args.preset)) && !args.arg) {
    return { isError: true, content: [{ type: "text", text: `El preset '${args.preset}' requiere ademas \`arg\`.` }] };
  }
  const cmdArgs = [join(root, "scripts", "ai-framework-agent.mjs"), "memory-query"];
  cmdArgs.push("--preset", String(args.preset));
  if (args.arg) cmdArgs.push("--arg", String(args.arg));
  const r = spawnSync(process.execPath, cmdArgs, { cwd: root, stdio: "pipe" });
  if (r.status !== 0 && r.status !== null) {
    return { isError: true, content: [{ type: "text", text: `memory-query exit=${r.status}\n${(r.stderr || Buffer.from("")).toString().slice(0, 1500)}` }] };
  }
  return { content: [{ type: "text", text: (r.stdout || Buffer.from("")).toString() }] };
}

function listProtocols() {
  const dir = join(root, "ai", "protocols");
  if (!existsSync(dir)) return { isError: true, content: [{ type: "text", text: `ai/protocols/ not found en ${root}. Es un proyecto AI-First framework v12.118+?` }] };
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
  const parts = files.map((f) => {
    const text = readFileSync(join(dir, f), "utf8");
    const title = (text.match(/^#\s+Protocolo:\s+(.+)$/m) || [])[1] || f.replace(/\.md$/, "");
    const cuandoMatch = text.match(/^##\s+Cuando aplica\s*\n([\s\S]+?)(?=\n##\s|$)/m);
    const cuando = cuandoMatch ? cuandoMatch[1].trim().split("\n").slice(0, 6).join("\n") : "(seccion no encontrada)";
    return `## ${title}\nFile: \`ai/protocols/${f}\`\n\n${cuando}`;
  });
  return { content: [{ type: "text", text: parts.join("\n\n---\n\n") }] };
}

const FOUNDATIONAL_SKILLS = [
  "brainstorming", "writing-plans", "test-driven-development",
  "verification-before-completion", "using-git-worktrees",
  "finishing-development-branch", "debugging-workflow",
];

// v12.133: project:* commands (read-only)
function runProjectScript(scriptName, args) {
  const abs = join(root, "scripts", scriptName);
  if (!existsSync(abs)) return { isError: true, content: [{ type: "text", text: `Script ${scriptName} no existe. v12.107+ requerido.` }] };
  const cmdArgs = [abs];
  if (args.all) cmdArgs.push("--all");
  else if (args.feature) cmdArgs.push("--feature", String(args.feature));
  else return { isError: true, content: [{ type: "text", text: "Provide 'feature' or 'all'." }] };
  cmdArgs.push("--json");
  const r = spawnSync(process.execPath, cmdArgs, { cwd: root, stdio: "pipe" });
  const out = (r.stdout || Buffer.from("")).toString();
  const err = (r.stderr || Buffer.from("")).toString();
  return { content: [{ type: "text", text: out || err || `(exit ${r.status})` }] };
}

// v12.133: aif_check_all — corre check:all completo
function runNpmCheckAll() {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "check:all"], {
    cwd: root, stdio: "pipe", shell: process.platform === "win32",
  });
  const out = (r.stdout || Buffer.from("")).toString();
  const tail = out.split(/\r?\n/).slice(-30).join("\n");
  return { content: [{ type: "text", text: `EXIT=${r.status}\n\n--- last 30 lines ---\n${tail}` }] };
}

// v12.137: aif_plugin_check_updates — read-only discovery automatico de updates via MCP local.
function runPluginCheckUpdates(args) {
  const registry = args.registry || process.env.AIF_PLUGIN_REGISTRY;
  if (!registry) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "no-registry-configured",
          hint: "Define AIF_PLUGIN_REGISTRY (path o URL al marketplace.json del team) o pasa 'registry' como argumento. Ej: export AIF_PLUGIN_REGISTRY=/shared/internal/aif-plugin/marketplace.json",
        }, null, 2),
      }],
    };
  }
  const abs = join(root, "scripts", "plugin-check-updates.mjs");
  if (!existsSync(abs)) {
    return { isError: true, content: [{ type: "text", text: `scripts/plugin-check-updates.mjs no existe en este proyecto. Es un proyecto framework v12.136+?` }] };
  }
  const r = spawnSync(process.execPath, [abs, "--registry", String(registry), "--json"], { cwd: root, stdio: "pipe" });
  const out = (r.stdout || Buffer.from("")).toString();
  const err = (r.stderr || Buffer.from("")).toString();
  // exit codes: 0 up-to-date, 2 update available, 3 error
  if (r.status === 3 || (!out && err)) {
    return { isError: true, content: [{ type: "text", text: `plugin-check-updates error (exit=${r.status}): ${err.slice(0, 800)}` }] };
  }
  return { content: [{ type: "text", text: out }] };
}

// v12.133: write tools — confirm:true mandatory + anti-self-approval para reviews.
function runAgentWrite(scriptName, args, scriptArgs) {
  if (!args.confirm) {
    // Planning mode: devolver lo que HARIA sin ejecutar.
    return {
      content: [{
        type: "text",
        text: `WRITE TOOL — confirm:true requerido para ejecutar.\n\nScript: scripts/${scriptName}\nArgs: ${scriptArgs.join(" ")}\n\nLlama de nuevo con \`"confirm": true\` para proceder. El framework registrara la operacion en SQLite (ai_action_runs + tablas especificas).`,
      }],
    };
  }
  // Anti-self-approval para agent-review: reviewer != implementer (de SQLite).
  if (scriptName === "agent-review.mjs") {
    try {
      const dbPath = join(root, "ai", "memory", "framework-agent.db");
      if (existsSync(dbPath)) {
        const checkCmd = spawnSync(process.execPath, [
          "--input-type=module", "-e",
          `import { DatabaseSync } from 'node:sqlite';
           const db = new DatabaseSync('${dbPath.replace(/\\/g, "\\\\")}');
           const r = db.prepare("SELECT agent FROM ai_task_runs WHERE feature=? AND task_id=? ORDER BY started_at DESC LIMIT 1").get('${args.feature}', '${args.task}');
           console.log(r ? r.agent : '');
           db.close();`
        ], { stdio: "pipe" });
        const implementer = (checkCmd.stdout || Buffer.from("")).toString().trim();
        if (implementer && implementer === args.reviewer) {
          return { isError: true, content: [{ type: "text", text: `ANTI-SELF-APPROVAL (Principio 1): reviewer "${args.reviewer}" es el mismo agente que el implementer del run para ${args.feature}/${args.task}. Usa OTRO reviewer. Lookup: ai_task_runs.agent = '${implementer}'.` }] };
        }
      }
    } catch (e) {
      // Si el check falla, seguimos — el script subyacente tiene su propio check defensivo.
    }
  }
  const abs = join(root, "scripts", scriptName);
  if (!existsSync(abs)) return { isError: true, content: [{ type: "text", text: `Script ${scriptName} no existe.` }] };
  const r = spawnSync(process.execPath, [abs, ...scriptArgs], { cwd: root, stdio: "pipe" });
  const out = (r.stdout || Buffer.from("")).toString();
  const err = (r.stderr || Buffer.from("")).toString();
  return { content: [{ type: "text", text: `EXIT=${r.status}\n\n--- stdout ---\n${out}\n--- stderr ---\n${err.slice(0, 500)}` }] };
}

function listSkills(foundationalOnly) {
  const dir = join(root, "ai", "skills");
  if (!existsSync(dir)) return { isError: true, content: [{ type: "text", text: `ai/skills/ not found en ${root}.` }] };
  let files = readdirSync(dir).filter((f) => f.endsWith(".skill.md")).sort();
  if (foundationalOnly) {
    files = files.filter((f) => FOUNDATIONAL_SKILLS.includes(f.replace(/\.skill\.md$/, "")));
  }
  const parts = files.map((f) => {
    const text = readFileSync(join(dir, f), "utf8");
    const title = (text.match(/^#\s+Skill\s+(.+)$/m) || [])[1] || f.replace(/\.skill\.md$/, "");
    // v12.138: name + description del frontmatter (discovery nativo Claude).
    const fmName = (text.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
    const fmDesc = (text.match(/^description:\s*(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
    const aplicaMatch = text.match(/^##\s+Aplicala cuando\s*\n([\s\S]+?)(?=\n##\s|$)/m);
    const aplica = aplicaMatch ? aplicaMatch[1].trim().split("\n").slice(0, 4).join("\n") : "(seccion no encontrada)";
    const nameLine = fmName ? `\`${fmName}\` — ` : "";
    const descLine = fmDesc ? `${fmDesc}\n\n` : "";
    return `## ${title}\n${nameLine}File: \`ai/skills/${f}\`\n\n${descLine}${aplica}`;
  });
  const header = foundationalOnly
    ? `# Foundational skills (${files.length}/${FOUNDATIONAL_SKILLS.length})\n\n`
    : `# All skills (${files.length})\n\n`;
  return { content: [{ type: "text", text: header + parts.join("\n\n---\n\n") }] };
}

// ─── JSON-RPC ─────────────────────────────────────────────────────────────
function sendResponse(id, result) {
  const msg = { jsonrpc: "2.0", id, result };
  process.stdout.write(JSON.stringify(msg) + "\n");
}
function sendError(id, code, message, data) {
  const err = { code, message };
  if (data !== undefined) err.data = data;
  const msg = { jsonrpc: "2.0", id, error: err };
  process.stdout.write(JSON.stringify(msg) + "\n");
}
function log(s) { process.stderr.write(`[aif-mcp-server v${VERSION}] ${s}\n`); }

function handleMessage(msg) {
  const { id, method, params } = msg || {};
  if (method === "initialize") {
    return sendResponse(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "aif-framework", version: VERSION },
    });
  }
  if (method === "notifications/initialized" || method === "initialized") {
    log("client signaled initialized");
    return; // notifications don't get responses
  }
  if (method === "tools/list") {
    return sendResponse(id, {
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    });
  }
  if (method === "tools/call") {
    const name = params?.name;
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return sendError(id, -32602, `Unknown tool: ${name}`);
    try {
      const result = tool.handler(params?.arguments || {});
      return sendResponse(id, result);
    } catch (e) {
      return sendResponse(id, { isError: true, content: [{ type: "text", text: `Tool exception: ${e.message}` }] });
    }
  }
  if (method === "ping") return sendResponse(id, {});
  if (method === "resources/list" || method === "prompts/list") {
    // no resources/prompts en v12.131
    return sendResponse(id, { resources: [], prompts: [] });
  }
  return sendError(id, -32601, `Method not found: ${method}`);
}

// ─── Main loop ────────────────────────────────────────────────────────────
log(`starting (cwd=${root}, tools=${TOOLS.length})`);
log(`tools: ${TOOLS.map((t) => t.name).join(", ")}`);

const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (e) {
    log(`parse error: ${e.message} for line: ${trimmed.slice(0, 200)}`);
    return;
  }
  try {
    handleMessage(msg);
  } catch (e) {
    log(`handler error: ${e.message}\n${e.stack || ""}`);
    if (msg && msg.id !== undefined) sendError(msg.id, -32603, "Internal error", e.message);
  }
});
rl.on("close", () => { log("stdin closed, exiting"); process.exit(0); });
process.on("SIGINT", () => { log("SIGINT"); process.exit(0); });
process.on("SIGTERM", () => { log("SIGTERM"); process.exit(0); });
