// @trace RF-002 (procesos: contrato configuration_json de tarea tipo NOTIFICATION)
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { HttpRequestDraft, ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { applyHttpRequestToPayload, createHttpRequestDraft, hydrateHttpRequest } from '../../tasks/http-request-task.support';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface NotificationTaskDraft extends ProcessTaskRuntimeDraft, HttpRequestDraft {
  channel: string;
  message: string;
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class NotificationTaskProvider extends ProcessTaskProvider<NotificationTaskDraft> {
  readonly descriptor = {
    type: 'NOTIFICATION' as const,
    labelKey: 'processTask.NOTIFICATION',
    descriptionKey: 'processTaskDescription.NOTIFICATION',
    modalLayout: 'rest' as const,
  };

  createDraft(): NotificationTaskDraft {
    return {
      ...createHttpRequestDraft('POST', '15'),
      taskRef: '',
      executionMode: 'once',
      channel: 'log',
      message: 'Proceso ${processExecutionId} finalizado con ${recordCount} registros',
      bodyTemplate: '{"message":"${message}"}',
      to: '',
      subject: 'Proceso ${processExecutionId}',
      body: 'Proceso ${processExecutionId} finalizado con ${recordCount} registros',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): NotificationTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      ...this.hydrateRuntime(task, 'once'),
      ...hydrateHttpRequest(config, 15),
      channel: String(config.channel || 'log'),
      message: String(config.message || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros'),
      bodyTemplate: String(config.bodyTemplate || '{"message":"${message}"}'),
      to: String(config.to || ''),
      subject: String(config.subject || 'Proceso ${processExecutionId}'),
      body: String(config.body || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros'),
    };
  }

  toTaskPatch(draft: NotificationTaskDraft): Partial<ProcessTaskFormModel> {
    if (draft.channel === 'webhook') {
      const payload: any = this.withRuntime({ channel: 'webhook', message: draft.message || '' }, draft, 'once');
      applyHttpRequestToPayload(draft, payload, 15);
      return { configurationJson: this.toPrettyJson(payload) };
    }
    if (draft.channel === 'email') {
      return {
        configurationJson: this.toPrettyJson(this.withRuntime({
            channel: 'email',
            to: draft.to || '',
            subject: draft.subject || '',
            body: draft.body || '',
          }, draft, 'once')),
      };
    }
    return {
      configurationJson: this.toPrettyJson(this.withRuntime({
        channel: 'log',
        message: draft.message || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros',
      }, draft, 'once')),
    };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [i18n.t(this.descriptor.labelKey), i18n.t('ui.taskSummary.notification', { value: config.channel })].join(' | ');
  }
}
