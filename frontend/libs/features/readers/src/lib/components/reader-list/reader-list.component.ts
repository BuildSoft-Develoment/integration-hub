import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ReaderManagerService, I18nService } from '@integration-hub/core/services';
import { ReaderProviderType } from '@integration-hub/core/providers';
import { IconComponent, ResourcePresentation } from '@integration-hub/shared/ui';
import { ReaderRecord } from '../../models/reader.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-reader-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule, IconComponent],
    templateUrl: './reader-list.component.html',
    styleUrl: './reader-list.component.css'
})
export class ReaderListComponent {
  readonly i18n = inject(I18nService);
  private readonly readerManager = inject(ReaderManagerService);

  presentation(type: ReaderProviderType): ResourcePresentation {
    return this.readerManager.presentation(type);
  }

  readonly readers = input.required<readonly ReaderRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedReaderId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectReader = output<ReaderRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
