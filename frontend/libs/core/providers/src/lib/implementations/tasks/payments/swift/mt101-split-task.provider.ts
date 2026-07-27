// @trace spec 008-mensajeria-pagos RF-009, T-023
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

export interface Mt101SplitTaskDraft extends ProcessTaskRuntimeDraft {
  maxTransactionsPerFragment: number;
  maxBytesPerFragment: number;
  rebuildIndexTotal: boolean;
  fragmentReferenceTemplate: string;
}

@Injectable()
export class Mt101SplitTaskProvider extends ProcessTaskProvider<Mt101SplitTaskDraft> {
  readonly descriptor = {
    type: 'MT101_SPLIT' as const,
    labelKey: 'processTask.MT101_SPLIT',
    descriptionKey: 'processTaskDescription.MT101_SPLIT',
    category: 'swift-mt101',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101SplitTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      maxTransactionsPerFragment: 100,
      maxBytesPerFragment: 10000,
      rebuildIndexTotal: true,
      fragmentReferenceTemplate: '${sendersReference}-${fragmentIndex}',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101SplitTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    return {
      ...runtime,
      maxTransactionsPerFragment: Number(config['maxTransactionsPerFragment']) || 100,
      maxBytesPerFragment: Number(config['maxBytesPerFragment']) || 10000,
      rebuildIndexTotal: config['rebuildIndexTotal'] !== false,
      fragmentReferenceTemplate: String(
        config['fragmentReferenceTemplate'] || '${sendersReference}-${fragmentIndex}',
      ),
    };
  }

  toTaskPatch(draft: Mt101SplitTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        maxTransactionsPerFragment: draft.maxTransactionsPerFragment,
        maxBytesPerFragment: draft.maxBytesPerFragment,
        rebuildIndexTotal: draft.rebuildIndexTotal,
        fragmentReferenceTemplate: draft.fragmentReferenceTemplate,
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
      `max=${config.maxTransactionsPerFragment}tx/${config.maxBytesPerFragment}B`,
    ].join(' | ');
  }
}
