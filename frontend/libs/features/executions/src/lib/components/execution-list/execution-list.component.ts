import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { formatExecutionDate, formatTriggerSourceLabel } from '../../details/execution-detail.utils';
import { ProcessExecutionRecord } from '../../models/execution.models';

@Component({
  selector: 'ih-execution-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
  styles: [`
      :host { display:block; min-height:0; height:100%; }
      .row-status { font-size: 0.86rem; color: var(--ih-text-soft); }
      .row-dates { display:grid; gap:0.18rem; }
      .row-dates small, .row-linkage { color: var(--ih-text-soft); }
    `],
    templateUrl: './execution-list.component.html'
})
export class ExecutionListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);
  readonly executions = input.required<readonly ProcessExecutionRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedExecutionId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly selectExecution = output<ProcessExecutionRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  triggerLabel(status: string): string {
    return formatTriggerSourceLabel(status);
  }

  formatDate(value: string | null): string {
    return formatExecutionDate(this.dateTime, value);
  }
}
