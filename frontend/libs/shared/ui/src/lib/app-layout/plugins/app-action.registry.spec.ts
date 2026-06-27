import { normalizeActionContributions } from './app-action.registry';

describe('normalizeActionContributions', () => {
  it('orders action contributions by order and id', () => {
    const actions = normalizeActionContributions([
      { id: 'zeta', labelKey: 'action.zeta', command: 'zeta.run', order: 200 },
      { id: 'beta', labelKey: 'action.beta', command: 'beta.run', order: 100 },
      { id: 'alpha', labelKey: 'action.alpha', command: 'alpha.run', order: 100 },
    ]);

    expect(actions.map((action) => action.id)).toEqual(['alpha', 'beta', 'zeta']);
  });

  it('infers action kind from route metadata', () => {
    const actions = normalizeActionContributions([
      { id: 'open-audit', labelKey: 'action.openAudit', route: '/audit' },
    ]);

    expect(actions[0]).toMatchObject({
      id: 'open-audit',
      kind: 'navigation',
      route: '/audit',
    });
  });

  it('rejects duplicated action ids', () => {
    expect(() =>
      normalizeActionContributions([
        { id: 'sync', labelKey: 'action.sync', command: 'sync.run', source: 'plugin-a' },
        { id: 'sync', labelKey: 'action.syncAgain', command: 'sync.again', source: 'plugin-b' },
      ])
    ).toThrow(/Duplicate action contribution action id "sync"/);
  });

  it('rejects command actions without command identifiers', () => {
    expect(() =>
      normalizeActionContributions([
        { id: 'missing-command', labelKey: 'action.missing', kind: 'command' },
      ])
    ).toThrow(/action missing-command command/);
  });
});
