import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { SourceRecord } from '../../models/source.models';

@Component({
  selector: 'ih-source-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
    templateUrl: './source-list.component.html',
    styleUrl: './source-list.component.css'
})
export class SourceListComponent {
  readonly i18n = inject(I18nService);

  readonly sources = input.required<readonly SourceRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedSourceId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectSource = output<SourceRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
