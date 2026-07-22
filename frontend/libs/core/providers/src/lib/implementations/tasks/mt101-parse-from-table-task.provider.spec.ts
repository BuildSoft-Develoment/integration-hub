import { describe, expect, it } from 'vitest';
import { Mt101ParseFromTableTaskDraft, Mt101ParseFromTableTaskProvider } from './mt101-parse-from-table-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c-1', id: null, taskOrder: 1, taskType: 'MT101_PARSE_FROM_TABLE', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101ParseFromTableTaskProvider', () => {
  it('declara MT101_PARSE_FROM_TABLE con layout workspace', () => {
    const p = new Mt101ParseFromTableTaskProvider();
    expect(p.descriptor.type).toBe('MT101_PARSE_FROM_TABLE');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft: defaults (pageSize 500, replaceExisting true, columnas payload_json/id)', () => {
    const d = new Mt101ParseFromTableTaskProvider().createDraft();
    expect(d.pageSize).toBe(500);
    expect(d.replaceExisting).toBe(true);
    expect(d.source.payloadColumn).toBe('payload_json');
    expect(d.source.idColumn).toBe('id');
    expect(d.source.table).toBe('');
  });

  it('serializa pageSize/replaceExisting/inboundSetIdTemplate/source', () => {
    const p = new Mt101ParseFromTableTaskProvider();
    const draft: Mt101ParseFromTableTaskDraft = {
      ...p.createDraft(), taskRef: 'pft', pageSize: 250, replaceExisting: false,
      inboundSetIdTemplate: 'INB-${_processExecutionId}',
      source: { table: 'ops.staging', connectionRef: 'core', payloadColumn: 'raw', idColumn: 'row_id' },
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.pageSize).toBe(250);
    expect(config.replaceExisting).toBe(false);
    expect(config.inboundSetIdTemplate).toBe('INB-${_processExecutionId}');
    expect(config.source).toEqual({ table: 'ops.staging', connectionRef: 'core', payloadColumn: 'raw', idColumn: 'row_id' });
  });

  it('roundtrip preserva todo', () => {
    const p = new Mt101ParseFromTableTaskProvider();
    const initial: Mt101ParseFromTableTaskDraft = {
      ...p.createDraft(), taskRef: 'pft', pageSize: 1000, replaceExisting: true,
      inboundSetIdTemplate: 'INB-x',
      source: { table: 'staging_record', connectionRef: '', payloadColumn: 'payload_json', idColumn: 'id' },
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.pageSize).toBe(1000);
    expect(rehydrated.replaceExisting).toBe(true);
    expect(rehydrated.inboundSetIdTemplate).toBe('INB-x');
    expect(rehydrated.source).toEqual(initial.source);
  });

  it('hydrateDraft usa defaults seguros para input malformado', () => {
    const d = new Mt101ParseFromTableTaskProvider().hydrateDraft({ ...baseTask, configurationJson: 'not-json' });
    expect(d.pageSize).toBe(500);
    expect(d.replaceExisting).toBe(true);
    expect(d.source.payloadColumn).toBe('payload_json');
  });
});
