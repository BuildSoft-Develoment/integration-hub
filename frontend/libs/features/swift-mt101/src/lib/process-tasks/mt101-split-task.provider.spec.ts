import { describe, expect, it } from 'vitest';
import { Mt101SplitTaskDraft, Mt101SplitTaskProvider } from './mt101-split-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'MT101_SPLIT', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101SplitTaskProvider', () => {
  it('declares MT101_SPLIT with workspace layout', () => {
    const p = new Mt101SplitTaskProvider();
    expect(p.descriptor.type).toBe('MT101_SPLIT');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns defaults aligned with backend', () => {
    const draft = new Mt101SplitTaskProvider().createDraft();
    expect(draft.executionMode).toBe('once');
    expect(draft.maxTransactionsPerFragment).toBe(100);
    expect(draft.maxBytesPerFragment).toBe(10000);
    expect(draft.rebuildIndexTotal).toBe(true);
    expect(draft.fragmentReferenceTemplate).toContain('${sendersReference}');
  });

  it('serializes all fields', () => {
    const p = new Mt101SplitTaskProvider();
    const draft: Mt101SplitTaskDraft = {
      ...p.createDraft(),
      taskRef: 'split',
      maxTransactionsPerFragment: 50,
      maxBytesPerFragment: 5000,
      rebuildIndexTotal: false,
      fragmentReferenceTemplate: 'F${fragmentIndex}',
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.maxTransactionsPerFragment).toBe(50);
    expect(config.maxBytesPerFragment).toBe(5000);
    expect(config.rebuildIndexTotal).toBe(false);
    expect(config.fragmentReferenceTemplate).toBe('F${fragmentIndex}');
  });

  it('roundtrip preserves all fields', () => {
    const p = new Mt101SplitTaskProvider();
    const initial: Mt101SplitTaskDraft = {
      ...p.createDraft(),
      taskRef: 's1',
      maxTransactionsPerFragment: 75,
      maxBytesPerFragment: 7500,
      rebuildIndexTotal: true,
      fragmentReferenceTemplate: 'X-${fragmentIndex}',
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });
});
