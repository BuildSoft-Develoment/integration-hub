// @trace spec 004-observabilidad-y-auditoria RF-005 (observabilidad: correlacion de evidencia tecnica/funcional por processExecutionId)
import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { resolveVocabulary } from '@integration-hub/core/i18n';
import { DateTimeService, I18nService } from '@integration-hub/core/services';

import { formatExecutionDate, formatTriggerSourceLabel } from '../../../details/execution-detail.utils';
import {
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
  TaskFailureSummary,
  TaskReadSummary,
} from '../../../models/execution.models';

@Component({
  selector: 'ih-execution-editor-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: './execution-editor-summary.component.css',
    templateUrl: './execution-editor-summary.component.html'
})
export class ExecutionEditorSummaryComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly selectedTask = input<ProcessTaskExecutionRecord | null>(null);
  readonly selectedTaskSummary = input<TaskReadSummary | null>(null);
  readonly failedExecutionSummary = input<TaskFailureSummary | null>(null);

  statusLabel(status: string): string {
    return resolveVocabulary(this.i18n, 'executionStatus', status);
  }

  /**
   * Titulo de la seccion "resumen de la tarea seleccionada". Sin tarea seleccionada no hay tipo que
   * nombrar y se usa el rotulo generico de la seccion: eso NO es degradar al enum, es otro dato.
   */
  selectedTaskTitle(): string {
    const task = this.selectedTask();
    return task
      ? resolveVocabulary(this.i18n, 'taskType', task.taskType)
      : this.i18n.t('executions.tasksTitle');
  }

  formatDate(value: string | null): string {
    return formatExecutionDate(this.dateTime, value);
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }
}
