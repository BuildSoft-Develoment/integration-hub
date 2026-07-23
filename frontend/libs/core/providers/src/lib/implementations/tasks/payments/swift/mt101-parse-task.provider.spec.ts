import { describe, expect, it } from 'vitest';
import { Mt101ParseTaskDraft, Mt101ParseTaskProvider } from './mt101-parse-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'MT101_PARSE', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101ParseTaskProvider', () => {
  it('declares MT101_PARSE with workspace layout', () => {
    const p = new Mt101ParseTaskProvider();
    expect(p.descriptor.type).toBe('MT101_PARSE');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft defaults to once + interpretSequenceAB=true + multiOutput=false', () => {
    const draft = new Mt101ParseTaskProvider().createDraft();
    expect(draft.executionMode).toBe('once');
    expect(draft.interpretSequenceAB).toBe(true);
    expect(draft.publishMultiOutput).toBe(false);
  });

  it('serializes flags', () => {
    const p = new Mt101ParseTaskProvider();
    const draft: Mt101ParseTaskDraft = {
      ...p.createDraft(),
      taskRef: 'parse',
      interpretSequenceAB: false,
      publishMultiOutput: true,
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.interpretSequenceAB).toBe(false);
    expect(config.publishMultiOutput).toBe(true);
  });

  it('roundtrip preserves flags', () => {
    const p = new Mt101ParseTaskProvider();
    const initial: Mt101ParseTaskDraft = {
      ...p.createDraft(),
      taskRef: 'p1',
      interpretSequenceAB: true,
      publishMultiOutput: true,
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });
});
