// @trace spec 008-mensajeria-pagos RF-006, T-014
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

/** Draft del formulario MT101_RECONCILE. */
export interface Mt101ReconcileTaskDraft extends ProcessTaskRuntimeDraft {
  connectionRef: string;
  sentTable: string;
  confirmationTable: string;
  matchKeys: string;
  asOfDate: string;
  lookbackDays: number;
  exceptionConnectionRef: string;
  exceptionTable: string;
}

/**
 * Provider del task type {@code MT101_RECONCILE}.
 */
@Injectable()
export class Mt101ReconcileTaskProvider extends ProcessTaskProvider<Mt101ReconcileTaskDraft> {
  readonly descriptor = {
    type: 'MT101_RECONCILE' as const,
    labelKey: 'processTask.MT101_RECONCILE',
    descriptionKey: 'processTaskDescription.MT101_RECONCILE',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101ReconcileTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      connectionRef: '',
      sentTable: 'mt101_archive',
      confirmationTable: 'mt101_confirmation',
      matchKeys: 'senders_reference',
      asOfDate: '${today}',
      lookbackDays: 5,
      exceptionConnectionRef: '',
      exceptionTable: 'mt101_reconciliation_exception',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ReconcileTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const matchKeys = Array.isArray(config['matchKeys'])
      ? config['matchKeys'].join(',')
      : String(config['matchKeys'] || 'senders_reference');
    const exceptionRef = this.parsePublishExceptionsTo(String(config['publishExceptionsTo'] || ''));
    return {
      ...runtime,
      connectionRef: String(config['connectionRef'] || ''),
      sentTable: String(config['sentTable'] || 'mt101_archive'),
      confirmationTable: String(config['confirmationTable'] || 'mt101_confirmation'),
      matchKeys,
      asOfDate: String(config['asOfDate'] || '${today}'),
      lookbackDays: Number(config['lookbackDays']) || 5,
      exceptionConnectionRef: exceptionRef.connRef,
      exceptionTable: exceptionRef.table || 'mt101_reconciliation_exception',
    };
  }

  toTaskPatch(draft: Mt101ReconcileTaskDraft): Partial<ProcessTaskFormModel> {
    const matchKeysArray = draft.matchKeys
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const publishExceptionsTo =
      draft.exceptionConnectionRef && draft.exceptionTable
        ? `table:${draft.exceptionConnectionRef}:${draft.exceptionTable}`
        : undefined;
    const payload: Record<string, unknown> = this.withRuntime(
      {
        connectionRef: draft.connectionRef || undefined,
        sentTable: draft.sentTable,
        confirmationTable: draft.confirmationTable,
        matchKeys: matchKeysArray,
        asOfDate: draft.asOfDate,
        lookbackDays: draft.lookbackDays,
        ...(publishExceptionsTo ? { publishExceptionsTo } : {}),
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [
      i18n.t(this.descriptor.labelKey),
      `${config.sentTable} vs ${config.confirmationTable} lookback=${config.lookbackDays}d`,
    ].join(' | ');
  }

  private parsePublishExceptionsTo(value: string): { connRef: string; table: string } {
    if (!value.startsWith('table:')) {
      return { connRef: '', table: '' };
    }
    const parts = value.substring('table:'.length).split(':');
    return { connRef: parts[0] || '', table: parts[1] || '' };
  }
}
