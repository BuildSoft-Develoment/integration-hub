// @trace spec 008-mensajeria-pagos RF-003, RF-014, RF-021, T-008
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type Mt101ArchiveHashAlgorithm = 'SHA-256' | 'SHA-512';

/** Draft del formulario MT101_ARCHIVE. */
export interface Mt101ArchiveTaskDraft extends ProcessTaskRuntimeDraft {
  connectionRef: string;
  table: string;
  hashAlgorithm: Mt101ArchiveHashAlgorithm;
  encryptionEnabled: boolean;
  encryptColumn: string;
  encryptionSecretRef: string;
  retentionDays: number;
}

/**
 * Provider del task type {@code MT101_ARCHIVE}.
 */
@Injectable()
export class Mt101ArchiveTaskProvider extends ProcessTaskProvider<Mt101ArchiveTaskDraft> {
  readonly descriptor = {
    type: 'MT101_ARCHIVE' as const,
    labelKey: 'processTask.MT101_ARCHIVE',
    descriptionKey: 'processTaskDescription.MT101_ARCHIVE',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101ArchiveTaskDraft {
    return {
      taskRef: '',
      executionMode: 'batch',
      connectionRef: '',
      table: 'mt101_archive',
      hashAlgorithm: 'SHA-256',
      encryptionEnabled: false,
      encryptColumn: 'raw_payload',
      encryptionSecretRef: '',
      retentionDays: 3650,
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ArchiveTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'batch');
    const hasEncryptColumn = !!String(config['encryptColumn'] || '').trim();
    const hasSecretRef = !!String(config['encryptionSecretRef'] || '').trim();
    return {
      ...runtime,
      executionMode: 'batch',
      connectionRef: String(config['connectionRef'] || ''),
      table: String(config['table'] || 'mt101_archive'),
      hashAlgorithm: this.normalizeHashAlgorithm(config['hashAlgorithm']),
      encryptionEnabled: hasEncryptColumn && hasSecretRef,
      encryptColumn: String(config['encryptColumn'] || 'raw_payload'),
      encryptionSecretRef: String(config['encryptionSecretRef'] || ''),
      retentionDays: Number(config['retentionDays']) || 3650,
    };
  }

  toTaskPatch(draft: Mt101ArchiveTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        connectionRef: draft.connectionRef,
        table: draft.table,
        hashAlgorithm: draft.hashAlgorithm,
        ...(draft.encryptionEnabled
          ? {
              encryptColumn: draft.encryptColumn,
              encryptionSecretRef: draft.encryptionSecretRef,
            }
          : {}),
        retentionDays: draft.retentionDays,
      },
      draft,
      'batch',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const enc = config.encryptionEnabled ? 'cifrado' : 'plano';
    return [
      i18n.t(this.descriptor.labelKey),
      `${config.table} retencion=${config.retentionDays}d ${enc}`,
    ].join(' | ');
  }

  private normalizeHashAlgorithm(value: unknown): Mt101ArchiveHashAlgorithm {
    const v = String(value || 'SHA-256').toUpperCase();
    return v === 'SHA-512' ? 'SHA-512' : 'SHA-256';
  }
}
