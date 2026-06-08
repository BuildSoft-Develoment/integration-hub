import { describe, expect, it } from 'vitest';
import { Mt101RouteTaskDraft, Mt101RouteTaskProvider } from './mt101-route-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c-1', id: null, taskOrder: 1, taskType: 'MT101_ROUTE', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101RouteTaskProvider', () => {
  it('declares MT101_ROUTE with workspace layout', () => {
    const p = new Mt101RouteTaskProvider();
    expect(p.descriptor.type).toBe('MT101_ROUTE');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns one starter rule and UNROUTED default', () => {
    const draft = new Mt101RouteTaskProvider().createDraft();
    expect(draft.executionMode).toBe('once');
    expect(draft.rules).toHaveLength(1);
    expect(draft.defaultRoute).toBe('UNROUTED');
    expect(draft.routeField).toBe('routedAs');
  });

  it('serializes only rules with all required fields populated', () => {
    const p = new Mt101RouteTaskProvider();
    const draft: Mt101RouteTaskDraft = {
      ...p.createDraft(),
      taskRef: 'route',
      rules: [
        { name: 'r1', predicate: 'a == 1', routeTo: 'A' },
        { name: '', predicate: 'b == 2', routeTo: 'B' }, // sin name -> drop
        { name: 'r3', predicate: '', routeTo: 'C' },     // sin predicate -> drop
        { name: 'r4', predicate: 'd == 4', routeTo: '' }, // sin routeTo -> drop
      ],
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.rules).toHaveLength(1);
    expect(config.rules[0]).toEqual({ name: 'r1', predicate: 'a == 1', routeTo: 'A' });
  });

  it('roundtrip preserves rules + defaultRoute + routeField', () => {
    const p = new Mt101RouteTaskProvider();
    const initial: Mt101RouteTaskDraft = {
      ...p.createDraft(),
      taskRef: 'r1',
      rules: [
        { name: 'same-bank', predicate: 'beneficiaryBic == "BCPLPEPL"', routeTo: 'BOOK_TRANSFER' },
        { name: 'domestic', predicate: 'endsWith(beneficiaryBic, "PE")', routeTo: 'LOCAL_CLEARING' },
      ],
      defaultRoute: 'MT103_OUTBOUND',
      routeField: 'channel',
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.rules).toEqual(initial.rules);
    expect(rehydrated.defaultRoute).toBe('MT103_OUTBOUND');
    expect(rehydrated.routeField).toBe('channel');
  });

  it('hydrateDraft uses safe defaults for malformed input', () => {
    const p = new Mt101RouteTaskProvider();
    const draft = p.hydrateDraft({ ...baseTask, configurationJson: 'not-json' });
    expect(draft.defaultRoute).toBe('UNROUTED');
    expect(draft.routeField).toBe('routedAs');
    expect(draft.rules).toEqual([]);
  });
});
