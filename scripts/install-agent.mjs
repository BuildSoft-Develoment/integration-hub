#!/usr/bin/env node
/**
 * install-agent.mjs (v12.112)
 *
 * Instala los slash-commands del template (`ai/commands/*-command.md`) en la
 * ubicacion especifica que cada agente IA espera. Es la contraparte del
 * `specify init --ai <agent>` de spec-kit, adaptada a este template.
 *
 * Soporta:
 *   claude    -> .claude/commands/{name}.md
 *   codex     -> .codex/commands/{name}.md            (codex usa AGENTS.md como fuente
 *                                                       principal; estos archivos son
 *                                                       referencia / atajo opcional)
 *   opencode  -> .opencode/commands/{name}.md          (idem; opencode lee AGENTS.md)
 *   gemini    -> .gemini/commands/{name}.toml          (Gemini CLI custom commands)
 *   copilot   -> .github/prompts/{name}.prompt.md      (Copilot prompts)
 *   cursor    -> .cursor/rules/{name}.mdc              (Cursor rules)
 *
 * Idempotente. NO sobrescribe a menos que se pase --force. NO borra fuera de la
 * carpeta del agente (cleanup explicito con --remove).
 *
 * Uso:
 *   node scripts/install-agent.mjs --agent claude
 *   node scripts/install-agent.mjs --agent gemini --force
 *   node scripts/install-agent.mjs --agent claude --dry-run
 *   node scripts/install-agent.mjs --agent claude --remove
 *   node scripts/install-agent.mjs --list
 *
 * Convencion de nombres: el comando publico es el slug del prefijo
 *   ai/commands/<name>-command.md   ->   .claude/commands/<name>.md
 *                                        .codex/commands/<name>.md
 *                                        ...
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const force = !!args.force;
const dryRun = !!args["dry-run"];
const removeMode = !!args.remove;

// v12.132: cada agente lleva ademas mcpConfigPath + mcpConfig(serverPath)
// para generar el snippet MCP correspondiente. El path apunta SIEMPRE a
// ./scripts/aif-mcp-server.mjs (relativo al proyecto) — STDIO transport,
// sin puertos, aislamiento per-project por process boundary.
const AGENTS = {
  claude: {
    dir: ".claude/commands",
    fileFor: (name) => `${name}.md`,
    transform: (md) => md,
    note: "Claude Code lee .claude/commands/<name>.md y los expone como /name.",
    mcpConfigPath: ".claude/mcp.json",
    mcpConfig: (s) => mcpJsonClaudeStyle(s),
  },
  codex: {
    dir: ".codex/commands",
    fileFor: (name) => `${name}.md`,
    transform: (md) => md,
    note: "Codex usa AGENTS.md como fuente principal; estos commands son atajos opcionales.",
    // v12.138: Codex CLI lee MCP desde config.toml (TOML) con tablas [mcp_servers.<name>],
    // NO desde un JSON estilo Claude. Path project-scoped oficial: .codex/config.toml
    // (developers.openai.com/codex/mcp). El JSON anterior (.codex-plugin/mcp.json) no era
    // leido por Codex — era un artefacto inventado. Si el usuario ya tiene .codex/config.toml
    // con otros settings, el installer NO lo sobreescribe sin --force (mergea a mano).
    mcpConfigPath: ".codex/config.toml",
    mcpConfig: (s) => mcpTomlCodexStyle(s),
  },
  opencode: {
    dir: ".opencode/commands",
    fileFor: (name) => `${name}.md`,
    transform: (md) => md,
    note: "OpenCode lee AGENTS.md; estos commands son atajos opcionales.",
    mcpConfigPath: ".opencode/mcp.json",
    mcpConfig: (s) => mcpJsonClaudeStyle(s),
  },
  gemini: {
    dir: ".gemini/commands",
    fileFor: (name) => `${name}.toml`,
    transform: (md, name) => geminiToml(md, name),
    note: "Gemini CLI carga .gemini/commands/<name>.toml con campo prompt = trippleString.",
    mcpConfigPath: ".gemini/extensions/aif-framework/gemini-extension.json",
    mcpConfig: (s) => mcpJsonGeminiExtension(s),
  },
  copilot: {
    dir: ".github/prompts",
    fileFor: (name) => `${name}.prompt.md`,
    transform: (md, name) => copilotPrompt(md, name),
    note: "GitHub Copilot lee .github/prompts/*.prompt.md como prompts custom.",
    mcpConfigPath: ".vscode/mcp.json",
    mcpConfig: (s) => mcpJsonVSCodeStyle(s),
  },
  cursor: {
    dir: ".cursor/rules",
    fileFor: (name) => `${name}.mdc`,
    transform: (md, name) => cursorRule(md, name),
    note: "Cursor lee .cursor/rules/*.mdc como reglas/comandos custom.",
    mcpConfigPath: ".cursor/mcp.json",
    mcpConfig: (s) => mcpJsonClaudeStyle(s),
  },
};

if (args.list || args.help) {
  printList();
  process.exit(0);
}

const agent = args.agent && String(args.agent).toLowerCase();
if (!agent || !AGENTS[agent]) {
  console.error(`Error: --agent debe ser uno de: ${Object.keys(AGENTS).join(", ")}.`);
  printList();
  process.exit(1);
}

const cfg = AGENTS[agent];
const targetDir = join(root, cfg.dir);

// Localiza ai/commands del template (canonico). Si corremos desde el template, es
// ./ai/commands. Si corremos desde un proyecto instanciado, tambien existe ./ai/commands
// porque template-upgrade lo copia.
const aiCommandsDir = join(root, "ai", "commands");
if (!existsSync(aiCommandsDir)) {
  console.error(`Error: no existe ${aiCommandsDir}. Estas en la raiz del proyecto?`);
  process.exit(1);
}

if (removeMode) {
  if (existsSync(targetDir)) {
    if (dryRun) console.log(`(dry-run) eliminaria ${cfg.dir}`);
    else { rmSync(targetDir, { recursive: true, force: true }); console.log(`✓ eliminado ${cfg.dir}`); }
  } else {
    console.log(`Nada que eliminar en ${cfg.dir}.`);
  }
  process.exit(0);
}

const commandFiles = readdirSync(aiCommandsDir)
  .filter((f) => f.endsWith("-command.md"))
  .sort();

if (commandFiles.length === 0) {
  console.error(`No hay archivos *-command.md en ${aiCommandsDir}.`);
  process.exit(1);
}

if (!dryRun) mkdirSync(targetDir, { recursive: true });

let written = 0;
let skipped = 0;
for (const f of commandFiles) {
  const name = f.replace(/-command\.md$/, "");
  const srcAbs = join(aiCommandsDir, f);
  const dstAbs = join(targetDir, cfg.fileFor(name));
  const md = readFileSync(srcAbs, "utf8");
  const out = cfg.transform(md, name);
  if (existsSync(dstAbs) && !force) {
    const cur = readFileSync(dstAbs, "utf8");
    if (cur === out) { skipped += 1; continue; }
    console.log(`~ ${cfg.dir}/${cfg.fileFor(name)} (existe diferente — usa --force para sobrescribir)`);
    skipped += 1;
    continue;
  }
  if (dryRun) {
    console.log(`(dry-run) escribiria ${cfg.dir}/${cfg.fileFor(name)}`);
  } else {
    writeFileSync(dstAbs, out, "utf8");
    written += 1;
  }
}

// v12.125: copia tambien skills + protocols a la carpeta del agente (cuando el agente
// soporta markdown). Para Gemini/Copilot/Cursor con formatos especificos, los .skill.md
// y los .md de protocolos se entregan como markdown plano bajo subcarpetas skills/ y
// protocols/ del agente — el agente los descubre y los lee como contexto adicional.
const aiSkillsDir = join(root, "ai", "skills");
const aiProtocolsDir = join(root, "ai", "protocols");
let extras = 0;
// v12.138: Claude consume skills NATIVAS (.claude/skills/<name>/SKILL.md con
// frontmatter name+description). Para Claude generamos ese arbol con el
// transpilador en vez de copiar los *.skill.md planos. El resto de agentes
// reciben los *.skill.md planos como markdown de contexto (sin discovery nativo).
if (agent === "claude" && existsSync(aiSkillsDir)) {
  const transpiler = join(root, "scripts", "skills-transpile.mjs");
  if (existsSync(transpiler)) {
    const emitArgs = [transpiler, "--emit-claude", "--out", ".claude/skills", "--root", root];
    if (dryRun) emitArgs.push("--dry-run");
    const r = spawnSync(process.execPath, emitArgs, { cwd: root, stdio: "inherit" });
    if (r.status !== 0) console.error(`⚠ skills-transpile --emit-claude fallo (status ${r.status}); revisa 'npm run skills:frontmatter' primero.`);
  } else {
    console.error(`⚠ no existe scripts/skills-transpile.mjs; Claude no recibira skills nativas (corre desde un template/proyecto actualizado).`);
  }
} else if (existsSync(aiSkillsDir)) {
  const skillFiles = readdirSync(aiSkillsDir).filter((f) => f.endsWith(".skill.md"));
  const skillsDst = join(targetDir, "..", "skills");
  if (!dryRun && skillFiles.length) mkdirSync(skillsDst, { recursive: true });
  for (const f of skillFiles) {
    const dstAbs = join(skillsDst, f);
    const src = readFileSync(join(aiSkillsDir, f), "utf8");
    if (existsSync(dstAbs) && !force) {
      const cur = readFileSync(dstAbs, "utf8");
      if (cur === src) continue;
      continue; // sin --force, skip silencioso para skills
    }
    if (dryRun) console.log(`(dry-run) escribiria ${cfg.dir}/../skills/${f}`);
    else { writeFileSync(dstAbs, src, "utf8"); extras += 1; }
  }
}
if (existsSync(aiProtocolsDir)) {
  const protoFiles = readdirSync(aiProtocolsDir).filter((f) => f.endsWith(".md"));
  const protosDst = join(targetDir, "..", "protocols");
  if (!dryRun && protoFiles.length) mkdirSync(protosDst, { recursive: true });
  for (const f of protoFiles) {
    const dstAbs = join(protosDst, f);
    const src = readFileSync(join(aiProtocolsDir, f), "utf8");
    if (existsSync(dstAbs) && !force) {
      const cur = readFileSync(dstAbs, "utf8");
      if (cur === src) continue;
      continue;
    }
    if (dryRun) console.log(`(dry-run) escribiria ${cfg.dir}/../protocols/${f}`);
    else { writeFileSync(dstAbs, src, "utf8"); extras += 1; }
  }
}
console.log(`Skills + protocols copiados: ${extras}`);

// v12.132: tambien escribe el snippet MCP config para que el agente pueda
// conectar al aif-mcp-server.mjs local. Path SIEMPRE relativo:
// ./scripts/aif-mcp-server.mjs — el agente lo invoca con cwd=projectRoot.
const skipMcp = !!args["skip-mcp"];
if (!skipMcp && cfg.mcpConfigPath && cfg.mcpConfig) {
  const mcpServerRelPath = "./scripts/aif-mcp-server.mjs";
  const mcpFile = join(root, cfg.mcpConfigPath);
  const content = cfg.mcpConfig(mcpServerRelPath);
  if (existsSync(mcpFile) && !force) {
    console.log(`~ ${cfg.mcpConfigPath} (ya existe — usa --force para sobrescribir, o mergea a mano con el actual)`);
  } else if (dryRun) {
    console.log(`(dry-run) escribiria ${cfg.mcpConfigPath} apuntando a ${mcpServerRelPath}`);
  } else {
    mkdirSync(dirname(mcpFile), { recursive: true });
    writeFileSync(mcpFile, content, "utf8");
    console.log(`✓ MCP config: ${cfg.mcpConfigPath} → ${mcpServerRelPath}`);
  }
} else if (skipMcp) {
  console.log(`(--skip-mcp activo: no se genera config MCP)`);
}

console.log("");
console.log(`install-agent (v12.112) — agente: ${agent}`);
console.log(`Fuente:  ${join("ai", "commands")} (${commandFiles.length} commands)`);
console.log(`Destino: ${cfg.dir}`);
console.log(`Escritos: ${written}   Sin cambios: ${skipped}`);
if (!dryRun) console.log(`\nNota: ${cfg.note}`);
console.log(`Lee CONSTITUTION.md y AGENTS.md ANTES de usar los comandos en este agente.`);
process.exit(0);

// ─── MCP config generators (v12.132) ──────────────────────────────────────
// Path relativo ./scripts/aif-mcp-server.mjs — el agente invoca con cwd =
// directorio del proyecto, asi el server siempre opera contra ESE proyecto.

function mcpJsonClaudeStyle(serverPath) {
  // Formato comun para Claude Code, Codex (plugin), OpenCode, Cursor.
  // STDIO via command/args. Sin puertos.
  return JSON.stringify({
    mcpServers: {
      "aif-framework": {
        command: "node",
        args: [serverPath],
      },
    },
  }, null, 2) + "\n";
}

function mcpTomlCodexStyle(serverPath) {
  // Codex CLI: ~/.codex/config.toml o .codex/config.toml (project-scoped, trusted).
  // Tabla [mcp_servers.<name>] con command + args (array). STDIO, sin puertos.
  // Ref: developers.openai.com/codex/mcp.
  return `# AI-First Framework — MCP server (STDIO) para Codex CLI.
# Generado por install:agent --agent codex. Mergea con tu config.toml existente.
[mcp_servers.aif-framework]
command = "node"
args = ["${serverPath}"]
`;
}

function mcpJsonGeminiExtension(serverPath) {
  // Gemini CLI carga .gemini/extensions/<name>/gemini-extension.json
  return JSON.stringify({
    name: "aif-framework",
    version: "12.132.0",
    description: "AI-First Framework empresarial — MCP tools (Capa 1+2): roadmap, memoria, protocolos, skills.",
    mcpServers: {
      aif: {
        command: "node",
        args: [serverPath],
      },
    },
  }, null, 2) + "\n";
}

function mcpJsonVSCodeStyle(serverPath) {
  // VSCode Copilot lee .vscode/mcp.json (formato propio: servers array).
  return JSON.stringify({
    servers: {
      "aif-framework": {
        type: "stdio",
        command: "node",
        args: [serverPath],
      },
    },
  }, null, 2) + "\n";
}

// ─────────────────────────────────────────────────────────────────────────
function geminiToml(md, name) {
  // Gemini CLI custom command (TOML): `description` + `prompt = """..."""` (heredoc).
  // Las triples comillas internas en md se reemplazan para no cerrar el heredoc.
  const safe = md.replace(/"""/g, '\\"\\"\\"');
  const summary = (md.match(/^##\s+Objetivo\s*\n\s*([^\n]+)/m) || [])[1] || `Comando ${name} del framework AI-first empresarial.`;
  return `description = ${JSON.stringify(summary.trim())}
prompt = """
${safe}
"""
`;
}

function copilotPrompt(md, name) {
  // Copilot prompt: frontmatter mode + body.
  return `---
mode: agent
description: ${JSON.stringify(`Comando /${name} del framework AI-first empresarial.`)}
---
${md}`;
}

function cursorRule(md, name) {
  // Cursor MDC: frontmatter description + body.
  return `---
description: Comando /${name} del framework AI-first empresarial
globs: ["specs/**", "docs/**"]
alwaysApply: false
---
${md}`;
}

function printList() {
  console.log(`install-agent (v12.138) — instala slash-commands + skills + protocols + MCP config por agente.
Claude recibe skills NATIVAS (.claude/skills/<name>/SKILL.md con frontmatter, descubribles por description);
el resto de agentes reciben los *.skill.md planos como markdown de contexto.

Agentes soportados:`);
  for (const [name, cfg] of Object.entries(AGENTS)) {
    console.log(`  ${name.padEnd(10)} -> ${cfg.dir}`);
    if (cfg.mcpConfigPath) console.log(`             MCP config: ${cfg.mcpConfigPath} → ./scripts/aif-mcp-server.mjs`);
    console.log(`             ${cfg.note}`);
  }
  console.log(`
Uso:
  node scripts/install-agent.mjs --agent claude               (commands + skills + protocols + MCP config)
  node scripts/install-agent.mjs --agent claude --skip-mcp    (sin MCP config)
  node scripts/install-agent.mjs --agent gemini --force
  node scripts/install-agent.mjs --agent claude --dry-run
  node scripts/install-agent.mjs --agent claude --remove
  node scripts/install-agent.mjs --list

MCP server: scripts/aif-mcp-server.mjs (STDIO transport, sin puertos, per-project).
Cuando el agente abre el proyecto, el config local se carga y el server spawnea con cwd=projectRoot.
Multiproyectos = procesos independientes, BDs aisladas.
`);
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
