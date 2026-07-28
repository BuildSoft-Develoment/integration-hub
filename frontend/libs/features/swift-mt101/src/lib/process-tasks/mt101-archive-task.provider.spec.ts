import { describe, expect, it } from 'vitest';
import { Mt101ArchiveTaskDraft, Mt101ArchiveTaskProvider } from './mt101-archive-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

const baseTask: ProcessTaskFormModel = {
  clientId: 'client-1',
  id: null,
  taskOrder: 4,
  taskType: 'MT101_ARCHIVE',
  active: true,
  sourceDefinitionId: null,
  readerDefinitionId: null,
  configurationJson: '{}',
};

describe('Mt101ArchiveTaskProvider', () => {
  it('declares MT101_ARCHIVE with workspace layout', () => {
    const provider = new Mt101ArchiveTaskProvider();
    expect(provider.descriptor.type).toBe('MT101_ARCHIVE');
    expect(provider.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns sensible defaults (no encryption)', () => {
    const draft = new Mt101ArchiveTaskProvider().createDraft();
    expect(draft.executionMode).toBe('once');
    expect(draft.table).toBe('mt101_archive');
    expect(draft.hashAlgorithm).toBe('SHA-256');
    expect(draft.encryptionEnabled).toBe(false);
    expect(draft.retentionDays).toBe(3650);
  });

  it('serializes draft to configuration_json without encryption fields when disabled', () => {
    const provider = new Mt101ArchiveTaskProvider();
    const draft: Mt101ArchiveTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'archive-mt101',
      connectionRef: '12',
      table: 'mt101_archive',
      hashAlgorithm: 'SHA-256',
      retentionDays: 1825,
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.connectionRef).toBe('12');
    expect(config.table).toBe('mt101_archive');
    expect(config.hashAlgorithm).toBe('SHA-256');
    expect(config.retentionDays).toBe(1825);
    expect(config.encryptColumn).toBeUndefined();
    expect(config.encryptionSecretRef).toBeUndefined();
  });

  it('serializes encryption fields when enabled', () => {
    const provider = new Mt101ArchiveTaskProvider();
    const draft: Mt101ArchiveTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'archive-mt101',
      connectionRef: '12',
      encryptionEnabled: true,
      encryptColumn: 'raw_payload',
      encryptionSecretRef: '${secret:archive_key}',
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.encryptColumn).toBe('raw_payload');
    expect(config.encryptionSecretRef).toBe('${secret:archive_key}');
  });

  it('hydrateDraft infers encryptionEnabled from presence of column+secret', () => {
    const provider = new Mt101ArchiveTaskProvider();
    const draftEnabled = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'a',
        executionMode: 'once',
        connectionRef: '1',
        table: 't',
        encryptColumn: 'raw_payload',
        encryptionSecretRef: '${secret:k}',
      }),
    });
    expect(draftEnabled.encryptionEnabled).toBe(true);

    const draftDisabled = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'a',
        executionMode: 'once',
        connectionRef: '1',
        table: 't',
      }),
    });
    expect(draftDisabled.encryptionEnabled).toBe(false);
  });

  it('roundtrip preserves all fields including encryption on', () => {
    const provider = new Mt101ArchiveTaskProvider();
    const initial: Mt101ArchiveTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'a1',
      connectionRef: '99',
      table: 'custom_archive',
      hashAlgorithm: 'SHA-512',
      encryptionEnabled: true,
      encryptColumn: 'raw_payload',
      encryptionSecretRef: '${secret:custom}',
      retentionDays: 7305,
    };
    const patch = provider.toTaskPatch(initial);
    const rehydrated = provider.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });
});
