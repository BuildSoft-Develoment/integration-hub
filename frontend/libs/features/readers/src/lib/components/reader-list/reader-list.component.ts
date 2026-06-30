import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ReaderManagerService, I18nService } from '@integration-hub/core/services';
import { ReaderProviderType } from '@integration-hub/core/providers';
import { IconComponent, LoadingComponent, ResourcePresentation } from '@integration-hub/shared/ui';
import { ReaderRecord } from '../../models/reader.models';

export type SortDir = 'asc' | 'desc';

@Component({
  selector: 'ih-reader-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatPaginatorModule, IconComponent, LoadingComponent],
    templateUrl: './reader-list.component.html',
    styleUrl: './reader-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderListComponent {
  readonly i18n = inject(I18nService);
  private readonly readerManager = inject(ReaderManagerService);
  private readonly host = inject(ElementRef<HTMLElement>);

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

  readonly focusedIndex = signal(0);

  itemsList(): readonly ReaderRecord[] {
    return this.readers();
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
