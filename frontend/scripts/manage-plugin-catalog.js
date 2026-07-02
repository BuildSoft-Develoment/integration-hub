#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  CATALOG_SCHEMA_REFERENCE,
  validateCatalog,
} = require('./validate-plugin-catalog');

const DEFAULT_CATALOG_PATH = path.join(
  'apps',
  'web',
  'public',
  'plugins',
  'catalog.json'
);

function readJson(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');

  try {
    return {
      absolutePath,
      value: JSON.parse(raw),
    };
  } catch (error) {
    throw new Error(`${filePath}: invalid JSON: ${error.message}`);
  }
}

function readCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  if (!fs.existsSync(path.resolve(process.cwd(), catalogPath))) {
    return {
      absolutePath: path.resolve(process.cwd(), catalogPath),
      value: emptyCatalog(),
    };
  }

  return readJson(catalogPath);
}

function emptyCatalog() {
  return {
    $schema: CATALOG_SCHEMA_REFERENCE,
    manifests: [],
  };
}

function writeCatalog(absolutePath, catalog) {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

function extractManifests(source) {
  if (Array.isArray(source)) {
    return source;
  }

  if (source && typeof source === 'object' && Array.isArray(source.manifests)) {
    return source.manifests;
  }

  if (source && typeof source === 'object') {
    return [source];
  }

  throw new Error('Plugin manifest file must contain a manifest object, an array, or a catalog object.');
}

function assertValidCatalog(catalog) {
  const result = validateCatalog(catalog);
  if (result.errors.length > 0) {
    throw new Error(result.errors.map((error) => `- ${error}`).join('\n'));
  }
}

function normalizeCatalog(catalog) {
  return {
    ...catalog,
    $schema: catalog.$schema ?? CATALOG_SCHEMA_REFERENCE,
    manifests: [...(catalog.manifests ?? [])],
  };
}

function installManifests({
  catalogPath = DEFAULT_CATALOG_PATH,
  manifestPath,
  replace = false,
  dryRun = false,
}) {
  if (!manifestPath) {
    throw new Error('install requires a manifest file path.');
  }

  const catalogFile = readCatalog(catalogPath);
  const catalog = normalizeCatalog(catalogFile.value);
  const manifestFile = readJson(manifestPath);
  const incomingManifests = extractManifests(manifestFile.value);
  const existingIds = new Set(catalog.manifests.map((manifest) => manifest.id));
  const duplicatedIds = incomingManifests
    .map((manifest) => manifest.id)
    .filter((id) => id && existingIds.has(id));

  if (duplicatedIds.length > 0 && !replace) {
    throw new Error(
      `Plugin manifest id already exists: ${duplicatedIds.join(', ')}. Use --replace to update it.`
    );
  }

  const incomingIds = new Set(incomingManifests.map((manifest) => manifest.id));
  const nextCatalog = {
    ...catalog,
    manifests: [
      ...catalog.manifests.filter((manifest) => !incomingIds.has(manifest.id)),
      ...incomingManifests,
    ].sort((a, b) => String(a.id).localeCompare(String(b.id))),
  };

  assertValidCatalog(nextCatalog);

  if (!dryRun) {
    writeCatalog(catalogFile.absolutePath, nextCatalog);
  }

  return {
    action: replace ? 'replace' : 'install',
    catalogPath: catalogFile.absolutePath,
    dryRun,
    manifestIds: incomingManifests.map((manifest) => manifest.id),
    manifestCount: nextCatalog.manifests.length,
  };
}

function removeManifest({
  catalogPath = DEFAULT_CATALOG_PATH,
  manifestId,
  dryRun = false,
}) {
  if (!manifestId) {
    throw new Error('remove requires a plugin manifest id.');
  }

  const catalogFile = readCatalog(catalogPath);
  const catalog = normalizeCatalog(catalogFile.value);
  const nextManifests = catalog.manifests.filter((manifest) => manifest.id !== manifestId);

  if (nextManifests.length === catalog.manifests.length) {
    throw new Error(`Plugin manifest id not found: ${manifestId}.`);
  }

  const nextCatalog = {
    ...catalog,
    manifests: nextManifests,
  };

  assertValidCatalog(nextCatalog);

  if (!dryRun) {
    writeCatalog(catalogFile.absolutePath, nextCatalog);
  }

  return {
    action: 'remove',
    catalogPath: catalogFile.absolutePath,
    dryRun,
    manifestIds: [manifestId],
    manifestCount: nextCatalog.manifests.length,
  };
}

function listManifests({ catalogPath = DEFAULT_CATALOG_PATH }) {
  const catalogFile = readCatalog(catalogPath);
  const catalog = normalizeCatalog(catalogFile.value);
  assertValidCatalog(catalog);

  return {
    action: 'list',
    catalogPath: catalogFile.absolutePath,
    manifestIds: catalog.manifests.map((manifest) => manifest.id),
    manifestCount: catalog.manifests.length,
  };
}

function parseArgs(argv) {
  const [action, firstArg, ...rest] = argv;
  const options = {
    action,
    dryRun: false,
    replace: false,
    catalogPath: DEFAULT_CATALOG_PATH,
  };

  if (action === 'install') {
    options.manifestPath = firstArg;
  } else if (action === 'remove') {
    options.manifestId = firstArg;
  } else if (action === 'list') {
    rest.unshift(firstArg);
  }

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg) {
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--replace') {
      options.replace = true;
    } else if (arg === '--catalog') {
      options.catalogPath = rest[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}.`);
    }
  }

  return options;
}

function run(options) {
  switch (options.action) {
    case 'install':
      return installManifests(options);
    case 'remove':
      return removeManifest(options);
    case 'list':
      return listManifests(options);
    default:
      throw new Error(
        'Usage: node scripts/manage-plugin-catalog.js <install|remove|list> [manifest-file|plugin-id] [--catalog path] [--replace] [--dry-run]'
      );
  }
}

function main() {
  try {
    const result = run(parseArgs(process.argv.slice(2)));
    console.log(`Plugin catalog ${result.action} passed: ${result.catalogPath}`);
    console.log(`Manifests: ${result.manifestCount}`);
    if (result.manifestIds.length) {
      console.log(`Changed/List: ${result.manifestIds.join(', ')}`);
    }
    if (result.dryRun) {
      console.log('Dry run: catalog was not written.');
    }
  } catch (error) {
    console.error(`Plugin catalog operation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_CATALOG_PATH,
  emptyCatalog,
  installManifests,
  listManifests,
  removeManifest,
  run,
};
