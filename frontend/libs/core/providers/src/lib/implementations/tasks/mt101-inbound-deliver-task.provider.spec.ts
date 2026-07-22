import { describe, expect, it } from 'vitest';
import { Mt101InboundDeliverTaskDraft, Mt101InboundDeliverTaskProvider } from './mt101-inbound-deliver-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c-1', id: null, taskOrder: 1, taskType: 'MT101_INBOUND_DELIVER', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101InboundDeliverTaskProvider', () => {
  it('declara MT101_INBOUND_DELIVER con layout workspace', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    expect(p.descriptor.type).toBe('MT101_INBOUND_DELIVER');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft: DB por defecto + pageSize 500', () => {
    const d = new Mt101InboundDeliverTaskProvider().createDraft();
    expect(d.transport).toBe('DB');
    expect(d.pageSize).toBe(500);
    expect(d.executionMode).toBe('once');
  });

  it('DB: NO serializa rest (la tabla destino es fija en el backend)', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    const draft: Mt101InboundDeliverTaskDraft = { ...p.createDraft(), taskRef: 'ind', transport: 'DB', pageSize: 250 };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.transport).toBe('DB');
    expect(config.pageSize).toBe(250);
    expect(config.rest).toBeUndefined();
  });

  it('REST: serializa url/contentType/timeout', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    const draft: Mt101InboundDeliverTaskDraft = {
      ...p.createDraft(), taskRef: 'ind', transport: 'REST',
      rest: { url: 'https://gw/inbound', contentType: 'application/json', timeoutSeconds: 20 },
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.transport).toBe('REST');
    expect(config.rest).toEqual({ url: 'https://gw/inbound', contentType: 'application/json', timeoutSeconds: 20 });
  });

  it('roundtrip REST preserva transport/pageSize/rest', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    const initial: Mt101InboundDeliverTaskDraft = {
      ...p.createDraft(), taskRef: 'ind', transport: 'REST', pageSize: 100,
      rest: { url: 'https://gw/inbound', contentType: 'application/json', timeoutSeconds: 30 },
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.transport).toBe('REST');
    expect(rehydrated.pageSize).toBe(100);
    expect(rehydrated.rest).toEqual(initial.rest);
  });

  it('hydrateDraft usa defaults seguros para input malformado', () => {
    const d = new Mt101InboundDeliverTaskProvider().hydrateDraft({ ...baseTask, configurationJson: 'not-json' });
    expect(d.transport).toBe('DB');
    expect(d.pageSize).toBe(500);
  });
});
