// @trace RF-003 (observabilidad: navegar a ejecuciones relacionadas (hijas/reproceso))
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { ExecutionNavigationEntry, ProcessExecutionRecord } from '../../models/execution.models';
import { formatExecutionDate, formatTriggerSourceLabel } from '../../details/execution-detail.utils';

@Component({
  selector: 'ih-execution-lineage',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  styleUrl: './execution-lineage.component.css',
    templateUrl: './execution-lineage.component.html'
})
export class ExecutionLineageComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly children = input<readonly ProcessExecutionRecord[]>([]);
  readonly navigationStack = input<readonly ExecutionNavigationEntry[]>([]);
  readonly openExecution = output<number>();
  readonly goBack = output<void>();

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  formatDate(value: string | null): string {
    return formatExecutionDate(this.dateTime, value);
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }
}
