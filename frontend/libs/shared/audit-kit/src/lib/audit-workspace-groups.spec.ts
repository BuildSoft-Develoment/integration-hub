import { AppWorkspaceContribution } from '@integration-hub/shared/ui';
import { groupAuditWorkspacesByDomain } from './audit-workspace-groups';

describe('groupAuditWorkspacesByDomain', () => {
  const item = (partial: Partial<AppWorkspaceContribution>): AppWorkspaceContribution => ({
    id: partial.id ?? 'x',
    route: partial.route ?? '/x',
    labelKey: partial.labelKey ?? 'x',
    ...partial,
  });

  it('agrupa por dominio ordenado por domainOrder, conservando el orden de registro dentro del grupo', () => {
    const groups = groupAuditWorkspacesByDomain([
      item({ id: 'a', domain: 'swift-mt101', domainLabelKey: 'd.swift', domainOrder: 20, route: '/swift-mt101/fragments' }),
      item({ id: 'b', domain: 'platform', domainLabelKey: 'd.platform', domainOrder: 10, route: '/audit/events' }),
      item({ id: 'c', domain: 'platform', domainLabelKey: 'd.platform', domainOrder: 10, route: '/audit/spool' }),
      item({ id: 'd', domain: 'swift-mt101', domainLabelKey: 'd.swift', domainOrder: 20, route: '/swift-mt101/quarantine' }),
    ]);

    // platform (10) antes que swift-mt101 (20)
    expect(groups.map((g) => g.domain)).toEqual(['platform', 'swift-mt101']);
    expect(groups[0].labelKey).toBe('d.platform');
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'c']);
    expect(groups[1].items.map((i) => i.id)).toEqual(['a', 'd']);
  });

  it('los items sin dominio caen a "other" al final', () => {
    const groups = groupAuditWorkspacesByDomain([
      item({ id: 'a', route: '/x' }),
      item({ id: 'b', domain: 'platform', domainOrder: 10, route: '/audit/events' }),
    ]);
    expect(groups.map((g) => g.domain)).toEqual(['platform', 'other']);
    expect(groups[1].order).toBe(999);
  });
});
