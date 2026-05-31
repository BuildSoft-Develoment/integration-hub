#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".tf",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ps1",
  ".sh",
  ".properties",
  ".xml",
  ".gradle",
  ".kts",
  ".sql",
  ".java",
  ".html",
  ".css",
  ".scss",
  ".dockerfile",
  ".env",
]);
const IGNORED_DIRS = new Set([
  ".git",
  ".gradle",
  "node_modules",
  ".next",
  ".angular",
  ".cache",
  "dist",
  "build",
  "bin",
  "target",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
  ".tmp",
  "__pycache__",
  ".venv",
  "revisiones",
]);
const IGNORED_PATHS = new Set([
  "ci/scripts/check-template-instantiation.mjs",
  "ci/scripts/check-docs.mjs",
  "scripts/init-project.mjs",
  "scripts/init-project.ps1",
  "scripts/init-project.sh",
]);
const TEMPLATE_JAVA_BASE_PACKAGE = "com.example.app";
const TEMPLATE_JAVA_BASE_PACKAGE_PATH = TEMPLATE_JAVA_BASE_PACKAGE.replace(/\./g, "/");

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    dryRun: false,
    validate: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--config") {
      args.config = argv[i + 1];
      i += 1;
      continue;
    }
    if (current === "--root") {
      args.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (current === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (current === "--validate") {
      args.validate = true;
      continue;
    }
    if (current === "-h" || current === "--help") {
      args.help = true;
      continue;
    }
    throw new Error(`Argumento desconocido: ${current}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node scripts/init-project.mjs --config template.config.example.json [--root <path>] [--dry-run] [--validate]

Ejemplos:
  node scripts/init-project.mjs --config template.config.example.json --dry-run
  node scripts/init-project.mjs --config template.config.example.json --validate
`);
}

function getRequired(config, pathExpression) {
  const value = pathExpression.split(".").reduce((current, key) => current?.[key], config);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta valor requerido en config: ${pathExpression}`);
  }
  return value.trim();
}

function getOptional(config, pathExpression) {
  const value = pathExpression.split(".").reduce((current, key) => current?.[key], config);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function validateJavaBasePackage(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(value)) {
    throw new Error(
      `Valor invalido para project.javaBasePackage: ${value}. Usa un package Java valido, por ejemplo com.acme.casemanagement`,
    );
  }
  return value;
}

function validateDatabaseName(value) {
  if (!/^[a-z][a-z0-9_-]*$/.test(value)) {
    throw new Error(
      `Valor invalido para project.databaseName: ${value}. Usa un nombre simple para la base, por ejemplo case_management`,
    );
  }
  return value;
}

function validateFeatureFlagPrefix(value) {
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(value)) {
    throw new Error(
      `Valor invalido para project.featureFlagPrefix: ${value}. Usa un prefijo como case-management o case.management`,
    );
  }
  return value;
}

function validateApiResourceName(value, pathExpression) {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new Error(
      `Valor invalido para ${pathExpression}: ${value}. Usa un nombre simple como case o customer-record`,
    );
  }
  return value;
}

function validateApiResourcePath(value) {
  if (!/^\/[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/.test(value)) {
    throw new Error(
      `Valor invalido para project.apiResourcePath: ${value}. Usa una ruta como /api/cases`,
    );
  }
  return value;
}

function defaultDatabaseNameFromSlug(projectSlug) {
  const normalized = projectSlug.replace(/-/g, "_").toLowerCase();
  return /^[a-z]/.test(normalized) ? normalized : `app_${normalized}`;
}

function buildReplacements(config) {
  const projectName = getRequired(config, "project.name");
  const projectSlug = getRequired(config, "project.slug");
  const apiServiceName = getRequired(config, "project.apiServiceName");
  const webComponentName = getRequired(config, "project.webComponentName");
  const backstageOwner = getRequired(config, "project.backstageOwner");
  const backstageSystem = getRequired(config, "project.backstageSystem");
  const databaseResourceName = getRequired(config, "project.databaseResourceName");
  const costCenter = getRequired(config, "project.costCenter");
  const githubOrganization = getRequired(config, "github.organization");
  const githubRepository = getRequired(config, "github.repository");
  const supportUrl = getRequired(config, "support.url");
  const containerImage = getRequired(config, "runtime.containerImage");
  const terraformStateBucket = getRequired(config, "terraform.stateBucket");
  const terraformLockTable = getRequired(config, "terraform.lockTable");
  const terraformDevDomain = getRequired(config, "terraform.devDomain");
  const terraformStagingDomain = getRequired(config, "terraform.stagingDomain");
  const terraformProdDomain = getRequired(config, "terraform.prodDomain");
  const portalUrl = getRequired(config, "catalog.portalUrl");
  const apiBaseUrl = getRequired(config, "catalog.apiUrl");
  const javaBasePackage = validateJavaBasePackage(
    getOptional(config, "project.javaBasePackage") ?? TEMPLATE_JAVA_BASE_PACKAGE,
  );
  const databaseName = validateDatabaseName(
    getOptional(config, "project.databaseName") ?? defaultDatabaseNameFromSlug(projectSlug),
  );
  const featureFlagPrefix = validateFeatureFlagPrefix(
    getOptional(config, "project.featureFlagPrefix") ?? projectSlug,
  );
  const apiResourceName = validateApiResourceName(
    getRequired(config, "project.apiResourceName"),
    "project.apiResourceName",
  );
  const apiResourcePlural = validateApiResourceName(
    getRequired(config, "project.apiResourcePlural"),
    "project.apiResourcePlural",
  );
  const apiResourcePath = validateApiResourcePath(getRequired(config, "project.apiResourcePath"));

  const replacements = new Map([
    ["__PROJECT_NAME__", projectName],
    ["__PROJECT_NAMESPACE__", projectSlug],
    ["__PROJECT_SLUG__", projectSlug],
    ["__API_SERVICE_NAME__", apiServiceName],
    ["__WEB_COMPONENT_NAME__", webComponentName],
    ["__BACKSTAGE_OWNER__", backstageOwner],
    ["__BACKSTAGE_SYSTEM__", backstageSystem],
    ["__DATABASE_RESOURCE_NAME__", databaseResourceName],
    ["__COST_CENTER__", costCenter],
    ["__GITHUB_ORGANIZATION__", githubOrganization],
    ["__GITHUB_REPOSITORY__", githubRepository],
    ["__GITHUB_PROJECT_SLUG__", `${githubOrganization}/${githubRepository}`],
    ["__GITHUB_REPOSITORY_URL__", `https://github.com/${githubOrganization}/${githubRepository}.git`],
    [
      "__GITHUB_SECURITY_ADVISORY_URL__",
      `https://github.com/${githubOrganization}/${githubRepository}/security/advisories/new`,
    ],
    ["__SUPPORT_URL__", supportUrl],
    ["__CONTAINER_IMAGE__", containerImage],
    ["__TERRAFORM_STATE_BUCKET__", terraformStateBucket],
    ["__TERRAFORM_LOCK_TABLE__", terraformLockTable],
    ["__TERRAFORM_DEV_DOMAIN__", terraformDevDomain],
    ["__TERRAFORM_STAGING_DOMAIN__", terraformStagingDomain],
    ["__TERRAFORM_PROD_DOMAIN__", terraformProdDomain],
    ["__PORTAL_URL__", portalUrl],
    ["__API_BASE_URL__", apiBaseUrl],
    ["__JAVA_BASE_PACKAGE__", javaBasePackage],
    ["__JAVA_BASE_PACKAGE_PATH__", javaBasePackage.replace(/\./g, "/")],
    ["__DATABASE_NAME__", databaseName],
    ["__FEATURE_FLAG_PREFIX__", featureFlagPrefix],
    ["__ANGULAR_PROJECT_NAME__", webComponentName],
    ["__API_RESOURCE_NAME__", apiResourceName],
    ["__API_RESOURCE_PLURAL__", apiResourcePlural],
    ["__API_RESOURCE_PATH__", apiResourcePath],
  ]);

  if (javaBasePackage !== TEMPLATE_JAVA_BASE_PACKAGE) {
    replacements.set(TEMPLATE_JAVA_BASE_PACKAGE, javaBasePackage);
    replacements.set(TEMPLATE_JAVA_BASE_PACKAGE_PATH, javaBasePackage.replace(/\./g, "/"));
  }

  return { replacements, javaBasePackage };
}

function collectFiles(rootDir) {
  const files = [];
  const visit = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) {
          continue;
        }
        visit(absolute);
        continue;
      }
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) {
        continue;
      }
      const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
      if (IGNORED_PATHS.has(relative)) {
        continue;
      }
      files.push(absolute);
    }
  };
  visit(rootDir);
  return files.sort();
}

function replaceTokens(text, replacements) {
  let updated = text;
  for (const [token, value] of replacements) {
    updated = updated.split(token).join(value);
  }
  return updated;
}

function collectJavaPackageDirectories(rootDir) {
  const directories = [];
  const visit = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      const absolute = path.join(currentDir, entry.name);
      const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
      if (
        relative === TEMPLATE_JAVA_BASE_PACKAGE_PATH ||
        relative.endsWith(`/${TEMPLATE_JAVA_BASE_PACKAGE_PATH}`)
      ) {
        directories.push(absolute);
        continue;
      }
      visit(absolute);
    }
  };
  visit(rootDir);
  return directories.sort();
}

function pruneEmptyParents(startDir, stopDir) {
  let current = startDir;
  while (current.startsWith(stopDir)) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) {
      break;
    }
    fs.rmdirSync(current);
    if (current === stopDir) {
      break;
    }
    current = path.dirname(current);
  }
}

function planJavaPackageMoves(rootDir, javaBasePackage) {
  if (javaBasePackage === TEMPLATE_JAVA_BASE_PACKAGE) {
    return [];
  }
  const targetPath = javaBasePackage.replace(/\./g, "/");
  return collectJavaPackageDirectories(rootDir).map((sourceDir) => {
    const relative = path.relative(rootDir, sourceDir).replace(/\\/g, "/");
    const suffixIndex = relative.lastIndexOf(TEMPLATE_JAVA_BASE_PACKAGE_PATH);
    const prefix = suffixIndex > 0 ? relative.slice(0, suffixIndex - 1) : "";
    const targetRelative = prefix ? `${prefix}/${targetPath}` : targetPath;
    return {
      sourceDir,
      targetDir: path.join(rootDir, ...targetRelative.split("/")),
      sourceRelative: relative,
      targetRelative,
    };
  });
}

function applyJavaPackageMoves(movePlan) {
  for (const move of movePlan) {
    if (!fs.existsSync(move.sourceDir) || move.sourceDir === move.targetDir) {
      continue;
    }
    if (fs.existsSync(move.targetDir)) {
      throw new Error(`La ruta destino ya existe para el package Java: ${move.targetRelative}`);
    }
    fs.mkdirSync(path.dirname(move.targetDir), { recursive: true });
    fs.renameSync(move.sourceDir, move.targetDir);
    pruneEmptyParents(path.dirname(move.sourceDir), path.dirname(path.dirname(move.sourceDir)));
  }
}

function validateRemainingTokens(rootDir, replacements, dryRun) {
  const findings = [];
  for (const file of collectFiles(rootDir)) {
    const relative = path.relative(rootDir, file).replace(/\\/g, "/");
    const original = fs.readFileSync(file, "utf8");
    const text = dryRun ? replaceTokens(original, replacements) : original;
    const matches = [...text.matchAll(/__[A-Z0-9_]+__/g)];
    for (const match of matches) {
      const line = text.slice(0, match.index ?? 0).split("\n").length;
      findings.push(`${relative}:${line}: token sin instanciar ${match[0]}`);
    }
  }
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.config) {
    throw new Error("Debes indicar --config <ruta>");
  }

  const rootDir = path.resolve(args.root);
  const configPath = path.resolve(args.config);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const { replacements, javaBasePackage } = buildReplacements(config);
  const javaPackageMoves = planJavaPackageMoves(rootDir, javaBasePackage);
  const changedFiles = [];

  if (!args.dryRun) {
    applyJavaPackageMoves(javaPackageMoves);
  }

  for (const file of collectFiles(rootDir)) {
    const original = fs.readFileSync(file, "utf8");
    const updated = replaceTokens(original, replacements);
    if (updated === original) {
      continue;
    }
    changedFiles.push(path.relative(rootDir, file).replace(/\\/g, "/"));
    if (!args.dryRun) {
      fs.writeFileSync(file, updated, "utf8");
    }
  }

  if (args.validate) {
    const findings = validateRemainingTokens(rootDir, replacements, args.dryRun);
    if (findings.length > 0) {
      for (const finding of findings) {
        console.error(finding);
      }
      console.error(`\nTotal hallazgos: ${findings.length}`);
      return 1;
    }
  }

  const summary = args.dryRun ? "Dry run completado." : "Instanciacion completada.";
  console.log(`${summary} Archivos actualizados: ${changedFiles.length}.`);
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
  if (javaPackageMoves.length > 0) {
    console.log(`Directorios Java a mover: ${javaPackageMoves.length}.`);
    for (const move of javaPackageMoves) {
      console.log(`~ ${move.sourceRelative} -> ${move.targetRelative}`);
    }
  }
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(1);
}
