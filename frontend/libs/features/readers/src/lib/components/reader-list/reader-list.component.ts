import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { ReaderManagerService, I18nService } from '@integration-hub/core/services';
import { ReaderProviderType } from '@integration-hub/core/providers';
import {
  CatalogListColumn,
  CatalogListComponent,
  IconComponent,
  ResourcePresentation,
} from '@integration-hub/shared/ui';
import { ReaderRecord } from '../../models/reader.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-reader-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, IconComponent, CatalogListComponent],
  templateUrl: './reader-list.component.html',
  styleUrl: './reader-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderListComponent {
  readonly i18n = inject(I18nService);
  private readonly readerManager = inject(ReaderManagerService);

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'common.name', sortKey: 'name' },
    { labelKey: 'common.type', sortKey: 'readerType' },
    { labelKey: 'common.status', sortKey: 'active' },
  ];

  presentation(type: ReaderProviderType): ResourcePresentation {
    return this.readerManager.presentation(type);
  }

  providerLabel(type: ReaderProviderType): string {
    const descriptor = this.readerManager.availableProviders().find((d) => d.type === type);
    if (!descriptor) {
      throw new Error(`No reader provider registered for type: ${type}`);
    }
    return descriptor.label;
  }

  readonly readers = input.required<readonly ReaderRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedReaderId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly selectReader = output<ReaderRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
