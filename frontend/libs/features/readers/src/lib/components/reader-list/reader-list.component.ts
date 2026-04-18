import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { ReaderRecord } from '../../models/reader.models';

@Component({
  selector: 'ih-reader-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
    templateUrl: './reader-list.component.html',
    styleUrl: './reader-list.component.css'
})
export class ReaderListComponent {
  readonly i18n = inject(I18nService);

  readonly readers = input.required<readonly ReaderRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedReaderId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectReader = output<ReaderRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
