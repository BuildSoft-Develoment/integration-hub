import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { ProcessRecord } from '../../process.models';

@Component({
  selector: 'ih-process-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
    templateUrl: './process-list.component.html',
    styleUrl: './process-list.component.css'
})
export class ProcessListComponent {
  readonly i18n = inject(I18nService);

  readonly processes = input.required<readonly ProcessRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedProcessId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectProcess = output<ProcessRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
