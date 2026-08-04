import { Injectable, inject } from '@angular/core';
import { DateTimeService } from '@integration-hub/core/services';
import { I18nService, resolveVocabulary } from '@integration-hub/core/i18n';

import { AuditRecord } from '../models/audit.models';

@Injectable({ providedIn: 'root' })
export class AuditPresentationService {
  private readonly i18n = inject(I18nService);
  private readonly dateTime = inject(DateTimeService);

  /**
   * Un estado de ejecucion se lee IGUAL aqui que en #/executions y #/overview.
   *
   * Antes esto consultaba primero `audit.status.*` y solo despues `executionStatus.*`: dos espacios
   * de claves para el mismo hecho, con textos distintos ("Completado" contra "Completada"), y si
   * ninguno acertaba devolvia el enum crudo. Un operador no puede correlacionar una ejecucion entre
   * dos pantallas si cada una la nombra a su manera; el espacio de auditoria sobraba.
   */
  statusLabel(status: string | null): string {
    return resolveVocabulary(this.i18n, 'executionStatus', status);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value, 'dd LLL yyyy, HH:mm:ss') : '-';
  }

  eventLabel(eventType: string | null): string {
    return resolveVocabulary(this.i18n, 'auditEvent', eventType);
  }

  taskTypeDescription(taskType: string | null): string {
    return resolveVocabulary(this.i18n, 'taskType', taskType);
  }

  taskLabel(event: Pick<AuditRecord, 'taskType' | 'taskDefinitionId'>): string {
    const label = this.taskTypeDescription(event.taskType);
    if (event.taskType && event.taskDefinitionId != null) {
      return `${label} · ${this.i18n.t('audit.taskDefinitionId')} ${event.taskDefinitionId}`;
    }
    if (event.taskType) {
      return label;
    }
    if (event.taskDefinitionId != null) {
      return `${this.i18n.t('audit.taskDefinitionId')} ${event.taskDefinitionId}`;
    }
    return '-';
  }

  compactTaskLabel(event: Pick<AuditRecord, 'taskType' | 'taskDefinitionId'>): string {
    const label = this.taskTypeDescription(event.taskType);
    if (event.taskType && event.taskDefinitionId != null) {
      return `${label} · TD ${event.taskDefinitionId}`;
    }
    if (event.taskType) {
      return label;
    }
    if (event.taskDefinitionId != null) {
      return `TD ${event.taskDefinitionId}`;
    }
    return '-';
  }
}
