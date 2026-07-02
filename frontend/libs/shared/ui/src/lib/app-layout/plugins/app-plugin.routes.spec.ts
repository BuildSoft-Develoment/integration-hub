import {
  buildAppRoutesFromContributions,
  buildAppRoutesFromPluginManifests,
} from './app-plugin.routes';

describe('buildAppRoutesFromContributions', () => {
  it('wraps plugin route contributions with shell redirects', () => {
    const routes = buildAppRoutesFromContributions(
      [
        {
          id: 'audit',
          path: '/audit',
          titleKey: 'audit.title',
          requiredCapability: 'audit',
          loadChildren: async () => [],
        },
      ],
      { defaultRedirectTo: 'overview' }
    );

    expect(routes[0]).toMatchObject({
      path: '',
      pathMatch: 'full',
      redirectTo: 'overview',
    });
    expect(routes[1]).toMatchObject({
      path: 'audit',
      data: {
        titleKey: 'audit.title',
        pluginRouteId: 'audit',
      },
    });
    expect(routes[2]).toMatchObject({
      path: '**',
      redirectTo: 'overview',
    });
  });

  it('rejects duplicated route paths before Angular router receives them', () => {
    expect(() =>
      buildAppRoutesFromContributions([
        { id: 'auditA', path: '/audit', loadChildren: async () => [] },
        { id: 'auditB', path: '/audit', loadChildren: async () => [] },
      ])
    ).toThrow(/Duplicate plugin contribution route path "\/audit"/);
  });

  it('preserves manifest source in route metadata', () => {
    const routes = buildAppRoutesFromPluginManifests([
      {
        id: 'platform',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Platform',
        routes: [{ id: 'overview', path: '/overview', loadChildren: async () => [] }],
      },
    ]);

    expect(routes[0].data).toMatchObject({
      pluginSource: 'platform',
      pluginRouteId: 'overview',
    });
  });
});
