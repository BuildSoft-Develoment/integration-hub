import { describe, expect, it } from 'vitest';
import { Mt101InboundDeliverTaskDraft, Mt101InboundDeliverTaskProvider } from './mt101-inbound-deliver-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

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

  it('createDraft: DB por defecto + pageSize 500 + slice HTTP base', () => {
    const d = new Mt101InboundDeliverTaskProvider().createDraft();
    expect(d.transport).toBe('DB');
    expect(d.pageSize).toBe(500);
    expect(d.executionMode).toBe('once');
    expect(d.method).toBe('POST');
    expect(d.authType).toBe('');
  });

  it('DB: NO serializa el slice HTTP (la tabla destino es fija en el backend)', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    const draft: Mt101InboundDeliverTaskDraft = { ...p.createDraft(), taskRef: 'ind', transport: 'DB', pageSize: 250 };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.transport).toBe('DB');
    expect(config.pageSize).toBe(250);
    expect(config.url).toBeUndefined();
    expect(config.authType).toBeUndefined();
  });

  it('REST: serializa el slice HTTP (url/method/auth via HttpRequestSupport)', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    const draft: Mt101InboundDeliverTaskDraft = {
      ...p.createDraft(), taskRef: 'ind', transport: 'REST',
      baseUrl: 'https://gw.banco/inbound', authType: 'bearer', token: 't0k',
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.transport).toBe('REST');
    expect(config.pageSize).toBe(500);
    expect(config.url).toBe('https://gw.banco/inbound');
    expect(config.method).toBe('POST');
    expect(config.authType).toBe('bearer');
    expect(config.token).toBe('t0k');
  });

  it('roundtrip REST preserva transport/pageSize/auth', () => {
    const p = new Mt101InboundDeliverTaskProvider();
    const initial: Mt101InboundDeliverTaskDraft = {
      ...p.createDraft(), taskRef: 'ind', transport: 'REST', pageSize: 100,
      baseUrl: 'https://gw.banco/inbound', authType: 'bearer', token: 'abc',
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.transport).toBe('REST');
    expect(rehydrated.pageSize).toBe(100);
    expect(rehydrated.url).toBe('https://gw.banco/inbound');
    expect(rehydrated.authType).toBe('bearer');
    expect(rehydrated.token).toBe('abc');
  });

  it('hydrateDraft usa defaults seguros para input malformado', () => {
    const d = new Mt101InboundDeliverTaskProvider().hydrateDraft({ ...baseTask, configurationJson: 'not-json' });
    expect(d.transport).toBe('DB');
    expect(d.pageSize).toBe(500);
  });
});
