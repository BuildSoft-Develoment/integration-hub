// @trace spec 008-mensajeria-pagos RF-008, T-016
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskProviderDescriptor, ProcessTaskSummaryContext } from '@integration-hub/core/providers';
import { ProcessTaskRuntimeDraft } from '@integration-hub/core/providers';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

/** Draft del formulario MT101_PARSE. */
export interface Mt101ParseTaskDraft extends ProcessTaskRuntimeDraft {
  interpretSequenceAB: boolean;
  publishMultiOutput: boolean;
}

/**
 * Provider del task type {@code MT101_PARSE}.
 *
 * <p>Slice 2.3: single-output (records: List&lt;Mt101Message&gt;). Cuando M-3
 * (T-018 spec 003) entre, este draft habilitara {@code publishMultiOutput=true}
 * y el backend publicara envelope/header/transactions como outputs separados.</p>
 */
@Injectable()
export class Mt101ParseTaskProvider extends ProcessTaskProvider<Mt101ParseTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'MT101_PARSE' as const,
    summaryFields: ['parsedCount', 'messageCount', 'transactionCount'],
    labelKey: 'processTask.MT101_PARSE',
    descriptionKey: 'processTaskDescription.MT101_PARSE',
    category: 'swift-mt101',
    availableOutputs: ['metadata', 'summary', 'records', 'errors'] as const,
    defaultOutput: 'records' as const,
    recordFields: ['sendersReference', 'messageIndex', 'messageTotal', 'format'] as const,
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101ParseTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      interpretSequenceAB: true,
      publishMultiOutput: false,
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ParseTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    return {
      ...runtime,
      interpretSequenceAB: config['interpretSequenceAB'] !== false,
      publishMultiOutput: !!config['publishMultiOutput'],
    };
  }

  toTaskPatch(draft: Mt101ParseTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        interpretSequenceAB: draft.interpretSequenceAB,
        publishMultiOutput: draft.publishMultiOutput,
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const multi = config.publishMultiOutput ? 'multi-output' : 'single-output';
    return [i18n.t(this.descriptor.labelKey), multi].join(' | ');
  }
}
