import { normalizeWorkspaceContributions } from './app-workspace.registry';

describe('normalizeWorkspaceContributions', () => {
  it('orders workspace contributions by order and id', () => {
    const workspaces = normalizeWorkspaceContributions([
      { id: 'zeta', route: '/zeta', labelKey: 'nav.zeta', order: 200 },
      { id: 'beta', route: '/beta', labelKey: 'nav.beta', order: 100 },
      { id: 'alpha', route: '/alpha', labelKey: 'nav.alpha', order: 100 },
    ]);

    expect(workspaces.map((workspace) => workspace.id)).toEqual(['alpha', 'beta', 'zeta']);
  });

  it('rejects duplicated workspace routes', () => {
    expect(() =>
      normalizeWorkspaceContributions([
        { id: 'auditA', route: '/audit', labelKey: 'nav.auditA', source: 'plugin-a' },
        { id: 'auditB', route: 'audit', labelKey: 'nav.auditB', source: 'plugin-b' },
      ])
    ).toThrow(/Duplicate workspace contribution workspace route "\/audit"/);
  });
});
