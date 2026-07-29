// @trace RF-002 (procesos: contrato configuration_json de tarea tipo NOTIFICATION)
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { HttpRequestDraft, ProcessTaskRuntimeDraft } from '../../../tasks/process-task-binding.models';
import { HTTP_REQUEST_KEYS, applyHttpRequestToPayload, createHttpRequestDraft, hydrateHttpRequest } from '../../../tasks/http-request-task.support';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

export interface NotificationTaskDraft extends ProcessTaskRuntimeDraft, HttpRequestDraft {
  channel: string;
  message: string;
  to: string;
  subject: string;
  body: string;
  /** Config de los canales INACTIVOS + claves HTTP sin campo propio; viaja verbatim (ver NOTIFICATION_CHANNEL_KEYS). */
  preserved: Record<string, unknown>;
}

/**
 * Claves de configuracion propias de los canales. {@code toTaskPatch} emite solo la rama del canal ACTIVO, asi
 * que sin transportarlas, cambiar de canal y guardar borraba la config de los otros: pasar un webhook a
 * {@code log} para probar destruia la {@code url} de destino y las credenciales, y sin {@code authType} el
 * request sale SIN header Authorization — eso es desactivar una proteccion, no perder un tuning.
 *
 * <p>Incluye {@code loginTimeoutSeconds} y {@code tokenTtlSeconds}, que el backend lee
 * ({@code HttpRequestSupport}) pero no tienen campo en {@code HttpRequestDraft}, asi que se perdian SIEMPRE,
 * incluso guardando en webhook.</p>
 */
const NOTIFICATION_CHANNEL_KEYS = [
  'message', 'bodyTemplate', 'to', 'subject', 'body',
  'url', 'method', 'timeoutSeconds', 'headers',
  'authType', 'username', 'password', 'token',
  'loginUrl', 'loginMethod', 'loginBodyTemplate', 'tokenPath', 'loginHeaders',
  'loginTimeoutSeconds', 'tokenTtlSeconds',
] as const;

@Injectable()
export class NotificationTaskProvider extends ProcessTaskProvider<NotificationTaskDraft> {
  readonly descriptor = {
    type: 'NOTIFICATION' as const,
    labelKey: 'processTask.NOTIFICATION',
    descriptionKey: 'processTaskDescription.NOTIFICATION',
    modalLayout: 'rest' as const,
  };

  /**
   * Claves que este formulario gobierna en ALGUNA de sus ramas: las del canal activo mas las de los
   * otros dos, porque cambiar de canal y volver tiene que devolverte lo que tenias.
   *
   * <p>Su bolsa `preserved` propia NO se elimina, a diferencia de otros providers: expresa algo que
   * una lista plana no puede — que `to`/`subject`/`body` se gobiernan solo en la rama email y deben
   * SOBREVIVIR mientras estas en webhook. Las dos se componen: la de la clase base cubre las claves
   * que nadie conoce, esta cubre las de los canales inactivos.</p>
   */
  override get governedKeys(): readonly string[] {
    return ['channel', 'message', 'to', 'subject', 'body', ...HTTP_REQUEST_KEYS];
  }

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
      preserved: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): NotificationTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      ...this.hydrateRuntime(task, 'once'),
      ...hydrateHttpRequest(config, 15),
      preserved: NOTIFICATION_CHANNEL_KEYS.reduce<Record<string, unknown>>((acc, key) => {
        if (config[key] !== undefined) {
          acc[key] = config[key];
        }
        return acc;
      }, {}),
      channel: String(config.channel || 'log'),
      message: String(config.message || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros'),
      bodyTemplate: String(config.bodyTemplate || '{"message":"${message}"}'),
      to: String(config.to || ''),
      subject: String(config.subject || 'Proceso ${processExecutionId}'),
      body: String(config.body || 'Proceso ${processExecutionId} finalizado con ${recordCount} registros'),
    };
  }

  toTaskPatch(draft: NotificationTaskDraft): Partial<ProcessTaskFormModel> {
    // `preserved` va PRIMERO en cada rama: la config del canal activo pisa lo que venia, y la de los canales
    // inactivos sobrevive en vez de borrarse (cambiar de canal para probar no debe destruir la url ni las
    // credenciales del webhook).
    if (draft.channel === 'webhook') {
      // En webhook el form gobierna el HTTP: se preserva solo el contenido de los otros canales.
      const soloOtrosCanales = Object.fromEntries(
        Object.entries(draft.preserved).filter(([key]) => !HTTP_REQUEST_KEYS.includes(key)),
      );
      const payload: any = this.withRuntime(
        { ...soloOtrosCanales, channel: 'webhook', message: draft.message || '' }, draft, 'once');
      applyHttpRequestToPayload(draft, payload, 15);
      return { configurationJson: this.toPrettyJson(payload) };
    }
    if (draft.channel === 'email') {
      return {
        configurationJson: this.toPrettyJson(this.withRuntime({
            ...draft.preserved,
            channel: 'email',
            to: draft.to || '',
            subject: draft.subject || '',
            body: draft.body || '',
          }, draft, 'once')),
      };
    }
    return {
      configurationJson: this.toPrettyJson(this.withRuntime({
        ...draft.preserved,
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
