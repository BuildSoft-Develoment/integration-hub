#!/usr/bin/env node
/**
 * check-plugin-manifest.mjs (v12.134)
 *
 * Valida los plugin manifests por agente: estructura JSON, version, mcpServers
 * apuntando a path correcto (./scripts/aif-mcp-server.mjs).
 *
 * Default WARN — los manifests son opt-in per-project (se generan con install:agent).
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, false);

const MANIFESTS = [
  { path: ".claude-plugin/manifest.json", required: ["name", "version", "description"], format: "json" },
  { path: ".claude/mcp.json", optional: true, format: "mcp-claude-style" },
  // v12.138: Codex usa config.toml (TOML), no JSON estilo Claude.
  { path: ".codex/config.toml", optional: true, format: "mcp-codex-toml" },
  { path: ".opencode/mcp.json", optional: true, format: "mcp-claude-style" },
  { path: ".gemini/extensions/aif-framework/gemini-extension.json", optional: true, format: "gemini-extension" },
  { path: ".cursor/mcp.json", optional: true, format: "mcp-claude-style" },
  { path: ".vscode/mcp.json", optional: true, format: "mcp-vscode" },
];

const EXPECTED_SERVER_PATH = "./scripts/aif-mcp-server.mjs";

const blockers = [];
const warnings = [];
let evaluated = 0;

console.log(`check-plugin-manifest (v12.134) ${strict ? "[STRICT]" : "[WARN]"}`);

for (const m of MANIFESTS) {
  const abs = join(root, m.path);
  if (!existsSync(abs)) {
    if (m.optional) continue;
    blockers.push(`${m.path}: archivo requerido no existe`);
    continue;
  }
  evaluated += 1;

  // v12.138: TOML (Codex) se valida como texto — no es JSON parseable.
  if (m.format === "mcp-codex-toml") {
    const toml = readFileSync(abs, "utf8");
    if (!/\[mcp_servers\.aif-framework\]/.test(toml)) {
      blockers.push(`${m.path}: falta la tabla [mcp_servers.aif-framework] (formato Codex config.toml)`);
    } else {
      if (!/^\s*command\s*=\s*"node"/m.test(toml)) warnings.push(`${m.path}: command esperado 'node'`);
      if (!toml.includes(EXPECTED_SERVER_PATH)) warnings.push(`${m.path}: args no incluye '${EXPECTED_SERVER_PATH}'`);
    }
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(abs, "utf8"));
  } catch (e) {
    blockers.push(`${m.path}: JSON invalido (${e.message})`);
    continue;
  }
  // Validar campos por formato
  if (m.format === "json" && m.required) {
    for (const f of m.required) {
      if (!(f in data)) blockers.push(`${m.path}: campo '${f}' requerido faltante`);
    }
  } else if (m.format === "mcp-claude-style") {
    const srv = data.mcpServers?.["aif-framework"] || data.mcpServers?.aif;
    if (!srv) blockers.push(`${m.path}: mcpServers.aif-framework o .aif requerido`);
    else {
      if (srv.command !== "node") warnings.push(`${m.path}: command es '${srv.command}', esperado 'node'`);
      if (!Array.isArray(srv.args) || !srv.args.includes(EXPECTED_SERVER_PATH)) {
        warnings.push(`${m.path}: args no incluye '${EXPECTED_SERVER_PATH}' (encontrado: ${JSON.stringify(srv.args)})`);
      }
    }
  } else if (m.format === "gemini-extension") {
    if (!data.name || !data.version) blockers.push(`${m.path}: name y version requeridos`);
    if (!data.mcpServers) warnings.push(`${m.path}: sin mcpServers`);
  } else if (m.format === "mcp-vscode") {
    const srv = data.servers?.["aif-framework"];
    if (!srv) blockers.push(`${m.path}: servers.aif-framework requerido (formato VSCode)`);
    else if (srv.type !== "stdio") warnings.push(`${m.path}: servers.aif-framework.type debe ser 'stdio'`);
  }
}

console.log(`Manifests evaluados: ${evaluated}`);
if (blockers.length === 0 && warnings.length === 0) {
  console.log(`OK. Manifests validos.`);
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
console.error(`\nFix: regenera con 'npm run install:agent -- --agent <name> --force'.`);
process.exit(strict && blockers.length > 0 ? 1 : 0);

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
