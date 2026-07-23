import { describe, expect, it } from 'vitest';
import { Mt101RouteTaskDraft, Mt101RouteTaskProvider } from './mt101-route-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

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

  it('serializa TODAS las reglas tal cual, incluidas las incompletas (para no romper la edicion inline)', () => {
    // Las filas repetibles no se filtran al serializar (igual que MT101_REPAIR/FILE_WRITE): una regla recien
    // agregada (vacia) debe SOBREVIVIR el round-trip para poder tipearla. El backend valida en ejecucion.
    const p = new Mt101RouteTaskProvider();
    const draft: Mt101RouteTaskDraft = {
      ...p.createDraft(),
      taskRef: 'route',
      rules: [
        { name: 'r1', predicate: 'a == 1', routeTo: 'A' },
        { name: '', predicate: '', routeTo: '' },        // recien agregada -> se conserva
        { name: 'r3', predicate: '', routeTo: 'C' },     // en edicion -> se conserva
      ],
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.rules).toHaveLength(3);
    expect(config.rules).toEqual(draft.rules);
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
