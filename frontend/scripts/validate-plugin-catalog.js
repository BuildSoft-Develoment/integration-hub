#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const PLATFORM_VERSION = '1.0.0';
const CATALOG_SCHEMA_REFERENCE = './catalog.schema.json';

const CATALOG_FIELDS = new Set(['$schema', 'manifests']);
const MANIFEST_FIELDS = new Set([
  'id',
  'version',
  'platformVersion',
  'displayName',
  'capabilities',
  'navigation',
  'routes',
  'workspaces',
  'i18nNamespaces',
]);
const NAVIGATION_FIELDS = new Set([
  'id',
  'route',
  'labelKey',
  'requiredCapability',
  'source',
  'order',
  'group',
]);
const WORKSPACE_FIELDS = new Set([
  'id',
  'route',
  'labelKey',
  'descriptionKey',
  'source',
  'group',
  'mode',
  'order',
  'requiredCapability',
]);

const KNOWN_SHELL_ROUTES = new Set([
  '/overview',
  '/sources',
  '/connections',
  '/readers',
  '/processes',
  '/payment-rules',
  '/executions',
  '/schedules',
  '/audit',
  '/audit/record-lineage',
  '/audit/mt101-fragments',
  '/audit/spool',
  '/audit/mt101-quarantine',
]);

const KNOWN_CAPABILITIES = new Set([
  'admin',
  'operate',
  'audit',
  'audit-read',
  'audit-operate',
  'audit-admin',
]);

const DEFAULT_CATALOG_PATH = path.join(
  'apps',
  'web',
  'public',
  'plugins',
  'catalog.json'
);

function readJsonFile(filePath) {
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

function asManifestList(catalog) {
  if (Array.isArray(catalog)) {
    return catalog;
  }

  if (catalog && typeof catalog === 'object' && Array.isArray(catalog.manifests)) {
    return catalog.manifests;
  }

  throw new Error('Catalog must be an array or an object with a manifests array.');
}

function rejectUnknownProperties(value, allowedFields, fieldPrefix, errors) {
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${fieldPrefix}.${field} is not part of the public plugin catalog contract.`);
    }
  }
}

function requiredString(value, field, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${field} is required and must be a non-empty string.`);
    return '';
  }

  return value.trim();
}

function normalizeRoute(route, field, errors) {
  const value = requiredString(route, field, errors);
  if (!value) {
    return '';
  }

  if (!value.startsWith('/')) {
    errors.push(`${field} must start with "/". Received "${value}".`);
    return value;
  }

  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

function major(version) {
  const match = /^(\d+)\./.exec(String(version));
  return match ? Number(match[1]) : Number.NaN;
}

function validatePlatformVersion(manifest, fieldPrefix, errors) {
  const version = requiredString(
    manifest.platformVersion,
    `${fieldPrefix}.platformVersion`,
    errors
  );

  if (!version) {
    return;
  }

  if (major(version) !== major(PLATFORM_VERSION)) {
    errors.push(
      `${fieldPrefix}.platformVersion must be compatible with ${PLATFORM_VERSION}. Received "${version}".`
    );
  }
}

function validateCapability(capability, field, errors) {
  if (capability == null) {
    return;
  }

  if (typeof capability !== 'string' || !KNOWN_CAPABILITIES.has(capability)) {
    errors.push(`${field} must be one of: ${Array.from(KNOWN_CAPABILITIES).join(', ')}.`);
  }
}

function validateStringArray(value, field, errors) {
  if (value == null) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array of strings.`);
    return;
  }

  value.forEach((entry, index) => {
    requiredString(entry, `${field}[${index}]`, errors);
  });
}

function validateCatalogMetadata(catalog, errors) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    return;
  }

  rejectUnknownProperties(catalog, CATALOG_FIELDS, 'catalog', errors);

  if (catalog.$schema == null) {
    return;
  }

  const schema = requiredString(catalog.$schema, 'catalog.$schema', errors);
  if (schema && schema !== CATALOG_SCHEMA_REFERENCE) {
    errors.push(
      `catalog.$schema must be "${CATALOG_SCHEMA_REFERENCE}" when present. Received "${schema}".`
    );
  }
}

function addUnique(seen, key, label, errors) {
  if (!key) {
    return;
  }

  if (seen.has(key)) {
    errors.push(`${label} "${key}" is duplicated.`);
    return;
  }

  seen.add(key);
}

function validateNavigationItem(item, fieldPrefix, seen, errors) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${fieldPrefix} must be an object.`);
    return;
  }

  rejectUnknownProperties(item, NAVIGATION_FIELDS, fieldPrefix, errors);

  const id = requiredString(item.id, `${fieldPrefix}.id`, errors);
  const route = normalizeRoute(item.route, `${fieldPrefix}.route`, errors);
  requiredString(item.labelKey, `${fieldPrefix}.labelKey`, errors);
  validateCapability(item.requiredCapability, `${fieldPrefix}.requiredCapability`, errors);

  addUnique(seen.navigationIds, id, 'navigation id', errors);
  addUnique(seen.navigationRoutes, route, 'navigation route', errors);

  if (route && !KNOWN_SHELL_ROUTES.has(route)) {
    errors.push(
      `${fieldPrefix}.route points to "${route}", but external catalog entries may only target known shell routes.`
    );
  }
}

function validateWorkspaceItem(item, fieldPrefix, seen, errors) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${fieldPrefix} must be an object.`);
    return;
  }

  rejectUnknownProperties(item, WORKSPACE_FIELDS, fieldPrefix, errors);

  const id = requiredString(item.id, `${fieldPrefix}.id`, errors);
  const route = normalizeRoute(item.route, `${fieldPrefix}.route`, errors);
  requiredString(item.labelKey, `${fieldPrefix}.labelKey`, errors);
  validateCapability(item.requiredCapability, `${fieldPrefix}.requiredCapability`, errors);

  if (item.mode != null && !['query', 'operation', 'configuration'].includes(item.mode)) {
    errors.push(`${fieldPrefix}.mode must be query, operation or configuration.`);
  }

  addUnique(seen.workspaceIds, id, 'workspace id', errors);
  addUnique(seen.workspaceRoutes, route, 'workspace route', errors);

  if (route && !KNOWN_SHELL_ROUTES.has(route)) {
    errors.push(
      `${fieldPrefix}.route points to "${route}", but external catalog entries may only target known shell routes.`
    );
  }
}

function validateCatalog(catalog) {
  const manifests = asManifestList(catalog);
  const errors = [];
  validateCatalogMetadata(catalog, errors);

  const seen = {
    manifestIds: new Set(),
    navigationIds: new Set(),
    navigationRoutes: new Set(),
    workspaceIds: new Set(),
    workspaceRoutes: new Set(),
  };

  manifests.forEach((manifest, manifestIndex) => {
    const fieldPrefix = `manifests[${manifestIndex}]`;

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      errors.push(`${fieldPrefix} must be an object.`);
      return;
    }

    rejectUnknownProperties(manifest, MANIFEST_FIELDS, fieldPrefix, errors);

    const manifestId = requiredString(manifest.id, `${fieldPrefix}.id`, errors);
    requiredString(manifest.version, `${fieldPrefix}.version`, errors);
    requiredString(manifest.displayName, `${fieldPrefix}.displayName`, errors);
    validatePlatformVersion(manifest, fieldPrefix, errors);
    validateStringArray(manifest.i18nNamespaces, `${fieldPrefix}.i18nNamespaces`, errors);

    addUnique(seen.manifestIds, manifestId, 'plugin manifest id', errors);

    if (Array.isArray(manifest.routes) && manifest.routes.length > 0) {
      errors.push(
        `${fieldPrefix}.routes is not allowed in runtime JSON catalogs. Register Angular routes through a static provider/build artifact.`
      );
    } else if (manifest.routes != null && !Array.isArray(manifest.routes)) {
      errors.push(`${fieldPrefix}.routes must be an array when present.`);
    }

    if (manifest.navigation != null && !Array.isArray(manifest.navigation)) {
      errors.push(`${fieldPrefix}.navigation must be an array when present.`);
    }

    if (manifest.workspaces != null && !Array.isArray(manifest.workspaces)) {
      errors.push(`${fieldPrefix}.workspaces must be an array when present.`);
    }

    if (Array.isArray(manifest.capabilities)) {
      manifest.capabilities.forEach((capability, capabilityIndex) => {
        validateCapability(
          capability,
          `${fieldPrefix}.capabilities[${capabilityIndex}]`,
          errors
        );
      });
    } else if (manifest.capabilities != null) {
      errors.push(`${fieldPrefix}.capabilities must be an array when present.`);
    }

    (manifest.navigation || []).forEach((item, itemIndex) => {
      validateNavigationItem(item, `${fieldPrefix}.navigation[${itemIndex}]`, seen, errors);
    });

    (manifest.workspaces || []).forEach((item, itemIndex) => {
      validateWorkspaceItem(item, `${fieldPrefix}.workspaces[${itemIndex}]`, seen, errors);
    });
  });

  return {
    errors,
    manifestCount: manifests.length,
  };
}

function main() {
  const catalogPath = process.argv[2] || DEFAULT_CATALOG_PATH;
  const { absolutePath, value } = readJsonFile(catalogPath);
  const result = validateCatalog(value);

  if (result.errors.length > 0) {
    console.error(`Plugin catalog validation failed: ${absolutePath}`);
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Plugin catalog validation passed: ${absolutePath}`);
  console.log(`Manifests: ${result.manifestCount}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  CATALOG_SCHEMA_REFERENCE,
  KNOWN_CAPABILITIES,
  KNOWN_SHELL_ROUTES,
  PLATFORM_VERSION,
  validateCatalog,
};
