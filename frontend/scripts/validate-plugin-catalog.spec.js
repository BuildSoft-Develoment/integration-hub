const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  KNOWN_CAPABILITIES,
  KNOWN_SHELL_ROUTES,
  validateCatalog,
} = require('./validate-plugin-catalog');

const schemaPath = path.join(
  process.cwd(),
  'apps',
  'web',
  'public',
  'plugins',
  'catalog.schema.json'
);

function readCatalogSchema() {
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

test('accepts an empty metadata catalog object', () => {
  const result = validateCatalog({
    $schema: './catalog.schema.json',
    manifests: [],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.manifestCount, 0);
});

test('accepts metadata that points to an installed shell route', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'audit-summary',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Audit Summary',
        navigation: [
          {
            id: 'audit-summary-nav',
            route: '/audit',
            labelKey: 'plugins.auditSummary.nav',
            requiredCapability: 'audit',
          },
        ],
        workspaces: [
          {
            id: 'audit-summary-workspace',
            route: '/audit/record-lineage',
            labelKey: 'plugins.auditSummary.workspace',
            mode: 'query',
            requiredCapability: 'audit-read',
          },
        ],
      },
    ],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.manifestCount, 1);
});

test('rejects Angular routes declared from a runtime JSON catalog', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'remote-code',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Code',
        routes: [{ id: 'remote', path: '/remote' }],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /routes is not allowed/);
});

test('rejects metadata links to unknown shell routes', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'unknown-route',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Unknown Route',
        navigation: [
          {
            id: 'unknown-route-nav',
            route: '/not-installed',
            labelKey: 'plugins.unknown.nav',
          },
        ],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /only target known shell routes/);
});

test('rejects duplicated navigation routes across manifests', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'first',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'First',
        navigation: [{ id: 'first-nav', route: '/audit', labelKey: 'first.nav' }],
      },
      {
        id: 'second',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Second',
        navigation: [{ id: 'second-nav', route: '/audit', labelKey: 'second.nav' }],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /navigation route "\/audit" is duplicated/);
});

test('rejects unsupported platform major versions and capabilities', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'future',
        version: '1.0.0',
        platformVersion: '2.0.0',
        displayName: 'Future',
        navigation: [
          {
            id: 'future-nav',
            route: '/overview',
            labelKey: 'future.nav',
            requiredCapability: 'super-admin',
          },
        ],
      },
    ],
  });

  const errors = result.errors.join('\n');
  assert.match(errors, /platformVersion must be compatible/);
  assert.match(errors, /requiredCapability must be one of/);
});

test('rejects unknown public contract fields', () => {
  const result = validateCatalog({
    $schema: './catalog.schema.json',
    manifests: [
      {
        id: 'typo',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Typo',
        navigaton: [],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /navigaton is not part of the public plugin catalog contract/);
});

test('rejects unsupported schema references', () => {
  const result = validateCatalog({
    $schema: './other.schema.json',
    manifests: [],
  });

  assert.match(result.errors.join('\n'), /catalog\.\$schema must be "\.\/catalog\.schema\.json"/);
});

test('keeps schema routes synchronized with validator routes', () => {
  const schema = readCatalogSchema();

  assert.deepEqual(
    schema.$defs.knownShellRoute.enum,
    Array.from(KNOWN_SHELL_ROUTES)
  );
});

test('keeps schema capabilities synchronized with validator capabilities', () => {
  const schema = readCatalogSchema();

  assert.deepEqual(
    schema.$defs.capability.enum,
    Array.from(KNOWN_CAPABILITIES)
  );
});
