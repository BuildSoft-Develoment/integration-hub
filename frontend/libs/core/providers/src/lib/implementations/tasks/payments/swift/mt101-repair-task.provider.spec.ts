import { describe, expect, it } from 'vitest';
import { Mt101RepairTaskDraft, Mt101RepairTaskProvider } from './mt101-repair-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'MT101_REPAIR', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101RepairTaskProvider', () => {
  it('declares MT101_REPAIR with workspace layout', () => {
    const p = new Mt101RepairTaskProvider();
    expect(p.descriptor.type).toBe('MT101_REPAIR');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns one starter repair', () => {
    const draft = new Mt101RepairTaskProvider().createDraft();
    expect(draft.repairs).toHaveLength(1);
    expect(draft.repairs[0].action).toBe('stripNonSwiftXChars');
    expect(draft.repairAttempt).toBe(1);
  });

  it('serializes targetFields as array (split by newline)', () => {
    const p = new Mt101RepairTaskProvider();
    const draft: Mt101RepairTaskDraft = {
      ...p.createDraft(),
      taskRef: 'r',
      repairs: [{
        action: 'stripNonSwiftXChars',
        targetFields: 'transactions.remittanceInformation\ntransactions.beneficiary.nameAndAddress',
        maxLength: 35,
      }],
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.repairs[0].targetFields).toEqual([
      'transactions.remittanceInformation',
      'transactions.beneficiary.nameAndAddress',
    ]);
    // stripNonSwiftXChars no necesita maxLength.
    expect(config.repairs[0].maxLength).toBeUndefined();
  });

  it('includes maxLength only for truncateField action', () => {
    const p = new Mt101RepairTaskProvider();
    const draft: Mt101RepairTaskDraft = {
      ...p.createDraft(),
      taskRef: 'r',
      repairs: [{
        action: 'truncateField',
        targetFields: 'transactions.remittanceInformation',
        maxLength: 20,
      }],
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.repairs[0].maxLength).toBe(20);
  });

  it('omits newReferenceTemplate when blank', () => {
    const p = new Mt101RepairTaskProvider();
    const draft = { ...p.createDraft(), taskRef: 'r' };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.newReferenceTemplate).toBeUndefined();
  });

  it('includes newReferenceTemplate when provided', () => {
    const p = new Mt101RepairTaskProvider();
    const draft: Mt101RepairTaskDraft = {
      ...p.createDraft(),
      taskRef: 'r',
      newReferenceTemplate: '${sendersReference}-R${repairAttempt}',
      repairAttempt: 3,
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.newReferenceTemplate).toBe('${sendersReference}-R${repairAttempt}');
    expect(config.repairAttempt).toBe(3);
  });

  it('roundtrip preserves multiple repairs', () => {
    const p = new Mt101RepairTaskProvider();
    const initial: Mt101RepairTaskDraft = {
      ...p.createDraft(),
      taskRef: 'r1',
      repairs: [
        { action: 'stripNonSwiftXChars', targetFields: 'transactions.remittanceInformation', maxLength: 35 },
        { action: 'truncateField', targetFields: 'transactions.remittanceInformation', maxLength: 20 },
        { action: 'uppercaseField', targetFields: 'transactions.beneficiary.bic', maxLength: 35 },
      ],
      newReferenceTemplate: 'X-${repairAttempt}',
      repairAttempt: 2,
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.repairs).toHaveLength(3);
    expect(rehydrated.repairs[0].action).toBe('stripNonSwiftXChars');
    expect(rehydrated.repairs[2].action).toBe('uppercaseField');
    expect(rehydrated.newReferenceTemplate).toBe('X-${repairAttempt}');
    expect(rehydrated.repairAttempt).toBe(2);
  });

  it('normalizes invalid action to default', () => {
    const p = new Mt101RepairTaskProvider();
    const draft = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'x', executionMode: 'once',
        repairs: [{ action: 'magic', targetFields: ['x'] }],
      }),
    });
    expect(draft.repairs[0].action).toBe('stripNonSwiftXChars');
  });
});
