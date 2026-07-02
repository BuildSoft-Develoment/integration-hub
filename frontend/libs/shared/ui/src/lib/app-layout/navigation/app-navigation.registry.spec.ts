import { normalizeNavigationContributions } from './app-navigation.registry';
import { AppNavigationContribution } from './app-navigation.models';

describe('normalizeNavigationContributions', () => {
  it('orders navigation contributions by order and id', () => {
    const items: AppNavigationContribution[] = [
      { id: 'zeta', route: '/zeta', labelKey: 'nav.zeta', order: 200, source: 'plugin-a' },
      { id: 'alpha', route: '/alpha', labelKey: 'nav.alpha', order: 100, source: 'plugin-b' },
      { id: 'beta', route: '/beta', labelKey: 'nav.beta', order: 100, source: 'plugin-c' },
    ];

    expect(normalizeNavigationContributions(items).map((item) => item.id)).toEqual([
      'alpha',
      'beta',
      'zeta',
    ]);
  });

  it('keeps legacy navigation compatible as source legacy', () => {
    const [item] = normalizeNavigationContributions([], [
      { id: 'overview', route: '/overview', labelKey: 'nav.overview' },
    ]);

    expect(item).toMatchObject({
      id: 'overview',
      route: '/overview',
      source: 'legacy',
      order: 0,
    });
  });

  it('rejects duplicated ids before a plugin can shadow shell navigation', () => {
    expect(() =>
      normalizeNavigationContributions([
        { id: 'audit', route: '/audit', labelKey: 'nav.audit', source: 'platform' },
        { id: 'audit', route: '/plugin-audit', labelKey: 'nav.pluginAudit', source: 'plugin-a' },
      ])
    ).toThrow(/Duplicate navigation id "audit"/);
  });

  it('rejects duplicated routes before a plugin can hijack a path', () => {
    expect(() =>
      normalizeNavigationContributions([
        { id: 'audit', route: '/audit', labelKey: 'nav.audit', source: 'platform' },
        { id: 'pluginAudit', route: '/audit', labelKey: 'nav.pluginAudit', source: 'plugin-a' },
      ])
    ).toThrow(/Duplicate navigation route "\/audit"/);
  });
});
