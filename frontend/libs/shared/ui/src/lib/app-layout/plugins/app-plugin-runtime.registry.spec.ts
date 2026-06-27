import { TestBed } from '@angular/core/testing';

import { AppPluginManifest } from '../navigation/app-navigation.models';
import { provideAppPluginManifests } from './app-plugin.token';
import { AppPluginRuntimeRegistry } from './app-plugin-runtime.registry';

describe('AppPluginRuntimeRegistry', () => {
  function configure(staticManifest: AppPluginManifest = platformManifest()) {
    TestBed.configureTestingModule({
      providers: [...provideAppPluginManifests([staticManifest])],
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
      },
    ]);

    expect(registry.manifests().map((manifest) => manifest.id)).toEqual([
      'platform',
      'audit-help',
    ]);
    expect(registry.workspaces().map((workspace) => workspace.id)).toContain('audit-help-spool');
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
