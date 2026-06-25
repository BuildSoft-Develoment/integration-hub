import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { ProcessRecord } from '../../models/process.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-process-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule, IconComponent],
    templateUrl: './process-list.component.html',
    styleUrl: './process-list.component.css'
})
export class ProcessListComponent {
  readonly i18n = inject(I18nService);

  readonly processes = input.required<readonly ProcessRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedProcessId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectProcess = output<ProcessRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
