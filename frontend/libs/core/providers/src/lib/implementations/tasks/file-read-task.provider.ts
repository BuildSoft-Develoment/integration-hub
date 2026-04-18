import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface FileReadTaskDraft {
  sourceDefinitionId: number | null;
  readerDefinitionId: number | null;
  sourceVariablesText: string;
  batchSize: string;
  parallel: boolean;
  parallelMode: 'file' | 'batch';
  maxConcurrency: number | null;
}

@Injectable()
export class FileReadTaskProvider extends ProcessTaskProvider<FileReadTaskDraft> {
  readonly descriptor = {
    type: 'FILE_READ' as const,
    labelKey: 'processTask.FILE_READ',
    descriptionKey: 'processTaskDescription.FILE_READ',
  };

  createDraft(): FileReadTaskDraft {
    return {
      sourceDefinitionId: null,
      readerDefinitionId: null,
      sourceVariablesText: '',
      batchSize: '500',
      parallel: false,
      parallelMode: 'file',
      maxConcurrency: null,
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): FileReadTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      sourceDefinitionId: task.sourceDefinitionId ?? null,
      readerDefinitionId: task.readerDefinitionId ?? null,
      sourceVariablesText: Object.entries(config.sourceVariables || {})
        .map(([key, value]) => `${key}=${String(value)}`)
        .join('\n'),
      batchSize: String(config.batchSize ?? 500),
      parallel: !!config.parallel,
      parallelMode: config.parallelMode === 'batch' ? 'batch' : 'file',
      maxConcurrency: config.maxConcurrency ?? null,
    };
  }

  toTaskPatch(draft: FileReadTaskDraft): Partial<ProcessTaskFormModel> {
    const sourceVariables = (draft.sourceVariablesText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        const normalizedKey = key?.trim();
        const normalizedValue = valueParts.join('=').trim();
        if (normalizedKey && normalizedValue) {
          acc[normalizedKey] = normalizedValue;
        }
        return acc;
      }, {});
    
    const config: any = {
      sourceVariables,
      batchSize: Number(draft.batchSize || 500),
    };
    if (draft.parallel) {
      config.parallel = true;
      config.parallelMode = draft.parallelMode || 'file';
      if (draft.maxConcurrency != null) {
        config.maxConcurrency = draft.maxConcurrency;
      }
    }

    return {
      sourceDefinitionId: draft.sourceDefinitionId,
      readerDefinitionId: draft.readerDefinitionId,
      configurationJson: this.toPrettyJson(config),
    };
  }

  override summarize(task: ProcessTaskFormModel, context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const parts = [i18n.t(this.descriptor.labelKey)];
    const source = context.sources.find((item) => item.id === task.sourceDefinitionId);
    const reader = context.readers.find((item) => item.id === task.readerDefinitionId);
    if (source) parts.push(i18n.t('ui.taskSummary.source', { value: source.name }));
    if (reader) parts.push(i18n.t('ui.taskSummary.reader', { value: reader.name }));
    return parts.join(' | ');
  }
}
