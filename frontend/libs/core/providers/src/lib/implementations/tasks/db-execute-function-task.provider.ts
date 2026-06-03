// @trace RF-002 (procesos: contrato configuration_json de tarea tipo DB_EXECUTE_FN)
import { Injectable } from '@angular/core';
import { ProcessTaskParameterBindingDraft } from '../../tasks/process-task-binding.models';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface DbExecuteFunctionTaskDraft {
  connectionRef: string;
  functionSchema: string;
  functionName: string;
  resultAlias: string;
  timeoutSeconds: string;
  parameters: ProcessTaskParameterBindingDraft[];
}

@Injectable()
export class DbExecuteFunctionTaskProvider extends ProcessTaskProvider<DbExecuteFunctionTaskDraft> {
  readonly descriptor = {
    type: 'DB_EXECUTE_FN' as const,
    labelKey: 'processTask.DB_EXECUTE_FN',
    descriptionKey: 'processTaskDescription.DB_EXECUTE_FN',
    modalLayout: 'workspace' as const,
  };

  createDraft(): DbExecuteFunctionTaskDraft {
    return {
      connectionRef: '',
      functionSchema: '',
      functionName: '',
      resultAlias: '',
      timeoutSeconds: '30',
      parameters: [],
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): DbExecuteFunctionTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      connectionRef: String(config.connectionRef || ''),
      functionSchema: String(config.functionSchema || ''),
      functionName: String(config.functionName || ''),
      resultAlias: String(config.resultAlias || ''),
      timeoutSeconds: String(config.timeoutSeconds ?? 30),
      parameters: Array.isArray(config.parameters)
        ? config.parameters.map((parameter: any) => ({
            name: String(parameter?.name || ''),
            jdbcType: String(parameter?.jdbcType || 'VARCHAR').trim().toUpperCase(),
            direction: 'IN',
            sourceKind: String(parameter?.sourceKind || '') as any || (parameter?.expression ? 'expression' : 'field'),
            sourceKey: String(parameter?.sourceKey || parameter?.value || ''),
            sourceLabel: String(parameter?.sourceLabel || parameter?.value || ''),
            expression: String(parameter?.expression || ''),
          }))
        : [],
    };
  }

  toTaskPatch(draft: DbExecuteFunctionTaskDraft): Partial<ProcessTaskFormModel> {
    const parameters = (draft.parameters || [])
      .filter((parameter) => Boolean(parameter.name?.trim()))
      .map((parameter) => {
        const next: any = {
          name: parameter.name.trim(),
          jdbcType: (parameter.jdbcType || 'VARCHAR').trim().toUpperCase(),
          direction: 'IN',
        };
        if ((parameter.expression || '').trim()) {
          next.expression = parameter.expression.trim();
          next.sourceKind = 'expression';
        } else if ((parameter.sourceKey || '').trim()) {
          next.value = parameter.sourceKey.trim();
          next.sourceKind = parameter.sourceKind || 'field';
          next.sourceKey = parameter.sourceKey.trim();
          next.sourceLabel = (parameter.sourceLabel || parameter.sourceKey).trim();
        }
        return next;
      })
      .filter((parameter) => Boolean(parameter.name));

    const payload: any = {
      functionName: draft.functionName || '',
      timeoutSeconds: Number(draft.timeoutSeconds || 30),
    };
    if (draft.connectionRef) payload.connectionRef = draft.connectionRef;
    if (draft.functionSchema) payload.functionSchema = draft.functionSchema;
    if (draft.resultAlias) payload.resultAlias = draft.resultAlias;
    if (parameters.length) payload.parameters = parameters;
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const parts = [i18n.t(this.descriptor.labelKey)];
    if (config.connectionRef) parts.push(i18n.t('ui.taskSummary.connection', { value: config.connectionRef }));
    if (config.functionName) parts.push(i18n.t('ui.taskSummary.function', { value: config.functionName }));
    return parts.join(' | ');
  }
}
