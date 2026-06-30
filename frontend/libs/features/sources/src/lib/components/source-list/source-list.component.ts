import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SourceManagerService, I18nService } from '@integration-hub/core/services';
import { SourceProviderType } from '@integration-hub/core/providers';
import { IconComponent, LoadingComponent, ResourcePresentation } from '@integration-hub/shared/ui';
import { SourceRecord } from '../../models/source.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-source-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatPaginatorModule, IconComponent, LoadingComponent],
    templateUrl: './source-list.component.html',
    styleUrl: './source-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceListComponent {
  readonly i18n = inject(I18nService);
  private readonly sourceManager = inject(SourceManagerService);
  private readonly host = inject(ElementRef<HTMLElement>);

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
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly selectSource = output<SourceRecord>();
  readonly toggleSort = output<string>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  readonly focusedIndex = signal(0);

  itemsList(): readonly SourceRecord[] {
    return this.sources();
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
