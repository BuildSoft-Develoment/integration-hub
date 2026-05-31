#!/usr/bin/env node
/**
 * pre-flight-gate.mjs (v12.78)
 *
 * Comando UNICO que un agente IA DEBE ejecutar antes de declarar "listo".
 *
 * Checks:
 *   1. npm run check:project              (validadores estructurales)
 *   2. node ci/scripts/check-template-instantiation.mjs --mode <auto>
 *   3. npm run roadmap:status (debe NO tener blockers)
 *   4. Actividad en sesion (SESSION_LOG.md con entrada reciente)
 *   5. npm run check:auto-zones (zonas AI_CONTEXT integras)
 *   6. v12.78: ROADMAP_STATE.json al dia (instantiated=strict bloquea; template=warn)
 *   7. v12.78/v12.81/v12.82/v12.84/v12.86 (solo instantiated): check:prototype-location + check:prototype-coverage
 *      + check:prototype-spa-coherence + check:prototype-mock-data + check:release-binding + check:runbook-binding STRICT
 *      (en el template solo warning dentro de check:project).
 *
 * v12.57 cierra el problema raiz visto en codex/opencode/gemini:
 *   - validadores existian pero agentes NO los ejecutaban antes de cerrar.
 *   - Resultado: prototipos pobres, links bidireccionales rotos, gates inconsistentes.
 *
 * Modos:
 *   --strict       (default v12.57): exit 1 si CUALQUIER check falla.
 *   --warn         exit 0 con resumen tabular.
 *   --json         output JSON (para CI / panel).
 *   --skip-memory  no exige memory:sync reciente (util en CI nuevo).
 *   --root <path>  raiz del proyecto.
 *
 * Exit codes:
 *   0 - todos los checks pasan.
 *   1 - algun check fallo y modo strict.
 *   2 - error de configuracion (template-upgrade pendiente, etc.).
 */

import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const asJson = !!args.json;
const skipMemory = !!args["skip-memory"];
const strict = args.warn ? false : true; // strict por default v12.57

if (!existsSync(join(root, "package.json"))) {
  console.error(`Error: ${root} no parece un proyecto valido (sin package.json).`);
  process.exit(2);
}

// v12.59: detectar modo template vs instantiated.
//   --mode template       fuerza modo template (es el repo del template canonico).
//   --mode instantiated   fuerza modo proyecto instanciado.
//   (sin --mode)          auto-detecta.
// Heuristica de auto-deteccion del template canonico:
//   - package.json name contiene "project-template", O
//   - existe stacks/<x>/template/ con tokens __PROJECT_NAME__ (scaffolding intencional).
function detectMode() {
  if (args.mode === "template" || args.mode === "instantiated") return args.mode;
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    // El template canonico se llama @<scope>/project-template-* y trae stacks/<x>/template/.
    if (/project-template/i.test(pkg.name || "")) return "template";
  } catch { /* ignore */ }
  // Heuristica de respaldo: si existe stacks/ con subdir template/, es el template canonico.
  if (existsSync(join(root, "stacks"))) {
    try {
      const stacks = readdirSync(join(root, "stacks"), { withFileTypes: true });
      for (const s of stacks) {
        if (s.isDirectory() && existsSync(join(root, "stacks", s.name, "template"))) return "template";
      }
    } catch { /* ignore */ }
  }
  return "instantiated";
}
const mode = detectMode();

const checks = [];
const startTime = Date.now();

// 1. check:project (todos los validadores).
checks.push(runCheck({
  id: "check-project",
  label: "Validadores del proyecto (check:project)",
  cmd: process.platform === "win32" ? "npm.cmd" : "npm",
  args: ["run", "check:project"],
  description: "Trace drift, BD, API, prototipos, gates, evidencia, etc.",
}));

// 2. check:instantiation — modo segun deteccion.
//    En modo template: --mode template (tolera tokens scaffolding en stacks/).
//    En modo instantiated: --mode instantiated (strict).
checks.push(runCheck({
  id: "check-instantiation",
  label: mode === "template"
    ? "Instanciacion (modo template — tolera tokens scaffolding)"
    : "Strings residuales del template + slugs unicos + scripts v12.45+",
  cmd: process.execPath,
  args: [join(root, "ci", "scripts", "check-template-instantiation.mjs"), "--mode", mode, "--root", root],
  description: "Detecta 'bandeja', 'expediente', $(date) sin expandir, slugs duplicados.",
}));

// 3. roadmap:status (debe no tener blockers).
//    En modo template, los specs ejemplo (001-bandeja-...) tienen blockers
//    intencionales (faltan archivos a proposito); se reporta pero NO bloquea.
checks.push(runRoadmapStatus(mode));

// 4. Actividad de sesion: SESSION_LOG.md tiene entrada de hoy.
checks.push(checkSessionLogActivity());

// 5. check:auto-zones (BLOQUEANTE — AI_CONTEXT integro).
checks.push(runCheck({
  id: "check-auto-zones",
  label: "Zonas auto-regenerables (AI_CONTEXT.md, etc.) integras",
  cmd: process.execPath,
  args: [join(root, "ci", "scripts", "check-auto-zones.mjs"), "--root", root],
  description: "AI_CONTEXT.md DEBE tener las 7 zonas auto canonicas.",
}));

// 6. v12.78: frescura de ROADMAP_STATE.json.
//    instantiated: --strict (BLOQUEA si falta/stale). template: warn (no bloquea).
checks.push(runCheck({
  id: "roadmap-state",
  label: mode === "template" ? "ROADMAP_STATE.json al dia (modo template — warn)" : "ROADMAP_STATE.json al dia",
  cmd: process.execPath,
  args: mode === "instantiated"
    ? [join(root, "scripts", "roadmap-sync.mjs"), "--check", "--strict", "--root", root]
    : [join(root, "scripts", "roadmap-sync.mjs"), "--check", "--root", root],
  description: "El estado del roadmap debe estar sincronizado.",
  fixHint: "npm run roadmap:sync && npm run memory:sync",
}));

// 7. v12.78: en proyecto instanciado, release/runbook binding BLOQUEAN (en el
//    template solo corren como warning dentro de check:project).
if (mode === "instantiated") {
  // v12.81: la ubicacion de prototipos BLOQUEA en proyecto real (en el template
  // solo corre como warning dentro de check:project). Cierra el patron de poner
  // los prototipos en prototype/<feature>/ en vez de specs/<slug>/prototype-html5/.
  checks.push(runCheck({
    id: "prototype-location",
    label: "Prototipos en ubicacion canonica (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-prototype-location.mjs"), "--strict", "--root", root],
    description: "Cada prototipo de feature debe vivir en specs/<slug>/prototype-html5/index.html; prototype/ es solo el hub.",
    fixHint: "npm run scaffold:prototype -- --feature <slug> --domain <dominio>  +  npm run prototype:hub",
  }));
  checks.push(runCheck({
    id: "prototype-coverage",
    label: "Cada feature visual tiene su prototipo (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-prototype-coverage.mjs"), "--strict", "--root", root],
    description: "Ninguna feature visual puede quedar sin specs/<slug>/prototype-html5/index.html (opt-out: frontmatter prototype: not-required).",
    fixHint: "npm run scaffold:prototype -- --feature <slug> --domain <dominio>",
  }));
  checks.push(runCheck({
    id: "prototype-spa-coherence",
    label: "Coherencia portfolio-spa (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-prototype-spa-coherence.mjs"), "--strict", "--root", root],
    description: "Si el proyecto es SPA, todos los prototipos enlazan _shared/ y usan el sidebar comun (_shared/nav.js).",
    fixHint: "npm run scaffold:prototype -- --feature <slug> --domain <dominio> --mode portfolio-spa --force",
  }));
  checks.push(runCheck({
    id: "prototype-mock-data",
    label: "Datos de prototipo sin placeholders (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-prototype-mock-data.mjs"), "--strict", "--root", root],
    description: "Sin tokens <<...>> residuales; los datos declarados en mock-data.json se consumen en el prototipo.",
    fixHint: "declara datos reales en specs/<slug>/prototype-html5/mock-data.json y re-corre scaffold:prototype",
  }));
  checks.push(runCheck({
    id: "prototype-diversity",
    label: "Diversidad estructural: sin clones del golden (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-prototype-diversity.mjs"), "--strict", "--root", root],
    description: "Cada prototipo mantiene la misma marca del producto, pero ninguno sigue siendo el esqueleto del golden ni clon estructural de otra feature.",
    fixHint: "redisena el layout/componentes/jerarquia o usa scaffold:prototype --freeform; recolorear o cambiar de paleta NO basta",
  }));
  checks.push(runCheck({
    id: "plantillas",
    label: "Plantillas con destino valido + fase-4 sincronizada (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-plantillas.mjs"), "--strict", "--root", root],
    description: "Cada plantilla declara su destino real; plantillas/fase-4-sdd no drifto de scaffold:feature.",
    fixHint: "npm run plantillas:sync (sincroniza fase-4) y agrega el banner de destino faltante",
  }));
  checks.push(runCheck({
    id: "release-binding",
    label: "Release notes vinculadas a RF/HU/feature (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-release-binding.mjs"), "--strict", "--root", root],
    description: "Cada release note vincula a RF/HU/feature (o frontmatter kind: bootstrap).",
    fixHint: "agrega '## Features cubiertas: RF-NN, HU-NN' o frontmatter kind: bootstrap a los release notes",
  }));
  checks.push(runCheck({
    id: "runbook-binding",
    label: "Runbooks vinculados + RF + SLO numerico (strict)",
    cmd: process.execPath,
    args: [join(root, "ci", "scripts", "check-runbook-binding.mjs"), "--strict", "--root", root],
    description: "Cada runbook vincula a feature + RF + SLO numerico (o frontmatter kind: transversal).",
    fixHint: "renombra a <NNN-slug>-runbook.md + agrega RF + SLO, o marca frontmatter kind: transversal",
  }));
}

const totalMs = Date.now() - startTime;
const failed = checks.filter((c) => !c.ok);

if (asJson) {
  console.log(JSON.stringify({
    ok: failed.length === 0,
    mode,
    strict,
    totalChecks: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    durationMs: totalMs,
    checks,
  }, null, 2));
  process.exit(failed.length > 0 && strict ? 1 : 0);
}

// Output tabular legible.
console.log(`\nPRE-FLIGHT GATE (v12.78) ${strict ? "[STRICT]" : "[WARN]"} [mode: ${mode}]`);
console.log(`=========================================`);
console.log(`Proyecto: ${root}`);
if (mode === "template") console.log(`Modo template: tolera tokens scaffolding en stacks/ y specs ejemplo incompletos.`);
console.log(`Duracion: ${(totalMs / 1000).toFixed(1)}s\n`);

for (const c of checks) {
  const icon = c.ok ? "✓" : "✗";
  const status = c.ok ? "PASS" : "FAIL";
  const dur = c.durationMs ? `${(c.durationMs / 1000).toFixed(1)}s` : "—";
  console.log(`  ${icon} ${status}  ${c.label}  (${dur})`);
  if (!c.ok && c.tail) {
    console.log(`         ${c.tail.split("\n").filter((l) => l.trim()).slice(-3).join("\n         ")}`);
  }
}

console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);

if (failed.length === 0) {
  console.log(`\n✓ PRE-FLIGHT VERDE — el proyecto esta listo para declarar la sesion completa.`);
  console.log(`  Recuerda: solo HUMANOS pueden aprobar gates. Tu rol es preparar evidencia.`);
  process.exit(0);
}

console.error(`\n✗ PRE-FLIGHT BLOQUEADO — ${failed.length} check(s) fallaron:`);
for (const f of failed) {
  console.error(`  ✗ ${f.label}`);
  if (f.fix) console.error(`     fix: ${f.fix}`);
}
console.error(`\nNO declares la sesion completa hasta que TODOS los checks pasen.`);
console.error(`Corre cada check fallido por separado para ver detalle.`);

process.exit(strict ? 1 : 0);

// ─────────────────────────────────────────────────────────────────────────
function runCheck({ id, label, cmd, args: cmdArgs, description, fixHint }) {
  const start = Date.now();
  let result;
  try {
    // shell:true SOLO si invocamos npm/npm.cmd (Windows lo requiere).
    // NO usar shell:true con process.execPath porque Windows corrompe paths con espacios.
    const isNpm = /^npm(\.cmd)?$/i.test(cmd);
    result = spawnSync(cmd, cmdArgs, {
      cwd: root,
      encoding: "utf8",
      timeout: 120 * 1000,
      shell: isNpm && process.platform === "win32",
    });
  } catch (e) {
    return {
      id, label, description,
      ok: false,
      durationMs: Date.now() - start,
      error: String(e.message || e),
      fix: fixHint,
    };
  }
  const ok = result.status === 0;
  const tail = (result.stdout || "") + (result.stderr || "");
  return {
    id, label, description,
    ok,
    exitCode: result.status,
    durationMs: Date.now() - start,
    tail: tail.length > 600 ? tail.slice(-600) : tail,
    fix: !ok ? (fixHint || `corre el comando manualmente: ${cmd} ${cmdArgs.join(" ")}`) : null,
  };
}

function runRoadmapStatus(currentMode) {
  const start = Date.now();
  const scriptPath = join(root, "scripts", "roadmap-status.mjs");
  if (!existsSync(scriptPath)) {
    return {
      id: "roadmap-status",
      label: "Roadmap sin blockers",
      ok: false,
      durationMs: Date.now() - start,
      error: "roadmap-status.mjs no existe",
      fix: "node scripts/template-upgrade.mjs --apply",
    };
  }
  const result = spawnSync(process.execPath, [scriptPath, "--json", "--root", root], { encoding: "utf8", timeout: 15000 });
  if (result.status !== 0) {
    return {
      id: "roadmap-status",
      label: "Roadmap sin blockers",
      ok: false,
      durationMs: Date.now() - start,
      error: "roadmap-status fallo",
      tail: result.stderr?.slice(-300),
    };
  }
  try {
    const data = JSON.parse(result.stdout);
    const blockers = data.blockers || [];
    if (blockers.length === 0) {
      return { id: "roadmap-status", label: "Roadmap sin blockers", ok: true, durationMs: Date.now() - start };
    }
    // v12.59: en modo template, los specs ejemplo tienen blockers intencionales.
    // Se reporta como informacion pero NO bloquea el pre-flight del template canonico.
    if (currentMode === "template") {
      return {
        id: "roadmap-status",
        label: `Roadmap: ${blockers.length} blockers en specs ejemplo (modo template — no bloquea)`,
        ok: true,
        durationMs: Date.now() - start,
        tail: blockers.slice(0, 2).join("\n"),
      };
    }
    return {
      id: "roadmap-status",
      label: `Roadmap sin blockers (${blockers.length} encontrados)`,
      ok: false,
      durationMs: Date.now() - start,
      tail: blockers.slice(0, 3).join("\n"),
      fix: "ejecuta 'npm run roadmap:next' para ver la accion sugerida",
    };
  } catch {
    return { id: "roadmap-status", label: "Roadmap sin blockers", ok: false, durationMs: Date.now() - start, error: "JSON invalido" };
  }
}

function checkSessionLogActivity() {
  if (skipMemory) {
    return { id: "session-activity", label: "Actividad en sesion (--skip-memory)", ok: true, skipped: true, durationMs: 0 };
  }
  const start = Date.now();
  const logPath = join(root, "SESSION_LOG.md");
  if (!existsSync(logPath)) {
    return {
      id: "session-activity",
      label: "SESSION_LOG.md tiene entrada reciente",
      ok: false,
      durationMs: Date.now() - start,
      fix: "agrega una entrada en SESSION_LOG.md con la fecha de hoy + resumen de cambios",
    };
  }
  const text = readFileSync(logPath, "utf8");
  // Aceptar entradas del dia actual O ultimas 7 dias.
  const today = new Date().toISOString().slice(0, 10);
  const last7 = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(d.toISOString().slice(0, 10));
  }
  const hasRecent = last7.some((d) => text.includes(`## ${d}`));
  if (!hasRecent) {
    return {
      id: "session-activity",
      label: "SESSION_LOG.md tiene entrada reciente (ultimos 7 dias)",
      ok: false,
      durationMs: Date.now() - start,
      tail: `Buscado: ## ${today} (o cualquier dia de los ultimos 7).`,
      fix: `agrega entrada con formato '## ${today} HH:MM — resumen' a SESSION_LOG.md`,
    };
  }
  return { id: "session-activity", label: "SESSION_LOG.md tiene entrada reciente", ok: true, durationMs: Date.now() - start };
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
