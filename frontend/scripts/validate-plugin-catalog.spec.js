const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ACTION_KINDS,
  ACTION_PLACEMENTS,
  KNOWN_CAPABILITIES,
  KNOWN_SHELL_ROUTES,
  PLATFORM_VERSION,
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

test('keeps the build-gate platform version in sync with the frontend constant', () => {
  const registryPath = path.join(
    process.cwd(),
    'libs',
    'shared',
    'ui',
    'src',
    'lib',
    'app-layout',
    'plugins',
    'app-plugin.registry.ts'
  );
  const source = fs.readFileSync(registryPath, 'utf8');
  const match = /FRONTEND_EXTENSION_PLATFORM_VERSION\s*=\s*'([^']+)'/.exec(source);

  assert.ok(match, 'FRONTEND_EXTENSION_PLATFORM_VERSION must be declared in app-plugin.registry.ts');
  assert.equal(
    match[1],
    PLATFORM_VERSION,
    'scripts/validate-plugin-catalog.js PLATFORM_VERSION must match FRONTEND_EXTENSION_PLATFORM_VERSION'
  );
});

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
        actions: [
          {
            id: 'audit-summary-open',
            labelKey: 'plugins.auditSummary.open',
            kind: 'navigation',
            placement: 'toolbar',
            route: '/audit/record-lineage',
            requiredCapability: 'audit-read',
          },
          {
            id: 'audit-summary-docs',
            labelKey: 'plugins.auditSummary.docs',
            kind: 'external-link',
            href: 'https://example.com/audit-summary',
          },
          {
            id: 'audit-summary-refresh',
            labelKey: 'plugins.auditSummary.refresh',
            command: 'audit-summary.refresh',
          },
        ],
      },
    ],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.manifestCount, 1);
});

test('accepts contributed keys that fall inside the declared i18n namespaces', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'scoped',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Scoped',
        i18nNamespaces: ['plugins.scoped'],
        navigation: [
          { id: 'scoped-nav', route: '/audit', labelKey: 'plugins.scoped.nav' },
        ],
      },
    ],
  });

  assert.deepEqual(result.errors, []);
});

test('rejects contributed keys outside the declared i18n namespaces', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'scoped',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Scoped',
        i18nNamespaces: ['plugins.scoped'],
        navigation: [
          { id: 'scoped-nav', route: '/audit', labelKey: 'platform.audit' },
        ],
      },
    ],
  });

  assert.ok(
    result.errors.some((error) => error.includes('outside the declared i18nNamespaces')),
    `expected a namespace-scope error, got: ${JSON.stringify(result.errors)}`
  );
});

const VALID_INTEGRITY = `sha384-${'A'.repeat(64)}`;
const VALID_SIGNATURE = `key-1:${'A'.repeat(43)}=`;

test('accepts a manifest declaring a well-formed remote descriptor', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'remote-widget',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Widget',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: VALID_SIGNATURE,
        },
      },
    ],
  });

  assert.deepEqual(result.errors, []);
});

test('rejects a remote with a malformed SRI integrity or signature format', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'remote-malformed',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Malformed',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: 'sha384-abc',
          signature: 'sig-without-key',
        },
      },
    ],
  });

  assert.ok(
    result.errors.some((error) => error.includes('subresource integrity hash')),
    `expected an integrity format error, got: ${JSON.stringify(result.errors)}`
  );
  assert.ok(
    result.errors.some((error) => error.includes('keyId:base64signature')),
    `expected a signature format error, got: ${JSON.stringify(result.errors)}`
  );
});

test('rejects a remote descriptor with a non-https url or missing provenance', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'remote-bad',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Bad',
        remote: {
          url: 'http://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: '',
          signature: 'sig-123',
        },
      },
    ],
  });

  assert.ok(
    result.errors.some((error) => error.includes('remote.url')),
    `expected a remote.url error, got: ${JSON.stringify(result.errors)}`
  );
  assert.ok(
    result.errors.some((error) => error.includes('remote.integrity')),
    `expected a remote.integrity error, got: ${JSON.stringify(result.errors)}`
  );
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

test('rejects duplicated action ids across manifests', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'first',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'First',
        actions: [{ id: 'export', labelKey: 'first.export', command: 'first.export' }],
      },
      {
        id: 'second',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Second',
        actions: [{ id: 'export', labelKey: 'second.export', command: 'second.export' }],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /action id "export" is duplicated/);
});

test('rejects external action links to unknown shell routes', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'unknown-action-route',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Unknown Action Route',
        actions: [
          {
            id: 'open-missing',
            labelKey: 'plugins.unknown.open',
            kind: 'navigation',
            route: '/not-installed',
          },
        ],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /external catalog actions may only target known shell routes/);
});

test('rejects unsafe external action hrefs', () => {
  const result = validateCatalog({
    manifests: [
      {
        id: 'unsafe-link',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Unsafe Link',
        actions: [
          {
            id: 'open-docs',
            labelKey: 'plugins.unsafe.docs',
            kind: 'external-link',
            href: 'http://example.com/docs',
          },
        ],
      },
    ],
  });

  assert.match(result.errors.join('\n'), /href must start with "https:\/\/"/);
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

test('keeps schema action enums synchronized with validator constants', () => {
  const schema = readCatalogSchema();

  assert.deepEqual(
    schema.$defs.actionKind.enum,
    Array.from(ACTION_KINDS)
  );
  assert.deepEqual(
    schema.$defs.actionPlacement.enum,
    Array.from(ACTION_PLACEMENTS)
  );
});
