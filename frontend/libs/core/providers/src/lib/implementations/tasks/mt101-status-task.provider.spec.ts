import { describe, expect, it } from 'vitest';
import { Mt101StatusTaskDraft, Mt101StatusTaskProvider } from './mt101-status-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'MT101_STATUS', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101StatusTaskProvider', () => {
  it('declares MT101_STATUS with workspace layout', () => {
    const p = new Mt101StatusTaskProvider();
    expect(p.descriptor.type).toBe('MT101_STATUS');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft defaults to query mode + per-record', () => {
    const draft = new Mt101StatusTaskProvider().createDraft();
    expect(draft.mode).toBe('query');
    expect(draft.executionMode).toBe('per-record');
    expect(draft.queryMethod).toBe('GET');
    expect(draft.statusField).toBe('$.status');
  });

  it('serializes query + expectedGatewayResponse blocks', () => {
    const p = new Mt101StatusTaskProvider();
    const draft: Mt101StatusTaskDraft = {
      ...p.createDraft(),
      taskRef: 'st',
      queryUrl: 'https://x/status/${gatewayReference}',
      queryTimeoutSeconds: 45,
      connectionRef: '12',
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.mode).toBe('query');
    expect(config.query.url).toBe('https://x/status/${gatewayReference}');
    expect(config.query.timeoutSeconds).toBe(45);
    expect(config.expectedGatewayResponse.statusField).toBe('$.status');
    expect(config.connectionRef).toBe('12');
  });

  it('normalizes invalid mode to query', () => {
    const p = new Mt101StatusTaskProvider();
    const draft = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'x', executionMode: 'per-record', mode: 'WHATEVER',
      }),
    });
    expect(draft.mode).toBe('query');
  });

  it('preserves poll/callback when explicit (UI puede ofrecerlos aunque backend rechace)', () => {
    const p = new Mt101StatusTaskProvider();
    const draftPoll = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({ taskRef: 'x', executionMode: 'per-record', mode: 'poll' }),
    });
    expect(draftPoll.mode).toBe('poll');

    const draftCb = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({ taskRef: 'x', executionMode: 'per-record', mode: 'callback' }),
    });
    expect(draftCb.mode).toBe('callback');
  });

  it('roundtrip preserves all fields', () => {
    const p = new Mt101StatusTaskProvider();
    const initial: Mt101StatusTaskDraft = {
      ...p.createDraft(),
      taskRef: 's1',
      mode: 'query',
      queryUrl: 'https://gw.bank/v1/status/${gatewayReference}',
      queryMethod: 'GET',
      queryTimeoutSeconds: 20,
      statusField: '$.data.state',
      referenceField: '$.data.id',
      errorMessageField: '$.error.detail',
      connectionRef: '7',
      confirmationTable: 'custom_conf',
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });
});
