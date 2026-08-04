import { I18nService, resolveVocabulary } from '@integration-hub/core/i18n';
import { toCsv } from '@integration-hub/core/services';

import { AuditRecord } from '../models/audit.models';

/**
 * CSV de eventos de auditoria.
 *
 * Cabecera y valores salen del diccionario. Antes la cabecera era literal en ingles
 * (`id,eventType,status,...`) mientras el otro exportador del producto la escribia literal en
 * espanol, y las tres columnas de vocabulario (evento, estado, tipo de tarea) se volcaban con el
 * enum crudo: el operador exportaba lo que veia traducido en pantalla y abria un fichero que no se
 * parecia a la pantalla.
 */
export function eventsToCsv(i18n: I18nService, events: readonly AuditRecord[]): string {
  const header = [
    i18n.t('common.id'),
    i18n.t('audit.eventType'),
    i18n.t('common.status'),
    i18n.t('audit.message'),
    i18n.t('audit.executionId'),
    i18n.t('audit.taskType'),
    i18n.t('audit.createdAt'),
  ];
  const rows = events.map((event) => [
    event.id,
    resolveVocabulary(i18n, 'auditEvent', event.eventType),
    resolveVocabulary(i18n, 'executionStatus', event.status),
    event.message ?? '',
    event.processExecutionId ?? '',
    resolveVocabulary(i18n, 'taskType', event.taskType),
    event.createdAt ?? '',
  ]);
  return toCsv(header, rows);
}

/**
 * Volcado del registro tal cual lo emite el backend. Aqui NO se traduce nada: el consumidor del
 * JSON es una maquina (reproceso, soporte, diff contra la BD) y un enum convertido en etiqueta
 * deja de ser el dato. La version legible es el CSV, que es la que se abre en una hoja de calculo.
 */
export function eventsToJson(events: readonly AuditRecord[]): string {
  return JSON.stringify(events, null, 2);
}
