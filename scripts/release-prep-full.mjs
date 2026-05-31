#!/usr/bin/env node
/**
 * release-prep-full.mjs (v12.138)
 *
 * Gate de pre-release COMPLETO. Extiende `release:prep` (que valida el estado del
 * repo: roadmap:sync + specify:compat + memory:sync + check:all + strict checks)
 * agregando lo que faltaba: construir el bundle RELEASE real y validarlo sin
 * desempaquetarlo. Asi un solo comando cubre "el repo esta sano" + "el artefacto
 * distribuible es valido".
 *
 * Cadena:
 *   1. npm run release:prep            (estado del repo verde)
 *   2. npm run package:release         (genera dist/bundles/project-template-vX.Y.Z-release.zip)
 *   3. check:bundle:release --zip <ese zip>   (4 reglas: paths "/", sin excluidos, requeridos, sin .git/)
 *
 * NO commitea, NO taggea, NO publica — solo valida. Las opciones de distribucion
 * (plugin:publish, etc.) y la firma del gate de release siguen siendo acto humano.
 *
 * Uso:
 *   npm run release:prep:full
 *   node scripts/release-prep-full.mjs --skip-prep   (salta release:prep; util si ya corrio)
 *
 * Exit codes:
 *   0 - todo verde
 *   1 - argumentos / version no resoluble
 *   2 - algun paso de la cadena fallo (se propaga el primero que rompe)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const skipPrep = !!args["skip-prep"];

if (args.help) {
  console.log(`release-prep-full (v12.138) — gate de pre-release completo (repo + bundle).

Cadena: release:prep -> package:release -> check:bundle:release --zip <generado>.
NO commitea/taggea/publica. Solo valida.

Uso:
  npm run release:prep:full
  node scripts/release-prep-full.mjs --skip-prep
`);
  process.exit(0);
}

const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) {
  console.error(`✗ no existe ${pkgPath}. Corre desde la raiz del proyecto.`);
  process.exit(1);
}
const version = JSON.parse(readFileSync(pkgPath, "utf8")).version;
if (!version) {
  console.error(`✗ package.json sin "version".`);
  process.exit(1);
}

console.log(`release-prep-full (v12.138) — version: v${version}\n`);

// release:prep es una cadena compuesta de npm scripts -> se invoca via npm (shell:true
// para que npm.cmd resuelva en Windows). package:release y check:bundle:release se
// llaman directo con node (process.execPath) para no depender del PATH de npm.
const zipRel = join("dist", "bundles", `project-template-v${version}-release.zip`);
const steps = [];
if (!skipPrep) {
  steps.push({ label: "1/3 release:prep (estado del repo)", npmScript: "release:prep" });
} else {
  console.log(`(--skip-prep activo: se omite release:prep)\n`);
}
steps.push({
  label: "2/3 package:release (genera bundle)",
  node: [join("scripts", "package-bundle.mjs"), "--mode", "release"],
});
steps.push({
  label: "3/3 check:bundle:release (valida ZIP)",
  node: [join("ci", "scripts", "check-bundle-release.mjs"), "--zip", zipRel],
});

for (const step of steps) {
  console.log(`▶ ${step.label}`);
  let r;
  if (step.npmScript) {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    r = spawnSync(npmCmd, ["run", step.npmScript], { cwd: root, stdio: "inherit", shell: true });
  } else {
    r = spawnSync(process.execPath, step.node, { cwd: root, stdio: "inherit" });
  }
  if (r.status !== 0) {
    console.error(`\n✗ Fallo en: ${step.label} (exit ${r.status}). Aborto.`);
    process.exit(2);
  }
  console.log(``);
}

// Verificacion final: el ZIP existe.
const zipAbs = join(root, zipRel);
if (!existsSync(zipAbs)) {
  console.error(`✗ El bundle esperado no existe tras la cadena: ${zipRel}`);
  process.exit(2);
}

console.log(`OK. Pre-release completo verde:`);
console.log(`  - repo sano (release:prep)`);
console.log(`  - bundle generado: ${zipRel}`);
console.log(`  - bundle valido (check:bundle:release)`);
console.log(`\nProximo paso humano: firmar el gate de release y/o distribuir (plugin:publish).`);
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
