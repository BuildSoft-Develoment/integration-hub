import { describe, expect, it } from 'vitest';
import { Mt101ReconcileTaskDraft, Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'MT101_RECONCILE', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101ReconcileTaskProvider', () => {
  it('declares MT101_RECONCILE with workspace layout', () => {
    const p = new Mt101ReconcileTaskProvider();
    expect(p.descriptor.type).toBe('MT101_RECONCILE');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns sensible defaults', () => {
    const draft = new Mt101ReconcileTaskProvider().createDraft();
    expect(draft.executionMode).toBe('once');
    expect(draft.sentTable).toBe('mt101_archive');
    expect(draft.confirmationTable).toBe('mt101_confirmation');
    expect(draft.matchKeys).toBe('senders_reference');
    expect(draft.lookbackDays).toBe(5);
  });

  it('serializes matchKeys as array and composes publishExceptionsTo', () => {
    const p = new Mt101ReconcileTaskProvider();
    const draft: Mt101ReconcileTaskDraft = {
      ...p.createDraft(),
      taskRef: 'rec',
      matchKeys: 'senders_reference, uetr',
      exceptionConnectionRef: '12',
      exceptionTable: 'mt101_exceptions',
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.matchKeys).toEqual(['senders_reference', 'uetr']);
    expect(config.publishExceptionsTo).toBe('table:12:mt101_exceptions');
  });

  it('hydrateDraft accepts matchKeys as array or string', () => {
    const p = new Mt101ReconcileTaskProvider();
    const fromArray = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'x', executionMode: 'once',
        matchKeys: ['senders_reference', 'uetr'],
      }),
    });
    expect(fromArray.matchKeys).toBe('senders_reference,uetr');

    const fromString = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'x', executionMode: 'once',
        matchKeys: 'senders_reference,uetr',
      }),
    });
    expect(fromString.matchKeys).toBe('senders_reference,uetr');
  });

  it('roundtrip preserves all configured fields', () => {
    const p = new Mt101ReconcileTaskProvider();
    const initial: Mt101ReconcileTaskDraft = {
      ...p.createDraft(),
      taskRef: 'r1',
      connectionRef: '99',
      sentTable: 'archive_custom',
      confirmationTable: 'confirm_custom',
      matchKeys: 'a,b',
      asOfDate: '2026-06-09',
      lookbackDays: 30,
      exceptionConnectionRef: '99',
      exceptionTable: 'exc_custom',
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });
});
