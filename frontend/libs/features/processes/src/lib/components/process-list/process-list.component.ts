import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { CatalogListColumn, CatalogListComponent, IconComponent } from '@integration-hub/shared/ui';
import { ProcessRecord } from '../../models/process.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-process-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, IconComponent, CatalogListComponent],
  templateUrl: './process-list.component.html',
  styleUrl: './process-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessListComponent {
  readonly i18n = inject(I18nService);

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'common.name', sortKey: 'name' },
    { labelKey: 'common.type', sortKey: 'mode' },
    { labelKey: 'common.status', sortKey: 'active' },
  ];

  readonly processes = input.required<readonly ProcessRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedProcessId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly selectProcess = output<ProcessRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
