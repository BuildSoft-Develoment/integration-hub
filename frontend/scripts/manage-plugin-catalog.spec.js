const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  emptyCatalog,
  installManifests,
  listManifests,
  removeManifest,
} = require('./manage-plugin-catalog');

function createTempWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-catalog-'));
  const catalogPath = path.join(root, 'catalog.json');
  fs.writeFileSync(catalogPath, `${JSON.stringify(emptyCatalog(), null, 2)}\n`, 'utf8');
  return { root, catalogPath };
}

function writeManifest(root, name, manifest) {
  const manifestPath = path.join(root, name);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

function readCatalog(catalogPath) {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

const validManifest = {
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
};

test('installs a metadata-only manifest into a catalog', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'manifest.json', validManifest);

  const result = installManifests({ catalogPath, manifestPath });
  const catalog = readCatalog(catalogPath);

  assert.equal(result.manifestCount, 1);
  assert.deepEqual(result.manifestIds, ['audit-summary']);
  assert.equal(catalog.manifests[0].id, 'audit-summary');
});

test('dry-run validates but does not write catalog changes', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'manifest.json', validManifest);

  const result = installManifests({ catalogPath, manifestPath, dryRun: true });
  const catalog = readCatalog(catalogPath);

  assert.equal(result.dryRun, true);
  assert.equal(result.manifestCount, 1);
  assert.equal(catalog.manifests.length, 0);
});

test('refuses to overwrite an existing manifest without replace', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'manifest.json', validManifest);

  installManifests({ catalogPath, manifestPath });

  assert.throws(
    () => installManifests({ catalogPath, manifestPath }),
    /already exists/
  );
});

test('replaces an existing manifest when replace is explicit', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'manifest.json', validManifest);
  const replacementPath = writeManifest(root, 'replacement.json', {
    ...validManifest,
    displayName: 'Audit Summary v2',
  });

  installManifests({ catalogPath, manifestPath });
  const result = installManifests({
    catalogPath,
    manifestPath: replacementPath,
    replace: true,
  });
  const catalog = readCatalog(catalogPath);

  assert.equal(result.manifestCount, 1);
  assert.equal(catalog.manifests[0].displayName, 'Audit Summary v2');
});

test('removes a manifest by id', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'manifest.json', validManifest);

  installManifests({ catalogPath, manifestPath });
  const result = removeManifest({ catalogPath, manifestId: 'audit-summary' });
  const catalog = readCatalog(catalogPath);

  assert.equal(result.manifestCount, 0);
  assert.equal(catalog.manifests.length, 0);
});

test('rejects invalid manifests and keeps catalog unchanged', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'invalid.json', {
    ...validManifest,
    id: 'invalid-route',
    navigation: [
      {
        id: 'invalid-route-nav',
        route: '/not-installed',
        labelKey: 'plugins.invalid.nav',
      },
    ],
  });

  assert.throws(
    () => installManifests({ catalogPath, manifestPath }),
    /only target known shell routes/
  );
  assert.equal(readCatalog(catalogPath).manifests.length, 0);
});

test('lists installed manifests from a catalog', () => {
  const { root, catalogPath } = createTempWorkspace();
  const manifestPath = writeManifest(root, 'manifest.json', validManifest);

  installManifests({ catalogPath, manifestPath });
  const result = listManifests({ catalogPath });

  assert.deepEqual(result.manifestIds, ['audit-summary']);
  assert.equal(result.manifestCount, 1);
});
