#!/usr/bin/env node
/**
 * check-all-trace.mjs (v12.126)
 *
 * Corre cada validador de check:all secuencialmente, imprimiendo:
 *   [N/Total] check:<name>  <elapsed>s  <result>
 *
 * Pensado para BISECTAR hangs: si un validador no devuelve, ves cual fue. No
 * sustituye a check:all (no falla rapido); es diagnostico.
 *
 * Uso:
 *   npm run check:all:trace
 *   npm run check:all:trace -- --timeout 60   (mata validators que tarden mas de 60s)
 */

import { readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const args = parseArgs(process.argv.slice(2));
const timeoutSec = Number(args.timeout) || 120;

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const checkAll = pkg.scripts["check:all"] || "";
const checkTemplate = pkg.scripts["check:template"] || "";
const checkProject = pkg.scripts["check:project"] || "";

// Extrae nombres `check:xxx` en orden de ejecucion.
function extractChecks(line) {
  return [...line.matchAll(/npm run (check:[a-z0-9:-]+)(?:\s+--\s+([^&]+))?/g)].map((m) => ({
    name: m[1],
    args: (m[2] || "").trim(),
  }));
}
const tpl = extractChecks(checkTemplate);
const proj = extractChecks(checkProject);
const all = [...tpl.map((c) => ({ ...c, group: "template" })), ...proj.map((c) => ({ ...c, group: "project" }))];

console.log(`check:all:trace (v12.126) — ${all.length} validadores (timeout ${timeoutSec}s c/u)`);
console.log(`Group: template=${tpl.length} | project=${proj.length}`);
console.log(``);

const failures = [];
let totalMs = 0;
for (let i = 0; i < all.length; i += 1) {
  const c = all[i];
  const label = `[${String(i + 1).padStart(2)}/${all.length}] ${c.group.padEnd(8)} ${c.name.padEnd(38)}`;
  process.stdout.write(`${label}`);
  const t0 = Date.now();
  const argList = ["run", c.name];
  if (c.args) argList.push("--", ...c.args.split(/\s+/));
  // v12.126 nota: en Windows + git-bash, spawn de npm necesita shell:true para
  // que el path resuelva npm.cmd. stdio:'pipe' captura stdout/stderr para no
  // contaminar el trace; si quieres ver el output, agrega --inherit-stdio.
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", argList, {
    cwd: root,
    stdio: "pipe",
    timeout: timeoutSec * 1000,
    shell: process.platform === "win32",
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  totalMs += (Date.now() - t0);
  if (r.signal === "SIGTERM" || r.error?.code === "ETIMEDOUT") {
    console.log(`  ${elapsed}s  ✗ TIMEOUT (>${timeoutSec}s) — ESTE SE COLGABA`);
    failures.push({ ...c, elapsed, status: "timeout" });
  } else if (r.status !== 0) {
    console.log(`  ${elapsed}s  ✗ EXIT ${r.status}`);
    failures.push({ ...c, elapsed, status: `exit=${r.status}` });
  } else {
    console.log(`  ${elapsed}s  ✓`);
  }
}

console.log(``);
console.log(`Total: ${(totalMs / 1000).toFixed(2)}s | OK: ${all.length - failures.length} | Fallos: ${failures.length}`);
if (failures.length > 0) {
  console.log(``);
  console.log(`Fallos detectados:`);
  for (const f of failures) console.log(`  - ${f.name} (${f.status}, ${f.elapsed}s)`);
}
process.exit(failures.length === 0 ? 0 : 1);

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
