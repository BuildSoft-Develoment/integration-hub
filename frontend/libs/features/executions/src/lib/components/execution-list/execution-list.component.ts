// @trace RF-001 (observabilidad: consultar ejecuciones por filtros)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import {
  CatalogListColumn,
  CatalogListComponent,
  IconComponent,
  RelativeTimePipe,
} from '@integration-hub/shared/ui';
import { formatTriggerSourceLabel } from '../../details/execution-detail.utils';
import { ProcessExecutionRecord } from '../../models/execution.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-execution-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, IconComponent, RelativeTimePipe, CatalogListComponent],
  templateUrl: './execution-list.component.html',
  styleUrl: './execution-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionListComponent {
  readonly i18n = inject(I18nService);

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'common.name', sortKey: 'name' },
    { labelKey: 'common.status', sortKey: 'status' },
    { labelKey: 'executions.finishedAt', sortKey: 'createdAt' },
  ];

  readonly executions = input.required<readonly ProcessExecutionRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedExecutionId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly selectExecution = output<ProcessExecutionRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  triggerLabel(status: string): string {
    return formatTriggerSourceLabel(status);
  }
}
