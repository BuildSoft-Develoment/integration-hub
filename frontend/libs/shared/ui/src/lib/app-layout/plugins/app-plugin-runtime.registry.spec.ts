import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppPluginManifest } from '../navigation/app-navigation.models';
import { provideAppPluginManifests } from './app-plugin.token';
import {
  AppPluginRuntimeRegistry,
  provideAppPluginCatalogFetch,
  provideAppPluginRemoteOrigins,
  provideAppPluginRemoteTrustedKeys,
} from './app-plugin-runtime.registry';

const VALID_INTEGRITY = `sha384-${'A'.repeat(64)}`;
const VALID_SIGNATURE = `key-1:${'A'.repeat(43)}=`;

describe('AppPluginRuntimeRegistry', () => {
  function configure(
    staticManifest: AppPluginManifest = platformManifest(),
    extraProviders: Provider[] = []
  ) {
    TestBed.configureTestingModule({
      providers: [...provideAppPluginManifests([staticManifest]), ...extraProviders],
    });
    return TestBed.inject(AppPluginRuntimeRegistry);
  }

  it('loads metadata-only external manifests that point to known routes', () => {
    const registry = configure();

    registry.registerExternalManifests([
      {
        id: 'audit-help',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Audit Help',
        workspaces: [
          {
            id: 'audit-help-spool',
            group: 'audit-help',
            route: '/audit',
            labelKey: 'audit.help.spool',
            mode: 'query',
          },
        ],
        actions: [
          {
            id: 'audit-help-open-spool',
            labelKey: 'audit.help.openSpool',
            kind: 'navigation',
            route: '/audit/spool',
          },
          {
            id: 'audit-help-docs',
            labelKey: 'audit.help.docs',
            kind: 'external-link',
            href: 'https://example.com/audit-help',
          },
        ],
      },
    ]);

    expect(registry.manifests().map((manifest) => manifest.id)).toEqual([
      'platform',
      'audit-help',
    ]);
    expect(registry.workspaces().map((workspace) => workspace.id)).toContain('audit-help-spool');
    expect(registry.actions().map((action) => action.id)).toEqual([
      'audit-help-open-spool',
      'audit-help-docs',
    ]);
  });

  it('rejects external manifests that declare Angular routes', () => {
    const registry = configure();

    expect(() =>
      registry.registerExternalManifests([
        {
          id: 'remote-code',
          version: '1.0.0',
          platformVersion: '1.0.0',
          displayName: 'Remote Code',
          routes: [{ id: 'remote', path: '/remote' }],
        },
      ])
    ).toThrow(/cannot declare Angular routes/);
  });

  it('rejects external navigation pointing to unknown routes', () => {
    const registry = configure();

    expect(() =>
      registry.registerExternalManifests([
        {
          id: 'broken-link',
          version: '1.0.0',
          platformVersion: '1.0.0',
          displayName: 'Broken Link',
          navigation: [{ id: 'broken', route: '/missing', labelKey: 'nav.missing' }],
        },
      ])
    ).toThrow(/unknown route "\/missing"/);
  });

  it('rejects external actions pointing to unknown routes', () => {
    const registry = configure();

    expect(() =>
      registry.registerExternalManifests([
        {
          id: 'broken-action-link',
          version: '1.0.0',
          platformVersion: '1.0.0',
          displayName: 'Broken Action Link',
          actions: [
            {
              id: 'open-missing',
              labelKey: 'action.missing',
              kind: 'navigation',
              route: '/missing',
            },
          ],
        },
      ])
    ).toThrow(/unknown route "\/missing"/);
  });

  it('rejects unsafe external action hrefs', () => {
    const registry = configure();

    expect(() =>
      registry.registerExternalManifests([
        {
          id: 'unsafe-link',
          version: '1.0.0',
          platformVersion: '1.0.0',
          displayName: 'Unsafe Link',
          actions: [
            {
              id: 'open-docs',
              labelKey: 'action.docs',
              href: 'http://example.com/docs',
            },
          ],
        },
      ])
    ).toThrow(/Only https:\/\/ links are allowed/);
  });

  it('installs valid plugins and quarantines invalid siblings in the same batch', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      {
        id: 'good-help',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Good Help',
        actions: [
          { id: 'good-open', labelKey: 'action.good', kind: 'navigation', route: '/audit' },
        ],
      },
      {
        id: 'bad-link',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Bad Link',
        navigation: [{ id: 'bad', route: '/missing', labelKey: 'nav.bad' }],
      },
    ]);

    expect(report.accepted).toEqual(['good-help']);
    expect(report.rejected.map((rejected) => rejected.id)).toEqual(['bad-link']);
    expect(report.rejected[0].reason).toMatch(/unknown route/);
    expect(registry.manifests().map((manifest) => manifest.id)).toEqual([
      'platform',
      'good-help',
    ]);
    expect(registry.actions().map((action) => action.id)).toContain('good-open');
  });

  it('quarantines a plugin whose id collides with the platform and keeps the shell intact', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      { id: 'platform', version: '9.9.9', platformVersion: '1.0.0', displayName: 'Impostor' },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected.map((rejected) => rejected.id)).toEqual(['platform']);
    expect(registry.manifests().map((manifest) => manifest.id)).toEqual(['platform']);
    // The shell snapshot still builds for the surviving (platform) manifest.
    expect(registry.navigation().length).toBeGreaterThan(0);
  });

  it('quarantines plugins targeting an incompatible platform major', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      { id: 'future', version: '1.0.0', platformVersion: '2.0.0', displayName: 'Future' },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('future');
    expect(report.rejected[0].reason).toMatch(/platform/);
  });

  it('quarantines metadata manifests that smuggle Angular routes without throwing', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      {
        id: 'remote-code',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Code',
        routes: [{ id: 'remote', path: '/remote' }],
      },
    ]);

    expect(report.rejected.map((rejected) => rejected.id)).toEqual(['remote-code']);
    expect(registry.rejected().map((rejected) => rejected.id)).toEqual(['remote-code']);
  });

  it('quarantines keys outside the plugin declared i18n namespaces', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      {
        id: 'scoped',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Scoped',
        i18nNamespaces: ['scoped'],
        actions: [
          { id: 'scoped-open', labelKey: 'platform.audit', kind: 'navigation', route: '/audit' },
        ],
      },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('scoped');
    expect(report.rejected[0].reason).toMatch(/outside its declared i18n namespaces/);
  });

  it('accepts plugin keys that fall inside a declared namespace', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      {
        id: 'scoped-ok',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Scoped OK',
        i18nNamespaces: ['scoped-ok'],
        actions: [
          { id: 'scoped-ok-open', labelKey: 'scoped-ok.open', kind: 'navigation', route: '/audit' },
        ],
      },
    ]);

    expect(report.accepted).toEqual(['scoped-ok']);
    expect(report.rejected).toEqual([]);
  });

  it('reports installed and quarantined plugins for diagnostics', () => {
    const registry = configure();

    registry.installExternalManifests([
      {
        id: 'good-help',
        version: '2.1.0',
        platformVersion: '1.0.0',
        displayName: 'Good Help',
        actions: [
          { id: 'good-open', labelKey: 'action.good', kind: 'navigation', route: '/audit' },
        ],
      },
      { id: 'future', version: '1.0.0', platformVersion: '2.0.0', displayName: 'Future' },
    ]);

    const diagnostics = registry.diagnostics();
    expect(diagnostics.installed).toEqual([
      { id: 'platform', displayName: 'Platform', version: '1.0.0', origin: 'static' },
      { id: 'good-help', displayName: 'Good Help', version: '2.1.0', origin: 'external' },
    ]);
    expect(diagnostics.quarantined.map((entry) => entry.id)).toEqual(['future']);
  });

  it('surfaces degraded plugins in diagnostics and replaces prior reasons', () => {
    const registry = configure();

    registry.markDegraded('remote-x', 'load failed: boom');
    registry.markDegraded('remote-x', 'verification failed: invalid-signature');

    expect(registry.diagnostics().degraded).toEqual([
      { id: 'remote-x', reason: 'verification failed: invalid-signature' },
    ]);
  });

  it('accepts a remote plugin from an allowlisted origin signed by a trusted key', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['https://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-ok',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote OK',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: VALID_SIGNATURE,
        },
      },
    ]);

    expect(report.accepted).toEqual(['remote-ok']);
    expect(report.rejected).toEqual([]);
  });

  it('quarantines a remote plugin from a non-allowlisted origin', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['https://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-bad-origin',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Bad Origin',
        remote: {
          url: 'https://evil.example.net/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: VALID_SIGNATURE,
        },
      },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('remote-bad-origin');
    expect(report.rejected[0].reason).toMatch(/not in the allowed plugin origins/);
  });

  it('accepts an http remote on localhost (dev parity with backend) when allowlisted and signed', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['http://localhost:4300']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-local-http',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Local Http',
        remote: {
          url: 'http://localhost:4300/remoteEntry.json',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: VALID_SIGNATURE,
        },
      },
    ]);

    expect(report.accepted).toEqual(['remote-local-http']);
    expect(report.rejected).toEqual([]);
  });

  it('still quarantines an http remote on a non-local host', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['http://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-http-remote-host',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Http Remote Host',
        remote: {
          url: 'http://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: VALID_SIGNATURE,
        },
      },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('remote-http-remote-host');
    expect(report.rejected[0].reason).toMatch(/http:\/\/ is allowed only for localhost/);
  });

  it('quarantines a remote plugin missing provenance fields', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['https://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-no-sig',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote No Sig',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: '',
        },
      },
    ]);

    expect(report.rejected[0].reason).toMatch(/missing "signature"/);
  });

  // Mirrors apps/sample-plugin/manifest.json (the author reference remote).
  function samplePluginManifest(): AppPluginManifest {
    return {
      id: 'sample-plugin',
      version: '1.0.0',
      platformVersion: '1.0.0',
      displayName: 'Sample Plugin',
      remote: {
        url: 'https://plugins.example.com/remoteEntry.json',
        exposedModule: './Widget',
        integrity: `sha384-${'A'.repeat(64)}`,
        signature: `sample-plugin-key-1:${'A'.repeat(43)}=`,
      },
    };
  }

  it('accepts the sample-plugin remote when its origin and key are allowlisted', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['https://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['sample-plugin-key-1']),
    ]);

    const report = registry.installExternalManifests([samplePluginManifest()]);

    expect(report.accepted).toEqual(['sample-plugin']);
    expect(report.rejected).toEqual([]);
    expect(
      registry.diagnostics().installed.some(
        (plugin) => plugin.id === 'sample-plugin' && plugin.origin === 'external'
      )
    ).toBe(true);
  });

  it('quarantines the sample-plugin remote under the default fail-safe allowlists', () => {
    const registry = configure();

    const report = registry.installExternalManifests([samplePluginManifest()]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('sample-plugin');
    expect(report.rejected[0].reason).toMatch(/not in the allowed plugin origins/);
  });

  it('previews an acceptable manifest without mutating the registry', () => {
    const registry = configure();

    const result = registry.previewExternalManifest({
      id: 'preview-demo',
      version: '1.0.0',
      platformVersion: '1.0.0',
      displayName: 'Preview Demo',
      i18nNamespaces: ['previewDemo'],
      actions: [
        {
          id: 'preview-demo-run',
          group: 'overview',
          labelKey: 'previewDemo.run',
          command: 'previewDemo.run',
        },
      ],
    });

    expect(result.accepted).toBe(true);
    // Non-mutating: nothing was installed.
    expect(registry.diagnostics().installed.some((p) => p.id === 'preview-demo')).toBe(false);
    expect(registry.diagnostics().quarantined).toEqual([]);
  });

  function commandManifest(id: string, ns: string): AppPluginManifest {
    return {
      id,
      version: '1.0.0',
      platformVersion: '1.0.0',
      displayName: id,
      i18nNamespaces: [ns],
      actions: [{ id: `${id}-run`, group: 'g', labelKey: `${ns}.run`, command: `${ns}.run` }],
    };
  }

  it('merges multiple external catalogs into a single install', async () => {
    const registry = configure();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ manifests: [commandManifest('cat-a', 'catA')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ manifests: [commandManifest('cat-b', 'catB')] }) });
    vi.stubGlobal('fetch', fetchMock);

    await registry.loadExternalManifestCatalogs([
      { url: '/plugins/catalog.json' },
      { url: '/api/plugins/ui-catalog' },
    ]);

    const ids = registry.diagnostics().installed.map((plugin) => plugin.id);
    expect(ids).toContain('cat-a');
    expect(ids).toContain('cat-b');
    vi.unstubAllGlobals();
  });

  it('uses the injected catalog fetch seam (so the app can attach an auth token)', async () => {
    const authedFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ manifests: [commandManifest('cat-auth', 'catAuth')] }) });
    const globalFetch = vi.fn();
    vi.stubGlobal('fetch', globalFetch);
    const registry = configure(platformManifest(), [provideAppPluginCatalogFetch(authedFetch)]);

    await registry.loadExternalManifestCatalogs([{ url: '/api/plugins/ui-catalog' }]);

    expect(authedFetch).toHaveBeenCalledWith('/api/plugins/ui-catalog', expect.anything());
    expect(globalFetch).not.toHaveBeenCalled();
    expect(registry.diagnostics().installed.map((plugin) => plugin.id)).toContain('cat-auth');
    vi.unstubAllGlobals();
  });

  it('keeps merging when an optional catalog source fails', async () => {
    const registry = configure();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ manifests: [commandManifest('cat-b', 'catB')] }) });
    vi.stubGlobal('fetch', fetchMock);

    await registry.loadExternalManifestCatalogs([
      { url: '/plugins/catalog.json' },
      { url: '/api/plugins/ui-catalog' },
    ]);

    expect(registry.diagnostics().installed.map((plugin) => plugin.id)).toContain('cat-b');
    vi.unstubAllGlobals();
  });

  it('previews the quarantine reason for an untrusted manifest', () => {
    const registry = configure();

    const result = registry.previewExternalManifest(samplePluginManifest());

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/not in the allowed plugin origins/);
    // Non-mutating: the failed preview did not quarantine anything either.
    expect(registry.diagnostics().quarantined).toEqual([]);
  });

  it('quarantines a remote with a malformed SRI integrity hash', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['https://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-bad-integrity',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Bad Integrity',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: 'sha384-abc',
          signature: VALID_SIGNATURE,
        },
      },
    ]);

    expect(report.rejected[0].reason).toMatch(/not a valid SRI hash/);
  });

  it('quarantines a remote signed by an untrusted key', () => {
    const registry = configure(platformManifest(), [
      provideAppPluginRemoteOrigins(['https://plugins.example.com']),
      provideAppPluginRemoteTrustedKeys(['key-1']),
    ]);

    const report = registry.installExternalManifests([
      {
        id: 'remote-rogue-key',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Rogue Key',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: `rogue-key:${'A'.repeat(43)}=`,
        },
      },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('remote-rogue-key');
    expect(report.rejected[0].reason).toMatch(/not signed by a trusted key/);
  });

  it('quarantines remote plugins by default when no origin is allowlisted', () => {
    const registry = configure();

    const report = registry.installExternalManifests([
      {
        id: 'remote-default-deny',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Remote Default Deny',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.js',
          exposedModule: './Widget',
          integrity: VALID_INTEGRITY,
          signature: VALID_SIGNATURE,
        },
      },
    ]);

    expect(report.accepted).toEqual([]);
    expect(report.rejected[0].id).toBe('remote-default-deny');
  });
});

function platformManifest(): AppPluginManifest {
  return {
    id: 'platform',
    version: '1.0.0',
    platformVersion: '1.0.0',
    displayName: 'Platform',
    navigation: [{ id: 'audit', route: '/audit', labelKey: 'nav.audit' }],
    routes: [{ id: 'audit', path: '/audit' }],
    workspaces: [
      {
        id: 'audit-spool',
        group: 'audit',
        route: '/audit/spool',
        labelKey: 'audit.workspace.spool',
      },
    ],
  };
}
