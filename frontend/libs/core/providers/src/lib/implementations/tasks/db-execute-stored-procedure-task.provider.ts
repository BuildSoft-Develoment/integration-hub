// @trace RF-002 (procesos: contrato configuration_json de tarea tipo DB_EXECUTE_SP)
import { Injectable } from '@angular/core';
import { ProcessTaskParameterBindingDraft, ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface DbExecuteStoredProcedureTaskDraft extends ProcessTaskRuntimeDraft {
  connectionRef: string;
  procedureSchema: string;
  procedureName: string;
  timeoutSeconds: string;
  parameters: ProcessTaskParameterBindingDraft[];
}

@Injectable()
export class DbExecuteStoredProcedureTaskProvider extends ProcessTaskProvider<DbExecuteStoredProcedureTaskDraft> {
  readonly descriptor = {
    type: 'DB_EXECUTE_SP' as const,
    labelKey: 'processTask.DB_EXECUTE_SP',
    descriptionKey: 'processTaskDescription.DB_EXECUTE_SP',
    modalLayout: 'workspace' as const,
  };

  createDraft(): DbExecuteStoredProcedureTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      connectionRef: '',
      procedureSchema: '',
      procedureName: '',
      timeoutSeconds: '30',
      parameters: [],
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): DbExecuteStoredProcedureTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      ...this.hydrateRuntime(task, 'once'),
      connectionRef: String(config.connectionRef || ''),
      procedureSchema: String(config.procedureSchema || ''),
      procedureName: String(config.procedureName || ''),
      timeoutSeconds: String(config.timeoutSeconds ?? 30),
      parameters: Array.isArray(config.parameters)
        ? config.parameters.map((parameter: any) => ({
            name: String(parameter?.name || ''),
            jdbcType: String(parameter?.jdbcType || 'VARCHAR').trim().toUpperCase(),
            direction: String(parameter?.direction || 'IN').trim().toUpperCase(),
            sourceKind: String(parameter?.sourceKind || '') as any || (parameter?.expression ? 'expression' : 'field'),
            sourceKey: String(parameter?.sourceKey || parameter?.value || ''),
            sourceLabel: String(parameter?.sourceLabel || parameter?.value || ''),
            expression: String(parameter?.expression || ''),
          }))
        : [],
    };
  }

  toTaskPatch(draft: DbExecuteStoredProcedureTaskDraft): Partial<ProcessTaskFormModel> {
    const parameters = (draft.parameters || [])
      .filter((entry) => Boolean(entry.name?.trim()))
      .map((entry) => {
        const direction = (entry.direction || 'IN').trim().toUpperCase();
        const next: any = {
          name: entry.name.trim(),
          jdbcType: (entry.jdbcType || 'VARCHAR').trim().toUpperCase(),
          direction,
        };
        if ((entry.expression || '').trim()) {
          next.expression = entry.expression.trim();
          next.sourceKind = 'expression';
        } else if ((entry.sourceKey || '').trim()) {
          const sourceKind = entry.sourceKind || 'field';
          const sourceKey = entry.sourceKey.trim();
          next.sourceKind = sourceKind;
          next.sourceKey = sourceKey;
          next.sourceLabel = (entry.sourceLabel || entry.sourceKey).trim();
          const sourceTaskRef = (draft.input?.sourceTaskRef || '').trim();
          // Solo los outputs AGREGADOS (summary/out) existen como clave calificada
          // `task.<output>.<campo>` y deben resolverse asi para evitar colision con claves
          // globales (fan-in). Los flujos por registro (records/table/errors) resuelven por
          // clave plana desde el registro actual -> se mandan como `value`.
          if (sourceTaskRef && (sourceKind === 'summary' || sourceKind === 'out')) {
            next.sourceTaskRef = sourceTaskRef;
            next.sourceOutput = sourceKind;
          } else {
            next.value = sourceKey;
          }
        }
        return next;
      });

    const payload: any = this.withRuntime({
      procedureName: draft.procedureName || '',
      timeoutSeconds: Number(draft.timeoutSeconds || 30),
    }, draft, 'once');
    if (draft.connectionRef) payload.connectionRef = draft.connectionRef;
    if (draft.procedureSchema) payload.procedureSchema = draft.procedureSchema;
    if (parameters.length) payload.parameters = parameters;
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const parts = [i18n.t(this.descriptor.labelKey)];
    if (config.connectionRef) parts.push(i18n.t('ui.taskSummary.connection', { value: config.connectionRef }));
    if (config.procedureName) parts.push(i18n.t('ui.taskSummary.procedure', { value: config.procedureName }));
    return parts.join(' | ');
  }
}
