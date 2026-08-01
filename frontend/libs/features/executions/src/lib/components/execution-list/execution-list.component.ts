// @trace spec 004-observabilidad-y-auditoria RF-001 (observabilidad: consultar ejecuciones por filtros)
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
    { labelKey: 'executions.timing', sortKey: 'createdAt' },
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

  /** Tono del estado, misma convencion que el detalle (summary-pill): success/warning/info/danger/neutral. */
  statusTone(status: string): 'success' | 'warning' | 'info' | 'danger' | 'neutral' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'COMPLETED_WITH_ERRORS':
        return 'warning';
      case 'RUNNING':
        return 'info';
      default:
        return 'neutral';
    }
  }

  triggerLabel(status: string): string {
    return formatTriggerSourceLabel(status);
  }

  /** Sin fin y con inicio = todavia corriendo. */
  isRunning(execution: ProcessExecutionRecord): boolean {
    return !!execution.startedAt && !execution.finishedAt;
  }

  /**
   * Cuanto demoro la corrida = fin - inicio. Si sigue corriendo, se mide contra el ahora (snapshot; se refresca
   * al recargar la lista). El backend no expone `duration`: no hace falta, se computa aca. Devuelve '' si no hay
   * inicio o los timestamps no parsean.
   */
  duration(execution: ProcessExecutionRecord): string {
    if (!execution.startedAt) {
      return '';
    }
    const start = Date.parse(execution.startedAt);
    const end = execution.finishedAt ? Date.parse(execution.finishedAt) : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return '';
    }
    return this.formatDuration(end - start);
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}
