import { describe, expect, it } from 'vitest';
import { Mt101ValidateTaskDraft, Mt101ValidateTaskProvider } from './mt101-validate-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'client-1',
  id: null,
  taskOrder: 2,
  taskType: 'MT101_VALIDATE',
  active: true,
  sourceDefinitionId: null,
  readerDefinitionId: null,
  configurationJson: '{}',
};

describe('Mt101ValidateTaskProvider', () => {
  it('declares MT101_VALIDATE with workspace layout', () => {
    const provider = new Mt101ValidateTaskProvider();
    expect(provider.descriptor.type).toBe('MT101_VALIDATE');
    expect(provider.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns sensible defaults', () => {
    const draft = new Mt101ValidateTaskProvider().createDraft();
    expect(draft.executionMode).toBe('once');
    expect(draft.ruleSet).toBe('structural-mvp');
    expect(draft.standard).toBe('SWIFT');
    expect(draft.appliesTo).toBe('MT101');
    expect(draft.failOn).toBe('ERROR');
    expect(draft.publishIssuesTable).toBe('mt101_validation_issue');
  });

  it('serializes draft to configuration_json with publishIssuesTo composed', () => {
    const provider = new Mt101ValidateTaskProvider();
    const draft: Mt101ValidateTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'validate-mt101',
      ruleSet: 'swift-fin-uat-2024-q4',
      standard: 'SWIFT',
      appliesTo: 'MT101',
      businessCalendar: 'EU',
      failOn: 'WARNING',
      publishIssuesConnectionRef: '12',
      publishIssuesTable: 'mt101_validation_issue',
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.taskRef).toBe('validate-mt101');
    expect(config.executionMode).toBe('once');
    expect(config.ruleSet).toBe('swift-fin-uat-2024-q4');
    expect(config.standard).toBe('SWIFT');
    expect(config.failOn).toBe('WARNING');
    expect(config.publishIssuesTo).toBe('table:12:mt101_validation_issue');
    expect(config.rules).toEqual(['__catalog__']);
  });

  it('omits publishIssuesTo when connectionRef is empty', () => {
    const provider = new Mt101ValidateTaskProvider();
    const draft = { ...provider.createDraft(), taskRef: 'x', publishIssuesConnectionRef: '' };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.publishIssuesTo).toBeUndefined();
  });

  it('roundtrip preserves all fields', () => {
    const provider = new Mt101ValidateTaskProvider();
    const initial: Mt101ValidateTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'v1',
      ruleSet: 'ruleset-x',
      standard: 'ISO20022',
      appliesTo: 'PAIN001',
      businessCalendar: 'US',
      failOn: 'INFO',
      publishIssuesConnectionRef: '42',
      publishIssuesTable: 'custom_issues',
    };
    const patch = provider.toTaskPatch(initial);
    const rehydrated = provider.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });

  it('normalizes invalid enum values to safe defaults', () => {
    const provider = new Mt101ValidateTaskProvider();
    const draft = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'x',
        executionMode: 'once',
        standard: 'WHATEVER',
        failOn: 'BOGUS',
      }),
    });
    expect(draft.standard).toBe('SWIFT');
    expect(draft.failOn).toBe('ERROR');
  });
});
