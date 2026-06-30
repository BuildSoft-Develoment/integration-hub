// @trace RF-001 (observabilidad: consultar ejecuciones por filtros)
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent, LoadingComponent, RelativeTimePipe } from '@integration-hub/shared/ui';
import { formatTriggerSourceLabel } from '../../details/execution-detail.utils';
import { ProcessExecutionRecord } from '../../models/execution.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-execution-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatPaginatorModule, IconComponent, LoadingComponent, RelativeTimePipe],
    templateUrl: './execution-list.component.html',
    styleUrl: './execution-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionListComponent {
  readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);
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

  readonly focusedIndex = signal(0);

  itemsList(): readonly ProcessExecutionRecord[] {
    return this.executions();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const items = this.itemsList();
    if (items.length === 0) { return; }
    let idx = this.focusedIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      idx = Math.max(idx - 1, 0);
    } else {
      return;
    }
    this.focusedIndex.set(idx);
    const row = this.host.nativeElement.querySelector(`[data-row-index="${idx}"]`) as HTMLElement | null;
    row?.focus();
  }

}
