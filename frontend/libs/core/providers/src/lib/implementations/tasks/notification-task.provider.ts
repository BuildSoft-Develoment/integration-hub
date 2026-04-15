import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface NotificationTaskDraft {
  channel: string;
  message: string;
  url: string;
  bodyTemplate: string;
  timeoutSeconds: string;
  headersJson: string;
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
  };

  createDraft(): NotificationTaskDraft {
    return {
      channel: 'log',
      message: 'Proceso ${processExecutionId} finalizado con ${recordCount} registros',
      url: '',
      bodyTemplate: '{"message":"${message}"}',
      timeoutSeconds: '15',
      headersJson: '{}',
      to: '',
      subject: 'Proceso ${processExecutionId}',
      body: 'Proceso ${processExecutionId} finalizado con ${recordCount} registros',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): NotificationTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      channel: String(config.channel || 'log'),
      message: String(config.message || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros'),
      url: String(config.url || ''),
      bodyTemplate: String(config.bodyTemplate || '{"message":"${message}"}'),
      timeoutSeconds: String(config.timeoutSeconds ?? 15),
      headersJson: JSON.stringify(config.headers || {}, null, 2),
      to: String(config.to || ''),
      subject: String(config.subject || 'Proceso ${processExecutionId}'),
      body: String(config.body || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros'),
    };
  }

  toTaskPatch(draft: NotificationTaskDraft): Partial<ProcessTaskFormModel> {
    if (draft.channel === 'webhook') {
      const payload: any = {
        channel: 'webhook',
        url: draft.url || '',
        message: draft.message || '',
        bodyTemplate: draft.bodyTemplate || '{"message":"${message}"}',
        timeoutSeconds: Number(draft.timeoutSeconds || 15),
      };
      const headers = this.parseJson(draft.headersJson);
      if (Object.keys(headers).length) payload.headers = headers;
      return { configurationJson: this.toPrettyJson(payload) };
    }
    if (draft.channel === 'email') {
      return {
        configurationJson: this.toPrettyJson({
          channel: 'email',
          to: draft.to || '',
          subject: draft.subject || '',
          body: draft.body || '',
        }),
      };
    }
    return {
      configurationJson: this.toPrettyJson({
        channel: 'log',
        message: draft.message || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros',
      }),
    };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [i18n.t(this.descriptor.labelKey), i18n.t('ui.taskSummary.notification', { value: config.channel })].join(' | ');
  }
}
