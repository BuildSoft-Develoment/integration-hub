import { AppPluginManifest } from '../navigation/app-navigation.models';
import {
  buildAppPluginRegistry,
  FRONTEND_EXTENSION_PLATFORM_VERSION,
} from './app-plugin.registry';

describe('buildAppPluginRegistry', () => {
  it('normalizes plugin contributions with manifest source', () => {
    const registry = buildAppPluginRegistry([
      manifest({
        id: 'payments',
        capabilities: ['operate'],
        navigation: [
          { id: 'paymentsRules', route: '/payment-rules', labelKey: 'nav.paymentRules' },
        ],
        routes: [{ id: 'paymentsRulesRoute', path: '/payment-rules' }],
        workspaces: [
          {
            id: 'paymentsRulesWorkspace',
            route: '/payment-rules',
            labelKey: 'nav.paymentRules',
            mode: 'configuration',
          },
        ],
        actions: [
          {
            id: 'paymentsRulesRefresh',
            labelKey: 'payments.refresh',
            command: 'payments.rules.refresh',
          },
        ],
      }),
    ]);

    expect(registry.navigation[0]).toMatchObject({
      id: 'paymentsRules',
      source: 'payments',
      order: 0,
    });
    expect(registry.routes[0]).toMatchObject({
      id: 'paymentsRulesRoute',
      source: 'payments',
    });
    expect(registry.workspaces[0]).toMatchObject({
      id: 'paymentsRulesWorkspace',
      source: 'payments',
    });
    expect(registry.actions[0]).toMatchObject({
      id: 'paymentsRulesRefresh',
      source: 'payments',
      kind: 'command',
    });
    expect(registry.capabilities).toEqual(['operate']);
  });

  it('rejects duplicate plugin ids', () => {
    expect(() =>
      buildAppPluginRegistry([manifest({ id: 'audit' }), manifest({ id: 'audit' })])
    ).toThrow(/Duplicate plugin contribution plugin id "audit"/);
  });

  it('rejects incompatible platform major versions', () => {
    expect(() =>
      buildAppPluginRegistry([
        manifest({ id: 'legacy', platformVersion: '2.0.0' }),
      ])
    ).toThrow(/targets platform "2.0.0"/);
  });

  it('rejects route path collisions across plugins', () => {
    expect(() =>
      buildAppPluginRegistry([
        manifest({
          id: 'plugin-a',
          routes: [{ id: 'routeA', path: '/audit' }],
        }),
        manifest({
          id: 'plugin-b',
          routes: [{ id: 'routeB', path: '/audit' }],
        }),
      ])
    ).toThrow(/Duplicate plugin contribution route path "\/audit"/);
  });

  it('rejects workspace route collisions across plugins', () => {
    expect(() =>
      buildAppPluginRegistry([
        manifest({
          id: 'plugin-a',
          workspaces: [{ id: 'workspaceA', route: '/audit', labelKey: 'nav.audit' }],
        }),
        manifest({
          id: 'plugin-b',
          workspaces: [{ id: 'workspaceB', route: '/audit', labelKey: 'nav.auditB' }],
        }),
      ])
    ).toThrow(/Duplicate plugin contribution workspace route "\/audit"/);
  });

  it('rejects action id collisions across plugins', () => {
    expect(() =>
      buildAppPluginRegistry([
        manifest({
          id: 'plugin-a',
          actions: [{ id: 'refresh', labelKey: 'refresh', command: 'plugin-a.refresh' }],
        }),
        manifest({
          id: 'plugin-b',
          actions: [{ id: 'refresh', labelKey: 'refreshB', command: 'plugin-b.refresh' }],
        }),
      ])
    ).toThrow(/Duplicate action contribution action id "refresh"/);
  });
});

function manifest(overrides: Partial<AppPluginManifest>): AppPluginManifest {
  return {
    id: 'plugin',
    version: '1.0.0',
    platformVersion: FRONTEND_EXTENSION_PLATFORM_VERSION,
    displayName: 'Plugin',
    ...overrides,
  };
}
