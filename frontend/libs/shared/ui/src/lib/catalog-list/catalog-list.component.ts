import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { LoadingComponent } from '@integration-hub/plugin-ui-kit';
import { EmptyStateComponent } from '@integration-hub/plugin-ui-kit';

/** A sortable column header of the catalog list. */
export interface CatalogListColumn {
  /** i18n key for the header label. */
  readonly labelKey: string;
  /** Sort key emitted on click; omit for a non-sortable column. */
  readonly sortKey?: string;
}

export type CatalogSortDirection = 'asc' | 'desc';

/**
 * Reusable, accessibility-first catalog list shell shared across feature catalogs.
 * Owns the sortable header, the loading / error / empty states, pagination and
 * roving-tabindex keyboard navigation; the rich per-row content is projected by the
 * feature (via {@code <ng-content>}), which keeps row rendering flexible while the shell
 * removes the duplicated header/state/keyboard boilerplate.
 *
 * Column widths are shared with the projected rows through the inherited CSS custom
 * property {@code --ih-catalog-columns} (set from {@link gridColumns}); the projected
 * rows use {@code grid-template-columns: var(--ih-catalog-columns)}.
 */
@Component({
  selector: 'ih-catalog-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatPaginatorModule,
    LoadingComponent,
    EmptyStateComponent,
  ],
  templateUrl: './catalog-list.component.html',
  styleUrl: './catalog-list.component.css',
})
export class CatalogListComponent {
  readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly columns = input.required<readonly CatalogListColumn[]>();
  /** CSS grid-template-columns value shared by the header and the projected rows. */
  readonly gridColumns = input<string>('1fr');
  readonly sortField = input<string | null>(null);
  readonly sortDirection = input<CatalogSortDirection>('asc');
  /** Number of currently rendered rows (drives empty state and keyboard bounds). */
  readonly rowCount = input.required<number>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyKey = input<string>('common.empty');
  readonly emptyIcon = input<string | null>(null);
  readonly total = input.required<number>();
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  /** Renders a leading select-all checkbox column in the header for bulk selection. */
  readonly selectable = input(false);
  readonly allSelected = input(false);
  readonly someSelected = input(false);

  readonly toggleSort = output<string>();
  readonly toggleSelectAll = output<void>();
  readonly pageChange = output<PageEvent>();
  readonly retry = output<void>();

  readonly focusedIndex = signal(0);

  ariaSort(sortKey: string): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== sortKey) {
      return 'none';
    }
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const count = this.rowCount();
    if (count === 0) {
      return;
    }
    let index = this.focusedIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      index = Math.min(index + 1, count - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      index = Math.max(index - 1, 0);
    } else {
      return;
    }
    this.focusedIndex.set(index);
    const row = this.host.nativeElement.querySelector(
      `[data-row-index="${index}"]`
    ) as HTMLElement | null;
    row?.focus();
  }
}
