import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SourceManagerService, I18nService } from '@integration-hub/core/services';
import { SourceProviderType } from '@integration-hub/core/providers';
import { IconComponent, ResourcePresentation } from '@integration-hub/shared/ui';
import { SourceRecord } from '../../models/source.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-source-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule, IconComponent],
    templateUrl: './source-list.component.html',
    styleUrl: './source-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceListComponent {
  readonly i18n = inject(I18nService);
  private readonly sourceManager = inject(SourceManagerService);

  presentation(type: SourceProviderType): ResourcePresentation {
    return this.sourceManager.presentation(type);
  }

  providerLabel(type: SourceProviderType): string {
    const descriptor = this.sourceManager.availableProviders().find((d) => d.type === type);
    if (!descriptor) {
      throw new Error(`No source provider registered for type: ${type}`);
    }
    return descriptor.label;
  }

  readonly sources = input.required<readonly SourceRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedSourceId = input<number | null>(null);
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<SortDir>('asc');
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectSource = output<SourceRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
