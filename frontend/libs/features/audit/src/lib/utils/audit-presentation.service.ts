import { Injectable, inject } from '@angular/core';
import { DateTimeService, I18nService } from '@integration-hub/core/services';

import { auditEventLabel } from './audit-event-label';
import { AuditRecord } from '../models/audit.models';
import { taskTypeLabel } from './task-type-label';

@Injectable({ providedIn: 'root' })
export class AuditPresentationService {
  private readonly i18n = inject(I18nService);
  private readonly dateTime = inject(DateTimeService);

  statusLabel(status: string): string {
    const auditStatus = this.i18n.t(`audit.status.${status}`);
    if (auditStatus !== `audit.status.${status}`) {
      return auditStatus;
    }

    const executionStatus = this.i18n.t(`executionStatus.${status}`);
    return executionStatus !== `executionStatus.${status}` ? executionStatus : status;
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value, 'dd LLL yyyy, HH:mm:ss') : '-';
  }

  eventLabel(eventType: string | null): string {
    return auditEventLabel(this.i18n, eventType);
  }

  taskTypeDescription(taskType: string | null): string {
    return taskTypeLabel(this.i18n, taskType);
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
