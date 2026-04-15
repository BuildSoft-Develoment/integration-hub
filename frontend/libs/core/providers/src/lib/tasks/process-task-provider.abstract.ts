import { I18nService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from './process-task.models';

export interface ProcessTaskSummaryContext {
  sources: readonly SourceRef[];
  readers: readonly ReaderRef[];
  connections: readonly ConnectionRef[];
}

export interface ProcessTaskProviderDescriptor {
  type: ProcessTaskType;
  labelKey: string;
  descriptionKey: string;
}

export abstract class ProcessTaskProvider<TDraft> {
  abstract readonly descriptor: ProcessTaskProviderDescriptor;

  supports(type: ProcessTaskType): boolean {
    return this.descriptor.type === type;
  }

  abstract createDraft(): TDraft;

  abstract hydrateDraft(task: ProcessTaskFormModel): TDraft;

  abstract toTaskPatch(draft: TDraft): Partial<ProcessTaskFormModel>;

  summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    return i18n.t(this.descriptor.labelKey);
  }

  protected parseJson(configurationJson: string): Record<string, any> {
    try {
      const parsed = JSON.parse(configurationJson || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  protected toPrettyJson(payload: Record<string, unknown>): string {
    return JSON.stringify(payload, null, 2);
  }
}
