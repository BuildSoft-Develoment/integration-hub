import { describe, expect, it } from 'vitest';
import { Mt101ValidateTaskDraft, Mt101ValidateTaskProvider } from './mt101-validate-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

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
    // Vacia = sin sink. La tabla es el interruptor del sink de incidencias (ver 'omite publishIssuesTo...').
    expect(draft.publishIssuesTable).toBe('');
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

  it('omite publishIssuesTo cuando no hay tabla (la tabla es el interruptor, no la conexion)', () => {
    const provider = new Mt101ValidateTaskProvider();
    const draft = { ...provider.createDraft(), taskRef: 'x', publishIssuesTable: '' };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.publishIssuesTo).toBeUndefined();
  });

  it('emite el sink SIN conexion cuando solo hay tabla (IssueSink.from la deja en null)', () => {
    // Antes se exigia connectionRef para emitir, asi que la forma "table:<tabla>" —la que usan los propios
    // ITs— no se podia representar: al guardar se perdia y el sink quedaba disabled().
    const provider = new Mt101ValidateTaskProvider();
    const draft = { ...provider.createDraft(), taskRef: 'x', publishIssuesTable: 'mt101_validation_issue' };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.publishIssuesTo).toBe('table:mt101_validation_issue');
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
